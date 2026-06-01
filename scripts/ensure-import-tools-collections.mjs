// Skapar Wix Data-kollektionerna som import-verktygets nya features behöver, om
// de saknas. Idempotent (hoppar över befintliga). Kör en gång:
//
//   node scripts/ensure-import-tools-collections.mjs
//
//   • FyndplatsProductHashes        — Feature 1 (dubblett-detektor): pHash + AE-id per produkt.
//   • FyndplatsCompetitorPriceCache — Feature 2 (konkurrentpris): 7-dagars cache per sökfråga.
//
// Wix Data är schematolerant (extra/nästlade fält lagras även om de inte
// deklareras här — precis som FyndplatsMappings lagrar nästlade variants). Vi
// deklarerar därför bara nyckelfälten. Läser WIX_API_TOKEN + WIX_SITE_ID från .env.local.

import { readFileSync } from "node:fs";

function loadEnv() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const TOKEN = env.WIX_API_TOKEN;
const SITE = env.WIX_SITE_ID;
if (!TOKEN) {
  console.error("WIX_API_TOKEN saknas i .env.local");
  process.exit(1);
}

const headers = {
  Authorization: TOKEN,
  "Content-Type": "application/json",
  ...(SITE ? { "wix-site-id": SITE } : {}),
};

const COLLECTIONS = [
  {
    id: env.WIX_DATA_COL_PRODUCT_HASHES || "FyndplatsProductHashes",
    displayName: "Fyndplats Product Hashes",
    fields: [
      { key: "wixProductId", displayName: "Wix Product Id", type: "TEXT" },
      { key: "productName", displayName: "Product Name", type: "TEXT" },
      { key: "phash", displayName: "Perceptual Hash", type: "TEXT" },
      { key: "aeProductId", displayName: "AliExpress Product Id", type: "TEXT" },
      { key: "imageUrl", displayName: "Image URL", type: "TEXT" },
      { key: "slug", displayName: "Slug", type: "TEXT" },
      { key: "updatedAt", displayName: "Updated At", type: "TEXT" },
    ],
  },
  {
    id: env.WIX_DATA_COL_COMPETITOR_CACHE || "FyndplatsCompetitorPriceCache",
    displayName: "Fyndplats Competitor Price Cache",
    fields: [
      { key: "key", displayName: "Query SHA-256", type: "TEXT" },
      { key: "query", displayName: "Search Query", type: "TEXT" },
      { key: "prices", displayName: "Prices JSON", type: "OBJECT" },
      { key: "fetchedAt", displayName: "Fetched At", type: "TEXT" },
      { key: "expiresAt", displayName: "Expires At", type: "TEXT" },
    ],
  },
];

async function ensure(spec) {
  const getRes = await fetch(
    `https://www.wixapis.com/wix-data/v2/collections/${encodeURIComponent(spec.id)}`,
    { headers },
  );
  if (getRes.status === 200) {
    console.log(`[skip] ${spec.id} finns redan.`);
    return true;
  }
  if (getRes.status !== 404) {
    console.log(`[warn] ${spec.id} kontroll → HTTP ${getRes.status}: ${(await getRes.text()).slice(0, 300)}`);
  }
  const res = await fetch("https://www.wixapis.com/wix-data/v2/collections", {
    method: "POST",
    headers,
    body: JSON.stringify({ collection: spec }),
  });
  const ok = res.status >= 200 && res.status < 300;
  console.log(`[create] ${spec.id} → HTTP ${res.status} ${ok ? "OK" : (await res.text()).slice(0, 300)}`);
  return ok;
}

let allOk = true;
for (const spec of COLLECTIONS) {
  if (!(await ensure(spec))) allOk = false;
}
process.exit(allOk ? 0 : 1);
