import test from "node:test";
import assert from "node:assert/strict";
import { arSammaVara, fordelaVantande, nyRadEfterTillagg, vantandeNyckel } from "./kundvagn-rad.ts";

const rad = (id: string, produkt: string, variant?: string, quantity = 1) => ({
  _id: id,
  quantity,
  catalogReference: { catalogItemId: produkt, options: variant ? { variantId: variant } : undefined },
});

test("samma vara: produkt och variant, en saknad variant räknas som samma", () => {
  assert.equal(arSammaVara(rad("a", "p1", "v1"), "p1", "v1"), true);
  assert.equal(arSammaVara(rad("a", "p1", "v1"), "p1", "v2"), false);
  assert.equal(arSammaVara(rad("a", "p1", "v1"), "p2", "v1"), false);
  // Varan utan valt alternativ: Wix kan lägga standardvarianten på raden.
  assert.equal(arSammaVara(rad("a", "p1", "v1"), "p1"), true);
  assert.equal(arSammaVara(rad("a", "p1"), "p1", "v1"), true);
  assert.equal(arSammaVara(rad("a", "p1"), ""), false);
  // Ett tomt id matchar aldrig, inte ens en rad som saknar katalog-id.
  assert.equal(arSammaVara({ _id: "a", catalogReference: { catalogItemId: "" } }, ""), false);
});

test("raden tillägget blev: den nya raden, inte en som fanns före", () => {
  const fore = new Set(["a", "b"]);
  const efter = [rad("a", "p1", "v1"), rad("b", "p2"), rad("c", "p1", "v2")];
  assert.equal(nyRadEfterTillagg(fore, efter, "p1", "v2"), "c");
  // Fanns varan redan ökar Wix antalet på den raden: ingen ny rad.
  assert.equal(nyRadEfterTillagg(fore, efter, "p2"), undefined);
  // En ny rad av en annan vara räknas inte.
  assert.equal(nyRadEfterTillagg(fore, efter, "p3"), undefined);
  assert.equal(nyRadEfterTillagg(new Set(), [], "p1"), undefined);
});

test("väntande varor: på befintlig rad eller som egen rad, två tryck blir en rad", () => {
  const rader = [rad("a", "p1", "v1", 2), rad("b", "p2")];
  const vantande = [
    { id: "p1", variantId: "v1", nyckel: 1, antal: 1 },
    { id: "p3", variantId: "x", nyckel: 2, antal: 2 },
    { id: "p3", variantId: "x", nyckel: 3, antal: 1 },
    { id: "p3", variantId: "y", nyckel: 4, antal: 1 },
  ];
  const { paRad, egna } = fordelaVantande(rader, vantande);
  assert.deepEqual([...paRad], [["a", 1]]);
  assert.deepEqual(egna.map((e) => [e.nyckel, e.totalt]), [[2, 3], [4, 1]]);
  // Raden Wix skapar får den första väntande radens nyckel.
  assert.equal(vantandeNyckel(egna[0].nyckel), "v2");
});

test("en tom låda: varan blir en egen väntande rad", () => {
  const { paRad, egna } = fordelaVantande([], [{ id: "p1", nyckel: 7, antal: 1 }]);
  assert.equal(paRad.size, 0);
  assert.equal(egna.length, 1);
  assert.equal(egna[0].totalt, 1);
});
