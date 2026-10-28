import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { arHemligPrisjaktFil, MIN_KODLANGD, prisjaktKod } from "./prisjakt-adress.ts";

// En påhittad kod. Den riktiga står bara i Vercel.
const KOD = "a".repeat(20) + "0123456789abcdef";

describe("prisjaktKod", () => {
  it("godtar en kod på minst 32 bokstäver och siffror", () => {
    assert.equal(prisjaktKod(KOD), KOD);
    assert.equal(prisjaktKod(` ${KOD} `), KOD);
  });

  it("ingen kod när variabeln saknas, är för kort eller bär andra tecken", () => {
    for (const v of [undefined, "", "x".repeat(MIN_KODLANGD - 1), `${KOD}/`, `${KOD}-x`, `${KOD}.xml`]) {
      assert.equal(prisjaktKod(v), null, String(v));
    }
  });
});

describe("arHemligPrisjaktFil", () => {
  it("bara exakt prisjakt-<kod>.xml", () => {
    assert.equal(arHemligPrisjaktFil(`prisjakt-${KOD}.xml`, KOD), true);
    for (const fil of [
      "prisjakt.xml",
      "google.xml",
      `prisjakt-${KOD}`,
      `prisjakt-${KOD}.xml.gz`,
      `prisjakt-${KOD.slice(1)}.xml`,
      `prisjakt-${KOD}x.xml`,
      `Prisjakt-${KOD}.xml`,
      `prisjakt-${KOD.toUpperCase()}.xml`,
      "",
    ]) {
      assert.equal(arHemligPrisjaktFil(fil, KOD), false, fil);
    }
  });

  it("utan kod finns ingen hemlig adress alls", () => {
    assert.equal(arHemligPrisjaktFil("prisjakt-.xml", null), false);
    assert.equal(arHemligPrisjaktFil(`prisjakt-${KOD}.xml`, null), false);
  });
});

// ☠️ Adressen får aldrig stå i repot (Leonard 2026-10-28). Testet letar efter
// något som ser ut som den i allt som checkas in.
describe("den hemliga adressen i repot", () => {
  const ROT = new URL("../../", import.meta.url).pathname;
  const HOPPA = new Set(["node_modules", ".next", ".git", ".vercel", "coverage"]);
  const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|mdx|yml|yaml|txt|xml|html|css|sql|sh|env)$/i;
  const MONSTER = /prisjakt-[A-Za-z0-9]{32,}\.xml/;

  function* filer(dir: string): Generator<string> {
    for (const namn of readdirSync(dir)) {
      if (HOPPA.has(namn)) continue;
      const vag = join(dir, namn);
      const st = statSync(vag);
      if (st.isDirectory()) yield* filer(vag);
      else if (TEXT.test(namn) && st.size < 5_000_000) yield vag;
    }
  }

  it("ingen fil bär en adress på formen prisjakt-<lång kod>.xml", () => {
    const trafar: string[] = [];
    for (const fil of filer(ROT)) {
      if (fil.endsWith("prisjakt-adress.test.ts")) continue;
      if (MONSTER.test(readFileSync(fil, "utf8"))) trafar.push(fil.slice(ROT.length));
    }
    assert.deepEqual(trafar, []);
  });

  it("bara den hemliga rutten hämtar artikelnumren, och inget annat flöde", () => {
    const las = (p: string) => readFileSync(join(ROT, p), "utf8");
    assert.match(las("app/feed/[fil]/route.ts"), /hamtaPrisjaktArtiklar/);
    for (const p of ["app/feed/google.xml/route.ts", "app/feed/pricerunner.xml/route.ts", "app/feed/prisjakt.xml/route.ts", "app/feed/products.xml/route.ts"]) {
      assert.doesNotMatch(las(p), /prisjakt-motor|hamtaPrisjaktArtiklar|<g:mpn>/, p);
    }
  });
});
