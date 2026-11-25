// Run: node --test --experimental-strip-types lib/register-rader.test.ts
//
// Registret "Alla kategorier" på /butik: en rad per avdelning (Leonard
// 2026-11-25). Regeln för ordningen står i lib/register-rader.ts; formen står
// i app/butik/page.tsx och app/butik/butik.css, och de proven läser källan.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RAD_UTAN_KNAPP, radenFallsUt, storstForst } from "./register-rader.ts";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const utanKommentarer = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const sida = las("app", "butik", "page.tsx");
const css = utanKommentarer(las("app", "butik", "butik.css"));

describe("störst först", () => {
  const k = (name: string, count: number) => ({ name, count });

  it("kategorin med flest varor står först", () => {
    const ut = storstForst([k("Knästolar", 13), k("Fåtöljer", 276), k("Kontorsstolar", 177)]);
    assert.deepEqual(ut.map((x) => x.name), ["Fåtöljer", "Kontorsstolar", "Knästolar"]);
  });

  it("lika stora står i svensk bokstavsordning, med å, ä och ö sist", () => {
    const ut = storstForst([k("Ölglas", 10), k("Zinkbaljor", 10), k("Äggkoppar", 10), k("Askar", 10), k("Åror", 10)]);
    assert.deepEqual(ut.map((x) => x.name), ["Askar", "Zinkbaljor", "Åror", "Äggkoppar", "Ölglas"]);
  });

  it("listan som kommer in lämnas orörd: menyerna har sin egen ordning", () => {
    const inn = [k("B", 1), k("A", 2)];
    const ut = storstForst(inn);
    assert.deepEqual(inn.map((x) => x.name), ["B", "A"]);
    assert.notEqual(ut, inn);
  });

  it("övriga fält följer med, och en tom lista ger en tom lista", () => {
    const ut = storstForst([{ id: "1", name: "A", count: 1, slug: "a" }, { id: "2", name: "B", count: 5, slug: "b" }]);
    assert.deepEqual(ut[0], { id: "2", name: "B", count: 5, slug: "b" });
    assert.deepEqual(storstForst([]), []);
  });
});

describe("knappen 'Alla N'", () => {
  it("en rad med fler än fem kategorier fälls ut, en med fem eller färre visas hel", () => {
    assert.equal(RAD_UTAN_KNAPP, 5);
    assert.equal(radenFallsUt(6), true);
    assert.equal(radenFallsUt(5), false);
    assert.equal(radenFallsUt(0), false);
  });
});

