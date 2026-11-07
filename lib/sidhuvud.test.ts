// Sidhuvudet: REA-regeln (lib/sidhuvud-rea.ts) och att sidan aldrig väntar in
// katalogen för menyernas skull (components/site.tsx, lib/sidhuvud-data.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { harRea } from "./sidhuvud-rea.ts";

const SITE = readFileSync(new URL("../components/site.tsx", import.meta.url), "utf8");
const DATA = readFileSync(new URL("./sidhuvud-data.ts", import.meta.url), "utf8");

/** Kroppen för en funktion i site.tsx, fram till nästa funktion. */
function kropp(start: string, slut: string): string {
  const a = SITE.indexOf(start);
  const b = SITE.indexOf(slut, a + start.length);
  assert.ok(a >= 0 && b > a, `hittar inte ${start} före ${slut} i components/site.tsx`);
  return SITE.slice(a, b);
}

test("REA-knappen kräver en nedsatt vara i lager", () => {
  assert.equal(harRea([]), false);
  assert.equal(harRea([{ onSale: true, inStock: false }, { onSale: false, inStock: true }]), false);
  assert.equal(harRea([{ onSale: false, inStock: true }, { onSale: true, inStock: true }]), true);
});

// ☠️ /konto och /tack byggs vid varje besök. När sidhuvudet väntade in
// katalogen tog Mina sidor 21,5 s på en kall instans (produktionen 2026-11-06).
test("sidhuvudet väntar inte in katalogen", () => {
  const sidhuvud = kropp("export async function SiteHeader", "async function Menyer");
  assert.doesNotMatch(sidhuvud, /sidhuvudsdata\(|getProducts\(|getCategoryTree\(/);
});

test("menyerna strömmas in bakom Suspense med de fasta länkarna som reserv", () => {
  assert.match(SITE, /<Suspense fallback=\{<MobileNav hasBlog=\{hasBlog\} \/>\}>\s*<Menyer del="mobil"/);
  assert.match(SITE, /<Suspense fallback=\{<MegaNav tree=\{\[\]\} hasBlog=\{hasBlog\} \/>\}>\s*<Menyer del="dator"/);
  const menyer = kropp("async function Menyer", "export async function SiteFooter");
  assert.match(menyer, /await sidhuvudsdata\(\)/);
});

// ☠️ unstable_cache provades först (7777e526). På förhandsbygget 2026-11-07
// laddade ändå 6 av 10 nya instanser hela katalogen: posten delades inte mellan
// instanserna. Mobilens och datorns meny delar i stället en uträkning per
// begäran med React cache().
test("menyns data räknas en gång per begäran, inte i datacachen", () => {
  assert.match(DATA, /import \{ cache \} from "react"/);
  assert.match(DATA, /export const sidhuvudsdata = cache\(/);
  assert.doesNotMatch(DATA, /from "next\/cache"|unstable_cache\(/);
});
