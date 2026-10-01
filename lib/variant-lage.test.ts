// Hur variantväljaren ritas (lib/variant-lage). Leonard 2026-10-01: volymerna
// på ultraljudstvätten ritades som fem likadana miniatyrkort med avkapad text.
import test from "node:test";
import assert from "node:assert/strict";
import { arMattAxel, flestaHarBild, utanTum, variantLage, visaValnamn } from "./variant-lage.ts";

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

test("bild till alla utom ett av minst fyra val räcker (Mongar: 5 av 6)", () => {
  const val = ["Forest", "Blå", "Grå", "Brun", "Brun UL", "Grå UL"].map((l, i) => ({ label: l, image: i === 0 ? "" : `b${i}`, color: "#888" }));
  assert.ok(flestaHarBild(val));
  assert.equal(variantLage("Färg", val), "image");
});

test("två eller tre val behöver bild till alla; hälften räcker aldrig", () => {
  assert.equal(flestaHarBild([{ label: "A", image: "a" }, { label: "B" }]), false);
  assert.equal(flestaHarBild([{ label: "A", image: "a" }, { label: "B", image: "b" }, { label: "C" }]), false);
  assert.equal(flestaHarBild([{ label: "A", image: "a" }, { label: "B" }, { label: "C" }, { label: "D", image: "d" }]), false);
  assert.equal(flestaHarBild([{ label: "A", image: "a" }]), false);
});

test("mått i tum med cm inom parentes visas bara i cm", () => {
  assert.equal(utanTum("18 × 12 × 14 tum (≈46 × 30 × 36 cm)"), "46 × 30 × 36 cm");
  assert.equal(utanTum("48 × 24 × 24 tum (≈122 × 61 × 61 cm)"), "122 × 61 × 61 cm");
  assert.equal(utanTum("30 tum (76 cm)"), "76 cm");
});

test("etiketter utan tum-och-cm-par lämnas orörda", () => {
  for (const l of ["205 cm", "Svart", "24 tum", "Sand-1P-20D", ""]) assert.equal(utanTum(l), l);
});

test("tum med något mellan måttet och parentesen behåller det, så valen förblir olika", () => {
  assert.equal(utanTum("38.6x15.2 tum 1 st (≈98 × 39 cm)"), "98 × 39 cm · 1 st");
  assert.equal(utanTum("38.6x15.2 tum 2 st (≈98 × 39 cm)"), "98 × 39 cm · 2 st");
  assert.equal(utanTum("43.3x15.2 tum 1 st A (≈110 × 39 cm)"), "110 × 39 cm · 1 st A");
  assert.equal(utanTum("31.5 tum ( 800mm )"), "800 mm");
});

test("visaValnamn rättar tekniska namn och stavfel", () => {
  assert.equal(visaValnamn("Sand-1P-20D"), "Sand · 1 person");
  assert.equal(visaValnamn("2P-15D UL-Grå"), "Grå · 2 personer · 15D UL");
  assert.equal(visaValnamn("svartaDominostenar"), "Svart med dominobrickor");
  assert.equal(visaValnamn("Pistacijegrön"), "Pistaschgrön");
  assert.equal(visaValnamn("5500sq.in."), "3,5 m²");
});

test("visaValnamn: hyllplan, tum som cm och stor första bokstav", () => {
  assert.equal(visaValnamn("16x36x72 tum 5 Tire (≈41 × 91 × 183 cm)"), "91 × 41 × 183 cm · 5 hyllplan");
  assert.equal(visaValnamn("24x36x72 tum 6 Tire (≈61 × 91 × 183 cm)"), "61 × 91 × 183 cm · 6 hyllplan");
  assert.equal(visaValnamn("endast låda"), "Endast låda");
  assert.equal(visaValnamn("med dörr"), "Med dörr");
});

test("vanliga namn lämnas orörda", () => {
  for (const l of ["Vit", "Svart", "205 cm", "2L", "85 tum", "Beige"]) assert.equal(visaValnamn(l), l);
});
