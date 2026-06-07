// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Säkerställer att per-variant-priset hämtas rätt ur V3-shapen (variantsInfo +
// options[0]): varje val får SITT variantpris/-id (inte baspriset), i katalog-
// ordning, med svensk formatering. Detta är fixen för "samma pris oavsett variant".

import { test } from "node:test";
import assert from "node:assert/strict";
import { v3VariantData, formatSek } from "./variant-price.ts";

// Förenklad spegling av den riktiga V3-produktens shape (ultraljudsrengöraren).
const product = {
  options: [
    {
      name: "Storlek",
      choicesSettings: {
        choices: [
          { id: "c1", name: "2 L" },
          { id: "c2", name: "15 L", linkedMedia: [{ image: { url: "https://x/15l.jpg" } }] },
          { id: "c3", name: "30 L" },
        ],
      },
    },
  ],
  variantsInfo: {
    variants: [
      { id: "v1", choices: [{ optionChoiceIds: { optionId: "o1", choiceId: "c1" } }], price: { actualPrice: { amount: "899.9" } } },
      { id: "v2", choices: [{ optionChoiceIds: { optionId: "o1", choiceId: "c2" } }], price: { actualPrice: { amount: "2834.9" }, compareAtPrice: { amount: "3299" } } },
      { id: "v3", choices: [{ optionChoiceIds: { optionId: "o1", choiceId: "c3" } }], price: { actualPrice: { amount: "5649.9" } } },
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
