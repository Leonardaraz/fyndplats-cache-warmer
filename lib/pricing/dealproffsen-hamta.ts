// Hämtningen mot dealproffsens sök-JSON — delad av jämförelsen
// (/api/admin/dealproffsen) och konkurrentprisernas lagring
// (/api/admin/konkurrentpris). Utflyttad 2026-09-15 så de två rutterna frågar
// deras server på EXAKT samma sätt: samma adress, samma paus, samma sidtak.
//
// ☠️ DET ÄR NÅGON ANNANS SERVER. Pausen mellan anrop är inte en optimering
// utan en artighet, och sidtaket per prefix är uppmätt (439 var det största),
// inte gissat. Ändras något här ändras det för båda anroparna — det är
// poängen.

import { tolkaDerasSvar, type DerasRad } from "./dealproffsen";

export const DP_BAS = "https://www.dealproffsen.se/sok?controller=search&ajax=1&resultsPerPage=100";

/** Deras sida svarar inte på en naken klient. */
export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/**
 * Paus mellan anrop mot deras sajt.
 *
 * Samma medicin som `AOSOM_WRITE_DELAY_MS` och `MEDIA_UPLOAD_DELAY_MS`: den
 * billigaste kuren mot en strypning som utlöses av tempo är att inte springa.
 */
export const PAUS_MS = Number(process.env.DEALPROFFSEN_DELAY_MS ?? 400);

/** Tak per prefix. 439 var det största uppmätta; 20 sidor är gott om marginal. */
export const MAX_SIDOR_PER_PREFIX = 20;

export const sov = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Hämtar alla sidor för ett prefix. Kastar vid HTTP-fel — se anroparen. */
export async function hamtaPrefix(prefix: string): Promise<DerasRad[]> {
  const ut: DerasRad[] = [];
  for (let sida = 1; sida <= MAX_SIDOR_PER_PREFIX; sida++) {
    const url = `${DP_BAS}&s=${encodeURIComponent(prefix)}&page=${sida}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} på ${prefix} sida ${sida}`);
    const rader = tolkaDerasSvar(await res.json());
    ut.push(...rader);
    if (rader.length < 100) break;
    await sov(PAUS_MS);
  }
  return ut;
}
