// Run: node --test --experimental-strip-types lib/bildfonster.test.ts
//
// KORTENS BILDER FINNS BARA NÄRA FÖNSTRET (Leonard 2026-11-25): "när man
// scrollar i alla produkter sidan och backar och går in i nya produkter o
// backar craschar det tillslut". Safari visade "Ett problem inträffade flera
// gånger på /alla-produkter?sortera=new".
//
// Mätt i Chromium i telefonstorlek mot www samma dag: 408 kort efter åtta varv
// (två "Visa fler", in på en vara, bakåt), 426 hämtade bilder och en flik som
// växt från 295 till 924 MB. Vad som mättes efter rättelsen står i CLAUDE.md.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BILDER_RUNT_ANKARET, BILDFONSTER_PX, borjarMedBilder, slugUrLank } from "./bildfonster.ts";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");

describe("vilka kort börjar med sina bilder", () => {
  it("utan tillbakaställt läge börjar varje kort med bilder: sidans första kort och en ny omgång", () => {
    for (const i of [0, 1, 23, 24, 47, 700]) assert.equal(borjarMedBilder(i, null), true);
  });

  it("☠️ en lång lista som ställs tillbaka: bara korten runt det sparade kortet", () => {
    // 720 kort, kunden stod vid kort 600.
    const ankare = { index: 600, antal: 720 };
    const med = Array.from({ length: 720 }, (_, i) => i).filter((i) => borjarMedBilder(i, ankare));
    assert.equal(med.length, 2 * BILDER_RUNT_ANKARET + 1);
    assert.equal(med[0], 600 - BILDER_RUNT_ANKARET);
    assert.equal(med[med.length - 1], 600 + BILDER_RUNT_ANKARET);
    // Listans början, som ligger tiotusentals pixlar bort, hämtar ingenting.
    assert.equal(borjarMedBilder(0, ankare), false);
    assert.equal(borjarMedBilder(300, ankare), false);
  });

  it("vid listans kanter blir det färre, aldrig fler", () => {
    assert.equal(Array.from({ length: 120 }, (_, i) => i).filter((i) => borjarMedBilder(i, { index: 3, antal: 120 })).length, 3 + 1 + BILDER_RUNT_ANKARET);
    assert.equal(Array.from({ length: 120 }, (_, i) => i).filter((i) => borjarMedBilder(i, { index: 119, antal: 120 })).length, BILDER_RUNT_ANKARET + 1);
  });

  it("kort som kommer till efter läget (Visa fler) ritas där kunden står och börjar med bilder", () => {
    const ankare = { index: 100, antal: 120 };
    assert.equal(borjarMedBilder(119, ankare), true, "inom en omgång från ankaret");
    assert.equal(borjarMedBilder(120, ankare), true);
    assert.equal(borjarMedBilder(143, ankare), true);
    assert.equal(borjarMedBilder(10, ankare), false);
  });

  it("saknas det sparade kortet börjar inget av lägets kort med bilder: bevakaren ger dem till dem vid fönstret", () => {
    const ankare = { index: -1, antal: 240 };
    assert.equal(Array.from({ length: 240 }, (_, i) => i).filter((i) => borjarMedBilder(i, ankare)).length, 0);
    assert.equal(borjarMedBilder(240, ankare), true);
  });

  it("en kort lista som ställs tillbaka (två omgångar) börjar som förut, med alla bilder", () => {
    const ankare = { index: 30, antal: 48 };
    assert.equal(Array.from({ length: 48 }, (_, i) => i).filter((i) => !borjarMedBilder(i, ankare)).length, 6);
    assert.equal(borjarMedBilder(6, ankare), true);
    assert.equal(borjarMedBilder(5, ankare), false);
  });

  it("varans adressnamn läses ur kortets länk, med eller utan färg", () => {
    assert.equal(slugUrLank("/produkt/golvlampa-bagform"), "golvlampa-bagform");
    assert.equal(slugUrLank("/produkt/soffa-3-sits?farg=Bl%C3%A5"), "soffa-3-sits");
    assert.equal(slugUrLank("/produkt/soffa#omdomen"), "soffa");
    assert.equal(slugUrLank(""), "");
    assert.equal(slugUrLank("/kategori/soffor"), "");
  });

  it("fönstret rymmer en hel omgång Visa fler på en telefon, och är inte hela listan", () => {
    // Tolv rader om ungefär 300 px på en telefon.
    assert.ok(BILDFONSTER_PX >= 12 * 300, "en omgång ryms");
    assert.ok(BILDFONSTER_PX <= 6000, "fönstret är en bit av listan, inte hela");
    assert.equal(BILDER_RUNT_ANKARET, 24);
  });
});

