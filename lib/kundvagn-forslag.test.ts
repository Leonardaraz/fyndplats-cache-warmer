// lib/kundvagn-forslag.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar varukorgens förslag (kundvagnsForslag i lib/related-pick.ts): varor
// som kompletterar det som ligger i varukorgen, aldrig ett alternativ till
// det, aldrig ett annat djurslag, ingen barnvara eller utomhusvara till en
// vara för vuxna eller för inomhus, och aldrig något som kostar mer än 1,5
// gånger varan. Förut var det samma åtta varor för alla (Leonards skärmdump
// 2026-10-08: en soffa för 7 359 kr i en varukorg på 4 876 kr). Svaret ska
// också bli detsamma ur underlaget som förslagsrutten cachar
// (forslagsUnderlag) som ur hela katalogen.

import test from "node:test";
import assert from "node:assert/strict";
import { arBarnvara, forslagsUnderlag, kundvagnsForslag, KOMPLEMENT } from "./related-pick.ts";
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

// Varor som ingen regel gäller för. De ska aldrig föreslås och aldrig påverka svaret.
const FYLLNAD = ["Paraply", "Termos", "Ryggsäck", "Doftljus", "Ljusstake", "Brödkorg", "Väckarklocka", "Gardinstång"];
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

test("en vara utan regel i varukorgen tar ingen plats", () => {
  // Hade projektorduken räknats hade soffan fått två av tre platser i första
  // varvet, och satsbordet tagit den tredje fast fotpallen är en annan sort.
  const all = [
    vara("soffa", "3-sitssoffa 213 cm", 5000),
    vara("duk", "Projektorduk 100 tum", 900),
    vara("a-soffbord", "Soffbord i ek", 900),
    vara("b-satsbord", "Satsbord 2-pack i rotting", 900),
    vara("sidobord", "Sidobord i metall", 700),
    vara("fotpall", "Fotpall i sammet", 600),
    ...fyllnad(),
  ];
  const ensam = ids(kundvagnsForslag(["soffa"], all));
  assert.deepEqual(ensam, ["a-soffbord", "sidobord", "fotpall"]);
  assert.deepEqual(ids(kundvagnsForslag(["soffa", "duk"], all)), ensam);
});

test("underlaget: varor som en regel gäller för och varor som kan föreslås, och samma svar som hela katalogen", () => {
  const all = [
    vara("soffa", "3-sitssoffa 213 cm", 5000),
    vara("bord", "Skrivbord 120 cm i ek", 1499, { inStock: false }),
    vara("duk", "Projektorduk 100 tum", 900),
    vara("soffbord", "Soffbord i ek", 900, { pop: 3 }),
    vara("sidobord", "Sidobord i metall", 700),
    vara("stol", "Kontorsstol med nätrygg", 999, { pop: 5 }),
    vara("hurts", "Hurts på hjul", 699),
    vara("madrass", "Madrass 90 × 200 cm", 600, { inStock: false }),
    ...fyllnad(),
  ];
  const underlag = forslagsUnderlag(all);
  // Det slutsålda skrivbordet kan ligga i en varukorg, den slutsålda madrassen
  // kan varken det eller föreslås (ingen regel gäller för en madrass).
  assert.deepEqual(ids(underlag), ["soffa", "bord", "soffbord", "sidobord", "stol", "hurts"]);
  for (const korg of [["soffa"], ["bord"], ["stol"], ["soffa", "bord"], ["soffa", "duk"], ["duk"]]) {
    assert.deepEqual(ids(kundvagnsForslag(korg, underlag)), ids(kundvagnsForslag(korg, all)), korg.join(" + "));
  }
});

