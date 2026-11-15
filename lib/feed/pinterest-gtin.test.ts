import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PINTEREST_GTIN, PINTEREST_GTIN_AOSOM, PINTEREST_GTIN_VEVOR } from "./pinterest-gtin.ts";
import { PRISJAKT_GTIN } from "./prisjakt-gtin.ts";
import { giltigtPinterestGtin } from "./pinterest.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("PINTEREST_GTIN", () => {
  it("har båda delarna, och ingen vara står i båda", () => {
    const v = Object.keys(PINTEREST_GTIN_VEVOR);
    const a = Object.keys(PINTEREST_GTIN_AOSOM);
    assert.ok(v.length > 0 && a.length > 0);
    assert.equal(Object.keys(PINTEREST_GTIN).length, v.length + a.length);
  });

  it("varje rad är ett variant-id och en kod med rätt kontrollsiffra", () => {
    for (const [id, kod] of Object.entries(PINTEREST_GTIN)) {
      assert.match(id, UUID, id);
      assert.equal(giltigtPinterestGtin(kod), true, `${id} ${kod}`);
    }
  });

  it("ingen kod står på två varor", () => {
    const koder = Object.values(PINTEREST_GTIN);
    assert.equal(new Set(koder).size, koder.length);
  });

  it("krockar aldrig med Prisjakt-kartan: samma vara har samma kod, och en kod hör till en vara", () => {
    const pjKod = new Map(Object.entries(PRISJAKT_GTIN).map(([id, kod]) => [kod, id]));
    for (const [id, kod] of Object.entries(PINTEREST_GTIN)) {
      if (Object.hasOwn(PRISJAKT_GTIN, id)) assert.equal(PRISJAKT_GTIN[id], kod, id);
      const annan = pjKod.get(kod);
      if (annan) assert.equal(annan, id, kod);
    }
  });

  it("filen bär bara variant-id och koder: inga adresser och inga leverantörsnummer (repot är publikt)", () => {
    const kalla = readFileSync(join(import.meta.dirname, "pinterest-gtin.ts"), "utf8");
    const postRader = kalla.split("\n").filter((rad) => /^\s*"/.test(rad));
    for (const rad of postRader) assert.match(rad, /^\s*"[0-9a-f-]{36}": "\d{12,13}",$/, rad);
    assert.equal(postRader.length, Object.keys(PINTEREST_GTIN).length, "en nyckel förekommer två gånger");
    assert.doesNotMatch(kalla, /https?:\/\//, "en webbadress hör inte hemma i filen");
    assert.doesNotMatch(kalla, /\b\d{3}-\d{3}[A-Z]/, "ser ut som ett leverantörsartikelnummer");
  });
});
