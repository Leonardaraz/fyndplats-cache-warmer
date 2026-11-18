// Run: node --test --experimental-strip-types lib/produktkortet.test.ts
//
// Produktkortet är en bricka, överallt (Leonard 2026-11-18). Förut hade kortet
// två utseenden: ramlösa brickor på startsidan, /butik och prissidorna, och ett
// kort med ram och knappen "Visa produkt" i listorna. Reglerna står i stil och
// markup, så proven läser källan.
//
// Samma fil vaktar de tre andra besluten från samma dag: sidans huvudrubrik i
// rubriktypsnittet på infosidorna, lådornas gemensamma tomma läge och ett ord
// för kundtjänsten.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const utanKommentarer = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const css = utanKommentarer(las("app", "globals.css"));
const kort = las("components", "productcard.tsx");

describe("produktkortet är en bricka utan ram och utan knapp", () => {
  it("grunden har ingen ram, ingen bakgrund och ingen skugga", () => {
    assert.match(css, /(^|\})\s*\.prod\{display:flex;flex-direction:column\}/m);
    assert.match(css, /\.prod \.pimg\{aspect-ratio:1;position:relative;overflow:hidden;isolation:isolate;border-radius:var\(--r-lg\);background:#F4EEE8;/);
    assert.match(css, /\.prod \.pimg img\{mix-blend-mode:multiply\}/);
    assert.match(css, /\.prod \.pbody\{flex:1;display:flex;flex-direction:column;padding:12px 2px 0\}/);
  });

  it("knappen är borta ur kortet och ur stilen", () => {
    assert.doesNotMatch(kort.replace(/\{\/\*[\s\S]*?\*\/\}/g, ""), /pbtn|Visa produkt|Bevaka/);
    assert.doesNotMatch(css, /\.pbtn/);
    for (const fil of [las("app", "startsida.css"), las("app", "butik", "butik.css")]) assert.doesNotMatch(utanKommentarer(fil), /\.pbtn/);
  });

  it("priset står sist i kortet och linjerar mellan grannkort", () => {
    assert.match(css, /\.prod \.prow\{display:flex;flex-direction:column;align-items:stretch;margin-top:auto;padding-top:8px\}/);
    assert.match(css, /\.prod \.pprice\{font-size:var\(--text-lg\);font-weight:800;color:var\(--brand\);/);
  });

  it("namnet kapas vid två rader, och vid tre i listorna", () => {
    assert.match(css, /\.prod \.pname\{font-size:var\(--text-sm\);font-weight:600;line-height:1\.35;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;/);
    assert.match(css, /\.shoplista \.prod \.pname\{-webkit-line-clamp:3\}/);
    assert.match(las("components", "shopbrowser.tsx"), /className=\{`prodgrid listgrid shoplista\$\{vantar \? " is-vantar" : ""\}`\}/);
  });

  // Mätt 2026-11-18 på förhandsvisningen: med tre rader kapades 42–63 % av
  // namnen i listorna på en 393 px bred skärm (63–88 % på 360 px), där
  // produktionen visade hela namnet. Med fyra kapas högst ett av 24.
  it("på mobilen får listornas namn fyra rader, direkt efter grundregeln", () => {
    assert.match(css, /\.shoplista \.prod \.pname\{-webkit-line-clamp:3\}\s*@media\(max-width:540px\)\{\.shoplista \.prod \.pname\{-webkit-line-clamp:4\}\}/);
  });

  it("brickans regler står på ett ställe: startsidan och /butik skriver inte över kortet", () => {
    for (const fil of [las("app", "startsida.css"), las("app", "butik", "butik.css")]) {
      assert.doesNotMatch(utanKommentarer(fil), /\.prod\b/);
    }
    assert.doesNotMatch(css, /\.alla-prod \.prod\b/);
  });

  it("lyftet och pilen finns bara med hovrande pekare, och bara plattan flyttas", () => {
    const hover = css.slice(css.indexOf("@media (hover:hover){\n  .prod:not(.auction-card):hover .pname"));
    const block = hover.slice(0, hover.indexOf("\n}\n") + 3);
    assert.match(block, /\.prod:not\(\.auction-card\):hover \.pimg\{transform:translateY\(-4px\);box-shadow:[^}]+\}/);
    assert.match(block, /\.prod:not\(\.auction-card\) \.pimg::after\{content:"→";[^}]*opacity:0;[^}]*pointer-events:none\}/);
    assert.match(block, /\.prod:not\(\.auction-card\):hover \.pimg::after,\.prod:not\(\.auction-card\):focus-visible \.pimg::after\{opacity:1;transform:none\}/);
    // Ingen transform på själva kortet: den bröt svepet mellan bilderna på iPhone.
    assert.doesNotMatch(css, /\.prod:hover\{transform/);
    assert.doesNotMatch(css.replace(/\.prod\.auction-card:hover\{[^}]*\}/g, ""), /\.prod[^{,]*:hover\{transform/);
  });

  it("tangentbordet ser var det står", () => {
    assert.match(css, /\.prod:focus-visible\{outline:2px solid var\(--brand\);outline-offset:6px;border-radius:var\(--r-lg\)\}/);
  });

  it("rörelsen stängs av för den som bett om det", () => {
    assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.prod \.pimg,\.prod \.pimg::after\{transition:none\}\.prod:not\(\.auction-card\):hover \.pimg\{transform:none\}\}/);
  });

  it("mobilens rutnät håller sig inom containern, så plattorna linjerar med rubriken", () => {
    assert.match(css, /@media\(max-width:540px\)\{\s*\.prodgrid\.listgrid\{grid-template-columns:repeat\(2,1fr\);gap:24px 12px\}\s*\.listgrid \.prod \.pbody\{padding:10px 2px 0\}\s*\}/);
    assert.doesNotMatch(css, /\.prodgrid\.listgrid\{[^}]*margin-inline/);
  });
});

