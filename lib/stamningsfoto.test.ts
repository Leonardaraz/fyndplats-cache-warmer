// Run: node --test --experimental-strip-types lib/stamningsfoto.test.ts
//
// Varje avdelning har ett stämningsfoto (Leonard 2026-11-25: "ändra så de har
// stämingsfoto"). Bil & Garage, Bygg & Renovering och Företag & Proffs var de
// enda avdelningarna utan nyckel i CATEGORY_HERO_IMAGES och visade en vara: i
// rutan på startsidan och /butik, i menyns stora ruta, i mobilmenyns banderoll
// och överst på sin kategorisida.
//
// lib/category-groups.ts läser katalogen och går inte att importera i ett
// prov, så kartan läses ur källan. Att fotona visar rätt motiv, utan läsbara
// varumärken och utan ansikten, går inte att prova här: det är granskat i bild
// och står i kommentaren vid nycklarna.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AVDELNINGSORDNING } from "./meny-grupper.ts";
import { hjalteAdress } from "./meny-bilder.ts";
import { unsplashIForm } from "./bildformat.ts";

const kod = readFileSync(join(import.meta.dirname, "category-groups.ts"), "utf8");

/** Raderna `"Namn": UNSPLASH("id")` i en exporterad karta, i källans ordning. */
function rader(namn: string, uttryck: RegExp): Array<[string, string]> {
  const start = kod.indexOf(`export const ${namn}`);
  assert.ok(start > -1, `hittar inte ${namn}`);
  const slut = kod.indexOf("\n};", start);
  return [...kod.slice(start, slut).matchAll(uttryck)].map((m) => [m[1], m[2]]);
}

const fotoRader = rader("CATEGORY_HERO_IMAGES", /^\s*"([^"]+)": UNSPLASH\("([^"]+)"\)/gm);
const foton = new Map(fotoRader);
const adress = (id: string) => `https://images.unsplash.com/photo-${id}?q=80&w=1600&h=1280&fit=crop&crop=center&auto=format`;

/** Avdelningens slug, som Wix räknar den ur namnet. */
const slug = (namn: string) =>
  namn.toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/é/g, "e").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

