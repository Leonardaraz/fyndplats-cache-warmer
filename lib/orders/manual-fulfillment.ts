// Manuell orderläggning och skeppning — för leverantörer utan API.
//
// VARFÖR DEN FINNS. AliExpress har ett DS-API: place-order lägger ordern,
// poll-tracking hämtar spårningen var 15:e minut, Wix-fulfillment skapas, och
// kunden får sitt "Ditt paket är skickat!"-mejl utan att någon rör något.
// Aosom har inget sådant API. `place-order.ts` VÄGRAR en Aosom-mappning med
// flit (isAliExpressMapping) och ordern läggs i klump på aosom.de/bulkordering
// eller för hand i deras kassa.
//
// Följden var en tyst lucka i motorn. Order 10026 (2026-09-02, Vinsetto-
// kontorsstolen 921-471LG) betalades 14:57 och lades för hand hos Aosom —
// men ingenting i systemet kunde få veta det. Tasken låg kvar som `pending`,
// vakten hade börjat påminna om en order som redan var lagd, och när Aosom
// skickar paketet finns ingen väg alls att få ut spårningen till kunden:
// poll-tracking läser bara AliExpress.
//
// Modulen stänger båda halvorna:
//
//   markOrderedManually → tasken blir `ordered` (vakten slutar påminna, och
//                         5-dygnsklockan mot "beställd men inget spår" startar)
//   shipManually        → Wix-fulfillment med spårningsnumret → butikens mejl
//                         + 17TRACK, och tasken blir `shipped`
//
// ☠️ LEVERANTÖRSNEUTRAL MED FLIT. Referensen sparas i `supplierOrderRef`, inte
// i `aliexpressOrderId`. Att stoppa ett Aosom-ordernummer i ett AE-fält är
// exakt felet som `AliExpressProductId`-typen infördes för att göra omöjligt:
// fältet läses av prisvakten, lagersynken och cancel-task som ett AE-id.

import type { Store } from "@/lib/store";
import type { FulfillmentTask } from "@/lib/orders/types";
import { canTransition } from "./status";
import { väljEnTask, type Kandidat, type TaskVal } from "./valj-task";
import { createFulfillment } from "@/lib/wix/client";
import { sparningsLank } from "@/lib/tracking-link";

export interface ManuellInput extends TaskVal {
  /** Vem som gjorde det — hamnar i audit-raden. */
  source: string;
}

export interface OrderladInput extends ManuellInput {
  /** Leverantörens egen orderreferens, om den finns. Frivillig: Aosoms
   *  bulkuppladdning ger inget nummer förrän bekräftelsen kommer. */
  supplierOrderRef?: string;
}

export interface SkeppaInput extends ManuellInput {
  /** Spårningsnumret ur leverantörens avsändningsmejl. */
  trackingNumber: string;
  /** Fraktbolag, om det framgår. Wix visar det i leveransbekräftelsen. */
  carrier?: string;
}

export type ManuellResultat =
  | { ok: true; taskId: string; orderNumber: string; productName: string; message: string }
  | { ok: false; error: string; candidates?: Kandidat[] };

/** Flaggad för manuell granskning — får aldrig avanceras automatiskt. */
function flaggad(t: FulfillmentTask): string | null {
  const skal = [
    t.cancelMidOrder ? "avbeställd mitt i orderläggning" : null,
    t.refundFlagged ? "återbetalning registrerad" : null,
    t.orderUncertain ? "orderutfall okänt" : null,
  ].filter(Boolean);
  return skal.length ? skal.join(", ") : null;
}

/**
 * Markerar en task som beställd hos en leverantör utan API.
 *
 * Vakten slutar påminna (`placeOrderReminders` tittar på status === "pending")
 * och 5-dygnsklockan mot "beställd men inget spårningsnummer" börjar ticka —
 * vilket är precis rätt beteende för en Aosom-order, där plocket tar 1–4
 * arbetsdagar enligt deras B2B-guide.
 */
