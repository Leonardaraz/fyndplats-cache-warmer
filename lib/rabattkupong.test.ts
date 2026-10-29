// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
//
// ☠️ VARFÖR TESTET FINNS. Rabattkoden i mejl 3 om övergiven varukorg skapades
// aldrig, från 2026-05-30 till 2026-10-29: Wix svarade 400 "Not a numeric
// value" på ISO-datumen, och mejlet gick ut utan kod. Ingen märkte det, för
// sändaren faller tillbaka på varianten utan kod. Formen nedan är uppmätt mot
// Wix samma dag (se lib/rabattkupong.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GILTIG_MS, MINSTA_DELSUMMA_SEK, RABATT_PROCENT, rabattkupong } from "./rabattkupong.ts";

const NU = Date.UTC(2026, 9, 29, 12, 0, 0);

test("☠️ start och slut är millisekunder som text, inte ISO-datum", () => {
  const { specification: s } = rabattkupong("cart-1", "FP5-ABCD-XYZ234", NU);
  assert.equal(s.startTime, String(NU));
  assert.equal(s.expirationTime, String(NU + GILTIG_MS));
  for (const t of [s.startTime, s.expirationTime]) {
    assert.match(t, /^\d{13}$/);
  }
});

test("☠️ minimumSubtotal utan scope: de två utesluter varandra i Wix schema", () => {
  const { specification: s } = rabattkupong("cart-1", "FP5-ABCD-XYZ234", NU);
  assert.equal(s.minimumSubtotal, MINSTA_DELSUMMA_SEK);
  assert.equal("scope" in s, false);
});

test("☠️ en användning totalt och per kund, med Wix fältnamn", () => {
  const { specification: s } = rabattkupong("cart-1", "FP5-ABCD-XYZ234", NU);
  assert.equal(s.usageLimit, 1);
  assert.equal(s.limitPerCustomer, 1);
  assert.equal("limitedToOnePerCustomer" in s, false);
});

test("fem procent, aktiv, koden som den kom in", () => {
  const { specification: s } = rabattkupong("cart-1", "FP5-ABCD-XYZ234", NU);
  assert.equal(s.percentOffRate, RABATT_PROCENT);
  assert.equal(s.percentOffRate, 5);
  assert.equal(s.active, true);
  assert.equal(s.code, "FP5-ABCD-XYZ234");
});

test("mejlets slutdatum är samma ögonblick som kupongens", () => {
  const { specification: s, expiresAt } = rabattkupong("cart-1", "FP5-ABCD-XYZ234", NU);
  assert.equal(Date.parse(expiresAt), Number(s.expirationTime));
});

test("Wix tar högst 20 tecken i koden", () => {
  // generateCartCouponCode ger FP5- + fyra tecken + - + sex tecken.
  const { specification: s } = rabattkupong("cart-1", "FP5-ABCD-XYZ234", NU);
  assert.ok(s.code.length <= 20);
});

test("☠️ discount-codes.ts bygger kroppen här och ingen annanstans", () => {
  const kalla = readFileSync(new URL("./discount-codes.ts", import.meta.url), "utf8");
  assert.match(kalla, /from '\.\/rabattkupong'/);
  assert.doesNotMatch(kalla, /startTime\s*:/);
  assert.doesNotMatch(kalla, /toISOString\(\)/);
});
