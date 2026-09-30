import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildOosAlertEmail,
  buildDailySummaryEmail,
  buildStuckOrdersEmail,
  sendEmail,
} from "./resend";
import type { AlternativeSupplier } from "../aliexpress/alternatives";
import type { SyncSummary } from "../sync/aliexpress-sync";

const ALT: AlternativeSupplier = {
  aliexpressId: "100200",
  title: "Smart Body Fat Scale Bluetooth",
  priceUsd: 18,
  priceSek: 198,
  imageUrl: "https://img/a.jpg",
  productUrl: "https://www.aliexpress.com/item/100200.html",
  orders: 540,
  shipsFromCountries: ["ES"],
  warehouseClass: "EU",
  score: 88,
  scoreReason: "Samma typ av smart-våg.",
  importUrl: "https://app.vercel.app/admin/import?source=alternative&aliexpressUrl=x&replacesProductId=old",
};

describe("buildOosAlertEmail", () => {
  it("har rätt ämne och innehåller produkt + 30-dagars-sälj + alternativ", () => {
    const email = buildOosAlertEmail({
      productName: "Smart Kroppsvåg",
      imageUrl: "https://img/orig.jpg",
      aliexpressUrl: "https://www.aliexpress.com/item/999.html",
      sales30d: 12,
      alternatives: [ALT],
      alertsUrl: "https://app.vercel.app/admin/sync-alerts",
    });
    expect(email.subject).toBe("Slut hos leverantör: Smart Kroppsvåg");
    expect(email.html).toContain("Slut hos leverantör");
    expect(email.html).toContain("12"); // sales30d
    expect(email.html).toContain("Hittade 1 alternativ");
    expect(email.html).toContain("Importera →");
    expect(email.html).toContain("EU-lager");
    expect(email.text).toContain("Importera:");
  });

  it("hanterar noll alternativ utan att krascha", () => {
    const email = buildOosAlertEmail({
      productName: "X",
      aliexpressUrl: "https://www.aliexpress.com/item/1.html",
      sales30d: 0,
      alternatives: [],
      alertsUrl: "https://app/admin/sync-alerts",
    });
    expect(email.html).toContain("Inga alternativa leverantörer");
  });
});

describe("sendEmail", () => {
  const miljo = { ...process.env };
  afterEach(() => {
    process.env = { ...miljo };
    vi.unstubAllGlobals();
  });

  function fangaAnrop(): { kropp: () => Record<string, unknown> } {
    let kropp: Record<string, unknown> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        kropp = JSON.parse(String(init.body));
        return new Response(JSON.stringify({ id: "mejl-1" }), { status: 200 });
      }),
    );
    return { kropp: () => kropp };
  }

  it("☠️ ett kundmejl går i butikens omslag, från butikens avsändare, med svar till kundservice", async () => {
    process.env.RESEND_API_KEY = "nyckel";
    delete process.env.SYNC_EMAIL_DRY_RUN;
    delete process.env.RESEND_KUND_FROM;
    const anrop = fangaAnrop();
    const svar = await sendEmail({
      to: "kund@example.com",
      subject: "Tillbaka i lager: Stol",
      bodyHtml: "<p>innehåll</p>",
      bodyText: "innehåll",
      mottagare: "kund",
      forhandstext: "Nu kan du beställa den.",
    });
    expect(svar.id).toBe("mejl-1");
    const k = anrop.kropp();
    expect(k.from).toBe("Fyndplats <orders@fyndplats.se>");
    expect(k.reply_to).toBe("info@fyndplats.com");
    expect(String(k.html)).toContain("Behöver du hjälp?");
    expect(String(k.html)).toContain("Nu kan du beställa den.");
    // Driftmejlens sidfot får aldrig nå en kund.
    expect(String(k.html)).not.toContain("sync-cron");
  });

  it("ett driftmejl behåller driftomslaget och har ingen svarsadress", async () => {
    process.env.RESEND_API_KEY = "nyckel";
    delete process.env.SYNC_EMAIL_DRY_RUN;
    const anrop = fangaAnrop();
    await sendEmail({ to: "ops@example.com", subject: "Rapport", bodyHtml: "<p>x</p>", bodyText: "x" });
    const k = anrop.kropp();
    expect(String(k.html)).toContain("sync-cron");
    expect(k.reply_to).toBeUndefined();
  });

  it("loggan ligger på den mörka rubrikraden i båda omslagen", async () => {
    process.env.RESEND_API_KEY = "nyckel";
    delete process.env.SYNC_EMAIL_DRY_RUN;
    for (const mottagare of ["kund", "intern"] as const) {
      const anrop = fangaAnrop();
      await sendEmail({ to: "a@example.com", subject: "s", bodyHtml: "<p>x</p>", bodyText: "x", mottagare });
      const html = String(anrop.kropp().html);
      const logga = html.indexOf("https://www.fyndplats.se/email-logo");
      expect(logga).toBeGreaterThan(-1);
      expect(html.lastIndexOf("#222018", logga)).toBeGreaterThan(-1);
    }
  });

  it("torrläge skickar ingenting", async () => {
    process.env.RESEND_API_KEY = "nyckel";
    process.env.SYNC_EMAIL_DRY_RUN = "true";
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const svar = await sendEmail({ to: "a@example.com", subject: "s", bodyHtml: "x", bodyText: "x", mottagare: "kund" });
    expect(svar.skipped).toBe("dry_run");
    expect(f).not.toHaveBeenCalled();
  });
});

