// lib/huvud-gom.test.ts — regeln för sidhuvudet som glider undan (lib/huvud-gom.ts)
// och att komponenten och stilen håller ihop med den.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALLTID_OVAN_PX, GOM_EFTER_PX, VISA_EFTER_PX, huvudStart, huvudSteg, type HuvudLage } from "./huvud-gom.ts";

const HOJD = 800;
const SIDA = 6000;
const m = (y: number, sidhojd = SIDA) => ({ y, hojd: HOJD, sidhojd });

/** Kör en följd av lägen och ger om sidhuvudet är gömt efter vart och ett. */
function kor(lagen: number[], fran: HuvudLage = huvudStart(m(lagen[0])), sidhojd = SIDA): { gomt: boolean[]; slut: HuvudLage } {
  let l = fran;
  const gomt: boolean[] = [];
  for (const y of lagen) {
    l = huvudSteg(l, m(y, sidhojd));
    gomt.push(l.gomt);
  }
  return { gomt, slut: l };
}

/** Ett jämnt svep från ett läge till ett annat, i steg om `steg` px. */
function svep(fran: number, till: number, steg = 10): number[] {
  const ut: number[] = [];
  const d = till > fran ? steg : -steg;
  for (let y = fran + d; d > 0 ? y < till : y > till; y += d) ut.push(y);
  ut.push(till);
  return ut;
}

test("sidhuvudet visas från början, också mitt i en sida (bakåtknappen)", () => {
  assert.equal(huvudStart(m(0)).gomt, false);
  assert.equal(huvudStart(m(2400)).gomt, false);
});

test("nära sidans topp visas sidhuvudet alltid", () => {
  const { gomt } = kor(svep(0, ALLTID_OVAN_PX));
  assert.ok(gomt.every((g) => !g));
  // Också när kunden kommer dit uppifrån en gömd sida i ett enda hopp (Till toppen).
  const nere = kor(svep(0, 1200)).slut;
  assert.equal(nere.gomt, true);
  assert.equal(huvudSteg(nere, m(ALLTID_OVAN_PX)).gomt, false);
  assert.equal(huvudSteg(nere, m(0)).gomt, false);
});

test("ett svep ner gömmer sidhuvudet, men inte ett litet ryck", () => {
  const start = 400;
  const fran = huvudStart(m(start));
  assert.equal(kor([start + GOM_EFTER_PX - 1], fran).gomt[0], false);
  assert.equal(kor([start + GOM_EFTER_PX], fran).gomt[0], true);
  // Många små steg åt samma håll räknas ihop: svepet mäts från där det började.
  const sma = kor(svep(start, start + GOM_EFTER_PX, 4), fran);
  assert.equal(sma.gomt.at(-1), true);
  assert.equal(sma.gomt.at(-2), false);
});

test("så fort man scrollar upp kommer det tillbaka", () => {
  const nere = kor(svep(0, 1200)).slut;
  assert.equal(nere.gomt, true);
  assert.equal(huvudSteg(nere, m(1200 - VISA_EFTER_PX + 1)).gomt, true, "en darrning visar inget");
  assert.equal(huvudSteg(nere, m(1200 - VISA_EFTER_PX)).gomt, false);
  // Och det stannar framme medan kunden fortsätter upp.
  const upp = kor(svep(1200, 600), nere);
  assert.ok(upp.gomt.slice(1).every((g) => !g));
});

test("riktningen byts: ett nytt svep mäts från där det förra slutade", () => {
  const nere = kor(svep(0, 1200)).slut;
  const framme = kor(svep(1200, 1100), nere).slut;
  assert.equal(framme.gomt, false);
  // Ner igen: göms först efter ett helt svep från vändpunkten, inte från sidans topp.
  const lite = kor([1100 + GOM_EFTER_PX - 1], framme);
  assert.equal(lite.gomt[0], false);
  assert.equal(kor([1100 + GOM_EFTER_PX], framme).gomt[0], true);
  // Darr upp och ner på samma ställe ändrar ingenting åt något håll.
  const darr = kor([1101, 1099, 1102, 1098, 1101, 1100], framme);
  assert.ok(darr.gomt.every((g) => !g));
  const darrGomt = kor([1201, 1199, 1202, 1198, 1201], nere);
  assert.ok(darrGomt.gomt.every((g) => g));
});

