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
import { nameScore, nameMatch, rankByName, fuzzyContains, expandSynonyms, stem } from "./search.ts";

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

// ── "Visa alla resultat" (2026-09-24) ───────────────────────────────────────
test("fras bara i namnets tillägg → 90, i huvuddelen → 100", () => {
  assert.equal(nameScore("Lekmatta 160 × 100 cm med stadsmotiv", "matta"), 100);
  assert.equal(nameScore("Klösträd 200 cm med sex nivåer – tre grottor och hängmatta", "matta"), 90);
  assert.equal(nameScore("Sidobord för soffan i svart stål", "soffa"), 90);
  assert.equal(nameScore("Bäddsoffa 2-sits i beige sammet – ryggstöd i tre lägen", "soffa"), 100);
});

test("för korta synonym-needles träffar inte orelaterade namn", () => {
  assert.equal(nameScore("Soptunna 45 liter med pedal och soft close-lock", "soffa"), 0);
  assert.equal(nameScore("Trådlös CarPlay-adapter 4-i-1", "matta"), 0);
  assert.equal(nameScore("Metalldetektor med 4 söklägen, vattentät IP68", "tält"), 0);
  assert.equal(nameScore("Bagagerumsgaller för hund, 89–150 cm brett", "väska"), 0);
  // Åt andra hållet fungerar synonymen fortfarande.
  assert.ok(nameScore("Bäddsoffa 2-sits i beige sammet", "sofa") > 0);
});

test("nameMatch.full: alla sökord måste träffa", () => {
  assert.equal(nameMatch("Solcellslampa 177 cm – trädgårdslykta", "solcell lampa").full, true);
  assert.equal(nameMatch("Golvlampa med trebensstativ i svart metall", "solcell lampa").full, false);
  assert.equal(nameMatch("Golvlampa med trebensstativ", "solcell lampa").score > 0, true);
});

test("rankByName: delträffar bara när inget matchar alla sökord", () => {
  const names = [
    "Golvlampa med två glaskulor 170 cm",
    "Solcellslampa 177 cm – trädgårdslykta med sex lysdioder",
    "Solcellslyktor 2-pack i konstrotting",
  ];
  assert.deepEqual(rankByName(names, (n) => n, "solcell lampa"), [
    "Solcellslampa 177 cm – trädgårdslykta med sex lysdioder",
    "Solcellslyktor 2-pack i konstrotting",
  ]);
  // Ingen vara har både "solcell" och "kudde" → delträffarna visas som reserv.
  assert.deepEqual(rankByName(names, (n) => n, "solcell kudde").length, 2);
});

test("rankByName: sorterar på relevans", () => {
  const names = [
    "Klösträd 200 cm med sex nivåer – tre grottor och hängmatta",
    "Lekmatta 160 × 100 cm med stadsmotiv",
  ];
  assert.deepEqual(rankByName(names, (n) => n, "matta"), [
    "Lekmatta 160 × 100 cm med stadsmotiv",
    "Klösträd 200 cm med sex nivåer – tre grottor och hängmatta",
  ]);
});

test("rankByName: stavfelsträffar bara när inget matchar utan stavfel", () => {
  // Extern audit 2026-10-07: "hundvagn" → "handtag" och "hundtand" med två fel.
  const namn = [
    "Vitt nattduksbord med tre lådor – silverhandtag och tippskydd",
    "Hundvagn för mellanstor hund upp till 25 kg",
    "Retro fåtölj med hundtandsmönster – armstöd i trä",
    "Cykelvagn för hund 2-i-1 – blir hundvagn",
  ];
  assert.deepEqual(rankByName(namn, (n) => n, "hundvagn"), [namn[1], namn[3]]);
  // Utan någon träff utan stavfel används stavfelstoleransen som förut.
  assert.deepEqual(rankByName(["Cykel för barn", "Bord"], (n) => n, "cyckel"), ["Cykel för barn"]);
});

// ── Sökrutan hängde på "uppresningsfåtölj" (Leonard 2026-10-14) ─────────────
const LYFTSTOLAR = [
  "Uppresningsfåtölj med massage i mörkgrått tyg – lutar till 135°, bär 180 kg",
  "Uppresningsfåtölj i grå frotté – elektrisk lyft 60° och åtta massagepunkter",
  "Elektrisk massagefåtölj med uppresning – värme, fotstöd och liggläge 150°",
  "Massagefåtölj med uppresning, värme och timer – bär 150 kg",
  "Reclinerfåtölj med massage och uppresningshjälp – 28 cm ryggdyna",
  "Uppresningsfåtölj i grått konstläder – 160° liggläge, utan massage",
];
const ANNAT = [
  "MC-lyft med sax i stål, bär 500 kg – höjd 13,5–39 cm, på fyra hjul",
  "Brödrost för fyra skivor med vågmönster – sju lägen och högt lyft",
  "Uppblåsbar snögubbe 240 cm med lyktstolpe – färgade ljus och hög hatt",
  "Öronlappsfåtölj i beige manchester med ländkudde – bär 120 kg",
];

