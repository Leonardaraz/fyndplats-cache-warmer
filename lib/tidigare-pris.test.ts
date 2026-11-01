// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// DET TIDIGARE PRISET VID EN PRISSÄNKNING.
//
// Provet vaktar två saker:
//
// 1. ORDEN. Konsumentverkets förslag till föreskrifter om prisinformation
//    (dnr 2026/816, 11 §) räknar upp fem uttryck, och listan är sluten. Ett
//    överstruket pris får bara visas när ett av dem står i direkt anslutning.
//    "Lägsta pris 30 dagar" eller "Ordinarie pris" är inte med.
//
// 2. VÄGEN. Varje yta som visar ett nedsatt pris ska gå genom
//    components/tidigare-pris.tsx. Ett överstruket belopp som skrivs direkt i
//    en komponent saknar uttrycket, och det är precis felet provet fäller.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { KONSUMENTVERKETS_UTTRYCK, UTTRYCK_KORT, UTTRYCK_LANG } from "./tidigare-pris.ts";

test("uttrycken är Konsumentverkets, ordagrant", () => {
  assert.deepEqual([...KONSUMENTVERKETS_UTTRYCK], [
    "Tidigare lägsta pris",
    "Lägsta pris de senaste 30 dagarna före prissänkningen",
    "Lägsta pris de senaste 30 dagarna",
    "Lägsta 30-dagarspris",
    "30-dagarspris",
  ]);
  assert.ok((KONSUMENTVERKETS_UTTRYCK as readonly string[]).includes(UTTRYCK_LANG));
  assert.ok((KONSUMENTVERKETS_UTTRYCK as readonly string[]).includes(UTTRYCK_KORT));
});

function tsxFiler(rot: string): string[] {
  const ut: string[] = [];
  for (const namn of readdirSync(rot)) {
    const väg = join(rot, namn);
    if (statSync(väg).isDirectory()) ut.push(...tsxFiler(väg));
    else if (väg.endsWith(".tsx")) ut.push(väg);
  }
  return ut;
}

const KOMPONENTEN = join("components", "tidigare-pris.tsx");
const filer = [...tsxFiler("app"), ...tsxFiler("components")];

test("inget överstruket belopp renderas utanför komponenten", () => {
  const fynd: string[] = [];
  for (const fil of filer) {
    if (fil === KOMPONENTEN) continue;
    const kallkod = readFileSync(fil, "utf8")
      // Kommentarer får nämna taggarna (card-gallery.tsx skriver "<del>" om en adressdel).
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    if (/<s[\s>]|<del[\s>]|<strike[\s>]|line-through/.test(kallkod)) fynd.push(fil);
  }
  assert.deepEqual(fynd, []);
});

test("ytorna som visar ett tidigare pris går genom komponenten", () => {
  // Klasserna som bar det överstrukna beloppet innan komponenten fanns. Får
  // bara sitta på <TidigarePris>, aldrig på ett eget element.
  const gamlaKlasser = ["pdp-price-old", "pprice-old", "htag-old", "auction-old", "a-hc-old", "a-lb-old"];
  const fynd: string[] = [];
  for (const fil of filer) {
    const kallkod = readFileSync(fil, "utf8");
    for (const klass of gamlaKlasser) {
      const egetElement = new RegExp(`<(?!TidigarePris)[A-Za-z]+[^>]*className="${klass}"`);
      if (egetElement.test(kallkod)) fynd.push(`${fil}: ${klass}`);
    }
  }
  assert.deepEqual(fynd, []);
  // Och varje yta använder den faktiskt.
  for (const fil of [
    "components/productview.tsx",
    "components/productcard.tsx",
    "app/page.tsx",
    "components/auction-card.tsx",
    "components/auction-hero-card.tsx",
    "components/auction-live-bar.tsx",
  ]) {
    assert.match(readFileSync(fil, "utf8"), /<TidigarePris\b/, fil);
  }
});

test("komponenten stryker bara beloppet, aldrig uttrycket", () => {
  const kallkod = readFileSync(KOMPONENTEN, "utf8");
  assert.match(kallkod, /<span className="tidigare-pris-uttryck">\{kort \? UTTRYCK_KORT : `\$\{UTTRYCK_LANG\}:`\}<\/span>\{" "\}\s*<s>\{belopp\}<\/s>/);
});
