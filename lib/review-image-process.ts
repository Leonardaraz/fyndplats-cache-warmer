// Bearbetning av en kundbild innan den publiceras med omdömet.
//
// LÖVMODUL med flit: importerar inget annat ur lib/, så den går att testa med
// `node --test` (repots testkörare följer inte extensionslösa imports mellan
// källfiler). Grindarna ligger i lib/review-image.ts, nätverket i
// lib/review-image-upload.ts.

import sharp from "sharp";

/** Bredd bilden skalas ner till. Produktsidan visar dem små. */
export const MAX_WIDTH = 1600;

/**
 * Skalar ner och normaliserar till JPEG.
 *
 * METADATA-HANTERINGEN ÄR POÄNGEN, och den löser två krav som drar åt olika
 * håll:
 *
 *   EXIF SLÄNGS. Ett mobilfoto bär GPS-koordinater. Bilden publiceras
 *   offentligt på produktsidan, så publicerad EXIF avslöjar var kunden bor.
 *
 *   XMP BEHÅLLS. C2PA och IPTC:s DigitalSourceType — märkningen som visar att
 *   en bild är AI-genererad — ligger där. Den får aldrig tvättas bort; att göra
 *   det och publicera bilden som ett kundfoto vore att dölja precis det
 *   märkningen finns för.
 *
 * De går att förena eftersom de bor på olika ställen. sharp slänger som
 * standard ALL metadata; keepXmp() säger uttryckligen att XMP ska överleva
 * medan EXIF fortsätter falla bort. Utan den hade valet stått mellan kundens
 * hemadress och bildens ursprung.
 *
 * rotate() utan argument tillämpar EXIF-orienteringen INNAN den slängs —
 * annars hade porträttbilder från mobil lagts ner på sidan.
 */
export async function processReviewImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    // Genomskinlighet blir SVART i JPEG om inget läggs under. En PNG med
    // alfakanal — en skärmdump, en urklippt bild — kom alltså ut med svarta
    // partier. Vitt matchar produktsidans bakgrund; på en bild utan alfakanal
    // gör raden ingenting alls.
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 82 })
    .keepXmp()
    .toBuffer();
}
