// tools/sok-matning/stavfel.ts
//
// Felstavningar av katalogens 150 vanligaste varuord (namnens första ord, minst
// sex tecken): ett tecken borta, två omkastade, fel vokal och ett dubblat.
// Facit är träffarna för det rättstavade ordet. Täckning = hur stor del av
// facit felstavningen hittar, renhet = hur stor del av träffarna som hör dit.
//
//   node --experimental-strip-types tools/sok-matning/stavfel.ts <index.json> [rot att jämföra med]

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const [indexFil, annanRot] = process.argv.slice(2);
if (!indexFil) {
  console.error("Användning: stavfel.ts <index.json> [rot att jämföra med]");
  process.exit(1);
}
type Motor = { rankByName: (items: unknown[], namn: (h: { n: string }) => string, q: string) => { n: string }[] };
const har: Motor = await import(resolve("lib/search.ts"));
const dar: Motor | null = annanRot ? await import(resolve(annanRot, "lib/search.ts")) : null;
const idx: { n: string }[] = JSON.parse(readFileSync(indexFil, "utf8"));

const antal = new Map<string, number>();
for (const h of idx) {
  const o = h.n.toLowerCase().split(/[^a-zåäö]+/)[0];
  if (o && o.length >= 6) antal.set(o, (antal.get(o) ?? 0) + 1);
}
const ord = [...antal.entries()].sort((a, b) => b[1] - a[1]).slice(0, 150).map((x) => x[0]);
const fel = (o: string): string[] => {
  const m = Math.floor(o.length / 2);
  const iVokal = [...o].findIndex((c, i) => i > 0 && "aeiouyåäö".includes(c));
  return [
    o.slice(0, m) + o.slice(m + 1),
    o.slice(0, m - 1) + o[m] + o[m - 1] + o.slice(m + 1),
    iVokal > 0 ? o.slice(0, iVokal) + (o[iVokal] === "e" ? "a" : "e") + o.slice(iVokal + 1) : o + "e",
    o.slice(0, m) + o[m] + o.slice(m),
  ].filter((x) => x !== o);
};
const kor = (lib: Motor, q: string) => new Set(lib.rankByName(idx, (h) => h.n, q).map((x) => x.n));
const mat = (lib: Motor, etikett: string) => {
  let prov = 0, tomma = 0, tackning = 0, renhet = 0;
  for (const o of ord) {
    const facit = kor(lib, o);
    if (facit.size === 0) continue;
    for (const f of fel(o)) {
      const r = kor(lib, f);
      const ratt = [...r].filter((n) => facit.has(n)).length;
      prov++;
      if (r.size === 0) tomma++;
      tackning += ratt / facit.size;
      renhet += r.size ? ratt / r.size : 0;
    }
  }
  console.log(`${etikett}: ${prov} felstavningar, tomma svar ${tomma}, täckning ${((100 * tackning) / prov).toFixed(1)} %, renhet ${((100 * renhet) / prov).toFixed(1)} %`);
};
mat(har, "den här utcheckningen");
if (dar) mat(dar, annanRot);
