// Skapar Wix Data-kollektionen LLM-resultatcachen (#3) använder, om den saknas.
// Idempotent (hoppar över om den redan finns). Kör en gång:
//
//   node scripts/ensure-claude-cache-collection.mjs
//
// Kollektionen lagrar fullständig Claude-output per produkt (SHA-256-nyckel,
// 30 dagars TTL) så re-importer hoppar över LLM helt. Namnet matchar
// LLM_COLLECTIONS.cache i lib/llm/storage.ts (override: WIX_DATA_COL_LLM_CACHE).
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
    id: env.WIX_DATA_COL_LLM_CACHE || "FyndplatsClaudeCache",
    displayName: "Fyndplats Claude Cache",
    fields: [
      { key: "key", displayName: "Cache Key", type: "TEXT" },
      { key: "op", displayName: "Operation", type: "TEXT" },
      { key: "value", displayName: "Value JSON", type: "TEXT" },
      { key: "provider", displayName: "Provider", type: "TEXT" },
      { key: "createdAt", displayName: "Created At", type: "TEXT" },
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
