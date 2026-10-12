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

test("klampen döljer något först när texten är högre än klampen", () => {
  assert.equal(klampenDoljer({ hel: 66, klampad: 66 }), false);
  // En pixel är avrundning, inte en dold rad.
  assert.equal(klampenDoljer({ hel: 67, klampad: 66 }), false);
  assert.equal(klampenDoljer({ hel: 132, klampad: 110 }), true);
});

// Källkodsprovet. Varje påstående är prövat genom att återinföra felet det
// gäller: den gamla filen, en knapp som räknar tecken igen (`|| text.length >
// 320`), mätningen som ignoreras (`doljer: null`) eller aldrig sparas,
// useEffect i stället för useLayoutEffect, mätning med scrollHeight i klampen
// och ett borttaget fokusskydd. Var och en fäller.
test("☠️ ProductReviews mäter stycket och låter regeln avgöra knappen", () => {
  const kod = readFileSync(join(process.cwd(), "components/ProductReviews.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");
  assert.match(
    kod,
    /visaUtfallningsknapp\(\{\s*lang,\s*utfalld,\s*doljer\s*\}\)/,
    "knappen avgörs inte av visaUtfallningsknapp med det uppmätta värdet",
  );
  assert.match(
    kod,
    /const (\w+) = klampenDoljer\(helOchKlampad\(p\)\)[\s\S]*?setDoljer\(\1\)/,
    "mätningen sparas inte (klampenDoljer → setDoljer)",
  );
  assert.match(kod, /useLayoutEffect\(/, "mätningen görs inte innan webbläsaren ritar");
  assert.match(kod, /new ResizeObserver\(/, "ingen ny mätning när bredden ändras");
  assert.match(
    kod,
    /classList\.remove\("rev-text-klamp"\)[\s\S]*?scrollHeight[\s\S]*?classList\.add\("rev-text-klamp"\)/,
    "textens hela höjd mäts inte utan klamp. scrollHeight i klampen beror på hur webbläsaren räknar dolda rader",
  );
  assert.match(
    kod,
    /document\.activeElement === knappRef\.current\) p\.focus\(/,
    "fokus flyttas inte till stycket när en fokuserad knapp tas bort",
  );
  assert.match(kod, /tabIndex=\{-1\}/, "stycket kan inte ta emot fokus");
  assert.doesNotMatch(
    kod,
    /\btext\.length\s*>/,
    "komponenten räknar tecken själv igen. Teckenantalet avgör bara klampen, i lib/review-utfallning.ts",
  );
});
