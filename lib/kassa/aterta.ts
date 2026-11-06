// lib/kassa/aterta.ts
//
// Påminnelsen om en övergiven varukorg när kunden handlar i vår egen kassa
// (Leonard 2026-11-06: "Ska du inte fixa övergiven kundvagn mail för vår nya
// kassa?").
//
// Mejlen (lib/abandoned-cart.ts, mejl 1–3) köas ur Wix övergivna kassor
// (lib/abandoned-checkout-poll.ts). Två saker fungerade inte med vår kassa:
//
//   1. Wix skapar en övergiven kassa bara när korgen har köparens e-post. Wix
//      egen kassa fick den när kunden gick vidare från kontaktsteget; vår kassa
//      satte den först när kunden tryckte på Betala (forbered). En kund som
//      skrev sin e-post och gick fick inget mejl. Nu skickar kassan e-posten
//      till korgen när kunden lämnar fältet (/api/kassa/kontakt).
//   2. Mejlets knapp ledde till Wix kassa (checkoutUrl). När vår kassa är på
//      leder den hit i stället: /kassa/aterta lägger korgens varor i
//      besökarens varukorg och öppnar /kassa, och rabattkoden i mejl 3 följer
//      med (`medKod`) och läggs på i kassan.
//
// Länken bär korgens id och en HMAC av det. Ett id som läckt eller gissats
// räcker alltså inte för att hämta någon annans varor.
//
// ☠️ Bara servern: modulen använder node:crypto. Webbläsarens del ligger i
// lib/kassa/aterta-korg.ts.

import { createHmac, timingSafeEqual } from "node:crypto";

export const BUTIK = "https://www.fyndplats.se";
export const ATERTA_SOKVAG = "/kassa/aterta";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Längden på signaturen i länken (base64url): 22 tecken är 132 bitar. */
const SIG_LANGD = 22;

/**
 * Hemligheten som signerar länkarna: samma som avregistreringslänkarna
 * (lib/newsletter.ts), men med eget prefix i det som signeras. Utan hemlighet
 * får mejlet Wix länk i stället (`valjAterLank`).
 */
export function aterHemlighet(env: Record<string, string | undefined> = process.env): string | null {
  const h = (env.NEWSLETTER_SECRET || env.CRON_SECRET || "").trim();
  return h.length >= 16 ? h : null;
}

function signatur(cartId: string, hemlighet: string): string {
  return createHmac("sha256", hemlighet).update(`fp-aterta:v1:${cartId.toLowerCase()}`).digest("base64url").slice(0, SIG_LANGD);
}

/** Nyckeln i länken: korgens id, en punkt och signaturen. */
export function aterNyckel(cartId: string, hemlighet: string): string {
  return `${cartId.toLowerCase()}.${signatur(cartId, hemlighet)}`;
}

/** Korgens id ur nyckeln, eller null när den är trasig, förfalskad eller signerad med en annan hemlighet. */
export function lasAterNyckel(k: unknown, hemlighet: string | null): string | null {
  if (!hemlighet || typeof k !== "string" || k.length > 80) return null;
  const punkt = k.indexOf(".");
  if (punkt < 0) return null;
  const cartId = k.slice(0, punkt).toLowerCase();
  const sig = k.slice(punkt + 1);
  if (!GUID.test(cartId) || sig.length !== SIG_LANGD) return null;
  const vantad = Buffer.from(signatur(cartId, hemlighet));
  const given = Buffer.from(sig);
  if (vantad.length !== given.length || !timingSafeEqual(vantad, given)) return null;
  return cartId;
}

/** Länken i mejlet till vår kassa. */
export function aterLank(cartId: string, hemlighet: string, bas = BUTIK): string {
  return `${bas}${ATERTA_SOKVAG}?k=${encodeURIComponent(aterNyckel(cartId, hemlighet))}`;
}

/**
 * Vilken länk mejlet får. Vår, när vår kassa är på för alla (`egen`), när
 * hemligheten finns och när Wix gav korgens id. Annars Wix länk som förut
 * (den leder till Wix kassa), med https, eller butikens startsida.
 */
export function valjAterLank(o: { egen: boolean; hemlighet: string | null; cartId?: string | null; wixUrl?: string | null; bas?: string }): string {
  const bas = o.bas ?? BUTIK;
  if (o.egen && o.hemlighet && o.cartId && GUID.test(o.cartId)) return aterLank(o.cartId, o.hemlighet, bas);
  const u = o.wixUrl;
  if (u && /^https?:\/\//.test(u)) return u.replace(/^http:\/\//, "https://");
  return bas;
}

/**
 * Rabattkoden i mejl 3 följer med vår länk och läggs på i kassan. Wix länk
 * tar ingen kod; där skriver kunden den själv, som förut.
 */
export function medKod(url: string, kod: string | null | undefined, bas = BUTIK): string {
  const k = (kod ?? "").replace(/\s/g, "");
  if (!k || !url.startsWith(`${bas}${ATERTA_SOKVAG}?`)) return url;
  return `${url}&kod=${encodeURIComponent(k)}`;
}

/**
 * Har Wix markerat den övergivna kassan som återvunnen? Det gör Wix när
 * korgen blir en order, också i vår kassa och också när köpet görs med en
 * annan e-post än den i den övergivna kassan (mätt 2026-11-06: RECOVERED fyra
 * sekunder efter ordern). Då ska påminnelsen inte gå (lib/abandoned-cart.ts).
 */
export function aterVunnenIWix(svar: unknown): boolean {
  return (svar as { abandonedCheckout?: { status?: unknown } } | null)?.abandonedCheckout?.status === "RECOVERED";
}
