// lib/list-payload.ts
// Vilka produkter som ska bära sin bild redan i sidans nyttolast.
//
// GÄLLER NUMERA BARA SÖKRESULTATEN (/sok). Listsidorna (/alla-produkter, /rea,
// /kategori) skickar sedan 2026-09-27 bara sina första kort och hämtar resten,
// med bilder, från /api/lista — se lib/list-pages.ts. Beskrivningen nedan är
// skriven för listsidorna men gäller sök på samma sätt.
//
// PROBLEMET. Listsidorna ritar 24 kort men skickar HELA katalogen till
// webbläsaren, för filtren och sorteringen räknas där. Mätt på skarp
// /alla-produkter 2026-09-04: produktlistan vägde 877 kB, varav 471 kB var
// renderingsdata för kort som aldrig ritades — och bild-URL:erna ensamma var
// 313 kB av dem. Kostnaden växer linjärt med katalogen, så den blir värre, inte
// bättre, när fler produkter publiceras.
//
// LÖSNINGEN. Skicka bilden bara för de produkter som rimligen kan stå i vyn
// innan användaren hinner göra något. Resten hämtas från /api/kort-bilder när de
// närmar sig. Kortet står ALDRIG tomt under tiden: namn, pris, betyg,
// lagerstatus och länken ligger kvar i listan för varenda produkt — bara
// fotorutan väntar, vilket är exakt samma tillstånd varje bild redan har medan
// den laddas ner.
//
// VILKA "kan stå i vyn direkt"? Två grupper:
//
//  1. De FÖRSTA sidorna i den ordning sidan visar. Det är vad man ser vid
//     ankomst och efter ett par klick på "Visa fler".
//  2. Toppen av VARJE sorteringsval. Byter man från "Rekommenderat" till
//     "Pris: lågt → högt" byts hela vyn ut mot 24 andra produkter — utan det här
//     hade varje sorteringsbyte krävt en hämtning innan bilderna kom.
//
// Filtren går inte att förberäkna på samma sätt (pris × färg × lager × rea är
// för många kombinationer), så ett filter kan landa på produkter utan bild. Då
// hämtas de — och eftersom filtret självt räknas lokalt är listan, ordningen och
// räknarna på plats direkt; bara fotona kommer en aning efter.

import type { Product, ListProduct } from "./products";
import { forClient } from "./products";
import { currentDayMs, orderRecommended, orderPopular, createdAtMs } from "./sort-products";
import { universalCollectionIds } from "./related-pick";
import type { Nyckel } from "./spec-facets";

/** Hur många av visningsordningen som bär bild direkt: 24 synliga + 24 i
 *  bakfickan, alltså ett "Visa fler"-klick utan hämtning. Matchar PAGE_SIZE × 2
 *  i components/shopbrowser.tsx. */
export const FORSTA_MED_BILD = 48;

/** Hur många per alternativ sorteringsordning. Ett skärmfullt räcker — resten
 *  hinner hämtas medan man scrollar. */
export const TOPP_PER_SORTERING = 24;

/**
 * Slugs som ska bära bild direkt i nyttolasten.
 *
 * `list` ska vara produkterna i den ordning sidan visar dem (dvs efter en ev.
 * förberäknad orderRecommended), så grupp 1 blir "det man faktiskt ser".
 */
export function slugarMedBild(list: readonly Product[], dayMs = currentDayMs()): Set<string> {
  const ut = new Set<string>();
  for (const p of list.slice(0, FORSTA_MED_BILD)) ut.add(p.slug);

  // Är listan kortare än ett par skärmar är det ingen idé att räkna ut något —
  // allt ryms redan i grupp 1.
  if (list.length <= FORSTA_MED_BILD) return ut;

  const topp = (rankad: readonly Product[]) => {
    for (const p of rankad.slice(0, TOPP_PER_SORTERING)) ut.add(p.slug);
  };
  const universal = universalCollectionIds(list as Product[]);
  // Samma sex ordningar som SORTS i components/shopbrowser.tsx. Ändras listan
  // där måste den ändras här, annars blinkar det nya valet till utan bilder.
  topp(orderRecommended(list as Product[], universal, dayMs));
  topp(orderPopular(list as Product[], universal));
  topp([...list].sort((a, z) => createdAtMs(z) - createdAtMs(a)));
  topp([...list].sort((a, z) => a.priceNum - z.priceNum));
  topp([...list].sort((a, z) => z.priceNum - a.priceNum));
  topp([...list].sort((a, z) => a.name.localeCompare(z.name, "sv")));
  return ut;
}

/** Hur många av söksidans träffar som bär bild direkt: tio omgångar "Visa fler". */
export const SOK_MED_BILD = 240;

/**
 * Söksidans träffar till webbläsaren (app/sok/page.tsx).
 *
 * ☠️ TVÅ SAKER SKILJER SÖKSIDAN FRÅN LISTSIDORNA (2026-11-20):
 *
 *  1. DE SLUTSÅLDA BÄR ALLTID SIN BILD. Bildkartan (/api/kort-bilder) har bara
 *     det som går att köpa, och söksidan visar också det slutsålda, sist. En
 *     slutsåld träff bortom de första 48 fick därför aldrig någon bild: mätt
 *     på www samma dag stod 9 av 16 slutsålda för "bil", 6 av 20 för "soffa"
 *     och 68 av 80 för "bord" kvar med en tom fotoruta.
 *  2. DE FÖRSTA 240 TRÄFFARNA BÄR SIN BILD. Kartan väger 406 kB över nätet, och
 *     kunden väntade på den innan tredje omgången kort fick sina foton. En
 *     sökning har sällan fler än ett par hundra träffar ("bil" 204, "cykel"
 *     178, "soffa" 140), och bilderna för dem väger några kB i sidan. Bara
 *     det som ligger längre ner än så hämtas ur kartan.
 */
export function forSokClient(list: Product[], dayMs?: number): ListProduct[] {
  const medBild = slugarMedBild(list, dayMs);
  list.forEach((p, i) => { if (i < SOK_MED_BILD || !p.inStock) medBild.add(p.slug); });
  return forClient(list, medBild);
}

/** forClient, men med bilder bara för de produkter som kan stå i vyn direkt.
 *  `specNycklar` = kategorins måttfilter (lib/spec-config.ts); utan dem
 *  följer inga mått med. */
export function forListClient(list: Product[], dayMs?: number, specNycklar?: ReadonlySet<Nyckel>): ListProduct[] {
  return forClient(list, slugarMedBild(list, dayMs), specNycklar);
}
