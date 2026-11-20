// tools/sok-matning/las-index.ts
//
// Läser ett sparat sökindex (/api/search-index) så som sökrutan gör: sista
// raden är kategoritabellen (och den tomma rutans sökexempel), ingen vara.
// Den lyfts av, och varornas kategorier följer med till sökningen.

import { readFileSync } from "node:fs";

export type Rad = { n: string; s?: string; o?: 1; k?: number[] };
export type Kat = { n: string; f: number };

export function lasIndex(fil: string): { idx: Rad[]; kat: Kat[]; kd: { kat: Kat[]; av: (h: Rad) => number[] | undefined } | undefined } {
  const allt = JSON.parse(readFileSync(fil, "utf8")) as unknown[];
  const sist = allt[allt.length - 1] as { kat?: [string, number][] } | undefined;
  const harTabell = Array.isArray(sist?.kat);
  const kat: Kat[] = harTabell ? sist!.kat!.map(([n, f]) => ({ n, f })) : [];
  const idx = (harTabell ? allt.slice(0, -1) : allt) as Rad[];
  return { idx, kat, kd: kat.length > 0 ? { kat, av: (h: Rad) => h.k } : undefined };
}