export async function markOrderedManually(
  store: Store,
  input: OrderladInput,
): Promise<ManuellResultat> {
  const val = väljEnTask(await store.listTasks(), input, {
    valbar: (t) => t.status !== "shipped" && t.status !== "cancelled",
    verb: "markera som beställd",
  });
  if ("error" in val) return { ok: false, error: val.error, candidates: val.candidates };
  const { task } = val;

  const flagga = flaggad(task);
  if (flagga) {
    return { ok: false, error: `${task.taskId} är flaggad för manuell granskning (${flagga}) — hantera den i /admin först.` };
  }
  if (task.claimToken) {
    return { ok: false, error: `${task.taskId} håller på att beställas av motorn just nu (claim satt) — vänta ut den.` };
  }
  if (task.status === "shipped" || task.status === "cancelled") {
    return { ok: false, error: `${task.taskId} har status "${task.status}" och kan inte markeras som beställd.` };
  }
  if (task.status !== "ordered" && !canTransition(task.status, "ordered")) {
    return { ok: false, error: `${task.taskId} har status "${task.status}" och kan inte gå till "ordered".` };
  }

  const ref = (input.supplierOrderRef ?? "").trim();
  await store.updateTask(task.taskId, {
    status: "ordered",
    ...(ref ? { supplierOrderRef: ref } : {}),
  });

  // ☠️ Räkna efter. updateTask är en tyst no-op på en saknad rad i alla tre
  // backends — ett OK som inte skrivit något är samma klass av fel som lät
  // prissynken "uppdatera" priser i en månad utan att röra butiken.
  const efter = (await store.listTasks()).find((t) => t.taskId === task.taskId);
  if (!efter || efter.status !== "ordered" || (ref && efter.supplierOrderRef !== ref)) {
    return {
      ok: false,
      error:
        `Skrivningen svarade OK men läste inte tillbaka som förväntat för ${task.taskId} `
        + `(status=${efter?.status ?? "saknas"}, supplierOrderRef=${efter?.supplierOrderRef ?? "saknas"}).`,
    };
  }

  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "manual-order-placed",
    ref: task.taskId,
    detail: JSON.stringify({ supplierOrderRef: ref || null, source: input.source }),
  });

  return {
    ok: true,
    taskId: task.taskId,
    orderNumber: task.orderNumber,
    productName: task.productName,
    message:
      `✓ ${task.taskId} markerad som beställd${ref ? ` (referens ${ref})` : ""}. `
      + "Vakten slutar påminna. Kör läget 'skeppa' när leverantören mejlat spårningsnumret.",
  };
}

type SkeppaDeps = { createFulfillment: typeof createFulfillment };

/**
 * Skeppar en task med ett spårningsnummer som kommit per mejl.
 *
 * Ordningen är Wix FÖRST, tasken sedan — samma skäl som "Wix skrivs före
 * mappningen" i price-repair. Går bara den ena igenom har kunden fått sitt
 * mejl och sin spårning medan våra böcker släpar, och det är det billiga
 * felet. Omvänt hade tasken stått som `shipped` utan att någon fulfillment
 * fanns, och kunden hade aldrig fått veta att paketet var på väg.
 */