describe("Fyndauktionens kort är kvar som kort med ram", () => {
  it("har grundens gamla värden under en egen väljare", () => {
    assert.match(css, /\.prod\.auction-card\{border:1px solid var\(--line\);border-radius:var\(--r-lg\);overflow:hidden;background:#fff;transition:transform \.25s,box-shadow \.25s;box-shadow:var\(--e1\)\}/);
    assert.match(css, /@media \(hover:hover\)\{\.prod\.auction-card:hover\{transform:translateY\(-5px\);box-shadow:var\(--e3\)\}\}/);
    assert.match(css, /\.prod\.auction-card \.pimg\{border-radius:0;background:var\(--surface-2\);isolation:auto;transition:none\}/);
    assert.match(css, /\.prod\.auction-card \.pimg img\{mix-blend-mode:normal\}/);
    assert.match(css, /\.prod\.auction-card \.pbody\{padding:16px\}/);
    assert.match(las("components", "auction-card.tsx"), /className=\{`prod auction-card a-card\$\{a\.img2 \? "" : " noswap"\}`\}/);
  });
});

// Bloggens lista bygger sina artikelkort på samma klass (.prod). När brickan
// blev grunden följde de med, och två saker blev sämre: rubriken kapades vid
// två rader (18 av 44 på 1024 px) och fotot tonades av blandningsläget.
describe("bloggens artikelkort delar brickan men har egna regler", () => {
  it("kortet bär klassen blogg-kort", () => {
    assert.match(las("app", "blogg", "page.tsx"), /<a className="prod blogg-kort" key=\{p\.slug\} href=\{`\/blogg\/\$\{p\.slug\}`\}>/);
  });

  it("rubriken får tre rader och fotot visas utan blandningsläge", () => {
    assert.match(css, /\.prod\.blogg-kort \.pname\{-webkit-line-clamp:3\}/);
    assert.match(css, /\.prod\.blogg-kort \.pimg img\{mix-blend-mode:normal\}/);
  });

  it("reglerna står efter grundens, så de vinner även vid lika vikt", () => {
    assert.ok(css.indexOf(".prod.blogg-kort .pimg img{") > css.indexOf(".prod .pimg img{mix-blend-mode:multiply}"));
    assert.ok(css.indexOf(".prod.blogg-kort .pname{") > css.indexOf(".shoplista .prod .pname{-webkit-line-clamp:3}"));
  });
});

describe("sidans huvudrubrik är serif på infosidorna och i köpguiderna", () => {
  it(".om-hero och .pagehero bär rubriktypsnittet i 600", () => {
    assert.match(css, /\.om-hero h1\{font-family:var\(--font-display\),Georgia,serif;font-size:clamp\(34px,4\.9vw,56px\);font-weight:600;/);
    assert.match(css, /\.pagehero h1\{font-family:var\(--font-display\),Georgia,serif;font-size:clamp\(30px,4\.3vw,46px\);font-weight:600;/);
  });

  it("sektionsrubrikerna under överrubrik har samma typsnitt, löptextens rubriker inte", () => {
    assert.match(css, /\.om-sektion h2\{font-family:var\(--font-display\),Georgia,serif;[^}]*font-weight:600;/);
    assert.match(css, /\.om-slut h2\{font-family:var\(--font-display\),Georgia,serif;[^}]*font-weight:600;/);
    assert.doesNotMatch(css, /\.prose h2\{[^}]*font-family:var\(--font-display\)/);
  });
});

describe("lådornas tomma läge är ett och samma", () => {
  it("varukorgen och favoritlådan bygger på .lada-tom", () => {
    const korg = las("components", "cart.tsx");
    const fav = las("components", "favoriter-lada.tsx");
    for (const kalla of [korg, fav]) {
      assert.match(kalla, /<div className="lada-tom">/);
      assert.match(kalla, /<span className="lada-tom-ikon" aria-hidden="true">/);
      assert.match(kalla, /<strong className="lada-tom-rubrik">/);
      assert.match(kalla, /className="lada-tom-knapp" href="\/butik" onClick=\{[^}]*\}?\}?>Upptäck sortimentet <span aria-hidden="true">→<\/span><\/a>/);
      assert.doesNotMatch(kalla, /cart-empty|fav-tom/);
    }
    assert.doesNotMatch(css, /\.cart-empty|\.fav-tom/);
    assert.match(css, /\.lada-tom-knapp\{[^}]*min-height:46px;[^}]*border-radius:var\(--r-pill\);background:var\(--brand\);color:#fff;/);
  });
});

describe("ett ord för kundtjänsten", () => {
  it("sidorna säger Kundtjänst, som sidan, menyn och sidtiteln heter", () => {
    for (const sida of ["vanliga-fragor", "sparning", "omoss", "returer", "kontaktaoss", "omdomen", "kundtjanst"]) {
      const kalla = las("app", sida, "page.tsx").replace(/kundservice-ikoner/g, "");
      assert.doesNotMatch(kalla, /[Kk]undservice/, `${sida} säger kundservice`);
    }
  });

  it("sidfotens spalt heter Hjälp och bär länken Kundtjänst", () => {
    const sidfot = las("components", "site.tsx");
    assert.match(sidfot, /<div className="fcol"><div className="fhead">Hjälp<\/div><a href="\/vanliga-fragor">Vanliga frågor<\/a>/);
    assert.match(sidfot, /<a href="\/kundtjanst">Kundtjänst<\/a>/);
    assert.doesNotMatch(sidfot, /Kundservice<\/div>/);
  });
});
