// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { byggOrderSakerhet } from "./gpsr-order.ts";

const A = { namn: "Bolag GmbH", gata: "Gatan 1", postnummer: "12345", ort: "Hamburg", land: "Tyskland", epost: "info@example.com" };
const g = (marke: string | null, sakerhet: string[]) => ({ marke, ansvarig: { ...A }, sakerhet });

test("parar varje orderrad med sina uppgifter och tar tillverkaren en gång", () => {
  const s = byggOrderSakerhet(["Soffa", "Bord"], [g("HOMCOM", ["Maxbelastning: 120 kg."]), g("Outsunny", [])]);
  assert.deepEqual(s, {
    varor: [
      { namn: "Soffa", marke: "HOMCOM", rader: ["Maxbelastning: 120 kg."] },
      { namn: "Bord", marke: "Outsunny", rader: [] },
    ],
    ansvariga: [A],
  });
});

test("hoppar över varor utan uppgifter och ger null när ingen har några", () => {
  assert.deepEqual(byggOrderSakerhet(["Soffa", "Lampa"], [null, g(null, ["Endast för inomhusbruk."])])?.varor.map((v) => v.namn), ["Lampa"]);
  assert.equal(byggOrderSakerhet(["Soffa"], [null]), null);
  assert.equal(byggOrderSakerhet([], []), null);
});

test("samma produkt i två varianter står en gång", () => {
  const s = byggOrderSakerhet(["Stol", "Stol"], [g("Vinsetto", ["Maxbelastning: 120 kg."]), g("Vinsetto", ["Maxbelastning: 120 kg."])]);
  assert.equal(s?.varor.length, 1);
});
