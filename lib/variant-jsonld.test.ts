import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonLdVarianter, schemaegenskap, variantBeskrivning, variantUrl, variesBy } from "./variant-jsonld.ts";

const bas = { priceNum: 499, inStock: true, img: "huvud.jpg" };
const val = (label: string, over: Record<string, unknown> = {}) => ({
  label,
  image: `${label}.jpg`,
  variantId: `v-${label}`,
  priceNum: 599,
  inStock: true,
  ...over,
});

test("en axel: en variant per val, med eget pris, lager och bild", () => {
  const r = jsonLdVarianter({ ...bas, options: { name: "Färg", choices: [val("Svart"), val("Vit", { priceNum: 0, image: "", inStock: false })] } });
  assert.deepEqual(r, {
    axlar: ["Färg"],
    varianter: [
      { variantId: "v-Svart", val: [{ axel: "Färg", etikett: "Svart" }], priceNum: 599, inStock: true, image: "Svart.jpg" },
      { variantId: "v-Vit", val: [{ axel: "Färg", etikett: "Vit" }], priceNum: 499, inStock: false, image: "huvud.jpg" },
    ],
  });
});

test("två axlar: en variant per rad i tabellen", () => {
  const r = jsonLdVarianter({
    ...bas,
    variantAxes: [{ name: "Färg" }, { name: "Antal" }],
    variantTable: [
      { choices: { Färg: "Svart", Antal: "4 st" }, variantId: "a", priceNum: 300, inStock: true, image: "a.jpg" },
      { choices: { Färg: "Svart", Antal: "6 st" }, variantId: "b", priceNum: 400, inStock: false, image: "" },
      { choices: { Färg: "Vit" }, variantId: "c", priceNum: 400, inStock: true, image: "" },
    ],
  });
  assert.deepEqual(r?.axlar, ["Färg", "Antal"]);
  // En rad som saknar ett val kan inte förväljas och hoppas över.
  assert.deepEqual(r?.varianter.map((v) => v.variantId), ["a", "b"]);
  assert.equal(r?.varianter[1].image, "huvud.jpg");
});

test("☠️ ingen grupp utan minst två varianter med eget id", () => {
  assert.equal(jsonLdVarianter({ ...bas }), null);
  assert.equal(jsonLdVarianter({ ...bas, options: { name: "Färg", choices: [val("Svart")] } }), null);
  assert.equal(jsonLdVarianter({ ...bas, options: { name: "Färg", choices: [val("Svart"), val("Vit", { variantId: "" })] } }), null);
  assert.equal(
    jsonLdVarianter({ ...bas, options: { name: "Färg", choices: [val("Svart"), val("Svart2", { variantId: "v-Svart" })] } }),
    null,
  );
});

test("☠️ variesBy tar bara egenskaper Google stöder", () => {
  assert.equal(schemaegenskap("Färg"), "color");
  assert.equal(schemaegenskap(" storlek "), "size");
  assert.equal(schemaegenskap("Mönster"), "pattern");
  assert.equal(schemaegenskap("Antal"), null);
  assert.equal(schemaegenskap("Effekt"), null);
  assert.deepEqual(variesBy(["Färg", "Antal", "Storlek", "färg"]), ["https://schema.org/color", "https://schema.org/size"]);
  assert.deepEqual(variesBy(["Effekt"]), []);
});

test("variantens namn bär alla val, egenskaperna bara de stödda", () => {
  const v = { variantId: "a", val: [{ axel: "Färg", etikett: "svart" }, { axel: "Antal", etikett: "4 st" }], priceNum: 1, inStock: true, image: "" };
  assert.deepEqual(variantBeskrivning("Hink", v), { name: "Hink – svart, 4 st", color: "svart" });
  const stor = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  assert.deepEqual(variantBeskrivning("Hink", v, stor), { name: "Hink – Svart, 4 st", color: "Svart" });
});

test("variantUrl förväljer varianten med ?variant=", () => {
  assert.equal(variantUrl("https://www.fyndplats.se/produkt/hink", "a b"), "https://www.fyndplats.se/produkt/hink?variant=a%20b");
});
