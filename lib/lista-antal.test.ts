import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { giltigtAntal, LISTA_ANTAL_HANDELSE } from "./lista-antal.ts";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");

describe("kategoriväljaren och verktygsraden visar samma antal", () => {
  it("bara heltal från noll och uppåt går att visa", () => {
    assert.equal(giltigtAntal(228), 228);
    assert.equal(giltigtAntal(0), 0);
    for (const v of [-1, 1.5, NaN, Infinity, "228", null, undefined, {}]) assert.equal(giltigtAntal(v), null);
  });

  it("kategorisidan skickar sin egen listas längd till väljaren", () => {
    const sida = las("app", "kategori", "[slug]", "page.tsx");
    assert.match(sida, /<CategoryDropdown products=\{products\} collections=\{collections\} activeSlug=\{active\.slug\} activeCount=\{list\.length\} \/>/);
    assert.match(las("app", "alla-produkter", "page.tsx"), /<CategoryDropdown products=\{products\} collections=\{collections\} activeCount=\{list\.length\} \/>/);
  });

  it("ShopBrowser säger till när hela listan har kommit, och väljaren lyssnar", () => {
    const browser = las("components", "shopbrowser.tsx");
    assert.match(browser, /if \(lista && hamtad\) sagListaAntal\(hamtad\.length\);/);
    const lyssnare = las("components", "lista-antal.tsx");
    assert.match(lyssnare, /addEventListener\(LISTA_ANTAL_HANDELSE, ta\);/);
    assert.match(lyssnare, /removeEventListener\(LISTA_ANTAL_HANDELSE, ta\);/);
    assert.match(las("components", "categorydropdown-client.tsx"), /const hamtatAntal = useHamtatListaAntal\(\);/);
    assert.equal(LISTA_ANTAL_HANDELSE, "fp:lista-antal");
  });

  it("rubrikytan på /alla-produkter och /rea följer samma lista", () => {
    assert.match(las("app", "alla-produkter", "page.tsx"), /<span><ListaAntalText antal=\{list\.length\} \/><\/span>/);
    assert.match(las("app", "rea", "page.tsx"), /<span><ListaAntalText antal=\{list\.length\} \/><\/span>/);
    assert.match(las("components", "lista-antal.tsx"), /return <>\{productCountLabel\(hamtat \?\? antal\)\}<\/>;/);
  });
});
