// lib/kundvagn-forslag.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar varukorgens förslag (kundvagnsForslag i lib/related-pick.ts): varor
// som kompletterar det som ligger i varukorgen, aldrig ett alternativ till
// det, aldrig ett annat djurslag och aldrig något som kostar mer än 1,5 gånger
// varan. Förut var det samma åtta varor för alla (Leonards skärmdump
// 2026-10-08: en soffa för 7 359 kr i en varukorg på 4 876 kr).

import test from "node:test";
import assert from "node:assert/strict";
import { kundvagnsForslag, KOMPLEMENT } from "./related-pick.ts";
import type { Product } from "./products.ts";

function vara(id: string, name: string, priceNum: number, opts: { inStock?: boolean; img?: string; pop?: number } = {}): Product {
  return {
    id,
    slug: id,
    name,
    priceNum,
    inStock: opts.inStock ?? true,
    img: opts.img ?? `https://static.wixstatic.com/media/${id}.jpg`,
    popularity: opts.pop ?? 0,
    imageScore: 0,
    collectionIds: ["ALL"],
  } as unknown as Product;
}

// Fyllnad så att fyrgrammens sällsynthet liknar en riktig katalog.
const FYLLNAD = ["Paraply", "Termos", "Ryggsäck", "Doftljus", "Vinställ", "Brödkorg", "Väckarklocka", "Gardinstång"];
const fyllnad = () => FYLLNAD.map((n, i) => vara(`fyllnad-${i}`, `${n} ${i}`, 299));
const ids = (l: Product[]) => l.map((p) => p.id);

test("tom varukorg eller okända id ger inga förslag", () => {
  const all = [vara("bord", "Skrivbord 120 cm", 1499), vara("stol", "Kontorsstol med nätrygg", 999), ...fyllnad()];
  assert.deepEqual(kundvagnsForslag([], all), []);
  assert.deepEqual(kundvagnsForslag(["finns-inte"], all), []);
});

test("ett skrivbord får kontorsstolar och hurts, aldrig ett annat skrivbord", () => {
  const all = [
    vara("bord", "Skrivbord 120 cm i ek", 1499),
    vara("bord-2", "Skrivbord 140 cm med lådor", 1299),
    vara("stol", "Kontorsstol med nätrygg – svart", 999),
    vara("hurts", "Hurts på hjul med tre lådor", 699),
    ...fyllnad(),
  ];
  const f = ids(kundvagnsForslag(["bord"], all));
  assert.deepEqual(f, ["stol", "hurts"]);
});

test("en kontorsstol får skrivbord, aldrig en skrivbordsstol", () => {
  // "skrivbord" som ordbörjan hade träffat "Skrivbordsstol": en stol under en stol.
  const all = [
    vara("ritstol", "Ritstol med fotring och nätrygg", 1479),
    vara("skrivbordsstol", "Skrivbordsstol vit teddyfleece", 1119),
    vara("datorbord", "Datorbord i svart, 80 cm", 699),
    ...fyllnad(),
  ];
  assert.deepEqual(ids(kundvagnsForslag(["ritstol"], all)), ["datorbord"]);
});

test("ett matbord får matstolar, inte barstolar", () => {
  const all = [
    vara("matbord", "Matbord 120 cm i ek", 2299),
    vara("barstolar", "Barstolar 2-pack i sammet", 999),
    vara("matstolar", "Matstolar 2-pack i linnelook", 1299),
    ...fyllnad(),
  ];
  assert.deepEqual(ids(kundvagnsForslag(["matbord"], all)), ["matstolar"]);
});

test("det varan redan har med sig föreslås inte", () => {
  const all = [
    vara("fatolj", "Reclinerfåtölj med lös fotpall i konstläder", 3729),
    vara("fotpall", "Fotpall i manchester", 819),
    vara("sidobord", "Sidobord i rotting", 699),
    ...fyllnad(),
  ];
  assert.deepEqual(ids(kundvagnsForslag(["fatolj"], all)), ["sidobord"]);
});

test("julgranskragen föreslås, fast namnen liknar varandra", () => {
  // Kontrollen av samma sort på namnlikhet hade tagit kragen för en julgran.
  const all = [
    vara("gran", "Julgran 180 cm med 2 419 spetsar", 1329),
    vara("krage", "Julgranskrage i trä 65 × 65 cm", 679),
    vara("gran-2", "Julgran 210 cm med pynt", 1029),
    ...fyllnad(),
  ];
  assert.deepEqual(ids(kundvagnsForslag(["gran"], all)), ["krage"]);
});

test("aldrig ett annat djurslag, men neutrala husdjursvaror står kvar", () => {
  const all = [
    vara("klostrad", "Klösträd 120 cm med två kojor", 899),
    vara("hundskal", "Matskål för hund, upphöjd", 349),
    vara("fontan", "Vattenfontän i rostfritt, 2 liter", 449),
    ...fyllnad(),
  ];
  assert.deepEqual(ids(kundvagnsForslag(["klostrad"], all)), ["fontan"]);
});

