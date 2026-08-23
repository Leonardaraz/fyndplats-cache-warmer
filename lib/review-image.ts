// Kundbilder till omdömen — validering och tvätt.
//
// Kunden får bifoga ETT foto till sitt omdöme på /omdome/<token>. Bilden
// publiceras offentligt på produktsidan (efter godkännande i /admin/reviews),
// vilket ställer två krav som drar åt olika håll.
//
// GPS MÅSTE BORT. Ett mobilfoto bär EXIF med exakta koordinater. Publicerat
// avslöjar det var kunden bor. Det är en konkret skada mot en verklig person
// och väger tyngre än allt annat i den här filen.
//
// AI-PROVENIENS MÅSTE VARA KVAR. C2PA och IPTC:s DigitalSourceType — märkningen
// som visar att en bild är AI-genererad — får aldrig strippas. Att tvätta bort
// den och publicera bilden som ett kundfoto vore att dölja precis det märkningen
// finns för.
//
// De två går att förena eftersom de bor på olika ställen: GPS ligger i EXIF,
// C2PA/IPTC i XMP. sharp 0.34 har keepXmp() — XMP behålls, EXIF slängs.
// Utan den hade valet stått mellan kundens adress och bildens ursprung.

/**
 * Största tillåtna uppladdning PER BILD — och per request, för varje bild
 * skickas i sitt eget anrop.
 *
 * TAKET ÄR MÄTT, INTE GISSAT. Plattformen avvisar en request över 4,5 MB med
 * 413 innan koden ser den. Uppmätt mot deployen 2026-08-23: 4,0 MB passerar,
 * 4,3 MB ger 413.
 *
 * Gränsen låg tidigare på 6 MB och kunde därför ALDRIG lösa ut — plattformen
 * hann först, och kunden fick "Något gick fel. Försök igen." i stället för ett
 * begripligt besked. En gräns som ligger över den verkliga gränsen är värre än
 * ingen gräns alls: den ser ut att skydda och gör det inte.
 *
 * 4 MB lämnar ~500 kB för multipart-ramen och rubrikerna.
 *
 * VARFÖR VI INTE KRYMPER BILDEN I WEBBLÄSAREN i stället för att avvisa: en
 * canvas kan inte bära metadata. `drawImage` → `toBlob` ger en naken JPEG utan
 * XMP, alltså utan C2PA-märkningen som filhuvudet ovan säger aldrig får
 * tvättas bort. Ett undantag "bara för stora bilder" hade dessutom träffat
 * precis det fall där en AI-genererad bild i full upplösning är mest sannolik.
 * Kunden förlorar hellre EN bild än att märkningen tyst försvinner.
 */
export const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Hur många bilder kunden får bifoga.
 *
 * Tre, inte en: för möbler — butikens dyraste kategori — är skillnaden mellan
 * en bild och tre att man ser varan monterad, i ett rum och i rätt skala. Och
 * inte fler: en remsa med tre tumnaglar får plats i layouten, det täcker
 * helhet + detalj + miljö, och det håller modereringen rimlig.
 *
 * Samma tak som MAX_REVIEW_IMAGES i lib/review-images.ts — de MÅSTE följas åt,
 * annars accepterar formuläret bilder som lagret sedan kapar bort.
 */
export const MAX_IMAGES = 3;

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export type ImageError =
  | "for_manga"
  | "for_stor"
  | "fel_typ"
  | "tom"
  | "inte_en_bild";

export const IMAGE_FELTEXT: Record<ImageError, string> = {
  for_manga: `Du kan bifoga högst ${MAX_IMAGES} bilder.`,
  for_stor: `Bilden är för stor (max ${Math.round(MAX_BYTES / 1024 / 1024)} MB).`,
  fel_typ: "Bilden måste vara JPEG, PNG eller WebP.",
  tom: "Ingen bild hittades.",
  inte_en_bild: "Filen gick inte att läsa som en bild.",
};

/**
 * Grindar som går att köra UTAN att avkoda bilden — billiga, och de stoppar
 * det mesta innan någon tung bearbetning startar.
 *
 * MIME-typen från klienten är bara en indikation; den riktiga kontrollen är att
 * sharp faktiskt kan avkoda filen (se processReviewImage). Båda behövs: den här
 * avvisar tidigt, den andra avvisar sant.
 */
export function validateUpload(
  size: number,
  mimeType: string | null | undefined,
): ImageError | null {
  if (!size || size <= 0) return "tom";
  if (size > MAX_BYTES) return "for_stor";
  const mime = String(mimeType ?? "").toLowerCase().split(";")[0].trim();
  if (!(ALLOWED_MIME as readonly string[]).includes(mime)) return "fel_typ";
  return null;
}

/**
 * Filnamnet bilden får i Wix Media. Innehåller aldrig kunddata.
 *
 * `index` gör namnen unika inom samma recension — utan det hade bild 2 och 3
 * skrivit över den första i mediabiblioteket.
 */
export function mediaFileName(productId: string, reviewIdAE: string, index = 0): string {
  const rent = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  const suffix = index > 0 ? `-${index + 1}` : "";
  return `omdome-${rent(productId)}-${rent(reviewIdAE)}${suffix}.jpg`;
}
