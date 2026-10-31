import { test } from "node:test";
import assert from "node:assert/strict";
import { variantOptioner, variantOptionXml } from "./google-variant-option.ts";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

test("ett par per option, i optionernas ordning, med sidans namn", () => {
  const par = variantOptioner(
    [{ option: "Färg", choice: "Svart" }, { option: "Antal", choice: "6 st" }, { option: "färg", choice: "Vit" }, { option: "", choice: "x" }],
    (n) => (n === "Antal" ? "Förpackning" : n),
  );
  assert.deepEqual(par, [{ name: "Färg", value: "Svart" }, { name: "Förpackning", value: "6 st" }]);
});

test("högst 30 par och 250 tecken", () => {
  const många = Array.from({ length: 40 }, (_, i) => ({ option: `Axel ${i}`, choice: "x".repeat(300) }));
  const par = variantOptioner(många);
  assert.equal(par.length, 30);
  assert.equal(par[0].value.length, 250);
});

test("☠️ ingen variant_option på en produkt utan varianter", () => {
  assert.equal(variantOptionXml("Hink", [{ name: "Färg", value: "Svart" }], false, esc), "");
  assert.equal(variantOptionXml("Hink", [], true, esc), "");
});

test("XML med gruppens titel och ett block per par, escapat", () => {
  const xml = variantOptionXml("Hink & lock", [{ name: "Färg", value: "Svart" }, { name: "Förpackning", value: "<6 st>" }], true, esc);
  assert.match(xml, /<g:item_group_title>Hink &amp; lock<\/g:item_group_title>/);
  assert.equal((xml.match(/<g:variant_option>/g) || []).length, 2);
  assert.match(xml, /<g:name>Förpackning<\/g:name>\s*<g:value>&lt;6 st><\/g:value>/);
});
