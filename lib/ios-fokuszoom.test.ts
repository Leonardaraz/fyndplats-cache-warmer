// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Sökfältet zoomade in hela sidan på en iPhone (Leonard 2026-11-18).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { IOS_FOKUSZOOM_SKRIPT } from "./ios-fokuszoom.ts";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";
const START = "width=device-width, initial-scale=1";

type Tagg = { content: string };
function kor(nav: { userAgent: string; platform?: string; maxTouchPoints?: number }, taggar: Tagg[] = [{ content: START }]) {
  const lyssnare: { typ: string; f: () => void; val: unknown }[] = [];
  const dok = {
    taggar,
    querySelectorAll(v: string) {
      assert.equal(v, 'meta[name="viewport"]');
      return this.taggar;
    },
    addEventListener(typ: string, f: () => void, val: unknown) {
      lyssnare.push({ typ, f, val });
    },
  };
  new Function("navigator", "document", IOS_FOKUSZOOM_SKRIPT)(nav, dok);
  return { dok, lyssnare };
}
const TAK = `${START}, maximum-scale=1`;

describe("ingen inzoomning när ett fält får fokus på iOS", () => {
  it("en iPhone får maximum-scale=1 i sidans viewport vid första trycket, inte vid laddningen", () => {
    const { dok, lyssnare } = kor({ userAgent: IPHONE, platform: "iPhone", maxTouchPoints: 5 });
    // Före trycket är taggen orörd: annars lägger React in en egen bredvid.
    assert.equal(dok.taggar[0].content, START);
    assert.equal(lyssnare.length, 1);
    assert.equal(lyssnare[0].typ, "touchstart");
    assert.deepEqual(lyssnare[0].val, { passive: true, capture: true });
    lyssnare[0].f();
    assert.equal(dok.taggar[0].content, TAK);
  });

  it("en iPad som kallar sig Mac får det också", () => {
    const { dok, lyssnare } = kor({ userAgent: MAC, platform: "MacIntel", maxTouchPoints: 5 });
    lyssnare[0].f();
    assert.equal(dok.taggar[0].content, TAK);
  });

  it("Android och datorer rörs inte: där hade värdet stängt av nypzoomen", () => {
    for (const nav of [
      { userAgent: ANDROID, platform: "Linux armv81", maxTouchPoints: 5 },
      { userAgent: MAC, platform: "MacIntel", maxTouchPoints: 0 },
      { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36", platform: "Win32", maxTouchPoints: 0 },
    ]) {
      const { dok, lyssnare } = kor(nav);
      assert.equal(lyssnare.length, 0, nav.userAgent);
      assert.equal(dok.taggar[0].content, START);
    }
  });

  it("alla viewport-taggar får värdet, också en som React lagt in efteråt, och aldrig två gånger", () => {
    const { dok, lyssnare } = kor({ userAgent: IPHONE });
    lyssnare[0].f();
    lyssnare[0].f();
    assert.equal(dok.taggar[0].content, TAK);
    dok.taggar = [{ content: TAK }, { content: START }]; // React har ritat en ny tagg vid ett sidbyte
    lyssnare[0].f();
    assert.deepEqual(dok.taggar.map((t) => t.content), [TAK, TAK]);
  });

  it("en sida utan viewport-tagg ger inget fel", () => {
    const { lyssnare } = kor({ userAgent: IPHONE }, []);
    assert.doesNotThrow(() => lyssnare[0].f());
  });

  it("skriptet ligger i sidans mall, och sidans egen viewport sätter inget tak", () => {
    const mall = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    assert.match(mall, /<script dangerouslySetInnerHTML=\{\{ __html: IOS_FOKUSZOOM_SKRIPT \}\} \/>/);
    assert.doesNotMatch(mall, /maximumScale|maximum-scale|userScalable/);
  });
});
