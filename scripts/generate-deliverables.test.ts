// Genererar leverabler för Leonard (kör med GEN_DELIVERABLES=1):
//   GEN_DELIVERABLES=1 npx vitest run scripts/generate-deliverables.test.ts
//
// Skriver till deliverables/:
//   - oos-alert-email.html   — fullt renderat real-tids-mejl (brand-shell)
//   - restock-email.html      — kund-mejl "tillbaka i lager"
//   - alternatives-sample.json — alternativ-pipelinens output för en produkt
//
// Mejlen renderas av exakt samma rena funktioner som produktionen använder.
// Alternativ-JSON:en kör samma genericize→rank→enrich-steg som
// findAlternativeSuppliers; poängen är här satta för hand (Haiku-scoring kräver
// nätverk/credits som inte finns i denna miljö) och markeras därför tydligt.
//
// I normala test-körningar (utan GEN_DELIVERABLES) är detta ett no-op-test.

import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildOosAlertEmail,
  buildRestockNotificationEmail,
  wrapInBrandShell,
} from "../lib/email/resend";
import {
  genericizeQuery,
  filterAndRank,
  buildImportUrl,
  type AlternativeSupplier,
} from "../lib/aliexpress/alternatives";
import type { AliExpressSearchResult } from "../lib/aliexpress/client";

const OUT = resolve(__dirname, "..", "deliverables");
const BASE_URL = "https://fyndplats-cache-warmer.vercel.app";
const USD_TO_SEK = 10.5;
const ORIGINAL_ID = "1005006001234567";
const ORIGINAL_NAME =
  "🔥HOT 2024 New Smart Body Fat Scale Wireless Bluetooth Digital Weight Scale Free Shipping";

// Representativt AliExpress text.search-svar (orders,desc) för den generiska
// frågan. Speglar fälterna mapNewSearchProduct/mapSearchProduct producerar.
const SEARCH_RESULTS: AliExpressSearchResult[] = [
  {
    productId: ORIGINAL_ID, // originalet — ska filtreras bort
    title: ORIGINAL_NAME,
    priceUsd: 21,
    productUrl: `https://www.aliexpress.com/item/${ORIGINAL_ID}.html`,
    orders: 1200,
    imageUrl: "https://ae01.alicdn.com/kf/orig.jpg",
    shipsFromCountries: ["CN"],
    warehouseClass: "CN",
  },
  {
    productId: "1005007002000001",
    title: "Smart Body Fat Scale Bluetooth Digital Bathroom Weighing Scale BMI",
    priceUsd: 18.9,
    productUrl: "https://www.aliexpress.com/item/1005007002000001.html",
    orders: 5400,
    imageUrl: "https://ae01.alicdn.com/kf/altB.jpg",
    shipsFromCountries: ["ES"],
    warehouseClass: "EU",
  },
  {
    productId: "1005007002000002",
    title: "Wireless Smart Scale Body Composition Analyzer Fat BMI 13 Metrics",
    priceUsd: 20.5,
    productUrl: "https://www.aliexpress.com/item/1005007002000002.html",
    orders: 3100,
    imageUrl: "https://ae01.alicdn.com/kf/altC.jpg",
    shipsFromCountries: ["CN"],
    warehouseClass: "CN",
  },
  {
    productId: "1005007002000003",
    title: "Mini Digital Bluetooth Body Fat Scale High Precision EU Warehouse",
    priceUsd: 17.95,
    productUrl: "https://www.aliexpress.com/item/1005007002000003.html",
    orders: 2750,
    imageUrl: "https://ae01.alicdn.com/kf/altD.jpg",
    shipsFromCountries: ["CZ", "PL"],
    warehouseClass: "EU",
  },
  {
    productId: "1005007002000004",
    title: "Kitchen Food Scale Stainless Steel 10kg", // sämre match
    priceUsd: 9.5,
    productUrl: "https://www.aliexpress.com/item/1005007002000004.html",
    orders: 8800,
    imageUrl: "https://ae01.alicdn.com/kf/altE.jpg",
    shipsFromCountries: ["CN"],
    warehouseClass: "CN",
  },
];

