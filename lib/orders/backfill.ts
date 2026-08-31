// Orderåterhämtning: skapar de fulfillment-tasks webhooken tappade.
//
// ☠️ VARFÖR DEN BEHÖVS. `/api/wix-order` är ENDA vägen in i orderpipelinen —
// `/admin` läser bara `store.listTasks()` och tittar aldrig på Wix-ordrar. Går
// den skrivningen fel är ordern borta för oss medan kunden har betalat, och
// Wix ger upp efter ett fåtal retries. Ingen andra chans, inget spår i admin.
//
// Det är inte teoretiskt. Order 10024 (betald 2026-08-31 09:27) föll så: Wix
// Datas radtak var nått, `createTaskIfAbsent` kastade `WDE0195`, webhooken
// svarade 500 tre gånger och gav upp. Samma tak sänkte samtidigt varje
// audit-skrivning i ett dygn utan att någon märkte det.
//
// Vakten SÅG problemet hela tiden — `buildGuardFindings.missingTasks` räknar
// precis de här ordrarna — men den rapporterade dem bara i morgonmejlet, en
// gång per dygn. Upptäckt utan åtgärd är halva jobbet; det här är andra halvan.
//
// Konstruktionen är medvetet trist: den läser Wix-ordrar, jämför mot tasks och
// skapar det som saknas via SAMMA `deriveTasks` som webhooken. Ingen egen
// tolkning av orderformen — en tvilling här hade glidit isär från webhooken
// vid första ändringen, precis som SHIP_AXIS_RE och EU_TULL_CODES gjorde.
//
// Idempotent i båda ändar: `createTaskIfAbsent` skriver aldrig över en
// befintlig task, så en omkörning är gratis och en order som redan hämtats
// hem rörs inte. Därför är det ofarligt att köra ofta.

import type { WixOrder } from "@/lib/orders/types";
import type { FulfillmentTask } from "@/lib/orders/types";
import { deriveTasks } from "@/lib/orders/tasks";
import { ACTIONABLE_PAYMENT, TASK_GRACE_MS } from "@/lib/orders/guard";

/** Hur långt bak i tiden vi letar. Rymligt: en tappad order är värd att hitta
 *  även en vecka senare, och jämförelsen mot befintliga tasks är gratis. */
export const DEFAULT_LOOKBACK_DAYS = 14;

export interface OrderBackfillOptions {
  /** Torrkörning: rapportera vad som SKULLE skapas, skriv ingenting. */
  dryRun?: boolean;
  lookbackDays?: number;
  /** Bara dessa ordernummer. För riktad återhämtning av en känd order. */
  onlyOrderNumbers?: string[];
}

/**
 * En betald order vi INTE lyckades skapa task för.
 *
 * ☠️ Finns för att larmet ska kunna skickas UTAN Wix Data. Det vanligaste
 * skälet till att skrivningen faller är att CMS:et är fullt (`WDE0195`), och
 * då är varje spår vi normalt litar på också blockerat: audit-raden, vaktens
 * fynd, admin-listan. Mejlet är den enda kanalen som fortfarande fungerar,
 * så det måste bära allt som behövs för att expediera ordern för hand.
 */
export interface StuckOrder {
  /** Ordernumret kunden ser, t.ex. "10024". */
  number: string;
  /** Varför skrivningen inte gick igenom — ordagrant, inte omskrivet. */
  reason: string;
  customer?: string;
  items: { name: string; sku?: string; quantity: number }[];
}

export interface OrderBackfillSummary {
  dryRun: boolean;
  /** Ordrar som lästes från Wix inom fönstret. */
  scanned: number;
  /** Betalda ordrar utan task, äldre än webhookens respit. */
  missing: number;
  /** Tasks som faktiskt skrevs. */
  created: number;
  /** Ordrar där skrivningen kastade. */
  failed: number;
  /** Ordernummer som återhämtades — så mejlet/loggen kan namnge dem. */
  recovered: string[];
  /** Detaljerna bakom `failed`, för larmmejlet. En rad per tappad order. */
  stuck: StuckOrder[];
  errors: { order: string; error: string }[];
}

export interface OrderBackfillDeps {
  listOrders: (sinceIso: string) => Promise<WixOrder[]>;
  listTasks: () => Promise<FulfillmentTask[]>;
  createTaskIfAbsent: (task: FulfillmentTask) => Promise<boolean>;
  now?: () => number;
}

/**
 * Letar upp betalda Wix-ordrar utan fulfillment-task och skapar dem.
 *
 * Urvalet är MEDVETET identiskt med `buildGuardFindings.missingTasks`: samma
 * betalstatusar, samma respit. Vakten och återhämtningen ska aldrig kunna bli
 * oense om vad "tappad order" betyder — därför importeras båda villkoren i
 * stället för att skrivas av.
 */
