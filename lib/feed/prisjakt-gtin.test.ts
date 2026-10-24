import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { giltigtGtin13, giltigtPrisjaktId } from "./prisjakt.ts";
import { PRISJAKT_GTIN, PRISJAKT_GTIN_URVAL, PRISJAKT_GTIN_UTOKNING } from "./prisjakt-gtin.ts";

/** Spärr mot att hela katalogen hamnar i kartan av misstag. Går man över den ska testet ändras med avsikt. */
const TAK = 1000;

describe("PRISJAKT_GTIN (testet med koder)", () => {
  const poster = Object.entries(PRISJAKT_GTIN);

  it("har poster, men håller sig under taket", () => {
    assert.ok(poster.length > 0, "kartan är tom");
    assert.ok(poster.length <= TAK, `för många poster för ett test: ${poster.length}`);
  });

  it("de 50 handgranskade varorna ligger kvar som en egen del", () => {
    assert.equal(Object.keys(PRISJAKT_GTIN_URVAL).length, 50);
  });

  it("urvalet och utökningen delar varken vara eller kod, och kartan är exakt deras summa", () => {
    const a = Object.entries(PRISJAKT_GTIN_URVAL);
    const b = Object.entries(PRISJAKT_GTIN_UTOKNING);
    assert.ok(b.length > 0, "utökningen är tom");
    assert.equal(poster.length, a.length + b.length, "samma vara står i båda delarna");
    assert.equal(new Set([...a, ...b].map(([, kod]) => kod)).size, a.length + b.length, "samma kod står i båda delarna");
  });

  it("varje nyckel är ett Wix variant-id som Prisjakt godtar", () => {
    for (const [id] of poster) {
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, id);
      assert.equal(giltigtPrisjaktId(id), true, id);
    }
  });

  it("varje kod är en GTIN-13 med rätt kontrollsiffra", () => {
    for (const [id, kod] of poster) assert.equal(giltigtGtin13(kod), true, `${id} ${kod}`);
  });

  it("ingen kod används på två varor", () => {
    const koder = poster.map(([, kod]) => kod);
    assert.equal(new Set(koder).size, koder.length);
  });

  it("filen innehåller bara poster av formen id → kod // titel: inga artikelnummer, adresser eller priser (repot är publikt)", () => {
    const kalla = readFileSync(new URL("./prisjakt-gtin.ts", import.meta.url), "utf8");
    const postRader = kalla.split("\n").filter((rad) => /^\s*"/.test(rad));
    for (const rad of postRader) {
      assert.match(rad, /^\s*"[0-9a-f-]{36}": "\d{13}",( \/\/ [^"]{0,120})?$/, rad);
    }
    // Varje rad är en post, så en dubblettnyckel i samma karta (som tyst skulle skrivas över) syns som för få nycklar.
    assert.equal(postRader.length, poster.length, "en nyckel förekommer två gånger");
    assert.doesNotMatch(kalla, /https?:\/\//, "en webbadress hör inte hemma i filen");
    assert.doesNotMatch(kalla, /\b\d{3}-\d{3}[A-Z]/, "ser ut som ett leverantörsartikelnummer");
  });
});
