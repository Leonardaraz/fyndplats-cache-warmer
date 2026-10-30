// Vilka av VEVOR:s bildadresser som är samma foto (2026-10-30).
//
// VEVOR lägger varje artikels bilder i en egen mapp, med artikeln i adressen
// och en egen `timestamp`. Storlekar av samma vara bär därför byte-identiska
// foton under olika adresser: damstövlarna i fem storlekar hade sex foton var,
// och galleriet fick 36 bilder där sex hade räckt. Adressen kan alltså inte
// avgöra om två bilder är samma, och filnamnet inte heller: två färger av
// traktorskopskyddet heter båda `…-m100-9.jpg` men är olika foton.
//
// Innehållet avgör. Nyckeln är md5 av bildens byte, och det är exakt Wix egen
// `hash` på en uppladdad fil (uppmätt: VEVOR-bildens md5 = filens hash i Media
// Manager). Importen och rättningen jämför därför sina adresser med varandra
// och med redan uppladdade filer innan något laddas upp.
//
// Hämtningen går till VEVOR:s bildserver med vår egen användaragent, aldrig
// till något annat. En bild som inte går att hämta får ingen nyckel och räknas
// som ett eget foto: hellre en dubblett för mycket än ett foto som saknas.

import { createHash } from "node:crypto";
import { ANVANDARAGENT } from "./hamtning";

/** VEVOR:s bildserver. Ingen annan värd hämtas härifrån. */
export const arVevorBildvard = (vard: string): boolean => vard === "img.vevorstatic.com";

/** Wix tar bilder upp till 25 MB; VEVOR:s produktbilder är under 1 MB. */
const MAX_BYTE = 20 * 1024 * 1024;
const SAMTIDIGA = 4;

const vardAv = (u: string): string => {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
};

/**
 * Bildens byte från en av VEVOR:s bildservrar, med vår egen användaragent.
 * Null när värden inte är tillåten (också efter en omdirigering), svaret inte
 * är 200 eller bilden är tom eller för stor.
 */
export async function hamtaVevorByte(
  url: string,
  tillaten: (vard: string) => boolean,
  f: typeof fetch = fetch,
): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!tillaten(vardAv(url))) return null;
  try {
    const res = await f(url, { headers: { "User-Agent": ANVANDARAGENT }, signal: AbortSignal.timeout(30_000) });
    if (!res.ok || !tillaten(vardAv(res.url || url))) {
      await res.body?.cancel();
      return null;
    }
    if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTE) {
      await res.body?.cancel();
      return null;
    }
    const b = new Uint8Array(await res.arrayBuffer());
    return b.byteLength > 0 && b.byteLength <= MAX_BYTE ? b : null;
  } catch {
    return null;
  }
}

/** md5 av bildens byte, eller null när den inte gick att hämta. */
export async function hamtaNyckel(url: string, f: typeof fetch = fetch): Promise<string | null> {
  const b = await hamtaVevorByte(url, arVevorBildvard, f);
  return b ? createHash("md5").update(b).digest("hex") : null;
}

/**
 * Innehållsnyckeln för varje adress (md5, samma som Wix `hash`). En adress som
 * inte gick att hämta saknas i svaret. Varje adress hämtas en gång.
 */
export async function innehallsnycklar(
  urls: readonly string[],
  hamta: (url: string) => Promise<string | null> = (u) => hamtaNyckel(u),
): Promise<Map<string, string>> {
  const unika = [...new Set(urls)];
  const ut = new Map<string, string>();
  let nasta = 0;
  const arbetare = async () => {
    while (nasta < unika.length) {
      const url = unika[nasta++];
      const k = await hamta(url);
      if (k) ut.set(url, k);
    }
  };
  await Promise.all(Array.from({ length: Math.min(SAMTIDIGA, unika.length) }, arbetare));
  return ut;
}
