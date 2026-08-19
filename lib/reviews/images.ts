// Recensionsbilder — läsning och normalisering.
//
// DATAMODELLEN ÄR AVSIKTLIGT TVÅDELAD. Kollektionen bar länge ett enda
// `imageUrl`, och 1932 rader ser fortfarande ut så. I stället för att migrera
// dem lades `imageUrls` till vid sidan av:
//
//   imageUrl   FÖRSTA bilden. Skrivs alltid. Gör att varje äldre läsare, och
//              varje rad som redan finns, fortsätter fungera oförändrat.
//   imageUrls  HELA listan. Skrivs på nya rader. Läsare som kan visa flera
//              använder den.
//
// Att låta bli migreringen är inte lättja: en engångsomskrivning av 1932 rader
// mot Wix Data är en riskabel operation för en funktion som klarar sig utan
// den, och `imageUrl` är ändå den bild som ska visas först.
//
// VARFÖR FLERA BILDER ALLS. Importen tog emot en hel array från AliExpress och
// behöll `images[0]` — resten slängdes. Recensenterna har alltså gett oss
// flera foton hela tiden. Samma ändring som låter kunden bifoga flera gör
// därför att redan importerade bilder kommer fram, utan att någon behöver
// skriva en ny recension.

/** Tak per recension. Fler ger avtagande nytta och mer att moderera. */
export const MAX_REVIEW_IMAGES = 3;

/** Formen båda fälten kan ha på en rad, oavsett var den kommer ifrån. */
export interface ReviewImageFields {
  imageUrl?: string | null;
  imageUrls?: unknown;
}

/**
 * Bilderna på en rad, i visningsordning, utan dubbletter och tomma värden.
 *
 * Föredrar `imageUrls` och faller tillbaka på `imageUrl`. Har raden båda
 * (nyskrivna rader har det) läggs `imageUrl` först ändå, eftersom det är den
 * bild som valts som representativ.
 */
export function reviewImages(row: ReviewImageFields | null | undefined): string[] {
  const ut: string[] = [];
  const sedda = new Set<string>();
  const lagg = (v: unknown) => {
    if (typeof v !== "string") return;
    const s = v.trim();
    if (!s || sedda.has(s)) return;
    sedda.add(s);
    ut.push(s);
  };
  lagg(row?.imageUrl);
  if (Array.isArray(row?.imageUrls)) for (const v of row.imageUrls) lagg(v);
  return ut;
}

/**
 * Fälten att SKRIVA för en given bildlista.
 *
 * Håller de två fälten i takt så ingen skrivväg kan sätta det ena utan det
 * andra: `hasImage` följer alltid av listan, `imageUrl` är alltid dess första,
 * och `imageUrls` utelämnas när det inte finns något att lägga där.
 */
export function reviewImageFields(urls: readonly string[]): {
  hasImage: boolean;
  imageUrl?: string;
  imageUrls?: string[];
} {
  const rena: string[] = [];
  const sedda = new Set<string>();
  for (const u of urls) {
    const s = typeof u === "string" ? u.trim() : "";
    if (!s || sedda.has(s)) continue;
    sedda.add(s);
    rena.push(s);
    if (rena.length >= MAX_REVIEW_IMAGES) break;
  }
  if (rena.length === 0) return { hasImage: false };
  return {
    hasImage: true,
    imageUrl: rena[0],
    ...(rena.length > 1 ? { imageUrls: rena } : {}),
  };
}
