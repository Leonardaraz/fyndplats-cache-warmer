// Påminnelselänkens del i webbläsaren (lib/kassa/aterta-korg.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { attLaggaI, korgensRader, tillKassan } from "./aterta-korg.ts";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";
const V1 = "33333333-3333-4333-8333-333333333333";
const V2 = "44444444-4444-4444-8444-444444444444";

test("en tom varukorg får alla korgens varor", () => {
  const onskat = [{ produktId: P1, antal: 2 }, { produktId: P2, variantId: V1, antal: 1 }];
  assert.deepEqual(attLaggaI(onskat, []), onskat);
});

test("det som redan ligger i varukorgen läggs inte i igen", () => {
  const onskat = [{ produktId: P1, antal: 2 }, { produktId: P2, variantId: V1, antal: 1 }];
  // Samma telefon, länken öppnad två gånger: ingenting saknas.
  assert.deepEqual(attLaggaI(onskat, [{ produktId: P1, antal: 2 }, { produktId: P2, variantId: V1, antal: 1 }]), []);
  // Fler i varukorgen än i mejlet: ingenting tas bort och ingenting läggs i.
  assert.deepEqual(attLaggaI(onskat, [{ produktId: P1, antal: 5 }, { produktId: P2, variantId: V1, antal: 3 }]), []);
  // En av två: bara den andra, och bara det som saknas.
  assert.deepEqual(attLaggaI(onskat, [{ produktId: P1, antal: 1 }]), [{ produktId: P1, antal: 1 }, { produktId: P2, variantId: V1, antal: 1 }]);
});

test("en annan variant av samma vara är en annan rad", () => {
  const onskat = [{ produktId: P2, variantId: V1, antal: 1 }];
  assert.deepEqual(attLaggaI(onskat, [{ produktId: P2, variantId: V2, antal: 1 }]), onskat);
  // Utan variant och med null betyder samma sak.
  assert.deepEqual(attLaggaI([{ produktId: P1, antal: 1 }], [{ produktId: P1, variantId: null, antal: 1 }]), []);
});

test("samma vara två gånger i korgen läggs bara i en gång", () => {
  assert.deepEqual(attLaggaI([{ produktId: P1, antal: 2 }, { produktId: P1, antal: 2 }], []), [{ produktId: P1, antal: 2 }]);
});

test("besökarens Wix-korg läses som rader", () => {
  const cart = {
    lineItems: [
      { quantity: 2, catalogReference: { catalogItemId: P1, options: null } },
      { quantity: 1, catalogReference: { catalogItemId: P2, options: { variantId: V1 } } },
      { quantity: 1, catalogReference: {} },
      { quantity: 1 },
    ],
  };
  assert.deepEqual(korgensRader(cart), [
    { produktId: P1, variantId: null, antal: 2 },
    { produktId: P2, variantId: V1, antal: 1 },
  ]);
  assert.deepEqual(korgensRader(null), []);
  assert.deepEqual(korgensRader({}), []);
});

test("kassan får rabattkoden i adressen bara när mejlet hade en", () => {
  assert.equal(tillKassan(null), "/kassa");
  assert.equal(tillKassan(""), "/kassa");
  assert.equal(tillKassan("FP-AB12"), "/kassa?kod=FP-AB12");
  assert.equal(tillKassan(" FP AB12 "), "/kassa?kod=FPAB12");
  assert.equal(tillKassan("a&b=c"), "/kassa?kod=a%26b%3Dc");
});
