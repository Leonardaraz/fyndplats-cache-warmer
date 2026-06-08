// Run with: `pnpm test` (node --test --experimental-strip-types).
import { test } from "node:test";
import assert from "node:assert/strict";
import { colorOf } from "./color-hex.ts";

test("exakt match på enkla färger (sv + eng)", () => {
  assert.equal(colorOf("Röd"), "#dc2626");
  assert.equal(colorOf("blå"), "#2563eb");
  assert.equal(colorOf("Black"), "#1c1c1c");
});

test("sammansatta svenska färger får RÄTT hex (egen nyckel, inte delsträng)", () => {
  assert.equal(colorOf("Marinblå"), "#1e3a8a"); // marin, INTE blå (#2563eb)
  assert.equal(colorOf("Ljusblå"), "#7dd3fc");
  assert.equal(colorOf("Mörkgrå"), "#4b5563");
});

test("hela ord matchas i sammansatta valnamn", () => {
  assert.equal(colorOf("Blå modell 1"), "#2563eb");
  assert.equal(colorOf("Röd S"), "#dc2626");
});

test("INGA falska delsträngsträffar (audit M2)", () => {
  assert.equal(colorOf("EU-kontakt"), ""); // tidigare "ko"=cow → #fefce8
  assert.equal(colorOf("Korall"), ""); // tidigare "ko"=cow
  assert.equal(colorOf("2 L"), "");
  assert.equal(colorOf("S"), "");
  assert.equal(colorOf(""), "");
});
