// lib/leveransdatum.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar leveransintervallet som produktsidan och varukorgen visar
// (lib/leveransdatum.ts). Fraktregeln (fraktKr) testas i lib/shipping.test.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { addBusinessDays, leveransIntervall } from "./leveransdatum.ts";

test("arbetsdagar hoppar över helgen", () => {
  // fredag 9 oktober 2026 + 1 arbetsdag = måndag 12 oktober
  const fre = new Date(2026, 9, 9, 12);
  assert.equal(addBusinessDays(fre, 1).getDate(), 12);
  // torsdag + 3 arbetsdagar = tisdag
  const tor = new Date(2026, 9, 8, 12);
  const d = addBusinessDays(tor, 3);
  assert.equal(d.getDay(), 2);
  assert.equal(d.getDate(), 13);
});

test("intervallet räknas med de dagar som skickas in", () => {
  // Natten mot fredag 9 oktober 2026, som när varukorgen byggdes om.
  const nu = new Date(2026, 9, 9, 1);
  const forsta = addBusinessDays(nu, 3);
  const sista = addBusinessDays(nu, 6);
  const text = leveransIntervall(nu, 3, 6);
  assert.match(text, new RegExp(`^\\S+ ${forsta.getDate()} – \\S+ ${sista.getDate()} oktober$`));
  assert.ok(!text.includes("."), "veckodagen ska inte bära punkt");
});

test("intervallet över ett månadsskifte skriver båda månaderna", () => {
  const nu = new Date(2026, 9, 26, 12); // måndag 26 oktober: +3 = 29 oktober, +6 = 2 november
  const text = leveransIntervall(nu, 3, 6);
  assert.match(text, /oktober – .* november$/);
});
