// lib/leveransdatum.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar leveransintervallet som produktsidan och varukorgen visar
// (lib/leveransdatum.ts). Fraktregeln (fraktKr) testas i lib/shipping.test.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { addBusinessDays, leveransIntervall, leveransIntervallForDag } from "./leveransdatum.ts";

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

test("en given dag ger samma intervall som produktsidan räknar den dagen", () => {
  // Fredag 9 oktober 2026: +3 = onsdag 14, +6 = måndag 19.
  assert.equal(leveransIntervallForDag("2026-10-09", 3, 6), leveransIntervall(new Date(2026, 9, 9, 12), 3, 6));
  assert.match(leveransIntervallForDag("2026-10-09", 3, 6) ?? "", /^ons 14 – mån 19 oktober$/);
  // Lördag och söndag ger samma intervall som fredagen: ingen arbetsdag går åt.
  assert.equal(leveransIntervallForDag("2026-10-10", 3, 6), leveransIntervallForDag("2026-10-09", 3, 6));
  assert.equal(leveransIntervallForDag("2026-10-11", 3, 6), leveransIntervallForDag("2026-10-09", 3, 6));
  // Måndag 12 oktober flyttar intervallet en arbetsdag.
  assert.match(leveransIntervallForDag("2026-10-12", 3, 6) ?? "", /^tors? 15 – tis 20 oktober$/);
});

test("en dag som inte går att läsa ger null, aldrig ett gissat datum", () => {
  assert.equal(leveransIntervallForDag("", 3, 6), null);
  assert.equal(leveransIntervallForDag("9 oktober", 3, 6), null);
  assert.equal(leveransIntervallForDag("2026-02-31", 3, 6), null);
  assert.equal(leveransIntervallForDag("2026-10-09T12:00:00Z", 3, 6), null);
});
