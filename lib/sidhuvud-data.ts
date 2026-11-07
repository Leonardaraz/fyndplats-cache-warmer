// Sidhuvudets meny och REA-knapp, ur katalogen. Menyerna strömmas in efter
// resten av sidan (Suspense i components/site.tsx).
//
// ☠️ SIDHUVUDET VÄNTADE IN HELA KATALOGEN PÅ VARJE DYNAMISK SIDA. Menyn byggs ur
// alla produkter (getCategoryTree) och REA-knappen frågar om något är nedsatt.
// /konto, /tack, /offert, /omdome och /avregistrera byggs vid varje besök, och
// på en kall instans väntade de därför in 6 016 produkter i 61 sidor från Wix:
// 21,5 s för Mina sidor (mätt i produktionen 2026-11-06 23:30 UTC, efter en
// deploy). Nu skickas sidan direkt, och menyerna fylls i när katalogen är klar.
// En ISR-sida väntar ändå in allt innan den sparas, så den sparade sidan har
// alltid hela menyn.
//
// ☠️ DATACACHEN LÖSER INTE DET HÄR. Första försöket (7777e526) lade den färdiga
// menyn i unstable_cache. På förhandsbygget 2026-11-07 laddade ändå 6 av 10 nya
// instanser hela katalogen (23–25 s): posten delades inte mellan instanserna.
//
// React cache(): mobilens och datorns meny delar EN uträkning per begäran.

import { cache } from "react";
import { getCategoryTree, type CategoryNode } from "./category-groups";
import { utanAntal } from "./meny-antal";
import { getProducts } from "./products";
import { harRea } from "./sidhuvud-rea";

export type Meny = { tree: CategoryNode[]; hasSale: boolean };

/** Menyn (utan antal) och om REA-knappen ska visas. */
export const sidhuvudsdata = cache(async (): Promise<Meny> => {
  const [tree, produkter] = await Promise.all([getCategoryTree(), getProducts()]);
  // Trädet utan antal: siffrorna hämtas i webbläsaren (lib/meny-antal.ts).
  return { tree: utanAntal(tree), hasSale: harRea(produkter) };
});
