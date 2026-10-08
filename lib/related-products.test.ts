// lib/related-products.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar urvalslogiken för "Liknande produkter" (pickRelated): meningsfullt
// kategori-överlapp, och — det audit:en 2026-07 hittade — att den universella
// "All Products"-kategorin INTE räknas som "samma kategori" (annars blir varje
// produkt relaterad till varenda annan). Sedan 2026-10-08 också produkttypen,
// djurslaget och färgvarianterna.

import test from "node:test";
import assert from "node:assert/strict";
import { pickRelated, universalCollectionIds, sharedCategoryCount } from "./related-pick.ts";
import type { Product } from "./products.ts";

// Minimal produkt — bara fälten pickRelated läser (resten stubbas).
function mk(slug: string, collectionIds: string[], inStock = true): Product {
  return { slug, collectionIds, inStock, id: slug, name: slug } as unknown as Product;
}

// Katalog: 11 cykel + 11 telefon, ALLA i den universella "ALL"-kategorin.
function catalog(): Product[] {
  const out: Product[] = [];
  for (let i = 0; i < 11; i++) out.push(mk(`bike-${i}`, ["ALL", "bike"]));
  for (let i = 0; i < 11; i++) out.push(mk(`phone-${i}`, ["ALL", "phone"]));
  return out;
}

test("universalCollectionIds hittar den katalogtäckande kategorin", () => {
  const uni = universalCollectionIds(catalog());
  assert.ok(uni.has("ALL"));
  assert.ok(!uni.has("bike"));
  assert.ok(!uni.has("phone"));
});

test("sharedCategoryCount ignorerar universella kategorier", () => {
  const uni = new Set(["ALL"]);
  const a = mk("a", ["ALL", "bike"]);
  const bikeB = mk("b", ["ALL", "bike"]);
  const phoneC = mk("c", ["ALL", "phone"]);
  assert.equal(sharedCategoryCount(a, bikeB, uni), 1); // delar "bike"
  assert.equal(sharedCategoryCount(a, phoneC, uni), 0); // delar bara "ALL" → 0
});

test("bara samma MENINGSFULLA kategori (inte via universell)", () => {
  const all = catalog();
  const p = all[0]; // bike-0
  const related = pickRelated(p, all, 4);
  assert.equal(related.length, 4);
  assert.ok(related.every((r) => r.slug.startsWith("bike-")), "alla ska vara cykel-produkter");
  assert.ok(related.every((r) => r.slug !== p.slug), "aldrig produkten själv");
});

test("produkten själv och dubbletter exkluderas", () => {
  const all = catalog();
  const p = all[0]; // bike-0
  // Samma produkt två gånger i katalogen, och produkten själv en gång till.
  const related = pickRelated(p, [...all, all[1], all[1], p], 4);
  const slugs = related.map((r) => r.slug);
  assert.ok(!slugs.includes("bike-0"), "aldrig sig själv");
  assert.equal(new Set(slugs).size, slugs.length, "inga dubbletter");
});

test("respekterar limit; kan returnera färre (anroparen grindar på ≥2)", () => {
  const all = catalog();
  const p = all[0];
  assert.equal(pickRelated(p, all, 4).length, 4);
  assert.equal(pickRelated(p, all, 2).length, 2);
  // Produkt helt utan meningsfull kategori → tom.
  const lonely = mk("lonely", ["ALL"]);
  const all2 = [...all, lonely];
  assert.equal(pickRelated(lonely, all2).length, 0);
});

test("bara varor i lager vid lika kategori-överlapp", () => {
  const all = [
    mk("p", ["ALL", "bike"]),
    mk("oos", ["ALL", "bike"], false),
    mk("instock", ["ALL", "bike"], true),
    ...Array.from({ length: 20 }, (_, i) => mk(`filler-${i}`, ["ALL", "misc"])),
  ];
  const related = pickRelated(all[0], all, 4);
  // Bara "instock" och "oos" delar "bike"; den slutsålda ska inte med.
  assert.deepEqual(related.map((r) => r.slug), ["instock"]);
});

