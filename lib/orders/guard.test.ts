import { describe, expect, it } from "vitest";
import {
  AWAITING_SHIPMENT_MS,
  PENDING_PAYMENT_REMINDER_MS,
  PENDING_REMINDER_MS,
  POLL_ERROR_WINDOW_MS,
  SYNC_DIGEST_MAX_ROWS,
  SYNC_DIGEST_WINDOW_MS,
  TASK_GRACE_MS,
  buildGuardEmail,
  buildGuardFindings,
  buildSyncDigest,
  rollupSyncRuns,
  type GuardAuditInput,
  type GuardOrderInput,
} from "./guard";
import type { SyncLogEntry } from "@/lib/sync/sync-log";
import type { FulfillmentTask, TaskStatus } from "./types";

const NOW = Date.parse("2026-07-13T05:00:00.000Z");
const HOUR = 60 * 60 * 1000;

function iso(msAgo: number): string {
  return new Date(NOW - msAgo).toISOString();
}

function task(overrides: Partial<FulfillmentTask> & { status: TaskStatus }): FulfillmentTask {
  return {
    taskId: "o1:l1",
    orderId: "o1",
    orderNumber: "10001",
    lineItemId: "l1",
    productName: "Testprodukt",
    variantChoices: {},
    quantity: 1,
    createdAt: iso(HOUR),
    ...overrides,
  };
}

function order(overrides: Partial<GuardOrderInput>): GuardOrderInput {
  return { id: "o1", number: "10001", createdAt: iso(HOUR), paymentStatus: "PAID", ...overrides };
}

function findings(input: {
  orders?: GuardOrderInput[];
  tasks?: FulfillmentTask[];
  auditEntries?: GuardAuditInput[];
}) {
  return buildGuardFindings({
    orders: input.orders ?? [],
    tasks: input.tasks ?? [],
    auditEntries: input.auditEntries ?? [],
    nowMs: NOW,
  });
}

describe("buildGuardFindings — ordrar utan task", () => {
  it("betald order äldre än fristen utan task → larm", () => {
    const f = findings({ orders: [order({ createdAt: iso(TASK_GRACE_MS + HOUR) })] });
    expect(f.missingTasks).toHaveLength(1);
    expect(f.actionCount).toBe(1);
  });

  it("färsk order inom fristen → inget larm (webhooken kan vara på väg)", () => {
    const f = findings({ orders: [order({ createdAt: iso(TASK_GRACE_MS - HOUR) })] });
    expect(f.missingTasks).toHaveLength(0);
  });

  it("order med minst en task → inget larm", () => {
    const f = findings({
      orders: [order({ createdAt: iso(TASK_GRACE_MS + HOUR) })],
      tasks: [task({ status: "pending", createdAt: iso(HOUR) })],
    });
    expect(f.missingTasks).toHaveLength(0);
  });

  it("obetald/återbetald order → inget larm (ingen leveransplikt)", () => {
    const old = TASK_GRACE_MS + HOUR;
    const f = findings({
      orders: [
        order({ id: "a", createdAt: iso(old), paymentStatus: "NOT_PAID" }),
        order({ id: "b", createdAt: iso(old), paymentStatus: "FULLY_REFUNDED" }),
        order({ id: "c", createdAt: iso(old), paymentStatus: undefined }),
      ],
    });
    expect(f.missingTasks).toHaveLength(0);
  });
});

