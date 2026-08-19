// Backfill av recensioner för redan importerade produkter.
//
//   node scripts/backfill-reviews.mjs reviews.json [https://din-cache-warmer.vercel.app]
//
// reviews.json = array av objekt, ett per produkt:
//   [
//     {
//       "sourceUrl": "https://www.aliexpress.com/item/100500....html",
//       // ELLER "supplierProductId": "100500...", ELLER "wixProductId": "...",
//       "reviews": [
//         { "rating": 5, "text": "...", "hasImage": true, "customerCountry": "DE",
//           "date": "2026-05-20", "reviewIdAE": "abc" }
//       ]
//     }
//   ]
//
// Recensionerna kommer typiskt från tilläggets scrapeReviews() (kör EXTRACT_PRODUCT
// på varje produktsida och spara result.reviewsToImport tillsammans med sourceUrl).
// Servern filtrerar/rankar/översätter och dedupar mot redan sparade recensioner.
//
// Läser EXTENSION_API_TOKEN (eller API_TOKEN) från .env.local. API-bas anges som
// argv[3] eller env API_BASE.

import { readFileSync } from "node:fs";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const file = process.argv[2];
const apiBase = (process.argv[3] || process.env.API_BASE || env.API_BASE || "").replace(/\/$/, "");
const token = process.env.EXTENSION_API_TOKEN || env.EXTENSION_API_TOKEN || env.API_TOKEN;

if (!file) { console.error("Användning: node scripts/backfill-reviews.mjs reviews.json [api-base]"); process.exit(1); }
if (!apiBase) { console.error("Saknar API-bas (argv[3] eller API_BASE)."); process.exit(1); }
if (!token) { console.error("Saknar EXTENSION_API_TOKEN i .env.local."); process.exit(1); }

const items = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(items)) { console.error("reviews.json måste vara en array."); process.exit(1); }

let totalImported = 0;
let failed = 0;

for (const [i, item] of items.entries()) {
  const ref = item.wixProductId || item.supplierProductId || item.sourceUrl || `#${i}`;
  if (!Array.isArray(item.reviews) || item.reviews.length === 0) {
    console.log(`[skip] ${ref} — inga recensioner`);
    continue;
  }
  try {
    const res = await fetch(`${apiBase}/api/reviews/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fyndplats-token": token },
      body: JSON.stringify({
        wixProductId: item.wixProductId,
        supplierProductId: item.supplierProductId,
        sourceUrl: item.sourceUrl,
        reviews: item.reviews,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      failed++;
      console.log(`[fail] ${ref} → HTTP ${res.status}: ${data.message || data.error || ""}`);
      continue;
    }
    totalImported += data.imported || 0;
    console.log(
      `[ok]   ${ref} → ${data.imported} importerade, ${data.skippedExisting} redan fanns`,
    );
  } catch (err) {
    failed++;
    console.log(`[fail] ${ref} → ${err}`);
  }
}

console.log(`\nKlart: ${totalImported} recensioner sparade som pending (översätts i chatten), ${failed} produkter med fel.`);
process.exit(failed > 0 ? 1 : 0);