// 2026-08-04: fallback-påfyllningen sorterade slutsålda sist men tog ändå med
// dem när överlappet var tunt → PDP:n tipsade om varor man inte kan köpa.
test("föreslår ALDRIG en slutsåld produkt", () => {
  const all = [
    mk("bike-0", ["ALL", "bike"]),
    mk("bike-slut", ["ALL", "bike"], false),
    mk("bike-1", ["ALL", "bike"]),
  ];
  const rel = pickRelated(mk("bike-mig", ["ALL", "bike"]), all);
  assert.ok(!rel.some((p) => !p.inStock), "slutsåld produkt slank in i förslagen");
  assert.deepEqual(rel.map((p) => p.slug).sort(), ["bike-0", "bike-1"]);
});

test("hellre färre förslag än ett som inte går att köpa", () => {
  const all = [mk("bike-0", ["ALL", "bike"]), mk("bike-slut", ["ALL", "bike"], false)];
  const rel = pickRelated(mk("bike-mig", ["ALL", "bike"]), all, 4);
  assert.equal(rel.length, 1);
});

// ── Merchandiser-rankning (2026-08-15) ───────────────────────────────────────
// Urvalet rankade förr på ENBART antal delade kategorier. Testerna nedan låser
// de signaler som ersatte det, alla gratis ur Wix-datan.

import {
  categoryWeights, priceFit, typord, huvud, djurslag, likhetsdata, typLikhet, SAMMA_TYP,
} from "./related-pick.ts";

function mkFull(
  slug: string,
  collectionIds: string[],
  opts: { name?: string; priceNum?: number; pop?: number; inStock?: boolean } = {},
): Product {
  return {
    slug,
    collectionIds,
    inStock: opts.inStock ?? true,
    id: slug,
    name: opts.name ?? slug,
    priceNum: opts.priceNum ?? 0,
    popularity: opts.pop ?? 0,
    imageScore: 0,
  } as unknown as Product;
}

// Fyllnad i en egen kategori, så att fyrgrammens sällsynthet (IDF) liknar en
// riktig katalog. Inget av orden delar ett fyrgram med testernas produkttyper.
const FYLLNADSNAMN = [
  "Soffbord ek", "Golvlampa mässing", "Skoställ bambu", "Badrumsmatta", "Spegel rund",
  "Taklampa", "Gardinstång", "Vattenkanna", "Tvättkorg", "Klädhängare",
  "Ljusstake", "Paraply", "Termos", "Grillgaller", "Ryggsäck",
  "Kökshandduk", "Vinställ", "Doftljus", "Väckarklocka", "Brödkorg",
];
function fyllnad(n = FYLLNADSNAMN.length): Product[] {
  return Array.from({ length: n }, (_, i) =>
    mkFull(`fyllnad-${i}`, ["ALL", "annat"], { name: `${FYLLNADSNAMN[i % FYLLNADSNAMN.length]} ${i}` }));
}

test("priceFit – lika pris ger full poäng, upp till 1,5× är gratis", () => {
  assert.equal(priceFit(500, 500), 1);
  assert.equal(priceFit(500, 750), 1); // exakt 1,5×
  assert.ok(priceFit(500, 5000) < 0.35, "10× ska straffas hårt");
  assert.ok(priceFit(500, 1500) < priceFit(500, 800), "större kvot = lägre poäng");
});

test("priceFit – mäter kvot, inte kronor (samma felsteg i olika prisklass)", () => {
  assert.equal(priceFit(200, 400), priceFit(2000, 4000));
});

test("priceFit – saknat pris är neutralt, aldrig ett straff", () => {
  assert.equal(priceFit(undefined, 500), 1);
  assert.equal(priceFit(0, 500), 1);
});

test("typord – bara ord, siffror, mått och småord faller bort", () => {
  assert.deepEqual(typord("Cykelpump 160 PSI golvfot"), ["cykelpump", "psi", "golvfot"]);
  assert.deepEqual(typord("Hundgrind 75–103 cm med kattlucka"), ["hundgrind", "kattlucka"]);
  assert.deepEqual(typord(""), []);
});

// \b räknar inte å, ä och ö som bokstäver, så ett reguljärt uttryck med \b
// hade låtit "grå" och "blå" stå kvar som om de beskrev varan.
test("typord – färger stryks, även de med å, ä och ö", () => {
  assert.deepEqual(typord("Fåtölj sammet grå"), ["fåtölj", "sammet"]);
  assert.deepEqual(typord("Barstol blå, 2-pack"), ["barstol"]);
  assert.deepEqual(typord("Pall i mörkgrå sammet"), ["pall", "sammet"]);
});

