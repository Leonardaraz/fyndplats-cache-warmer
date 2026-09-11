// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { clipText } from "./clip-text.ts";

test("kortare än max lämnas orörd", () => {
  assert.equal(clipText("Kort text.", 220), "Kort text.");
});

test("kapar vid meningsgräns när en finns nära slutet", () => {
  const s = "Ett hörnskrivbord där eluttagen sitter i bordet. Det bär 135 kg totalt. Och sedan följer en lång fortsättning som inte får plats.";
  assert.equal(clipText(s, 75), "Ett hörnskrivbord där eluttagen sitter i bordet. Det bär 135 kg totalt.");
});

test("kapar vid ordgräns när ingen meningsgräns finns, och markerar det", () => {
  const s = "Samma hörnskrivbord som den svarta versionen fast i vitt och billigare";
  assert.equal(clipText(s, 50), "Samma hörnskrivbord som den svarta versionen fast…");
});

test("hängande bindeord städas bort före ellipsen", () => {
  // Regressionen: "…visar spänning, ström och effekt i realtid, och." på sidan.
  const s = "Denna portabla elbilsladdare har en LCD-skärm som visar spänning, ström och effekt i realtid, och den kan schemaläggas";
  const out = clipText(s, 100);
  assert.equal(out.endsWith("realtid…"), true, out);
});

test("skär aldrig mitt i ett ord", () => {
  // Regressionen: ".slice(0, 220)" gav "…och är billigare än den s."
  const s = "Det bär 135 kg totalt och är billigare än den svarta versionen av samma bord";
  for (let max = 10; max < s.length; max++) {
    const out = clipText(s, max);
    const stem = out.replace(/…$/, "");
    assert.equal(s.startsWith(stem), true, `max=${max}: "${out}"`);
    const nextChar = s.charAt(stem.length);
    assert.equal(nextChar === "" || /[\s,;:]/.test(nextChar), true, `max=${max}: "${out}"`);
  }
});

test("svenska decimaltal med komma överlever", () => {
  const s = "Bordslampa i trä, total höjd 40,5 centimeter och skärm i tyg som är fyrkantig";
  assert.equal(clipText(s, 45).includes("40,5"), true, clipText(s, 45));
});

test("en punkt för tidigt i strängen väljs inte", () => {
  // Punkten efter "cm" ligger på 12 % av maxlängden — att kapa där hade kastat
  // nästan hela texten. Då är ordgräns rätt.
  const s = "Ø37 cm. Golvlampa 153 cm i guld och vitt med tygskärm och fotströmbrytare på sladden";
  assert.equal(clipText(s, 60).startsWith("Ø37 cm. Golvlampa"), true);
});

test("tom sträng ger tom sträng", () => {
  assert.equal(clipText("", 220), "");
});