describe("☠️ kortets bilder och svepyta finns bara medan kortet står nära fönstret", () => {
  const fonster = las("components", "kort-bildfonster.tsx");
  const kort = las("components", "productcard.tsx");
  const lista = las("components", "shopbrowser.tsx");
  const css = las("app", "globals.css").replace(/\/\*[\s\S]*?\*\//g, "");

  it("EN bevakare för alla kort, med fönstrets marginal, och ingen lyssnare på rullningen", () => {
    assert.match(fonster, /let vakt: IntersectionObserver \| null = null;/);
    assert.match(fonster, /\{ rootMargin: `\$\{BILDFONSTER_PX\}px 0px` \}/);
    assert.equal(fonster.split("new IntersectionObserver(").length - 1, 1);
    assert.doesNotMatch(fonster, /addEventListener\(/);
    // Kortet säger till bevakaren när det tas bort: inga lyssnare blir kvar.
    assert.match(fonster, /return \(\) => \{ lyssnare\.delete\(el\); vakt\?\.unobserve\(el\); \};/);
    assert.match(fonster, /const lyssnare = new WeakMap<Element, Lyssnare>\(\);/);
  });

  it("utan IntersectionObserver bär korten sina bilder som förut", () => {
    assert.match(fonster, /if \(typeof IntersectionObserver !== "function"\) return \(\) => \{\};/);
  });

  it("bevakarens yta står alltid kvar, bilderna bara nära fönstret", () => {
    assert.match(fonster, /<span ref=\{vaktRef\} className="pimg-vakt" aria-hidden="true" \/>\s+\{nara && <CardGallery \{\.\.\.galleri\} \/>\}/);
    assert.match(fonster, /const \[nara, setNara\] = useState\(naraForst\);/);
    assert.match(css, /\.pimg-vakt\{position:absolute;inset:0;pointer-events:none\}/);
  });

  it("☠️ bildrutan behåller sin höjd utan bilder: sidan flyttar sig inte när de kommer och går", () => {
    assert.match(css, /\.prod \.pimg\{aspect-ratio:1;position:relative;/);
    // Safari före 15 kan inte aspect-ratio: reserven ger samma höjd (lib/reservhojd.test.ts).
    assert.match(css, /\.prod \.pimg::before,[^{]*\{content:"";display:block;padding-top:100%\}/);
  });

  it("kortet väljer: i en lista som växer går bilderna genom fönstret, annars som förut", () => {
    assert.match(kort, /\{p\.img && \(bildFonster === undefined\s+\? <CardGallery slug=\{p\.slug\}[^\n]*direkt=\{bildDirekt\} \/>\s+: <KortBildfonster naraForst=\{bildFonster\} slug=\{p\.slug\}[^\n]*direkt=\{bildDirekt\} \/>\)\}/);
  });

  it("listsidorna och prissidornas Visa fler använder fönstret; startsidan och raderna gör det inte", () => {
    assert.match(lista, /bildDirekt=\{bilderDirekt\} bildFonster=\{bildNara\(i\)\} \/>/);
    assert.match(las("components", "pris-fler.tsx"), /<ProductCard p=\{p\} key=\{p\.slug\} tvaKolumner bildFonster \/>/);
    for (const fil of [["app", "page.tsx"], ["app", "butik", "page.tsx"], ["app", "produkt", "[slug]", "page.tsx"], ["components", "price-tier-page.tsx"], ["components", "price-hub-page.tsx"], ["components", "sok-vy.tsx"]]) {
      assert.doesNotMatch(las(...fil), /bildFonster/, fil.join("/"));
    }
  });

  it("☠️ läget som ställs tillbaka bär det sparade kortet, antalet och listan det gällde", () => {
    assert.match(lista, /if \(l\.shown > PAGE_SIZE\) \{ setAnkare\(\{ slug: slugUrLank\(l\.href\), antal: l\.shown, lista: listNyckel \}\); setShown\(l\.shown\); \}/);
    assert.match(lista, /const ankareIndex = lage\?\.slug \? visible\.findIndex\(\(p\) => p\.slug === lage\.slug\) : -1;/);
    assert.match(lista, /const bildNara = \(i: number\) => borjarMedBilder\(i, lage \? \{ index: ankareIndex, antal: lage\.antal \} : null\);/);
  });

  it("☠️ en annan lista (ny sortering, ett filter) ärver inte läget: dess kort börjar med bilder", () => {
    assert.match(lista, /const lage = ankare && ankare\.lista === listNyckel \? ankare : null;/);
    // Nyckeln är samma saker som får listan att börja om från 24 kort.
    const beroenden = /setShown\(PAGE_SIZE\);\s+\}, \[([^\]]+)\]\);/.exec(lista)?.[1] ?? "";
    const nyckel = /const listNyckel = \[([^\]]+)\]\.join\(/.exec(lista)?.[1] ?? "";
    assert.ok(beroenden.length > 0);
    assert.equal(nyckel, beroenden);
  });

  it("på servern och i första renderingen bär korten sina bilder: Google ser dem i sidan", () => {
    // `ankare` är null tills ett läge ställs tillbaka i webbläsaren.
    assert.match(lista, /const \[ankare, setAnkare\] = useState<\{ slug: string; antal: number; lista: string \} \| null>\(null\);/);
    assert.equal(borjarMedBilder(0, null), true);
  });
});