describe("kartan går att läsa ur källan", () => {
  it("många nycklar, och ingen står två gånger", () => {
    assert.ok(fotoRader.length >= 60, `bara ${fotoRader.length} rader`);
    // Ett objekt med samma nyckel två gånger behåller den sista utan att säga något.
    assert.equal(foton.size, fotoRader.length);
  });

  it("UNSPLASH() bygger den adress provet räknar med: 1600 × 1280, mittbeskuren", () => {
    assert.match(kod, /const UNSPLASH = \(id: string\) =>\n\s+`https:\/\/images\.unsplash\.com\/photo-\$\{id\}\?q=80&w=1600&h=1280&fit=crop&crop=center&auto=format`;/);
  });

  // images.unsplash.com/photo-<tid>-<tolv hex> är Unsplashs fria bilder.
  // Betalbilderna (Unsplash+) heter premium_photo- och ligger på en annan värd,
  // så de går inte att skriva med UNSPLASH(). Därför ska varje rad gå den vägen.
  it("varje id har formen för Unsplashs fria bilder, och ingen rad är en egen adress", () => {
    for (const [namn, id] of fotoRader) assert.match(id, /^\d{10,13}-[0-9a-f]{12}$/, namn);
    const start = kod.indexOf("export const CATEGORY_HERO_IMAGES");
    const karta = kod.slice(start, kod.indexOf("\n};", start));
    const varden = [...karta.matchAll(/^\s*"[^"]+":\s*(\S+)/gm)].map((m) => m[1]);
    assert.equal(varden.length, fotoRader.length);
    for (const v of varden) assert.match(v, /^UNSPLASH\("/);
  });
});

describe("varje avdelning har ett stämningsfoto", () => {
  it("menyns tretton avdelningar står alla i kartan", () => {
    assert.equal(AVDELNINGSORDNING.length, 13);
    const utan = AVDELNINGSORDNING.filter((namn) => !foton.has(namn));
    assert.deepEqual(utan, []);
  });

  it("de tre sista har sina egna granskade foton", () => {
    assert.equal(foton.get("Bil & Garage"), "1593699199342-59b40e08f0ac");
    assert.equal(foton.get("Bygg & Renovering"), "1562259949-e8e7689d7828");
    assert.equal(foton.get("Företag & Proffs"), "1577106263724-2c8e03bfe9cf");
  });

  // Två avdelningar bredvid varandra med samma foto ser ut som ett fel, i
  // rutorna på startsidan och i menyn. En avdelning får låna sin
  // underkategoris foto (julgranen, verktygsväggen), men inte en annan avdelnings.
  it("inga två avdelningar delar foto", () => {
    const ids = AVDELNINGSORDNING.map((namn) => foton.get(namn));
    assert.equal(new Set(ids).size, ids.length);
  });

  it("de tre nya fotona används inte av någon annan kategori", () => {
    for (const namn of ["Bil & Garage", "Bygg & Renovering", "Företag & Proffs"]) {
      const delar = fotoRader.filter(([, id]) => id === foton.get(namn)).map(([n]) => n);
      assert.deepEqual(delar, [namn]);
    }
  });
});

describe("fotot går att klippa till butikens former", () => {
  // Menyn visar fotot bara när hjalteAdress ger en adress: annars faller den
  // tyst tillbaka på en vara. Rutan på startsidan och /butik gör detsamma.
  it("datorns meny (4:5), mobilmenyns banderoll (12:5) och rutan (4:3) får var sin adress", () => {
    for (const namn of AVDELNINGSORDNING) {
      const url = adress(foton.get(namn)!);
      const meny = hjalteAdress(url, 496, "4:5");
      const banderoll = hjalteAdress(url, 860, "12:5");
      assert.ok(meny && new URL(meny).searchParams.get("ar") === "4:5", namn);
      assert.ok(banderoll && new URL(banderoll).searchParams.get("ar") === "12:5", namn);
      // Höjden är borta: annars klipper Unsplash till 5:4 först och formen sedan.
      assert.equal(new URL(meny).searchParams.get("h"), null, namn);
      const ruta = new URL(unsplashIForm(url, "4:3"));
      assert.equal(ruta.searchParams.get("ar"), "4:3", namn);
      assert.equal(ruta.searchParams.get("crop"), "center", namn);
    }
  });
});

describe("en avdelning med foto har ingen vald produkt", () => {
  // Kategorisidan tar fotot först (app/kategori/[slug]/page.tsx). En rad i
  // KATEGORI_HERO_PRODUKT för en avdelning med foto läses aldrig, och den som
  // ändrar den tror att sidan ändras.
  it("KATEGORI_HERO_PRODUKT har ingen av avdelningarna", () => {
    const valda = rader("KATEGORI_HERO_PRODUKT", /^\s*"([^"]+)": "([^"]+)"/gm).map(([s]) => s);
    assert.ok(valda.length >= 10, `bara ${valda.length} rader`);
    const avdelningar = new Set(AVDELNINGSORDNING.map(slug));
    assert.ok(avdelningar.has("bil-garage") && avdelningar.has("foretag-proffs") && avdelningar.has("tradgard-utemobler"));
    assert.deepEqual(valda.filter((s) => avdelningar.has(s)), []);
  });

  it("kategorisidan tar fotot före produkten", () => {
    const sida = readFileSync(join(import.meta.dirname, "..", "app", "kategori", "[slug]", "page.tsx"), "utf8");
    assert.match(sida, /const curatedHero = categoryHero\(active\.name\);\n\s+const heroImg = curatedHero \|\| produktBild\(active\.slug, catList\);/);
  });
});
