// CDON-listans koder (lib/feed/gtin-cdon.ts, 2026-11-15). Kör:
// node --test --experimental-strip-types lib/feed/gtin-cdon.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { giltigtGtin13, giltigtPrisjaktId } from "./prisjakt.ts";
import { GTIN_CDON } from "./gtin-cdon.ts";

/** Spärr mot att något annat än listan hamnar i kartan. Går man över den ska provet ändras med avsikt. */
const TAK = 5000;

describe("GTIN_CDON (Leonards CDON-lista)", () => {
  const poster = Object.entries(GTIN_CDON);

  it("har listans koder: fler än 3 000 och under taket", () => {
    assert.ok(poster.length > 3000, `för få poster: ${poster.length}`);
    assert.ok(poster.length <= TAK, `för många poster: ${poster.length}`);
  });

  it("varje nyckel är ett Wix variant-id som Prisjakt godtar", () => {
    for (const [id] of poster) {
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, id);
      assert.equal(giltigtPrisjaktId(id), true, id);
    }
  });

  it("varje kod är en GTIN-13 med rätt kontrollsiffra (en UPC-12 med inledande nolla)", () => {
    for (const [id, kod] of poster) assert.equal(giltigtGtin13(kod), true, `${id} ${kod}`);
  });

  it("ingen kod står på två varianter", () => {
    const koder = poster.map(([, kod]) => kod);
    assert.equal(new Set(koder).size, koder.length);
  });

  it("kontorsstolen som Prisjakt lade på en annan vara är inte med, och inte heller dess kod", () => {
    assert.equal(Object.hasOwn(GTIN_CDON, "3921d391-dbaf-45d4-8710-a0cdb587a4bc"), false);
    assert.equal(Object.values(GTIN_CDON).includes("4255826823975"), false);
  });

  it("filen har bara poster av formen id → kod: inga titlar, artikelnummer eller adresser (repot är publikt)", () => {
    const kalla = readFileSync(new URL("./gtin-cdon.ts", import.meta.url), "utf8");
    const rader = kalla.split("\n");
    const postRader = rader.filter((rad) => /^\s*"/.test(rad));
    for (const rad of postRader) assert.match(rad, /^ {2}"[0-9a-f-]{36}": "\d{13}",$/, rad);
    // Varje rad är en post, så en dubblettnyckel (som tyst skulle skrivas över) syns som för få nycklar.
    assert.equal(postRader.length, poster.length, "en nyckel förekommer två gånger");
    // Allt annat är kommentarer, tomma rader eller kartans början och slut.
    for (const rad of rader) {
      if (/^\s*"/.test(rad) || rad === "" || rad.startsWith("//")) continue;
      assert.ok(rad === "export const GTIN_CDON: Readonly<Record<string, string>> = {" || rad === "};", rad);
    }
    assert.doesNotMatch(kalla, /https?:\/\//, "en webbadress hör inte hemma i filen");
    assert.doesNotMatch(kalla, /\b\d{3}-\d{3}[A-Z]/, "ser ut som ett leverantörsartikelnummer");
  });
});