test("huvud – namnets början, före tankstreck, komma eller med/i/för …", () => {
  assert.equal(huvud("Barstolar 2-pack – sammet"), "Barstolar 2-pack");
  assert.equal(huvud("Takväska vattentät, 400 liter"), "Takväska vattentät");
  assert.equal(huvud("Kattträd med hängmatta"), "Kattträd");
  assert.equal(huvud("Matbord i ek"), "Matbord");
  assert.equal(huvud("Soffbord"), "Soffbord");
  assert.equal(huvud(""), "");
});

// Granskningen 2026-08-15 fällde den tidigare förstaords-"typen": 91 av 756
// produkter börjar med ett ADJEKTIV. Vanligast var "hopfällbar" (22 st) — en
// arbetsbänk, en bardisk och en dragvagn i samma kategori räknades som samma
// typ. Sällsyntheten löser det.
test("typLikhet – ett vanligt adjektiv gör INTE två olika varor till samma typ", () => {
  const all = [
    mkFull("a", [], { name: "Hopfällbar arbetsbänk" }),
    mkFull("b", [], { name: "Hopfällbar bardisk portabel" }),
    mkFull("c", [], { name: "Hopfällbar dragvagn trappvagn" }),
    mkFull("d", [], { name: "Hopfällbar campingstol" }),
    mkFull("e", [], { name: "Hopfällbar hundbur" }),
    ...fyllnad(),
  ];
  const sim = typLikhet("Hopfällbar arbetsbänk", "Hopfällbar bardisk portabel", likhetsdata(all));
  assert.ok(sim < SAMMA_TYP, `delar bara ett vanligt adjektiv → inte samma typ, fick ${sim.toFixed(2)}`);
});

test("typLikhet – ovanligt substantiv gör två varianter lika, oavsett ordföljd", () => {
  const all = [
    mkFull("a", [], { name: "Cykelpump 160 PSI golvfot manometer" }),
    mkFull("b", [], { name: "Elektrisk cykelpump 150 PSI" }),
    ...Array.from({ length: 20 }, (_, i) => mkFull(`x-${i}`, [], { name: `Elektrisk lampa ${i}` })),
  ];
  // Det HÄR är fallet förstaords-typen missade: olika första ord, samma sak.
  const sim = typLikhet("Cykelpump 160 PSI golvfot manometer", "Elektrisk cykelpump 150 PSI", likhetsdata(all));
  assert.ok(sim >= SAMMA_TYP, `delar det ovanliga "cykelpump" → samma typ, fick ${sim.toFixed(2)}`);
});

// Svenskan böjer: "barstol" och "barstolar" är olika ord men nästan samma
// fyrgram. En jämförelse på hela ord hade sett två olika varor.
test("typLikhet – böjda former är samma typ (barstol, barstolar)", () => {
  const all = [
    mkFull("a", [], { name: "Barstolar 2-pack sammet" }),
    mkFull("b", [], { name: "Barstol med ryggstöd" }),
    ...fyllnad(),
  ];
  const sim = typLikhet("Barstolar 2-pack sammet", "Barstol med ryggstöd", likhetsdata(all));
  assert.ok(sim >= SAMMA_TYP, `barstol ≈ barstolar, fick ${sim.toFixed(2)}`);
});

// Produkttypen står i början av namnet; det efter "för" eller "med" beskriver
// den. En hylla för kryddburkar är en hylla, inte en kryddburk.
test("typLikhet – namnets början väger tyngst", () => {
  const all = [
    mkFull("a", [], { name: "Hylla för kryddburkar" }),
    mkFull("b", [], { name: "Hylla vägg" }),
    mkFull("c", [], { name: "Kryddburkar glas 12-pack" }),
    ...fyllnad(),
  ];
  const d = likhetsdata(all);
  const hylla = typLikhet("Hylla för kryddburkar", "Hylla vägg", d);
  const burkar = typLikhet("Hylla för kryddburkar", "Kryddburkar glas 12-pack", d);
  assert.ok(hylla > burkar, `hylla ${hylla.toFixed(2)} ska slå kryddburkar ${burkar.toFixed(2)}`);
});

test("typLikhet – tomt namn ger 0, kraschar inte", () => {
  const d = likhetsdata([mkFull("a", [], { name: "Soffbord ek" }), ...fyllnad()]);
  assert.equal(typLikhet("", "Soffbord ek", d), 0);
  assert.equal(typLikhet("Soffbord ek", "", d), 0);
});

