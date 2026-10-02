// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Animationer som inte går på grafikkortet målar om sidan varje bildruta.
// Skimret bakom produktbilderna animerade background-position i 5,6 s och
// stod för ~2 400 målningar och ~0,9 s huvudtråd på /kategori/mobler (mobil,
// CPU 4×, 2026-10-01). Lighthouse räknar det arbetet in i LCP.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ingen keyframe animerar background-position", () => {
  const css = readFileSync("app/globals.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const keyframes = css.match(/@keyframes\s+[\w-]+\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g) ?? [];
  const dyra = keyframes.filter((k) => /background-position/.test(k)).map((k) => k.match(/@keyframes\s+([\w-]+)/)?.[1]);
  assert.deepEqual(dyra, [], `keyframes som animerar background-position: ${dyra.join(", ")}`);
});

test("oändliga animationer rör bara transform och opacity", () => {
  // Sidhuvudets auktionsprick pulserade med box-shadow utan slut och målade om
  // huvudet varje bildruta, 07–19 på varje sida (2026-10-01). Auktionssidans
  // egna effekter körs bara där och undantas.
  const css = readFileSync("app/globals.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const AUKTIONSSIDAN = new Set(["aPulseBadge", "aShine", "aBtnGlow"]);
  const kf = new Map<string, string>();
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)) kf.set(m[1], m[2]);
  const dyra: string[] = [];
  for (const [namn, kropp] of kf) {
    const props = new Set([...kropp.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]));
    const andra = [...props].filter((p) => p !== "transform" && p !== "opacity");
    const oandlig = new RegExp(`animation[^;{}]*\\b${namn}\\b[^;{}]*infinite|animation[^;{}]*infinite[^;{}]*\\b${namn}\\b`).test(css);
    if (oandlig && andra.length && !AUKTIONSSIDAN.has(namn)) dyra.push(`${namn} (${andra.join(", ")})`);
  }
  assert.deepEqual(dyra, []);
});
