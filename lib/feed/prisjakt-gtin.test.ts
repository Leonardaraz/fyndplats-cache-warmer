import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { giltigtGtin13, giltigtPrisjaktId } from "./prisjakt.ts";
import { PRISJAKT_GTIN } from "./prisjakt-gtin.ts";

describe("PRISJAKT_GTIN (testet med koder på ett litet urval)", () => {
  const poster = Object.entries(PRISJAKT_GTIN);

  it("har poster, men håller sig under testets tak på 100", () => {
    assert.ok(poster.length > 0, "kartan är tom");
    assert.ok(poster.length <= 100, `för många poster för ett test: ${poster.length}`);
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
});
