// A/B-harness för premium-läget: kör generering på stickprovsprodukter och visar
// kvalitets-judgens betyg + kostnadsuppskattning per läge.
//
// Kör (kräver riktiga API-nycklar — kostar Anthropic-credits, bara när DU väljer det):
//   ANTHROPIC_API_KEY=... npx tsx scripts/premium-ab-test.ts
//   ANTHROPIC_API_KEY=... npx tsx scripts/premium-ab-test.ts --standard   # kör även standard för jämförelse
//
// Acceptanskriterium: judge-score 9+ (mål 9,5+). Inga Wix-anrop görs (kollektioner=[]).

import { generatePremiumContent } from "../lib/import/premium-pipeline.ts";
import { generateProductContent } from "../lib/import/generate.ts";
import { estimatedCostOre } from "../lib/import/quality-mode.ts";
import type { AliExpressProduct } from "../lib/import/types.ts";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "\nSaknar ANTHROPIC_API_KEY. Premium-A/B kräver riktiga Anthropic-credits.\n" +
      "Kör:  ANTHROPIC_API_KEY=sk-... npx tsx scripts/premium-ab-test.ts\n",
  );
  process.exit(1);
}

const alsoStandard = process.argv.includes("--standard");

const SAMPLES: AliExpressProduct[] = [
  {
    supplierProductId: "AB-1",
    sourceUrl: "https://www.aliexpress.com/item/1.html",
    rawTitle: "Natural Jade Gua Sha Scraper Board Facial Massage Tool Skin Care",
    rawDescription:
      "100% natural jade gua sha tool for face massage, lymphatic drainage, reduce puffiness, promote blood circulation. Smooth edges, comfortable to hold.",
    imageUrls: ["https://img/1a.jpg", "https://img/1b.jpg", "https://img/1c.jpg"],
    variants: [{ supplierVariantId: "1", options: { Color: "Green" }, costUsd: 1.8, included: true }],
    specifications: { Material: "Natural Jade", Size: "7x5cm", Weight: "55g" },
    features: ["Lymphatic drainage", "Reduces puffiness", "Three contoured edges"],
    packageContents: ["1 x Gua Sha"],
  },
  {
    supplierProductId: "AB-2",
    sourceUrl: "https://www.aliexpress.com/item/2.html",
    rawTitle: "Jade Roller Face Massager Double Head Anti Aging Skin Care Tool",
    rawDescription:
      "Dual-ended jade roller for face and eye area. Cool stone, helps serum absorption, reduces puffiness. Quiet, sturdy frame.",
    imageUrls: ["https://img/2a.jpg", "https://img/2b.jpg"],
    variants: [{ supplierVariantId: "1", options: { Color: "Green" }, costUsd: 2.2, included: true }],
    specifications: { Material: "Natural Jade", "Roller heads": "2 (large + small)" },
    features: ["Cooling stone", "Dual heads", "Helps serum absorption"],
    packageContents: ["1 x Jade Roller"],
  },
  {
    supplierProductId: "AB-3",
    sourceUrl: "https://www.aliexpress.com/item/3.html",
    rawTitle: "LED Motion Sensor Night Light USB Rechargeable Magnetic Wireless Lamp",
    rawDescription:
      "Wireless LED light with motion sensor, auto on/off, warm light, USB rechargeable, magnetic mount. For hallway, closet, stairs, kitchen.",
    imageUrls: ["https://img/3a.jpg", "https://img/3b.jpg", "https://img/3c.jpg", "https://img/3d.jpg"],
    variants: [{ supplierVariantId: "1", options: { Color: "White" }, costUsd: 3.5, included: true }],
    specifications: { Light: "Warm white", Battery: "1200mAh", Charging: "USB-C", "Auto-off": "~15s" },
    features: ["Motion sensor", "Rechargeable", "Magnetic mount", "Warm light"],
    packageContents: ["1 x LED Light", "1 x Metal plate", "1 x USB cable"],
  },
  {
    supplierProductId: "AB-4",
    sourceUrl: "https://www.aliexpress.com/item/4.html",
    rawTitle: "Portable Bluetooth Speaker Waterproof Wireless Subwoofer Outdoor Bass",
    rawDescription:
      "Mini waterproof Bluetooth speaker, strong bass, 8h battery, IPX7, TWS pairing. For outdoor, shower, travel.",
    imageUrls: ["https://img/4a.jpg", "https://img/4b.jpg", "https://img/4c.jpg"],
    variants: [{ supplierVariantId: "1", options: { Color: "Black" }, costUsd: 6.9, included: true }],
    specifications: { Battery: "8h", Waterproof: "IPX7", Bluetooth: "5.3", Output: "10W" },
    features: ["IPX7 waterproof", "TWS pairing", "8h battery"],
    packageContents: ["1 x Speaker", "1 x USB cable"],
  },
  {
    supplierProductId: "AB-5",
    sourceUrl: "https://www.aliexpress.com/item/5.html",
    rawTitle: "Stainless Steel Garlic Press Crusher Mincer Kitchen Gadget Ergonomic",
    rawDescription:
      "Heavy-duty stainless steel garlic press, ergonomic handle, easy to clean, crushes with skin on. Dishwasher safe.",
    imageUrls: ["https://img/5a.jpg", "https://img/5b.jpg"],
    variants: [{ supplierVariantId: "1", options: { Color: "Silver" }, costUsd: 2.4, included: true }],
    specifications: { Material: "304 Stainless Steel", "Dishwasher safe": "Yes" },
    features: ["Ergonomic handle", "Crushes with skin on", "Easy to clean"],
    packageContents: ["1 x Garlic Press"],
  },
];

