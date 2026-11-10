// Bildernas `sizes`: hur bred bilden VISAS, så att webbläsaren väljer rätt fil
// ur srcset. Värdena följer layouten i app/globals.css och vaktas av
// lib/bild-sizes.test.ts, som räknar ut samma bredder ur layoutens tal.
//
// Fram till 2026-11-10 stod mobilens bredder som hela skärmens (100vw, 38vw,
// 50vw). Bilderna är smalare än så, eftersom sidan har 26 px marginal på var
// sida, och skillnaden avgör vilken fil som hämtas:
//
//   iPhone 390 px, 3x    hjältebilden  338 px visad   1200w → 1080w
//                        bildrutorna   122 px visade   640w →  384w
//   telefon 414 px, 2x   kortet        190 px visat    640w →  384w
//   dator 1920 px, 1x    kortet        267 px visat    640w →  384w
//
// Mätt på tio slumpade produktbilder (webp, q_72) väger 384w i snitt 5 kB mot
// 11 kB för 640w, och 1080w 25 kB mot 30 kB för 1200w. En detaljrik bild väger
// fem gånger mer (lasertag-setet: 164 kB i 1200w, 142 kB i 1080w). Bilden är
// lika skarp som förut: filen har fortfarande minst så många pixlar som rutan
// den visas i gånger skärmens täthet.
//
// ☠️ MELLANSLAGET I "calc( 50vw" ÄR MED FLIT. Next läser `sizes` med regexen
// (^|\s)(1?\d?\d)vw för att stryka de minsta kandidaterna ur srcset. Står
// talet direkt efter parentesen hittar den inget, och finns ingen annan
// vw-term i strängen skriver Next ut ALLA sexton bredder för varje bild. På en
// listsida med 48 kort är det 37 kB HTML till.

/** Sidans marginal (.container): 26 px på var sida. */
const MARGINAL = 52;

/** Hjältebilden på produktsidan. På dator är kolumnen fast 544 px. */
export const HERO_SIZES = `(max-width:760px) calc( 100vw - ${MARGINAL}px), (max-width:1180px) 45vw, 544px`;

/** Bildrutorna under hjälten: 36 % av galleriets bredd i mobilens svepbara
 *  rad (.gtile), tre i bredd på dator. */
export const TILE_SIZES = `(max-width:760px) calc(( 100vw - ${MARGINAL}px) * 0.36), (max-width:1180px) 15vw, 180px`;

/**
 * Produktkortets bild (components/card-gallery.tsx).
 *
 *   upp till 540 px   två kort i bredd (.listgrid: 12 px kant, 10 px mellanrum)
 *                     eller ett kort i full bredd
 *   upp till 900 px   två kort, 20 px mellanrum
 *   upp till 1180 px  fyra kort, 20 px mellanrum
 *   bredare           fyra kort i den 1180 px breda sidan: 267 px
 */
export function kortSizes(tvaKolumner: boolean): string {
  const mobil = tvaKolumner ? "calc( 50vw - 17px)" : `calc( 100vw - ${MARGINAL}px)`;
  return `(max-width:540px) ${mobil}, (max-width:900px) calc( 50vw - 36px), (max-width:1180px) calc( 25vw - 28px), 267px`;
}
