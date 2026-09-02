// Kopplar en MANUELLT lagd AliExpress-order till en fulfillment-task.
//
// VARFÖR DEN FINNS SOM EGEN MODUL. Kopplingen bodde i server-actionen på
// /admin (garderobs-incidenten 2026-08-06: konsumentkassan med kampanj+kupong
// var billigare än DS-API:t, så Leonard beställde för hand och klistrade in
// ordernumret). Det räcker när han sitter vid adminvyn. Order 10025
// (2026-09-01) visade det andra fallet: ordern lagd för hand, skickad från
// Polen, kunden väntade på sitt mejl — och tasken stod kvar på `pending`
// eftersom ingen hunnit klistra in numret. Motorn kan inte hämta spårning för
// en order den inte vet finns.
//
// Samma logik nås nu från två håll — adminvyn och en CRON_SECRET-autentiserad
// rutt (så kopplingen går att göra från en GitHub-workflow, från en telefon,
// utan admin-inloggning). EN definition, av samma skäl som SHIP_AXIS_RE och
// EU_TULL_CODES: tvillingar glider isär.
//
// Efter kopplingen är ordern exakt lika automatisk som en API-order:
// poll-tracking hämtar spårningsnumret → Wix-fulfillment → butikens
// "Ditt paket är skickat!"-mejl + 17TRACK-registrering.

import type { Store } from "@/lib/store";
import type { FulfillmentTask } from "@/lib/orders/types";
import { assertTransition } from "./status";
import { normalizeAeOrderId } from "./price-check";
import { väljEnTask } from "./valj-task";
import { getTracking } from "@/lib/aliexpress/client";

export type LinkInput = {
  /** `${orderId}:${lineItemId}`. Vinner över orderNumber när båda ges. */
  taskId?: string;
  /** Butikens läsbara ordernummer, t.ex. "10025". */
  orderNumber?: string;
  /** "Ref. Number" ur AliExpress orderlista. Bara siffror. */
  aeOrderId: string;
  /** Vem som kopplade — hamnar i audit-raden. */
  source: string;
};

export type LinkResult =
  | {
      ok: true;
      taskId: string;
      orderNumber: string;
      aeOrderId: string;
      /** Vad spårnings-API:t sa om ordern i kopplingsögonblicket. */
      probe: string;
      message: string;
    }
  | {
      ok: false;
      error: string;
      /** När orderNumber matchar flera kopplingsbara rader: deras taskId. */
      candidates?: Array<{ taskId: string; productName: string; status: string }>;
    };

type Deps = {
  getTracking: typeof getTracking;
};

/**
 * Väljer EN task att koppla. Regeln — ett ordernummer som pekar på flera
 * rader får aldrig gissas bort — bor i väljEnTask och delas med den manuella
 * skeppningen. Det som är AE-specifikt är bara predikatet: en rad som redan
 * bär ett AE-ordernummer är inte kopplingsbar.
 */
export function väljTask(
  tasks: FulfillmentTask[],
  input: Pick<LinkInput, "taskId" | "orderNumber">,
): { task: FulfillmentTask } | { error: string; candidates?: LinkResultCandidates } {
  return väljEnTask(tasks, input, {
    valbar: (t) => !t.aliexpressOrderId && t.status !== "shipped" && t.status !== "cancelled",
    verb: "koppla",
    lage: (t) => `${t.taskId}: ${t.status}${t.aliexpressOrderId ? ` (AE ${t.aliexpressOrderId})` : ""}`,
  });
}

type LinkResultCandidates = NonNullable<Extract<LinkResult, { ok: false }>["candidates"]>;

export async function linkAliExpressOrder(
  store: Store,
  input: LinkInput,
  deps: Deps = { getTracking },
): Promise<LinkResult> {
  const aeOrderId = normalizeAeOrderId(input.aeOrderId);
  if (!aeOrderId) {
    return {
      ok: false,
      error: 'Det ser inte ut som ett AliExpress-ordernummer — kopiera "Ref. Number" ur din orderlista (bara siffror).',
    };
  }

  const val = väljTask(await store.listTasks(), input);
  if ("error" in val) return { ok: false, error: val.error, candidates: val.candidates };
  const { task } = val;

  if (task.aliexpressOrderId) {
    return { ok: false, error: `${task.taskId} är redan kopplad till AE-order ${task.aliexpressOrderId}.` };
  }
  // Redan "ordered" utan ordernummer (t.ex. manuellt markerad som lagd) är ett
  // GILTIGT kopplingsläge — det är id:t som saknas, inte statusen. Audit
  // 2026-08-06: assertTransition(ordered→ordered) skulle annars vägra exakt
  // det fall fältet finns för. Övriga statusar måste kunna GÅ till ordered.
  if (task.status !== "ordered") {
    try {
      assertTransition(task.status, "ordered");
    } catch {
      return { ok: false, error: `${task.taskId} har status "${task.status}" och kan inte kopplas.` };
    }
  }

  // Probe FÖRE skrivning — men utfallet påverkar bara beskedet, inte
  // kopplingen. DS-spårnings-API:t är byggt för API-lagda ordrar; om det
  // svarar för konsumentordrar på samma konto är odokumenterat. Kopplingen
  // görs ändå: fallbacken är dagens rutin (klistra spårning i Wix för hand)
  // och den blir aldrig sämre av ett sparat ordernummer.
  let probe: string;
  try {
    const t = await deps.getTracking(aeOrderId);
    probe = t.trackingNumber
      ? `AliExpress ser ordern (spårning ${t.trackingNumber} finns redan) — allt sköts automatiskt härifrån.`
      : `AliExpress ser ordern${t.status ? ` (status: ${t.status})` : ""} — spårningen hämtas automatiskt när säljaren skickar.`;
  } catch {
    probe =
      "OBS: spårnings-API:t svarade inte för ordern ännu (vanligt för nyss lagda/manuella ordrar). "
      + "Kopplingen är gjord — dyker spårningen inte upp av sig själv inom ett dygn, klistra in den i Wix som vanligt.";
  }

  // Id + status i EN skrivning — ett delskrivet läge "id utan ordered" skulle
  // varken pollas eller gå att lägga om, och syns inte i någon vy.
  await store.updateTask(task.taskId, { aliexpressOrderId: aeOrderId, status: "ordered" });

  // ☠️ Räkna efter, lita inte på svaret. updateTask är en tyst no-op på en
  // saknad rad i alla tre backends, och ett OK som inte skrivit något är exakt
  // den klass av fel som gjorde att prissynken "uppdaterade" i en månad.
  const efter = (await store.listTasks()).find((t) => t.taskId === task.taskId);
  if (!efter || efter.aliexpressOrderId !== aeOrderId || efter.status !== "ordered") {
    return {
      ok: false,
      error:
        `Skrivningen gick igenom men läste inte tillbaka som förväntat för ${task.taskId} `
        + `(status=${efter?.status ?? "saknas"}, aliexpressOrderId=${efter?.aliexpressOrderId ?? "saknas"}).`,
    };
  }

  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "ae-order-linked",
    ref: task.taskId,
    detail: JSON.stringify({ orderId: aeOrderId, probe: probe.slice(0, 120), source: input.source }),
  });

  return {
    ok: true,
    taskId: task.taskId,
    orderNumber: task.orderNumber,
    aeOrderId,
    probe,
    message: `✓ Kopplad till AE-order ${aeOrderId}. ${probe}`,
  };
}
