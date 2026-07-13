// lib/track17.ts
//
// Delade 17TRACK-helpers för headless. Två konsumenter:
//   - app/api/track17-webhook  — verifierar push-signaturen.
//   - app/api/wix-webhook       — registrerar spårnummer hos 17TRACK vid
//                                 fulfillment så pushen fyrar PROAKTIVT
//                                 (inte först när kunden öppnar /sparning).
//
// 17TRACK-nyckeln är samma konto som /api/track redan använder: env
// TRACK17_API_KEY. Push-webhookens URL sätts i 17TRACK-dashboarden (account-
// nivå) och pekar i dag på https://www.fyndplats.se/_functions/track_webhook
// (ärvt från Velo) → vi serverar den vägen via en rewrite i next.config.ts.

import { createHash, timingSafeEqual } from "node:crypto";

const REGISTER_URL = "https://api.17track.net/track/v2.2/register";

// 17TRACK-felkoder vid registrering.
const ERR_ALREADY_REGISTERED = -18019901; // ofarligt — idempotent
const ERR_CARRIER_UNDETECTED = -18019903; // auto-detektering gick bet → prova hint

// ---------------------------------------------------------------------------
// Carrier-gissning ur spårningsnumrets format. Används BARA som andra försök
// när 17TRACK:s auto-detektering misslyckats (-18019903 — drabbade PostNord
// parcel connect skarpt 2026-07: paketet gick att spåra hos PostNord men
// 17TRACK vägrade registrera det, så leveransnotiserna uteblev).
//
// Konservativ efter design: hellre null (samma läge som idag — AliExpress-
// källan täcker /sparning ändå) än en fel-gissning som registrerar numret hos
// fel transportör. Mönstren utökas i takt med att vi ser riktiga nummer —
// lägg ALLTID en kommentar om varifrån mönstret kommer.
//
// Nyckelvärden ur 17TRACK:s officiella carrier-lista
// (https://res.17track.net/asset/carrier/info/apicarrier.all.json):
//   19241  PostNord Sweden      4011   PostNord Danmark
//   100005 GLS                  100189 GLS Spain (National)
//   100007 DPD (DE)             100043 InPost (PL)
// ---------------------------------------------------------------------------

export interface CarrierHint {
  /** 17TRACK:s numeriska carrier-nyckel (register-anropets `carrier`-fält). */
  key: number;
  /** Läsbart namn — endast för loggning, visas aldrig för kund. */
  name: string;
}

const POSTNORD_SE: CarrierHint = { key: 19241, name: "PostNord Sweden" };

/** Mönster → carrier. FÖRSTA träff vinner — specifika mönster först. */
const CARRIER_PATTERNS: Array<[RegExp, CarrierHint]> = [
  // UPU S10 adresserat till Sverige (t.ex. "RR123456789SE") → svensk
  // postoperatör = PostNord.
  [/^[A-Z]{2}\d{9}SE$/, POSTNORD_SE],
  // PostNord parcel connect: 14 siffror som börjar på 07 — verifierat mot en
  // riktig leverans (07084026870677, order #10012 juli 2026; både PostNords
  // egen sök och parcelsapp identifierade den som PostNord). Medvetet smalt
  // (^07, inte ^0) för att inte kollidera med DPD:s 14-siffriga format.
  [/^07\d{12}$/, POSTNORD_SE],
];

/**
 * Format-gissad 17TRACK-carrier för ett spårningsnummer, eller null när inget
 * mönster matchar med hög säkerhet.
 */
export function detect17TrackCarrier(trackingNumber: string): CarrierHint | null {
  const tn = (trackingNumber || "").trim().toUpperCase();
  if (!tn) return null;
  for (const [re, hint] of CARRIER_PATTERNS) {
    if (re.test(tn)) return hint;
  }
  return null;
}

/**
 * Verifierar 17TRACK:s push-signatur. Enligt 17TRACK-doc är `sign`-headern
 * SHA256(`<raw body>/<api_key>`) i hex. Timing-säker jämförelse.
 *
 * VIKTIGT: rawBody måste vara EXAKT den råa request-bodyn (inte re-serialiserad
 * JSON) — minsta whitespace-skillnad gör att signaturen inte stämmer.
 */
