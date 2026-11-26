// Run: node --test --experimental-strip-types lib/vit-platta.test.ts
//
// Vit bakgrund bakom varje produkt- och kategoribild (Leonard 2026-11-25):
// "Det är inte vit bakgrund överallt på produkt och kategori bilder, jag vill
// att det ska vara det."
//
// Mätt på www samma dag, i varje bild frågat vad som står bakom den: en varm
// platta (#F4EEE8, #F4EEE6 eller #F3ECE4) med fotot blandat mot den
// (mix-blend-mode:multiply) stod kvar på sju ytor. Produktkorten på datorns
// startsida, /butik och prissidornas översikt, avdelningsrutorna på startsidan
// och /butik, miniatyrerna i datorns och mobilens meny och på prissidorna,
// menyns stora ruta för en avdelning utan stämningsbild, och favoritlådan.
//
// Reglerna står i stil och markup, så proven läser källan. Kvittot i en riktig
// webbläsare är mätningen i CLAUDE.md ("Vit bakgrund bakom varje bild").
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const utanKommentarer = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const globals = utanKommentarer(las("app", "globals.css"));
const start = utanKommentarer(las("app", "startsida.css"));
const butik = utanKommentarer(las("app", "butik", "butik.css"));
const pris = utanKommentarer(las("app", "under-pris.css"));
const tema = utanKommentarer(las("app", "sasongstema.css"));
const STILAR: ReadonlyArray<readonly [string, string]> = [
  ["app/globals.css", globals],
  ["app/startsida.css", start],
  ["app/butik/butik.css", butik],
  ["app/under-pris.css", pris],
  ["app/sasongstema.css", tema],
];

/** Väljarna till varje regel som bär `egenskap` med `varde`. */
function valjareMed(css: string, uttryck: RegExp): string[] {
  const ut: string[] = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (uttryck.test(m[2])) ut.push(m[1].trim().replace(/\s+/g, " "));
  }
  return ut;
}

