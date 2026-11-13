// Översikten /under-{200,500,1000}-kr (Pattern 2b). Genvägarna på /butik pekade
// dit innan sidorna fanns och gav 404 (Leonard 2026-11-13).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { avdelningFor, byggPrisOversikt, underPriset, type HubKategori, type HubProdukt, type PrisOversiktIn } from "./pris-oversikt.ts";

type P = HubProdukt & { kat: string };

let nr = 0;
function vara(priceNum: number, kat: string, extra: Partial<P> = {}): P {
  nr += 1;
  return { id: `id${nr}`, slug: `vara-${nr}`, name: `Vara nummer ${nr} med ett längre namn`, price: `${priceNum} kr`, priceNum, inStock: true, imageScore: 50, kat, ...extra };
}

const ord = (t: string) => t.split(/\s+/).filter(Boolean).length;

// Två avdelningar: Möbler med Soffbord och Lampor under sig, Trädgård utan underkategorier.
const KATEGORIER: HubKategori[] = [
  { id: "k-mobler", slug: "mobler", name: "Möbler", parentId: null },
  { id: "k-soffbord", slug: "soffbord", name: "Soffbord", parentId: "k-mobler" },
  { id: "k-lampor", slug: "lampor", name: "Lampor", parentId: "k-mobler" },
  { id: "k-tradgard", slug: "tradgard", name: "Trädgård", parentId: null },
];
// Varan bär sin smalaste kategori; avdelningen räknar med underkategoriernas varor.
const UNDER: Record<string, string[]> = { mobler: ["mobler", "soffbord", "lampor"], soffbord: ["soffbord"], lampor: ["lampor"], tradgard: ["tradgard"] };

