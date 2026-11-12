// Slutsålda produkter ska ha en intern länk: från sin kategori, eller från
// /alla-produkter när ingen kategorisida kan bära den.
//
// ☠️ VARFÖR (2026-11-11). Semrush räknade 475 sidor i sitemapen utan en enda
// intern länk. Alla var slutsålda produkter: listorna döljer dem, sitemapen
// behåller dem, och ingenting länkade dit.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { produkterIKategorin } from "./bara-i-underkategorin.ts";
import { slutsaldaIKategorinAv, slutsaldaUtanKategorisidaAv, utanKategorisidaAv, UTAN_EGEN_LISTA } from "./slutsalda-lankar.ts";

const kat = (id: string, slug: string, parentId: string | null = null) => ({ id, slug, parentId });
const prod = (id: string, inStock: boolean, ...collectionIds: string[]) => ({ id, slug: id, name: id, inStock, collectionIds });

const MOBLER = kat("mobler", "mobler");
const FATOLJER = kat("fatoljer", "fatoljer", "mobler");
const HUSDJUR = kat("husdjur", "husdjur");
const REA = kat("rea", "rea");
const OVRIGT = kat("ovrigt", "ovrigt");
const KATEGORIER = [MOBLER, FATOLJER, HUSDJUR, REA, OVRIGT];

const PRODUKTER = [
  prod("fatolj-i-lager", true, "fatoljer"),
  prod("fatolj-slut", false, "fatoljer"),
  prod("bord-slut", false, "mobler"),
  prod("kattlada-slut", false, "husdjur", "rea"),
  prod("hundbur-i-lager", true, "husdjur"),
  prod("bara-ovrigt-slut", false, "ovrigt"),
  prod("bara-ovrigt-i-lager", true, "ovrigt"), // i lager: hör till "Övriga produkter A–Ö", inte hit
  prod("tom-kategori-slut", false, "julpynt"), // kategorin saknar sida: allt i den är slut
  prod("utan-kategori-slut", false),
];

const idn = (ps: { id: string }[]) => ps.map((p) => p.id).sort();

describe("slutsaldaIKategorinAv", () => {
  it("en underkategori länkar till sina egna slutsålda, aldrig till det som finns i lager", () => {
    assert.deepEqual(idn(slutsaldaIKategorinAv(FATOLJER, KATEGORIER, PRODUKTER, true, produkterIKategorin)), ["fatolj-slut"]);
  });

  it("en avdelning tar med underkategoriernas slutsålda, som dess lista gör", () => {
    assert.deepEqual(idn(slutsaldaIKategorinAv(MOBLER, KATEGORIER, PRODUKTER, true, produkterIKategorin)), ["bord-slut", "fatolj-slut"]);
  });

  it("en annan kategoris slutsålda följer inte med", () => {
    assert.deepEqual(idn(slutsaldaIKategorinAv(HUSDJUR, KATEGORIER, PRODUKTER, true, produkterIKategorin)), ["kattlada-slut"]);
  });

  it("tomt när listorna redan visar slutsålt: då står länkarna i listan", () => {
    assert.deepEqual(slutsaldaIKategorinAv(MOBLER, KATEGORIER, PRODUKTER, false, produkterIKategorin), []);
  });

  it("tomt för rea, populära och övrigt: de sidorna listar inte sina egna produkter", () => {
    for (const slug of UTAN_EGEN_LISTA) {
      assert.deepEqual(slutsaldaIKategorinAv(kat(slug, slug), KATEGORIER, PRODUKTER, true, produkterIKategorin), [], slug);
    }
  });

  it("tomt när inget är slut", () => {
    const iLager = PRODUKTER.filter((p) => p.inStock);
    assert.deepEqual(slutsaldaIKategorinAv(MOBLER, KATEGORIER, iLager, true, produkterIKategorin), []);
  });
});

describe("slutsaldaUtanKategorisidaAv", () => {
  it("fångar de slutsålda som ingen kategorisida länkar till", () => {
    assert.deepEqual(
      idn(slutsaldaUtanKategorisidaAv(PRODUKTER, KATEGORIER, true)),
      ["bara-ovrigt-slut", "tom-kategori-slut", "utan-kategori-slut"],
    );
  });

  it("tomt när listorna visar slutsålt", () => {
    assert.deepEqual(slutsaldaUtanKategorisidaAv(PRODUKTER, KATEGORIER, false), []);
  });

  it("☠️ varje slutsåld produkt får en länk från minst en sida", () => {
    const lankade = new Set<string>();
    for (const k of KATEGORIER) for (const p of slutsaldaIKategorinAv(k, KATEGORIER, PRODUKTER, true, produkterIKategorin)) lankade.add(p.id);
    for (const p of slutsaldaUtanKategorisidaAv(PRODUKTER, KATEGORIER, true)) lankade.add(p.id);
    const slut = PRODUKTER.filter((p) => !p.inStock).map((p) => p.id);
    assert.deepEqual(slut.filter((id) => !lankade.has(id)), []);
  });
});

describe("utanKategorisidaAv", () => {
  it("är samma regel som förut: bara kategorier med egen lista räknas", () => {
    assert.deepEqual(idn(utanKategorisidaAv(PRODUKTER.filter((p) => p.inStock), KATEGORIER)), ["bara-ovrigt-i-lager"]);
    assert.deepEqual(idn(utanKategorisidaAv([prod("x", true, "rea"), prod("y", true, "mobler")], KATEGORIER)), ["x"]);
  });
});

describe("sidorna ritar listan", () => {
  const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");

  it("kategorisidan lägger de slutsålda efter A–Ö-listan, ur HELA katalogen", () => {
    const sida = las("app", "kategori", "[slug]", "page.tsx");
    assert.match(sida, /const slutsalda = slutsaldaIKategorin\(active, collections, allProducts\);/);
    assert.match(sida, /<ProductIndex products=\{slutsalda\} title="Slut i lager just nu" \/>/);
    assert.ok(sida.indexOf("products={slutsalda}") > sida.indexOf("products={list}"), "listan med slutsålda ska stå efter A–Ö-listan");
  });

  it("/alla-produkter listar de slutsålda som saknar kategorisida", () => {
    const sida = las("app", "alla-produkter", "page.tsx");
    assert.match(sida, /<ProductIndex products=\{slutsaldaUtanKategorisida\(allProducts, collections\)\} title="Slut i lager just nu" \/>/);
  });

  it("list-pages skickar butikens växel och regeln för kategorisidan", () => {
    const lib = las("lib", "list-pages.ts");
    assert.match(lib, /slutsaldaIKategorinAv\(active, collections, allaProdukter, hideOosFromListings\(\), produkterIKategorin\)/);
    assert.match(lib, /slutsaldaUtanKategorisidaAv\(allaProdukter, collections, hideOosFromListings\(\)\)/);
  });
});
