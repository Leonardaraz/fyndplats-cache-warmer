// lib/feed/prisjakt-svar.ts
//
// Svaret för Prisjakt-flödena, STRÖMMAT.
//
// ☠️ Vercels CDN cachar icke-strömmade svar upp till 10 MB och strömmade upp
// till 20 MB (vercel.com/docs/caching/cdn-cache, "Cacheable response
// criteria", läst 2026-10-28). Prisjakt-flödet var 9,30 MB och växer med
// artikelnumren. Ett svar över gränsen cachas inte alls och byggs om vid varje
// hämtning (35–39 s uppmätt). Därför skickas XML:en som en ström i bitar om
// 64 kB, utan Content-Length.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den.

/** Bitstorleken i strömmen. */
const BIT_BYTE = 64 * 1024;

/** Strömmade svar cachas upp till 20 MB. Varningen ger marginal till det. */
export const PRISJAKT_VARNING_BYTE_STROMMAT = 19_000_000;

/** XML:en som en ström. Samma byte som strängen, i bitar. */
export function strommatXml(xml: string): ReadableStream<Uint8Array> {
  const byte = new TextEncoder().encode(xml);
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= byte.length) {
        controller.close();
        return;
      }
      controller.enqueue(byte.subarray(i, i + BIT_BYTE));
      i += BIT_BYTE;
    },
  });
}

/**
 * Antal som går att logga: inga nummer, inga märken, bara räknare. Flödet har
 * en vara per rad (lib/feed/prisjakt.ts), så raderna räknas var för sig.
 */
export function prisjaktRakning(xml: string): { varor: number; gtin: number; mpn: number; mpnMedMarke: number; byte: number } {
  let varor = 0;
  let gtin = 0;
  let mpn = 0;
  let mpnMedMarke = 0;
  for (const rad of xml.split("\n")) {
    if (!rad.startsWith("<item>")) continue;
    varor++;
    if (rad.includes("<g:gtin>")) gtin++;
    if (rad.includes("<g:mpn>")) {
      mpn++;
      if (!rad.includes("<g:brand>Fyndplats</g:brand>")) mpnMedMarke++;
    }
  }
  return { varor, gtin, mpn, mpnMedMarke, byte: Buffer.byteLength(xml) };
}