test("categoryWeights – sällsynt kategori väger mer än katalogtäckande", () => {
  const all = [
    // "ALL" ligger på ALLA 60; "stor" på 50; "liten" på 2 → strikt fallande bredd.
    ...Array.from({ length: 48 }, (_, i) => mkFull(`b-${i}`, ["ALL", "stor"])),
    mkFull("smal-1", ["ALL", "stor", "liten"]),
    mkFull("smal-2", ["ALL", "stor", "liten"]),
    ...Array.from({ length: 10 }, (_, i) => mkFull(`bara-all-${i}`, ["ALL"])),
  ];
  const w = categoryWeights(all);
  assert.ok(w.get("liten")! > w.get("stor")!, "smal kategori ska väga tyngre");
  assert.ok(w.get("stor")! > w.get("ALL")!, "ALL täcker allt → lägst vikt");
});

test("specifik delad underkategori slår bred huvudkategori", () => {
  const all = [
    mkFull("jag", ["ALL", "hem", "badrum"], { name: "Spegelskåp badrum 60 cm" }),
    mkFull("badrumssyskon", ["ALL", "hem", "badrum"], { name: "Väggskåp badrum 60 cm" }),
    ...Array.from({ length: 40 }, (_, i) =>
      mkFull(`hem-${i}`, ["ALL", "hem"], { name: `Soffbord ${i}` })),
  ];
  const rel = pickRelated(all[0], all, 1);
  assert.equal(rel[0].slug, "badrumssyskon", "den som delar den smala kategorin ska först");
});

test("prispassning väljer bort vansinnig prisklass", () => {
  // Samma sorts vara och samma kategori: bara priset skiljer dem åt. Den
  // orimliga står först, så den hade vunnit på lika poäng.
  const all = [
    mkFull("jag", ["ALL", "k"], { name: "Spegelskåp badrum 60 cm", priceNum: 1000 }),
    mkFull("orimlig", ["ALL", "k"], { name: "Väggskåp badrum 40 cm", priceNum: 39 }),
    mkFull("rimlig", ["ALL", "k"], { name: "Väggskåp badrum 60 cm", priceNum: 1200 }),
    ...fyllnad(),
  ];
  const rel = pickRelated(all[0], all, 1);
  assert.equal(rel[0].slug, "rimlig");
});

test("popularitet skiljer likvärdiga kandidater, kör inte över relevans", () => {
  const all = [
    mkFull("jag", ["ALL", "smal"], { name: "Spegelskåp badrum", priceNum: 1000 }),
    mkFull("smal-trog", ["ALL", "smal"], { name: "Väggskåp badrum", priceNum: 1000, pop: 0 }),
    mkFull("bred-hit", ["ALL", "bred"], { name: "Soffbord ek", priceNum: 1000, pop: 999 }),
    ...Array.from({ length: 30 }, (_, i) => mkFull(`f-${i}`, ["ALL", "bred"], { name: `Fyllnad ${i}` })),
  ];
  const rel = pickRelated(all[0], all, 1);
  assert.equal(rel[0].slug, "smal-trog", "relevans slår popularitet");
});

// ── Produkttyp, djurslag och färgvarianter (2026-10-08) ──────────────────────
// Mätt på hela katalogen: 60 % av produktsidorna visade inget förslag av samma
// sorts vara, och 118 föreslog ett annat djurslag än produkten.

test("samma sorts vara först, även i en bred kategori (kompost)", () => {
  const all = [
    mkFull("jag", ["ALL", "tradgard"], { name: "Kompostbehållare 300 liter", priceNum: 899 }),
    mkFull("knapall", ["ALL", "tradgard"], { name: "Knäpall hopfällbar", priceNum: 799, pop: 999 }),
    mkFull("slangvinda", ["ALL", "tradgard"], { name: "Slangvinda 30 m", priceNum: 899, pop: 500 }),
    mkFull("snokappar", ["ALL", "tradgard"], { name: "Snökäppar 10-pack", priceNum: 699, pop: 500 }),
    mkFull("kompost-2", ["ALL", "tradgard"], { name: "Kompostbehållare termo, 2 kammare", priceNum: 999 }),
    ...fyllnad(),
  ];
  const rel = pickRelated(all[0], all, 4);
  assert.equal(rel[0].slug, "kompost-2", "den andra kompostbehållaren ska först, före den populära knäpallen");
});

