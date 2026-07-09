// lib/search.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Skyddar de tre lagren i sök-matchningen: (1) exakt/stemming/compound, som fanns
// sen tidigare, (2) synonymer och (3) stavfelstolerans, tillagda 2026-07-09.
// Namnen efterliknar Fyndplats faktiska katalog. Extra vikt på PRECISION: att de
// medvetet bortvalda, farliga synonym-needlarna (solar→sol, kasse→kass, fan) inte
// smugit tillbaka och matchar orelaterade produkter.

import test from "node:test";
import assert from "node:assert/strict";
import { nameScore, fuzzyContains, expandSynonyms, stem } from "./search.ts";

// ── Oförändrat beteende: exakt, stemming, compound ──────────────────────────
test("exakt fras → 100", () => {
  assert.equal(nameScore("Komfortsadel för touringcykel", "komfortsadel"), 100);
  assert.equal(nameScore("Elektrisk cykelpump 150 PSI", "cykelpump"), 100);
});

test("compound-aware stemming (knivset → knivhållare)", () => {
  assert.ok(nameScore("Knivhållare i stål", "knivset") > 0);
  assert.ok(nameScore("Kedjehalsband i silver", "halsband") > 0);
});

test("ingen träff → 0", () => {
  assert.equal(nameScore("Elektrisk cykelpump 150 PSI", "banan"), 0);
  assert.equal(nameScore("", "cykel"), 0);
  assert.equal(nameScore("Cykel", ""), 0);
});

// ── Synonymer ────────────────────────────────────────────────────────────────
test("synonym: mtb hittar cykelsortimentet (~51, under exakt)", () => {
  const s = nameScore("Cykelhjul 20 tum", "mtb");
  assert.equal(s, 51);
  assert.ok(s < 60); // aldrig lika högt som en exakt namnträff
});

test("synonym: belysning → lampa", () => {
  assert.equal(nameScore("Bordslampa med LED", "belysning"), 51);
});

test("synonym: trådlös ⇄ sladdlös (bidirektionellt)", () => {
  assert.ok(nameScore("Sladdlös dammsugare", "trådlös") > 0);
  assert.ok(nameScore("Trådlös laddare", "sladdlös") > 0);
});

test("synonym: engelska → svenska (kids→barn, storage→förvaring, bag→väska)", () => {
  assert.ok(nameScore("Barnstol i trä", "kids") > 0);
  assert.ok(nameScore("Förvaringsbox med lock", "storage") > 0);
  assert.ok(nameScore("Necessär och väska för resan", "bag") > 0);
});

test("synonym: flerord (kids + stol) — exakt + synonym viktas ihop", () => {
  // "stol" exakt (1) + "kids"→barn synonym (0.85) → (1.85/2)*60 = 56
  assert.equal(nameScore("Barnstol i trä", "kids stol"), 56);
});

// ── Stavfelstolerans ─────────────────────────────────────────────────────────
test("stavfel: cyckel → cykel (~36, under synonym)", () => {
  const s = nameScore("Elektrisk cykelpump 150 PSI", "cyckel");
  assert.equal(s, 36);
});

test("stavfel: transposition sdael → sadel", () => {
  assert.ok(nameScore("Komfortsadel för touringcykel", "sdael") > 0);
});

test("stavfel: insättning förvaering → förvaring", () => {
  assert.ok(nameScore("Förvaringsbox med lock", "förvaering") > 0);
});

test("stavfel gäller inte för korta tokens (<5)", () => {
  // Korta ord får inte fuzzy-matcha — en redigering i ett 3–4-teckensord matchar
  // nästan vad som helst. Bara exakt/synonym gäller för korta termer.
  assert.equal(nameScore("Matbord i ek", "bok"), 0);   // 3 tecken
  assert.equal(nameScore("Komfortsadel", "sadl"), 0);  // 4 tecken — ingen fuzzy
});

// ── PRECISION: bortvalda farliga synonymer får INTE matcha ──────────────────
test("precision: solcell matchar inte isolering/parasoll (solar→sol bortvalt)", () => {
  assert.equal(nameScore("Isolering för vattenrör", "solcell"), 0);
  assert.equal(nameScore("Parasoll för altanen", "solcell"), 0);
});

