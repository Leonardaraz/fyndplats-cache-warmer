// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// UNDER X KR-SIDORNAS TEXT STÅR UNDER PRODUKTERNA (Leonard 2026-11-03).
//
// Ovanför rutnätet tog brödtexten en hel mobilskärm innan första kortet. Den
// står nu i ett eget block efter produkterna, som kategorisidornas "Om …"-text
// och /rea (2026-10-07). Provet vaktar två saker:
//
// 1. ORDNINGEN. components/price-tier-page.tsx renderar rutnätet före texten,
//    och hjälten får ingen intro.
// 2. ORDEN. Mallen pekar aldrig "nedan" på produkter som nu står ovanför.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { priceTierIntro } from "./programmatic-templates.ts";

const sidan = readFileSync(join(import.meta.dirname, "..", "..", "components", "price-tier-page.tsx"), "utf8");

test("rutnätet står före texten, och hjälten har ingen intro", () => {
  const rutnat = sidan.indexOf('className="prodgrid"');
  const text = sidan.indexOf('className="sec kat-editorial"');
  assert.ok(rutnat > 0, "rutnätet finns");
  assert.ok(text > rutnat, "texten står efter rutnätet");
  const hjalte = sidan.slice(sidan.indexOf("<ProgHero"), sidan.indexOf("/>", sidan.indexOf("<ProgHero")));
  assert.doesNotMatch(hjalte, /\bintro=/, "ProgHero får ingen intro på under X kr-sidorna");
  assert.match(sidan.slice(text), /view\.intro\.map/, "hela introt står i blocket under rutnätet");
});

test("ingen variant av texten säger 'nedan' eller pekar neråt", () => {
  for (let seed = 0; seed < 3000; seed++) {
    const stycken = priceTierIntro({ categoryName: "Katthus", price: 1000, count: 19, minPrice: "499 kr", seed });
    const allt = stycken.join(" ");
    assert.doesNotMatch(allt, /\bnedan\b|längre ner|scrolla|rulla vidare/i, `seed ${seed}: ${allt}`);
  }
});
