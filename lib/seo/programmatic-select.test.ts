// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Fallen nedan är inte påhittade — varje test motsvarar en produkt som faktiskt
// låg på en publicerad sida i september 2026, valda av den gamla regeln som
// matchade nyckelord mot hela katalogen utan kategorigrind.
import test from "node:test";
import assert from "node:assert/strict";
import {
  categoryPool,
  matchByName,
  bySlugInStock,
  unionCuratedFirst,
  selectProducts,
  type SelProduct,
  type SelCollection,
} from "./programmatic-select.ts";

const LADDARE = "c-laddare";
const MOBLER = "c-mobler";
const BELYSNING = "c-belysning";
const LAMPOR = "c-lampor"; // underkategori till belysning
const LEKSAKER = "c-leksaker";

const collections: SelCollection[] = [
  { id: LADDARE, name: "Laddare & Kablar" },
  { id: MOBLER, name: "Hem" },
  { id: BELYSNING, name: "Belysning" },
  { id: LAMPOR, name: "Lampor", parentId: BELYSNING },
  { id: LEKSAKER, name: "Leksaker & Spel" },
];

let n = 0;
const p = (name: string, cats: string[], extra: Partial<SelProduct> = {}): SelProduct => ({
  id: `p${++n}`,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  inStock: true,
  imageScore: 50,
  collectionIds: cats,
  ...extra,
});

const elbilsladdare = p("Portabel elbilsladdare Typ 2 – 16A, 3,68 kW", [LADDARE], { imageScore: 10 });
const laddkabel = p("Laddkabel elbil Typ 2 – 22 kW trefas 32 A, 5 m", [LADDARE], { imageScore: 12 });
const powerbank = p("Baseus starthjälp 2000A – 20000mAh powerbank", [LADDARE], { imageScore: 14 });
const solpanel = p("Solpanel hopfällbar 20 W – USB-laddare för mobil", [LADDARE], { imageScore: 8 });
const byra = p("Byrå 130 cm med laddstation – åtta tyglådor", [MOBLER], { imageScore: 99 });
const skrivbord = p("Hörnskrivbord med laddstation och hylltorn – svart", [MOBLER], { imageScore: 98 });
const lasertag = p("Lasertag med laddstation 4 spelare", [LEKSAKER], { imageScore: 97 });

const KATALOG = [elbilsladdare, laddkabel, powerbank, solpanel, byra, skrivbord, lasertag];
const KW = ["laddare", "laddkabel", "laddstation", "powerbank", "usb-c"];
const id = <T,>(x: T[]) => x;

// ── Kategorigrinden ─────────────────────────────────────────────────────────

test("categoryPool – avgränsar till kategorin", () => {
  const pool = categoryPool(KATALOG, collections, ["Laddare & Kablar"]);
  assert.deepEqual(pool?.map((x) => x.name).sort(), [laddkabel, powerbank, solpanel, elbilsladdare].map((x) => x.name).sort());
});

test("categoryPool – tar med underkategorier", () => {
  const bordslampa = p("Bordslampa i trä med USB-A och USB-C", [LAMPOR]);
  const pool = categoryPool([...KATALOG, bordslampa], collections, ["Belysning"]);
  assert.deepEqual(pool?.map((x) => x.name), [bordslampa.name]);
});

test("categoryPool – okänd kategori ger null, INTE hela katalogen", () => {
  // Regressionen som gjorde mest skada: utan den här raden föll urvalet tillbaka
  // på hela sortimentet och matchade nyckelord mot vad som helst.
  assert.equal(categoryPool(KATALOG, collections, ["Hörlurar & Ljud"]), null);
});

test("categoryPool – tom lista betyder ingen avgränsning", () => {
  assert.equal(categoryPool(KATALOG, collections, [])?.length, KATALOG.length);
});

// ── De faktiska buggarna ────────────────────────────────────────────────────

test("en byrå med laddstation är inte en laddare", () => {
  const valda = selectProducts(KATALOG, collections, { categories: ["Laddare & Kablar"], keywords: KW, exclude: [] }, 5, id);
  const namn = valda!.map((x) => x.name);
  assert.equal(namn.includes(byra.name), false);
  assert.equal(namn.includes(skrivbord.name), false);
  assert.equal(valda!.length, 4);
});

test("ett lasertag-set stängs ute av kategorin, utan svartlistning", () => {
  // Före lagningen krävdes exclude:["lasertag","leksak"] för att hålla den borta.
  // Kategorigrinden gör plåstret överflödigt — inga exclude alls här.
  const valda = selectProducts(KATALOG, collections, { categories: ["Laddare & Kablar"], keywords: KW, exclude: [] }, 5, id);
  assert.equal(valda!.some((x) => x.name.includes("Lasertag")), false);
});

