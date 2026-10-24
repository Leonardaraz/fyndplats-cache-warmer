// Run: node --test --experimental-strip-types lib/variant-kopplingar.test.ts
//
// En bild kopplad till både en färg och en storlek visas bara för den
// kombinationen (lib/variant-bilder.ts, Kopplingar), och kombinationens första
// bild är den bilden (lib/variant-price.ts, v3MultiVariantData). Fixturen är
// bokhyllan i trädform (Leonard 2026-10-23: lilla och stora hyllan syntes
// under båda höjderna och båda färgerna).
import test from "node:test";
import assert from "node:assert/strict";
import {
  agareMedAltText,
  kopplingarPerOption,
  medAgareUrAltText,
  synligaBilder,
  synligaBilderForKombination,
} from "./variant-bilder.ts";
import { v3MultiVariantData } from "./variant-price.ts";

const u = (id: string) => `https://static.wixstatic.com/media/${id}~mv2.jpg`;
const k = (id: string) => `${id}~mv2.jpg`;

const BRUN = "Rustik brun och svart";
// Galleriet i sidans ordning. b109/b136 = bruna packshots, v109/v136 = vita,
// bhorn = brun i hörn (109), narbild och fot = bruna närbilder utan höjd,
// vmiljo1–3 = vita miljöbilder (109), kort109/kort136 = måttkort.
const GALLERI = ["b109", "vmiljo1", "bhorn", "narbild", "fot", "b136", "v109", "v136", "vmiljo2", "vmiljo3", "kort109", "kort136"].map(u);

// Efter omlänkningen: varje bild kopplad till det den visar.
const OPTIONER = [
  [
    { etikett: "109 cm", bilder: ["b109", "bhorn", "v109", "vmiljo1", "vmiljo2", "vmiljo3", "kort109"].map(u) },
    { etikett: "136 cm", bilder: ["b136", "v136", "kort136"].map(u) },
  ],
  [
    { etikett: BRUN, bilder: ["b109", "bhorn", "narbild", "fot", "b136"].map(u) },
    { etikett: "Vit", bilder: ["v109", "vmiljo1", "v136", "vmiljo2", "vmiljo3"].map(u) },
  ],
];

test("kopplingarPerOption: en lista per option som kopplar bilden", () => {
  const kk = kopplingarPerOption(OPTIONER);
  assert.deepEqual(kk[k("b136")], [["136 cm"], [BRUN]]);
  assert.deepEqual(kk[k("narbild")], [[BRUN]]);
  assert.deepEqual(kk[k("kort109")], [["109 cm"]]);
  assert.equal(kk[k("okand")], undefined);
});

test("kopplingarPerOption: två val i samma option blir en lista", () => {
  const kk = kopplingarPerOption([[
    { etikett: "50 × 70 cm", bilder: [u("miljo")] },
    { etikett: "60 × 90 cm", bilder: [u("miljo")] },
    { etikett: "50 × 110 cm", bilder: [u("smal")] },
  ]]);
  assert.deepEqual(kk[k("miljo")], [["50 × 70 cm", "60 × 90 cm"]]);
});

test("bokhyllan: varje kombination visar sin hylla och aldrig den andra höjden", () => {
  const kk = kopplingarPerOption(OPTIONER);
  const vy = (farg: string, hojd: string, forst?: string) =>
    synligaBilderForKombination(GALLERI, kk, [hojd, farg], forst && u(forst));
  assert.deepEqual(vy(BRUN, "109 cm", "b109"), ["b109", "bhorn", "narbild", "fot", "kort109"].map(u));
  assert.deepEqual(vy(BRUN, "136 cm", "b136"), ["b136", "narbild", "fot", "kort136"].map(u));
  assert.deepEqual(vy("Vit", "109 cm", "v109"), ["v109", "vmiljo1", "vmiljo2", "vmiljo3", "kort109"].map(u));
  assert.deepEqual(vy("Vit", "136 cm", "v136"), ["v136", "kort136"].map(u));
});

