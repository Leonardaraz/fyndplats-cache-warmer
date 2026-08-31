// Ordervakten ("morgonkollen") — ren beslutslogik för /api/cron/order-guard.
//
// Problemet vakten löser: varje steg i orderkedjan kan fastna TYST. Webhooken
// kan missa en order (ingen task skapas), Leonard kan missa att lägga/betala
// en AliExpress-order, säljaren kan strunta i att skicka, och poll-tracking-
// fel syns bara i FyndplatsAudit som ingen läser. Vakten samlar allt sådant
// till ETT morgonmejl — och skickar även när allt är grönt, så att uteblivet
// mejl i sig är en signal om att cronen dött.
//
// Ren modul utan I/O: routen matar in ordrar/tasks/audit-rader och får
// tillbaka fynd + färdigt mejl. Trösklarna är exporterade så testerna kan
// låsa dem.

import type { FulfillmentTask } from "@/lib/orders/types";
import type { SyncLogEntry } from "@/lib/sync/sync-log";
import { isTerminal } from "@/lib/orders/status";

const HOUR = 60 * 60 * 1000;

/** Webhooken får 2 h på sig att skapa tasks innan en order räknas som tappad
 *  (Wix gör retries i upp till någon timme vid 5xx från mottagaren). */
export const TASK_GRACE_MS = 2 * HOUR;
/** En obeställd task äldre än ett dygn ⇒ påminn Leonard att lägga ordern. */
export const PENDING_REMINDER_MS = 24 * HOUR;
/** En olagd betalning äldre än 6 h ⇒ påminn — AliExpress annullerar obetalda
 *  ordrar efter ~24 h, så här får inte gå dagar. */
export const PENDING_PAYMENT_REMINDER_MS = 6 * HOUR;
/** Beställd hos AliExpress men inget spårningsnummer på 5 dagar ⇒ säljaren
 *  är sen (normalt åtagande är 3–7 dagar) — värt att titta på. */
export const AWAITING_SHIPMENT_MS = 5 * 24 * HOUR;
/** Poll-tracking-fel räknas inom det senaste dygnet (vakten kör dagligen). */
export const POLL_ERROR_WINDOW_MS = 24 * HOUR;

/** Betalstatusar där kunden faktiskt betalat och en leverans förväntas.
 *  FULLY_REFUNDED/NOT_PAID/PENDING ger ingen fulfillment-plikt. */
export const ACTIONABLE_PAYMENT = new Set(["PAID", "PARTIALLY_PAID", "PARTIALLY_REFUNDED"]);

/** Minimal orderbild — mappas från lib/wix/orders.fetchOrders i routen. */
export interface GuardOrderInput {
  id: string;
  number?: string;
  createdAt?: string;
  paymentStatus?: string;
}

/** Minimal audit-rad (matchar lib/store AuditEntry). */
export interface GuardAuditInput {
  at: string;
  kind: string;
  ref?: string;
  detail?: string;
}

export interface PollErrorGroup {
  ref: string;
  count: number;
  lastAt: string;
  lastDetail: string;
}

export interface GuardFindings {
  /** Betalda ordrar helt utan fulfillment-task — webhooken har tappat dem. */
  missingTasks: GuardOrderInput[];
  /** pending äldre än PENDING_REMINDER_MS — dags att lägga AliExpress-ordern. */
  placeOrderReminders: FulfillmentTask[];
  /** pending_payment äldre än PENDING_PAYMENT_REMINDER_MS — dags att betala. */
  payReminders: FulfillmentTask[];
  /** ordered utan spårningsnummer äldre än AWAITING_SHIPMENT_MS. */
  awaitingShipment: FulfillmentTask[];
  /** Flaggade för manuell granskning (cancelMidOrder/refundFlagged/orderUncertain). */
  heldForReview: FulfillmentTask[];
  /** poll-tracking-error-rader senaste dygnet, grupperade per task. */
  pollErrors: PollErrorGroup[];
  /** Antal saker som kräver Leonards handling (styr ✅/⚠️ i mejlet). */
  actionCount: number;
}

