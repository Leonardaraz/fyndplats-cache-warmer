// lib/carrier-mask.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// HÅRD INVARIANT: AliExpress/Cainiao-identiteten får ALDRIG passera maskeringen
// och nå kunden. Detta är den enda kvarvarande maskeringsregeln (produkterna
// skickas från EU). Lås den.

import test from "node:test";
import assert from "node:assert/strict";
import {
  DPD_NUMMER,
  maskCarrier,
  maskCarrierOrUndefined,
  MASKED_CARRIER,
  transportorAvNummer,
  transportorForNummer,
  transportorRad,
  transportorText,
} from "./carrier-mask.ts";
import { detect17TrackCarrier } from "./track17.ts";

test("AliExpress/Cainiao identity is ALWAYS masked", () => {
  for (const name of [
    "Cainiao",
    "AliExpress",
    "AliExpress Standard Shipping",
    "Cainiao Super Economy",
    "Alibaba",
    "4PX",
    "Yanwen",
    "China Post",
    "AliExpress Logistics",
  ]) {
    assert.equal(maskCarrier(name), MASKED_CARRIER, `${name} must mask to ${MASKED_CARRIER}`);
    assert.equal(maskCarrierOrUndefined(name), undefined, `${name} must be undefined (carrier row hidden)`);
  }
});