test("likheten mellan förslagen räknas bland varorna som kan föreslås", () => {
  // Räknat på hela katalogen ser de två Lunaria-borden ut som samma vara
  // (likhet över 0,6), och sidobordet hade fallit bort. Bland varorna som kan
  // föreslås är de två sorters bord, och svaret blir detsamma ur underlaget.
  const all = [
    vara("soffa", "3-sitssoffa 213 cm", 5000),
    vara("a-sidobord", "Sidobord Lunaria Deluxe", 700),
    vara("b-soffbord", "Soffbord Lunaria Deluxe", 900),
    vara("fotpall", "Fotpall i sammet", 600),
    vara("golvlampa", "Golvlampa 157 cm", 669),
    ...fyllnad(),
  ];
  assert.deepEqual(ids(kundvagnsForslag(["soffa"], all)), ["b-soffbord", "a-sidobord", "fotpall"]);
  assert.deepEqual(ids(kundvagnsForslag(["soffa"], forslagsUnderlag(all))), ["b-soffbord", "a-sidobord", "fotpall"]);
});

test("försäljningens skala räknas bland varorna som kan föreslås", () => {
  // Projektorduken säljer mest men kan aldrig föreslås. Räknad mot den hade
  // fotpallens tre sålda knappt märkts.
  const all = [
    vara("soffa", "3-sitssoffa 213 cm", 2000),
    vara("duk", "Projektorduk 100 tum", 900, { pop: 50 }),
    vara("soffbord", "Soffbord i ek", 1800),
    vara("sidobord", "Sidobord i metall", 700),
    vara("fotpall", "Fotpall i sammet", 600, { pop: 3 }),
    ...fyllnad(),
  ];
  assert.deepEqual(ids(kundvagnsForslag(["soffa"], all)), ["fotpall", "sidobord", "soffbord"]);
  assert.deepEqual(ids(kundvagnsForslag(["soffa"], forslagsUnderlag(all))), ["fotpall", "sidobord", "soffbord"]);
});

test("reglerna: hela ord där ordbörjan hade tagit fel vara", () => {
  const regelFor = (namn: string) => KOMPLEMENT.filter((r) => r.vara.test(namn));
  assert.equal(regelFor("Grilltält 245 × 152 cm").length, 0, "ett grilltält är ingen grill");
  assert.ok(regelFor("Kolgrill med lock").length > 0);
  assert.equal(regelFor("Skrivbordsstol vit").some((r) => r.vara.test("Skrivbord 120 cm")), false, "en stol får inte skrivbordets regel");
  assert.equal(regelFor("Kontorsstol med nätrygg").some((r) => r.passar.some((p) => p.test("Skrivbordsstol vit"))), false, "en skrivbordsstol är inget skrivbord");
  assert.equal(regelFor("Hundsoffa 98 cm").some((r) => r.passar.some((p) => p.test("Soffbord i ek"))), false, "en hundsoffa är ingen soffa");
});

test("en väggspegel får konsolbord, byrå och skoskåp, en badrumsspegel badrumsvaror", () => {
  // Leonards skärmdump 2026-10-09: en väggspegel i varukorgen gav inga förslag.
  const all = [
    vara("spegel", "Väggspegel 50 × 40 cm med svart metallram", 959),
    vara("badspegel", "LED-spegel för badrum 70 × 90 cm – antiimma och IP44", 1479),
    vara("konsol", "Konsolbord 100 cm i marmorlook", 799),
    vara("byra", "Byrå med fyra lådor", 1299),
    vara("skoskap", "Skoskåp med tre fällbara luckor", 1379),
    vara("badskap", "Badrumsskåp i bambu med lamelldörr", 599),
    vara("badhylla", "Badrumshylla i bambu, fyra plan", 479),
    ...fyllnad(),
  ];
  assert.deepEqual(new Set(ids(kundvagnsForslag(["spegel"], all))), new Set(["konsol", "byra", "skoskap"]));
  const bad = ids(kundvagnsForslag(["badspegel"], all));
  assert.deepEqual(new Set(bad), new Set(["badskap", "badhylla"]));
});

