// Hur variantväljaren ritas (lib/variant-lage). Leonard 2026-10-01: volymerna
// på ultraljudstvätten ritades som fem likadana miniatyrkort med avkapad text.
import test from "node:test";
import assert from "node:assert/strict";
import { arMattAxel, variantLage } from "./variant-lage.ts";

const kort = (l: string) => ({ label: l, image: `b379ce_${l}~mv2.png` });

test("volym med en bild per val ritas som text, inte som fem likadana kort", () => {
  assert.equal(variantLage("Volym", ["2L", "3L", "6L", "10L", "15L"].map(kort)), "text");
});

test("måttnamn räknas som mått, oavsett etikett", () => {
  for (const namn of ["Storlek", "Mått", "Längd", "Antal", "Kapacitet", "Size"]) {
    assert.ok(arMattAxel(namn, ["S", "M", "L"]), namn);
  }
});

test("färg med en bild per val ritas med bild, även när etiketten bär en siffra", () => {
  assert.equal(variantLage("Färg", ["Grå", "Svart"].map(kort)), "image");
  assert.equal(variantLage("Färg", ["Grå 2", "Svart 2"].map(kort)), "image");
});

test("neutralt namn: siffror i varje etikett betyder mått", () => {
  assert.equal(variantLage("Variant", ["120 cm", "160 cm"].map(kort)), "text");
  assert.equal(variantLage("Variant", ["Med lock", "Utan lock"].map(kort)), "image");
});

test("neutralt namn med färgetiketter behåller bilden ('Svart 120 cm')", () => {
  const val = [
    { label: "Svart 120 cm", image: "a", color: "#111" },
    { label: "Vit 120 cm", image: "b", color: "#fff" },
  ];
  assert.equal(variantLage("Variant", val), "image");
});

test("färgprick när bilder saknas och majoriteten är färger, annars text", () => {
  assert.equal(variantLage("Färg", [{ label: "Röd", color: "#c00" }, { label: "Blå", color: "#00c" }]), "color");
  assert.equal(variantLage("Typ", [{ label: "A" }, { label: "B", color: "#00c" }, { label: "C" }]), "text");
  assert.equal(variantLage("Färg", []), "text");
});