test("precision: väska matchar inte kassaskåp (kasse→kass bortvalt)", () => {
  assert.equal(nameScore("Kassaskåp med kodlås", "väska"), 0);
});

test("precision: ventilation/fläkt matchar inte elefant (fan bortvalt)", () => {
  assert.equal(nameScore("Elefant gosedjur för barn", "ventilation"), 0);
  assert.equal(nameScore("Elefant gosedjur för barn", "fläkt"), 0);
});

test("precision: hund matchar inte orelaterat via kort engelsk synonym", () => {
  // "dog"/"cat"/"pet" är bortvalda → hund-gruppen läcker inte in i "trumpet" etc.
  assert.equal(nameScore("Trumpet leksak för barn", "hund"), 0);
});

// ── Rankning: exakt > synonym > stavfel ─────────────────────────────────────
test("rankning: exakt (100) > synonym (51) > stavfel (36)", () => {
  const exact = nameScore("MTB cykelhjälm", "mtb");     // "mtb" som delsträng → 100
  const synonym = nameScore("Cykelhjul 20 tum", "mtb"); // via synonym → 51
  const typo = nameScore("Elektrisk cykelpump", "cyckel"); // via stavfel → 36
  assert.equal(exact, 100);
  assert.equal(synonym, 51);
  assert.equal(typo, 36);
  assert.ok(exact > synonym && synonym > typo);
});

// ── Enhetstester: fuzzyContains ─────────────────────────────────────────────
test("fuzzyContains: transposition = 1 redigering", () => {
  assert.equal(fuzzyContains("sdael", "sadel", 1), true);
  assert.equal(fuzzyContains("hrölurar", "hörlurar", 2), true);
});

test("fuzzyContains: borttagning/insättning/utbyte", () => {
  assert.equal(fuzzyContains("cyckel", "cykelpump 150 psi", 1), true); // extra c
  assert.equal(fuzzyContains("cyke", "cykel", 1), true);               // saknar l
  assert.equal(fuzzyContains("cykol", "cykel", 1), true);              // o↔e
});

test("fuzzyContains: fri startposition (matchar var som helst)", () => {
  assert.equal(fuzzyContains("pump", "elektrisk cykelpump", 0), true);
});

test("fuzzyContains: för långt bort → false", () => {
  assert.equal(fuzzyContains("banan", "cykelpump", 1), false);
  assert.equal(fuzzyContains("xyz", "abcdefg", 1), false);
});

// ── Enhetstester: expandSynonyms ────────────────────────────────────────────
test("expandSynonyms: bidirektionellt och kanoniskt", () => {
  assert.ok(expandSynonyms("mtb").includes("cykel"));
  assert.ok(expandSynonyms("cykel").includes("mtb"));
  assert.ok(expandSynonyms("belysning").includes("lamp")); // kanonisk stam av "lampa"
  assert.ok(expandSynonyms("storage").includes("förvaring"));
  assert.deepEqual(expandSynonyms("finnsingengrupp"), []);
});

// ── Stemmer: böjning kapas, korta rotord bevaras ────────────────────────────
test("stem: äkta böjning kapas fortfarande", () => {
  assert.equal(stem("knivset"), "kniv");   // 3-teckens suffix
  assert.equal(stem("bilar"), "bil");      // 2-teckens suffix
  assert.equal(stem("cykel"), "cykel");    // inget suffix
});

test("stem: enteckens-suffix kapar INTE korta rotord (n/t/s, ≥4-regeln)", () => {
  assert.equal(stem("barn"), "barn"); // inte "bar" → matchar ej expanderbar
  assert.equal(stem("katt"), "katt"); // inte "kat" → matchar ej delikat
  assert.equal(stem("ljus"), "ljus"); // inte "lju" → matchar ej ljud
});

test("precision (rot): 'barn' matchar barnstol men INTE expanderbar", () => {
  assert.equal(nameScore("Barnstol i trä", "barn"), 100);
  assert.equal(nameScore("Pakethållarväska expanderbar", "barn"), 0);
});
