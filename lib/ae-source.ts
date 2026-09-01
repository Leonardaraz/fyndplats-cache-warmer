// lib/ae-source.ts
//
// AliExpress-källan för spårning (via cache-warmern). 17TRACK klarar inte
// alla EU-fraktkedjor — "Carrier cannot be detected" för t.ex. PostNord
// parcel connect och de polska last-mile-bolagen — men AliExpress känner
// alltid sin egen order. Cache-warmerns /api/tracking-events slår upp
// spårningsnumret → AliExpress-ordern → deras egna händelser + beräknad
// leverans. Svaren är rena transportdata (inga kund-/orderfält).
//
// Bruten ur app/api/track/route.ts 2026-09-01 så att TVÅ konsumenter delar
// den:
//   - /api/track                   (spårningssidan: visa händelserna)
//   - /api/cron/ae-delivery-poll   (leveransnotisen: mejla vid levererat)
//
// Order 10023 var skälet: paketet gick med ett fraktbolag 17TRACK inte
// kände igen, registrerades aldrig, och skulle därför aldrig ha gett ett
// "levererat"-mejl — trots att AliExpress visste exakt var det var.

import { dedupeEvents } from "./track-i18n";
import { maskCarrier } from "./carrier-mask";
import { LEAKY_PATTERN, deriveAeStatus, translateAeDescription, type AeStatus } from "./ae-track";

export const AE_EVENTS_URL =
  process.env.CACHE_WARMER_TRACKING_URL
  ?? "https://fyndplats-cache-warmer.vercel.app/api/tracking-events";

/** 17TRACK ger ETA som datum-sträng ("2026-06-10"), AliExpress som epoch-ms.
 *  Formatera till svensk läsbar form ("10 juni 2026"). Returnerar null om
 *  saknas/ogiltigt → UI:n faller då tillbaka på "3–7 arbetsdagar". */
export function fmtEtaSv(s: string | null | undefined): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}

export type AeTracking = {
  /** Maskerad/normaliserad transportör, eller "Transportör" för AE:s egna
   *  "Seller Shipping …"-namn. */
  carrier: string;
  eta: string | null;
  /** Härledd ur AE:s RÅA texter — AliExpress har ingen status-enum. */
  status: AeStatus;
  /** Översatta, ursprungs-skrubbade händelser, nyast först. */
  events: Array<{ time: string; description: string; location: string; status: string }>;
};

/**
 * Hämtar och tolkar AliExpress-händelserna för ett spårningsnummer.
 * null = källan svarade inte / okänt nummer (aldrig ett kast — anroparna
 * faller tillbaka på sitt eget beteende).
 */
export async function fetchAliExpressEvents(
  tn: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AeTracking | null> {
  try {
    const res = await fetchImpl(`${AE_EVENTS_URL}?tn=${encodeURIComponent(tn)}`, {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      carrier?: string | null;
      etaTimestamp?: number | null;
      events?: Array<{ time?: string; description?: string }>;
    };
    const rawEvents = body.events ?? [];
    const events = dedupeEvents(
      rawEvents
        .map((e) => ({
          time: e.time ?? "",
          description: translateAeDescription(e.description ?? ""),
          location: "",
          status: "",
        }))
        // Origin-anonymisering: rader vars text ändå röjer dropship-ursprunget
        // filtreras bort helt (samma policy som 17TRACK-flödets isHiddenLocation).
        .filter((e) => e.description && !LEAKY_PATTERN.test(e.description)),
    );
    // AliExpress "Seller Shipping …"-namn är inte kundvänliga → generisk etikett.
    const rawCarrier = body.carrier ?? "";
    const carrier = /seller shipping/i.test(rawCarrier) ? "Transportör" : maskCarrier(rawCarrier);
    const eta = body.etaTimestamp ? fmtEtaSv(new Date(body.etaTimestamp).toISOString()) : null;
    // Status härleds ur RÅA texterna (före översättning) — levererade paket
    // ska visa "Levererad", inte fastna på "På väg" (AliExpress saknar enum).
    const status = deriveAeStatus(rawEvents.map((e) => e.description ?? ""));
    return { carrier, eta, status, events };
  } catch {
    return null;
  }
}
