// Skapar Wix Data-kollektionen FyndplatsRestockSubscribers om den saknas, och
// verifierar att /api/restock-subscribe fungerar. Idempotent.
//
//   node scripts/ensure-restock-collection.mjs
//
// Läser WIX_API_TOKEN + WIX_SITE_ID från .env.local. Skapar en admin-only
// kollektion (samma åtkomstmodell som FyndplatsMappings m.fl. — appen läser/
// skriver med admin-token, inte med member-permissions).

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
const COLLECTION = "FyndplatsRestockSubscribers";
if (!TOKEN) { console.error("WIX_API_TOKEN saknas i .env.local"); process.exit(1); }

const headers = {
  Authorization: TOKEN,
  "Content-Type": "application/json",
  ...(SITE ? { "wix-site-id": SITE } : {}),
};

async function getCollection() {
  const res = await fetch(
    `https://www.wixapis.com/wix-data/v2/collections/${encodeURIComponent(COLLECTION)}`,
    { headers },
  );
  return { status: res.status, body: await res.text() };
}

async function createCollection() {
  const body = {
    collection: {
      id: COLLECTION,
      displayName: "Fyndplats Restock Subscribers",
      fields: [
        { key: "productId", displayName: "Product ID", type: "TEXT" },
        { key: "email", displayName: "Email", type: "TEXT" },
        { key: "subscribedAt", displayName: "Subscribed At", type: "TEXT" },
        { key: "notifiedAt", displayName: "Notified At", type: "TEXT" },
      ],
    },
  };
  const res = await fetch("https://www.wixapis.com/wix-data/v2/collections", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.text() };
}

const existing = await getCollection();
console.log(`[get] ${COLLECTION} -> HTTP ${existing.status}`);
if (existing.status === 200) {
  console.log("Kollektionen finns redan. Inget att göra.");
  process.exit(0);
}
if (existing.status !== 404) {
  console.log("Oväntat svar vid kontroll:", existing.body.slice(0, 500));
}

console.log("Skapar kollektionen…");
const created = await createCollection();
console.log(`[create] HTTP ${created.status}`);
console.log(created.body.slice(0, 800));
process.exit(created.status >= 200 && created.status < 300 ? 0 : 1);