export function buildGuardFindings(input: {
  orders: GuardOrderInput[];
  tasks: FulfillmentTask[];
  auditEntries: GuardAuditInput[];
  nowMs: number;
}): GuardFindings {
  const { orders, tasks, auditEntries, nowMs } = input;

  const orderIdsWithTasks = new Set(tasks.map((t) => t.orderId));
  const missingTasks = orders.filter((o) => {
    if (!ACTIONABLE_PAYMENT.has(o.paymentStatus ?? "")) return false;
    const created = o.createdAt ? Date.parse(o.createdAt) : NaN;
    if (!Number.isFinite(created) || nowMs - created < TASK_GRACE_MS) return false;
    return !orderIdsWithTasks.has(o.id);
  });

  const isFlagged = (t: FulfillmentTask) =>
    Boolean(t.cancelMidOrder || t.refundFlagged || t.orderUncertain);
  const olderThan = (t: FulfillmentTask, ms: number) => {
    const created = Date.parse(t.createdAt);
    return Number.isFinite(created) && nowMs - created >= ms;
  };

  // Flaggade tasks listas BARA under "kräver granskning" (inte dubbelt som
  // beställnings-/betalpåminnelse — granskningen ska ske först).
  const heldForReview = tasks.filter((t) => isFlagged(t) && !isTerminal(t.status));
  const unflagged = tasks.filter((t) => !isFlagged(t));

  const placeOrderReminders = unflagged.filter(
    (t) => t.status === "pending" && olderThan(t, PENDING_REMINDER_MS),
  );
  const payReminders = unflagged.filter(
    (t) => t.status === "pending_payment" && olderThan(t, PENDING_PAYMENT_REMINDER_MS),
  );
  const awaitingShipment = unflagged.filter(
    (t) => t.status === "ordered" && !t.trackingNumber && olderThan(t, AWAITING_SHIPMENT_MS),
  );

  const groups = new Map<string, PollErrorGroup>();
  for (const entry of auditEntries) {
    if (entry.kind !== "poll-tracking-error") continue;
    const at = Date.parse(entry.at);
    if (!Number.isFinite(at) || nowMs - at > POLL_ERROR_WINDOW_MS) continue;
    const ref = entry.ref || "okänd task";
    const cur = groups.get(ref);
    if (!cur) {
      groups.set(ref, { ref, count: 1, lastAt: entry.at, lastDetail: entry.detail ?? "" });
    } else {
      cur.count++;
      if (entry.at > cur.lastAt) {
        cur.lastAt = entry.at;
        cur.lastDetail = entry.detail ?? "";
      }
    }
  }
  const pollErrors = [...groups.values()].sort((a, b) => b.count - a.count);

  const actionCount =
    missingTasks.length +
    placeOrderReminders.length +
    payReminders.length +
    awaitingShipment.length +
    heldForReview.length +
    pollErrors.length;

  return {
    missingTasks,
    placeOrderReminders,
    payReminders,
    awaitingShipment,
    heldForReview,
    pollErrors,
    actionCount,
  };
}

/** Hopsummering av dygnets aliexpress-sync-run-audit-rader (detail är JSON). */
export interface SyncRollup {
  runs: number;
  checked: number;
  flaggedPrice: number;
  flaggedContent: number;
  hidden: number;
  markedOos: number;
  restored: number;
  errors: number;
  /** Katalogens storlek (nämnaren till `checked`). */
  total: number;
  /** Hoppade produkter — rotationens eftersläpning. */
  skipped: number;
  /** Antal körningar som var TORRKÖRNINGAR, alltså skrev ingenting till Wix. */
  dryRuns: number;
  /** Antal strypta AE-anrop (ApiCallLimit) under dygnet. */
  throttled: number;
}

