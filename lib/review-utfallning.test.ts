// ☠️ "VISA MER" FÅR BARA FINNAS DÄR DET FINNS MER ATT VISA.
//
// Knappen visades för varje recension över 320 tecken. På en dator ryms det på
// tre rader, under klampen på fem, och knappen fällde ut text som redan syntes
// (Leonards rapport 2026-10-12). Regeln bor i lib/review-utfallning.ts, och
// komponenten mäter stycket i webbläsaren. Den här filen låser båda: regeln med
// värden, och att komponenten faktiskt mäter, med ett källkodsprov.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  KLAMP_FRAN_TECKEN,
  klamppas,
  klampenDoljer,
  visaUtfallningsknapp,
} from "./review-utfallning.ts";

test("en kort text klamppas inte och får ingen knapp", () => {
  const text = "a".repeat(KLAMP_FRAN_TECKEN);
  assert.equal(klamppas(text), false);
  for (const doljer of [null, true, false]) {
    assert.equal(visaUtfallningsknapp({ lang: false, utfalld: false, doljer }), false);
  }
});

test("en lång text klamppas", () => {
  assert.equal(klamppas("a".repeat(KLAMP_FRAN_TECKEN + 1)), true);
});

test("☠️ en lång text som ryms i klampen får ingen knapp", () => {
  // Datorfallet: 330 tecken på tre rader, klampen på fem döljer ingenting.
  assert.equal(visaUtfallningsknapp({ lang: true, utfalld: false, doljer: false }), false);
});

test("en lång text som klampen döljer får Visa mer", () => {
  assert.equal(visaUtfallningsknapp({ lang: true, utfalld: false, doljer: true }), true);
});

test("innan mätningen visas knappen som servern renderade den", () => {
  // Servern kan inte mäta. En lång text på mobilen ska inte få knappen sent.
  assert.equal(visaUtfallningsknapp({ lang: true, utfalld: false, doljer: null }), true);
});

test("en utfälld text behåller Visa mindre, vad mätningen än sa", () => {
  for (const doljer of [null, true, false]) {
    assert.equal(visaUtfallningsknapp({ lang: true, utfalld: true, doljer }), true);
  }
});

test("klampen döljer något först när innehållet är högre än rutan", () => {
  assert.equal(klampenDoljer({ scrollHeight: 66, clientHeight: 66 }), false);
  // En pixel är avrundning, inte en dold rad.
  assert.equal(klampenDoljer({ scrollHeight: 67, clientHeight: 66 }), false);
  assert.equal(klampenDoljer({ scrollHeight: 132, clientHeight: 110 }), true);
});

test("☠️ ProductReviews mäter stycket och låter regeln avgöra knappen", () => {
  const kod = readFileSync(join(process.cwd(), "components/ProductReviews.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");
  assert.match(kod, /visaUtfallningsknapp\(/, "knappen avgörs inte av visaUtfallningsknapp");
  assert.match(kod, /klampenDoljer\(/, "stycket mäts inte (klampenDoljer)");
  assert.match(kod, /new ResizeObserver\(/, "ingen ny mätning när bredden ändras");
  assert.doesNotMatch(
    kod,
    /\.text\.length\s*>\s*\d+/,
    "komponenten räknar tecken själv igen. Teckenantalet avgör bara klampen, i lib/review-utfallning.ts",
  );
});
