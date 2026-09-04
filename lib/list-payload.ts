// lib/list-payload.ts
// Vilka produkter som ska bära sin bild redan i sidans nyttolast.
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

/** forClient, men med bilder bara för de produkter som kan stå i vyn direkt. */
export function forListClient(list: Product[], dayMs?: number): ListProduct[] {
  return forClient(list, slugarMedBild(list, dayMs));
}
