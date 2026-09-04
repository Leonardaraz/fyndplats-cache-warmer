// Provet är det som avgör om ett fullt pass (1 622 renderingar) körs eller inte,
// och att det är FAST är hela dess kostnadsargument. Går den egenskapen förlorad
// i en framtida omskrivning blir kvartscronen tyst mycket dyrare — det syns inte
// i något gränssnitt, bara på fakturan. Därför låses den här.
import test from "node:test";
import assert from "node:assert/strict";
import { fastProv, PROV_STORLEK, roterad } from "./warm-urval.ts";

const katalog = (n: number) => Array.from({ length: n }, (_, i) => `produkt-${i}`);

test("provet är fast — samma katalog ger samma sidor varje gång", () => {
  const k = katalog(1622);
  assert.deepEqual(fastProv(k), fastProv(k));
});

test("provet är lagom stort och utan dubbletter", () => {
  const p = fastProv(katalog(1622));
  assert.equal(p.length, PROV_STORLEK);
  assert.equal(new Set(p).size, PROV_STORLEK, "samma sida två gånger vore ett svagare prov");
});

test("provet sprids över katalogen, inte i ett hörn", () => {
  // Klumpar det ihop sig i början missar det ett läge där bara svansen är kall.
  const n = 1622;
  const index = fastProv(katalog(n)).map((s) => Number(s.split("-")[1]));
  assert.ok(index[0]! < n / 12, "första sidan ska ligga tidigt");
  assert.ok(index[index.length - 1]! > n * 0.9, "sista sidan ska ligga sent");
  for (let i = 1; i < index.length; i++) {
    assert.ok(index[i]! > index[i - 1]!, "stigande ordning");
  }
});

test("små och tomma kataloger kraschar inte", () => {
  assert.deepEqual(fastProv([]), []);
  assert.equal(fastProv(katalog(1)).length, 1);
  assert.equal(fastProv(katalog(5)).length, 5, "färre sidor än provet → ta alla");
  assert.equal(new Set(fastProv(katalog(5))).size, 5, "och utan dubbletter");
});

// ── Rotationen ────────────────────────────────────────────────────────────
//
// Hinner ett fullt pass inte klart innan deadline (1 622 sidor / 8 parallella
// à ~1 s ≈ 200 s mot 240 — marginalen är liten) ska nästa körning fortsätta på
// ett ANNAT ställe. Steget räknas därför per körning, inte per timme.
//
// Det här var ett riktigt fel en stund: rotationen skrevs för en timcron och
// följde med när värmningen flyttade till en kvartscron. Då fick alla fyra
// körningar per timme samma startpunkt — ett avbrutet pass gjorde om samma huvud
// tre gånger till och nådde aldrig svansen. Och dyrt blev det, för provet är
// spritt över katalogen och hade sett svansen som kall och triggat ett nytt
// fullt pass var 15:e minut.

const KVART = 15 * 60_000;

test("rotationen flyttar sig mellan körningar, inte bara mellan timmar", () => {
  const k = katalog(1622);
  const t = Date.UTC(2026, 8, 4, 12, 0, 0);
  const forsta = roterad(k, t)[0];
  assert.notEqual(roterad(k, t + KVART)[0], forsta, "nästa kvart ska börja på annat ställe");
  assert.notEqual(roterad(k, t + 2 * KVART)[0], forsta);
  assert.notEqual(roterad(k, t + 3 * KVART)[0], forsta);
});

test("samma körning ger samma ordning — ingen slump", () => {
  const k = katalog(1622);
  const t = Date.UTC(2026, 8, 4, 12, 0, 0);
  assert.deepEqual(roterad(k, t), roterad(k, t + 1000), "inom samma kvart: identisk");
});

test("rotationen tappar aldrig en sida", () => {
  const k = katalog(1622);
  const ut = roterad(k, Date.UTC(2026, 8, 4, 12, 0, 0));
  assert.equal(ut.length, k.length);
  assert.equal(new Set(ut).size, k.length);
});

test("rotationen betar av hela katalogen över ett dygn", () => {
  // 96 körningar per dygn à 8×40 = 320 sidors steg. Täcker de ~1 622 sidorna
  // många gånger om — det som skulle gå sönder är om steget vore noll.
  const k = katalog(1622);
  const t0 = Date.UTC(2026, 8, 4, 0, 0, 0);
  const starter = new Set(Array.from({ length: 96 }, (_, i) => roterad(k, t0 + i * KVART)[0]));
  assert.ok(starter.size > 4, `startpunkterna ska variera, fick ${starter.size}`);
});

test("rotationen tål tom och enradig katalog", () => {
  assert.deepEqual(roterad([], Date.now()), []);
  assert.deepEqual(roterad(["a"], Date.now()), ["a"]);
});
