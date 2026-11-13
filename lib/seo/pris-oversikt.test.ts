// Översikten /under-{200,500,1000}-kr (Pattern 2b). Genvägarna på /butik pekade
// dit innan sidorna fanns och gav 404 (Leonard 2026-11-13).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { byggPrisOversikt, underPriset, type HubProdukt, type PrisOversiktIn } from "./pris-oversikt.ts";

type P = HubProdukt & { kat: string };

let nr = 0;
function vara(priceNum: number, kat: string, extra: Partial<P> = {}): P {
  nr += 1;
  return { id: `id${nr}`, slug: `vara-${nr}`, name: `Vara nummer ${nr} med ett längre namn`, price: `${priceNum} kr`, priceNum, inStock: true, imageScore: 50, kat, ...extra };
}

const ord = (t: string) => t.split(/\s+/).filter(Boolean).length;

function indata(products: P[], over: Partial<PrisOversiktIn<P>> = {}): PrisOversiktIn<P> {
  return {
    price: 500,
    granser: [200, 500, 1000],
    products,
    kategorier: [
      { slug: "mobler", name: "Möbler" },
      { slug: "tradgard", name: "Trädgård" },
      { slug: "lampor", name: "Lampor" },
    ],
    prissidor: [
      { price: 500, categorySlug: "mobler" },
      { price: 500, categorySlug: "tradgard" },
      { price: 1000, categorySlug: "lampor" },
    ],
    iKategorin: (slug) => products.filter((p) => p.kat === slug && p.inStock),
    dedupe: (l) => [...new Map(l.map((p) => [p.id, p])).values()],
    blanda: (l) => l,
    raknaOrd: ord,
    produkterText: (n) => `${n} ${n === 1 ? "produkt" : "produkter"}`,
    minProdukter: 4,
    minOrd: 0,
    maxLista: 24,
    ...over,
  };
}

describe("översikten för en prisgräns", () => {
  it("tar bara varor i lager med ett pris över 0 och högst gränsen", () => {
    const lista = [vara(499, "mobler"), vara(500, "mobler"), vara(501, "mobler"), vara(0, "mobler"), vara(100, "mobler", { inStock: false }), vara(250, "tradgard"), vara(300, "tradgard")];
    const hub = byggPrisOversikt(indata(lista));
    assert.ok(hub);
    assert.deepEqual(hub.products.map((p) => p.priceNum).sort((a, b) => a - b), [250, 300, 499, 500]);
    assert.equal(hub.antal, 4);
    assert.equal(hub.path, "/under-500-kr");
  });

  it("listar bara kategorierna med en prissida för just den gränsen, flest varor först", () => {
    const lista = [vara(100, "tradgard"), vara(200, "tradgard"), vara(300, "tradgard"), vara(400, "mobler"), vara(450, "lampor"), vara(460, "lampor")];
    const hub = byggPrisOversikt(indata(lista));
    assert.ok(hub);
    assert.deepEqual(hub.kategorier, [
      { href: "/under-500-kr/tradgard", namn: "Trädgård", antal: 3 },
      { href: "/under-500-kr/mobler", namn: "Möbler", antal: 1 },
    ]);
  });

  it("länkar till de andra gränserna men aldrig till sig själv", () => {
    const hub = byggPrisOversikt(indata([vara(10, "mobler"), vara(20, "mobler"), vara(30, "mobler"), vara(40, "mobler")]));
    assert.ok(hub);
    assert.deepEqual(hub.andraGranser.map((l) => l.href), ["/under-200-kr", "/under-1000-kr"]);
  });

  it("sorterar på bildpoäng och sedan pris, och kapar vid maxLista", () => {
    const lista = [vara(300, "mobler", { imageScore: 10 }), vara(200, "mobler", { imageScore: 90 }), vara(100, "mobler", { imageScore: 90 }), vara(50, "mobler", { imageScore: 5 })];
    const hub = byggPrisOversikt(indata(lista, { maxLista: 3 }));
    assert.ok(hub);
    assert.deepEqual(hub.products.map((p) => p.priceNum), [100, 200, 300]);
  });

  it("finns inte för en gräns utan sidor, med för få varor eller för lite text", () => {
    const fyra = [vara(10, "mobler"), vara(20, "mobler"), vara(30, "mobler"), vara(40, "mobler")];
    assert.equal(byggPrisOversikt(indata(fyra, { price: 750 })), null);
    assert.equal(byggPrisOversikt(indata(fyra.slice(0, 3))), null);
    assert.equal(byggPrisOversikt(indata(fyra, { minOrd: 10_000 })), null);
    assert.ok(byggPrisOversikt(indata(fyra)));
  });

  it("räknar en vara en gång även om den står två gånger", () => {
    const en = vara(100, "mobler");
    const hub = byggPrisOversikt(indata([en, en, vara(200, "mobler"), vara(300, "mobler"), vara(400, "mobler")]));
    assert.ok(hub);
    assert.equal(hub.antal, 4);
  });

  it("underPriset släpper inte igenom pris 0", () => {
    assert.deepEqual(underPriset([vara(0, "mobler"), vara(1, "mobler")], 500).map((p) => p.priceNum), [1]);
  });
});