describe("buildDailySummaryEmail med OOS-aggregering", () => {
  function summary(overrides: Partial<SyncSummary> = {}): SyncSummary {
    return {
      total: 10, checked: 10, skipped: 0, hidden: 0, markedOos: 1, restored: 0,
      flaggedPrice: 0, flaggedContent: 0, oosRealtimeAlerts: 1,
      restockNotificationsSent: 0, oosEvents: [], unchanged: 9, errors: [],
      dryRun: true, startedAt: "2026-05-31T06:00:00.000Z", finishedAt: "2026-05-31T06:01:00.000Z",
      ...overrides,
    };
  }

  it("listar dagens OOS-händelser i rapporten", () => {
    const built = buildDailySummaryEmail(
      summary({ oosEvents: [{ productName: "Kroppsvåg", aliexpressId: "999", sales30d: 12 }] }),
      "https://app/admin/sync-alerts",
    );
    expect(built).not.toBeNull();
    expect(built!.html).toContain("Slut hos leverantör idag");
    expect(built!.html).toContain("Kroppsvåg");
  });

  it("returnerar null när inget hände", () => {
    const built = buildDailySummaryEmail(summary({ markedOos: 0, oosRealtimeAlerts: 0 }), "x");
    expect(built).toBeNull();
  });
});

describe("buildStuckOrdersEmail", () => {
  const order = {
    number: "10024",
    reason: "WDE0195: Items limit exceeded. Delete some items and try again.",
    customer: "Göran Wallin",
    items: [{ name: "Förvaringsskåp 60 cm svart", sku: "FP-forvaringsskap-60-svart", quantity: 1 }],
  };

  it("☠️ bär ordernummer, kund, artikel OCH orsak — mejlet är enda kanalen ut ur en full databas", () => {
    const b = buildStuckOrdersEmail([order], "https://x.se/admin");
    expect(b).not.toBeNull();
    for (const text of [b!.html, b!.text]) {
      expect(text).toContain("10024");
      expect(text).toContain("Göran Wallin");
      expect(text).toContain("Förvaringsskåp 60 cm svart");
      expect(text).toContain("FP-forvaringsskap-60-svart");
      expect(text).toContain("WDE0195");
    }
  });

  it("ämnesraden namnger ordern så den syns i en notis på mobilen", () => {
    expect(buildStuckOrdersEmail([order], "https://x.se/admin")!.subject).toContain("10024");
  });

  it("flera ordrar blir ETT mejl, inte ett per order", () => {
    const b = buildStuckOrdersEmail([order, { ...order, number: "10025" }], "https://x.se/admin")!;
    expect(b.subject).toContain("2");
    expect(b.text).toContain("10024");
    expect(b.text).toContain("10025");
  });

  it("returnerar null när inget sitter fast — vi spammar inte", () => {
    expect(buildStuckOrdersEmail([], "https://x.se/admin")).toBeNull();
  });

  it("en order utan läsbara rader säger det i klartext i stället för att se tom ut", () => {
    const b = buildStuckOrdersEmail(
      [{ number: "10026", reason: "ordern har inga orderrader — inget att skapa", items: [] }],
      "https://x.se/admin",
    )!;
    expect(b.text).toContain("inga orderrader");
  });

  it("escapar produktnamn — ett namn med < eller & får inte bryta mejlets HTML", () => {
    const b = buildStuckOrdersEmail(
      [{ ...order, items: [{ name: "Hylla <b>90</b> & co", quantity: 1 }] }],
      "https://x.se/admin",
    )!;
    expect(b.html).toContain("&lt;b&gt;");
    expect(b.html).not.toContain("<b>90</b>");
  });
});