test("☠️ studsen i sidans botten på iOS räknas inte som att kunden scrollade upp", () => {
  const langst = SIDA - HOJD;
  const nere = kor(svep(0, langst)).slut;
  assert.equal(nere.gomt, true);
  // Sidan dras 90 px förbi botten och studsar tillbaka: läget hålls vid botten hela vägen.
  const studs = kor([langst + 40, langst + 90, langst + 60, langst + 20, langst], nere);
  assert.ok(studs.gomt.every((g) => g), "sidhuvudet gled fram av studsen");
  assert.equal(studs.slut.y, langst);
});

test("☠️ sidan dras förbi toppen på iOS: läget blir aldrig negativt", () => {
  const l = kor([-30, -80, -20, 0]);
  assert.ok(l.gomt.every((g) => !g));
  assert.equal(l.slut.y, 0);
  assert.equal(huvudSteg(huvudStart(m(0)), m(-80)).y, 0);
  assert.equal(huvudStart(m(-40)).y, 0);
  // En sida som är kortare än fönstret kan inte scrollas: sidhuvudet göms aldrig.
  const kort = kor([0, 50, 200, 400], huvudStart(m(0, 500)), 500);
  assert.ok(kort.gomt.every((g) => !g));
});

test("stilla sida ger samma läge tillbaka", () => {
  const nere = kor(svep(0, 1200)).slut;
  assert.equal(huvudSteg(nere, m(1200)), nere);
});

test("gränserna: visas nästan direkt, göms först efter ett tydligt svep", () => {
  assert.ok(VISA_EFTER_PX >= 4 && VISA_EFTER_PX <= 12, "så fort man scrollar upp");
  assert.ok(GOM_EFTER_PX >= 16 && GOM_EFTER_PX <= 60);
  assert.ok(GOM_EFTER_PX > VISA_EFTER_PX);
  // Sidhuvudet på mobilen är 133 px: närmare toppen än så står det på sin plats i sidan.
  assert.ok(ALLTID_OVAN_PX >= 133);
});

// ─── komponenten och stilen ─────────────────────────────────────────────────

const komponent = readFileSync(new URL("../components/huvud-gom.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const sajt = readFileSync(new URL("../components/site.tsx", import.meta.url), "utf8");

test("komponenten: lyssnar passivt, räknar en gång per bildruta och städar efter sig", () => {
  assert.match(komponent, /addEventListener\("scroll", vidScroll, \{ passive: true \}\)/);
  assert.match(komponent, /requestAnimationFrame\(/);
  assert.match(komponent, /removeEventListener\("scroll", vidScroll\)/);
  assert.match(komponent, /cancelAnimationFrame\(/);
  // Attributet skrivs bara när läget ändras, aldrig vid varje bildruta.
  assert.match(komponent, /if \(nytt\.gomt !== lage\.gomt\)/);
  assert.match(sajt, /<HuvudGom \/>/);
});

test("stilen: bara mobilens sidhuvud, med transform, och aldrig gömt medan det används", () => {
  const regel = /@media\(max-width:900px\)\{\s*\.sidhuvud\{transition:transform [^}]+\}\s*html\[data-huvud="gomt"\] \.sidhuvud\{transform:translateY\(calc\(-100% - 3px\)\)[^}]*\}/;
  assert.match(css, regel);
  // Sökläget och tangentbordets fokus i sidhuvudet håller det framme.
  assert.match(css, /html\[data-huvud="gomt"\]\[data-sok-lage\] \.sidhuvud,html\[data-huvud="gomt"\] \.sidhuvud:focus-within\{transform:none\}/);
  // Den som bett om mindre rörelse får inget glid.
  assert.match(css, /@media\(max-width:900px\) and \(prefers-reduced-motion:reduce\)\{\.sidhuvud\{transition:none\}\}/);
});