test("högst 1,5 gånger varans pris, och billigare först", () => {
  const all = [
    vara("soffa", "3-sitssoffa i chenille", 2000),
    vara("lampa", "Golvlampa i mässing", 3100),
    vara("dyrare", "Soffbord i ek", 1900),
    vara("billigare", "Satsbord 2-pack", 900),
    ...fyllnad(),
  ];
  const f = ids(kundvagnsForslag(["soffa"], all));
  assert.ok(!f.includes("lampa"), "3 100 kr är mer än 1,5 × 2 000 kr");
  assert.equal(f[0], "billigare");
});

test("slutsålt, utan bild och redan i varukorgen föreslås inte", () => {
  const all = [
    vara("bord", "Skrivbord 120 cm", 1499),
    vara("slut", "Kontorsstol slutsåld", 899, { inStock: false }),
    vara("utanbild", "Kontorsstol utan bild", 899, { img: "" }),
    vara("ikorgen", "Kontorsstol i korgen", 899),
    vara("ok", "Kontorsstol med armstöd", 899),
    ...fyllnad(),
  ];
  assert.deepEqual(ids(kundvagnsForslag(["bord", "ikorgen"], all)), ["ok"]);
});

test("en vara per sort först: spegeln får en plats bland skohyllorna", () => {
  const all = [
    vara("garderob", "Tyggarderob 83 cm med klädstång", 579),
    vara("sko-1", "Skobänk i bambu", 300),
    vara("sko-2", "Skohylla i metall", 310),
    vara("sko-3", "Skoställ med fyra plan", 320),
    vara("spegel", "Väggspegel 40 × 60 cm med svart ram", 459),
    ...fyllnad(),
  ];
  const f = ids(kundvagnsForslag(["garderob"], all));
  assert.ok(f.includes("spegel"), `spegeln ska få en plats, fick ${f.join(", ")}`);
});

test("aldrig två nästan likadana förslag", () => {
  const all = [
    vara("stolar", "Matstolar 2-pack i manchester", 1569),
    vara("klaff-1", "Klaffbord 120 × 80 cm på hjul – vitt", 939),
    vara("klaff-2", "Klaffbord 120 × 80 cm på hjul – svart", 949),
    vara("glas", "Matbord i glas 75 × 75 cm", 929),
    ...fyllnad(),
  ];
  const f = ids(kundvagnsForslag(["stolar"], all));
  assert.equal(f.filter((x) => x.startsWith("klaff-")).length, 1, `ett klaffbord, fick ${f.join(", ")}`);
  assert.ok(f.includes("glas"));
});

test("två varor i varukorgen delar på platserna", () => {
  // Soffan har fyra sorter och billigare förslag. Utan andelen hade den tagit
  // alla tre platserna och julgranen ingen.
  const all = [
    vara("soffa", "3-sitssoffa 213 cm", 5499),
    vara("gran", "Julgran 180 cm", 1100),
    vara("soffbord", "Soffbord 100 cm", 900),
    vara("sidobord", "Sidobord i rotting", 699),
    vara("fotpall", "Fotpall i manchester", 819),
    vara("krage", "Julgranskrage i trä", 1000),
    ...fyllnad(),
  ];
  const f = ids(kundvagnsForslag(["soffa", "gran"], all));
  assert.equal(f.length, 3);
  assert.ok(f.includes("krage"), `julgranen ska få sin krage, fick ${f.join(", ")}`);
  assert.ok(!f.includes("fotpall"), "soffan har redan fått sina två platser");
});

test("limit gäller, och samma varukorg ger samma svar", () => {
  const all = [
    vara("soffa", "3-sitssoffa 213 cm", 5499),
    vara("a", "Soffbord 100 cm", 1429),
    vara("b", "Sidobord i rotting", 699),
    vara("c", "Fotpall i manchester", 819),
    vara("d", "Golvlampa 157 cm", 669),
    ...fyllnad(),
  ];
  assert.equal(kundvagnsForslag(["soffa"], all, 2).length, 2);
  assert.deepEqual(kundvagnsForslag(["soffa"], all, 0), []);
  assert.deepEqual(ids(kundvagnsForslag(["soffa"], all)), ids(kundvagnsForslag(["soffa"], [...all])));
});

test("reglerna: hela ord där ordbörjan hade tagit fel vara", () => {
  const regelFor = (namn: string) => KOMPLEMENT.filter((r) => r.vara.test(namn));
  assert.equal(regelFor("Grilltält 245 × 152 cm").length, 0, "ett grilltält är ingen grill");
  assert.ok(regelFor("Kolgrill med lock").length > 0);
  assert.equal(regelFor("Skrivbordsstol vit").some((r) => r.vara.test("Skrivbord 120 cm")), false, "en stol får inte skrivbordets regel");
  assert.equal(regelFor("Kontorsstol med nätrygg").some((r) => r.passar.some((p) => p.test("Skrivbordsstol vit"))), false, "en skrivbordsstol är inget skrivbord");
  assert.equal(regelFor("Hundsoffa 98 cm").some((r) => r.passar.some((p) => p.test("Soffbord i ek"))), false, "en hundsoffa är ingen soffa");
});