describe("sidan: en rad per avdelning, alla länkar kvar", () => {
  const register = sida.slice(sida.indexOf('className="b2-register b2-rader"'), sida.indexOf('<section className="b2-tryggt"'));

  it("registret bär .b2-rader, och prissidornas register gör det inte", () => {
    assert.equal(sida.split('className="b2-register b2-rader"').length - 1, 1);
    const prissidan = las("components", "price-hub-page.tsx");
    assert.match(prissidan, /className="b2-register"/);
    assert.doesNotMatch(prissidan, /b2-rader|b2-vaxla|b2-fler/);
  });

  it("varje kategori är en länk, i ordningen störst först", () => {
    assert.match(register, /const subs = storstForst\(g\.subs\);/);
    assert.match(register, /\{subs\.map\(\(s\) => \(\s*<li key=\{s\.id\}>\s*<a href=\{`\/kategori\/\$\{s\.slug\}`\}>/);
    // Ingen kategori hålls undan: raden klipps i stilen, inte i markupen.
    assert.doesNotMatch(register, /subs\.slice\(|\.filter\(/);
  });

  // Talen i hjälten räknas ur samma lista (antalKategorierIRegistret), och
  // sorteringen ändrar inte hur många de är.
  it("hjältens tal räknas fortfarande ur grupperna, inte ur den sorterade listan", () => {
    assert.match(sida, /const antalKategorier = antalKategorierIRegistret\(groups\);/);
  });

  it("antalet bär ordet, böjt av hjälparen: '1 584 produkter' på datorn", () => {
    assert.match(register, /<span className="b2-grupp-antal">\{tusental\(g\.count\)\}<span className="b2-grupp-ord"> \{produktOrd\(g\.count\)\}<\/span><\/span>/);
  });

  // Kryssrutan bär namnet, etiketten är den synliga knappen. Namnet rymmer
  // texten som syns ("Alla 30" i "Visa alla 30 kategorier i Möbler", WCAG
  // 2.5.3), också när raden är utfälld: texten byts inte, pilen vänder.
  it("knappen är en kryssruta med namn, och etiketten läses inte en gång till", () => {
    assert.match(register, /const falls = radenFallsUt\(subs\.length\);/);
    assert.match(register, /<input\s+className="b2-vaxla"\s+type="checkbox"\s+id=\{vaxla\}\s+aria-label=\{`Visa alla \$\{categoryCountLabel\(subs\.length\)\} i \$\{g\.main\.name\}`\}\s+\/>/);
    assert.match(register, /<label className="b2-fler" htmlFor=\{vaxla\} aria-hidden="true">\s+Alla \{subs\.length\}\s+<svg /);
    assert.match(register, /const vaxla = `b2-fler-\$\{g\.main\.slug\}`;/);
  });

  // Syskonväljaren (~) i stilen kräver ordningen: kryssrutan, listan, etiketten.
  it("☠️ kryssrutan står före listan och etiketten efter", () => {
    const ruta = register.indexOf('className="b2-vaxla"');
    const lista = register.indexOf('className="b2-grupp-lista"');
    const lapp = register.indexOf('className="b2-fler"');
    assert.ok(ruta > -1 && ruta < lista && lista < lapp);
  });

  it("registret har fortfarande inga bilder", () => {
    assert.doesNotMatch(register, /<Image|<img/);
  });
});

describe("stilen: raderna gäller datorn, telefonen sveper som förut", () => {
  const dator = css.slice(css.indexOf("@media(min-width:881px){\n  .butik2 .b2-rader{"));
  const block = dator.slice(0, dator.indexOf("\n}\n") + 2);

  it("knappen, kryssrutan och ordet är dolda i grunden", () => {
    assert.match(css, /\.butik2 \.b2-vaxla,\.butik2 \.b2-fler,\.butik2 \.b2-grupp-ord\{display:none\}/);
    assert.ok(css.indexOf(".butik2 .b2-vaxla,.butik2 .b2-fler,.butik2 .b2-grupp-ord{display:none}") < css.indexOf("@media(min-width:881px){\n  .butik2 .b2-rader{"));
  });

  it("varje regel för raderna står under .b2-rader och från 881 px", () => {
    assert.ok(block.length > 800, "hittar inte datorns block");
    for (const m of block.matchAll(/\n\s+(\.butik2 [^{}]+)\{/g)) assert.match(m[1], /^\.butik2 \.b2-rader/, m[1]);
    // Utanför mediefrågorna nämns .b2-rader inte alls.
    const utanMedia = css.replace(/@media[^{]*\{(?:[^{}]|\{[^{}]*\}|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, "");
    assert.doesNotMatch(utanMedia, /\.b2-rader/);
  });

  it("raden är ett rutnät: namnet, knapparna och 'Alla N'", () => {
    assert.match(block, /\.butik2 \.b2-rader \.b2-grupp\{position:relative;display:grid;grid-template-columns:minmax\(0,236px\) minmax\(0,1fr\) 96px;/);
    assert.match(block, /\.butik2 \.b2-rader \.b2-grupp-lista a\{[^}]*min-height:40px;padding:0 15px;border:1px solid var\(--line\);\s*border-radius:var\(--r-pill\);background:#fff;/);
    assert.match(block, /\.butik2 \.b2-rader \.b2-grupp-ord\{display:inline\}/);
  });

  // ☠️ Kategorierna utanför första raden är klippta, inte borttagna, och går
  // att nå med tangentbordet. Utan :has rullade webbläsaren den klippta rutan
  // för att visa länken i fokus. Därför klipps raden BARA i en webbläsare som
  // kan fälla ut den när fokus står i den.
  it("☠️ raden klipps bara där webbläsaren kan fälla ut den vid fokus", () => {
    const has = block.slice(block.indexOf("@supports selector(:has(a)){"));
    assert.ok(has.length > 200, "hittar inte @supports-blocket");
    assert.match(has, /\.butik2 \.b2-rader \.b2-vaxla~\.b2-grupp-lista\{grid-column:2;max-height:52px;overflow:hidden\}/);
    assert.match(has, /\.butik2 \.b2-rader \.b2-vaxla:checked~\.b2-grupp-lista,\s*\.butik2 \.b2-rader \.b2-vaxla~\.b2-grupp-lista:has\(a:focus-visible\)\{max-height:none\}/);
    // Utanför blocket finns ingen klippning och ingen synlig knapp.
    const fore = block.slice(0, block.indexOf("@supports selector(:has(a)){"));
    assert.doesNotMatch(fore, /max-height|overflow:hidden/);
    assert.doesNotMatch(fore, /\.b2-fler\{|\.b2-vaxla\{/);
  });

  // 40 px knapp och 6 px luft upptill och nedtill: nästa rad börjar 54 px ner.
  it("☠️ listans luft rymmer fokusringen, och klippet går mellan första och andra raden", () => {
    assert.match(block, /\.butik2 \.b2-rader \.b2-grupp-lista\{grid-column:2\/-1;grid-row:1;display:flex;flex-wrap:wrap;gap:8px;margin:-6px;padding:6px\}/);
  });

  it("kryssrutan ligger osynlig över etiketten, och fokus syns på etiketten", () => {
    assert.match(block, /\.butik2 \.b2-rader \.b2-vaxla\{display:block;position:absolute;top:14px;right:0;z-index:1;width:96px;height:40px;margin:0;opacity:0;cursor:pointer\}/);
    assert.match(block, /\.butik2 \.b2-rader \.b2-vaxla:focus-visible~\.b2-fler\{outline:2px solid var\(--brand\);outline-offset:2px;/);
    assert.match(block, /\.butik2 \.b2-rader \.b2-vaxla:checked~\.b2-fler svg\{transform:rotate\(180deg\)\}/);
  });

  it("telefonens register är orört: en rad man sveper, utan antal i knapparna", () => {
    const mobil = css.slice(css.indexOf("@media(max-width:880px){"));
    assert.match(mobil, /\.butik2 \.b2-grupp-lista\{position:relative;display:flex;gap:8px;margin-inline:-26px;padding:2px 26px 4px;overflow-x:auto;/);
    assert.match(mobil, /\.butik2 \.b2-sub-antal\{display:none\}/);
    assert.doesNotMatch(mobil.slice(0, mobil.indexOf("\n}\n")), /b2-rader|b2-vaxla|b2-fler/);
  });
});
