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

/**
 * Registrerar ett spårnummer hos 17TRACK med svenska översättningar och
 * Sverige som destination (speglar Velo:s registerTracking). Fire-and-forget:
 * fel loggas men kastas aldrig — en misslyckad registrering manifesterar sig
 * som "ingen push" och fångas av /api/track:s on-demand-registrering.
 *
 * Idempotent på 17TRACK-sidan: redan registrerat (-18019901) är inget fel.
 */
export async function registerWith17Track(trackingNumber: string, orderId?: string | null): Promise<void> {
  const apiKey = process.env.TRACK17_API_KEY;
  if (!apiKey || !trackingNumber) return;
  try {
    const res = await fetch(REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "17token": apiKey },
      body: JSON.stringify([
        {
          number: trackingNumber,
          lang: "sv",
          translation_mode: "UseThirdPartyServices",
          destination_country: "SE",
          order_no: orderId || undefined,
        },
      ]),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[track17] register ${trackingNumber}: HTTP ${res.status}`);
      return;
    }
    const json = (await res.json().catch(() => null)) as
      | { data?: { rejected?: Array<{ error?: { code?: number } }> } }
      | null;
    for (const r of json?.data?.rejected ?? []) {
      // -18019901 = redan registrerat → ofarligt, allt annat loggas.
      if (r?.error?.code !== -18019901) {
        console.warn(`[track17] register ${trackingNumber} rejected:`, r.error);
      }
    }
  } catch (err) {
    console.warn(`[track17] register ${trackingNumber} fel:`, err instanceof Error ? err.message : err);
  }
}