test("inom en option räcker ett av valen", () => {
  const bilder = ["smal", "miljo", "kort"].map(u);
  const kk = kopplingarPerOption([[
    { etikett: "50 × 70 cm", bilder: [u("miljo")] },
    { etikett: "60 × 90 cm", bilder: [u("miljo")] },
    { etikett: "50 × 110 cm", bilder: [u("smal")] },
  ]]);
  assert.deepEqual(synligaBilderForKombination(bilder, kk, ["60 × 90 cm"]), ["miljo", "kort"].map(u));
  assert.deepEqual(synligaBilderForKombination(bilder, kk, ["50 × 110 cm"]), ["smal", "kort"].map(u));
});

test("samma reserv som förut: ingen kopplad bild för valet → hela galleriet", () => {
  const kk = kopplingarPerOption([[{ etikett: "Blå", bilder: [u("bla")] }]]);
  const bilder = ["bla", "kort"].map(u);
  assert.deepEqual(synligaBilderForKombination(bilder, kk, ["Grön"]), bilder);
  assert.deepEqual(synligaBilderForKombination(bilder, undefined, ["Blå"]), bilder);
  assert.deepEqual(synligaBilderForKombination(bilder, kk, []), bilder);
});

// Sidor där varje bild har högst en koppling ska se ut precis som förut.
const ELBIL = ["svart1", "svart2", "gra1", "rod1", "gra2", "rod2", "kort"].map(u);
const ALTS: Record<string, string> = {
  [k("svart2")]: "Pojke kör den svarta elbilen",
  [k("gra2")]: "Måttskiss på den grå elbilen",
  [k("rod2")]: "Måttskiss på den röda elbilen",
  [k("kort")]: "Fyndplats färgkort i svart, grått och rött",
};

test("en koppling per bild: samma galleri som synligaBilder för varje val", () => {
  const optioner = [[
    { etikett: "Svart", bilder: [u("svart1")] },
    { etikett: "Grå", bilder: [u("gra1")] },
    { etikett: "Röd", bilder: [u("rod1")] },
  ]];
  const agare = agareMedAltText({
    lankade: { [k("svart1")]: "Svart", [k("gra1")]: "Grå", [k("rod1")]: "Röd" },
    alts: ALTS, bilder: ELBIL, fargEtiketter: ["Svart", "Grå", "Röd"],
  });
  const kk = medAgareUrAltText(kopplingarPerOption(optioner), agare);
  for (const val of ["Svart", "Grå", "Röd", "Blå"]) {
    for (const forst of [undefined, ...ELBIL]) {
      assert.deepEqual(
        synligaBilderForKombination(ELBIL, kk, [val], forst),
        synligaBilder(ELBIL, agare, [val], forst),
        `${val} / ${forst}`,
      );
    }
  }
});

test("en koppling per bild på en sida med två optioner: samma galleri som förut", () => {
  // Kattrappan före omlänkningen: färgens bilder på färgen, korten på storleken.
  const optioner = [
    [{ etikett: "Grå", bilder: ["g1", "g2"].map(u) }, { etikett: "Vit", bilder: ["v1"].map(u) }],
    [{ etikett: "60 × 40 cm", bilder: [u("k60")] }, { etikett: "45 × 40 cm", bilder: [u("k45")] }],
  ];
  const bilder = ["g1", "g2", "v1", "k60", "k45", "gemensam"].map(u);
  const agare: Record<string, string> = { [k("g1")]: "Grå", [k("g2")]: "Grå", [k("v1")]: "Vit", [k("k60")]: "60 × 40 cm", [k("k45")]: "45 × 40 cm" };
  const kk = kopplingarPerOption(optioner);
  for (const farg of ["Grå", "Vit"]) {
    for (const storlek of ["60 × 40 cm", "45 × 40 cm"]) {
      assert.deepEqual(
        synligaBilderForKombination(bilder, kk, [farg, storlek]),
        synligaBilder(bilder, agare, [farg, storlek]),
      );
    }
  }
});

