// Run: node --test --experimental-strip-types lib/variant-bilder.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { agareMedAltText, arKort, fargFormer, nammdaFarger, synligaBilder } from "./variant-bilder.ts";

const u = (id: string) => `https://static.wixstatic.com/media/${id}~mv2.jpg`;

// Elbilen Audi Q8 (2026-09-30): tio bilder, men varje färg länkad till en.
const BILDER = ["svart1", "svart2", "gra1", "rod1", "gra2", "rod2", "rod3", "svart3", "spec", "farger"].map(u);
const ALTS: Record<string, string> = {
  "svart1~mv2.jpg": "Svart elbil för barn, Audi Q8 e-tron Sportback, snett framifrån med tända LED-strålkastare mot vit bakgrund",
  "svart2~mv2.jpg": "Pojke med solglasögon kör den svarta Audi-elbilen på en grusgång framför blommande buskar",
  "gra1~mv2.jpg": "Grå elbil barn Audi Q8 e-tron Sportback med ett litet barn bakom ratten på en uppfart",
  "rod1~mv2.jpg": "Flicka i rosa tröja sitter i den röda elbilen för barn med tända strålkastare",
  "gra2~mv2.jpg": "Måttskiss på den grå elbilen: 98 cm lång, 49,5 cm bred och 43 cm hög",
  "rod2~mv2.jpg": "Måttskiss på den röda elbilen: 98 × 49,5 × 43 cm",
  "rod3~mv2.jpg": "Röd elbil för barn rakt framifrån med Audi-ringarna i grillen",
  "svart3~mv2.jpg": "Leende flicka som håller i ratten i den svarta elbilen för barn, utomhus på gräs.",
  "spec~mv2.jpg": "Fyndplats specifikationskort för elbil barn Audi Q8 e-tron Sportback: 98 × 49,5 × 43 cm",
  "farger~mv2.jpg": "Fyndplats färgkort som visar Audi-elbilen för barn i svart, grått och rött – tre olika exemplar.",
};
const LANKADE = { "svart1~mv2.jpg": "Svart", "gra1~mv2.jpg": "Grå", "rod1~mv2.jpg": "Röd" };
const FARGER = ["Svart", "Grå", "Röd"];

test("fargFormer böjer svenska färgord och vägrar flera ord", () => {
  assert.ok(fargFormer("Röd")!.includes("rött"));
  assert.ok(fargFormer("Grå")!.includes("grått"));
  assert.ok(fargFormer("Vit")!.includes("vitt"));
  assert.ok(fargFormer("Svart")!.includes("svarta"));
  assert.equal(fargFormer("Svart/vit"), null);
  assert.equal(fargFormer("110 cm"), null);
});

test("nammdaFarger: å/ä/ö räknas som bokstäver och bakgrunden räknas inte", () => {
  assert.deepEqual(nammdaFarger("Grå elbil mot vit bakgrund", ["Grå", "Vit"]), ["Grå"]);
  assert.deepEqual(nammdaFarger("Mörkgrå soffa", ["Grå", "Svart"]), []);
  assert.deepEqual(nammdaFarger("den röda bilen", ["Röd", "Vit"]), ["Röd"]);
});

test("agareMedAltText: varje färg får sina egna bilder, färgkortet är gemensamt", () => {
  const a = agareMedAltText({ lankade: LANKADE, alts: ALTS, bilder: BILDER, fargEtiketter: FARGER });
  assert.equal(a["svart2~mv2.jpg"], "Svart");
  assert.equal(a["svart3~mv2.jpg"], "Svart");
  assert.equal(a["gra2~mv2.jpg"], "Grå");
  assert.equal(a["rod2~mv2.jpg"], "Röd");
  assert.equal(a["rod3~mv2.jpg"], "Röd");
  assert.equal(a["spec~mv2.jpg"], undefined);
  assert.equal(a["farger~mv2.jpg"], undefined); // nämner alla tre
});

test("agareMedAltText: linkedMedia vinner över alt-texten", () => {
  const a = agareMedAltText({
    lankade: { "svart2~mv2.jpg": "Grå" }, alts: ALTS, bilder: BILDER, fargEtiketter: FARGER,
  });
  assert.equal(a["svart2~mv2.jpg"], "Grå");
});

test("agareMedAltText: en enda färg eller icke-färger ger inga gissningar", () => {
  assert.deepEqual(agareMedAltText({ lankade: {}, alts: ALTS, bilder: BILDER, fargEtiketter: ["Svart"] }), {});
  assert.deepEqual(agareMedAltText({ lankade: {}, alts: ALTS, bilder: BILDER, fargEtiketter: ["120 cm", "140 cm"] }), {});
});