describe("buildGuardFindings — task-påminnelser", () => {
  it("pending äldre än ett dygn → beställningspåminnelse", () => {
    const f = findings({ tasks: [task({ status: "pending", createdAt: iso(PENDING_REMINDER_MS + HOUR) })] });
    expect(f.placeOrderReminders).toHaveLength(1);
  });

  it("pending inom ett dygn → ingen påminnelse", () => {
    const f = findings({ tasks: [task({ status: "pending", createdAt: iso(PENDING_REMINDER_MS - HOUR) })] });
    expect(f.placeOrderReminders).toHaveLength(0);
  });

  it("pending_payment äldre än 6 h → betalpåminnelse", () => {
    const f = findings({
      tasks: [task({ status: "pending_payment", createdAt: iso(PENDING_PAYMENT_REMINDER_MS + HOUR) })],
    });
    expect(f.payReminders).toHaveLength(1);
  });

  it("ordered utan spårningsnummer i 5+ dagar → sen säljare", () => {
    const f = findings({
      tasks: [task({ status: "ordered", aliexpressOrderId: "AE1", createdAt: iso(AWAITING_SHIPMENT_MS + HOUR) })],
    });
    expect(f.awaitingShipment).toHaveLength(1);
  });

  it("ordered MED spårningsnummer → inget larm oavsett ålder", () => {
    const f = findings({
      tasks: [task({
        status: "ordered",
        aliexpressOrderId: "AE1",
        trackingNumber: "ABC12345678",
        createdAt: iso(AWAITING_SHIPMENT_MS + HOUR),
      })],
    });
    expect(f.awaitingShipment).toHaveLength(0);
  });

  it("granskningsflaggad task listas under heldForReview — inte som påminnelse", () => {
    const f = findings({
      tasks: [task({ status: "pending", refundFlagged: true, createdAt: iso(PENDING_REMINDER_MS + HOUR) })],
    });
    expect(f.heldForReview).toHaveLength(1);
    expect(f.placeOrderReminders).toHaveLength(0);
  });

  it("terminal task (cancelled) med flagga → ingen granskningsrad", () => {
    const f = findings({ tasks: [task({ status: "cancelled", refundFlagged: true })] });
    expect(f.heldForReview).toHaveLength(0);
  });
});

describe("buildGuardFindings — poll-fel", () => {
  it("grupperar per task inom dygnsfönstret, senaste felet vinner", () => {
    const f = findings({
      auditEntries: [
        { at: iso(2 * HOUR), kind: "poll-tracking-error", ref: "o1:l1", detail: "nyast" },
        { at: iso(5 * HOUR), kind: "poll-tracking-error", ref: "o1:l1", detail: "äldre" },
        { at: iso(POLL_ERROR_WINDOW_MS + HOUR), kind: "poll-tracking-error", ref: "o1:l1", detail: "utanför" },
        { at: iso(HOUR), kind: "aliexpress-sync-run", ref: "cron", detail: "{}" },
      ],
    });
    expect(f.pollErrors).toHaveLength(1);
    expect(f.pollErrors[0]).toMatchObject({ ref: "o1:l1", count: 2, lastDetail: "nyast" });
  });
});

describe("rollupSyncRuns", () => {
  it("summerar dygnets körningar och hoppar äldre", () => {
    const entries: GuardAuditInput[] = [
      { at: iso(HOUR), kind: "aliexpress-sync-run", detail: '{"checked":80,"markedOos":3,"errors":20}' },
      { at: iso(5 * HOUR), kind: "aliexpress-sync-run", detail: '{"checked":80,"hidden":1,"errors":20}' },
      { at: iso(30 * HOUR), kind: "aliexpress-sync-run", detail: '{"checked":80,"errors":20}' },
    ];
    const r = rollupSyncRuns(entries, NOW);
    expect(r).toMatchObject({ runs: 2, checked: 160, markedOos: 3, hidden: 1, errors: 40 });
  });
});

function logEntry(overrides: Partial<SyncLogEntry> & { productId: string; actionTaken: SyncLogEntry["actionTaken"] }): SyncLogEntry {
  return {
    id: `${overrides.productId}-${overrides.checkedAt ?? iso(HOUR)}`,
    aliexpressId: "1005001111111111",
    checkedAt: iso(HOUR),
    prevCostSek: null,
    newCostSek: null,
    prevStock: null,
    newStock: null,
    listingStatus: "active",
    ...overrides,
  };
}