test("barstolar får barstolar, inte ett matbord först", () => {
  const all = [
    mkFull("jag", ["ALL", "matsal"], { name: "Barstolar 2-pack sammet", priceNum: 1499 }),
    mkFull("matbord", ["ALL", "matsal"], { name: "Matbord ek 120 cm", priceNum: 1999, pop: 999 }),
    mkFull("barstol", ["ALL", "matsal"], { name: "Barstol med ryggstöd", priceNum: 999 }),
    mkFull("matta", ["ALL", "matsal"], { name: "Matta ull 160 cm", priceNum: 1299, pop: 500 }),
    ...fyllnad(),
  ];
  const rel = pickRelated(all[0], all, 4);
  assert.equal(rel[0].slug, "barstol");
});

test("djurslag – läser djuret ur namnet, och bara djuret", () => {
  assert.deepEqual([...djurslag("Hundsäng ortopedisk")], ["hund"]);
  assert.deepEqual([...djurslag("Valpgrind 3 delar")], ["hund"]);
  // Agilityset säger sällan hund i namnet, men alla 14 i katalogen är hundvaror.
  assert.deepEqual([...djurslag("Agilityset med hoppring, hinder och slalom")], ["hund"]);
  assert.deepEqual([...djurslag("Kattträd 150 cm")], ["katt"]);
  assert.deepEqual([...djurslag("Klösträd 90 cm i beige – dubbel koja")], ["katt"]);
  assert.deepEqual([...djurslag("Väggklösträd 4 delar")], ["katt"]);
  assert.deepEqual([...djurslag("Kaninbur med ramp")], ["smådjur"]);
  assert.deepEqual([...djurslag("Dvärghamsterbur 47x30x27 cm – 2 våningar")], ["smådjur"]);
  assert.deepEqual([...djurslag("Hundtrappa för hundar och katter")].sort(), ["hund", "katt"]);
  assert.deepEqual([...djurslag("Glasterrarium med frontlucka och gallerlock")], ["reptil"]);
  assert.deepEqual([...djurslag("Sköldpaddshus 81 cm med två rum")], ["reptil"]);
  assert.deepEqual([...djurslag("Nanoakvarium 36 liter med LED")], ["fisk"]);
  // Ett tygmönster och en skattkista är inga djur, och inte heller fiskeprylar
  // eller en leksak formad som en fisk.
  assert.equal(djurslag("Kudde med hundtandsmönster").size, 0);
  assert.equal(djurslag("Skattkista i trä").size, 0);
  assert.equal(djurslag("Eldskydd med fiskbensmönster").size, 0);
  assert.equal(djurslag("Fiskespö med rulle 2,13 m").size, 0);
  assert.equal(djurslag("Basketställ för barn – fiskformad platta").size, 0);
  assert.equal(djurslag("Husdjurstrappa 3 steg").size, 0);
  assert.equal(djurslag("").size, 0);
});

test("inget förslag med ett annat djurslag, men neutrala husdjursvaror står kvar", () => {
  const all = [
    mkFull("jag", ["ALL", "husdjur"], { name: "Hundsäng ortopedisk", priceNum: 599 }),
    mkFull("kattsang", ["ALL", "husdjur"], { name: "Kattsäng med kudde", priceNum: 599, pop: 999 }),
    mkFull("trappa", ["ALL", "husdjur"], { name: "Husdjurstrappa 3 steg", priceNum: 499 }),
    mkFull("hundbadd", ["ALL", "husdjur"], { name: "Hundbädd rund", priceNum: 499 }),
    mkFull("hund-och-katt", ["ALL", "husdjur"], { name: "Hundtrappa för hundar och katter", priceNum: 499 }),
    ...fyllnad(),
  ];
  const slugs = pickRelated(all[0], all, 4).map((r) => r.slug);
  assert.ok(!slugs.includes("kattsang"), "en kattsäng ska inte föreslås under en hundsäng");
  assert.ok(slugs.includes("trappa"), "en neutral husdjursvara ska stå kvar");
  assert.ok(slugs.includes("hundbadd"));
  assert.ok(slugs.includes("hund-och-katt"), "en vara för både hund och katt passar en hundsäng");
});