function indata(products: P[], over: Partial<PrisOversiktIn<P>> = {}): PrisOversiktIn<P> {
  return {
    price: 500,
    granser: [200, 500, 1000],
    andraSidor: [200, 500, 1000],
    products,
    kategorier: KATEGORIER,
    prissidor: [
      { price: 500, categorySlug: "mobler" },
      { price: 500, categorySlug: "tradgard" },
      { price: 1000, categorySlug: "lampor" },
    ],
    iKategorin: (slug) => products.filter((p) => (UNDER[slug] ?? []).includes(p.kat) && p.inStock),
    dedupe: (l) => [...new Map(l.map((p) => [p.id, p])).values()],
    blanda: (l) => l,
    iUrvalet: () => true,
    raknaOrd: ord,
    produkterText: (n) => `${n} ${n === 1 ? "produkt" : "produkter"}`,
    prisText: (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} kr`,
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
    const lista = [vara(100, "tradgard"), vara(200, "tradgard"), vara(300, "tradgard"), vara(400, "soffbord"), vara(450, "lampor"), vara(460, "lampor")];
    const hub = byggPrisOversikt(indata(lista));
    assert.ok(hub);
    assert.deepEqual(hub.kategorier, [
      { href: "/under-500-kr/mobler", namn: "Möbler", antal: 3 },
      { href: "/under-500-kr/tradgard", namn: "Trädgård", antal: 3 },
    ]);
  });

  it("grupperar kategorierna per avdelning, och rubriken länkar bara när avdelningen har en egen prissida", () => {
    const lista = [vara(100, "soffbord"), vara(110, "soffbord"), vara(120, "lampor"), vara(130, "tradgard"), vara(140, "tradgard")];
    const prissidor = [
      { price: 500, categorySlug: "soffbord" },
      { price: 500, categorySlug: "lampor" },
      { price: 500, categorySlug: "tradgard" },
    ];
    const hub = byggPrisOversikt(indata(lista, { prissidor }));
    assert.ok(hub);
    assert.deepEqual(hub.grupper, [
      // Möbler saknar egen prissida: rubrik utan länk, antalet räknat över hela avdelningen.
      { namn: "Möbler", href: null, antal: 3, kategorier: [{ href: "/under-500-kr/soffbord", namn: "Soffbord", antal: 2 }, { href: "/under-500-kr/lampor", namn: "Lampor", antal: 1 }] },
      { namn: "Trädgård", href: "/under-500-kr/tradgard", antal: 2, kategorier: [] },
    ]);
    // Den platta listan har alla tre, för antalet i texten.
    assert.equal(hub.kategorier.length, 3);
  });

  it("en avdelning med egen prissida blir rubrikens länk, inte en rad under sig själv", () => {
    const lista = [vara(100, "soffbord"), vara(110, "soffbord"), vara(120, "mobler"), vara(130, "mobler")];
    const prissidor = [{ price: 500, categorySlug: "mobler" }, { price: 500, categorySlug: "soffbord" }];
    const hub = byggPrisOversikt(indata(lista, { prissidor }));
    assert.ok(hub);
    assert.equal(hub.grupper.length, 1);
    assert.equal(hub.grupper[0].href, "/under-500-kr/mobler");
    assert.equal(hub.grupper[0].antal, 4);
    assert.deepEqual(hub.grupper[0].kategorier.map((k) => k.namn), ["Soffbord"]);
  });

  it("länkar bara till de andra gränser som har en översikt, aldrig till sig själv", () => {
    const fyra = [vara(10, "mobler"), vara(20, "mobler"), vara(30, "mobler"), vara(40, "mobler")];
    const alla = byggPrisOversikt(indata(fyra));
    assert.ok(alla);
    assert.deepEqual(alla.andraGranser, [
      { href: "/under-200-kr", label: "Under 200 kr" },
      { href: "/under-1000-kr", label: "Under 1 000 kr" },
    ]);
    // 2026-11-13: bara tre varor under 200 kr, så /under-200-kr är ingen sida.
    const utan200 = byggPrisOversikt(indata(fyra, { andraSidor: [500, 1000] }));
    assert.ok(utan200);
    assert.deepEqual(utan200.andraGranser.map((l) => l.href), ["/under-1000-kr"]);
  });

  it("skriver priset med prisText i ingressen", () => {
    const fyra = [vara(10, "mobler"), vara(20, "mobler"), vara(30, "mobler"), vara(40, "mobler")];
    const hub = byggPrisOversikt(indata(fyra, { price: 1000 }));
    assert.ok(hub);
    assert.match(hub.intro[0], /^4 produkter i lager för högst 1 000 kr\./);
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

  it("spärren gäller bara urvalet, inte antalet", () => {
    const gomd = vara(150, "mobler", { imageScore: 99 });
    const lista = [gomd, vara(100, "mobler"), vara(200, "mobler"), vara(300, "mobler")];
    const hub = byggPrisOversikt(indata(lista, { iUrvalet: (p) => p.id !== gomd.id }));
    assert.ok(hub);
    assert.equal(hub.antal, 4);
    assert.ok(!hub.products.some((p) => p.id === gomd.id));
    assert.equal(hub.products.length, 3);
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

  it("avdelningFor går upp till kategorin utan förälder och fastnar inte i en ring", () => {
    assert.equal(avdelningFor(KATEGORIER[1], KATEGORIER).id, "k-mobler");
    assert.equal(avdelningFor(KATEGORIER[0], KATEGORIER).id, "k-mobler");
    const ring: HubKategori[] = [
      { id: "a", slug: "a", name: "A", parentId: "b" },
      { id: "b", slug: "b", name: "B", parentId: "a" },
    ];
    assert.ok(["a", "b"].includes(avdelningFor(ring[0], ring).id));
  });
});

describe("kopplingen i lib/seo/programmatic.ts", () => {
  // programmatic.ts drar in katalogen och går inte att ladda här, så provet läser
  // källan: urvalet ska ha samma spärrar som /butik och regeln för varor som bara
  // får synas i sin underkategori (cigarettmaskinen, Leonard 2026-10-14).
  const kalla = readFileSync(join(import.meta.dirname, "programmatic.ts"), "utf8");
  it("urvalets spärrar", () => {
    const rad = kalla.match(/iUrvalet: \(p\) => ([^\n]+)/);
    assert.ok(rad, "iUrvalet saknas i hubCore");
    for (const sparr of ["gomda.has(p.id)", "MOSAIC_DENYLIST.has(p.slug)", "BARA_I_UNDERKATEGORIN.has(p.id)"]) {
      assert.ok(rad[1].includes(`!${sparr}`), `urvalet saknar !${sparr}`);
    }
  });
  it("sidan länkar bara till översikter som finns", () => {
    assert.match(kalla, /hubCore\(products, collections, tierParams, price, giltiga, gomda\)/);
  });
});