export function verify17TrackSign(rawBody: string, providedSign: string | null | undefined): boolean {
  const apiKey = process.env.TRACK17_API_KEY;
  if (!apiKey || !providedSign) return false;
  const expected = createHash("sha256").update(`${rawBody}/${apiKey}`).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(providedSign);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Ett register-försök. Returnerar rejected-felkoden (eller null vid accept/
 *  nätverksfel — nätverksfel ska INTE trigga hint-retry, bara oidentifierad
 *  carrier ska). Kastar aldrig. */
async function registerAttempt(
  trackingNumber: string,
  orderId: string | null | undefined,
  apiKey: string,
  carrierKey?: number,
): Promise<number | null> {
  try {
    const res = await fetch(REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "17token": apiKey },
      body: JSON.stringify([
        {
          number: trackingNumber,
          // 17TRACK:s numeriska carrier-nyckel — utelämnad = auto-detektering.
          carrier: carrierKey,
          lang: "sv",
          translation_mode: "UseThirdPartyServices",
          destination_country: "SE",
          order_no: orderId || undefined,
        },
      ]),
      cache: "no-store",
      // Tidsgräns: registreringen körs i Wix-webhookens request-väg. Ett hängande
      // 17TRACK får ALDRIG fördröja webhook-svaret (→ Wix-timeout/retry). Samma
      // 3s-konvention som lib/meta-capi.ts och lib/expo-push.ts. AbortError
      // fångas av catch nedan → best-effort, kastar aldrig.
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      console.warn(`[track17] register ${trackingNumber}: HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json().catch(() => null)) as
      | { data?: { rejected?: Array<{ error?: { code?: number } }> } }
      | null;
    return json?.data?.rejected?.[0]?.error?.code ?? null;
  } catch (err) {
    console.warn(`[track17] register ${trackingNumber} fel:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Registrerar ett spårnummer hos 17TRACK med svenska översättningar och
 * Sverige som destination (speglar Velo:s registerTracking). Fire-and-forget:
 * fel loggas men kastas aldrig — en misslyckad registrering manifesterar sig
 * som "ingen push" och fångas av /api/track:s on-demand-registrering.
 *
 * Idempotent på 17TRACK-sidan: redan registrerat (-18019901) är inget fel.
 *
 * Carrier-hint-retry: kan 17TRACK inte auto-detektera transportören
 * (-18019903 — skarpt fall: PostNord parcel connect) görs ETT nytt försök med
 * en format-gissad carrier (lib/carrier-detect). Utan lyckad registrering
 * fyrar aldrig push-webhooken → inga "ute för leverans"/"levererat"-mejl.
 */
export async function registerWith17Track(trackingNumber: string, orderId?: string | null): Promise<void> {
  const apiKey = process.env.TRACK17_API_KEY;
  if (!apiKey || !trackingNumber) return;

  const code = await registerAttempt(trackingNumber, orderId, apiKey);
  if (code === null || code === ERR_ALREADY_REGISTERED) return;

  if (code === ERR_CARRIER_UNDETECTED) {
    const hint = detect17TrackCarrier(trackingNumber);
    if (!hint) {
      console.warn(`[track17] register ${trackingNumber}: carrier odetekterad, inget format-mönster matchar — ingen push för detta paket`);
      return;
    }
    const retryCode = await registerAttempt(trackingNumber, orderId, apiKey, hint.key);
    if (retryCode === null || retryCode === ERR_ALREADY_REGISTERED) {
      console.log(`[track17] register ${trackingNumber}: registrerad med carrier-hint ${hint.name} (${hint.key})`);
    } else {
      console.warn(`[track17] register ${trackingNumber}: hint ${hint.name} avvisades också (kod ${retryCode})`);
    }
    return;
  }

  console.warn(`[track17] register ${trackingNumber} rejected: kod ${code}`);
}
