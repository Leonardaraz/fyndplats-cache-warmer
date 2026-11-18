// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Kassans spärr mot e-postadresser som inte kan finnas (Leonard 2026-11-18,
// order 10233 med en adress som slutade på .con).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TOPPDOMANER, TOPPDOMANER_VERSION, epostDoman, epostFel, epostFelText, epostGiltig, epostToppdoman, faltGiltigt, provaKassa, rattToppdoman, toppdomanFinns } from "./formular.ts";
import { KANDA_DOMANER, TOPPDOMAN_FEL } from "./epost-forslag.ts";

describe("toppdomänerna är IANA:s hela lista", () => {
  it("är över 1 400, alla med gemener och utan dubbletter", () => {
    assert.ok(TOPPDOMANER.size > 1400, String(TOPPDOMANER.size));
    for (const t of TOPPDOMANER) assert.match(t, /^[a-z0-9-]{2,63}$/, t);
  });

  it("de vanliga finns, också de nya och de internationella", () => {
    for (const t of ["se", "com", "net", "org", "nu", "dk", "no", "fi", "de", "eu", "io", "co", "me", "info", "biz", "app", "dev", "shop", "online", "store", "tech", "xyz", "stockholm", "xn--p1ai"]) {
      assert.ok(toppdomanFinns(t), t);
    }
    assert.ok(toppdomanFinns("COM") && toppdomanFinns(" Se "));
  });

  it("felskrivna toppdomäner finns inte", () => {
    for (const t of ["con", "cmo", "comm", "vom", "xom", "coom", "c0m", "ocm", "cim", "clm", "cpm", "sse", "see", "nett", "ner", "ogr", "local", "invalid"]) assert.equal(toppdomanFinns(t), false, t);
  });

  it("varje känd e-posttjänst har en toppdomän som finns", () => {
    for (const d of KANDA_DOMANER) assert.ok(toppdomanFinns(d.slice(d.lastIndexOf(".") + 1)), d);
  });

  it("de felskrivna toppdomänerna är samma par som förslagen använder", () => {
    for (const [ratt, fel] of Object.entries(TOPPDOMAN_FEL)) for (const f of fel) assert.equal(rattToppdoman(f), ratt, f);
    assert.equal(rattToppdoman("qqq"), null);
  });

  it("listan är inte äldre än två år: hämta en ny från IANA och byt datumet", () => {
    assert.match(TOPPDOMANER_VERSION, /^\d{10}$/);
    const [ar, man, dag] = [TOPPDOMANER_VERSION.slice(0, 4), TOPPDOMANER_VERSION.slice(4, 6), TOPPDOMANER_VERSION.slice(6, 8)].map(Number);
    const alder = Date.now() - Date.UTC(ar, man - 1, dag);
    assert.ok(alder < 2 * 365 * 24 * 3600 * 1000, "toppdomänerna i lib/kassa/formular.ts är över två år gamla: nya toppdomäner saknas och riktiga kunder kan nekas");
  });
});

describe("epostFel", () => {
  it("vanliga adresser går igenom", () => {
    for (const a of ["anna@gmail.com", "Anna.Svensson@Hotmail.SE", "a.b-c_d+tagg@foretaget.se", "namn@mail.kommun.stockholm", "x@y.co", "kund@butik.shop", "o'brien@example.org", "namn@räksmörgås.se", "a@xn--rksmrgs-5wao1o.se", "n@domän.рф"]) {
      assert.equal(epostFel(a), null, a);
      assert.ok(epostGiltig(a));
    }
    assert.equal(epostFel("  anna@gmail.com  "), null);
  });

  it("en toppdomän som inte finns nekas, vilken tjänst det än är", () => {
    for (const a of ["anna@gmail.con", "anna@hotmail.cmo", "info@foretaget.con", "kund@exempel.sse", "a@b.comm", "a@b.local"]) assert.equal(epostFel(a), "toppdoman", a);
  });

  it("fel form nekas", () => {
    for (const a of ["", "anna", "anna@", "@gmail.com", "anna@gmail", "anna@@gmail.com", "an na@gmail.com", "anna@gmail..com", "anna@.gmail.com", "anna@gmail.com.", "anna@-gmail.com", "anna@gmail-.com", "anna@gm_ail.com", "anna@gmail.c", "anna@gmail.123", `${"a".repeat(65)}@gmail.com`, `a@${"b".repeat(250)}.com`]) {
      assert.equal(epostFel(a), "format", JSON.stringify(a));
    }
  });

  it("domänen och toppdomänen läses med gemener", () => {
    assert.equal(epostDoman(" Anna@Gmail.COM "), "gmail.com");
    assert.equal(epostToppdoman("anna@mail.foretaget.SE"), "se");
    assert.equal(epostDoman("anna"), null);
    assert.equal(epostToppdoman("anna@gmail"), null);
  });
});

describe("kassans formulär använder spärren, i webbläsaren och på servern", () => {
  const bas = { fornamn: "Anna", efternamn: "Svensson", telefon: "070 123 45 67", gata: "Storgatan 1", postnr: "152 44", ort: "Södertälje", lan: "SE-AB" };

  it("bocken visas inte och köpet går inte vidare med en adress på .con", () => {
    assert.equal(faltGiltigt("epost", "anna@gmail.con"), false);
    assert.equal(faltGiltigt("epost", "anna@gmail.com"), true);
    const prov = provaKassa({ ...bas, epost: "anna@gmail.con" });
    assert.equal(prov.ok, false);
    if (!prov.ok) assert.equal(prov.fel.epost, "Adressen slutar på .con, som inte finns. Menade du .com?");
  });

  it("en riktig adress ger inget fel på e-posten", () => {
    const prov = provaKassa({ ...bas, epost: "anna@gmail.com" });
    assert.equal(prov.ok ? undefined : prov.fel.epost, undefined);
  });

  it("texten säger vad som är fel, med den rätta toppdomänen när felet är känt", () => {
    assert.equal(epostFelText("anna@gmail.com"), null);
    assert.equal(epostFelText("info@foretaget.con"), "Adressen slutar på .con, som inte finns. Menade du .com?");
    assert.equal(epostFelText("anna@exempel.sse"), "Adressen slutar på .sse, som inte finns. Menade du .se?");
    assert.equal(epostFelText("anna@exempel.qqq"), "Adressen slutar på .qqq, som inte finns. Kontrollera stavningen.");
    assert.equal(epostFelText("anna@gmail"), "Skriv den som namn@exempel.se.");
    assert.equal(rattToppdoman("CON"), "com");
    assert.equal(rattToppdoman("se"), null);
  });

  it("en tom adress säger att den saknas, som förut", () => {
    const prov = provaKassa({ ...bas, epost: "" });
    assert.equal(prov.ok, false);
    if (!prov.ok) assert.equal(prov.fel.epost, "Skriv din e-postadress.");
  });
});
