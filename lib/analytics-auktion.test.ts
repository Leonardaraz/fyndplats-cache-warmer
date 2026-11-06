// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Fyndauktionens mätning (2026-11-04): varukorgen räknas som auktionens bara när
// besökaren kom från /fyndauktion på samma webbplats, och ingenting sparas på
// besökarens enhet.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { franFyndauktionen } from "./fran-fyndauktionen.ts";

test("varukorgen räknas som auktionens bara efter /fyndauktion på samma webbplats", () => {
  const o = "https://www.fyndplats.se";
  assert.equal(franFyndauktionen("https://www.fyndplats.se/fyndauktion", o), true);
  assert.equal(franFyndauktionen("https://www.fyndplats.se/fyndauktion?x=1", o), true);
  assert.equal(franFyndauktionen("https://www.fyndplats.se/", o), false);
  assert.equal(franFyndauktionen("https://www.fyndplats.se/fyndauktion/annat", o), false);
  assert.equal(franFyndauktionen("https://evil.example/fyndauktion", o), false);
  assert.equal(franFyndauktionen("", o), false);
});

test("auktionsmätningen sparar ingenting på besökarens enhet", () => {
  const kalla = readFileSync(join(import.meta.dirname, "analytics.ts"), "utf8");
  const block = kalla.slice(kalla.indexOf("// ── Fyndauktionen"));
  assert.ok(block.length > 100, "blocket finns");
  assert.doesNotMatch(block, /localStorage|sessionStorage|document\.cookie/);
});
