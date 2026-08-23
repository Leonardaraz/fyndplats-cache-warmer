// Recensionsbilder — läsning och normalisering (butikssidan).
//
// SPEGLAR lib/reviews/images.ts i motorrepot. De två repona delar ingen kod,
// och formen måste vara identisk eftersom motorn SKRIVER raderna och butiken
// LÄSER dem. Ändras den ena måste den andra följa med.
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

// ── Reparation av prefixlösa Wix-adresser ───────────────────────────────────
//
// UPPMÄTT 2026-08-22, skarpt: fem produkter från dagens import visade tomma
// knappar i stället för kundbilder. Adresserna renderades men Wix CDN svarade
// 403 på varenda en — 22 bilder, och på de fem produkterna var SAMTLIGA
// trasiga, inte en blandning. Det pekar på en enda importkörning.
//
// Det var inte adressformen. Bar URL, /v1/fill/… och /v1/fit/… gav alla 403,
// samtidigt som en produktbild svarar 200 även helt utan transform-suffix.
// Skillnaden var kontoprefixet:
//
//   .../media/148e964ceb…~mv2.jpg          → 403
//   .../media/b379ce_148e964ceb…~mv2.jpg   → 200   (riktig bild, 38 kB)
//
// Ett Wix-media-id har formen <konto>_<uuid>~mv2.<ext>. Saknas understrecket
// saknas kontodelen, och CDN nekar. Vi sätter då dit sajtens prefix.
//
// SÄKERT ÅT BÅDA HÅLL: varje prefixlöst id som finns i dag ger 403, så en
// reparation kan bara förbättra. Redan prefixade adresser rörs inte, och
// adresser till andra värdar (leverantörsbilder) rörs inte alls.
//
// DETTA LAGAR INTE KÄLLAN. Raderna skrivs av motorrepot (se filhuvudet), som
// fortfarande producerar prefixlösa adresser — nästa import gör om det, och de
// redan sparade raderna bär kvar felet. Det måste åtgärdas där. Reparationen
// här gör bara att butiken inte visar trasiga bilder under tiden.
const WIX_MEDIA_PREFIX = "b379ce";

/**
 * Sätter tillbaka kontoprefixet på en Wix-mediaadress som saknar det.
 *
 * Allt annat returneras oförändrat: adresser som redan har prefix, adresser
 * till andra värdar, och strängar som inte är adresser alls.
 */
export function repairWixMediaUrl(url: string): string {
  const m = /^(https?:\/\/static\.wixstatic\.com\/media\/)([^/?#]+)(.*)$/i.exec(url);
  if (!m) return url;
  const [, bas, id, resten] = m;
  // <konto>_<uuid>~mv2.<ext> — finns inget understreck före ~ saknas kontodelen.
  const fore = id.split("~")[0];
  if (fore.includes("_")) return url;
  return `${bas}${WIX_MEDIA_PREFIX}_${id}${resten}`;
}

/**
 * Är adressen en bild i VÅR egen Wix Media, alltså något `/api/omdome/bild`
 * kan ha lagt dit?
 *
 * Behövs sedan bilderna laddas upp i egna anrop: klienten skickar sedan
 * ADRESSERNA till sparningen i stället för bytena. Utan den här kontrollen
 * hade vem som helst med en giltig token kunnat peka ett omdöme mot vilken
 * bild som helst på internet — en reklambild, eller något värre — och få den
 * renderad på produktsidan som ett kundfoto.
 *
 * Kravet är både värden och kontoprefixet: ett prefixlöst id kan komma från en
 * annan Wix-sajt. Adressen repareras först, så en bild som fastnat i den
 * gamla prefixlösa formen inte avvisas i onödan.
 */
export function isOwnReviewImageUrl(url: unknown): boolean {
  if (typeof url !== "string" || !url) return false;
  const m = /^https:\/\/static\.wixstatic\.com\/media\/([^/?#]+)/i.exec(repairWixMediaUrl(url.trim()));
  if (!m) return false;
  return m[1].toLowerCase().startsWith(`${WIX_MEDIA_PREFIX}_`);
}

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
    const s = repairWixMediaUrl(v.trim());
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
 * ALLA TRE NYCKLARNA FINNS ALLTID i resultatet, även när värdet är undefined.
 * Det är inte kosmetik utan hela poängen: fälten sätts nästan alltid genom en
 * spread över en BEFINTLIG rad, och en nyckel som saknas i högerledet lämnar
 * det gamla värdet kvar.
 *
 * Det gick fel direkt (granskning 2026-08-19): `{...review,
 * ...reviewImageFields(ut)}` i withOwnImage flyttade hem `imageUrl` men lämnade
 * ett `imageUrls` fullt av leverantörsadresser — alltså exakt den läcka
 * funktionen finns för att stoppa, återinförd bakvägen. Reproducerat: bild 1
 * blev vår egen medan bild 2 pekade kvar på aliexpress-media.com.
 *
 * `undefined` är rätt värde för "ingen bild": items/save är en helersättning
 * och JSON.stringify tappar undefined, så fältet försvinner ur raden — vilket
 * är vad vi vill när bilderna faktiskt är borta.
 *
 * `hasImage` följer alltid av listan och `imageUrl` är alltid dess första, så
 * ingen skrivväg kan sätta det ena utan det andra.
 */
export function reviewImageFields(urls: readonly string[]): {
  hasImage: boolean;
  imageUrl: string | undefined;
  imageUrls: string[] | undefined;
} {
  const rena: string[] = [];
  const sedda = new Set<string>();
  for (const u of urls) {
    const s = typeof u === "string" ? repairWixMediaUrl(u.trim()) : "";
    if (!s || sedda.has(s)) continue;
    sedda.add(s);
    rena.push(s);
    if (rena.length >= MAX_REVIEW_IMAGES) break;
  }
  if (rena.length === 0) return { hasImage: false, imageUrl: undefined, imageUrls: undefined };
  return {
    hasImage: true,
    imageUrl: rena[0],
    // Skrivs även för EN bild. Alternativet — att utelämna fältet — gör att en
    // spread inte kan rensa ett gammalt värde, se noten ovan.
    imageUrls: rena,
  };
}
