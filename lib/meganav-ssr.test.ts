// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Menyns underkategorier ska ligga i HTML:en, inte bara visas vid hovring.
//
// Mega-menyn renderade bara den hovrade panelen ({current && …}), och
// Googlebot hovrar aldrig. Mätt 2026-09-24: startsidan länkade till 0 av 105
// underkategorier, både i server-HTML och renderad i Chromium, och en
// produktsida till 1. Det enda som länkade dit var /butik (48 av 105) och
// avdelningssidornas Förfina-chips, som syns först när JS har kört.
// Sökordskategorierna (TV-bänkar, Golvlampor, Hantlar …) hade därmed ungefär
// samma interna PageRank som en medianprodukt.
//
// Komponenten är TSX och går inte att rendera med node --test, så provet läser
// källan. Det fäller om panelen blir villkorlig igen, eller om CSS:en ger
// panelen ett display-värde som slår ut hidden-attributet.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("components/meganav.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

test("en panel per avdelning renderas alltid, dold tills den hovras", () => {
  assert.match(
    src,
    /\{tree\.map\(\(m, i\) => \(\s*<div\s+key=\{m\.id\}\s+className="meganav-panel"[\s\S]{0,120}?hidden=\{active !== i\}/,
    "panelerna ska renderas för varje avdelning med hidden={active !== i}",
  );
  assert.match(src, /\{m\.subs\.map\(\(s\) => \(\s*<a key=\{s\.id\} className="meganav-sub" href=\{`\/kategori\/\$\{s\.slug\}`\}/);
});

test("panelen är inte villkorligt renderad", () => {
  // {current && (…)} är exakt formen som gömde länkarna för Google.
  assert.doesNotMatch(src, /\{\s*current\s*&&/, "panelen får inte bero på att någon hovrar");
  assert.doesNotMatch(src, /\{\s*active\s*!==\s*null\s*&&/, "panelen får inte bero på att någon hovrar");
});

test("CSS:en låter hidden dölja panelen", () => {
  // Ett display-värde på .meganav-panel slår ut hidden-attributet, och då
  // skulle alla tio paneler visas samtidigt.
  const regel = css.match(/\.meganav-panel\{([^}]*)\}/);
  assert.ok(regel, "hittade ingen .meganav-panel-regel");
  assert.doesNotMatch(regel[1], /display\s*:/);
  // Varje regel där panelen SJÄLV är det som stylas (sista ledet i väljaren),
  // inte .meganav-panel-head och andra barn.
  let sett = 0;
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    for (const valjare of m[1].split(",")) {
      const sista = valjare.trim().split(/\s+|>/).pop() || "";
      if (!/\.meganav-panel(?![\w-])/.test(sista) || /\[hidden\]/.test(sista)) continue;
      sett++;
      assert.doesNotMatch(m[2], /display\s*:/, `${valjare.trim()} sätter display och slår ut hidden`);
    }
  }
  assert.ok(sett >= 2, `väntade minst två regler för panelen, hittade ${sett}`);
});

test("byte mellan två öppna paneler animeras inte", () => {
  assert.match(css, /\.meganav\.byte \.meganav-panel\{animation:none\}/);
  assert.match(src, /setByte\(active !== null && active !== i\)/);
});