describe("den varma plattan är borta ur stilen", () => {
  // Tonerna som botten: #F4EEE8 (kortet och avdelningsrutorna), #F4EEE6
  // (menyernas miniatyrer), #F3ECE4 (menyns stora ruta) och #EFE3D6 (miniatyren
  // under pekaren). #F3ECE4 finns kvar som linje mellan mobilmenyns rader.
  // Hjältens bricka har tonen kvar i sin grund (.herotile i globals.css), under
  // studions egen botten (--studio-bricka): hjälten är undantaget, se nedan.
  it("ingen av plattans toner står kvar som botten, utom i hjältens bricka", () => {
    const TON = /background(-color)?:\s*(#F4EEE8|#F4EEE6|#F3ECE4|#EFE3D6)/i;
    const bar = STILAR.flatMap(([fil, css]) => valjareMed(css, TON).map((v) => `${fil}: ${v}`));
    assert.deepEqual(bar, ["app/globals.css: .herotile"]);
    for (const [fil, css] of STILAR) assert.doesNotMatch(css, /#F4EEE6|#EFE3D6/i, fil);
    assert.equal(globals.split("#F4EEE8").length - 1, 1);
  });

  // Blandningsläget var det som färgade fotots vita botten. Det finns kvar på
  // två ställen, och båda är med flit: hjältens fyra brickor står i studions
  // ljus (app/startsida.css, "Studion"), och fyndauktionens glöd är en toning
  // ovanpå kortet, inte ett foto.
  it("multiply finns bara på hjältens brickor och i fyndauktionens glöd", () => {
    const alla = STILAR.flatMap(([, css]) => valjareMed(css, /mix-blend-mode:multiply/));
    assert.deepEqual(alla.sort(), [".a-hc-img::after", ".a-stage .a-card .pimg::after", ".hem2 .herotile img"].sort());
  });

  it("inget produkt- eller kategorifoto har ett blandningsläge", () => {
    for (const [fil, css] of STILAR) {
      // En toning ovanpå (::after) är inget foto: fyndauktionens glöd får stå.
      for (const v of valjareMed(css, /mix-blend-mode:/).filter((x) => !/::(after|before)$/.test(x))) {
        assert.doesNotMatch(v, /\.pimg|\.mn-bild|\.kat-bild|\.b2-avd-bild|\.fav-bild|\.meganav-feature|\.sugg-/, `${fil}: ${v}`);
      }
    }
  });
});

describe("produktkortet: vit platta på varje sida", () => {
  it("plattan är vit i grunden, och ingen sida skriver över den", () => {
    assert.match(globals, /\.prod \.pimg\{[^}]*background:#fff;/);
    const egna = valjareMed(globals, /background:/).filter((v) => /\.pimg$/.test(v) && v !== ".prod .pimg");
    // Fyndauktionens kort har fotot kant i kant: dess botten syns bara medan fotot laddar.
    assert.deepEqual(egna, [".prod.auction-card .pimg"]);
    for (const css of [start, butik, pris]) assert.doesNotMatch(css, /\.pimg\b/);
  });

  it("på datorn har plattan en tunn ram, också på startsidan och /butik", () => {
    assert.match(globals, /@media\(min-width:881px\)\{\n  \.prod:not\(\.auction-card\):not\(\.blogg-kort\) \.pimg\{border:1px solid var\(--line\)\}\n\}/);
    assert.doesNotMatch(globals, /:is\(\.hem2,\.butik2\)/);
  });
});

describe("avdelningsrutorna: fotot som det är, en vara hel på vitt", () => {
  const hem = las("app", "page.tsx");
  const butiksidan = las("app", "butik", "page.tsx");

  it("rutan är vit och fotot ritas utan blandning, på startsidan och /butik", () => {
    assert.match(start, /\.hem2 \.kat-bild\{[^}]*aspect-ratio:4\/3;[^}]*background:#fff;/);
    assert.match(start, /\.hem2 \.kat-bild img\{object-fit:cover;-webkit-user-drag:none;/);
    assert.match(butik, /\.butik2 \.b2-avd-bild\{[^}]*aspect-ratio:4\/3;[^}]*background:#fff;/);
    assert.match(butik, /\.butik2 \.b2-avd-bild img\{object-fit:cover;-webkit-user-drag:none;/);
  });

  // En avdelning utan stämningsbild visar en vara. Varans vita botten går ihop
  // med den vita sidan, så rutan behöver en ram för att synas.
  it("en avdelning utan stämningsbild bär en egen klass, och den ger rutan en ram", () => {
    assert.match(start, /\.hem2 \.kat-produkt\{border:1px solid var\(--line\)\}/);
    assert.match(butik, /\.butik2 \.b2-avd-produkt\{border:1px solid var\(--line\)\}/);
    assert.match(hem, /className=\{stamning \? "kat-bild" : "kat-bild kat-produkt"\}/);
    assert.match(butiksidan, /className=\{stamning \? "b2-avd-bild" : "b2-avd-bild b2-avd-produkt"\}/);
    for (const kod of [hem, butiksidan]) {
      assert.match(kod, /const stamning = unsplashIForm\(categoryHero\((c|g)\.main\.name\), "4:3"\);\n\s+const bild = stamning \|\| (c|g)\.heroImg \|\| (c|g)\.thumbs\[0\];/);
    }
  });

  // Provat 2026-11-25: en kvadratisk bild med hela varan (contain) gjorde varan
  // en fjärdedel mindre än grannrutornas foton. Varan hämtas i rutans form, som
  // stämningsbilderna, och fyller rutan.
  it("varan hämtas i rutans form och fyller den, som stämningsbilderna", () => {
    for (const kod of [hem, butiksidan]) assert.match(kod, /src=\{tightFillUrl\(bild, 560, 420\)\}/);
    for (const css of [start, butik]) assert.doesNotMatch(css, /\.(kat-produkt|b2-avd-produkt) img/);
  });

  // ☠️ Rutan "Hela sortimentet" bär också .b2-avd-bild, och dess mörka botten
  // har samma vikt som rutans vita. Den som står sist vinner: i ett första
  // prov med den vita regeln sist blev rutan vit med vit text.
  it("☠️ den mörka rutan 'Hela sortimentet' står efter den vita regeln", () => {
    const vit = butik.indexOf(".butik2 .b2-avd-bild{");
    const mork = butik.indexOf(".butik2 .b2-alla-yta{");
    assert.ok(vit > -1 && mork > vit);
    assert.match(butik, /\.butik2 \.b2-alla-yta\{[^}]*background:var\(--ink\);color:#fff/);
    assert.equal(butik.split(".b2-avd-bild{").length - 1, 1, "en regel sätter rutans botten");
  });
});

describe("menyernas miniatyrer: vit ruta med tunn ram", () => {
  it("rutan är vit med ram, och fotot blandas inte", () => {
    assert.match(globals, /\.mn-bild\{flex:none;display:block;width:42px;height:42px;border:1px solid var\(--line\);border-radius:10px;background:#fff;overflow:hidden;/);
    assert.match(globals, /\.mn-bild img\{display:block;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity \.25s ease\}/);
  });

  it("med pekaren över raden byter ramen ton, inte rutan färg", () => {
    assert.match(globals, /\.meganav-sub:hover \.mn-bild\{border-color:#E7C3A7\}/);
    assert.match(pris, /\.pris2 \.b2-grupp-lista a:hover \.mn-bild,\.pris2 \.b2-grupp-lista a:focus-visible \.mn-bild\{border-color:#E7C3A7\}/);
    for (const css of [globals, pris]) assert.equal(valjareMed(css, /background:/).filter((v) => /:hover \.mn-bild|:focus-visible \.mn-bild/.test(v)).length, 0);
  });

  // Samma klass bär alla tre: datorns meny, mobilens meny och prissidornas register.
  it("mobilens stora miniatyr och prissidans runda ändrar bara måtten", () => {
    assert.match(globals, /\.mn-bild-stor\{width:56px;height:56px;border-radius:12px\}/);
    assert.match(globals, /\.mm-sub \.mn-bild\{width:46px;height:46px;border-radius:11px\}/);
    assert.match(pris, /\.pris2 \.p2-bild\{width:36px;height:36px;border-radius:50%\}/);
  });

  it("menyns stora ruta: vit, och en vara står i en tunn ram", () => {
    assert.match(globals, /\.meganav-feature-bild\{display:block;aspect-ratio:4\/5;margin-bottom:9px;border-radius:16px;overflow:hidden;background:#fff\}/);
    assert.match(globals, /\.meganav-feature-produkt\{border:1px solid var\(--line\)\}/);
    assert.match(globals, /\.meganav-feature-produkt img\{object-fit:contain;padding:16%\}/);
  });
});

describe("favoritlådan: vit ruta med tunn ram", () => {
  it("fotot står på vitt utan blandning", () => {
    assert.match(globals, /\.fav-bild\{[^}]*width:84px;height:84px;border:1px solid var\(--line\);border-radius:var\(--r-md\);overflow:hidden;background:#fff\}/);
    assert.match(globals, /\.fav-bild-img\{display:block;width:100%;height:100%;object-fit:cover\}/);
  });
});
