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

// ☠️ PÅ DATORN ÄR FILEN EXAKT SÅ BRED SOM RUTAN (2026-11-25).
//
// Leonard: "det ser suddigare ut på dator". Bilderna hade nog med pixlar, men
// aldrig RÄTT antal: kortets ruta på 265 px fick en fil på 384, produktsidans
// huvudbild på 542 px en på 640, och webbläsaren skalade om dem. Mätt på åtta
// produktbilder (kantskärpa i det som ritas, 100 % = dagens bild):
//
//   filen 2 % bredare än rutan            58 %  (97 % med skärpning)
//   dagens fil, 1,2–1,4 gånger rutan     100 %
//   samma fil med Wix skärpning          150 %
//   filen EXAKT rutans bredd, skärpt     205–226 %, och 10–30 % lättare
//
// En fil som nästan passar är alltså sämre än en som är klart för stor. Därför
// står rutornas exakta mått här, och samma tal står i srcset (imageSizes och
// deviceSizes i next.config.ts): 265 och 530 för kortet, 542 och 1084 för
// huvudbilden (1x och 2x). På en telefon och i mellanbredderna följer rutan
// fönstret, och där väljer webbläsaren närmaste större fil som förut.
//
// ☠️ Ändrar du rutnätets mellanrum, kortets ram eller sidans bredd i
// app/globals.css ändras måtten. lib/bild-sizes.test.ts räknar ut dem ur
// CSS-filen och fäller då. Rätta talen HÄR och i next.config.ts samtidigt.
//
// ☠️ Två nästan lika breda FILER av samma foto går inte ihop. Chrome
// återanvänder en bredare fil som redan ligger i minnet i stället för att
// hämta den som passar, och 265 px i en ruta på 259 är just den fil som nästan
// passar. Därför finns bara EN kortbredd i listan, 265 px, också för
// /alla-produkter och /rea, där rutnätet är luftigare (28 px mellanrum) och
// bildrutan 259 px bred. Där skalas bilden inte ned till rutan: den ritas i
// sin egen storlek, 265 × 265, och rutan skär bort 3 px i varje kant
// (.alla-prod .prodgrid i app/globals.css). `sizes` är därför samma sträng på
// de sidorna, och den säger exakt hur brett bilden ritas.
//
// Ingen bild som har exakt storlek får förstoras vid hover: en zoom på 4,5 %
// tog skärpan från 205 % till 86 %. Kortets och huvudbildens hover-zoom är
// därför borttagen (app/globals.css). Hela mätningen står i CLAUDE.md,
// "Bildernas skärpa på datorn".

/** Sidans marginal (.container): 26 px på var sida. */
const MARGINAL = 52;

/** Från den här fönsterbredden är sidan fast 1180 px bred (.container). */
export const FAST_FRAN = 1180;

/** Kortets bild på datorn: fyra kort med 20 px mellanrum, minus ramen på 1 px. */
export const KORT_DATOR = 265;
/** Produktsidans huvudbild på datorn: halva sidan minus 40 px mellanrum och ramen. */
export const HJALTE_DATOR = 542;

/**
 * Bredderna i srcset, samma tal som i next.config.ts (provet jämför dem).
 * Nexts egna 256 och 1080 är utbytta mot rutornas mått i 1x och 2x.
 */
export const BILD_BREDDER_SMA = [32, 48, 64, 96, 128, KORT_DATOR, 384, 2 * KORT_DATOR, HJALTE_DATOR] as const;
export const BILD_BREDDER_STORA = [640, 750, 828, 2 * HJALTE_DATOR, 1200, 1920, 2048, 3840] as const;

/** Hjältebilden på produktsidan. Två spalter från 761 px, fast bredd från 1180. */
export const HERO_SIZES = `(max-width:760px) calc( 100vw - ${MARGINAL}px), (max-width:${FAST_FRAN - 1}px) calc( 50vw - 48px), ${HJALTE_DATOR}px`;

/** Bildrutorna under hjälten: 36 % av galleriets bredd i mobilens svepbara
 *  rad (.gtile), tre i bredd på dator (172,67 px: de går inte jämnt ut, så
 *  filen kan inte bli exakt och 180 px får stå kvar). */
export const TILE_SIZES = `(max-width:760px) calc(( 100vw - ${MARGINAL}px) * 0.36), (max-width:1180px) 15vw, 180px`;

/**
 * Produktkortets bild (components/card-gallery.tsx).
 *
 *   upp till 540 px   två kort i bredd inom sidans marginal (.listgrid: 12 px
 *                     mellanrum), eller ett kort i full bredd
 *   upp till 900 px   två kort, 20 px mellanrum
 *   upp till 1179 px  fyra kort, 20 px mellanrum, ram på 1 px
 *   bredare           fyra kort i den 1180 px breda sidan: 265 px
 *
 * /alla-produkter och /rea har tre kort i bredd mellan 761 och 900 px och 28 px
 * mellanrum mellan fyra kort från 901 px, och rutan är då några pixlar smalare
 * än strängen säger. Där väljs en något större fil än rutan behöver; det
 * viktiga är att den aldrig blir för liten. Från 1180 px ritas bilden där i
 * exakt 265 px och beskärs av rutan (se ovan), så strängen stämmer på pixeln.
 */
export function kortSizes(tvaKolumner: boolean): string {
  const mobil = tvaKolumner ? "calc( 50vw - 32px)" : `calc( 100vw - ${MARGINAL}px)`;
  return `(max-width:540px) ${mobil}, (max-width:900px) calc( 50vw - 36px), (max-width:${FAST_FRAN - 1}px) calc( 25vw - 30px), ${KORT_DATOR}px`;
}
