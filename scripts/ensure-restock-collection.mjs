// Skapar de Wix Data-kollektioner hybrid-OOS-funktionerna behöver, om de saknas,
// och är idempotent (hoppar över dem som redan finns).
//
//   node scripts/ensure-restock-collection.mjs
//
// Kollektioner:
//   - FyndplatsRestockSubscribers  (Feature 1 — restock-bevakare)
//   - FyndplatsAlternativeCache    (Feature 3 — 30-dagars alternativ-cache)
//
// Läser WIX_API_TOKEN + WIX_SITE_ID från .env.local. Admin-only-åtkomst (appen
// läser/skriver med admin-token, inte member-permissions).

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
    id: "FyndplatsRestockSubscribers",
    displayName: "Fyndplats Restock Subscribers",
    fields: [
      { key: "productId", displayName: "Product ID", type: "TEXT" },
      { key: "email", displayName: "Email", type: "TEXT" },
      { key: "subscribedAt", displayName: "Subscribed At", type: "TEXT" },
      { key: "notifiedAt", displayName: "Notified At", type: "TEXT" },
    ],
  },
  {
    id: "FyndplatsAlternativeCache",
    displayName: "Fyndplats Alternative Cache",
    fields: [
      { key: "alternativesJson", displayName: "Alternatives JSON", type: "TEXT" },
      { key: "computedAt", displayName: "Computed At", type: "TEXT" },
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