// Hand-satta poäng som representerar vad Haiku skulle ge (markeras i reason).
const HANDSCORE: Record<string, { score: number; reason: string }> = {
  "1005007002000001": { score: 92, reason: "Samma typ av smart kroppsfettsvåg, EU-lager." },
  "1005007002000003": { score: 86, reason: "Bluetooth-fettvåg, EU-lager — bra ersättare." },
  "1005007002000002": { score: 83, reason: "Smart kroppsanalys-våg, liknande funktioner." },
  "1005007002000004": { score: 18, reason: "Köksvåg — fel produktkategori." },
};

describe("generate-deliverables", () => {
  it("renderar leverabler när GEN_DELIVERABLES=1", () => {
    if (process.env.GEN_DELIVERABLES !== "1") {
      // No-op i normala körningar.
      expect(true).toBe(true);
      return;
    }

    mkdirSync(OUT, { recursive: true });

    // --- Alternativ-pipeline (Feature 3) ---------------------------------
    const query = genericizeQuery(ORIGINAL_NAME);
    const ranked = filterAndRank(SEARCH_RESULTS, { excludeProductId: ORIGINAL_ID, topN: 5 });
    const alternatives: AlternativeSupplier[] = ranked
      .map((r) => {
        const hs = HANDSCORE[r.productId] ?? { score: 0, reason: "" };
        return {
          aliexpressId: r.productId,
          title: r.title,
          priceUsd: r.priceUsd,
          priceSek: r.priceUsd !== undefined ? Math.round(r.priceUsd * USD_TO_SEK) : undefined,
          imageUrl: r.imageUrl,
          productUrl: r.productUrl ?? `https://www.aliexpress.com/item/${r.productId}.html`,
          orders: r.orders,
          shipsFromCountries: r.shipsFromCountries ?? [],
          warehouseClass: r.warehouseClass ?? "UNKNOWN",
          score: hs.score,
          scoreReason: hs.reason,
          importUrl: buildImportUrl(
            BASE_URL,
            r.productUrl ?? `https://www.aliexpress.com/item/${r.productId}.html`,
            ORIGINAL_ID,
          ),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    writeFileSync(
      resolve(OUT, "alternatives-sample.json"),
      JSON.stringify(
        {
          _note:
            "Output från findAlternativeSuppliers-pipelinen. genericize+rank+enrich är produktionskod; score är hand-satt här (Haiku-scoring kräver nätverk/credits som saknas i genereringsmiljön).",
          originalProductId: ORIGINAL_ID,
          originalName: ORIGINAL_NAME,
          genericQuery: query,
          alternatives,
        },
        null,
        2,
      ),
      "utf8",
    );

    // --- Real-tids-OOS-mejl (Feature 2 + 3) ------------------------------
    const oos = buildOosAlertEmail({
      productName: "Smart Kroppsfettsvåg Bluetooth",
      imageUrl: "https://ae01.alicdn.com/kf/orig.jpg",
      aliexpressUrl: `https://www.aliexpress.com/item/${ORIGINAL_ID}.html`,
      sales30d: 27,
      alternatives,
      alertsUrl: `${BASE_URL}/admin/sync-alerts`,
    });
    writeFileSync(resolve(OUT, "oos-alert-email.html"), wrapInBrandShell(oos.html), "utf8");
    writeFileSync(resolve(OUT, "oos-alert-email.subject.txt"), oos.subject, "utf8");
    writeFileSync(resolve(OUT, "oos-alert-email.txt"), oos.text, "utf8");

    // --- Restock-mejl (Feature 1) ----------------------------------------
    const restock = buildRestockNotificationEmail({
      productName: "Smart Kroppsfettsvåg Bluetooth",
      productUrl: "https://fyndplats.se/produkt/smart-kroppsfettsvag-bluetooth",
      imageUrl: "https://ae01.alicdn.com/kf/orig.jpg",
    });
    writeFileSync(resolve(OUT, "restock-email.html"), wrapInBrandShell(restock.html), "utf8");

    expect(alternatives.length).toBe(3);
    expect(alternatives[0].score).toBeGreaterThan(alternatives[2].score);
  });
});