export async function runOrderBackfill(
  opts: OrderBackfillOptions,
  deps: OrderBackfillDeps,
): Promise<OrderBackfillSummary> {
  const dryRun = opts.dryRun === true;
  const now = deps.now ?? (() => Date.now());
  const nowMs = now();
  const lookbackDays = opts.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const sinceIso = new Date(nowMs - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  const s: OrderBackfillSummary = {
    dryRun,
    scanned: 0,
    missing: 0,
    created: 0,
    failed: 0,
    recovered: [],
    stuck: [],
    errors: [],
  };

  const orders = await deps.listOrders(sinceIso);
  s.scanned = orders.length;
  if (orders.length === 0) return s;

  const tasks = await deps.listTasks();
  const orderIdsWithTasks = new Set(tasks.map((t) => t.orderId));

  for (const order of orders) {
    if (!order?.id) continue;
    if (opts.onlyOrderNumbers?.length) {
      if (!opts.onlyOrderNumbers.includes(order.number ?? "")) continue;
    }
    if (!ACTIONABLE_PAYMENT.has(order.paymentStatus ?? "")) continue;
    if (orderIdsWithTasks.has(order.id)) continue;

    // Respiten skyddar mot att vi tävlar med webhooken om en helt färsk order.
    // Utan den kan båda skriva samma task samtidigt; `createTaskIfAbsent` gör
    // det ofarligt, men vi vill inte rapportera "återhämtad" om webhooken bara
    // var en sekund efter oss.
    const created = Date.parse(order.createdDate ?? order._createdDate ?? "");
    if (!Number.isFinite(created) || nowMs - created < TASK_GRACE_MS) continue;

    s.missing++;
    const label = order.number || order.id;

    // Samma härledning som webhooken. `eventId`/`slug` är tomma med flit —
    // deriveTasks läser dem inte, och att hitta på ett event-id hade smutsat
    // ner idempotensspärren i FyndplatsWebhookEvents.
    const derived = deriveTasks({ eventId: "", slug: "", orderId: order.id, order }).map((t) => ({
      ...t,
      // ☠️ deriveTasks stämplar `createdAt` med NU, vilket är rätt när
      // webhooken kör i realtid och fel här: en order från i förrgår hade
      // fått åldern noll, och vaktens påminnelser (PENDING_REMINDER_MS m.fl.)
      // hade börjat om från början. Vi bär ordens FAKTISKA tid i stället, så
      // en återhämtad order genast ser lika sen ut som den är.
      createdAt: new Date(created).toISOString(),
    }));

    // En order utan rader ger inga tasks. Utan den här grenen räknas den som
    // `missing` vid varje körning i all evighet, utan att någonsin bli
    // `created` — en lucka som ser ut som ett växande problem men aldrig går
    // att åtgärda. Bättre att den syns EN gång som ett fel med sitt nummer.
    if (derived.length === 0) {
      const reason = "ordern har inga orderrader — inget att skapa";
      s.failed++;
      s.errors.push({ order: label, error: reason });
      s.stuck.push({ number: label, reason, customer: order.buyerInfo?.email, items: [] });
      continue;
    }

    if (dryRun) {
      s.recovered.push(label);
      continue;
    }

    // Skrivningarna räknas EN i taget så att en order som faller halvvägs
    // rapporterar exakt de rader som saknas — inte hela ordern. Ett mejl som
    // listar rader Leonard redan har i /admin gör att han beställer dubbelt.
    const oskrivna = [...derived];
    try {
      let any = false;
      for (const task of derived) {
        const skapad = await deps.createTaskIfAbsent(task);
        oskrivna.splice(oskrivna.indexOf(task), 1);
        if (skapad) {
          s.created++;
          any = true;
        }
      }
      if (any) s.recovered.push(label);
    } catch (err) {
      // En trasig order får inte fälla resten — nästa kan vara den som
      // faktiskt går att rädda. Felet syns i svaret och i larmmejlet.
      const reason = err instanceof Error ? err.message.slice(0, 200) : String(err);
      s.failed++;
      s.errors.push({ order: label, error: reason });
      s.stuck.push({
        number: label,
        reason,
        // Namnet kommer från `derived`, inte ur ordern igen: `deriveTasks`
        // äger redan uppslaget (Wix levererar kontakten på BÅDE
        // `contactDetails` och `contact`, och gatan i tre former). En egen
        // avläsning här hade blivit en tvilling som glider isär.
        customer: derived[0]?.shippingAddress?.fullName ?? order.buyerInfo?.email,
        // Raderna kommer från `derived`, inte från en egen tolkning av ordern:
        // det är EXAKT vad webhooken hade skapat. Bara de som INTE hann
        // skrivas tas med.
        items: oskrivna.map((t) => ({ name: t.productName, sku: t.sku, quantity: t.quantity })),
      });
    }
  }

  return s;
}