describe("buildSyncDigest", () => {
  const info = new Map([
    ["p1", { name: "Airfryer 9L", slug: "airfryer-9l" }],
    ["p2", { name: "Hundvagn", slug: "hundvagn" }],
  ]);

  it("sorterar in händelser i rätt sektion med länkar till AliExpress + sajten", () => {
    const d = buildSyncDigest({
      logEntries: [
        logEntry({ productId: "p1", actionTaken: "marked_oos", aliexpressId: "1005009995481212" }),
        logEntry({ productId: "p2", actionTaken: "restored" }),
      ],
      productInfo: info,
      nowMs: NOW,
    });
    expect(d.oos).toHaveLength(1);
    expect(d.oos[0]).toMatchObject({
      name: "Airfryer 9L",
      aliexpressUrl: "https://www.aliexpress.com/item/1005009995481212.html",
      productUrl: "https://fyndplats.se/produkt/airfryer-9l",
    });
    expect(d.restored).toHaveLength(1);
    expect(d.hidden).toHaveLength(0);
    expect(d.errors).toHaveLength(0);
  });

  it("dedupar per produkt — senaste raden vinner, antalet bevaras (fel loggas per körning)", () => {
    const d = buildSyncDigest({
      logEntries: [
        logEntry({ productId: "p1", actionTaken: "error", checkedAt: iso(20 * HOUR), notes: "äldst" }),
        logEntry({ productId: "p1", actionTaken: "error", checkedAt: iso(2 * HOUR), notes: "nyast" }),
        logEntry({ productId: "p1", actionTaken: "error", checkedAt: iso(10 * HOUR), notes: "mitten" }),
      ],
      productInfo: info,
      nowMs: NOW,
    });
    expect(d.errors).toHaveLength(1);
    expect(d.errors[0]).toMatchObject({ count: 3, note: "nyast" });
  });

  it("ignorerar rader utanför dygnsfönstret och none/dry_run-rader", () => {
    const d = buildSyncDigest({
      logEntries: [
        logEntry({ productId: "p1", actionTaken: "marked_oos", checkedAt: iso(SYNC_DIGEST_WINDOW_MS + HOUR) }),
        logEntry({ productId: "p2", actionTaken: "none" }),
        logEntry({ productId: "p2", actionTaken: "dry_run" }),
      ],
      productInfo: info,
      nowMs: NOW,
    });
    expect(d.oos).toHaveLength(0);
    expect(d.restored).toHaveLength(0);
  });

  it("okänd produkt → AliExpress-id som namn, ingen sajtlänk", () => {
    const d = buildSyncDigest({
      logEntries: [logEntry({ productId: "okand", actionTaken: "marked_oos", aliexpressId: "42" })],
      productInfo: new Map(),
      nowMs: NOW,
    });
    expect(d.oos[0]).toMatchObject({ name: "42", productUrl: undefined });
  });
});

