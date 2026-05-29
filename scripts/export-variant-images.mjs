// Återskapar data/variant-images.json från Fyndplats live-katalog.
//
// Storefronten visar per-variant-foton från denna statiska fil (se
// lib/products.ts / data/README.md). Filen är en ögonblicksbild — kör om detta
// skript när katalogens varianter eller variantbilder ändras.
//
// Användning:
//   WIX_API_TOKEN=<admin/site-API-key> node scripts/export-variant-images.mjs
//   (valfritt) WIX_SOURCE_SITE_ID=<site-id>   # default: Fyndplats V1-katalog
//   node scripts/export-variant-images.mjs --selftest   # kör enhetstest, inget nätverk
//
// Token behövs ENDAST här (exporten). Storefronten kräver ingen token — den läser
// den färdiga filen. Anonyma/publika Wix-API:t exponerar inte variant→bild-kopplingen,
// därför hämtar vi den autentiserat och bakar in den.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_SOURCE_SITE_ID = "8c62127f-c07a-4596-86b8-4e88b5cc502d"; // Fyndplats (publik site, ej hemlig)
const OUT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "variant-images.json");

const choiceImage = (c) =>
  (c && c.media && c.media.mainMedia && c.media.mainMedia.image && c.media.mainMedia.image.url) || null;

/**
 * Ren transform: råa v1-produkter → variant→bild-mappning.
 * Behåller endast optioner där minst ett val har en bild (storlek/modell-optioner
 * utan per-val-bild filtreras bort — pickern behöver dem inte).
 */
export function buildVariantImages(rawProducts) {
  const products = {};
  for (const p of rawProducts) {
    const options = (p.productOptions || [])
      .map((o) => ({
        name: o.name || "",
        choices: (o.choices || []).map((c) => ({ value: c.value || "", image: choiceImage(c) })),
      }))
      .filter((o) => o.choices.some((c) => c.image));
    if (!options.length) continue;
    products[p.slug || p.id] = { name: p.name || "", options };
  }
  return { products, productsWithVariantImages: Object.keys(products).length };
}

async function fetchAllProducts(token, siteId) {
  const all = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const res = await fetch("https://www.wixapis.com/stores-reader/v1/products/query", {
      method: "POST",
      headers: { Authorization: token, "wix-site-id": siteId, "Content-Type": "application/json" },
      body: JSON.stringify({ query: { paging: { limit, offset } }, includeVariants: true }),
    });
    if (!res.ok) throw new Error(`Wix query ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const page = data.products || [];
    all.push(...page);
    if (page.length < limit) break;
  }
  return all;
}

function selftest() {
  const fixture = [
    { slug: "imaged", name: "Imaged", productOptions: [{ name: "Färg", choices: [
      { value: "Röd", media: { mainMedia: { image: { url: "https://cdn/r.jpg" } } } },
      { value: "Blå", media: { mainMedia: { image: { url: "https://cdn/b.jpg" } } } },
    ] }] },
    { slug: "sizeonly", name: "Size only", productOptions: [{ name: "Storlek", choices: [
      { value: "S" }, { value: "M" },
    ] }] },
    { slug: "mixed", name: "Mixed", productOptions: [
      { name: "Färg", choices: [{ value: "Guld", media: { mainMedia: { image: { url: "https://cdn/g.jpg" } } } }] },
      { name: "Modell", choices: [{ value: "A" }, { value: "B" }] },
    ] },
  ];
  const { products, productsWithVariantImages } = buildVariantImages(fixture);
  const assert = (cond, msg) => { if (!cond) { console.error("SELFTEST FAIL:", msg); process.exit(1); } };
  assert(productsWithVariantImages === 2, `expected 2 products, got ${productsWithVariantImages}`);
  assert(products.imaged && products.imaged.options[0].choices.length === 2, "imaged: 2 choices");
  assert(products.imaged.options[0].choices[0].image === "https://cdn/r.jpg", "imaged: first image url");
  assert(!products.sizeonly, "sizeonly must be dropped (no images)");
  assert(products.mixed && products.mixed.options.length === 1 && products.mixed.options[0].name === "Färg",
    "mixed: keep only the imaged option (Färg), drop imageless Modell");
  console.log("SELFTEST OK");
}

async function main() {
  if (process.argv.includes("--selftest")) return selftest();
  const token = process.env.WIX_API_TOKEN;
  if (!token) {
    console.error("WIX_API_TOKEN saknas. Sätt en admin/site-API-key med Stores-läsbehörighet.\n" +
      "Ex: WIX_API_TOKEN=… node scripts/export-variant-images.mjs");
    process.exit(1);
  }
  const siteId = process.env.WIX_SOURCE_SITE_ID || DEFAULT_SOURCE_SITE_ID;
  const raw = await fetchAllProducts(token, siteId);
  const { products, productsWithVariantImages } = buildVariantImages(raw);
  const out = {
    _note:
      "Variant→bild-mappning för Fyndplats-katalogen, exporterad via autentiserat Wix-admin-API " +
      "(anonyma/publika Wix-API:t exponerar inte variant→bild-kopplingen). Storefronten läser denna " +
      "statiska fil för foto-väljaren. Nycklad per produkt-slug. Endast optioner där minst ett val har " +
      "en bild ingår. Återskapas med scripts/export-variant-images.mjs.",
    exportedAt: new Date().toISOString().slice(0, 10),
    sourceSite: `Fyndplats (${siteId})`,
    sourceCatalogVersion: "V1_CATALOG",
    totalProductsInSource: raw.length,
    productsWithVariantImages,
    products,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Skrev ${OUT_PATH}: ${raw.length} produkter i källan, ${productsWithVariantImages} med variantbilder.`);
}

// Kör bara när skriptet startas direkt — inte vid import (så buildVariantImages
// kan importeras/testas utan sidoeffekter).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
