// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Rubriktypsnittet Newsreader (app/layout.tsx, app/typsnitt) och dess två
// reservtypsnitt (app/globals.css). Reserverna ger rubrikerna Newsreaders mått
// tills typsnittet har laddats, på enheter med Times New Roman (iPhone, Mac,
// Windows), Liberation Serif eller Tinos (Linux) och Noto Serif (Android).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const matt = JSON.parse(readFileSync(new URL("../node_modules/next/dist/server/capsize-font-metrics.json", import.meta.url), "utf8"));

// Newsreaders höjdmått per 2000 (hhea och OS/2 i app/typsnitt-filerna).
const ASCENT = 1470, DESCENT = 530, UPM = 2000;
// Uppmätt 2026-11-16: butikens rubriker i vikt 600 är så här mycket bredare i
// Newsreader (optisk storlek 40) än i Times New Roman.
const BREDD_MOT_TIMES = 1.1069;
// Newsreader ritas 6 % större än sin teckenstorlek (size-adjust i app/layout.tsx).
const STORLEK = 1.06;

const pct = (v: number) => Math.abs(v * 100).toFixed(2);
// Samma formel som next/dist/server/font-utils.js (calculateSizeAdjustValues).
// `bredd` är Newsreaders bredd mot reservens. Reserven förstoras med bredd × STORLEK;
// höjderna delas bara med bredden, eftersom STORLEK förstorar båda typsnitten lika.
const overrides = (bredd: number) => ({ ascent: pct(ASCENT / (UPM * bredd)), descent: pct(DESCENT / (UPM * bredd)), lineGap: "0.00", size: pct(bredd * STORLEK) });
const medelbredd = (namn: string) => matt[namn].xWidthAvg / matt[namn].unitsPerEm;

function regel(familj: string) {
  const m = css.match(new RegExp(`@font-face\\{font-family:"${familj}";([^}]*)\\}`));
  assert.ok(m, `@font-face för ${familj} saknas`);
  const v = (namn: string) => (m[1].match(new RegExp(`${namn}:([0-9.]+)%`)) || [])[1];
  return { src: m[1].match(/src:([^;]*)/)![1], ascent: v("ascent-override"), descent: v("descent-override"), lineGap: v("line-gap-override"), size: v("size-adjust") };
}
const nara = (a: string | undefined, b: string, vad: string) => assert.ok(a !== undefined && Math.abs(Number(a) - Number(b)) <= 0.011, `${vad}: ${a} mot ${b}`);

test("Newsreader Reserv har Times former och Newsreaders mått: Times New Roman först, sedan Liberation Serif och Tinos (Linux, där Lighthouse mäter)", () => {
  const r = regel("Newsreader Reserv");
  const v = overrides(BREDD_MOT_TIMES);
  nara(r.size, v.size, "size-adjust");
  nara(r.ascent, v.ascent, "ascent-override");
  nara(r.descent, v.descent, "descent-override");
  assert.equal(r.lineGap, "0.00");
  assert.equal(medelbredd("tinos"), medelbredd("timesNewRoman")); // Tinos och Liberation Serif har Times bredd
  assert.ok(r.src.startsWith('local("Times New Roman")'), r.src);
  for (const namn of ['local("Liberation Serif")', 'local("LiberationSerif")', 'local("Tinos")']) assert.ok(r.src.includes(namn), namn);
});

test("Newsreader Reserv N räknar om samma bredd till Noto Serif (Android)", () => {
  const r = regel("Newsreader Reserv N");
  const v = overrides(BREDD_MOT_TIMES * medelbredd("timesNewRoman") / medelbredd("notoSerif"));
  nara(r.size, v.size, "size-adjust");
  nara(r.ascent, v.ascent, "ascent-override");
  nara(r.descent, v.descent, "descent-override");
  for (const namn of ['local("Noto Serif")', 'local("NotoSerif-Regular")']) assert.ok(r.src.includes(namn), namn);
});

test("höjderna följer av bredden: ascent och descent är Newsreaders mått delat med regelns egen size-adjust", () => {
  for (const familj of ["Newsreader Reserv", "Newsreader Reserv N"]) {
    const r = regel(familj);
    const v = overrides(Number(r.size) / 100 / STORLEK);
    nara(r.ascent, v.ascent, `${familj} ascent`);
    nara(r.descent, v.descent, `${familj} descent`);
  }
});

test("båda reserverna står i typsnittets fallback-lista, i den ordningen och med enkla citattecken", () => {
  assert.match(layout, /fallback: \["'Newsreader Reserv'", "'Newsreader Reserv N'"\],/);
  // Turbopack lägger listan i en JS-sträng med dubbla citattecken: ett dubbelt här fällde bygget (2026-11-08).
  const lista = layout.match(/fallback: \[([^\]]*)\]/)![1];
  assert.doesNotMatch(lista.replace(/^"|"$/g, "").replace(/", "/g, ""), /"/);
  // Nexts egen reserv (Arial) är avstängd: annars får rubrikerna två reserver med olika mått.
  assert.match(layout, /adjustFontFallback: false,/);
  assert.ok(layout.includes(`declarations: [{ prop: "size-adjust", value: "${Math.round(STORLEK * 100)}%" }],`), "typsnittets size-adjust");
});

test("typsnittets två filer finns, är bantade och bär rubrikernas vikter", () => {
  for (const [fil, vikt, stil] of [["newsreader-rak.woff2", "500 700", "normal"], ["newsreader-kursiv.woff2", "500 600", "italic"]] as const) {
    assert.ok(layout.includes(`{ path: "./typsnitt/${fil}", weight: "${vikt}", style: "${stil}" }`), fil);
    const kB = statSync(new URL(`../app/typsnitt/${fil}`, import.meta.url)).size / 1024;
    // Hela Newsreader med båda axlarna väger 132 och 147 kB. De bantade filerna väger 36 och 38.
    assert.ok(kB > 20 && kB < 48, `${fil} väger ${kB.toFixed(0)} kB`);
  }
  assert.doesNotMatch(layout, /Fraunces\(|from "next\/font\/google";\nimport \{[^}]*Fraunces/);
});

test("inget i stilmallarna pekar längre på Fraunces reserver", () => {
  assert.doesNotMatch(css, /Fraunces Reserv/);
});
