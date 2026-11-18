// Run: node --test --experimental-strip-types lib/smadetaljer-2026-11-18.test.ts
//
// Smådetaljerna (Leonard 2026-11-18: "alla smådetaljer är viktiga"). Varje prov
// står för ett fynd i granskningen av alla sidtyper på mobil (393 px) och dator
// (1440 px). Reglerna står i stil och markup, så proven läser källan.
// Kategoriernas ingresser vaktas i lib/category-seo.test.ts och antalen i
// lib/lista-antal.test.ts och lib/butiksidan.test.ts.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
const utanKommentarer = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const css = utanKommentarer(las("app", "globals.css"));
const sidfot = las("components", "site.tsx");

describe("brödsmulorna på mobilens kategorisida", () => {
  it("sista ledet (sidans eget namn) och strecket före det göms, som på produktsidan", () => {
    const mobil = css.slice(css.indexOf("@media(max-width:760px){\n  .kat-hero{padding:12px 0 30px}"));
    assert.match(mobil.slice(0, 900), /\.kat-hero:not\(\.prog-hero\) \.crumbs em,\.kat-hero:not\(\.prog-hero\) \.crumbs span:has\(\+ em\)\{display:none\}/);
    assert.match(css, /\.crumbs-pdp em,\.crumbs-pdp span:has\(\+ em\)\{display:none\}/);
  });

  it("hela spåret står kvar i HTML:en och i JSON-LD", () => {
    const sida = las("app", "kategori", "[slug]", "page.tsx");
    assert.match(sida, /<em>\{active\.name\}<\/em>/);
    assert.match(sida, /name: active\.name, item: `https:\/\/www\.fyndplats\.se\/kategori\/\$\{active\.slug\}`/);
  });
});

describe("rubrikerna bryts jämnt", () => {
  it("alla h1, h2 och h3 har text-wrap: balance", () => {
    assert.match(css, /(^|\})\s*h1,h2,h3\{text-wrap:balance\}/m);
  });
});

describe("sidfotens sista rad", () => {
  const rad = sidfot.slice(sidfot.indexOf('<div className="fbar">'), sidfot.indexOf("</footer>"));

  it("står i två led, och prickarna är egna element som mobilen gömmer", () => {
    assert.match(rad, /<span className="fbar-info">© 2021–2026 Fyndplats · Trygg svensk e-handel<\/span>/);
    assert.match(rad, /<span className="fbar-lankar">/);
    assert.equal((rad.match(/<span className="fbar-prick" aria-hidden="true"> · <\/span>/g) || []).length, 4);
    const mobil = css.slice(css.indexOf(".fbar .fbar-topp{display:none}"));
    assert.match(mobil.slice(0, 400), /\.fbar-info\{display:block\}\s*\.fbar-prick\{display:none\}\s*\.fbar-lankar\{display:flex;flex-wrap:wrap;justify-content:center;column-gap:20px\}/);
  });

  it("har en egen väg till toppen på mobilen, och den flytande knappen göms vid sidfoten", () => {
    assert.match(rad, /<TillToppenLank \/>/);
    assert.match(las("components", "till-toppen-lank.tsx"), /<button type="button" className="fbar-topp" onClick=\{\(\) => window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)\}>/);
    // Två klasser i väljaren: ".fbar button{display:inline-block}" längre ner väger
    // tyngre än en ensam klass, och länken syntes då också på dator.
    assert.match(css, /(^|\})\s*\.fbar \.fbar-topp\{display:none\}/m);
    assert.doesNotMatch(css, /(^|\})\s*\.fbar-topp\{/m);
    assert.match(css, /\.fbar \.fbar-topp\{display:inline-block\}/);
    assert.match(css, /@media\(max-width:768px\)\{\.backtotop\.vid-fot\{opacity:0;visibility:hidden;transform:translateY\(12px\)\}\}/);
    const knapp = las("components", "backtotop.tsx");
    assert.match(knapp, /new IntersectionObserver\(\(\[e\]\) => setVidFot\(e\.isIntersecting\), \{ rootMargin: "0px 0px -84px 0px" \}\)/);
    // På dator står knappen kvar vid sidfoten och ska gå att nå med tangentbordet.
    assert.match(knapp, /tabIndex=\{show \? 0 : -1\}/);
  });

  it("loggan i sidfoten har egna id:n (sidhuvudets logga står i samma dokument)", () => {
    assert.match(sidfot, /<div className="fbrand"><Mark size=\{30\} idPrefix="fpmk-fot" \/>Fyndplats<\/div>/);
    assert.match(sidfot, /<HemLank className="brand"><Mark \/>Fyndplats<\/HemLank>/);
  });

  it("betalmärkena bryts tre och tre när sex inte får plats", () => {
    assert.match(css, /\.fpay\{container-type:inline-size\}/);
    assert.match(css, /@container \(max-width:326px\)\{\s*\.fpay \.paymarks\{display:grid;grid-template-columns:repeat\(3,60px\);justify-content:start\}\s*\.fpay \.paymarks \.pay\{width:100%\}\s*\}/);
  });
});

