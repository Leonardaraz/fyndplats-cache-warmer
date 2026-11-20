// tools/sok-matning/utfall.ts
//
// Sökmotorns utfall för en lång lista frågor, sparat i en fil som går att
// jämföra före och efter en ändring (jamfor.cjs). Se README.md.
//
// Körs från butikens rot:
//   node --experimental-strip-types tools/sok-matning/utfall.ts <index.json> <ut.json> [frågor.txt] [rot]
//
// Utan frågefil byggs frågorna ur katalogen: varje ord i ordförrådet, och
// ordpar och ordtrippel ur vart fjärde namn (runt 7 500 frågor för 7 700 namn).
// `rot` är en annan utcheckning av butiken, när dess motor ska mätas.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [indexFil, utFil, fragefil, rot] = process.argv.slice(2);
if (!indexFil || !utFil) {
  console.error("Användning: utfall.ts <index.json> <ut.json> [frågor.txt] [rot]");
  process.exit(1);
}
const m = await import(resolve(rot ?? ".", "lib/search.ts"));
const idx: { n: string }[] = JSON.parse(readFileSync(indexFil, "utf8"));
const namn = idx.map((h) => m.normalize(h.n));

function fragorUrKatalogen(): string[] {
  const ut = new Set<string>();
  for (const o of m.byggOrdforrad(idx.map((h) => h.n)).ord) ut.add(o.text);
  const SMA = new Set(["med", "och", "för", "till", "på", "av", "en", "ett", "som", "från", "i", "the"]);
  idx.forEach((h, i) => {
    if (i % 4 !== 0) return;
    const ord = m.normalize(h.n).split(/[^a-zåäö0-9-]+/).filter((o: string) => o.length >= 2 && !SMA.has(o));
    if (ord.length < 3) return;
    ut.add(`${ord[0]} ${ord[1]}`);
    ut.add(`${ord[0]} ${ord[ord.length - 1]}`);
    if (i % 12 === 0) ut.add(`${ord[2]} ${ord[0]}`);
    if (i % 16 === 0 && ord.length > 3) ut.add(`${ord[0]} ${ord[1]} ${ord[3]}`);
  });
  return [...ut];
}

const fragor = fragefil
  ? readFileSync(fragefil, "utf8").split("\n").map((s) => s.replace(/\s+#.*$/, "").trim()).filter((s) => s && !s.startsWith("#"))
  : fragorUrKatalogen();
const ut: Record<string, { n: number; s: string[]; t: string[]; v?: string }> = {};
const t0 = performance.now();
for (const q of fragor) {
  const u = m.rankaMedInfo(idx, (h: { n: string }) => h.n, q, namn);
  ut[q] = { n: u.traffar.length, s: u.strukna, t: u.traffar.slice(0, 5).map((x: { n: string }) => x.n), v: u.rattat };
}
writeFileSync(utFil, JSON.stringify(ut));
console.log(`${fragor.length} frågor på ${Math.round(performance.now() - t0)} ms → ${utFil}`);