export function rollupSyncRuns(auditEntries: GuardAuditInput[], nowMs: number): SyncRollup {
  const rollup: SyncRollup = {
    runs: 0, checked: 0, flaggedPrice: 0, flaggedContent: 0,
    hidden: 0, markedOos: 0, restored: 0, errors: 0,
    total: 0, skipped: 0, dryRuns: 0, throttled: 0,
  };
  for (const entry of auditEntries) {
    if (entry.kind !== "aliexpress-sync-run") continue;
    const at = Date.parse(entry.at);
    if (!Number.isFinite(at) || nowMs - at > 24 * HOUR) continue;
    rollup.runs++;
    try {
      const d = JSON.parse(entry.detail ?? "{}") as Partial<Record<keyof SyncRollup, number>>;
      rollup.checked += d.checked ?? 0;
      rollup.flaggedPrice += d.flaggedPrice ?? 0;
      rollup.flaggedContent += d.flaggedContent ?? 0;
      rollup.hidden += d.hidden ?? 0;
      rollup.markedOos += d.markedOos ?? 0;
      rollup.restored += d.restored ?? 0;
      rollup.errors += d.errors ?? 0;
      rollup.skipped += d.skipped ?? 0;
      rollup.throttled += d.throttled ?? 0;
      // `total` är katalogens storlek, inte en summa — ta den största sedda.
      rollup.total = Math.max(rollup.total, d.total ?? 0);
      // TORRKÖRNING (audit 2026-08-24). SYNC_DRY_RUN är default "true", och en
      // permanent torrkörande cron skriver ingenting till Wix — dessutom FRYSES
      // strike-fälten, så strike 2 är oåtkomlig i princip. Mejlet kunde inte se
      // det: rollupen läste aldrig `dryRun` och digesten filtrerar bort
      // dry_run-rader, så resultatet blev "✅ allt rullar" medan noll skydd
      // fanns. Nu räknas torrkörningarna och syns i statusraden.
      if ((d as { dryRun?: boolean }).dryRun === true) rollup.dryRuns++;
    } catch {
      // trasig detail-JSON — räkna körningen men hoppa siffrorna
    }
  }
  return rollup;
}

// --- Dygns-digest av synkens händelser (2026-07-14) -------------------------
//
// Leonard fick tidigare ETT mejl PER produkt som gick slut hos leverantören
// (+ en rapport per körning, 6/dygn). Nu är de utskicken avstängda och dygnets
// händelser sammanställs här i stället — en rad per produkt med länk till både
// AliExpress-listningen och produktsidan på sajten, så besluten (byt
// leverantör / ta bort) kan tas direkt ur morgonmejlet.

/** Max antal rader per digest-sektion i mejlet — resten blir "+N till". */
export const SYNC_DIGEST_MAX_ROWS = 30;
/** Digesten täcker senaste dygnet (vakten kör dagligen). */
export const SYNC_DIGEST_WINDOW_MS = 24 * HOUR;

export interface SyncDigestItem {
  productId: string;
  aliexpressId: string;
  /** Produktnamn ur Wix-katalogen — fallback: AliExpress-id:t. */
  name: string;
  aliexpressUrl: string;
  /** Produktsidan på butiken — saknas när slug inte gick att slå upp. */
  productUrl?: string;
  /** Antal logg-rader bakom posten (fel loggas per körning — upp till 6/dygn). */
  count: number;
  note?: string;
}

export interface SyncDigest {
  /** Gick till slut-i-lager hos leverantören under dygnet. */
  oos: SyncDigestItem[];
  /** Tillbaka i lager (lagret återställt på sajten). */
  restored: SyncDigestItem[];
  /** Dolda av synken — listningen borttagen hos AliExpress. */
  hidden: SyncDigestItem[];
  /** Hämtningsfel (inkl. 604 All SKU Unsaleable) — synkas inte just nu. */
  errors: SyncDigestItem[];
}

const DIGEST_ACTIONS = {
  marked_oos: "oos",
  restored: "restored",
  hidden: "hidden",
  error: "errors",
} as const satisfies Partial<Record<SyncLogEntry["actionTaken"], keyof SyncDigest>>;

/**
 * Bygger dygns-digesten ur sync-loggens rader. Ren funktion: raderna och
 * produktnamnen (Wix-uppslag) matas in av routen. En produkt visas EN gång per
 * sektion även om den loggats flera gånger under dygnet (fel-rader skrivs per
 * körning) — senaste raden vinner, antalet bevaras i `count`.
 */
