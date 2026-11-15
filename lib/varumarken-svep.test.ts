// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Märket ur Wix (lib/varumarken-svep.ts): produktsidan läser det ur sin V3-rad,
// flödena ur ett svep som aldrig lämnar en delvis karta (2026-11-15: 4 049 av
// 4 051 felrader i produktion var "fetchVarumarken failed: HTTP 429").
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  markeUrV3,
  svepaVarumarken,
  vantetid,
  VARUMARKEN_FORSOK,
  VARUMARKEN_MAX_SIDOR,
  VARUMARKEN_MAX_VANTAN_MS,
  type Svar,
} from "./varumarken-svep.ts";

const svar = (status: number, data: unknown = null, retryAfter: string | null = null): Svar => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (n: string) => (n.toLowerCase() === "retry-after" ? retryAfter : null) },
  json: async () => data,
});
const sida = (produkter: unknown[], nasta: string | null) => ({
  products: produkter,
  pagingMetadata: { hasNext: nasta !== null, cursors: { next: nasta } },
});
const ingenVantan = async () => {};

describe("markeUrV3: varans märke ur produktens egen rad", () => {
  it("läser brand.name och tar bort mellanslag runt", () => {
    assert.equal(markeUrV3({ id: "a", brand: { id: "b", name: " VEVOR " } }), "VEVOR");
  });
  it("utan märke, med tomt namn eller utan rad: inget", () => {
    assert.equal(markeUrV3({ id: "a" }), undefined);
    assert.equal(markeUrV3({ brand: { name: "  " } }), undefined);
    assert.equal(markeUrV3({ brand: { name: 7 } }), undefined);
    assert.equal(markeUrV3(null), undefined);
    assert.equal(markeUrV3(undefined), undefined);
  });
});

describe("svepaVarumarken: hela kartan eller ett fel", () => {
  it("följer markören över sidorna; filtret går bara med på första sidan", async () => {
    const fragor: Record<string, unknown>[] = [];
    const sidor = [
      sida([{ id: "p1", brand: { name: "VEVOR" } }, { id: "p2", brand: { name: "Naturehike" } }], "m1"),
      sida([{ id: "p3", brand: { name: "VEVOR" } }, { id: "p4" }], null),
    ];
    const karta = await svepaVarumarken(async (search) => {
      fragor.push(search);
      return svar(200, sidor[fragor.length - 1]);
    }, ingenVantan);
    assert.deepEqual(karta, [["p1", "VEVOR"], ["p2", "Naturehike"], ["p3", "VEVOR"]]);
    assert.equal(fragor.length, 2);
    assert.deepEqual(fragor[0], { filter: { "brand.id": { $exists: true } }, cursorPaging: { limit: 100 } });
    assert.deepEqual(fragor[1], { cursorPaging: { limit: 100, cursor: "m1" } });
  });

  it("429 väntas ut med Wix Retry-After, och svepet blir helt", async () => {
    const vantat: number[] = [];
    let anrop = 0;
    const karta = await svepaVarumarken(async () => {
      anrop++;
      return anrop === 1 ? svar(429, null, "2") : svar(200, sida([{ id: "p1", brand: { name: "VEVOR" } }], null));
    }, async (ms) => { vantat.push(ms); });
    assert.deepEqual(karta, [["p1", "VEVOR"]]);
    assert.deepEqual(vantat, [2000]);
  });

  it("ett bestående 429 kastar efter tre nya försök, i stället för en delvis karta", async () => {
    let anrop = 0;
    await assert.rejects(
      svepaVarumarken(async () => {
        anrop++;
        // Första sidan går bra, andra sidan svarar alltid 429.
        return anrop === 1 ? svar(200, sida([{ id: "p1", brand: { name: "VEVOR" } }], "m1")) : svar(429);
      }, ingenVantan),
      /HTTP 429 på sida 2/,
    );
    assert.equal(anrop, 1 + 1 + VARUMARKEN_FORSOK);
  });

  it("ett 5xx försöks igen; ett 4xx kastar direkt", async () => {
    let anrop = 0;
    const karta = await svepaVarumarken(async () => {
      anrop++;
      return anrop === 1 ? svar(503) : svar(200, sida([{ id: "p1", brand: { name: "Baseus" } }], null));
    }, ingenVantan);
    assert.deepEqual(karta, [["p1", "Baseus"]]);
    let fyraNoll = 0;
    await assert.rejects(svepaVarumarken(async () => { fyraNoll++; return svar(400); }, ingenVantan), /HTTP 400 på sida 1/);
    assert.equal(fyraNoll, 1);
  });

  it("sidtaket kastar med markören kvar, i stället för att kapa tyst", async () => {
    let anrop = 0;
    await assert.rejects(
      svepaVarumarken(async () => { anrop++; return svar(200, sida([{ id: `p${anrop}`, brand: { name: "VEVOR" } }], `m${anrop}`)); }, ingenVantan),
      /sidtaket 60 sidor/,
    );
    assert.equal(anrop, VARUMARKEN_MAX_SIDOR);
  });

  it("väntan: Retry-After i sekunder med ett tak, annars 1, 2, 4 s", () => {
    assert.equal(vantetid(svar(429, null, "3"), 0), 3000);
    assert.equal(vantetid(svar(429, null, "120"), 0), VARUMARKEN_MAX_VANTAN_MS);
    assert.equal(vantetid(svar(429), 0), 1000);
    assert.equal(vantetid(svar(429), 1), 2000);
    assert.equal(vantetid(svar(429), 2), 4000);
    assert.equal(vantetid(svar(429, null, "nonsens"), 0), 1000);
  });
});

describe("produktsidan hämtar ingen märkeskarta", () => {
  const las = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
  const sidan = las("app/produkt/[slug]/page.tsx");
  const produkter = las("lib/products.ts");

  it("sidan anropar inte fetchVarumarken och tar märket ur produkten", () => {
    assert.doesNotMatch(sidan, /fetchVarumarken/);
    assert.match(sidan, /varumarke\(p\.marke\)/);
  });

  it("produktens rad får märket ur samma V3-hämtning", () => {
    const grund = produkter.slice(produkter.indexOf("async function produktGrund"), produkter.indexOf("export const getProduct = cache("));
    assert.match(grund, /const v3 = await fetchV3ProductRaw\(prod\.id\);[\s\S]*markeUrV3\(v3\)[\s\S]*prod\.marke = marke/);
  });

  it("flödenas karta är en cachepost, inte en fetch-cache per markörsida", () => {
    const start = produkter.indexOf("const varumarkenCachat");
    const del = produkter.slice(start, produkter.indexOf("export async function fetchVarumarken"));
    assert.ok(start > -1, "varumarkenCachat saknas");
    assert.match(del, /unstable_cache\(/);
    assert.match(del, /svepaVarumarken\(/);
    assert.doesNotMatch(del, /next:\s*\{/);
  });
});
