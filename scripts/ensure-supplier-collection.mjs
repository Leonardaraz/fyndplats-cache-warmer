// Skapar Wix Data-kollektionerna för säljar-score (Feature 6) + restock-logg
// (Feature 8), om de saknas. Idempotent (hoppar över befintliga).
//
//   node scripts/ensure-supplier-collection.mjs
//
// Kollektioner:
//   - FyndplatsSuppliers  (Feature 6 — säljar-score per AliExpress-leverantör)
//   - FyndplatsRestockLog (Feature 8 — restock-händelselogg)
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
    id: "FyndplatsSuppliers",
    displayName: "Fyndplats Suppliers",
    fields: [
      { key: "supplierId", displayName: "Supplier ID", type: "TEXT" },
      { key: "supplierName", displayName: "Supplier Name", type: "TEXT" },
      { key: "supplierStoreUrl", displayName: "Store URL", type: "TEXT" },
      { key: "aeRating", displayName: "AE Rating", type: "NUMBER" },
      { key: "aeFollowers", displayName: "AE Followers", type: "NUMBER" },
      { key: "productsImported", displayName: "Products Imported", type: "NUMBER" },
      { key: "productsSold", displayName: "Products Sold", type: "NUMBER" },
      { key: "avgShipDays", displayName: "Avg Ship Days", type: "NUMBER" },
      { key: "shipDaysSamples", displayName: "Ship Days Samples", type: "NUMBER" },
      { key: "complaintCount", displayName: "Complaint Count", type: "NUMBER" },
      { key: "complaintRate", displayName: "Complaint Rate", type: "NUMBER" },
      { key: "firstSeenAt", displayName: "First Seen At", type: "TEXT" },
      { key: "lastUpdatedAt", displayName: "Last Updated At", type: "TEXT" },
      { key: "status", displayName: "Status", type: "TEXT" },
    ],
  },
  {
    id: "FyndplatsRestockLog",
    displayName: "Fyndplats Restock Log",
    fields: [
      { key: "productId", displayName: "Product ID", type: "TEXT" },
      { key: "productName", displayName: "Product Name", type: "TEXT" },
      { key: "restockedAt", displayName: "Restocked At", type: "TEXT" },
      { key: "subscribersNotified", displayName: "Subscribers Notified", type: "NUMBER" },
      { key: "newStock", displayName: "New Stock", type: "NUMBER" },
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
