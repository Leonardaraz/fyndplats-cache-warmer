import { describe, expect, it } from "vitest";
import {
  buildOosAlertEmail,
  buildRestockNotificationEmail,
  buildDailySummaryEmail,
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

describe("buildRestockNotificationEmail", () => {
  it("bygger kund-mejl med produktlänk", () => {
    const email = buildRestockNotificationEmail({
      productName: "Smart Kroppsvåg",
      productUrl: "https://fyndplats.se/produkt/smart-kroppsvag",
      imageUrl: "https://img/x.jpg",
    });
    expect(email.subject).toBe("Tillbaka i lager: Smart Kroppsvåg");
    expect(email.html).toContain("Visa produkten");
    expect(email.html).toContain("https://fyndplats.se/produkt/smart-kroppsvag");
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
