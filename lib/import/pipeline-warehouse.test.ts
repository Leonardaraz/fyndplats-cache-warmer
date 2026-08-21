// EU-lager-löftet sett FRÅN IMPORTPRODUCT.
//
// ship-axis.test.ts bevisar att collapseShipFromAxis väljer rätt lager. Det här
// beviser vad vi SÄGER om valet: att ribbonen, hasEuWarehouse och
// warehouseClass beskriver de SKU:er vi faktiskt sparat — inte listningens
// samlade utbud.
//
// Bakgrund (revisionen 2026-08-21): tretton nyimporterade utkast bar
// "EU-lager"-ribbon med shipsFromCountries som ES/FR/GB/PL/RU/US, och ingen
// kunde säga vilket lager den sparade SKU:n låg i. Orsaken satt i aggregeringen:
// den summerade ALLA skrapade varianter plus produktens egen lista, alltså
// listningen. Och eftersom pickWarehouse rankar SALDO före EU behåller den ett
// kinesiskt lager framför ett tomt spanskt — varpå ribbonen lovade EU-leverans
// på en vara som skickas från Kina.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AliExpressProduct, PricingRules } from "./types";

const { createProduct } = vi.hoisted(() => ({
  createProduct: vi.fn(
    async (input: {
      slug?: string;
      visible?: boolean;
      ribbonName?: string;
      variants?: { sku: string }[];
    }) => ({
      id: "wix-prod-1",
      slug: input.slug || "produkt",
      revision: "1",
      variants: (input.variants ?? []).map((v, i) => ({ id: `v${i}`, sku: v.sku })),
    }),
  ),
}));
const { getProduct } = vi.hoisted(() => ({ getProduct: vi.fn() }));

vi.mock("../wix/client", () => ({
  createProduct,
  getCollections: vi.fn(async () => []),
  addProductToCollection: vi.fn(async () => undefined),
  linkChoiceMedia: vi.fn(async () => 0),
}));
vi.mock("../aliexpress/client", () => ({ getProduct }));
vi.mock("../wix/media", () => ({
  importMediaUrls: vi.fn(async (items: { url: string }[]) =>
    items.map((it, i) => ({ url: it.url, id: `m${i}` })),
  ),
  importMediaByUrl: vi.fn(async (url: string) => ({ url, id: "x" })),
}));
vi.mock("../audit", () => ({ audit: vi.fn(async () => undefined) }));

import { importProduct } from "./pipeline";

const RULES: PricingRules = {
  usdToSek: 10,
  vatRatePercent: 25,
  defaultMultiplier: 2,
  fixedSurchargeSek: 0,
  categoryMultipliers: {},
  tiersEnabled: false,
  tiers: [],
  rounding: "none",
};

/**
 * Samma vara i två lager. `esStock`/`cnStock` styr vilket pickWarehouse
 * behåller: saldo väger tyngre än EU, så ett tomt spanskt lager förlorar mot
 * ett fyllt kinesiskt.
 *
 * `shipsFrom` på produkten är listningens samlade utbud — precis det som förr
 * läckte in i kundlöftet.
 */
function tvaLager(esStock: number, cnStock: number): AliExpressProduct {
  return {
    supplierProductId: "1005099000000001",
    sourceUrl: "https://www.aliexpress.com/item/1005099000000001.html",
    rawTitle: "Mjolkskummare med avtagbar bas",
    rawDescription: "Mjolkskummare i rostfritt stal med avtagbar bas.",
    imageUrls: ["https://img.example/1.jpg"],
    shipsFrom: ["ES", "CN"],
    variants: [
      {
        supplierVariantId: "sku-es",
        options: { "Färg": "Vit", "Ships From": "Spain" },
        costUsd: 10,
        stock: esStock,
        included: true,
      },
      {
        supplierVariantId: "sku-cn",
        options: { "Färg": "Vit", "Ships From": "China" },
        costUsd: 10,
        stock: cnStock,
        included: true,
      },
    ],
    specifications: {},
    packageContents: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.IMPORT_DRAFT_DEFAULT;
  delete process.env.FYNDPLATS_EU_COUNTRIES;
  // DS-uppslaget används här bara för swatch-bilder och prisavstämning; ett tomt
  // men giltigt svar räcker. Lagervalet är rent deterministiskt ur skrapans data.
  getProduct.mockResolvedValue({ productId: "1005099000000001", variants: [] });
});
afterEach(() => vi.clearAllMocks());

describe("importProduct — EU-lager-löftet beskriver den sparade SKU:n", () => {
  // REGRESSIONEN. Före fixen gav den här produkten hasEuWarehouse:true och
  // "EU-lager"-ribbon, eftersom "ES" fanns i listningen — trots att den enda
  // variant vi sparat skickas från Kina.
  it("lovar INTE EU när det spanska lagret var tomt och Kina vann", async () => {
    const r = await importProduct(tvaLager(0, 25), RULES, undefined, { enableAI: false });

    expect(r.shipsFromCountries).toEqual(["CN"]);
    expect(r.hasEuWarehouse).toBe(false);
    expect(r.warehouseClass).toBe("CN");
    expect(createProduct.mock.calls[0][0].ribbonName).toBeUndefined();
  });

  // Motvikten: när EU-lagret HAR saldo behålls det, och då ska löftet stå kvar.
  it("lovar EU när det spanska lagret hade saldo", async () => {
    const r = await importProduct(tvaLager(12, 25), RULES, undefined, { enableAI: false });

    expect(r.shipsFromCountries).toEqual(["ES"]);
    expect(r.hasEuWarehouse).toBe(true);
    expect(r.warehouseClass).toBe("EU");
    expect(createProduct.mock.calls[0][0].ribbonName).toBe("EU-lager");
  });

  it("sparar lagerlandet per mappningsrad så frågan går att besvara i efterhand", async () => {
    const r = await importProduct(tvaLager(0, 25), RULES, undefined, { enableAI: false });

    expect(r.variantMappings).toHaveLength(1);
    expect(r.variantMappings[0].shipFrom).toBe("CN");
    expect(r.variantMappings[0].supplierVariantId).toBe("sku-cn");
  });

  // Ett enda lager → collapseShipFromAxis returnerar tidigt utan att sätta
  // shipFrom per variant. Då är produktens egen lista det enda vi har, och den
  // fallbacken måste finnas kvar — annars blir varje sådan produkt UNKNOWN.
  it("faller tillbaka på produktens lista när listningen bara har ett lager", async () => {
    const enLager: AliExpressProduct = {
      supplierProductId: "1005099000000002",
      sourceUrl: "https://www.aliexpress.com/item/1005099000000002.html",
      rawTitle: "Kaffekvarn med konisk malskiva",
      rawDescription: "Kaffekvarn i rostfritt stal.",
      imageUrls: ["https://img.example/2.jpg"],
      shipsFrom: ["ES"],
      variants: [
        {
          supplierVariantId: "sku-1",
          options: { "Färg": "Svart" },
          costUsd: 10,
          stock: 5,
          included: true,
        },
      ],
      specifications: {},
      packageContents: [],
    };

    const r = await importProduct(enLager, RULES, undefined, { enableAI: false });

    expect(r.shipsFromCountries).toEqual(["ES"]);
    expect(r.hasEuWarehouse).toBe(true);
    expect(r.warehouseClass).toBe("EU");
  });
});