test("inget akvarium eller terrarium under en hundvara", () => {
  const all = [
    mkFull("jag", ["ALL", "husdjur"], { name: "Hundgrind utan borrning 76–107 cm", priceNum: 499 }),
    mkFull("grind", ["ALL", "husdjur"], { name: "Hundgrind 72–107 cm, klämmontage", priceNum: 449 }),
    mkFull("terrarium", ["ALL", "husdjur"], { name: "Glasterrarium med frontlucka", priceNum: 499, pop: 999 }),
    mkFull("akvarium", ["ALL", "husdjur"], { name: "Nanoakvarium 36 liter med LED", priceNum: 499, pop: 999 }),
    mkFull("trappa", ["ALL", "husdjur"], { name: "Husdjurstrappa 3 steg", priceNum: 449 }),
    ...fyllnad(),
  ];
  const slugs = pickRelated(all[0], all, 4).map((r) => r.slug);
  assert.deepEqual(slugs.sort(), ["grind", "trappa"]);
});

test("samma vara i en annan färg: en plats, inte fyra", () => {
  const all = [
    mkFull("jag", ["ALL", "vardagsrum"], { name: "Fåtölj sammet", priceNum: 1999 }),
    mkFull("gra", ["ALL", "vardagsrum"], { name: "Fåtölj sammet grå", priceNum: 1999 }),
    mkFull("gron", ["ALL", "vardagsrum"], { name: "Fåtölj sammet grön", priceNum: 1999 }),
    mkFull("rosa", ["ALL", "vardagsrum"], { name: "Fåtölj sammet rosa", priceNum: 1999 }),
    mkFull("pall", ["ALL", "vardagsrum"], { name: "Pall sammet", priceNum: 1499 }),
    mkFull("soffbord", ["ALL", "vardagsrum"], { name: "Soffbord valnöt", priceNum: 1499 }),
    mkFull("lampa", ["ALL", "vardagsrum"], { name: "Golvlampa bågformad", priceNum: 1499 }),
    ...fyllnad(),
  ];
  const rel = pickRelated(all[0], all, 4);
  assert.equal(rel.length, 4);
  assert.equal(rel.filter((r) => ["gra", "gron", "rosa"].includes(r.slug)).length, 1, "bara EN färgvariant");
});

test("färgvarianterna fyller listan när inget annat finns", () => {
  const all = [
    mkFull("jag", ["ALL", "vardagsrum"], { name: "Fåtölj sammet", priceNum: 1999 }),
    mkFull("gra", ["ALL", "vardagsrum"], { name: "Fåtölj sammet grå", priceNum: 1999 }),
    mkFull("gron", ["ALL", "vardagsrum"], { name: "Fåtölj sammet grön", priceNum: 1999 }),
    mkFull("rosa", ["ALL", "vardagsrum"], { name: "Fåtölj sammet rosa", priceNum: 1999 }),
    ...fyllnad(),
  ];
  assert.equal(pickRelated(all[0], all, 4).length, 3, "hellre en färgvariant till än ett tomt förslag");
});

test("en vara som står två gånger i katalogen föreslås en gång", () => {
  const kompost = mkFull("kompost-2", ["ALL", "tradgard"], { name: "Kompostbehållare termo, 2 kammare", priceNum: 999 });
  const all = [
    mkFull("jag", ["ALL", "tradgard"], { name: "Kompostbehållare 300 liter", priceNum: 899 }),
    kompost,
    { ...kompost },
    mkFull("knapall", ["ALL", "tradgard"], { name: "Knäpall hopfällbar", priceNum: 799 }),
    ...fyllnad(),
  ];
  assert.deepEqual(pickRelated(all[0], all, 4).map((r) => r.slug), ["kompost-2", "knapall"]);
});

test("två nästan likadana förslag trängs inte", () => {
  // Stolarna är samma modell i två storlekar. Efter den ena går nästa plats
  // till skrivbordet, inte till den andra storleken.
  const all = [
    mkFull("jag", ["ALL", "kontor"], { name: "Kontorsstol ergonomisk nackstöd", priceNum: 1499 }),
    mkFull("stol-m", ["ALL", "kontor"], { name: "Kontorsstol mesh fotstöd", priceNum: 1499 }),
    mkFull("stol-xl", ["ALL", "kontor"], { name: "Kontorsstol mesh fotstöd XL", priceNum: 1499 }),
    mkFull("skrivbord", ["ALL", "kontor"], { name: "Skrivbord höj- och sänkbart", priceNum: 1499 }),
    ...fyllnad(),
  ];
  assert.deepEqual(pickRelated(all[0], all, 2).map((r) => r.slug), ["stol-m", "skrivbord"]);
});

