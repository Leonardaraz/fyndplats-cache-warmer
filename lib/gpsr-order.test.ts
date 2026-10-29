// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { byggOrderSakerhet } from "./gpsr-order.ts";
import { GPSR_BRUKSANVISNING, GPSR_BRUKSANVISNING_OM, tolkaGpsr } from "./gpsr-flik.ts";

const A = { namn: "Bolag GmbH", gata: "Gatan 1", postnummer: "12345", ort: "Hamburg", land: "Tyskland", epost: "info@example.com" };
const g = (marke: string | null, sakerhet: string[]) => tolkaGpsr({ marke, ansvarig: { ...A }, sakerhet })!;
const PART_A = { roll: "Tillverkare och ansvarig i EU", namn: "Bolag GmbH", rader: ["Gatan 1", "12345 Hamburg, Tyskland"], epost: "info@example.com" };

test("parar varje orderrad med sina uppgifter och tar tillverkaren en gång", () => {
  const s = byggOrderSakerhet(["Soffa", "Bord"], [g("HOMCOM", ["Maxbelastning: 120 kg."]), g("Outsunny", [])]);
  assert.deepEqual(s, {
    varor: [
      { namn: "Soffa", marke: "HOMCOM", rader: ["Maxbelastning: 120 kg."], bruksanvisning: GPSR_BRUKSANVISNING },
      { namn: "Bord", marke: "Outsunny", rader: [], bruksanvisning: GPSR_BRUKSANVISNING },
    ],
    ansvariga: [PART_A],
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

test("en VEVOR-vara ger två parter och den villkorade raden om bruksanvisningen", () => {
  const v = tolkaGpsr({
    marke: "VEVOR",
    tillverkare: { namn: "Fabrik Co., Ltd.", adress: "Väg 1, 200000 Stad, CN", epost: "a@example.com" },
    euAnsvarig: { namn: "Ombud Limited", adress: "Gata 2, Dublin, Ireland", epost: "b@example.com" },
    sakerhet: [],
  })!;
  const s = byggOrderSakerhet(["Soffa", "Pump"], [g("HOMCOM", []), v]);
  assert.deepEqual(s?.ansvariga.map((p) => p.roll), ["Tillverkare och ansvarig i EU", "Tillverkare", "Ansvarig i EU"]);
  assert.equal(s?.varor[1].bruksanvisning, GPSR_BRUKSANVISNING_OM);
});
