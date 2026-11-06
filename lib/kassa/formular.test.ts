// lib/kassa/formular.test.ts — kassans formulär (lib/kassa/formular.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalPostnr, normalTelefon, provaKassa, KASSA_TEXT } from "./formular.ts";

const fullt = {
  epost: " anna@exempel.se ",
  fornamn: "Anna",
  efternamn: "Andersson",
  telefon: "070-123 45 67",
  gata: "Storgatan 1",
  co: "",
  postnr: "15244",
  ort: "Södertälje",
  kupong: "",
};

test("ett ifyllt formulär normaliseras", () => {
  const r = provaKassa(fullt);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.varden.epost, "anna@exempel.se");
  assert.equal(r.varden.telefon, "+46701234567");
  assert.equal(r.varden.postnr, "152 44");
  assert.equal(r.varden.co, "");
  assert.equal(r.varden.kupong, "");
});

test("alla saknade fält visas på en gång, med vad som ska stå där", () => {
  const r = provaKassa({});
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.deepEqual(Object.keys(r.fel).sort(), ["efternamn", "epost", "fornamn", "gata", "ort", "postnr", "telefon"]);
  assert.equal(r.fel.telefon, KASSA_TEXT.telefon.saknas);
  assert.equal(r.fel.postnr, KASSA_TEXT.postnr.saknas);
});

test("fel form ger formtexten, inte saknas-texten", () => {
  const r = provaKassa({ ...fullt, epost: "anna@exempel", telefon: "12", postnr: "0123" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.fel.epost, KASSA_TEXT.epost.fel);
  assert.equal(r.fel.telefon, KASSA_TEXT.telefon.fel);
  assert.equal(r.fel.postnr, KASSA_TEXT.postnr.fel);
});

test("postnummer: fem siffror, aldrig nolla först", () => {
  assert.equal(normalPostnr("152 44"), "152 44");
  assert.equal(normalPostnr(" 152-44 "), "152 44");
  assert.equal(normalPostnr("98499"), "984 99");
  assert.equal(normalPostnr("01234"), null);
  assert.equal(normalPostnr("1524"), null);
  assert.equal(normalPostnr("152445"), null);
  assert.equal(normalPostnr(undefined), null);
});

test("telefon: svenska och utländska nummer blir E.164", () => {
  assert.equal(normalTelefon("0701234567"), "+46701234567");
  assert.equal(normalTelefon("+46 70 123 45 67"), "+46701234567");
  assert.equal(normalTelefon("0046701234567"), "+46701234567");
  assert.equal(normalTelefon("+46 070 123 45 67"), "+46701234567");
  assert.equal(normalTelefon("08-123 456 78"), "+46812345678");
  assert.equal(normalTelefon("+358 40 123 4567"), "+358401234567");
  assert.equal(normalTelefon("070"), null);
  assert.equal(normalTelefon("+46 70 123 45 67 89 01"), null);
  assert.equal(normalTelefon("abc"), null);
});

test("c/o och rabattkod är frivilliga men prövas när de finns", () => {
  const ok = provaKassa({ ...fullt, co: "Berg", kupong: " SPARA5 " });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.varden.co, "Berg");
    assert.equal(ok.varden.kupong, "SPARA5");
  }
  const fel = provaKassa({ ...fullt, co: "x".repeat(61), kupong: "SPARA<5>" });
  assert.equal(fel.ok, false);
  if (!fel.ok) {
    assert.ok(fel.fel.co);
    assert.equal(fel.fel.kupong, KASSA_TEXT.kupong.fel);
  }
});

test("blanksteg och radbrytningar i namn och adress slås ihop", () => {
  const r = provaKassa({ ...fullt, fornamn: "  Anna \n Maria ", gata: "Storgatan\t1 " });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.varden.fornamn, "Anna Maria");
    assert.equal(r.varden.gata, "Storgatan 1");
  }
});