test("uppresningsfåtölj hittar alla uppresningsfåtöljer, de med ordet i namnet först", () => {
  const r = rankByName([...ANNAT, ...LYFTSTOLAR], (n) => n, "uppresningsfåtölj");
  assert.deepEqual(new Set(r), new Set(LYFTSTOLAR));
  // De tre som heter "Uppresningsfåtölj …" kommer före synonymträffarna.
  assert.deepEqual(r.slice(0, 3).every((n) => n.startsWith("Uppresningsfåtölj")), true);
});

test("lyftfåtölj, lyftstol och uppresningsstol hittar uppresningsfåtöljerna, men inte MC-lyften", () => {
  for (const q of ["lyftfåtölj", "lyftstol", "uppresningsstol"]) {
    assert.deepEqual(new Set(rankByName([...ANNAT, ...LYFTSTOLAR], (n) => n, q)), new Set(LYFTSTOLAR), q);
  }
  // "lyft" är ingen nål: MC-lyften och brödrosten matchar bara sitt eget ord.
  assert.equal(nameScore("MC-lyft med sax i stål", "lyftfåtölj"), 0);
});

test("småord krävs inte i namnet, men 'utan' gör det", () => {
  // "med" saknas i namnet, men "fåtölj" och "uppresning" finns.
  assert.equal(nameMatch(LYFTSTOLAR[1], "fåtölj med uppresning").full, true);
  assert.equal(nameMatch(ANNAT[3], "fåtölj med uppresning").full, false);
  // "utan" är inget småord: fåtöljen med massage ska inte bli en hel träff.
  assert.equal(nameMatch(LYFTSTOLAR[0], "fåtölj utan massage").full, false);
  assert.equal(nameMatch(LYFTSTOLAR[5], "fåtölj utan massage").full, true);
  // En sökning som BARA är småord letar som förut.
  assert.equal(nameMatch("Bord med stolar", "med").full, true);
  assert.equal(nameMatch("Matbord i ek", "med").score, 0);
});

test("ordgränsen ordnar likvärdiga träffar: ordets huvud, sedan ordets början", () => {
  const tv = ["Viktväst 30 kg med 35 avtagbara viktpåsar", "Två viktskivor på 5 kg", "TV-bänk 160 cm med RGB-LED"];
  assert.deepEqual(rankByName(tv, (n) => n, "tv"), [tv[2], tv[1], tv[0]]);
  const bord = ["Bordslampa med keramikfot", "Matbord 110 × 70 cm för fyra"];
  assert.deepEqual(rankByName(bord, (n) => n, "bord"), [bord[1], bord[0]]);
  // Ett kort sökord är huvud bara som eget ord: "grupp" slutar på "upp".
  const upp = ["Loungegrupp i konstrotting", "Hundvagn upp till 4 kg", "Uppblåsbar jultomte 120 cm"];
  assert.deepEqual(rankByName(upp, (n) => n, "upp"), [upp[1], upp[2], upp[0]]);
  // Mängden ändras aldrig, bara ordningen.
  assert.equal(rankByName(tv, (n) => n, "tv").length, 3);
});

// Den gamla definitionen, ett varv med stavfelstolerans. rankByName räknar i
// två varv och ska ge exakt samma lista.
function ettVarv(namn: string[], q: string): string[] {
  const scored = namn.map((n) => ({ n, ...nameMatch(n, q) })).filter((r) => r.score > 0);
  const hela = scored.some((r) => r.full) ? scored.filter((r) => r.full) : scored;
  const kept = hela.some((r) => !r.stavfel) ? hela.filter((r) => !r.stavfel) : hela;
  return kept.sort((a, b) => b.score - a.score || (b.kant ?? 0) - (a.kant ?? 0)).map((r) => r.n);
}

test("rankByName i två varv ger samma lista som ett varv med stavfel", () => {
  const namn = [
    ...LYFTSTOLAR, ...ANNAT,
    "Cykel för barn 16 tum", "Elektrisk cykelpump 150 PSI", "Komfortsadel för touringcykel",
    "Hundvagn för mellanstor hund upp till 25 kg", "Vitt nattduksbord med tre lådor – silverhandtag",
    "Retro fåtölj med hundtandsmönster", "Solcellslampa 177 cm – trädgårdslykta", "Golvlampa med två glaskulor",
    "Förvaringsbox med lock", "Kontorsstol med massage och värme", "TV-bänk 160 cm", "Två viktskivor på 5 kg",
  ];
  const fragor = ["uppresningsfåtölj", "uppresningsfatolj", "lyftfåtölj", "cyckel", "sdael", "hundvagn",
    "solcell lampa", "förvaering", "kontorsstol med massage", "fåtölj med uppresning", "tv", "bord", "xyz", "upp"];
  for (const q of fragor) {
    for (let k = 2; k <= q.length; k++) {
      const p = q.slice(0, k);
      assert.deepEqual(rankByName(namn, (n) => n, p), ettVarv(namn, p), p);
    }
  }
});
