// Organisationsnummer (lib/medlem/orgnr.ts): E3-1 och E3-2, med Leonards beslut
// 2026-11-04 att enskilda firmor får vara med (F4).

import { test } from "node:test";
import assert from "node:assert/strict";
import { luhnOk, orgnrFeltext, provaOrgnr, type Orgnrsfel } from "./orgnr.ts";

/** Nio siffror plus rätt kontrollsiffra. */
function medKontroll(nio: string): string {
  for (let k = 0; k < 10; k++) if (luhnOk(nio + k)) return nio + k;
  throw new Error("ingen kontrollsiffra");
}

test("E3-1: ett aktiebolag godkänns i alla vanliga skrivsätt", () => {
  for (const t of ["556012-5790", "5560125790", "16556012-5790", "165560125790", " 556012 5790 ", "556012–5790"]) {
    const p = provaOrgnr(t);
    assert.deepEqual(p, { ok: true, nummer: "556012-5790", form: "juridisk", grupp: 5, visas: "556012-5790" }, t);
  }
});

test("E3-1: fel kontrollsiffra avvisas direkt", () => {
  assert.deepEqual(provaOrgnr("556012-5791"), { ok: false, fel: "kontrollsiffra" });
  assert.deepEqual(provaOrgnr("121212-1213"), { ok: false, fel: "kontrollsiffra" });
});

test("F4: en enskild firma godkänns, och personnumret visas bara med de fyra sista siffrorna", () => {
  for (const t of ["121212-1212", "1212121212", "19121212-1212", "191212121212", "121212+1212"]) {
    const p = provaOrgnr(t);
    assert.deepEqual(p, { ok: true, nummer: "121212-1212", form: "enskild", visas: "******-1212" }, t);
  }
  // Samordningsnummer: dagen plus 60.
  const samordning = medKontroll("121272121");
  const p = provaOrgnr(samordning);
  assert.equal(p.ok, true);
  assert.equal(p.ok && p.form, "enskild");
});

test("sekel och form måste stämma: 16 framför ett personnummer, 19 framför ett bolag", () => {
  assert.deepEqual(provaOrgnr("16121212-1212"), { ok: false, fel: "datum" });
  assert.deepEqual(provaOrgnr("19556012-5790"), { ok: false, fel: "datum" });
  assert.deepEqual(provaOrgnr("17121212-1212"), { ok: false, fel: "format" });
});

test("ogiltiga datum i personnummerform avvisas", () => {
  for (const nio of ["121312121", "120012121", "121232121", "121260121", "121292121", "001212121"]) {
    const t = medKontroll(nio);
    const p = provaOrgnr(t);
    // 001212 är 1 december 2000, alltså giltigt; de andra har fel månad eller dag.
    if (nio === "001212121") assert.equal(p.ok, true, t);
    else assert.deepEqual(p, { ok: false, fel: "datum" }, t);
  }
});

test("dödsbon och okända grupper är inga företag", () => {
  assert.deepEqual(provaOrgnr(medKontroll("112233445")), { ok: false, fel: "grupp" });
  assert.deepEqual(provaOrgnr(medKontroll("422233445")), { ok: false, fel: "grupp" });
  for (const g of [2, 3, 5, 6, 7, 8, 9]) {
    const p = provaOrgnr(medKontroll(`${g}22233445`));
    assert.equal(p.ok && p.grupp, g);
  }
});

test("allt som inte är tio eller tolv siffror är fel format", () => {
  for (const t of ["", "abc", "12345", "55601257901", "5560125790123", "556012-579O"]) {
    assert.deepEqual(provaOrgnr(t), { ok: false, fel: "format" }, t);
  }
  assert.deepEqual(provaOrgnr(undefined as unknown as string), { ok: false, fel: "format" });
});

test("varje fel har en text till kunden", () => {
  for (const f of ["format", "kontrollsiffra", "datum", "grupp"] as Orgnrsfel[]) {
    assert.ok(orgnrFeltext(f).length > 20, f);
  }
});

test("Luhn: kända nummer", () => {
  assert.equal(luhnOk("5560125790"), true);
  assert.equal(luhnOk("5567037485"), true);
  assert.equal(luhnOk("1212121212"), true);
  assert.equal(luhnOk("5560125791"), false);
  assert.equal(luhnOk("556012579"), false);
});