test("Known EU carriers pass through with a normalised label", () => {
  const cases: Array<[string, string]> = [
    ["PostNord Sweden", "PostNord"],
    ["DHL eCommerce", "DHL"],
    ["DPD", "DPD"],
    ["Bring", "Bring"],
    ["Budbee", "Budbee"],
    ["Instabox", "Instabox"],
    ["DB Schenker", "Schenker"],
    ["PostNL", "PostNL"],
    ["InPost", "InPost"],
    ["Colissimo", "Colissimo"],
    ["Deutsche Post", "Deutsche Post"],
    ["Royal Mail", "Royal Mail"],
    ["Evri", "Evri"],
    ["Bpost", "Bpost"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(maskCarrier(input), expected, `${input} → ${expected}`);
    assert.equal(maskCarrierOrUndefined(input), expected, `${input} → ${expected}`);
  }
});

test("Empty/unknown carrier never leaks", () => {
  assert.equal(maskCarrier(""), "");
  assert.equal(maskCarrierOrUndefined(""), undefined);
  assert.equal(maskCarrierOrUndefined("Some Random Courier AB"), undefined);
  assert.equal(maskCarrier(null), "");
  assert.equal(maskCarrier(undefined), "");
});

test("DHL-nummer från Tyskland visas som DHL, med PostNord som sista led", () => {
  assert.deepEqual(transportorForNummer("CC145357991DE", "PostNord"), { carrier: "DHL", sistaLed: "PostNord" });
  assert.deepEqual(transportorForNummer("cc145357991de", ""), { carrier: "DHL" });
  assert.deepEqual(transportorForNummer("CC145357991DE", MASKED_CARRIER), { carrier: "DHL" });
  // Svenska S10 och övriga nummer lämnas som 17TRACK sa.
  assert.deepEqual(transportorForNummer("RR123456789SE", "PostNord"), { carrier: "PostNord" });
});

// DPD lämnar över till PostNord i Sverige med samma nummer (Leonard
// 2026-10-15). 42 av 46 DPD-paket stod som "Postnord" i Wix, så numret avgör.
// Numren är påhittade.
test("DPD-nummer: DPD, med PostNord som sista led, vad källan än kallar det", () => {
  const dpd = { carrier: "DPD", sistaLed: "PostNord" };
  assert.deepEqual(transportorForNummer("01234567890123", "DPD"), dpd);
  assert.deepEqual(transportorForNummer("01234567890123", "PostNord"), dpd);
  assert.deepEqual(transportorForNummer("01234567890123", ""), dpd);
  assert.deepEqual(transportorForNummer("01234567890123", MASKED_CARRIER), dpd);
  // AliExpress-källans neutrala ord för "Seller Shipping …" (lib/ae-source.ts).
  assert.deepEqual(transportorForNummer("01234567890123", "Transportör"), dpd);
  assert.deepEqual(transportorForNummer(" 01234567890123 ", "PostNord"), dpd);
  // Säger källan DPD gäller det även när numret har en annan form.
  assert.deepEqual(transportorForNummer("ABC123", "DPD"), dpd);
});

test("DPD-formen tar inte över ett uttryckligt annat bud", () => {
  // Mönstret är bara prövat på DPD:s egna paket.
  assert.deepEqual(transportorForNummer("01234567890123", "GLS"), { carrier: "GLS" });
  assert.deepEqual(transportorForNummer("01234567890123", "DHL"), { carrier: "DHL" });
  assert.deepEqual(transportorForNummer("01234567890123", "Bring"), { carrier: "Bring" });
});

test("ett neutralt ord blir aldrig sista led", () => {
  // Förut: "Levereras med DHL, delas ut av Transportör i Sverige".
  assert.deepEqual(transportorForNummer("CC123456789DE", "Transportör"), { carrier: "DHL" });
  assert.deepEqual(transportorForNummer("CC123456789DE", "Fraktpartner"), { carrier: "DHL" });
  // Ett annat nummer behåller källans ord, som förut.
  assert.deepEqual(transportorForNummer("12345678901", "Transportör"), { carrier: "Transportör" });
});

test("PostNords egna nummer förblir PostNord", () => {
  // Parcel connect: 14 siffror som börjar på 07 (lib/track17.ts).
  assert.deepEqual(transportorForNummer("07123456789012", "PostNord"), { carrier: "PostNord" });
  // 13 och 15 siffror är inte DPD-formen.
  assert.deepEqual(transportorForNummer("0123456789012", "PostNord"), { carrier: "PostNord" });
  assert.deepEqual(transportorForNummer("012345678901234", "PostNord"), { carrier: "PostNord" });
  assert.deepEqual(transportorForNummer("12345678901", "GLS"), { carrier: "GLS" });
});

test("transportorText: samma ord i mejlen som på /sparning", () => {
  const dpd = "DPD, delas ut av PostNord i Sverige";
  assert.equal(transportorText("01234567890123", "PostNord"), dpd);
  assert.equal(transportorText("01234567890123", "DPD"), dpd);
  assert.equal(transportorText("01234567890123", undefined), dpd, "numret räcker");
  assert.equal(transportorText(" 01234567890123 ", null), dpd);
  assert.equal(transportorText("CC123456789DE", "PostNord"), "DHL, delas ut av PostNord i Sverige");
  assert.equal(transportorText("07123456789012", "PostNord"), "PostNord");
  assert.equal(transportorText("12345678901", "GLS"), "GLS");
  assert.equal(transportorText(null, "GLS"), "GLS");
  assert.equal(transportorText(undefined, "Budbee"), "Budbee");
});

test("transportorRad: samma ord på /sparning som i mejlen", () => {
  assert.equal(transportorRad("DPD", "PostNord"), "DPD, delas ut av PostNord i Sverige");
  assert.equal(transportorRad("GLS", "DSV"), "GLS, delas ut av DSV i Sverige");
  assert.equal(transportorRad("GLS"), "GLS");
  assert.equal(transportorRad("GLS", ""), "GLS");
  // Mejlets rad är sidans rad för samma paket.
  const t = transportorForNummer("01234567890123", "PostNord");
  assert.equal(transportorText("01234567890123", "PostNord"), transportorRad(t.carrier, t.sistaLed));
});

test("transportorText: ingen rad när varken bud eller nummer säger något", () => {
  assert.equal(transportorText("12345678901", undefined), undefined);
  assert.equal(transportorText(null, undefined), undefined);
  assert.equal(transportorText("", ""), undefined);
  // Ett DHL-nummer utan bud gav ingen rad förut heller.
  assert.equal(transportorText("CC123456789DE", undefined), undefined);
});

test("DPD-mönstret är samma som 17TRACK-registreringens (lib/track17.ts)", () => {
  // Två kopior av samma mönster, eftersom ingen av filerna kan importera den
  // andra under node --test. Det här fäller om de glider isär.
  const prov = [
    "01234567890123",
    "01999999999999",
    "01000000000000",
    "0123456789012",
    "012345678901234",
    "02234567890123",
    "07123456789012",
    "10234567890123",
    "1023456789012A",
    "0123456789012A",
    "RR123456789SE",
    "CC123456789DE",
    "12345678901",
    "YZC00000",
    "",
  ];
  for (const nummer of prov) {
    const dpdHos17 = detect17TrackCarrier(nummer)?.name === "DPD";
    assert.equal(DPD_NUMMER.test(nummer), dpdHos17, nummer);
  }
});

test("transportorAvNummer: UPS, DPD och PostNord på formen, inget annat", () => {
  // UPS:s eget exempelnummer, inget riktigt paket.
  assert.equal(transportorAvNummer("1Z999AA10123456784"), "UPS");
  assert.equal(transportorAvNummer(" 1z999aa10123456784 "), "UPS");
  assert.equal(transportorAvNummer("01234567890123"), "DPD");
  assert.equal(transportorAvNummer("RR123456789SE"), "PostNord");
  assert.equal(transportorAvNummer("07123456789012"), "PostNord");
  // DHL:s S10 från Tyskland, GLS-lika nummer och fel längd avgör inget.
  for (const nummer of ["CC123456789DE", "12345678901", "YZC00000", "1Z999AA1012345678", "1Z999AA101234567845", ""]) {
    assert.equal(transportorAvNummer(nummer), undefined, nummer);
  }
});

test("transportorAvNummer: PostNord-formerna är samma som 17TRACK-registreringens", () => {
  // Två kopior av samma mönster, som DPD_NUMMER ovan. Det här fäller om de
  // glider isär.
  const prov = [
    "RR123456789SE",
    "LX000000000SE",
    "RR12345678SE",
    "RR1234567890SE",
    "R1123456789SE",
    "RR123456789DE",
    "07123456789012",
    "07000000000000",
    "0712345678901",
    "071234567890123",
    "08123456789012",
    "01234567890123",
    "1Z999AA10123456784",
  ];
  for (const nummer of prov) {
    const postnordHos17 = detect17TrackCarrier(nummer)?.key === 19241;
    assert.equal(transportorAvNummer(nummer) === "PostNord", postnordHos17, nummer);
  }
});
