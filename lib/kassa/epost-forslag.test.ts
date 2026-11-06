import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { KANDA_DOMANER, avstand, epostForslag } from "./epost-forslag.ts";

describe("avstand", () => {
  it("räknar infoga, ta bort, byta och byta plats som ett", () => {
    assert.equal(avstand("gmail", "gmail"), 0);
    assert.equal(avstand("gmal", "gmail"), 1);
    assert.equal(avstand("gmaill", "gmail"), 1);
    assert.equal(avstand("gmeil", "gmail"), 1);
    assert.equal(avstand("gmial", "gmail"), 1);
    assert.equal(avstand("", "abc"), 3);
    assert.equal(avstand("hotmail", "outlook"), 6);
  });
});

describe("epostForslag", () => {
  it("rättar stavfel i namnet på en känd tjänst", () => {
    assert.equal(epostForslag("anna@gmial.com"), "anna@gmail.com");
    assert.equal(epostForslag("anna@gamil.com"), "anna@gmail.com");
    assert.equal(epostForslag("anna@gmal.com"), "anna@gmail.com");
    assert.equal(epostForslag("anna@hotmial.se"), "anna@hotmail.se");
    assert.equal(epostForslag("anna@hotnail.com"), "anna@hotmail.com");
    assert.equal(epostForslag("anna@outlok.com"), "anna@outlook.com");
    assert.equal(epostForslag("anna@iclod.com"), "anna@icloud.com");
  });

  it("rättar en felskriven toppdomän och en saknad punkt", () => {
    assert.equal(epostForslag("anna@gmail.con"), "anna@gmail.com");
    assert.equal(epostForslag("anna@gmail.co"), "anna@gmail.com");
    assert.equal(epostForslag("anna@gmial.con"), "anna@gmail.com");
    assert.equal(epostForslag("anna@hotmail.s"), "anna@hotmail.se");
    assert.equal(epostForslag("anna@bredband.ne"), "anna@bredband.net");
    assert.equal(epostForslag("anna@gmailcom"), "anna@gmail.com");
  });

  it("rättar domäner som inte finns men ofta skrivs", () => {
    assert.equal(epostForslag("anna@gmail.se"), "anna@gmail.com");
    assert.equal(epostForslag("anna@icloud.se"), "anna@icloud.com");
  });

  it("lämnar delen före @ som den är och skriver domänen med gemener", () => {
    assert.equal(epostForslag("  Anna.Berg+kassa@Gmail.Con "), "Anna.Berg+kassa@gmail.com");
  });

  it("ger aldrig förslag på en känd tjänst", () => {
    for (const d of KANDA_DOMANER) assert.equal(epostForslag(`anna@${d}`), null, d);
    assert.equal(epostForslag("anna@GMAIL.COM"), null);
  });

  it("ger aldrig förslag på riktiga adresser hos andra tjänster och företag", () => {
    for (const d of ["hotmail.dk", "hotmail.no", "live.dk", "yahoo.co.uk", "gmx.se", "fyndplats.com", "foretaget.se", "telia.se", "bredband2.com", "kth.se", "love.se", "web.de"]) {
      assert.equal(epostForslag(`anna@${d}`), null, d);
    }
  });

  it("gissar inte när två tjänster är lika troliga", () => {
    const kanda = ["abcdef.com", "abcdeg.com"];
    assert.equal(epostForslag("anna@abcdex.com", kanda), null);
    assert.equal(epostForslag("anna@abcdfe.com", kanda), "anna@abcdef.com");
  });

  it("ger inget förslag på det som inte är en adress", () => {
    for (const v of ["", "anna", "@gmail.com", "anna@", "anna @gmial.com", "anna@gmial .com"]) assert.equal(epostForslag(v), null, v);
  });
});
