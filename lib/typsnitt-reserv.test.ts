// Reservtypsnitten för Fraunces: samma mått som Nexts egen reserv, för de
// enheter som saknar Times New Roman (Linux och Android). Se app/globals.css.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const matt = JSON.parse(readFileSync(new URL("../node_modules/next/dist/server/capsize-font-metrics.json", import.meta.url), "utf8"));

// Samma formel som next/dist/server/font-utils.js (calculateSizeAdjustValues).
const pct = (v: number) => Math.abs(v * 100).toFixed(2);
function overrides(reserv: string) {
  const f = matt.fraunces, r = matt[reserv];
  const size = (f.xWidthAvg / f.unitsPerEm) / (r.xWidthAvg / r.unitsPerEm);
  return { ascent: pct(f.ascent / (f.unitsPerEm * size)), descent: pct(f.descent / (f.unitsPerEm * size)), lineGap: pct(f.lineGap / (f.unitsPerEm * size)), size: pct(size) };
}
function regel(familj: string) {
  const m = css.match(new RegExp(`@font-face\\{font-family:"${familj}";([^}]*)\\}`));
  assert.ok(m, `@font-face för ${familj} saknas`);
  const v = (namn: string) => (m[1].match(new RegExp(`${namn}:([0-9.]+)%`)) || [])[1];
  return { src: m[1].match(/src:([^;]*)/)![1], ascent: v("ascent-override"), descent: v("descent-override"), lineGap: v("line-gap-override"), size: v("size-adjust") };
}

test("Fraunces Reserv har Times mått: Times New Roman först (ersätter Nexts egen reserv), sedan Liberation Serif och Tinos (Linux, där Lighthouse mäter)", () => {
  const r = regel("Fraunces Reserv");
  assert.deepEqual({ ascent: r.ascent, descent: r.descent, lineGap: r.lineGap, size: r.size }, overrides("timesNewRoman"));
  assert.deepEqual(overrides("tinos"), overrides("timesNewRoman")); // Tinos och Liberation Serif har Times bredd
  assert.ok(r.src.startsWith('local("Times New Roman")'), r.src);
  for (const namn of ['local("Liberation Serif")', 'local("LiberationSerif")', 'local("Tinos")']) assert.ok(r.src.includes(namn), namn);
});

test("Fraunces Reserv N har Noto Serifs mått (Android)", () => {
  const r = regel("Fraunces Reserv N");
  assert.deepEqual({ ascent: r.ascent, descent: r.descent, lineGap: r.lineGap, size: r.size }, overrides("notoSerif"));
  for (const namn of ['local("Noto Serif")', 'local("NotoSerif-Regular")']) assert.ok(r.src.includes(namn), namn);
});

test("båda reserverna står i Fraunces fallback-lista, i den ordningen och med enkla citattecken", () => {
  assert.match(layout, /fallback: \["'Fraunces Reserv'", "'Fraunces Reserv N'"\],/);
  // Turbopack lägger listan i en JS-sträng med dubbla citattecken: ett dubbelt här fällde bygget (2026-11-08).
  const lista = layout.match(/fallback: \[([^\]]*)\]/)![1];
  assert.doesNotMatch(lista.replace(/^"|"$/g, "").replace(/", "/g, ""), /"/);
});
