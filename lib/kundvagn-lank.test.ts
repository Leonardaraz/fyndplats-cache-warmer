// lib/kundvagn-lank.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar länken från en rad i varukorgen till produktsidan, och att
// normaliseraKundvagn bär v2:s adress hela vägen dit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { arSammaSida, produktLankForRad, variantForRad } from "./kundvagn-lank.ts";
import { normaliseraKundvagn } from "./cart-shape.ts";

test("Wix produktsida blir butikens /produkt/<slug>", () => {
  assert.equal(
    produktLankForRad({ url: { relativePath: "/product-page/gungbank-2-sits-for-tradgard" } }),
    "/produkt/gungbank-2-sits-for-tradgard",
  );
  assert.equal(produktLankForRad({ url: { relativePath: "/product-page/stol/" } }), "/produkt/stol");
});

test("full adress används när relativePath saknas", () => {
  assert.equal(produktLankForRad({ url: { url: "https://www.fyndplats.se/product-page/stol?x=1" } }), "/produkt/stol");
});

test("v2-raden bär attributes.url genom normaliseraKundvagn", () => {
  const k = normaliseraKundvagn({
    cart: {
      lineItems: [
        {
          _id: "rad-1",
          name: { original: "Stol" },
          source: { catalogReference: { catalogItemId: "prod-1", appId: "stores" } },
          attributes: { url: { relativePath: "/product-page/stol", url: "https://x.se/product-page/stol" } },
        },
      ],
    },
  })!;
  assert.equal(produktLankForRad(k.lineItems[0]), "/produkt/stol");
});

test("utan Wix adress används förslagsanropets slug för radens produkt", () => {
  const rad = { catalogReference: { catalogItemId: "prod-1" } };
  assert.equal(produktLankForRad(rad, { "prod-1": "stol-svart" }), "/produkt/stol-svart");
  assert.equal(produktLankForRad(rad, { "prod-2": "annan" }), null);
  assert.equal(produktLankForRad(rad, { "prod-1": "a/b" }), null);
  assert.equal(produktLankForRad(rad, null), null);
});

test("Wix adress vinner över reserven", () => {
  const rad = { url: { relativePath: "/product-page/ratt" }, catalogReference: { catalogItemId: "prod-1" } };
  assert.equal(produktLankForRad(rad, { "prod-1": "gammal" }), "/produkt/ratt");
});

test("okänd form eller saknad adress ger ingen länk", () => {
  assert.equal(produktLankForRad({ url: { relativePath: "/booking/abc" } }), null);
  assert.equal(produktLankForRad({ url: { relativePath: "/product-page/" } }), null);
  assert.equal(produktLankForRad({ url: { relativePath: "/product-page/a/b" } }), null);
  assert.equal(produktLankForRad({ url: { url: "inte en adress" } }), null);
  assert.equal(produktLankForRad({ url: {} }), null);
  assert.equal(produktLankForRad({}), null);
  assert.equal(produktLankForRad(null), null);
});

const V2 = "3f2a9c1e-1111-4a2b-9c3d-123456789abc";

test("valt alternativ följer med som ?variant=", () => {
  const rad = {
    url: { relativePath: "/product-page/stol" },
    catalogReference: { catalogItemId: "prod-1", options: { variantId: V2 } },
  };
  assert.equal(produktLankForRad(rad), `/produkt/stol?variant=${V2}`);
  assert.equal(
    produktLankForRad({ catalogReference: { catalogItemId: "prod-1", options: { variantId: V2 } } }, { "prod-1": "stol" }),
    `/produkt/stol?variant=${V2}`,
  );
});

test("vara utan alternativ (nollornas id) får ingen parameter", () => {
  const rad = {
    url: { relativePath: "/product-page/stol" },
    catalogReference: { catalogItemId: "prod-1", options: { variantId: "00000000-0000-0000-0000-000000000000" } },
  };
  assert.equal(produktLankForRad(rad), "/produkt/stol");
  assert.equal(variantForRad({ catalogReference: { options: { variantId: "inte-ett-id" } } }), null);
  assert.equal(variantForRad({ catalogReference: { options: "x" } }), null);
});

test("v2-raden bär alternativet genom normaliseraKundvagn", () => {
  const k = normaliseraKundvagn({
    cart: {
      lineItems: [
        {
          _id: "rad-1",
          source: { catalogReference: { catalogItemId: "prod-1", appId: "stores", options: { variantId: V2 } } },
          attributes: { url: { relativePath: "/product-page/stol" } },
        },
      ],
    },
  })!;
  assert.equal(produktLankForRad(k.lineItems[0]), `/produkt/stol?variant=${V2}`);
});

test("samma sida och samma alternativ känns igen", () => {
  assert.equal(arSammaSida("/produkt/stol", { pathname: "/produkt/stol", search: "" }), true);
  assert.equal(arSammaSida(`/produkt/stol?variant=${V2}`, { pathname: "/produkt/stol", search: `?variant=${V2}` }), true);
  assert.equal(arSammaSida(`/produkt/stol?variant=${V2}`, { pathname: "/produkt/stol", search: "" }), false);
  assert.equal(arSammaSida("/produkt/stol", { pathname: "/produkt/stol", search: `?variant=${V2}` }), false);
  assert.equal(arSammaSida("/produkt/stol", { pathname: "/produkt/bord", search: "" }), false);
});
