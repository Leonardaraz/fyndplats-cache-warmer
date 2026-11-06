// Sidhuvudets meny och REA-knapp utan att en kall instans väntar in katalogen.
//
// ☠️ SIDHUVUDET VÄNTADE IN HELA KATALOGEN PÅ VARJE DYNAMISK SIDA. Menyn byggs ur
// alla produkter (getCategoryTree) och REA-knappen frågar om något är nedsatt.
// /konto, /tack, /offert, /omdome och /avregistrera byggs vid varje besök, och
// på en kall instans väntade de därför in 6 016 produkter i 61 sidor från Wix:
// 21,5 s för Mina sidor (mätt i produktionen 2026-11-06 23:30 UTC, efter en
// deploy). ISR-sidorna märkte inget, de byggs om i bakgrunden.
//
// Nu bygger en varm instans som förut, ur katalogen den redan har. En kall
// instans läser den färdiga menyn ur Vercels datacache och förnyar den där i
// bakgrunden när den blivit gammal (lib/sidhuvud-val.ts).
//
// ☠️ revalidate MÅSTE VARA PRODUKTSIDA_SEKUNDER. unstable_cache sänker den
// pågående renderingens revalidate om talet är lägre (lib/kort-livslangd.ts),
// och ett lägre tal hade gjort varje produktsida som byggs på en kall instans
// kortlivad.
// ☠️ INGEN TAGG. En tagg följer med till varje sida som läser posten, och
// revalidateTag hade byggt om alla sidor på en gång (lib/produkt-cache.ts).
// ☠️ EN DEGRADERAD KATALOG CACHAS ALDRIG. Byggd på reservlistan eller en kapad
// hämtning hade menyn saknat kategorier i sex timmar; funktionen kastar i
// stället, och sidhuvudet bygger då ur det instansen har.

import { unstable_cache } from "next/cache";
import { getCategoryTree, type CategoryNode } from "./category-groups";
import { utanAntal } from "./meny-antal";
import { getProducts, katalogenArDegraderad, katalogenLaddad } from "./products";
import { PRODUKTSIDA_SEKUNDER } from "./produkt-cache";
import { harRea, valjSidhuvud, type Sidhuvudsdata } from "./sidhuvud-val";

export type Meny = Sidhuvudsdata<CategoryNode>;

async function bygg(): Promise<Meny & { degraderad: boolean }> {
  const [tree, produkter] = await Promise.all([getCategoryTree(), getProducts()]);
  // Trädet utan antal: siffrorna hämtas i webbläsaren (lib/meny-antal.ts).
  return { tree: utanAntal(tree), hasSale: harRea(produkter), degraderad: katalogenArDegraderad(produkter) };
}

async function levande(): Promise<Meny> {
  const { tree, hasSale } = await bygg();
  return { tree, hasSale };
}

const delad = unstable_cache(
  async (): Promise<Meny> => {
    const { tree, hasSale, degraderad } = await bygg();
    if (degraderad) throw new Error("degraderad katalog cachas inte");
    return { tree, hasSale };
  },
  ["sidhuvud-meny-v1"],
  { revalidate: PRODUKTSIDA_SEKUNDER },
);

/** Menyn (utan antal) och om REA-knappen ska visas. */
export function sidhuvudsdata(): Promise<Meny> {
  return valjSidhuvud({ laddad: katalogenLaddad, levande, delad });
}
