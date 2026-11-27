// lib/heylink-s2s.ts
//
// Köpet till Heylink från vår server, åt GoWish (Leonard 2026-11-26). GoWish
// bad om Heylinks server-till-server-anrop i stället för skriptet ("If
// possible, we would prefer the server-side solution") och gav en nyckel.
//
// Heylinks dokumentation (läst 2026-11-26, docs.heylink.com/inbound/
// advertiser-callback och /inbound/api-server2server; sidorna byggs med
// JavaScript och svarar 404 på en vanlig hämtning):
//
//   POST https://heylinkapi.com/connect/v1/callbacks/advertisers
//        ?secretKey=<nyckeln>&pageUrl=<sidan där köpet skedde>
//   kropp: hltid, consentStatus, orderId, orderSubTotal (varor utan moms och
//   frakt), orderTotal (med frakt och moms), orderTax, orderShippingSubTotal
//   (frakt utan moms), orderTaxRate, orderCurrencyCode, orderItems.
//   svar 200: { code: 200, data: { success: true }, message: "success" }
//
// "You should save the value of the hltid parameter in a cookie or local
// session, in order to pass it back to the Heylink API." Deras skript behövs
// alltså inte för anropet. Butiken fångar klick-id:t själv vid landningen
// (components/heylink-klick.tsx), och kassan lägger det på betalningen i Stripe
// (lib/kassa/flode.ts, avsiktParametrar). När ordern är klar skickar servern
// köpet hit (lib/kassa/stripe-kassa.ts, rapporteraKop).
//
// Heylinks skript används inte. GoWish skrev 2026-11-26: "If you have the
// server-to-server implementation active, the script isn't necessary at all",
// och skriptet fungerar som reserv bara om det ligger på alla sidor. Tacksidans
// skript är därför borttaget; tacksidan glömmer bara klicket
// (components/heylink-glom.tsx).
//
// ☠️ NYCKELN STÅR I ADRESSEN (secretKey). Den finns bara i Vercel, som känslig
// variabel HEYLINK_SECRET_KEY i produktion. Adressen loggas aldrig, och varje
// felmeddelande tvättas från nyckeln innan det loggas (tvatta). Repot är
// publikt.
//
// LÖVMODUL med flit: bara typimporter, så att `node --test` kan ladda den.

import type { HeylinkKop } from "./heylink";

export const HEYLINK_API = "https://heylinkapi.com/connect/v1/callbacks/advertisers";

/** Sidan köpet skedde på, som Heylink vill ha den (pageUrl). Utan ordernumret. */
export const HEYLINK_SIDA = "https://www.fyndplats.se/tack";

/** Vår enda momssats. Heylink vill ha den när frakten anges (orderTaxRate). */
export const HEYLINK_MOMS_PROCENT = 25;

/** Så länge får anropet ta. Det går efter svaret till kunden, men ska inte hänga. */
export const HEYLINK_TIDSGRANS_MS = 8000;

/**
 * Nyckeln ur miljön, eller null när den saknas eller ser fel ut. Heylinks
 * nyckel är 64 hextecken; allt under 32 tecken eller med andra tecken än
 * bokstäver och siffror räknas som ingen nyckel.
 */
export function heylinkNyckel(varde: string | undefined): string | null {
  const v = (varde ?? "").trim();
  return v.length >= 32 && /^[A-Za-z0-9]+$/.test(v) ? v : null;
}

/** Bara produktionen skickar köp: ett förhandsbygges kassa går mot skarpa betalnycklar, och ett prov där ska inte bli ett köp hos GoWish. */
export function arProduktion(miljo: Readonly<Record<string, string | undefined>>): boolean {
  return (miljo.VERCEL_ENV || miljo.NODE_ENV || "").trim() === "production";
}

/** Kroppen Heylink tar emot: köpet med klick-id:t och samtycket. */
export interface HeylinkKropp extends HeylinkKop {
  hltid: string;
  consentStatus: string;
  orderTaxRate: number;
}

/**
 * Köpet som Heylink vill ha det. Samtycket är alltid "marketing": kassan lägger
 * klick-id:t på betalningen bara när kunden har samtyckt till alla cookies, och
 * utan klick-id skickas ingenting.
 */
export function heylinkKropp(kop: HeylinkKop, hltid: string): HeylinkKropp {
  return { ...kop, hltid, consentStatus: "marketing", orderTaxRate: HEYLINK_MOMS_PROCENT };
}

/** Adressen med nyckeln. ☠️ Får aldrig loggas. */
export function heylinkAdress(nyckel: string): string {
  return `${HEYLINK_API}?${new URLSearchParams({ secretKey: nyckel, pageUrl: HEYLINK_SIDA })}`;
}

/** Ett felmeddelande utan nyckeln, kortat för loggen. */
export function tvatta(text: string, nyckel: string): string {
  return (nyckel ? text.split(nyckel).join("<nyckel>") : text).slice(0, 200);
}

export type HeylinkUtfall =
  | { ok: true; status: number }
  | { ok: false; status: number | null; orsak: string };

/**
 * Skickar köpet. Kastar aldrig: utfallet säger hur det gick, och orsaken är
 * redan tvättad från nyckeln.
 */
export async function skickaTillHeylink(
  kropp: HeylinkKropp,
  nyckel: string,
  hamta: typeof fetch = fetch,
): Promise<HeylinkUtfall> {
  let status: number | null = null;
  try {
    const svar = await hamta(heylinkAdress(nyckel), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(kropp),
      signal: AbortSignal.timeout(HEYLINK_TIDSGRANS_MS),
      cache: "no-store",
    });
    status = svar.status;
    const text = await svar.text().catch(() => "");
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    const lyckat = (json as { data?: { success?: unknown } } | null)?.data?.success;
    if (svar.ok && lyckat !== false) return { ok: true, status };
    return { ok: false, status, orsak: tvatta(text || svar.statusText || "inget svar", nyckel) };
  } catch (e) {
    return { ok: false, status, orsak: tvatta(e instanceof Error ? e.message : String(e), nyckel) };
  }
}
