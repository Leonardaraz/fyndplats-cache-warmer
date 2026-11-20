// tools/sok-matning/tangenter.ts
//
// Vad sökrutan räknar vid varje tangent (components/searchbox.tsx, onType):
// sökförslagen, kategorierna, rankningen och en eventuell andra rankning för
// ordet som listan visar. I Node, på en dator, mot ett sparat sökindex.
//
//   node --experimental-strip-types tools/sok-matning/tangenter.ts <index.json> [rot] [ord …]
//
// `rot` är en annan utcheckning av butiken, när dess motor ska mätas ("." för
// den här). Varje ord skrivs på en NY namnlista, uppvärmd som sökrutan värmer
// upp, så att motorns minne är tomt när ordet börjar: som för en kund som just
// öppnat rutan. Koden är varm (andra ord har körts först); en webbläsare som
// just laddat motorn är långsammare, se fart.cjs.

import { resolve } from "node:path";

// Hjälparen laddas som motorn nedan, med en uträknad sökväg: en vanlig import
// av en .ts-fil fäller butikens bygge (typkontrollen läser också tools/).
const { lasIndex } = (await import(new URL("./las-index.ts", import.meta.url).href)) as typeof import("./las-index");

const [indexFil, rot = ".", ...egna] = process.argv.slice(2);
if (!indexFil) {
  console.error("Användning: tangenter.ts <index.json> [rot] [ord …]");
  process.exit(1);
}
const ORD = egna.length > 0 ? egna : ["trägårdsmöbel", "kontorsmöbler", "uppresningsfåtölj", "barnmobel", "hundförvaring", "zzqqxx", "lapor", "xtolar", "soffa", "matbord", "hörnsoffa", "vedförvaring", "gungstol", "trädgårdsbelysning", "kattprylar", "skrivbord", "fatolj", "sangbord", "utemöbler", "julgran", "svart tv-bänk"];
const m = await import(resolve(rot, "lib/search.ts"));
const { idx, kat, kd } = lasIndex(indexFil);
const n = (h: { n: string }) => h.n;
const namn = idx.map((h) => m.normalize(h.n));
const katalog = kat.map((k, i) => ({ name: k.n, slug: String(i) }));
const forrad = m.byggOrdforrad(idx.map(n));
const tid = <T>(f: () => T): [number, T] => { const a = performance.now(); const r = f(); return [performance.now() - a, r]; };

// Värm koden på andra ord än de som mäts.
for (let v = 0; v < 3; v++) for (const o of ["trädgårdsbelysning", "kattprylar", "badrumsmöbler", "värmefläktra", "elkammin", "soffbord vit", "gungstölning", "barnsaker"]) for (let k = 2; k <= o.length; k++) { const q = o.slice(0, k); m.sokforslagINamn(forrad, namn, q, 3); m.rankaMedInfo(idx, n, q, namn.slice(), kd); m.matchaKategorier(q, katalog, 3); }

const alla: number[] = [];
let totalt = 0;
for (const o of ORD) {
  const lista = namn.slice();
  m.forberedKatalog?.(idx, lista, kd);
  let summa = 0;
  let tyngst = { q: "", ms: 0 };
  for (let k = 2; k <= o.length; k++) {
    const q = o.slice(0, k);
    const [tF, forslag] = tid(() => m.sokforslagINamn(forrad, lista, q, 3) as string[]);
    const [tK1] = tid(() => m.matchaKategorier(q, katalog, 3));
    const [tR, utfall] = tid(() => m.rankaMedInfo(idx, n, q, lista, kd) as { traffar: unknown[] });
    const mal = m.visaVarorFor(q, forslag, utfall.traffar.length) as string | null;
    const [tR2] = mal ? tid(() => m.rankaMedInfo(idx, n, mal, lista, kd)) : [0];
    const [tK2] = tid(() => m.matchaKategorier(mal || q, katalog, 3));
    const ms = tF + tK1 + tR + tR2 + tK2;
    summa += ms;
    alla.push(ms);
    if (ms > tyngst.ms) tyngst = { q, ms };
  }
  totalt += summa;
  console.log(`${o.padEnd(20)} ${summa.toFixed(0).padStart(5)} ms   tyngst "${tyngst.q}" ${tyngst.ms.toFixed(0)} ms`);
}
alla.sort((a, b) => a - b);
console.log(`\n${alla.length} tangenter på ${totalt.toFixed(0)} ms: median ${alla[Math.floor(alla.length / 2)].toFixed(1)} ms, nio av tio under ${alla[Math.floor(alla.length * 0.9)].toFixed(1)} ms, den tyngsta ${alla[alla.length - 1].toFixed(0)} ms`);
