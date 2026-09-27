// lib/list-overview.ts
//
// Det filterpanelen behöver veta om HELA listan, räknat på servern.
//
// VARFÖR DEN FINNS (2026-09-27). Listsidorna skickade hela sin produktlista i
// sidans HTML, för att filtren och sorteringen räknas i webbläsaren. Uppmätt på
// skarp sajt: 1 300 kB av /alla-produkters 2 808 kB och 734 kB av
// /kategori/hem-inredning. Bing flaggade båda för "HTML size is too long"
// (gränsen är 1 MB). Nu bär sidan bara de första korten plus den här
// sammanfattningen, och resten hämtas från /api/lista när kunden rör filtren,
// sorteringen eller "Visa fler" (se components/shopbrowser.tsx).
//
// Sammanfattningen gör att panelen öppnas FÄRDIG: prisskalan, histogrammet,
// färgerna och deras antal står rätt redan innan listan kommit. Det är samma
// funktioner som ShopBrowser räknar med på sökresultaten — alltså samma svar.

import { priceBounds, prisHistogram, type HistStapel, type PriceBounds } from "./price-range";
import { fargNycklar } from "./variant-color-image";

/** Det sammanfattningen läser ur en produkt. Både Product och ListProduct passar. */
export type OversiktProdukt = {
  priceNum: number;
  inStock: boolean;
  colors?: string[];
};

export type ListOversikt = {
  /** Antal produkter i hela listan. */
  antal: number;
  bounds: PriceBounds | null;
  hist: HistStapel[];
  /** Färgnycklarna i skenans ordning, med antal utan andra filter. Tom när
   *  listan har färre än två färger — då renderas ingen färgskena. */
  farger: [string, number][];
  /** Finns något slutsålt i listan alls? Styr om "I lager" visas. */
  harSlutsalda: boolean;
};

export function listOversikt(items: readonly OversiktProdukt[]): ListOversikt {
  const bounds = priceBounds(items);
  const antalPerFarg = new Map<string, number>();
  for (const p of items) for (const k of p.colors || []) antalPerFarg.set(k, (antalPerFarg.get(k) ?? 0) + 1);
  return {
    antal: items.length,
    bounds,
    hist: prisHistogram(items, bounds),
    farger: fargNycklar(items).map((k) => [k, antalPerFarg.get(k) ?? 0]),
    harSlutsalda: items.some((p) => !p.inStock),
  };
}