export function buildSyncDigest(input: {
  logEntries: SyncLogEntry[];
  productInfo: Map<string, { name?: string; slug?: string }>;
  nowMs: number;
  /** Butikens bas-URL för produktlänkar (default https://fyndplats.se). */
  storeBaseUrl?: string;
}): SyncDigest {
  const { logEntries, productInfo, nowMs } = input;
  const storeBase = (input.storeBaseUrl ?? "https://fyndplats.se").replace(/\/$/, "");

  const buckets: Record<keyof SyncDigest, Map<string, { entry: SyncLogEntry; count: number }>> = {
    oos: new Map(),
    restored: new Map(),
    hidden: new Map(),
    errors: new Map(),
  };

  for (const entry of logEntries) {
    const bucketKey = DIGEST_ACTIONS[entry.actionTaken as keyof typeof DIGEST_ACTIONS];
    if (!bucketKey) continue;
    const at = Date.parse(entry.checkedAt);
    if (!Number.isFinite(at) || nowMs - at > SYNC_DIGEST_WINDOW_MS) continue;
    const bucket = buckets[bucketKey];
    const cur = bucket.get(entry.productId);
    if (!cur) {
      bucket.set(entry.productId, { entry, count: 1 });
    } else {
      cur.count++;
      if (entry.checkedAt > cur.entry.checkedAt) cur.entry = entry;
    }
  }

  const toItems = (bucket: Map<string, { entry: SyncLogEntry; count: number }>): SyncDigestItem[] =>
    [...bucket.values()]
      .sort((a, b) => (a.entry.checkedAt < b.entry.checkedAt ? 1 : -1))
      .map(({ entry, count }) => {
        const info = productInfo.get(entry.productId);
        return {
          productId: entry.productId,
          aliexpressId: entry.aliexpressId,
          name: info?.name || entry.aliexpressId,
          aliexpressUrl: `https://www.aliexpress.com/item/${entry.aliexpressId}.html`,
          productUrl: info?.slug ? `${storeBase}/produkt/${info.slug}` : undefined,
          count,
          note: entry.notes,
        };
      });

  return {
    oos: toItems(buckets.oos),
    restored: toItems(buckets.restored),
    hidden: toItems(buckets.hidden),
    errors: toItems(buckets.errors),
  };
}

