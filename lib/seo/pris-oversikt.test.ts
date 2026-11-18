// Översikten /under-{200,500,1000}-kr (Pattern 2b). Genvägarna på /butik pekade
// dit innan sidorna fanns och gav 404 (Leonard 2026-11-13).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { avdelningFor, byggPrisOversikt, prisLista, underPriset, type HubKategori, type HubProdukt, type PrisOversiktIn } from "./pris-oversikt.ts";

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

// ── "Visa fler" på översikten (Leonard 2026-11-18) ───────────────────────
describe("prisLista: varje vara under priset, för Visa fler", () => {
  const lista = (products: P[], gomda: string[] = [], bara: string[] = []) =>
    prisLista<P>({
      price: 500,
      products,
      dedupe: (l) => l,
      blanda: (l) => [...l].reverse(),
      iUrvalet: (p) => !gomda.includes(p.slug) && !bara.includes(p.slug),
      iListan: (p) => !bara.includes(p.slug),
    });

  it("börjar med urvalet i urvalets ordning, så att korten som redan står på sidan inte flyttas", () => {
    const a = vara(100, "soffbord", { imageScore: 90 });
    const b = vara(200, "soffbord", { imageScore: 80 });
    const c = vara(300, "lampor", { imageScore: 70 });
    // blanda vänder här på listan: urvalet är c, b, a.
    assert.deepEqual(lista([a, b, c]).map((p) => p.slug), [c.slug, b.slug, a.slug]);
  });

  it("varor som inte får stå i urvalet kommer efter det, bästa bilden först och sedan lägst pris", () => {
    const a = vara(100, "soffbord", { imageScore: 90 });
    const dold1 = vara(400, "lampor", { imageScore: 60 });
    const dold2 = vara(150, "lampor", { imageScore: 95 });
    const dold3 = vara(120, "lampor", { imageScore: 95 });
    const ut = lista([dold1, a, dold2, dold3], [dold1.slug, dold2.slug, dold3.slug]).map((p) => p.slug);
    assert.deepEqual(ut, [a.slug, dold3.slug, dold2.slug, dold1.slug]);
  });

  it("varor som bara får synas i sin underkategori står inte i listan alls", () => {
    const a = vara(100, "soffbord");
    const bara = vara(150, "lampor");
    assert.deepEqual(lista([a, bara], [], [bara.slug]).map((p) => p.slug), [a.slug]);
  });

  it("bara varor i lager och under priset, och ingen två gånger", () => {
    const a = vara(100, "soffbord");
    const slut = vara(100, "soffbord", { inStock: false });
    const dyr = vara(900, "soffbord");
    const ut = lista([a, slut, dyr, a]);
    assert.ok(ut.every((p) => p.inStock && p.priceNum <= 500));
    assert.ok(!ut.some((p) => p.slug === slut.slug || p.slug === dyr.slug));
  });
});

describe("Visa fler och miniatyrerna är inkopplade", () => {
  const las = (...d: string[]) => readFileSync(join(process.cwd(), ...d), "utf8");
  const sida = las("components", "price-hub-page.tsx");
  const rutt = las("app", "api", "pris-lista", "route.ts");
  const knapp = las("components", "pris-fler.tsx");
  const prog = las("lib", "seo", "programmatic.ts");

  it("knappen står inne i rutnätet och visas bara när det finns fler varor", () => {
    assert.match(sida, /\{flerKvar > 0 && <PrisFler pris=\{price\} kvar=\{flerKvar\} \/>\}\s*<\/div>/);
    assert.match(sida, /const flerKvar = Math\.max\(0, \(helaListan\?\.length \?\? 0\) - produkter\.length\);/);
    assert.match(las("app", "under-pris.css"), /\.pris2 \.p2-fler\{grid-column:1\/-1/);
  });

  it("rutten tar EN parameter, nekar påhittade sidor och ger samma ordning som sidan", () => {
    assert.match(rutt, /params\.length === 1 \? \/\^\(\\d\{2,5\}\)-\(\\d\{1,3\}\)\$\//);
    assert.match(rutt, /const fran = PRIS_PA_SIDAN \+ \(sida - 1\) \* PRIS_SIDA;/);
    assert.match(rutt, /if \(sida < 1 \|\| fran >= lista\.length\) return NextResponse\.json\(\{ error: "okänd sida" \}, \{ status: 404/);
    assert.match(prog, /export const PRIS_PA_SIDAN = MAX_HUB_LIST;/);
    // Högst så många kort per hämtning som listans första grupp med bilder (lib/list-payload.ts).
    const per = Number(prog.match(/export const PRIS_SIDA = (\d+);/)?.[1]);
    const medBild = Number(las("lib", "list-payload.ts").match(/export const FORSTA_MED_BILD = (\d+);/)?.[1]);
    assert.ok(per > 0 && per <= medBild, `${per} kort per hämtning, men bara de ${medBild} första får bild`);
  });

  it("knappen hämtar en sida en gång, tål ett fel och lägger inte samma vara två gånger", () => {
    assert.match(knapp, /if \(lofte\.current\?\.sida === sida\.current\) return lofte\.current\.svar;/);
    assert.match(knapp, /lage === "fel" \? "Kunde inte hämta fler · Försök igen"/);
    assert.match(knapp, /s\.kort\.filter\(\(k\) => !redan\.has\(k\.slug\)\)/);
  });

  it("varje kategori i registret har miniatyren från menyn, med kategorins slug ur adressen", () => {
    assert.match(sida, /<PrisKategoriBild slug=\{k\.href\.slice\(k\.href\.lastIndexOf\("\/"\) \+ 1\)\} \/>/);
    const bild = las("components", "pris-kategoribild.tsx");
    assert.match(bild, /useMenyBilder\(\)/);
    assert.match(bild, /void hamtaMenyBilder\(\);/);
    assert.match(bild, /<MenyBild src=\{bilder\?\.bilder\[slug\]\} klass="mn-bild p2-bild" \/>/);
  });
});