test("finns fyra av samma sort får de alla fyra platserna", () => {
  // En tvingad sista plats för "något annat" togs bort 2026-10-08: den valde
  // utan att veta vad som hör ihop (en rumsavdelare under en knästol).
  const all = [
    mkFull("jag", ["ALL", "jul"], { name: "Plastgran 180 cm", priceNum: 799 }),
    mkFull("gran-1", ["ALL", "jul"], { name: "Plastgran snöad 150 cm", priceNum: 799 }),
    mkFull("gran-2", ["ALL", "jul"], { name: "Plastgran smal 210 cm", priceNum: 899 }),
    mkFull("gran-3", ["ALL", "jul"], { name: "Plastgran med kottar 120 cm", priceNum: 699 }),
    mkFull("gran-4", ["ALL", "jul"], { name: "Plastgran med belysning 180 cm", priceNum: 999 }),
    // Ett tillbehör i en helt annan prisklass, ur samma kategori.
    mkFull("krage", ["ALL", "jul"], { name: "Julgranskrage flätad", priceNum: 79 }),
    ...fyllnad(),
  ];
  const rel = pickRelated(all[0], all, 4).map((r) => r.slug);
  assert.deepEqual([...rel].sort(), ["gran-1", "gran-2", "gran-3", "gran-4"]);
});

// ── Likhetsdatan byggs en gång per katalog ───────────────────────────────────

test("likhetsdata – samma katalog ger samma data, en ändrad katalog ny", () => {
  const all = [mkFull("a", ["ALL", "k"], { name: "Kompostbehållare 300 liter" }), ...fyllnad()];
  const d1 = likhetsdata(all);
  assert.equal(likhetsdata(all), d1, "samma katalog ska inte byggas om");
  assert.equal(likhetsdata(all.map((p) => ({ ...p }))), d1, "en ny array med samma innehåll är samma katalog");
  const omdopt = all.map((p) => (p.slug === "a" ? { ...p, name: "Komposttunna 300 liter" } : p));
  const d2 = likhetsdata(omdopt);
  assert.notEqual(d2, d1, "ett nytt namn ska bygga om");
  assert.ok(d2.vektorer.get("a")!.has("tunn"), "den nya vektorn ska bära det nya namnet");
});

// getProducts() lämnar samma lista vid varje rendering på en varm instans.
// Den ska kännas igen utan att katalogen läses igen.
test("likhetsdata – samma lista läses inte om", () => {
  const all = fyllnad();
  const d1 = likhetsdata(all);
  let lasningar = 0;
  for (const p of all) {
    const namn = p.name;
    Object.defineProperty(p, "name", { get() { lasningar++; return namn; }, configurable: true });
  }
  assert.equal(likhetsdata(all), d1);
  assert.equal(lasningar, 0, "samma lista ska kännas igen utan att läsas");
});

// Wix kategori-id är alla 36 tecken långa. Ett fingeravtryck på längden hade
// inte märkt att en produkt flyttats från en kategori till en annan.
test("likhetsdata – en produkt som byter kategori bygger om", () => {
  const all = [mkFull("a", ["ALL", "kat-1"], { name: "Kompostbehållare 300 liter" }), ...fyllnad()];
  const d1 = likhetsdata(all);
  assert.equal(likhetsdata(all), d1);
  const flyttad = all.map((p) => (p.slug === "a" ? { ...p, collectionIds: ["ALL", "kat-2"] } : p));
  const d2 = likhetsdata(flyttad);
  assert.notEqual(d2, d1, "en ny kategori ska bygga om");
  assert.ok(d2.kategorivikt.has("kat-2") && !d2.kategorivikt.has("kat-1"));
});

test("en produkt som saknas i katalogen räknas fram när den behövs", () => {
  const all = [
    mkFull("knapall", ["ALL", "tradgard"], { name: "Knäpall hopfällbar", priceNum: 799, pop: 999 }),
    mkFull("kompost-2", ["ALL", "tradgard"], { name: "Kompostbehållare termo, 2 kammare", priceNum: 999 }),
    ...fyllnad(),
  ];
  const ny = mkFull("ny", ["ALL", "tradgard"], { name: "Kompostbehållare 300 liter", priceNum: 899 });
  assert.equal(pickRelated(ny, all, 2)[0].slug, "kompost-2");
});