function bar(score: number): string {
  const n = Math.round(score);
  return "█".repeat(n) + "░".repeat(10 - n);
}

async function main() {
  console.log(`\n=== Premium A/B — ${SAMPLES.length} stickprovsprodukter ===\n`);
  const scores: number[] = [];
  let passed = 0;

  for (const p of SAMPLES) {
    const t0 = Date.now();
    const r = await generatePremiumContent(p, [], {});
    const ms = Date.now() - t0;
    scores.push(r.quality.score);
    if (r.quality.passed) passed++;
    console.log(
      `${r.quality.passed ? "✅" : "⚠️ "} ${bar(r.quality.score)} ${r.quality.score.toFixed(1)}/10  ` +
        `${r.refined ? "(förfinad) " : ""}${ms}ms  "${r.content.seo.title}"`,
    );
    if (!r.quality.passed) console.log(`     feedback: ${r.quality.feedback.slice(0, 120)}`);

    if (alsoStandard) {
      const std = await generateProductContent(p, []);
      console.log(`     [standard] "${std.seo.title}" (${std.tabs.faq.length} FAQ)`);
    }
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  console.log(`\n=== Resultat ===`);
  console.log(`Snittbetyg: ${avg.toFixed(2)}/10   Godkända (≥tröskel): ${passed}/${SAMPLES.length}`);
  console.log(`Lägsta: ${Math.min(...scores).toFixed(1)}   Högsta: ${Math.max(...scores).toFixed(1)}`);

  console.log(`\n=== Kostnadsuppskattning per läge (öre/produkt) ===`);
  console.log(`  raw:      ${estimatedCostOre("raw")} öre`);
  console.log(`  standard: ${estimatedCostOre("standard")} öre`);
  console.log(`  premium:  ${estimatedCostOre("premium")} öre`);
  console.log(`Faktisk per-anrops-kostnad bokförs per op i /admin/llm-usage ` + `(premiumDraft/Critique/Rewrite/Faq/ImageRank/SeoMeta/qualityJudge).\n`);

  if (avg < 9) {
    console.error("⚠️  Snittbetyg < 9 — granska prompterna/guldexemplen innan utrullning.");
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("A/B-körning failade:", err);
  process.exit(1);
});
