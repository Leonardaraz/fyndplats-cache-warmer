// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Fyndauktionen har tio fynd om dagen sedan 2026-11-04 (motorns
// lib/auction/antal.ts), och fler under Black Week. Ingen text får lova ett
// bestämt antal; bannern visar antalet som faktiskt finns.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const rot = join(import.meta.dirname, "..");
const filer = [
  "app/fyndauktion/page.tsx",
  "content/blog/fyndauktionen-sa-funkar-det.md",
  "components/auction-steps.tsx",
  "app/page.tsx",
];

test("ingen text lovar fem fynd", () => {
  for (const f of filer) {
    const s = readFileSync(join(rot, f), "utf8");
    assert.doesNotMatch(s, /\b(fem|5) fynd\b/i, f);
  }
});

test("startsidans knapp visas bara när det finns fynd, och raden är Leonards", () => {
  const s = readFileSync(join(rot, "app/page.tsx"), "utf8");
  const i = s.indexOf('kalla="startknapp"');
  assert.ok(i > 0, "knappen finns");
  const fore = s.slice(s.lastIndexOf("liveAuctions.length > 0 ?", i), i);
  assert.ok(fore.length > 0 && fore.length < 200, "knappen står i grenen för levande fynd");
  assert.match(s, /Se dagens fyndauktion/);
  assert.match(s, /Priset sjunker varje timme tills någon köper\./);
});