test("ingen barnvara till en vara för vuxna, men till en barnvara och i en barnregel", () => {
  const all = [
    vara("byra", "Byrå med fyra lådor i vitt", 1299),
    vara("barnbyra", "Byrå för barnrummet i rosa – tre lådor, för barn 3–8 år", 759),
    vara("nattbarn", "Nattduksbord för barn med molnlåda, 3–8 år", 499),
    vara("tagbana", "Tågbana i trä med 91 delar och kran", 939),
    vara("hylla", "Leksakshylla med sex tygboxar, för barn 3–8 år", 559),
    ...fyllnad(),
  ];
  assert.deepEqual(ids(kundvagnsForslag(["byra"], all)), []);
  assert.deepEqual(ids(kundvagnsForslag(["barnbyra"], all)), ["nattbarn"]);
  // En tågbana säger inte att den är för barn, men regeln gäller barnvaror.
  assert.deepEqual(ids(kundvagnsForslag(["tagbana"], all)), ["hylla"]);
  assert.equal(arBarnvara("Barnsäker förvaringskista med lock"), false);
  assert.equal(arBarnvara("Skumklossar för 6–36 månader"), true);
});

test("ingen utomhusvara till en vara för inomhus, och utemöbler får utomhusvaror", () => {
  const all = [
    vara("tvbank", "TV-bänk 160 cm med två skåp", 1699),
    vara("ute-soffbord", "Soffbord utomhus med hylla, rotting", 999),
    vara("soffbord", "Soffbord i ek med hylla", 1199),
    vara("utegrupp", "Bistroset med två stolar och runt bord för balkong", 1899),
    vara("parasoll", "Parasoll Ø 265 cm med vev", 749),
    vara("dynor", "Stolsdynor 2-pack för utomhus", 499),
    ...fyllnad(),
  ];
  assert.deepEqual(ids(kundvagnsForslag(["tvbank"], all)), ["soffbord"]);
  assert.deepEqual(new Set(ids(kundvagnsForslag(["utegrupp"], all))), new Set(["parasoll", "dynor"]));
});

test("halloween: en figur får en hängande och en uppblåsbar dekoration, aldrig en figur till", () => {
  const all = [
    vara("clown", "Halloweenclown 173 cm – rör huvud och armar", 1059),
    vara("haxa", "Animerad halloweenhäxa 183 cm", 899),
    vara("hangande", "Hängande halloweenmumie 142 cm", 569),
    vara("uppblast", "Uppblåsbart halloweenspöke 180 cm", 649),
    vara("sovsack", "Naturehike Mujin mumiesovsäck – +4 °C", 669),
    ...fyllnad(),
  ];
  assert.deepEqual(new Set(ids(kundvagnsForslag(["clown"], all))), new Set(["hangande", "uppblast"]));
  assert.deepEqual(ids(kundvagnsForslag(["sovsack"], all)), [], "en mumiesovsäck är ingen halloweenfigur");
});

test("reglerna: ordets form avgör, inte bara början", () => {
  const regelFor = (namn: string) => KOMPLEMENT.filter((r) => r.vara.test(namn));
  assert.equal(regelFor("Eldstadsverktyg i fem delar").some((r) => r.passar.some((p) => p.test("Vedställ 70 cm"))), false, "eldstadsverktyg är ingen eldstad");
  assert.equal(regelFor("Pop-up-tält 6 × 3 m").length, 0, "ett partytält är inget campingtält");
  assert.equal(regelFor("TV-bänk 160 cm").some((r) => r.passar.some((p) => p.test("Skoskåp med tre luckor"))), false, "en tv-bänk är ingen hallbänk");
  assert.equal(regelFor("Hammocköverdrag i oxfordtyg").some((r) => r.passar.some((p) => p.test("Hammocköverdrag i oxfordtyg"))), false, "överdraget är ingen hammock");
});

test("reglernas mönster saknar Unicode-flaggan, som gör dem flera gånger långsammare", () => {
  // Utan flaggan går alla regler mot underlaget på ~40 ms i stället för ~250
  // (mätt 2026-10-09). En regel skriver \p{L}, som byts mot en teckenklass.
  for (const r of KOMPLEMENT) {
    for (const re of [r.vara, ...r.passar]) {
      assert.equal(re.flags, "i", re.source);
      assert.ok(!re.source.includes("\\p{"), re.source);
    }
  }
});

