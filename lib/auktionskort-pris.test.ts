// Auktionskortets pris får aldrig klippas (Leonard 2026-11-04: siffrorna
// klipptes på mobilen). Priset är ett räkneverk med overflow:hidden, och en
// sådan flexdel krymper under sitt innehåll om den får. Provet läser
// app/globals.css och fäller om priset kan krympa igen eller om raden inte får
// brytas när "30-dagarspris …" inte ryms bredvid.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** Deklarationerna i den första regeln med exakt den här väljaren, utan media. */
function regel(valjare: string): string {
  const i = css.indexOf(`\n${valjare}{`);
  assert.ok(i >= 0, `${valjare} saknas i globals.css`);
  const start = i + valjare.length + 2;
  return css.slice(start, css.indexOf("}", start));
}

test("räkneverket i auktionskortet krymper aldrig", () => {
  assert.match(regel(".auction-price"), /flex:none/);
});

test("prisraden får brytas, så att 30-dagarspriset hamnar på en egen rad när det inte ryms", () => {
  assert.match(regel(".auction-price-row"), /flex-wrap:wrap/);
});

test("det tidigare priset får brytas mellan uttrycket och beloppet, men aldrig inne i dem", () => {
  assert.doesNotMatch(regel(".auction-old"), /white-space:nowrap/);
  assert.match(css, /\.auction-old \.tidigare-pris-uttryck,\.auction-old s\{white-space:nowrap\}/);
});