describe("buildGuardEmail", () => {
  const extras = { sectionErrors: [], baseUrl: "https://example.test" };

  it("allt grönt → ✅-ämne och ingen åtgärdslista", () => {
    const email = buildGuardEmail(findings({}), extras, NOW);
    expect(email.subject).toContain("✅");
    expect(email.text).toContain("Inga fastnade ordrar");
  });

  it("fynd → ⚠️-ämne med antal", () => {
    const f = findings({
      orders: [order({ createdAt: iso(TASK_GRACE_MS + HOUR) })],
      tasks: [task({ status: "pending_payment", createdAt: iso(PENDING_PAYMENT_REMINDER_MS + HOUR), taskId: "o2:l1", orderId: "o2" })],
    });
    const email = buildGuardEmail(f, extras, NOW);
    expect(email.subject).toContain("⚠️");
    expect(email.subject).toContain("2");
    expect(email.html).toContain("UTAN leverans-task");
    expect(email.html).toContain("BETALNING");
  });

  it("trasig datakälla räknas som åtgärd även utan fynd", () => {
    const email = buildGuardEmail(
      findings({}),
      { sectionErrors: ["Wix-ordrar gick inte att hämta: 500"], baseUrl: "https://example.test" },
      NOW,
    );
    expect(email.subject).toContain("⚠️");
    expect(email.html).toContain("kunde inte läsa");
  });

  it("dygns-digesten renderas med klickbara länkar och syns i ämnesraden", () => {
    const digest = buildSyncDigest({
      logEntries: [
        logEntry({ productId: "p1", actionTaken: "marked_oos", aliexpressId: "1005009995481212" }),
        logEntry({ productId: "p2", actionTaken: "error", notes: "AliExpress API-fel 604: All SKU Unsaleable" }),
      ],
      productInfo: new Map([
        ["p1", { name: "Airfryer 9L", slug: "airfryer-9l" }],
        ["p2", { name: "Hundvagn", slug: "hundvagn" }],
      ]),
      nowMs: NOW,
    });
    const email = buildGuardEmail(findings({}), { ...extras, syncDigest: digest }, NOW);
    // Ämnesraden: OOS-antal syns utan att mejlet öppnas, ✅ behålls (ingen order-åtgärd).
    expect(email.subject).toContain("✅");
    expect(email.subject).toContain("1 slut hos leverantör");
    // HTML: rubrik + båda länkarna per produkt.
    expect(email.html).toContain("Slut hos leverantör senaste dygnet");
    expect(email.html).toContain('href="https://www.aliexpress.com/item/1005009995481212.html"');
    expect(email.html).toContain('href="https://fyndplats.se/produkt/airfryer-9l"');
    // Felsektionen med 604-noten.
    expect(email.html).toContain("Hämtningsfel");
    expect(email.html).toContain("604");
    // Text-fallback har URL:erna i klartext.
    expect(email.text).toContain("AliExpress: https://www.aliexpress.com/item/1005009995481212.html");
    expect(email.text).toContain("Sajten: https://fyndplats.se/produkt/airfryer-9l");
  });

  it("digest-sektion cappas vid SYNC_DIGEST_MAX_ROWS med '+N till'", () => {
    const entries = Array.from({ length: SYNC_DIGEST_MAX_ROWS + 5 }, (_, i) =>
      logEntry({ productId: `p${i}`, actionTaken: "marked_oos", aliexpressId: `${i}` }),
    );
    const digest = buildSyncDigest({ logEntries: entries, productInfo: new Map(), nowMs: NOW });
    const email = buildGuardEmail(findings({}), { ...extras, syncDigest: digest }, NOW);
    expect(email.subject).toContain(`${SYNC_DIGEST_MAX_ROWS + 5} slut hos leverantör`);
    expect(email.html).toContain("+5 till");
  });

  it("tom digest → inga synk-sektioner och orörd ämnesrad", () => {
    const digest = buildSyncDigest({ logEntries: [], productInfo: new Map(), nowMs: NOW });
    const email = buildGuardEmail(findings({}), { ...extras, syncDigest: digest }, NOW);
    expect(email.subject).toBe("✅ Fyndplats morgonkoll: allt rullar");
    expect(email.html).not.toContain("Slut hos leverantör senaste dygnet");
  });

  it("statusraden visar synk/larm/auktion", () => {
    const email = buildGuardEmail(findings({}), {
      sectionErrors: [],
      baseUrl: "https://example.test",
      syncRollup: { runs: 6, checked: 480, flaggedPrice: 0, flaggedContent: 0, hidden: 0, markedOos: 3, restored: 0, errors: 20, total: 876, skipped: 396, dryRuns: 0, throttled: 0 },
      openAlerts: 10,
      auction: { live: 5, queued: 12 },
    }, NOW);
    expect(email.text).toContain("6 körningar");
    expect(email.text).toContain("10 öppna sync-larm");
    expect(email.text).toContain("5 live, 12 i kö");
  });
});