test("synligaBilder: grått visar grå bilder + gemensamma, huvudbilden först", () => {
  const a = agareMedAltText({ lankade: LANKADE, alts: ALTS, bilder: BILDER, fargEtiketter: FARGER });
  const g = synligaBilder(BILDER, a, ["Grå"], u("gra1"));
  assert.deepEqual(g, ["gra1", "gra2", "spec", "farger"].map(u));
  const s = synligaBilder(BILDER, a, ["Svart"], u("svart1"));
  assert.deepEqual(s, ["svart1", "svart2", "svart3", "spec", "farger"].map(u));
});

test("synligaBilder: utan ägare för valet visas allt oförändrat", () => {
  assert.deepEqual(synligaBilder(BILDER, undefined, ["Grå"]), BILDER);
  assert.deepEqual(synligaBilder(BILDER, { "x~mv2.jpg": "Blå" }, ["Grå"]), BILDER);
  assert.deepEqual(synligaBilder(BILDER, LANKADE, []), BILDER);
});

// Matskåpet (2026-09-30): Vit är sidans egen färg med fyra foton, Grå och
// Svart kom från givare med en bild var. Skålbilderna nämner ingen färg.
const MB = ["vit1", "skalar", "horn", "matt", "gra1", "svart1", "kort"].map(u);
const MALTS: Record<string, string> = {
  "vit1~mv2.jpg": "Vitt matskåp för hund med två luckor",
  "skalar~mv2.jpg": "Två skålar i rostfritt stål med torrfoder",
  "horn~mv2.jpg": "Närbild på skåpets hörn och sockel mot trägolv",
  "matt~mv2.jpg": "Måttskiss: 60 × 30 × 35,5 cm",
  "gra1~mv2.jpg": "Matskåp för hund i färgen grå",
  "svart1~mv2.jpg": "Matskåp för hund i färgen svart",
  "kort~mv2.jpg": "Fyndplats specifikationskort för matskåpet",
};
const MLANK = { "vit1~mv2.jpg": "Vit", "gra1~mv2.jpg": "Grå", "svart1~mv2.jpg": "Svart" };

test("sammanslagen sida: olänkade foton hör till huvudbildens färg, korten är gemensamma", () => {
  const a = agareMedAltText({ lankade: MLANK, alts: MALTS, bilder: MB, fargEtiketter: ["Vit", "Grå", "Svart"], huvudbild: u("vit1") });
  assert.equal(a["skalar~mv2.jpg"], "Vit");
  assert.equal(a["horn~mv2.jpg"], "Vit");
  assert.equal(a["matt~mv2.jpg"], undefined); // måttskissen gäller alla färger
  assert.equal(a["kort~mv2.jpg"], undefined);
  assert.deepEqual(synligaBilder(MB, a, ["Svart"], u("svart1")), ["svart1", "matt", "kort"].map(u));
  assert.deepEqual(synligaBilder(MB, a, ["Vit"], u("vit1")), ["vit1", "skalar", "horn", "matt", "kort"].map(u));
});

test("sida där varje färg har flera länkade bilder: olänkade foton förblir gemensamma", () => {
  const lank = { ...MLANK, "skalar~mv2.jpg": "Grå", "horn~mv2.jpg": "Svart" };
  const alts = { ...MALTS, "matt~mv2.jpg": "Närbild på handtaget" };
  const a = agareMedAltText({ lankade: lank, alts, bilder: MB, fargEtiketter: ["Vit", "Grå", "Svart"], huvudbild: u("vit1") });
  assert.equal(a["matt~mv2.jpg"], undefined);
});

test("arKort känner igen Fyndplats egna kort", () => {
  assert.ok(arKort("Fyndplats färgkort som visar bilen i tre färger"));
  assert.ok(arKort("Specifikationskort för elbilen"));
  assert.ok(arKort("Måttskiss: 60 × 30 × 35,5 cm"));
  assert.ok(arKort("Måttritning av bänken sedd från sidan"));
  assert.ok(arKort("Bänken med måttbild i centimeter"));
  assert.ok(!arKort("Två skålar i rostfritt stål"));

test("huvudbild som ägs av ett storleksval flyttar inga bilder", () => {
  const a = agareMedAltText({
    lankade: { "vit1~mv2.jpg": "45 liter", "gra1~mv2.jpg": "Grå", "svart1~mv2.jpg": "Svart" },
    alts: MALTS, bilder: MB, fargEtiketter: ["Grå", "Svart"], huvudbild: u("vit1"),
  });
  assert.equal(a["skalar~mv2.jpg"], undefined);
});
});
