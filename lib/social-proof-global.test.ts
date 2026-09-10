// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// social-proof.test.ts provar urvalsregeln. Det här provet vaktar något annat:
// att betyget bara har EN källa, och att antalet omdömen inte kryper tillbaka.
//
// Båda felen har hänt. lib/social-proof.ts berättar själv om "21 på 6 ställen
// som missades vid uppdatering", och 2026-09-05 tog Google bort nio omdömen ur
// profilen medan sajten stod kvar och påstod 38 tills Leonard råkade titta. Det
// var därför räkneverket togs bort helt: ett tal om den egna verksamheten som
// bara är sant mellan avläsningarna hör inte hemma på sidan.
//
// Ingenting hindrade att någotdera återkom. Nu gör det här provet det.
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
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ")
    .replace(/\s+/g, " ");

const ALL = ROOTS.flatMap((r) => files(r)).map((p) => ({ p, t: strip(readFileSync(p, "utf8")) }));

test("det finns ytor att granska", () => {
  assert.ok(ALL.length > 20, `hittade bara ${ALL.length} filer`);
});

test("ingen yta hårdkodar Googles butiksbetyg", () => {
  // Betyget kommer från getSocialProof(), som i sin tur faller tillbaka på
  // GOOGLE_RATING i lib/social-proof.ts. Skrivs siffran in i en komponent går
  // den inte längre att uppdatera på ett ställe — vilket är exakt hur sex ytor
  // en gång blev kvar på ett gammalt värde.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    // Ett betyg i tal, i närheten av ordet Google eller "av 5".
    if (/\b[45][.,]\d\b[^.]{0,40}(av 5|Google)|\bGoogle\b[^.]{0,40}\b[45][.,]\d\b/.test(t)) {
      bad.push(p);
    }
  }
  assert.deepEqual(bad, []);
});

test("antalet Google-omdömen visas inte någonstans", () => {
  // Produktkortens egna omdömesantal är något annat och räknas inte — de kommer
  // ur riktig recensionsdata per produkt. Det som är förbjudet är ett tal som
  // påstår hur många omdömen BUTIKEN har på Google.
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    if (/\bGoogle\b[^.]{0,60}\b\d{1,4}\s*(omdömen|omdöme|recensioner)/i.test(t)) bad.push(`${p}: Google + antal`);
    // Talet behöver inte vara utskrivet. "Visa alla {reviews.length} omdömen"
    // stod i GoogleReviews.tsx och slank förbi den här kontrollen i sin första
    // version, som krävde en bokstavlig siffra. Ett interpolerat uttryck är om
    // något värre: det påstår "alla" om ett tal ingen har tittat på.
    // ...men bara där texten handlar om Google. Utan den avgränsningen fällde
    // provet ProductReviews.tsx, vars "Visa alla {count} recensioner" är sann:
    // det är produktens egna omdömen och komponenten har allihop. Knappen
    // renderas dessutom bara när count > INITIAL (5), så pluralen stämmer alltid.
    // Det förbjudna är att påstå "alla" om Googles profil, som vi inte räknar.
    if (/\bGoogle\b/i.test(t) &&
        /(baserat på|Visa alla|Se alla)\s*(\d{1,4}|\{[^{}]+\}|\$\{[^{}]+\})\s*(omdömen|recensioner)/i.test(t)) {
      bad.push(`${p}: antal i knapp/text`);
    }
  }
  assert.deepEqual(bad, []);
});

test("var yta som visar betyget hämtar det från den delade källan", () => {
  const bad: string[] = [];
  for (const { p } of ALL) {
    const raw = readFileSync(p, "utf8");
    if (!/proof\.rating|proof\.ratingValue/.test(raw)) continue;
    if (/getSocialProof/.test(raw)) continue;
    bad.push(p);
  }
  assert.deepEqual(bad, []);
});
