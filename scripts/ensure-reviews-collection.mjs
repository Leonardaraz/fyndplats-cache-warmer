// Skapar Wix Data-kollektionerna för recensions-importen om de saknas (idempotent).
//
//   node scripts/ensure-reviews-collection.mjs
//
// Kollektioner:
//   - FyndplatsImportedReviews   (importerade AliExpress-recensioner, svensk text)
//   - FyndplatsTranslationUsage  (kumulativ DeepL-teckenanvändning per månad)
//
// Läser WIX_API_TOKEN + WIX_SITE_ID från .env.local. Admin-only-åtkomst.

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
if (!TOKEN) { console.error("WIX_API_TOKEN saknas i .env.local"); process.exit(1); }

const headers = {
  Authorization: TOKEN,
  "Content-Type": "application/json",
  ...(SITE ? { "wix-site-id": SITE } : {}),
};

const COLLECTIONS = [
  {
    id: "FyndplatsImportedReviews",
    displayName: "Fyndplats Imported Reviews",
    fields: [
      { key: "productId", displayName: "Product ID", type: "TEXT" },
      { key: "reviewIdAE", displayName: "AliExpress Review ID", type: "TEXT" },
      { key: "rating", displayName: "Rating", type: "NUMBER" },
      { key: "textOriginal", displayName: "Original Text (bevis)", type: "TEXT" },
      { key: "textSwedish", displayName: "Swedish Text", type: "TEXT" },
      { key: "sourceLanguage", displayName: "Source Language", type: "TEXT" },
      // Rått AE-namn + land LAGRAS för bevis men visas ALDRIG publikt.
      { key: "customerNameRaw", displayName: "Customer Name Raw (bevis)", type: "TEXT" },
      { key: "initials", displayName: "Initials (display)", type: "TEXT" },
      { key: "customerCountry", displayName: "Customer Country (bevis)", type: "TEXT" },
      { key: "date", displayName: "Date", type: "TEXT" },
      { key: "hasImage", displayName: "Has Image", type: "BOOLEAN" },
      { key: "imageUrl", displayName: "Image URL", type: "TEXT" },
      // Hela bildlistan. Utan fältet har en NYPROVISIONERAD sajt ingen plats
      // att spara det skrivarna nu skickar (granskning 2026-08-19).
      { key: "imageUrls", displayName: "Image URLs (alla)", type: "ARRAY_STRING" },
      // pending | approved | rejected | edited
      { key: "status", displayName: "Status", type: "TEXT" },
      { key: "importedAt", displayName: "Imported At", type: "TEXT" },
    ],
  },
  {
    id: "FyndplatsTranslationUsage",
    displayName: "Fyndplats Translation Usage",
    fields: [
      { key: "month", displayName: "Month", type: "TEXT" },
      { key: "chars", displayName: "Chars Used", type: "NUMBER" },
      { key: "updatedAt", displayName: "Updated At", type: "TEXT" },
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
  // eslint-disable-next-line no-await-in-loop
  if (!(await ensure(spec))) allOk = false;
}
process.exit(allOk ? 0 : 1);
