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
  // Samma läsning styr vägen till företagskontot (visaForetagsvag), därav variabeln.
  assert.match(sida, /const prisPa = \(await prisLage\(\)\) === "pa";/);
  assert.match(sida, /<Formaner prisPa=\{prisPa\} \/>/);
  const formaner = las("formaner.tsx");
  assert.match(formaner, /\{prisPa \? " på det mesta i sortimentet" : " kommer snart"\}/);
});

test("ordertrappan på produktsidan har egen pil, inte webbläsarens triangel", () => {
  const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.foretagstrappa summary\{[^}]*list-style:none/);
  assert.match(css, /\.foretagstrappa summary::-webkit-details-marker\{display:none\}/);
  assert.match(css, /\.foretagstrappa\[open\] summary::after\{transform:translateY\(1px\) rotate\(225deg\)\}/);
});

test("ett företag som godkänns direkt (aktivt hos Bolagsverket) ser kortet med profilvalet, inte \"Vi kontrollerar\"", () => {
  const ft = las("foretag.tsx");
  // Namnet följer med till den direkta vägen (/konto/foretag), som visar det i sista steget.
  assert.match(ft, /if \(svar\.ok\) return efter\(svar\.status \?\? "granskas", svar\.namn\);/);
  assert.match(ft, /<Ansokan efter=\{\(status\) => \(status === "aktiv" \? ladda\(\) : setSkickad\(true\)\)\} \/>/);
});

test("företagsansökan: ett stoppat skick ger fokus på första felet, och varje fält med fel säger det till skärmläsaren (audit 2026-11-06)", () => {
  const ft = las("foretag.tsx");
  // Fokus till det första felet efter varje skick som stoppades, som kassan (forstaFel).
  assert.match(ft, /if \(felRunda > 0\) formular\.current\?\.querySelector<HTMLElement>\('\[aria-invalid="true"\]'\)\?\.focus\(\);/);
  assert.match(ft, /setFel\(prov\.fel\);\s*setFelRunda\(\(n\) => n \+ 1\);/);
  assert.match(ft, /<form ref=\{formular\} className=\{s\.foretagForm\}/);
  // Varje fält vars fel visas med faltfel(x) bär felAttr(x): aria-invalid och fel-<x>.
  const ansokan = ft.slice(ft.indexOf("function Ansokan"), ft.indexOf("function Villkor"));
  const medFeltext = [...ansokan.matchAll(/\{faltfel\("(\w+)"\)\}/g)].map((m) => m[1]).filter((f) => f !== "namn");
  assert.ok(medFeltext.length >= 7, `för få fält: ${medFeltext.join(", ")}`);
  for (const f of medFeltext) assert.match(ansokan, new RegExp(`name="${f}"[^>]*\\{\\.\\.\\.felAttr\\("${f}"\\)\\}`), `${f} saknar felAttr`);
  assert.match(ansokan, /const felAttr = \(f: keyof Faltfel\) => \(fel\[f\] \? \{ "aria-invalid": true, "aria-describedby": `fel-\$\{f\}` \} : \{\}\);/);
  // Numret och namnet har egna beskrivningar; de får aria-invalid när de är fel.
  assert.match(ansokan, /aria-invalid=\{fel\.orgnr \? true : undefined\}/);
  assert.match(ansokan, /aria-invalid=\{fel\.namn \? true : undefined\}/);
});
