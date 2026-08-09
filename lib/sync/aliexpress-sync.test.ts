import { buildStockBySupplierId, isUnsaleableError } from "./aliexpress-sync";
import { describe, expect, it } from "vitest";
import {
  ERROR_STRIKES_AS_REMOVED,
  classifyFetchError,
  decideSyncOutcome,
  projectedMarginAtPrice,
  resolveInventoryQuantities,
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

  it("nollar lagret men BEHÅLLER sidan publicerad när listningen är borttagen", () => {
    // SEO: att avpublicera gör URL:en till en 404 och kastar bort rankingen.
    const out = decideSyncOutcome(
      baseInputs({
        aliExpress: { title: "", images: [], minCostUsd: 0, totalStock: 0, listingRemoved: true },
      }),
    );
    expect(out.listingStatus).toBe("removed");
    expect(out.actionTaken).toBe("marked_oos");
    expect(out.shouldHide).toBe(false);
    expect(out.inventoryTarget).toBe(0);
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

  describe("lager-0 kräver bekräftelse (STOCK_ZERO_STRIKES_REQUIRED)", () => {
    const oosAe = { title: "x", images: [], minCostUsd: 10, totalStock: 0, listingRemoved: false };

    it("EN 0-läsning efter aktivt lager nollar INTE — behåller köpbar", () => {
      const out = decideSyncOutcome(
        baseInputs({
          prevState: { listingStatus: "active", currentStock: 10 } as never,
          aliExpress: oosAe,
          zeroStreak: 1,
        }),
      );
      expect(out.listingStatus).toBe("active");
      expect(out.actionTaken).toBe("none");
      // Kritiskt: rör INTE Wix-lagret (null = ändra inte) → produkten är kvar köpbar.
      expect(out.inventoryTarget).toBeNull();
      expect(out.justWentOos).toBe(false);
      expect(out.notes).toContain("1/2");
    });

    it("TVÅ 0-läsningar i rad bekräftar → marked_oos + nollar", () => {
      const out = decideSyncOutcome(
        baseInputs({
          prevState: { listingStatus: "active", currentStock: 10 } as never,
          aliExpress: oosAe,
          zeroStreak: 2,
        }),
      );
      expect(out.listingStatus).toBe("out_of_stock");
      expect(out.actionTaken).toBe("marked_oos");
      expect(out.inventoryTarget).toBe(0);
      expect(out.justWentOos).toBe(true);
    });

    it("redan slut (wasOos) förblir slut redan vid strike 1 — ingen om-bekräftelse", () => {
      const out = decideSyncOutcome(
        baseInputs({
          prevState: { listingStatus: "out_of_stock", currentStock: 0 } as never,
          aliExpress: oosAe,
          zeroStreak: 1,
        }),
      );
      expect(out.listingStatus).toBe("out_of_stock");
      expect(out.actionTaken).toBe("marked_oos");
      expect(out.inventoryTarget).toBe(0);
      expect(out.justWentOos).toBe(false);
    });

    it("utan zeroStreak (äldre anropare) nollar direkt — bakåtkompatibelt", () => {
      const out = decideSyncOutcome(
        baseInputs({
          prevState: { listingStatus: "active", currentStock: 10 } as never,
          aliExpress: oosAe,
        }),
      );
      expect(out.actionTaken).toBe("marked_oos");
      expect(out.inventoryTarget).toBe(0);
    });
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

describe("decideSyncOutcome — strike-guard mot transient borttagning (E#5)", () => {
  const removed = { title: "", images: [], minCostUsd: 0, totalStock: 0, listingRemoved: true };

  it("bekräftar DIREKT när removedStreak saknas (bakåtkompatibelt)", () => {
    const out = decideSyncOutcome(baseInputs({ aliExpress: removed }));
    expect(out.shouldHide).toBe(false);
    expect(out.actionTaken).toBe("marked_oos");
    expect(out.inventoryTarget).toBe(0);
    expect(out.listingStatus).toBe("removed");
  });

  it("rör inget vid strike 1 — väntar på bekräftelse", () => {
    const out = decideSyncOutcome(baseInputs({ aliExpress: removed, removedStreak: 1 }));
    expect(out.shouldHide).toBe(false);
    expect(out.actionTaken).toBe("none");
    expect(out.inventoryTarget).toBeNull();
    expect(out.listingStatus).toBe("active"); // prevState null → fallback, inte "removed"
  });

  it("nollar lagret vid strike 2 (REMOVED_STRIKES_REQUIRED) — men döljer aldrig", () => {
    const out = decideSyncOutcome(baseInputs({ aliExpress: removed, removedStreak: 2 }));
    expect(out.shouldHide).toBe(false);
    expect(out.inventoryTarget).toBe(0);
    expect(out.listingStatus).toBe("removed");
  });

  it("strike 1 behåller tidigare status (t.ex. out_of_stock)", () => {
    const out = decideSyncOutcome(
      baseInputs({
        aliExpress: removed,
        removedStreak: 1,
        prevState: { listingStatus: "out_of_stock" } as never,
      }),
    );
    expect(out.shouldHide).toBe(false);
    expect(out.listingStatus).toBe("out_of_stock");
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

describe("resolveInventoryQuantities (per-variant lager, ingen oversälj)", () => {
  const items = [{ variantId: "v-red" }, { variantId: "v-blue" }];
  const supplierByVariantId = new Map([
    ["v-red", "sku-red"],
    ["v-blue", "sku-blue"],
  ]);

  it("speglar per-variant-saldo individuellt", () => {
    const q = resolveInventoryQuantities(items, supplierByVariantId, 100, {
      "sku-red": 100,
      "sku-blue": 0,
    });
    expect(q.get("v-red")).toBe(100);
    expect(q.get("v-blue")).toBe(0);
  });

  it("nollar en variant vars SKU saknas i AE-svaret — INTE even-split", () => {
    // sku-blue droppad av AE (slutsåld variant) → blå ska bli 0, inte 50.
    const q = resolveInventoryQuantities(items, supplierByVariantId, 100, { "sku-red": 100 });
    expect(q.get("v-red")).toBe(100);
    expect(q.get("v-blue")).toBe(0);
  });

  it("ofraktbar variant tvingas till 0 trots leverantörslager (SucceBuy-fallet)", () => {
    const q = resolveInventoryQuantities(
      items,
      supplierByVariantId,
      100,
      { "sku-red": 26, "sku-blue": 15 },
      new Set(["v-red"]),
    );
    expect(q.get("v-red")).toBe(0); // 26 st hos AE men ingen fraktväg till SE
    expect(q.get("v-blue")).toBe(15);
  });

  it("target=0 nollar hela linjen", () => {
    const q = resolveInventoryQuantities(items, supplierByVariantId, 0, { "sku-red": 50 });
    expect(q.get("v-red")).toBe(0);
    expect(q.get("v-blue")).toBe(0);
  });

  it("faller tillbaka på even-split bara när per-variant-data helt saknas", () => {
    const q = resolveInventoryQuantities(items, supplierByVariantId, 10, {});
    expect(q.get("v-red")).toBe(5);
    expect(q.get("v-blue")).toBe(5);
  });

  it("even-split (inte mass-noll) när INGEN variant matchar svaret (inaktuell mappning)", () => {
    // Mappningens skuId:n finns inte i svaret → vi vet inget → even-split, inte 0.
    const q = resolveInventoryQuantities(items, supplierByVariantId, 8, { "sku-other": 8 });
    expect(q.get("v-red")).toBe(4);
    expect(q.get("v-blue")).toBe(4);
  });
});

describe("classifyFetchError — oklassade hämtningsfel fryser inte rotationen", () => {
  it("bumpar sviten och tolkar som borttagen först vid ERROR_STRIKES_AS_REMOVED", () => {
    expect(classifyFetchError(undefined)).toEqual({ errorStreak: 1, treatAsRemoved: false });
    expect(classifyFetchError(0)).toEqual({ errorStreak: 1, treatAsRemoved: false });
    expect(classifyFetchError(ERROR_STRIKES_AS_REMOVED - 2)).toEqual({
      errorStreak: ERROR_STRIKES_AS_REMOVED - 1,
      treatAsRemoved: false,
    });
    // Sedelräknar-fallet (13 juli): död listning med oigenkänt felsvar ska
    // till slut behandlas som borttagen så dölj-mekaniken tar över.
    expect(classifyFetchError(ERROR_STRIKES_AS_REMOVED - 1)).toEqual({
      errorStreak: ERROR_STRIKES_AS_REMOVED,
      treatAsRemoved: true,
    });
  });
});


describe("buildStockBySupplierId — nycklar på BÅDE sku_id och sku_attr (audit-fynd 3)", () => {
  it("attribut-strängs-mappningar matchar per-variant-lagret (ingen even-split)", () => {
    const map = buildStockBySupplierId([
      { skuId: "12000058218136832", skuAttr: "14:350853#39 Drawers;200007763:201336106", stock: 26 },
      { skuId: "12000058218136833", skuAttr: "14:10#40 Drawers;200007763:201336106", stock: 0 },
    ]);
    expect(map["12000058218136832"]).toBe(26);
    expect(map["14:350853#39 Drawers;200007763:201336106"]).toBe(26);
    expect(map["14:10#40 Drawers;200007763:201336106"]).toBe(0);
  });

  it("negativt/saknat lager blir 0; tomma nycklar hoppar", () => {
    const map = buildStockBySupplierId([{ skuId: "1", stock: -5 }, { skuAttr: "  ", stock: 9 }]);
    expect(map["1"]).toBe(0);
    expect(Object.keys(map)).toEqual(["1"]);
  });
});

describe("isUnsaleableError — 604 får aldrig driva auto-döljning (audit-fynd 1)", () => {
  it("matchar det skarpa felet", () => {
    expect(isUnsaleableError("AliExpress API-fel 604: All SKU Unsaleable")).toBe(true);
    expect(isUnsaleableError("all sku unsaleable")).toBe(true);
  });
  it("matchar inte vanliga fel eller 604 i produkt-id", () => {
    expect(isUnsaleableError("AliExpress API HTTP-fel: 502")).toBe(false);
    expect(isUnsaleableError("product 16042 not available")).toBe(false);
  });
});

describe("shouldRestore — synkens egen döljning kan ångras (audit-fynd 2)", () => {
  const base = {
    aliExpress: { title: "t", images: [], minCostUsd: 10, totalStock: 50, listingRemoved: false },
    currentPriceSek: 199,
    newTitleHash: "h1",
    newImageHash: "h2",
    pricing: { usdToSek: 10.5, vatRatePercent: 25, markup: 2.5 } as never,
    marginFloorPercent: 20,
  };
  const prevRemoved = {
    wixProductId: "p", aliexpressId: "a", currentCostSek: 100, currentCostUsd: 10,
    currentStock: 0, listingStatus: "removed" as const, titleHash: "h1", imageHash: "h2",
    lastCheckedAt: "2026-07-01T00:00:00.000Z",
  };

  it("dold AV SYNKEN (hiddenBySync) → restore trots visible=false", () => {
    const d = decideSyncOutcome({ ...base, prevState: prevRemoved, wixVisible: false, hiddenBySync: true });
    expect(d.shouldRestore).toBe(true);
  });

  it("MANUELLT dold (ingen hiddenBySync) → ingen restore (Leonards unpublish respekteras)", () => {
    const d = decideSyncOutcome({ ...base, prevState: prevRemoved, wixVisible: false, hiddenBySync: false });
    expect(d.shouldRestore).toBe(false);
    const d2 = decideSyncOutcome({ ...base, prevState: prevRemoved, wixVisible: false });
    expect(d2.shouldRestore).toBe(false);
  });

  it("synlig produkt med prev=removed → restore som förut", () => {
    const d = decideSyncOutcome({ ...base, prevState: prevRemoved, wixVisible: true });
    expect(d.shouldRestore).toBe(true);
  });
});
