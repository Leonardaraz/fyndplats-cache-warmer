// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Säkerställer att per-variant-priset hämtas rätt ur V3-shapen (variantsInfo +
// options[0]): varje val får SITT variantpris/-id (inte baspriset), i katalog-
// ordning, med svensk formatering. Detta är fixen för "samma pris oavsett variant".

import { test } from "node:test";
import assert from "node:assert/strict";
import { v3VariantData, v3MultiVariantData, formatSek } from "./variant-price.ts";

// Förenklad spegling av den riktiga V3-produktens shape (ultraljudsrengöraren).
// VAL keyas på `choiceId` (inte `id`) — samma id varianternas optionChoiceIds.choiceId
// pekar på. Fixturen speglar produktionsdatan så testet låser id/choiceId-regressionen
// även för single-axel-vägen (den buggen sänkte variantbilderna på t.ex. paviljongen).
const product = {
  options: [
    {
      name: "Storlek",
      choicesSettings: {
        choices: [
          { choiceId: "c1", name: "2 L" },
          { choiceId: "c2", name: "15 L", linkedMedia: [{ image: { url: "https://x/15l.jpg" } }] },
          { choiceId: "c3", name: "30 L" },
        ],
      },
    },
  ],
  variantsInfo: {
    variants: [
      { id: "v1", choices: [{ optionChoiceIds: { optionId: "o1", choiceId: "c1" } }], price: { actualPrice: { amount: "899.9" } }, inventoryStatus: { inStock: true } },
      { id: "v2", choices: [{ optionChoiceIds: { optionId: "o1", choiceId: "c2" } }], price: { actualPrice: { amount: "2834.9" }, compareAtPrice: { amount: "3299" } }, inventoryStatus: { inStock: false } },
      { id: "v3", choices: [{ optionChoiceIds: { optionId: "o1", choiceId: "c3" } }], price: { actualPrice: { amount: "5649.9" } } }, // saknar inventoryStatus → default i lager
    ],
  },
};

test("v3VariantData kopplar varje val till SITT variantpris/-id, i katalogordning", () => {
  const r = v3VariantData(product);
  assert.ok(r);
  assert.equal(r.optionName, "Storlek");
  assert.deepEqual(r.choices.map((c) => c.label), ["2 L", "15 L", "30 L"]);
  assert.deepEqual(r.choices.map((c) => c.priceNum), [899.9, 2834.9, 5649.9]);
  assert.deepEqual(r.choices.map((c) => c.variantId), ["v1", "v2", "v3"]);
  // 15 L bär sin linkedMedia-bild
  assert.match(r.choices[1].image, /15l\.jpg/);
  // priser formaterade till svenska kr
  for (const c of r.choices) assert.match(c.price, /kr/);
  // rabatt (compareAtPrice > actual) ger originalPrice; annars tomt
  assert.match(r.choices[1].originalPrice, /kr/);
  assert.equal(r.choices[0].originalPrice, "");
});

test("inStock mappas per variant (explicit false = slut; saknat fält = i lager)", () => {
  const r = v3VariantData(product);
  assert.ok(r);
  assert.deepEqual(r.choices.map((c) => c.inStock), [true, false, true]);
});

test("fler-options-produkt hoppas över (null) — single-option-antagande", () => {
  const multi = { ...product, options: [product.options[0], { name: "Färg", choicesSettings: { choices: [] } }] };
  assert.equal(v3VariantData(multi), null);
});

test("inga varianter / tomt → null (fail-open)", () => {
  assert.equal(v3VariantData({ options: product.options, variantsInfo: { variants: [] } }), null);
  assert.equal(v3VariantData({}), null);
  assert.equal(v3VariantData(null), null);
});

test("formatSek ger svenskt valutaformat", () => {
  assert.match(formatSek(1082.9), /1.?082,90.?kr/);
});

// Multi-axel (Färg × Storlek): bygg axlar + variant-tabell ur V3.
// OBS: i det riktiga V3-svaret keyas VAL på `choiceId` (inte `id`) — det är samma
// id som varianternas optionChoiceIds.choiceId pekar på. Fixturen speglar därför
// `choiceId` så testet matchar produktionsdatan (regression-lås för id/choiceId-buggen
// som tappade sekundära axlar, t.ex. "Typ" på skjutdörren). OPTIONER har dock `id`.
const multiProduct = {
  options: [
    { id: "oF", name: "Färg", choicesSettings: { choices: [
      { choiceId: "fR", name: "Röd", linkedMedia: [{ image: { url: "red.jpg" } }] },
      { choiceId: "fB", name: "Blå", linkedMedia: [{ image: { url: "blue.jpg" } }] },
    ] } },
    { id: "oS", name: "Storlek", choicesSettings: { choices: [
      { choiceId: "sS", name: "S" },
      { choiceId: "sM", name: "M" },
    ] } },
  ],
  variantsInfo: { variants: [
    { id: "v-rs", choices: [{ optionChoiceIds: { optionId: "oF", choiceId: "fR" } }, { optionChoiceIds: { optionId: "oS", choiceId: "sS" } }], price: { actualPrice: { amount: "199" } }, inventoryStatus: { inStock: true } },
    { id: "v-rm", choices: [{ optionChoiceIds: { optionId: "oF", choiceId: "fR" } }, { optionChoiceIds: { optionId: "oS", choiceId: "sM" } }], price: { actualPrice: { amount: "209" } }, inventoryStatus: { inStock: false } },
    { id: "v-bs", choices: [{ optionChoiceIds: { optionId: "oF", choiceId: "fB" } }, { optionChoiceIds: { optionId: "oS", choiceId: "sS" } }], price: { actualPrice: { amount: "219" } }, inventoryStatus: { inStock: true } },
  ] },
};

