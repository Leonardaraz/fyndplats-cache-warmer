import { describe, expect, it } from "vitest";
import {
  decideSyncOutcome,
  projectedMarginAtPrice,
  type SyncInputs,
} from "./aliexpress-sync";
import type { PricingConfig } from "../import/types";

const PRICING: PricingConfig = {
  usdToSek: 10,
  vatRatePercent: 25,
  markup: { multiplier: 2.5, fixedSek: 0 },
  rounding: "charm90",
};

function baseInputs(overrides: Partial<SyncInputs> = {}): SyncInputs {
  return {
    prevState: null,
    aliExpress: {
      title: "Test produkt",
      images: ["https://img/a.jpg", "https://img/b.jpg"],
      minCostUsd: 10,
      totalStock: 100,
      listingRemoved: false,
    },
    wixVisible: true,
    currentPriceSek: 299,
    newTitleHash: "title-hash-1",
    newImageHash: "img-hash-1",
    pricing: PRICING,
    marginFloorPercent: 20,
    ...overrides,
  };
}

describe("decideSyncOutcome", () => {
  it("flaggar inte första körningen (ingen prev state, inga ändringar att diffa)", () => {
    const out = decideSyncOutcome(baseInputs());
    expect(out.listingStatus).toBe("active");
    expect(out.actionTaken).toBe("none");
    expect(out.alert).toBeNull();
    expect(out.shouldHide).toBe(false);
  });

  it("döljer produkten när listningen är borttagen", () => {
    const out = decideSyncOutcome(
      baseInputs({
        aliExpress: { title: "", images: [], minCostUsd: 0, totalStock: 0, listingRemoved: true },
      }),
    );
    expect(out.listingStatus).toBe("removed");
    expect(out.actionTaken).toBe("hidden");
    expect(out.shouldHide).toBe(true);
  });

  it("markerar oos (men döljer inte) vid totalStock=0", () => {
    const out = decideSyncOutcome(
      baseInputs({
        aliExpress: { title: "x", images: [], minCostUsd: 10, totalStock: 0, listingRemoved: false },
      }),
    );
    expect(out.listingStatus).toBe("out_of_stock");
    expect(out.actionTaken).toBe("marked_oos");
    expect(out.shouldHide).toBe(false);
    expect(out.inventoryTarget).toBe(0);
  });

  it("flaggar prishöjning som hotar 20%-marginalen", () => {
    // Tidigare cost = 5 USD = 50 SEK. Nuvarande pris i Wix = 199 kr inkl. moms.
    // Netto = 199/1.25 = 159.2. Marginal vid 50 SEK kost = (159.2-50)/159.2 = 68%
    // Ny cost = 12 USD = 120 SEK. Marginal = (159.2-120)/159.2 = 24.6% → ok
    // Ny cost = 14 USD = 140 SEK. Marginal = (159.2-140)/159.2 ≈ 12% → flagga
    const out = decideSyncOutcome(
      baseInputs({
        prevState: {
          wixProductId: "p1",
          aliexpressId: "ae1",
          currentCostSek: 50,
          currentCostUsd: 5,
          currentStock: 20,
          listingStatus: "active",
          titleHash: "title-hash-1",
          imageHash: "img-hash-1",
          lastCheckedAt: new Date().toISOString(),
        },
        aliExpress: {
          title: "Test produkt",
          images: ["https://img/a.jpg", "https://img/b.jpg"],
          minCostUsd: 14,
          totalStock: 100,
          listingRemoved: false,
        },
        currentPriceSek: 199,
      }),
    );
    expect(out.actionTaken).toBe("flagged_price");
    expect(out.alert?.alertType).toBe("price_increase");
    expect(out.alert?.projectedMarginPct).toBeLessThan(20);
    expect(out.alert?.recommendedPriceSek).toBeGreaterThan(0);
    expect(out.alert?.newCostUsd).toBe(14);
    expect(out.alert?.prevCostUsd).toBe(5);
  });

  it("flaggar INTE prishöjning som håller marginalen över golvet", () => {
    const out = decideSyncOutcome(
      baseInputs({
        prevState: {
          wixProductId: "p1",
          aliexpressId: "ae1",
          currentCostSek: 50,
          currentCostUsd: 5,
          currentStock: 20,
          listingStatus: "active",
          titleHash: "title-hash-1",
          imageHash: "img-hash-1",
          lastCheckedAt: new Date().toISOString(),
        },
        aliExpress: {
          title: "Test produkt",
          images: ["https://img/a.jpg", "https://img/b.jpg"],
          minCostUsd: 6,
          totalStock: 100,
          listingRemoved: false,
        },
        currentPriceSek: 299,
      }),
    );
    expect(out.actionTaken).toBe("none");
    expect(out.alert).toBeNull();
  });

  it("flaggar innehållsändring när titel-hash skiljer", () => {
    const out = decideSyncOutcome(
      baseInputs({
        prevState: {
          wixProductId: "p1",
          aliexpressId: "ae1",
          currentCostSek: 100,
          currentCostUsd: 10,
          currentStock: 20,
          listingStatus: "active",
          titleHash: "old-title-hash",
          imageHash: "img-hash-1",
          lastCheckedAt: new Date().toISOString(),
        },
        newTitleHash: "new-title-hash",
      }),
    );
    expect(out.actionTaken).toBe("flagged_content");
    expect(out.alert?.alertType).toBe("content_change");
    expect(out.alert?.titleChanged).toBe(true);
    expect(out.alert?.imageChanged).toBe(false);
  });

  it("föredrar pris-alert över content-alert när båda triggar samtidigt", () => {
    const out = decideSyncOutcome(
      baseInputs({
        prevState: {
          wixProductId: "p1",
          aliexpressId: "ae1",
          currentCostSek: 50,
          currentCostUsd: 5,
          currentStock: 20,
          listingStatus: "active",
          titleHash: "old-title-hash",
          imageHash: "img-hash-1",
          lastCheckedAt: new Date().toISOString(),
        },
        aliExpress: {
          title: "Ny titel",
          images: ["https://img/a.jpg", "https://img/b.jpg"],
          minCostUsd: 14,
          totalStock: 100,
          listingRemoved: false,
        },
        currentPriceSek: 199,
        newTitleHash: "new-title-hash",
      }),
    );
    expect(out.alert?.alertType).toBe("price_increase");
  });

  it("föreslår restore när tidigare status var removed men nu är aktiv (och Wix-produkten är visible)", () => {
    const out = decideSyncOutcome(
      baseInputs({
        prevState: {
          wixProductId: "p1",
          aliexpressId: "ae1",
          currentCostSek: null,
          currentCostUsd: null,
          currentStock: 0,
          listingStatus: "removed",
          titleHash: null,
          imageHash: null,
          lastCheckedAt: new Date().toISOString(),
        },
        wixVisible: true,
      }),
    );
    expect(out.shouldRestore).toBe(true);
  });

  it("rör INTE Wix-visibility vid restore om produkten manuellt dolts", () => {
    const out = decideSyncOutcome(
      baseInputs({
        prevState: {
          wixProductId: "p1",
          aliexpressId: "ae1",
          currentCostSek: null,
          currentCostUsd: null,
          currentStock: 0,
          listingStatus: "removed",
          titleHash: null,
          imageHash: null,
          lastCheckedAt: new Date().toISOString(),
        },
        wixVisible: false, // Leonard har dolt manuellt
      }),
    );
    expect(out.shouldRestore).toBe(false);
  });

  it("sätter justWentOos när produkten flippar aktiv → slut (Feature 2)", () => {
    const out = decideSyncOutcome(
      baseInputs({
        prevState: {
          wixProductId: "p1",
          aliexpressId: "ae1",
          currentCostSek: 100,
          currentCostUsd: 10,
          currentStock: 20,
          listingStatus: "active",
          titleHash: "t",
          imageHash: "i",
          lastCheckedAt: new Date().toISOString(),
        },
        aliExpress: { title: "x", images: [], minCostUsd: 10, totalStock: 0, listingRemoved: false },
      }),
    );
    expect(out.actionTaken).toBe("marked_oos");
    expect(out.justWentOos).toBe(true);
    expect(out.justRestocked).toBe(false);
  });

  it("sätter INTE justWentOos på första observationen (prevState=null)", () => {
    const out = decideSyncOutcome(
      baseInputs({
        prevState: null,
        aliExpress: { title: "x", images: [], minCostUsd: 10, totalStock: 0, listingRemoved: false },
      }),
    );
    expect(out.justWentOos).toBe(false);
  });

  it("sätter INTE justWentOos om produkten redan var slut (ingen ny övergång)", () => {
    const out = decideSyncOutcome(
      baseInputs({
        prevState: {
          wixProductId: "p1",
          aliexpressId: "ae1",
          currentCostSek: 100,
          currentCostUsd: 10,
          currentStock: 0,
          listingStatus: "out_of_stock",
          titleHash: "t",
          imageHash: "i",
          lastCheckedAt: new Date().toISOString(),
        },
        aliExpress: { title: "x", images: [], minCostUsd: 10, totalStock: 0, listingRemoved: false },
      }),
    );
    expect(out.justWentOos).toBe(false);
  });

  it("sätter justRestocked när produkten kommer tillbaka i lager (Feature 1)", () => {
    const out = decideSyncOutcome(
      baseInputs({
        prevState: {
          wixProductId: "p1",
          aliexpressId: "ae1",
          currentCostSek: 100,
          currentCostUsd: 10,
          currentStock: 0,
          listingStatus: "out_of_stock",
          // Samma hashar som baseInputs default → ingen content-change-flagga,
          // så vi isolerar restored-utfallet.
          titleHash: "title-hash-1",
          imageHash: "img-hash-1",
          lastCheckedAt: new Date().toISOString(),
        },
        aliExpress: {
          title: "Test produkt",
          images: ["https://img/a.jpg", "https://img/b.jpg"],
          minCostUsd: 10,
          totalStock: 50,
          listingRemoved: false,
        },
      }),
    );
    expect(out.justRestocked).toBe(true);
    expect(out.justWentOos).toBe(false);
    expect(out.actionTaken).toBe("restored");
  });
});

describe("projectedMarginAtPrice", () => {
  it("räknar netto-marginal korrekt med moms", () => {
    // grossSek = 250 inkl. 25% moms → netto = 200. Cost = 100. Marg = 50%.
    expect(projectedMarginAtPrice(250, 100, 25)).toBeCloseTo(50, 1);
  });

  it("returnerar 0 vid 0-pris", () => {
    expect(projectedMarginAtPrice(0, 50, 25)).toBe(0);
  });

  it("returnerar negativ marginal när kost > netto-revenue", () => {
    expect(projectedMarginAtPrice(125, 200, 25)).toBeLessThan(0);
  });
});
