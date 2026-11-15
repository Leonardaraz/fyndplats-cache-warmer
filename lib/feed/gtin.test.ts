// Vilken kod en variant får i Prisjakt- och PriceRunner-flödet (lib/feed/gtin.ts). Kör:
// node --test --experimental-strip-types lib/feed/gtin.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { byggFlodeGtin } from "./gtin.ts";
import { GTIN_CDON } from "./gtin-cdon.ts";
import { PRISJAKT_GTIN } from "./prisjakt-gtin.ts";

const A = "4006381333931";
const B = "4255826889629";
const C = "4255633581921";

describe("byggFlodeGtin", () => {
  it("CDON-listans kod vinner över dealproffsens för samma variant", () => {
    const k = byggFlodeGtin({ v1: A }, { v1: B });
    assert.deepEqual(k, { v1: { kod: A, kalla: "cdon" } });
  });

  it("dealproffsens kod står kvar där listan saknar varianten", () => {
    const k = byggFlodeGtin({ v1: A }, { v2: B });
    assert.deepEqual(k, { v1: { kod: A, kalla: "cdon" }, v2: { kod: B, kalla: "dealproffsen" } });
  });

  it("☠️ en dealproffsen-kod som listan har på en ANNAN variant tas bort: en kod står aldrig på två varor", () => {
    const k = byggFlodeGtin({ v1: A }, { v2: A, v3: C });
    assert.deepEqual(k, { v1: { kod: A, kalla: "cdon" }, v3: { kod: C, kalla: "dealproffsen" } });
  });

  it("utan listan är det dealproffsens koder, märkta som dealproffsens", () => {
    assert.deepEqual(byggFlodeGtin({}, { v2: B }), { v2: { kod: B, kalla: "dealproffsen" } });
    assert.deepEqual(byggFlodeGtin({}, {}), {});
  });
});

describe("kartan som flödena använder", () => {
  const kartan = byggFlodeGtin(GTIN_CDON, PRISJAKT_GTIN);
  const poster = Object.entries(kartan);

  it("har alla listans koder och dealproffsens där listan saknar varianten", () => {
    const cdonKoder = new Set(Object.values(GTIN_CDON));
    const kvar = Object.entries(PRISJAKT_GTIN).filter(([id, kod]) => !Object.hasOwn(GTIN_CDON, id) && !cdonKoder.has(kod));
    assert.equal(poster.length, Object.keys(GTIN_CDON).length + kvar.length);
    assert.ok(kvar.length > 0, "dealproffsens koder försvann helt");
  });

  it("ingen kod står på två varor", () => {
    const koder = poster.map(([, p]) => p.kod);
    assert.equal(new Set(koder).size, koder.length);
  });

  it("varje variant med en kod i listan får listans kod", () => {
    for (const [id, kod] of Object.entries(GTIN_CDON)) assert.deepEqual(kartan[id], { kod, kalla: "cdon" }, id);
  });
});

describe("☠️ Google-flödet läser aldrig en GTIN-karta", () => {
  it("app/feed/google.xml importerar ingen karta och skriver ingen g:gtin", () => {
    const rot = new URL("../../app/feed/google.xml/", import.meta.url);
    for (const fil of readdirSync(rot)) {
      if (!/\.(ts|tsx)$/.test(fil)) continue;
      const text = readFileSync(new URL(fil, rot), "utf8");
      assert.doesNotMatch(text, /gtin-cdon|flode-gtin|prisjakt-gtin|FLODE_GTIN|GTIN_CDON|PRISJAKT_GTIN|gtinUrval/, fil);
      assert.doesNotMatch(text, /<g:gtin>/, fil);
    }
  });
});