export async function shipManually(
  store: Store,
  input: SkeppaInput,
  deps: SkeppaDeps = { createFulfillment },
): Promise<ManuellResultat> {
  const spar = (input.trackingNumber ?? "").trim();
  if (spar.length < 6) {
    return { ok: false, error: "trackingNumber ser för kort ut — klistra in numret ur leverantörens avsändningsmejl." };
  }

  const val = väljEnTask(await store.listTasks(), input, {
    valbar: (t) => t.status !== "shipped" && t.status !== "cancelled",
    verb: "skeppa",
    lage: (t) => `${t.taskId}: ${t.status}${t.trackingNumber ? ` (spårning ${t.trackingNumber})` : ""}`,
  });
  if ("error" in val) return { ok: false, error: val.error, candidates: val.candidates };
  const { task } = val;

  // ☠️ F19-BACKSTOPPEN GÄLLER ÄVEN HÄR. poll-tracking vägrar auto-skeppa en
  // flaggad task; en manuell väg som hoppar över samma grind vore hålet i
  // nätet. Skeppningen är den oåterkalleliga handlingen — mejlet till kunden
  // går inte att ta tillbaka.
  const flagga = flaggad(task);
  if (flagga) {
    return { ok: false, error: `${task.taskId} är flaggad för manuell granskning (${flagga}) — skeppas inte. Hantera den i /admin först.` };
  }
  if (task.claimToken) {
    return { ok: false, error: `${task.taskId} håller på att beställas av motorn just nu (claim satt) — vänta ut den.` };
  }
  if (task.status === "shipped") {
    return { ok: false, error: `${task.taskId} är redan skeppad${task.trackingNumber ? ` med spårning ${task.trackingNumber}` : ""} — en andra fulfillment hade gett kunden ett andra mejl.` };
  }
  if (task.status === "cancelled") {
    return { ok: false, error: `${task.taskId} är avbruten och kan inte skeppas.` };
  }

  // En task som fortfarande står som `pending` när paketet redan är på väg är
  // ett bokföringsläge, inte ett hinder: har vi ett spårningsnummer ÄR ordern
  // lagd. Vi går därför pending → ordered → shipped, men via statusmaskinen —
  // varje steg måste vara tillåtet, ingen genväg förbi den.
  const vag: FulfillmentTask["status"][] = task.status === "ordered" ? ["shipped"] : ["ordered", "shipped"];
  let fran: FulfillmentTask["status"] = task.status;
  for (const till of vag) {
    if (!canTransition(fran, till)) {
      return { ok: false, error: `${task.taskId} kan inte gå ${fran} → ${till}.` };
    }
    fran = till;
  }

  // Spårlänken sätts ALLTID av oss. Wix genererar en egen bara för fraktbolag
  // den känner igen, och gör den inte det blir det ingen länk alls i
  // leveransbekräftelsen (samma skäl som i poll-tracking).
  await deps.createFulfillment({
    orderId: task.orderId,
    lineItems: [{ id: task.lineItemId, quantity: task.quantity }],
    trackingNumber: spar,
    ...(input.carrier ? { shippingProvider: input.carrier } : {}),
    trackingLink: sparningsLank(spar),
  });

  await store.updateTask(task.taskId, { status: "shipped", trackingNumber: spar });

  const efter = (await store.listTasks()).find((t) => t.taskId === task.taskId);
  if (!efter || efter.status !== "shipped" || efter.trackingNumber !== spar) {
    return {
      ok: false,
      error:
        `Wix-fulfillment SKAPADES (kunden har fått sitt mejl) men tasken läste inte tillbaka som skeppad — `
        + `${task.taskId} står som status=${efter?.status ?? "saknas"}, trackingNumber=${efter?.trackingNumber ?? "saknas"}. `
        + "Rätta statusen för hand; skeppa INTE om, det ger ett andra mejl.",
    };
  }

  // Samma audit-kind som poll-tracking använder, så befintliga vyer och
  // grep:ar ser en manuell skeppning utan att behöva lära sig ett nytt ord.
  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "wix-fulfillment-created",
    ref: task.taskId,
    detail: JSON.stringify({
      orderId: task.orderId,
      trackingNumber: spar,
      manuell: true,
      supplierOrderRef: task.supplierOrderRef ?? null,
      source: input.source,
    }),
  });

  return {
    ok: true,
    taskId: task.taskId,
    orderNumber: task.orderNumber,
    productName: task.productName,
    message: `✓ Order ${task.orderNumber} skeppad med spårning ${spar}. Kunden har fått "Ditt paket är skickat!".`,
  };
}
