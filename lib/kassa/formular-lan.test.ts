// Länet i leveransadressen (lib/kassa/formular.ts).
// Kör: node --test --experimental-strip-types lib/kassa/formular-lan.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { LAN, arLanKod, lanFranPostnr, lanFranText, lanNamn } from "./formular.ts";

test("21 län med unika koder i ISO 3166-2:SE och svenska namn, i bokstavsordning", () => {
  assert.equal(LAN.length, 21);
  assert.equal(new Set(LAN.map((l) => l.kod)).size, 21);
  for (const l of LAN) {
    assert.match(l.kod, /^SE-[A-Z]{1,2}$/);
    assert.match(l.namn, / län$/);
  }
  const namn = LAN.map((l) => l.namn);
  assert.deepEqual(namn, [...namn].sort((a, b) => a.localeCompare(b, "sv")));
});

test("postnumret ger länet, också i blandzonerna", () => {
  const fall: [string, string][] = [
    ["111 48", "SE-AB"], // Stockholm
    ["76131", "SE-AB"], // Norrtälje
    ["411 01", "SE-O"], // Göteborg
    ["434 41", "SE-N"], // Kungsbacka: Göteborgsprefix men Halland
    ["302 50", "SE-N"], // Halmstad
    ["211 19", "SE-M"], // Malmö
    ["285 31", "SE-G"], // Markaryd: Skåneprefix men Kronoberg
    ["293 31", "SE-K"], // Olofström
    ["371 30", "SE-K"], // Karlskrona
    ["553 20", "SE-F"], // Jönköping
    ["581 83", "SE-E"], // Linköping
    ["621 55", "SE-I"], // Visby
    ["611 30", "SE-D"], // Nyköping
    ["652 25", "SE-S"], // Karlstad
    ["702 10", "SE-T"], // Örebro
    ["722 12", "SE-U"], // Västerås
    ["753 10", "SE-C"], // Uppsala
    ["791 71", "SE-W"], // Falun
    ["803 20", "SE-X"], // Gävle
    ["831 30", "SE-Z"], // Östersund
    ["851 70", "SE-Y"], // Sundsvall
    ["903 25", "SE-AC"], // Umeå
    ["972 31", "SE-BD"], // Luleå
  ];
  for (const [pn, kod] of fall) assert.equal(lanFranPostnr(pn), kod, pn);
});

test("ett postnummer som inte är svenskt ger inget län", () => {
  for (const v of ["", "1234", "123456", "01234", "abcde", null, undefined, 12345, "322 00"]) assert.equal(lanFranPostnr(v), null, String(v));
});

test("Googles och kundens länsnamn ger koden", () => {
  const fall: [string, string][] = [
    ["Hallands län", "SE-N"],
    ["Halland", "SE-N"],
    ["Västra Götalands län", "SE-O"],
    ["vastra gotaland", "SE-O"],
    ["Skåne län", "SE-M"],
    ["Skåne", "SE-M"],
    ["Stockholms län", "SE-AB"],
    ["Stockholm County", "SE-AB"],
    ["Örebro län", "SE-T"],
    ["Jönköpings län", "SE-F"],
    ["Dalarnas län", "SE-W"],
    ["Kalmar län", "SE-H"],
    ["Uppsala län", "SE-C"],
    ["SE-AC", "SE-AC"],
    ["se-bd", "SE-BD"],
  ];
  for (const [t, kod] of fall) assert.equal(lanFranText(t), kod, t);
  for (const l of LAN) assert.equal(lanFranText(l.namn), l.kod, l.namn);
});

test("okända namn och tomma värden ger inget län", () => {
  for (const v of ["", "  ", "Bavaria", "Oslo", "SE-Q", null, undefined, 3]) assert.equal(lanFranText(v), null, String(v));
});

test("koder och namn hör ihop", () => {
  assert.equal(arLanKod("SE-N"), true);
  assert.equal(arLanKod("SE-Q"), false);
  assert.equal(arLanKod(""), false);
  assert.equal(lanNamn("SE-N"), "Hallands län");
  assert.equal(lanNamn("SE-Q"), null);
});
