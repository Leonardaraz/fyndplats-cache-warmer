// Mina sidor och inloggningens förmåner säger "kommer snart" bara när
// medlemspriset inte gäller (visuell audit 2026-11-06: en testare med
// medlemspris på varorna läste "Medlemspriser i kassan kommer snart" och
// "Medlemsrabatten gäller ännu inte i kassan").
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const las = (fil: string) => readFileSync(new URL(`../../app/konto/${fil}`, import.meta.url), "utf8");

test("Mina sidor: medlemspriset gäller → var det syns och undantagen; annars kommer snart", () => {
  const vy = las("mina-sidor.tsx");
  assert.match(vy, /export const PRIS_GALLER = "Ditt medlemspris visas på varorna, i varukorgen och i kassan\.";/);
  assert.match(vy, /inte reavaror eller Fyndauktionen, och går inte att kombinera med rabattkoder\./);
  // "Kommer snart" bara i grenen där priset inte gäller.
  assert.match(vy, /\{prisOppet \? \(\s*<p className=\{s\.snart\} data-pa="">[\s\S]*?\{PRIS_GALLER\}[\s\S]*?\) : \(\s*<p className=\{s\.snart\}>[\s\S]*?kommer snart/);
  assert.equal(vy.match(/kommer snart/g)?.length, 1);
  assert.match(vy, /\{prisOppet \? RABATT_UNDANTAG : `\$\{RABATT_INTE_AN\}/);
  assert.match(vy, /prisOppet = false,/);
  // Sidan räknar läget för just den här medlemmen (testare i läget test).
  const sida = las("page.tsx");
  assert.match(sida, /prisOppet=\{prisOppet\(pl, data\.medlem\)\}/);
  assert.match(sida, /<Formaner prisPa=\{\(await prisLage\(\)\) === "pa"\} \/>/);
  const formaner = las("formaner.tsx");
  assert.match(formaner, /\{prisPa \? " på det mesta i sortimentet" : " kommer snart"\}/);
});