describe("samma sak heter samma sak", () => {
  it("kassan säger sekretesspolicy, Returer & ångerrätt och +46 som resten av butiken", () => {
    const ram = las("app", "kassa", "kassa-ram.tsx");
    const kassa = las("app", "kassa", "kassa.tsx");
    assert.match(ram, /<a href="\/sekretesspolicy" \{\.\.\.NY_FLIK\}>Sekretesspolicy<\/a>/);
    assert.match(ram, /<a href="\/returer" \{\.\.\.NY_FLIK\}>Returer &amp; ångerrätt<\/a>/);
    assert.match(ram, /<a href="tel:\+46736630990">\+46 73 663 09 90<\/a>/);
    assert.match(kassa, /<a href="\/sekretesspolicy" target="_blank" rel="noopener">sekretesspolicy<\/a>/);
    for (const kalla of [ram, kassa]) assert.doesNotMatch(kalla, /[Ii]ntegritetspolicy|073-663|Returer och ångerrätt/);
  });

  it("avdelningsrutorna säger 'st' på /butik, som på startsidan", () => {
    assert.match(las("app", "page.tsx"), /<span className="kat-antal">\{tusental\(c\.count\)\} st<span className="sr-only"> i kategorin<\/span><\/span>/);
    assert.match(las("app", "butik", "page.tsx"), /<span className="b2-avd-antal">\{tusental\(g\.count\)\} st<span className="sr-only"> i avdelningen<\/span><\/span>/);
  });

  it("överrubrikens streck står efter texten på /alla-produkter och /rea, som på /butik", () => {
    assert.match(css, /\.butik-hero-eyebrow::after\{content:"";display:inline-block;width:22px;height:2px;[^}]*margin-left:9px;vertical-align:middle\}/);
    assert.doesNotMatch(css, /\.butik-hero-eyebrow::before/);
  });

  it("den tomma varukorgen talar om varukorgen, inte om favoriter (de har en egen låda)", () => {
    const korg = las("components", "cart.tsx");
    assert.match(korg, /<p className="cart-empty-sub">Det du lägger i varukorgen hamnar här\.<\/p>/);
    assert.doesNotMatch(korg, /className="cart-empty-sub">[^<]*favorit/);
  });

  it("köpknappen i varukorgen säger vad den väntar på, inte bara tre punkter", () => {
    const korg = las("components", "cart.tsx");
    assert.match(korg, /\{tillKassan \? "Öppnar kassan …" : busy \? "Uppdaterar …" : "Till kassan →"\}<\/button>/);
  });

  it("/butik har ingen ensam punkt i rubriken", () => {
    assert.match(las("app", "butik", "page.tsx"), /<h1>Hitta dina nästa fynd<\/h1>/);
  });

  it("faktaraden på /alla-produkter bryts vid en prick, inte mitt i ett led", () => {
    assert.match(las("app", "alla-produkter", "page.tsx"), /<span className="butik-hero-meta"><span><ListaAntalText antal=\{list\.length\} \/><\/span><span>\{categoryCountLabel\(antalKategorier\)\}<\/span><span>Fri frakt över 499 kr<\/span><\/span>/);
    assert.match(las("app", "rea", "page.tsx"), /<span className="butik-hero-meta"><span><ListaAntalText antal=\{list\.length\} \/><\/span><span>Fri frakt över 499 kr<\/span><span>30 dagars öppet köp<\/span><\/span>/);
    // Pricken ritas före varje led, och radens första klipps bort.
    assert.match(css, /\.butik-hero-meta\{display:flex;flex-wrap:wrap;margin:10px 0 0 -1\.3em;clip-path:inset\(0 0 0 1\.3em\);/);
    assert.match(css, /\.butik-hero-meta>span\{position:relative;padding-left:1\.3em;white-space:nowrap\}/);
    assert.match(css, /\.butik-hero-meta>span::before\{content:"·";position:absolute;left:\.5em\}/);
  });
});

describe("tryckytor på mobilen", () => {
  it("ytan växer utan att något flyttas: luft in och lika mycket marginal ut, eller en osynlig yta", () => {
    assert.match(css, /\.butik-crumbs a\{display:inline-block;padding:12px 2px;margin:-12px -2px\}/);
    assert.match(css, /\.rev-expand,\.angra-link\{position:relative\}/);
    assert.match(css, /\.rev-expand::after\{content:"";position:absolute;inset:-13px -10px\}/);
    assert.match(css, /\.angra-link::after\{content:"";position:absolute;inset:-10px 0\}/);
    assert.match(css, /\.promo-social a::after\{content:"";position:absolute;inset:-8px -4px\}/);
    assert.match(css, /\.blogg-tillbaka\{display:inline-block;padding:12px 0;margin:-12px 0\}/);
    assert.match(utanKommentarer(las("app", "butik", "butik.css")), /\.butik2 \.b2-grupp-rubrik a\{display:inline-block;padding:11px 0;margin:-11px 0\}/);
  });

  it("köpvillkorens innehållsförteckning och kassans sidfot", () => {
    assert.match(utanKommentarer(las("app", "kopvillkor", "kopvillkor.module.css")), /@media \(max-width: 900px\) \{[^}]*\}[^}]*\}\s*\.toc a \{ padding: 12\.5px 8px \}/);
    const kassa = utanKommentarer(las("app", "kassa", "kassa.module.css"));
    assert.match(kassa, /\.fot a::after \{\s*content: "";\s*position: absolute;\s*inset: -12px -4px;\s*\}/);
    assert.match(kassa, /\.logga::after \{\s*content: "";\s*position: absolute;\s*inset: -5px 0;\s*\}/);
  });
});
