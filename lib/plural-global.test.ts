// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// /butik skrev "1 produkter" tre gånger i produktion 2026-09-10: Mobiltillbehör,
// Pälsvård & Skötsel och Väskor & Necessärer innehåller en produkt var. Mätt i
// skarp HTML, inte gissat.
//
// Tretton ytor hårdkodade ordet i plural. Två — /sok och /kategori/[slug] — hade
// räknat rätt hela tiden, var för sig, med samma villkor skrivet två gånger.
// Regeln bor nu i productCountLabel()/categoryCountLabel() i lib/rating.ts.
//
// Provet letar efter ett interpolerat uttryck följt av ordet i plural. Just den
// formen är buggen: ett tal vars värde vi inte känner, och ett substantiv som
// bara stämmer när talet inte är ett.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components"];
const EXT = /\.(ts|tsx)$/;
const SKIP = /node_modules|\.next|\.test\.tsx?$/;

function files(dir: string, out: string[] = []): string[] {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (SKIP.test(p)) continue;
    if (statSync(p).isDirectory()) files(p, out);
    else if (EXT.test(p)) out.push(p);
  }
  return out;
}

const strip = (t: string) =>
  t.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ");

const ALL = ROOTS.flatMap((r) => files(r)).map((p) => ({ p, t: strip(readFileSync(p, "utf8")) }));

test("det finns ytor att granska", () => {
  assert.ok(ALL.length > 20, `hittade bara ${ALL.length} filer`);
});

test("inget räknat substantiv står i plural utan att böjas", () => {
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    for (const re of [
      // JSX: {uttryck} produkter
      /\{[^{}]+\}\s+(produkter|kategorier|omdömen)\b/g,
      // Mall-literal: ${uttryck} produkter
      /\$\{[^{}]+\}\s+(produkter|kategorier|omdömen)\b/g,
    ]) {
      for (const m of t.match(re) || []) {
        // Anropen till hjälparna bär redan böjningen i sitt namn.
        if (/CountLabel/.test(m)) continue;
        bad.push(`${p}: ${m.replace(/\s+/g, " ").slice(0, 70)}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test("ingen yta skriver om böjningsregeln på egen hand", () => {
  // /sok och /kategori/[slug] bar var sitt exemplar av
  // `count === 1 ? "produkt" : "produkter"`. Båda var rätt, och det är just
  // därför de är värda att fånga: två rätta kopior blir en rätt och en fel så
  // fort någon rör den ena.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    if (/===\s*1\s*\?\s*"(produkt|kategori|omdöme)"/.test(t)) bad.push(p);
  }
  assert.deepEqual(bad, []);
});
