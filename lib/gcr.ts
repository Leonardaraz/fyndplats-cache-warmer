// Google Customer Reviews — den rena logiken bakom opt-in-modulen på /tack.
//
// Bakgrund (2026-08-19): Merchant Center visade "Butikens betyg: Ofullständig".
// Kontot var redan enrollerat i Recensioner, men opt-in-modulen fanns inte på
// bekräftelsesidan, så ingen enkät har någonsin skickats.
//
// Modulen visar Googles egen dialog ("vill du få en enkät om ditt köp?") och
// kräver fem fält: merchant_id, order_id, email, delivery_country och
// estimated_delivery_date. E-postadressen är alltså inte valfri — utan den kan
// Google inte skicka enkäten.
//
// Filen hålls REN (inga fetch-anrop, ingen DOM, ingen "use client") så
// datummatten och grindarna går att testa med `node --test`. Samma skäl som
// lib/hero-picks.ts och lib/social-proof.ts.
//
// FÖRVÄNTNINGAR: opt-in ≠ recension. Google visar "Butikens betyg" först vid
// ~100 FÄRDIGA recensioner per land de senaste 12 månaderna, med snitt över
// 3,5. Bara en bråkdel av dem som klickar ja skriver sedan något. Det här
// startar klockan och tar bort MC-varningen — det ger inga stjärnor i höst.

/** Fyndplats Merchant Center-ID. */
export const MERCHANT_ID = 692958602;

/**
 * Antal dagar från köp till estimerad leverans.
 *
 * Google skickar enkäten EFTER det här datumet, så ett för kort fönster mejlar
 * kunden innan paketet kommit — ett dåligt betyg på vår egen leverans. Butiken
 * lovar 3–7 arbetsdagar från EU-lager, men det utlovade och det faktiska är
 * inte samma sak. 14 dagar ligger med marginal efter det utlovade och är också
 * det den tidigare sessionen antog.
 */
export const DELIVERY_DAYS = 14;

/** Googles dialogplacering. Nere till höger krockar inte med /tack-innehållet. */
export const OPT_IN_STYLE = "BOTTOM_RIGHT_DIALOG";

/**
 * `estimated_delivery_date` i det format Google kräver: YYYY-MM-DD.
 *
 * Räknar i UTC med rena dygn. Att lägga till dagar via setDate på en lokal
 * Date drar in tidszon och sommartid i något som bara är "datum + N dygn".
 */
export function estimatedDeliveryDate(from: Date, days = DELIVERY_DAYS): string {
  const t = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Landskod enligt ISO 3166-1 alpha-2, versaler. Wix skickar redan tvåbokstavskod
 * på `shippingInfo.shippingDestination.address.country`, men fältet är löst
 * typat i vår kodbas och har historiskt fallit tillbaka på "SE".
 *
 * Returnerar null för allt som inte är exakt två bokstäver — hellre ingen modul
 * än en enkät skickad mot fel land, eftersom Googles recensionströskel räknas
 * PER LAND och aldrig slås ihop.
 */
export function normalizeCountry(raw: unknown): string | null {
  const s = String(raw ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(s) ? s : null;
}

/**
 * Grov giltighetskontroll av e-post. Google avvisar tyst en trasig adress, och
 * en tyst avvisning ser ut som "modulen fungerar inte" när felet är datat.
 */
export function isLikelyEmail(raw: unknown): boolean {
  const s = String(raw ?? "").trim();
  return s.length <= 254 && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(s);
}

/** Det Google faktiskt behöver för att rendera modulen. */
export interface GcrOrder {
  orderId: string;
  email: string;
  deliveryCountry: string;
}

export interface GcrRenderConfig {
  merchant_id: number;
  order_id: string;
  email: string;
  delivery_country: string;
  estimated_delivery_date: string;
  opt_in_style: string;
}

/**
 * Bygger render-argumenten, eller null när ordern saknar det Google kräver.
 *
 * ALLT-ELLER-INGET: saknas ett fält renderas ingen modul alls. Ett halvt anrop
 * ger en tyst avvisning hos Google som ser ut som ett integrationsfel.
 */
export function buildGcrConfig(
  order: Partial<GcrOrder> | null | undefined,
  now: Date,
): GcrRenderConfig | null {
  const orderId = String(order?.orderId ?? "").trim();
  const email = String(order?.email ?? "").trim();
  const land = normalizeCountry(order?.deliveryCountry);
  if (!orderId || !land || !isLikelyEmail(email)) return null;
  return {
    merchant_id: MERCHANT_ID,
    order_id: orderId,
    email,
    delivery_country: land,
    estimated_delivery_date: estimatedDeliveryDate(now),
    opt_in_style: OPT_IN_STYLE,
  };
}
