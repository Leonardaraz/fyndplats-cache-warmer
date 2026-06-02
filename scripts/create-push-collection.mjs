// scripts/create-push-collection.mjs
//
// Skapar Wix Data-collectionen `FyndplatsPushTokens` som push-backenden
// (lib/push-tokens.ts) skriver till. Idempotent: om collectionen redan finns
// loggas det och scriptet avslutar 0.
//
//   node scripts/create-push-collection.mjs
//
// Kräver WIX_API_KEY + WIX_SITE_ID (läses ur .env.local). Misslyckas anropet
// (t.ex. nyckeln saknar Data-behörighet) → skapa collectionen manuellt i Wix
// (CMS → Add collection → "FyndplatsPushTokens") med fälten nedan. Tills den
// finns degraderar /api/push/register tyst (200 skipped collection_missing).

import { readFileSync } from "node:fs";

// Minimal .env.local-parser (plain node laddar inte .env automatiskt).
function loadEnv() {
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ingen .env.local — förlita på redan satta env */
  }
}
loadEnv();

const API_KEY = process.env.WIX_API_KEY;
const SITE_ID = process.env.WIX_SITE_ID;
if (!API_KEY || !SITE_ID) {
  console.error("Saknar WIX_API_KEY/WIX_SITE_ID — kan inte skapa collectionen.");
  process.exit(1);
}

const headers = { "Content-Type": "application/json", Authorization: API_KEY, "wix-site-id": SITE_ID };

const collection = {
  id: "FyndplatsPushTokens",
  displayName: "Fyndplats Push Tokens",
  fields: [
    { key: "expoToken", displayName: "Expo Token", type: "TEXT" },
    { key: "userEmail", displayName: "User Email", type: "TEXT" },
    { key: "deviceId", displayName: "Device ID", type: "TEXT" },
    { key: "platform", displayName: "Platform", type: "TEXT" },
    { key: "appVersion", displayName: "App Version", type: "TEXT" },
    { key: "registeredAt", displayName: "Registered At", type: "DATETIME" },
    { key: "lastSeenAt", displayName: "Last Seen At", type: "DATETIME" },
    { key: "preferences", displayName: "Preferences", type: "OBJECT" },
  ],
};

const res = await fetch("https://www.wixapis.com/wix-data/v2/collections", {
  method: "POST",
  headers,
  body: JSON.stringify({ collection }),
});
const text = await res.text();

if (res.ok) {
  console.log("✓ Collection FyndplatsPushTokens skapad.");
  process.exit(0);
}
if (res.status === 409 || /already exists|DUPLICATE/i.test(text)) {
  console.log("✓ Collection FyndplatsPushTokens finns redan — inget att göra.");
  process.exit(0);
}
console.error(`✗ Misslyckades (${res.status}): ${text.slice(0, 400)}`);
console.error("Skapa collectionen manuellt i Wix CMS med fälten i detta script.");
process.exit(1);
