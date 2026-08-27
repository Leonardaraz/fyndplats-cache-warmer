// Skapar Wix Data-kollektionen för körtidskonfiguration, om den saknas.
// Idempotent (hoppar över om den redan finns).
//
//   node scripts/ensure-app-config-collection.mjs
//
// Kollektion:
//   - FyndplatsAppConfig  (en enda rad, _id="default")
//
// VARFÖR EN EGEN KOLLEKTION
//
// Här bor värden som inte får ligga i koden. Repot är PUBLIKT, och Aosoms
// feed-adress kräver ingen inloggning: en GET returnerar hela B2B-prislistan med
// kolumnen "Wholesale Price" för 6 057 artiklar.
//
// En Vercel-miljövariabel hade också hållit den ur repot, men bakas in i
// deploymenten — den slår inte igenom förrän projektet byggts om, och märkt
// "Sensitive" går den inte att läsa tillbaka ens för ägaren. Den här raden läses
// vid varje anrop i stället. Det spelar roll konkret: adressen ska roteras hos
// Aosom, och varje rotation hade annars krävt variabel plus ombygge.
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
    id: "FyndplatsAppConfig",
    displayName: "Fyndplats App Config",
    fields: [
      { key: "aosomFeedUrl", displayName: "Aosom Feed URL (hemlig)", type: "TEXT" },
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