// ── Torrkörning får inte se ut som "allt rullar" (audit 2026-08-24) ──────────
//
// SYNC_DRY_RUN är default "true". En permanent torrkörande cron skriver
// ingenting till Wix OCH fryser strike-fälten, så strike 2 är oåtkomlig i
// princip — slutsålda och nedtagna produkter förblir köpbara. Mejlet kunde
// inte se det: rollupen läste aldrig `dryRun`.

describe("rollupSyncRuns + statusrad: torrkörning och nämnare", () => {
  const rad = (detail: Record<string, unknown>) => ({
    kind: "aliexpress-sync-run",
    at: new Date(NOW - 60_000).toISOString(),
    detail: JSON.stringify(detail),
  });

  it("räknar torrkörningar och plockar upp total/skipped/throttled", () => {
    const r = rollupSyncRuns(
      [
        rad({ dryRun: true, checked: 100, total: 876, skipped: 776, throttled: 2 }),
        rad({ dryRun: true, checked: 100, total: 876, skipped: 776, throttled: 1 }),
      ] as never,
      NOW,
    );
    expect(r.runs).toBe(2);
    expect(r.dryRuns).toBe(2);
    expect(r.total).toBe(876);      // nämnare, inte summa
    expect(r.skipped).toBe(1552);   // summa
    expect(r.throttled).toBe(3);
  });

  it("live-körningar räknas INTE som torrkörningar", () => {
    const r = rollupSyncRuns([rad({ dryRun: false, checked: 100, total: 876 })] as never, NOW);
    expect(r.dryRuns).toBe(0);
  });

  it("alla körningar torra → otvetydig varning i mejlet, inte en siffra bland andra", () => {
    const email = buildGuardEmail(findings({}), {
      sectionErrors: [],
      baseUrl: "https://example.test",
      syncRollup: { runs: 6, checked: 600, flaggedPrice: 0, flaggedContent: 0, hidden: 0, markedOos: 0, restored: 0, errors: 0, total: 876, skipped: 4656, dryRuns: 6, throttled: 0 },
    }, NOW);
    expect(email.text).toContain("SYNC_DRY_RUN är PÅ");
    expect(email.text).toContain("förblir köpbara");
    expect(email.text).toContain("600/876");
  });

  // Regressionstest för den tysta 57-timmarsincidenten (audit 2026-08-28):
  // cronen svarade 500 varje körning, och mejlet sa "Synken: 0 körningar"
  // mitt i en grå statusremsa utan ett enda varningstecken.
  it("noll körningar → egen otvetydig rad, inte en nolla i statusremsan", () => {
    const email = buildGuardEmail(findings({}), {
      sectionErrors: [],
      baseUrl: "https://example.test",
      syncRollup: { runs: 0, checked: 0, flaggedPrice: 0, flaggedContent: 0, hidden: 0, markedOos: 0, restored: 0, errors: 0, total: 0, skipped: 0, dryRuns: 0, throttled: 0 },
    }, NOW);
    expect(email.text).toContain("SYNKEN HAR INTE KÖRT");
    expect(email.text).toContain("förblir köpbara");
  });

  it("noll körningar vinner över torrkörningsraden — har den inte kört spelar skrivläget ingen roll", () => {
    const email = buildGuardEmail(findings({}), {
      sectionErrors: [],
      baseUrl: "https://example.test",
      syncRollup: { runs: 0, checked: 0, flaggedPrice: 0, flaggedContent: 0, hidden: 0, markedOos: 0, restored: 0, errors: 0, total: 0, skipped: 0, dryRuns: 0, throttled: 0 },
    }, NOW);
    expect(email.text).not.toContain("SYNC_DRY_RUN är PÅ");
  });

  it("en körning som faktiskt skrev ger ingen larmrad", () => {
    const email = buildGuardEmail(findings({}), {
      sectionErrors: [],
      baseUrl: "https://example.test",
      syncRollup: { runs: 6, checked: 600, flaggedPrice: 0, flaggedContent: 0, hidden: 0, markedOos: 0, restored: 0, errors: 0, total: 876, skipped: 0, dryRuns: 0, throttled: 0 },
    }, NOW);
    expect(email.text).not.toContain("SYNKEN HAR INTE KÖRT");
  });

  // Regressionstest för token-incidenten 2026-08-29: access_token gick ut
  // 02:37, synken fick 99 fel av 106 försök, och mejlet sa bara "…, 99 fel".
  const rollup = { runs: 6, checked: 600, flaggedPrice: 0, flaggedContent: 0, hidden: 0, markedOos: 0, restored: 0, errors: 0, total: 876, skipped: 0, dryRuns: 0, throttled: 0 };
  const medToken = (expiresAt: string | undefined) =>
    buildGuardEmail(findings({}), {
      sectionErrors: [], baseUrl: "https://example.test", syncRollup: rollup,
      ...(expiresAt ? { aliExpressTokenExpiresAt: expiresAt } : {}),
    }, NOW);

  it("utgången AliExpress-token → egen larmrad som säger vad som är trasigt", () => {
    const email = medToken(new Date(NOW - HOUR).toISOString());
    expect(email.text).toContain("AliExpress-token har GÅTT UT");
    expect(email.text).toContain("IllegalAccessToken");
  });

  it("under ett schemaintervall kvar → varning, för då har förnyelsen redan missat sin chans", () => {
    const email = medToken(new Date(NOW + 5 * HOUR).toISOString());
    expect(email.text).toContain("går ut om 5 h");
    expect(email.text).toContain("INTE förnyats automatiskt");
    expect(email.text).not.toContain("GÅTT UT");
  });

  // Förnyelsen slår till vid 24 h kvar. Varnar vi där uppe dyker raden upp
  // varje månad i det NORMALA förloppet, och en varning man lär sig ignorera
  // är värre än ingen.
  it("token mellan förnyelsetröskeln och utgången är tyst — det är inte ett fel", () => {
    expect(medToken(new Date(NOW + 20 * HOUR).toISOString()).text).not.toContain("AliExpress-token");
    expect(medToken(new Date(NOW + 13 * HOUR).toISOString()).text).not.toContain("AliExpress-token");
  });

  it("token med god marginal nämns inte alls", () => {
    const email = medToken(new Date(NOW + 20 * 24 * HOUR).toISOString());
    expect(email.text).not.toContain("AliExpress-token");
  });

  // Blindfläck i den första testomgången: alla token-tester skickade med en
  // syncRollup, så de hade INTE fällt om larmet råkat hamna inuti
  // `if (extras.syncRollup)`. Och just då behövs det som mest — en synk som
  // aldrig kört har ingen rollup att gömma sig bakom.
  it("larmet är oberoende av syncRollup", () => {
    const email = buildGuardEmail(findings({}), {
      sectionErrors: [], baseUrl: "https://example.test",
      aliExpressTokenExpiresAt: new Date(NOW - HOUR).toISOString(),
    }, NOW);
    expect(email.text).toContain("AliExpress-token har GÅTT UT");
  });

  it("saknad eller otolkbar utgångstid gissar aldrig att allt är bra", () => {
    expect(medToken(undefined).text).not.toContain("AliExpress-token");
    expect(medToken("inte-ett-datum").text).toContain("går inte att tolka");
  });

  it("delvis torrkörning nämns med sitt förhållande", () => {
    const email = buildGuardEmail(findings({}), {
      sectionErrors: [],
      baseUrl: "https://example.test",
      syncRollup: { runs: 6, checked: 600, flaggedPrice: 0, flaggedContent: 0, hidden: 0, markedOos: 0, restored: 0, errors: 0, total: 876, skipped: 0, dryRuns: 2, throttled: 0 },
    }, NOW);
    expect(email.text).toContain("2 av 6 synk-körningar var torrkörningar");
  });
});