test("v3MultiVariantData bygger båda axlarna + variant-tabell med rätt pris/lager/bild", () => {
  const r = v3MultiVariantData(multiProduct);
  assert.ok(r);
  assert.deepEqual(r.axes.map((a) => a.name), ["Färg", "Storlek"]);
  assert.deepEqual(r.axes[0].choices.map((c) => c.label), ["Röd", "Blå"]);
  assert.equal(r.axes[0].choices[0].image, "red.jpg"); // färg-valet bär linkedMedia
  assert.equal(r.axes[1].choices[0].image, ""); // storlek saknar bild
  assert.equal(r.table.length, 3);
  const rm = r.table.find((t) => t.variantId === "v-rm");
  assert.deepEqual(rm.choices, { Färg: "Röd", Storlek: "M" });
  assert.equal(rm.priceNum, 209);
  assert.equal(rm.inStock, false); // slut-kombination
  assert.equal(rm.image, "red.jpg"); // ärver färgens bild
});

test("v3MultiVariantData returnerar null för single-axel (hanteras av v3VariantData)", () => {
  assert.equal(v3MultiVariantData(product), null);
  assert.equal(v3MultiVariantData({ options: [], variantsInfo: { variants: [] } }), null);
});

// Förvaringskistan 2026-08-08: Storlek-axeln låg FÖRST och dess länkade
// storlekskort ("100 cm bred") blev kombinationens bild — kunden valde
// "Mörk Khaki" men såg den vita kistan. Färgen ska äga variantbilden;
// andra axlars bilder är bara fallback när ingen färgbild finns.
const chestProduct = {
  options: [
    { id: "oS", name: "Storlek", choicesSettings: { choices: [
      { choiceId: "sM", name: "M", linkedMedia: [{ image: { url: "card-80cm.jpg" } }] },
      { choiceId: "sL", name: "L", linkedMedia: [{ image: { url: "card-100cm.jpg" } }] },
    ] } },
    { id: "oF", name: "Färg", choicesSettings: { choices: [
      { choiceId: "fK", name: "Mörk Khaki", linkedMedia: [{ image: { url: "khaki.jpg" } }] },
      { choiceId: "fV", name: "Vit", linkedMedia: [{ image: { url: "white.jpg" } }] },
    ] } },
  ],
  variantsInfo: { variants: [
    { id: "v-lk", choices: [{ optionChoiceIds: { optionId: "oS", choiceId: "sL" } }, { optionChoiceIds: { optionId: "oF", choiceId: "fK" } }], price: { actualPrice: { amount: "1459" } } },
    { id: "v-lv", choices: [{ optionChoiceIds: { optionId: "oS", choiceId: "sL" } }, { optionChoiceIds: { optionId: "oF", choiceId: "fV" } }], price: { actualPrice: { amount: "1459" } } },
  ] },
};

test("färgens bild vinner över tidigare axels bild (förvaringskistan: Storlek × Färg)", () => {
  const r = v3MultiVariantData(chestProduct);
  assert.ok(r);
  const lk = r.table.find((t) => t.variantId === "v-lk");
  assert.equal(lk.image, "khaki.jpg"); // INTE card-100cm.jpg (storlekskortet)
  const lv = r.table.find((t) => t.variantId === "v-lv");
  assert.equal(lv.image, "white.jpg");
});

test("utan färg-axel gäller första-bild-fallbacken (Längd × Typ-produkter)", () => {
  const noColor = {
    options: [
      { id: "oL", name: "Längd", choicesSettings: { choices: [
        { choiceId: "l1", name: "2 m", linkedMedia: [{ image: { url: "2m.jpg" } }] },
      ] } },
      { id: "oT", name: "Typ", choicesSettings: { choices: [
        { choiceId: "t1", name: "Enkel" },
        { choiceId: "t2", name: "Dubbel" },
      ] } },
    ],
    variantsInfo: { variants: [
      { id: "v1", choices: [{ optionChoiceIds: { optionId: "oL", choiceId: "l1" } }, { optionChoiceIds: { optionId: "oT", choiceId: "t1" } }], price: { actualPrice: { amount: "500" } } },
      { id: "v2", choices: [{ optionChoiceIds: { optionId: "oL", choiceId: "l1" } }, { optionChoiceIds: { optionId: "oT", choiceId: "t2" } }], price: { actualPrice: { amount: "600" } } },
    ] },
  };
  const r = v3MultiVariantData(noColor);
  assert.ok(r);
  assert.equal(r.table[0].image, "2m.jpg");
});