test("medAgareUrAltText: alt-textens ägare bara för okopplade bilder", () => {
  const kk = kopplingarPerOption([[{ etikett: "Grå", bilder: [u("a")] }]]);
  const ut = medAgareUrAltText(kk, { [k("a")]: "Svart", [k("b")]: "Svart" });
  assert.deepEqual(ut[k("a")], [["Grå"]]);
  assert.deepEqual(ut[k("b")], [["Svart"]]);
});

// ── variantens bild ─────────────────────────────────────────────────────────

const valV3 = (choiceId: string, name: string, bilder: string[]) => ({
  choiceId, name, linkedMedia: bilder.map((b) => ({ image: { url: u(b) } })),
});
const variant = (id: string, hojd: string, farg: string) => ({
  id,
  choices: [
    { optionChoiceIds: { optionId: "hojd", choiceId: hojd } },
    { optionChoiceIds: { optionId: "farg", choiceId: farg } },
  ],
  price: { actualPrice: { amount: "1000" } },
});

const bokhylla = (fargBilder: { brun: string[]; vit: string[] }, hojdBilder: { h109: string[]; h136: string[] }) => ({
  options: [
    { id: "hojd", name: "Storlek", choicesSettings: { choices: [valV3("h109", "109 cm", hojdBilder.h109), valV3("h136", "136 cm", hojdBilder.h136)] } },
    { id: "farg", name: "Färg", choicesSettings: { choices: [valV3("brun", BRUN, fargBilder.brun), valV3("vit", "Vit", fargBilder.vit)] } },
  ],
  variantsInfo: { variants: [variant("b109", "h109", "brun"), variant("b136", "h136", "brun"), variant("v109", "h109", "vit"), variant("v136", "h136", "vit")] },
});

test("variantens bild: bilden kopplad till både färgen och höjden", () => {
  const d = v3MultiVariantData(bokhylla(
    { brun: ["b109", "bhorn", "narbild", "fot", "b136"], vit: ["v109", "vmiljo1", "v136", "vmiljo2", "vmiljo3"] },
    { h109: ["b109", "bhorn", "v109", "vmiljo1", "vmiljo2", "vmiljo3", "kort109"], h136: ["b136", "v136", "kort136"] },
  ))!;
  const bild = Object.fromEntries(d.table.map((t) => [t.variantId, t.image]));
  assert.equal(bild.b109, u("b109"));
  assert.equal(bild.b136, u("b136"));
  assert.equal(bild.v109, u("v109"));
  assert.equal(bild.v136, u("v136"));
});

test("variantens bild: utan kopplingar i två optioner gäller färgens första som förut", () => {
  // Bokhyllan före omlänkningen: färgerna bär fotona, storlekarna korten.
  const d = v3MultiVariantData(bokhylla(
    { brun: ["b109", "bhorn", "narbild", "fot", "b136"], vit: ["v109", "vmiljo1", "v136", "vmiljo2", "vmiljo3"] },
    { h109: ["kort109"], h136: ["kort136"] },
  ))!;
  const bild = Object.fromEntries(d.table.map((t) => [t.variantId, t.image]));
  assert.equal(bild.b109, u("b109"));
  assert.equal(bild.b136, u("b109"));
  assert.equal(bild.v109, u("v109"));
  assert.equal(bild.v136, u("v109"));
});

test("variantens bild: en bild kopplad till en annan storlek väljs aldrig", () => {
  // Färgens första bild visar 109 cm och är kopplad dit; 136 cm har ingen egen
  // bild i färgen. Då blir det färgens första bild som passar (närbilden).
  const d = v3MultiVariantData(bokhylla(
    { brun: ["b109", "narbild"], vit: ["v109"] },
    { h109: ["b109", "v109"], h136: [] },
  ))!;
  const bild = Object.fromEntries(d.table.map((t) => [t.variantId, t.image]));
  assert.equal(bild.b109, u("b109"));
  assert.equal(bild.b136, u("narbild"));
  // Inget passar: Vit 136 har bara en bild som är kopplad till 109 cm. Då gäller
  // färgens första som förut, hellre än ingen bild.
  assert.equal(bild.v136, u("v109"));
});
