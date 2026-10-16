// lib/gls-source.ts
//
// GLS-källan för /sparning: hela resan för ett GLS-paket, hämtad med
// mottagarens postnummer. Regeln och tolkningen bor i lib/gls-track.ts (ren och
// testad). Här bor bara nätverket, samma uppdelning som lib/wix-order-lookup.ts.
//
// Kedjan: spårningsnumret → tracking_mapping (skrivs när ordern skickas) →
// ordern i Wix → leveransadressens postnummer → GLS sökning (rstt027).
//
// ☠️ POSTNUMRET LÄMNAR ALDRIG SERVERN. Det skickas bara till GLS, som redan
// har det, och skrivs aldrig i loggen eller i svaret till webbläsaren.
// tolkaGlsSvar släpper bara igenom händelserna, statusen och DSV:s
// sändnings-id. Med DSV:s nummer visar DSV:s egen spårning mottagarens
// postnummer och ort, precis som DSV:s sms till kunden gör. Numret och
// knappen dit finns på /sparning på Leonards begäran (2026-10-15).
//
// Null i alla andra lägen: inget paket i tracking_mapping, en order utan
// postnummer, Wix eller GLS svarar inte, eller fel postnummer (GLS 404).
// /sparning visar då det 17TRACK har, som förut.

import { sql } from "./db";
import { resolveOrderId } from "./wix-order-lookup";
import { orderPostnummer } from "./wix-order-fields";
import { glsSokUrl, tolkaGlsSvar, type GlsSparning } from "./gls-track";

const WIX_BASE = "https://www.wixapis.com";

/** Leveransadressens postnummer för ett skickat paket, eller null. */
async function postnummerForPaket(sparningsnummer: string): Promise<string | null> {
  // /api/track skickar numret i versaler. Raden bär det som det skrevs in i
  // Wix, så jämförelsen görs i versaler på båda sidor.
  const { rows } = await sql<{ order_id: string | null }>/*sql*/`
    SELECT order_id FROM tracking_mapping
     WHERE UPPER(tracking_number) = ${sparningsnummer}
       AND status <> 'ambiguous'
     LIMIT 1
  `;
  const orderId = await resolveOrderId(rows[0]?.order_id);
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!orderId || !key || !site) return null;
  const res = await fetch(`${WIX_BASE}/ecom/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: key, "wix-site-id": site, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { order?: Record<string, unknown> };
  return orderPostnummer(json.order) ?? null;
}

/**
 * Hela resan för ett GLS-paket, eller null när den inte går att få. Kastar
 * aldrig: /sparning faller tillbaka på 17TRACK.
 */
export async function fetchGlsSparning(sparningsnummer: string): Promise<GlsSparning | null> {
  let steg = "ordern";
  try {
    const postnummer = await postnummerForPaket(sparningsnummer);
    if (!postnummer) return null;
    steg = "GLS";
    const res = await fetch(glsSokUrl(sparningsnummer, postnummer), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Fyndplats/1.0 (+https://www.fyndplats.se/sparning)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    // 404 är GLS svar på fel postnummer eller ett okänt nummer.
    if (!res.ok) {
      console.warn(`[gls] ${sparningsnummer}: GLS svarade HTTP ${res.status}`);
      return null;
    }
    const sparning = tolkaGlsSvar(await res.json());
    if (!sparning) console.warn(`[gls] ${sparningsnummer}: GLS svar utan historik`);
    return sparning;
  } catch (err) {
    console.warn(`[gls] ${sparningsnummer}: ${steg} föll: ${err instanceof Error ? err.name : "fel"}`);
    return null;
  }
}
