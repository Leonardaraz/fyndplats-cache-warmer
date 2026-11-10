// Jämför sökningen före och efter en ändring i lib/search.ts, mot butikens
// riktiga produktnamn. Skriver vilka sökningar som ger en annan lista.
//
//   node --experimental-strip-types --no-warnings scripts/sok-jamfor.mjs
//   node --experimental-strip-types --no-warnings scripts/sok-jamfor.mjs fatolj "tv bank"
//
// Väljare:
//   --ref <gren|commit>   versionen att jämföra mot (förval: origin/headless-site)
//   --index <fil.json>    sparat svar från /api/search-index i stället för att hämta
//   --alla                skriv också de sökningar som inte ändrats
//
// Utan egna sökningar görs en lista ur katalogen: första ordet och de två
// första orden i varje namn, och varje ord som står i minst fem namn. Det är
// samma mätning som låg bakom ändringen 2026-11-10 (34 av 3 465 ändrade).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const arg = process.argv.slice(2);
const ta = (namn) => {
  const i = arg.indexOf(namn);
  return i < 0 ? null : arg.splice(i, 2)[1];
};
const ref = ta("--ref") ?? "origin/headless-site";
const indexFil = ta("--index");
const alla = arg.includes("--alla");
const fragorArg = arg.filter((a) => !a.startsWith("--"));

const index = indexFil
  ? JSON.parse(readFileSync(indexFil, "utf8"))
  : await (await fetch("https://www.fyndplats.se/api/search-index")).json();
const namn = index.map((h) => h.n);

const katalog = mkdtempSync(join(tmpdir(), "sok-jamfor-"));
const foreFil = join(katalog, "search-fore.ts");
writeFileSync(foreFil, execFileSync("git", ["show", `${ref}:lib/search.ts`], { maxBuffer: 16e6 }));
const fore = await import(pathToFileURL(foreFil).href);
const efter = await import(new URL("../lib/search.ts", import.meta.url).href);

function urKatalogen() {
  const ord = (s) => s.toLowerCase().split(/[^a-zåäö0-9]+/).filter(Boolean);
  const forsta = new Set();
  const tva = new Map();
  const varje = new Map();
  for (const n of namn) {
    const t = ord(n);
    if (t[0]) forsta.add(t[0]);
    if (t.length >= 2) tva.set(`${t[0]} ${t[1]}`, (tva.get(`${t[0]} ${t[1]}`) ?? 0) + 1);
    for (const w of new Set(t)) if (w.length >= 3 && !/^\d+$/.test(w)) varje.set(w, (varje.get(w) ?? 0) + 1);
  }
  return [...new Set([
    ...forsta,
    ...[...tva].filter(([, v]) => v >= 2).map(([k]) => k),
    ...[...varje].filter(([, v]) => v >= 5).map(([k]) => k),
  ])].sort();
}

const fragor = fragorArg.length > 0 ? fragorArg : urKatalogen();
const topp = (r) => r.slice(0, 3).map((x) => x.slice(0, 36)).join(" | ");
let andrade = 0;
for (const q of fragor) {
  const a = fore.rankByName(namn, (n) => n, q);
  const b = efter.rankByName(namn, (n) => n, q);
  const lika = a.length === b.length && a.every((x, i) => x === b[i]);
  if (!lika) andrade++;
  if (lika && !alla) continue;
  console.log(`${lika ? "=" : "≠"} ${q.padEnd(26)} ${String(a.length).padStart(4)} → ${String(b.length).padStart(4)}`);
  if (!lika) {
    console.log(`    före:  ${topp(a)}`);
    console.log(`    efter: ${topp(b)}`);
  }
}
console.log(`${namn.length} namn, ${fragor.length} sökningar: ${fragor.length - andrade} oförändrade, ${andrade} ändrade (mot ${ref})`);