test("bra bild slår inte kategoritillhörighet", () => {
  // Byrån har imageScore 99 mot elbilsladdarens 10 och låg därför överst förut.
  const valda = selectProducts(KATALOG, collections, { categories: ["Laddare & Kablar"], keywords: KW, exclude: [] }, 5, id);
  assert.equal(valda!.every((x) => x.collectionIds?.includes(LADDARE)), true);
});

test("en färg är inte en produktkategori", () => {
  // "paviljongtak kaffebrun" matchade nyckelordet "kaffe" och hamnade under
  // kaffetillbehör. Kategorin — inte ordgräns — är det som stänger ute den:
  // ordgräns hade tagit "kaffebryggare" på köpet.
  const kaffe = [
    p("Espressomaskin HiBREW H10A", ["c-kok"]),
    p("Frukostmaskin 3-i-1 – ugn, stekplatta och kaffebryggare", ["c-kok"]),
    p("Paviljongtak 3 × 3 m – kaffebrun reservduk", ["c-tradgard"], { imageScore: 99 }),
    p("Matplats för hund i kaffebrunt – tre höjder", ["c-husdjur"], { imageScore: 99 }),
    p("Elektrisk kaffekvarn HiBREW G3", ["c-kok"]),
    p("Kapselmaskin HiBREW H3B 3-i-1", ["c-kok"]),
  ];
  const cols: SelCollection[] = [{ id: "c-kok", name: "Köksmaskiner & Apparater" }];
  const valda = selectProducts(kaffe, cols, { categories: ["Köksmaskiner & Apparater"], keywords: ["kaffe", "espresso"], exclude: [] }, 5, id);
  assert.equal(valda!.some((x) => x.name.includes("Paviljongtak")), false);
  assert.equal(valda!.some((x) => x.name.includes("Matplats")), false);
  assert.equal(valda!.some((x) => x.name.includes("kaffebryggare")), true, "kaffebryggaren ska vara kvar");
});

// ── Plocklistan ─────────────────────────────────────────────────────────────

test("productSlugs tas med även utanför kategorin, och först", () => {
  const valda = selectProducts(
    KATALOG,
    collections,
    { categories: ["Laddare & Kablar"], keywords: KW, exclude: [], productSlugs: [byra.slug] },
    5,
    id,
  );
  assert.equal(valda![0].name, byra.name);
  assert.equal(valda!.length, 5);
});

test("productSlugs hoppar över det som är slut på lagret", () => {
  const slut = p("Slutsåld laddare", [LADDARE], { inStock: false });
  assert.deepEqual(bySlugInStock([...KATALOG, slut], [slut.slug, powerbank.slug]).map((x) => x.name), [powerbank.name]);
});

test("plocklistan bär sidan när kategorin saknas", () => {
  const valda = selectProducts(KATALOG, collections, { categories: ["Finns Inte"], keywords: KW, exclude: [], productSlugs: [byra.slug] }, 5, id);
  assert.deepEqual(valda!.map((x) => x.name), [byra.name]);
});

test("varken kategori eller plocklista ger null — sidan får inte finnas", () => {
  assert.equal(selectProducts(KATALOG, collections, { categories: ["Finns Inte"], keywords: KW, exclude: [] }, 5, id), null);
});

// ── Grundbeteenden som inte fick ändras ─────────────────────────────────────

test("matchByName – exclude vinner över keywords", () => {
  assert.deepEqual(matchByName(KATALOG, ["laddstation"], ["lasertag"]).map((x) => x.name), [byra.name, skrivbord.name]);
});

test("unionCuratedFirst – nyckelordsträffar sorteras på bildpoäng", () => {
  const out = unionCuratedFirst([], [solpanel, powerbank, laddkabel], 3, id);
  assert.deepEqual(out.map((x) => x.imageScore), [14, 12, 8]);
});

test("unionCuratedFirst – ingen dubblett när en produkt både är plockad och matchad", () => {
  const out = unionCuratedFirst([powerbank], [powerbank, laddkabel], 5, id);
  assert.equal(out.length, 2);
});

test("urvalet respekterar limit", () => {
  const valda = selectProducts(KATALOG, collections, { categories: ["Laddare & Kablar"], keywords: KW, exclude: [] }, 2, id);
  assert.equal(valda!.length, 2);
});