export interface GuardExtras {
  syncRollup?: SyncRollup;
  syncDigest?: SyncDigest;
  openAlerts?: number;
  auction?: { live: number; queued: number };
  /**
   * När AliExpress access_token går ut (ISO). En utgången token gör VARJE
   * AE-anrop till ett `IllegalAccessToken`-fel, och det syns annars bara som
   * en felräknare i statusraden — se larmet nedan. Bara tidsstämpeln: inget
   * token-VÄRDE får någonsin nå ett mejl.
   */
  aliExpressTokenExpiresAt?: string;
  /** Datakällor som inte gick att läsa (vakten larmar hellre än döljer). */
  sectionErrors: string[];
  baseUrl: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtAge(nowMs: number, iso?: string): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return "okänd ålder";
  const h = Math.floor((nowMs - t) / HOUR);
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} dagar`;
}

function taskLine(t: FulfillmentTask, nowMs: number): string {
  return `${t.productName || t.taskId} — order ${t.orderNumber || t.orderId} (${fmtAge(nowMs, t.createdAt)})`;
}

/** Bygger morgonmejlet. Skickas ALLTID — grönt mejl är kvittot på att vakten
 *  lever; uteblivet mejl betyder att cronen själv har problem. */
export function buildGuardEmail(
  findings: GuardFindings,
  extras: GuardExtras,
  nowMs: number,
): { subject: string; html: string; text: string } {
  const issues = findings.actionCount + (extras.sectionErrors.length > 0 ? 1 : 0);
  // Slut-hos-leverantör i ämnesraden så dygnets viktigaste synk-nyhet syns
  // utan att mejlet behöver öppnas (räknas inte som "behöver dig" — sajten
  // skyddas automatiskt; beslutet byt/ta bort kan vänta till morgonkaffet).
  const oosSuffix = (extras.syncDigest?.oos.length ?? 0) > 0
    ? ` · ${extras.syncDigest!.oos.length} slut hos leverantör`
    : "";
  const subject = (issues === 0
    ? "✅ Fyndplats morgonkoll: allt rullar"
    : `⚠️ Fyndplats morgonkoll: ${issues} ${issues === 1 ? "sak" : "saker"} behöver dig`) + oosSuffix;

  const html: string[] = [];
  const text: string[] = [];
  const section = (titleHtml: string, itemsHtml: string[], titleText: string, itemsText: string[]) => {
    html.push(`<h3 style="margin:18px 0 6px;font-size:15px;">${titleHtml}</h3>`);
    html.push(`<ul style="margin:0;padding-left:20px;font-size:13px;">${itemsHtml.join("")}</ul>`);
    text.push("", titleText, ...itemsText.map((l) => `  - ${l}`));
  };
  const li = (s: string) => `<li>${esc(s)}</li>`;

  if (findings.missingTasks.length > 0) {
    section(
      `🚨 Betalda ordrar UTAN leverans-task (${findings.missingTasks.length})`,
      findings.missingTasks.map((o) =>
        li(`Order ${o.number || o.id} (${fmtAge(nowMs, o.createdAt)}) — ingen task skapades. Kolla ordern i Wix och lägg AliExpress-ordern manuellt.`),
      ),
      `BETALDA ORDRAR UTAN TASK (${findings.missingTasks.length}):`,
      findings.missingTasks.map((o) => `Order ${o.number || o.id} (${fmtAge(nowMs, o.createdAt)})`),
    );
  }
  if (findings.heldForReview.length > 0) {
    section(
      `⚠️ Kräver manuell granskning (${findings.heldForReview.length})`,
      findings.heldForReview.map((t) => {
        const why = [
          t.cancelMidOrder ? "annullering mitt i orderläggning" : null,
          t.refundFlagged ? "återbetalning registrerad" : null,
          t.orderUncertain ? "osäkert orderutfall" : null,
        ].filter(Boolean).join(", ");
        return li(`${taskLine(t, nowMs)} — ${why}. Hanteras i /admin.`);
      }),
      `KRÄVER GRANSKNING (${findings.heldForReview.length}):`,
      findings.heldForReview.map((t) => taskLine(t, nowMs)),
    );
  }
  if (findings.payReminders.length > 0) {
    section(
      `💳 AliExpress-ordrar som väntar på BETALNING (${findings.payReminders.length})`,
      findings.payReminders.map((t) =>
        li(`${taskLine(t, nowMs)} — obetald AliExpress-order annulleras av dem efter ~24 h!`),
      ),
      `VÄNTAR PÅ BETALNING (${findings.payReminders.length}):`,
      findings.payReminders.map((t) => taskLine(t, nowMs)),
    );
  }
  if (findings.placeOrderReminders.length > 0) {
    section(
      `🛒 Ordrar som väntar på att läggas hos AliExpress (${findings.placeOrderReminders.length})`,
      findings.placeOrderReminders.map((t) => li(taskLine(t, nowMs))),
      `VÄNTAR PÅ ORDERLÄGGNING (${findings.placeOrderReminders.length}):`,
      findings.placeOrderReminders.map((t) => taskLine(t, nowMs)),
    );
  }
  if (findings.awaitingShipment.length > 0) {
    section(
      `📦 Beställda men inte skickade på 5+ dagar (${findings.awaitingShipment.length})`,
      findings.awaitingShipment.map((t) =>
        li(`${taskLine(t, nowMs)} — säljaren är sen, kolla ordern på AliExpress.`),
      ),
      `EJ SKICKADE 5+ DAGAR (${findings.awaitingShipment.length}):`,
      findings.awaitingShipment.map((t) => taskLine(t, nowMs)),
    );
  }
  if (findings.pollErrors.length > 0) {
    section(
      `🔁 Spårningsfel senaste dygnet (${findings.pollErrors.length} tasks)`,
      findings.pollErrors.map((g) =>
        li(`${g.ref}: ${g.count} fel, senaste: ${g.lastDetail.slice(0, 160)}`),
      ),
      `SPÅRNINGSFEL SENASTE DYGNET (${findings.pollErrors.length}):`,
      findings.pollErrors.map((g) => `${g.ref}: ${g.count} fel`),
    );
  }
  if (extras.sectionErrors.length > 0) {
    section(
      `🛑 Vakten kunde inte läsa alla källor (${extras.sectionErrors.length})`,
      extras.sectionErrors.map((e) => li(e)),
      `VAKTEN KUNDE INTE LÄSA (${extras.sectionErrors.length}):`,
      extras.sectionErrors,
    );
  }

  if (issues === 0) {
    html.push(
      `<p style="margin:0 0 12px;font-size:14px;">Inga fastnade ordrar, inga obetalda AliExpress-ordrar, inga spårningsfel. Ingen åtgärd behövs.</p>`,
    );
    text.push("Inga fastnade ordrar, inga obetalda AliExpress-ordrar, inga spårningsfel.");
  }

  // --- Dygnets synk-händelser: en rad per produkt med AliExpress- + sajtlänk.
  // Länkarna byggs av oss (id/slug) men escapas ändå; namnen kommer ur Wix.
  const digestSection = (
    emoji: string,
    title: string,
    items: SyncDigestItem[],
    opts?: { showCount?: boolean; showNote?: boolean },
  ) => {
    if (items.length === 0) return;
    const shown = items.slice(0, SYNC_DIGEST_MAX_ROWS);
    html.push(`<h3 style="margin:18px 0 6px;font-size:15px;">${emoji} ${esc(title)} (${items.length})</h3>`);
    html.push(
      `<ul style="margin:0;padding-left:20px;font-size:13px;">${shown
        .map((it) => {
          const links = [
            `<a href="${esc(it.aliexpressUrl)}" style="color:#F47A35;">AliExpress ↗</a>`,
            it.productUrl ? `<a href="${esc(it.productUrl)}" style="color:#F47A35;">Sajten ↗</a>` : null,
          ].filter(Boolean).join(" · ");
          const count = opts?.showCount && it.count > 1
            ? ` <span style="color:#6b7280;">(${it.count} körningar)</span>` : "";
          const note = opts?.showNote && it.note
            ? `<div style="color:#9ca3af;font-size:12px;">${esc(it.note.slice(0, 140))}</div>` : "";
          return `<li style="margin:2px 0;"><b>${esc(it.name)}</b>${count} — ${links}${note}</li>`;
        })
        .join("")}${
        items.length > shown.length
          ? `<li style="color:#6b7280;">+${items.length - shown.length} till — se admin/sync-alerts</li>`
          : ""
      }</ul>`,
    );
    text.push("", `${title.toUpperCase()} (${items.length}):`);
    for (const it of shown) {
      text.push(`  - ${it.name}${opts?.showCount && it.count > 1 ? ` (${it.count} körningar)` : ""}`);
      text.push(`    AliExpress: ${it.aliexpressUrl}`);
      if (it.productUrl) text.push(`    Sajten: ${it.productUrl}`);
    }
    if (items.length > shown.length) text.push(`  … +${items.length - shown.length} till`);
  };
  if (extras.syncDigest) {
    digestSection("🟠", "Slut hos leverantör senaste dygnet", extras.syncDigest.oos);
    digestSection("🟢", "Tillbaka i lager hos leverantör", extras.syncDigest.restored);
    digestSection("🙈", "Dolda — listning borttagen hos AliExpress", extras.syncDigest.hidden);
    digestSection("⛔", "Hämtningsfel — synkas inte just nu", extras.syncDigest.errors, {
      showCount: true,
      showNote: true,
    });
  }

  // Statusrad — alltid med, som kvitto på att alla system rapporterar.
  const statusBits: string[] = [];
  if (extras.syncRollup) {
    const s = extras.syncRollup;
    statusBits.push(
      `Synken: ${s.runs} körningar, ${s.checked}${s.total ? `/${s.total}` : ""} produkter kollade` +
        (s.markedOos ? `, ${s.markedOos} satta slut-i-lager` : "") +
        (s.hidden ? `, ${s.hidden} dolda` : "") +
        (s.errors ? `, ${s.errors} fel` : "") +
        (s.throttled ? `, ${s.throttled} strypta AE-anrop` : ""),
    );
    // ☠️ NOLL KÖRNINGAR ÄR DEN TYSTASTE FELMODEN AV ALLA, och den enda som
    // inte hade någon egen rad förrän 2026-08-28. Cronen svarade 500 varje
    // körning i 57 timmar (obegränsad fan-out i runDailySync dödade lambdan,
    // så ruttens catch hann aldrig skriva sin fatal-rad). Morgonmejlet
    // rapporterade "Synken: 0 körningar, 0 produkter kollade" — sant, korrekt,
    // och begravt mitt i en grå statusremsa bland auktionssiffror.
    //
    // Ligger FÖRE torrkörningsraden: har den inte kört spelar det ingen roll
    // om den skulle ha skrivit. Samma tanke som torrkörningsraden från
    // 2026-08-24 — ett läge där butiken är oskyddad får inte se ut som statistik.
    if (s.runs === 0) {
      statusBits.push(
        "⛔ SYNKEN HAR INTE KÖRT det senaste dygnet — inga lager- eller prisuppdateringar alls. "
          + "Slutsålda och nedtagna produkter förblir köpbara. Kolla /api/cron/aliexpress-sync i Vercels loggar.",
      );
    } else if (s.dryRuns > 0) {
      statusBits.push(
        s.dryRuns === s.runs
          ? "⚠️ SYNC_DRY_RUN är PÅ — synken skriver INGENTING till Wix. Slutsålda och nedtagna produkter förblir köpbara."
          : `⚠️ ${s.dryRuns} av ${s.runs} synk-körningar var torrkörningar (inga Wix-skrivningar).`,
      );
    }
  }
  // ☠️ UTGÅNGEN ALIEXPRESS-TOKEN. Egen rad, av samma skäl som torrkörningen och
  // noll körningar: den gör VARJE AE-anrop till ett fel, men syns annars bara
  // som ett tal i "…, 99 fel" mitt i statusremsan. Uppmätt 2026-08-29: token
  // dog 02:37, synken fick 99 fel av 106 försök, och ingenting sa till.
  //
  // Varningen före utgången är den som faktiskt räddar något. En UTGÅNGEN
  // access_token läker sig själv vid nästa refresh-körning; det är
  // REFRESH-token som inte gör det — går den ut krävs en ny OAuth för hand,
  // och då vill man ha vetat det i förväg.
  if (extras.aliExpressTokenExpiresAt) {
    const kvarMs = Date.parse(extras.aliExpressTokenExpiresAt) - nowMs;
    if (!Number.isFinite(kvarMs)) {
      statusBits.push("⚠️ AliExpress-tokens utgångstid går inte att tolka — kontrollera /api/aliexpress/refresh.");
    } else if (kvarMs <= 0) {
      statusBits.push(
        "⛔ AliExpress-token har GÅTT UT — varje anrop mot AliExpress failar "
          + "(IllegalAccessToken). Lager och priser uppdateras inte. Kör workflowen "
          + "\"Refresh AliExpress tokens\"; hjälper inte den krävs ny OAuth via /api/aliexpress/auth.",
      );
    } else if (kvarMs < 12 * HOUR) {
      // 12 h = ETT schemaintervall, och det är precis vad som gör raden till en
      // signal i stället för brus. Förnyelsen slår till när mindre än 24 h
      // återstår och körs var 12:e timme — är vi under 12 h har den alltså
      // redan haft minst ett försök och inte lyckats. Ett tidigare utkast
      // varnade vid 48 h: då hade raden dykt upp varje månad i det NORMALA
      // förloppet, strax innan token förnyade sig själv, och en varning man
      // lär sig att ignorera är värre än ingen varning alls.
      const timmar = Math.floor(kvarMs / HOUR);
      statusBits.push(
        `⚠️ AliExpress-token går ut om ${timmar} h och har INTE förnyats automatiskt `
          + "som den skulle — kolla workflowen \"Refresh AliExpress tokens\" innan den dör.",
      );
    }
  }
  if (extras.openAlerts !== undefined && extras.openAlerts > 0) {
    statusBits.push(`${extras.openAlerts} öppna sync-larm väntar på beslut`);
  }
  if (extras.auction) {
    statusBits.push(`Fyndauktionen: ${extras.auction.live} live, ${extras.auction.queued} i kö`);
  }
  if (statusBits.length > 0) {
    html.push(
      `<p style="margin:18px 0 0;padding:10px 12px;background:#f3f4f6;border-radius:8px;font-size:12px;color:#374151;">${statusBits.map(esc).join(" · ")}</p>`,
    );
    text.push("", ...statusBits);
  }

  html.push(
    `<p style="margin:18px 0 0;"><a href="${extras.baseUrl}/admin" style="display:inline-block;background:#F47A35;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;font-size:14px;">Öppna admin</a></p>`,
  );
  text.push("", `Admin: ${extras.baseUrl}/admin`);

  return { subject, html: html.join("\n"), text: text.join("\n").trim() };
}
