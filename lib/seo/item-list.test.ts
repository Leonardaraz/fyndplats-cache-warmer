// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { listsidansItemList } from "./item-list.ts";

const SITE = "https://www.fyndplats.se";
const produkter = [
  { name: "Testsoffa", slug: "testsoffa" },
  { name: "Testbord", slug: "testbord" },
];

test("varje rad är en länk med plats och namn", () => {
  const lista = listsidansItemList(SITE, "Möbler under 1000 kr", `${SITE}/under-1000-kr/mobler`, produkter) as {
    numberOfItems: number;
    itemListElement: Record<string, unknown>[];
  };
  assert.equal(lista.numberOfItems, 2);
  assert.deepEqual(lista.itemListElement[1], {
    "@type": "ListItem",
    position: 2,
    url: `${SITE}/produkt/testbord`,
    name: "Testbord",
  });
});

// Ett Product-objekt på en listsida blir ett eget objekt i Search Console, utan
// beskrivning, frakt, returvillkor och märke. Varudatan hör till produktsidan.
test("listan bär ingen varudata", () => {
  const json = JSON.stringify(listsidansItemList(SITE, "Lista", `${SITE}/lista`, produkter));
  for (const falt of ['"Product"', '"Offer"', '"offers"', '"price"', '"availability"']) {
    assert.ok(!json.includes(falt), `${falt} ska inte finnas i listsidans ItemList`);
  }
});
