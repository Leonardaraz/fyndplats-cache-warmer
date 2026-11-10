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

// Definitionen i ett varv: allt räknas med stavfelstolerans (nameMatch), och
// reservreglerna läggs på efteråt. rankByName räknar i tre varv och ska ge
// exakt samma lista. Reserverna, i ordning (2026-11-10 kom "utan prickar" och
// "ett fel före två" till):
//   1. Hela träffar före delträffar.
//   2. Bland hela: träffar som varken behövde vikta prickar eller stavfel,
//      annars de utan stavfel, annars stavfelsträffarna.
//   3. Bland stavfelsträffar: de med ett fel per ord, om någon finns.
function ettVarv(namn: string[], q: string): string[] {
  const scored = namn.map((n) => ({ n, ...nameMatch(n, q) })).filter((r) => r.score > 0);
  const hela = scored.filter((r) => r.full);
  let kept = scored;
  if (hela.length > 0) {
    const exakta = hela.filter((r) => !r.stavfel && !r.vikt);
    const utanStavfel = hela.filter((r) => !r.stavfel);
    kept = exakta.length > 0 ? exakta : utanStavfel.length > 0 ? utanStavfel : hela;
  } else if (scored.some((r) => !r.stavfel)) {
    kept = scored.filter((r) => !r.stavfel);
  }
  if (kept.some((r) => r.fel === 1)) kept = kept.filter((r) => r.fel === 1);
  return kept.sort((a, b) => b.score - a.score || (b.kant ?? 0) - (a.kant ?? 0)).map((r) => r.n);
}

test("rankByName i tre varv ger samma lista som ett varv med reserverna pålagda", () => {
  const namn = [
    ...LYFTSTOLAR, ...ANNAT,
    "Cykel för barn 16 tum", "Elektrisk cykelpump 150 PSI", "Komfortsadel för touringcykel",
    "Hundvagn för mellanstor hund upp till 25 kg", "Vitt nattduksbord med tre lådor – silverhandtag",
    "Retro fåtölj med hundtandsmönster", "Solcellslampa 177 cm – trädgårdslykta", "Golvlampa med två glaskulor",
    "Förvaringsbox med lock", "Kontorsstol med massage och värme", "TV-bänk 160 cm", "Två viktskivor på 5 kg",
    "Lasertag-set med projektor – 2 pistoler", "Hopfällbar hantelbank med sju lägen", "Sängbord med låda – vitt",
    "Gamingbord 147 cm med skärmhylla", "Elkamin med mantel", "Två hyllplan i vit melamin",
  ];
  const fragor = ["uppresningsfåtölj", "uppresningsfatolj", "lyftfåtölj", "cyckel", "sdael", "hundvagn",
    "solcell lampa", "förvaering", "kontorsstol med massage", "fåtölj med uppresning", "tv", "bord", "xyz", "upp",
    "fatolj", "sangbord", "tv bank", "tvbänk", "laser tag", "elkammin", "forvaring"];
  for (const q of fragor) {
    for (let k = 2; k <= q.length; k++) {
      const p = q.slice(0, k);
      assert.deepEqual(rankByName(namn, (n) => n, p), ettVarv(namn, p), p);
    }
  }
});

test("rankByName med namnen normaliserade i förväg ger samma lista (sökrutornas väg)", () => {
  const namn = [...LYFTSTOLAR, ...ANNAT, "Cykel för barn 16 tum", "TV-bänk 160 cm", "Förvaringsbox med lock"];
  const forvag = namn.map((n) => n.toLowerCase().trim());
  for (const q of ["uppresningsfåtölj", "cyckel", "tv", "förvaring", "lyftfåtölj", "xyz", "upp"]) {
    assert.deepEqual(rankByName(namn, (n) => n, q, forvag), rankByName(namn, (n) => n, q), q);
  }
});


// ── Sammanskrivet, utan prickar och ett fel före två (2026-11-10) ───────────
// 39 provsökningar mot butiken: "fatolj" gav 0 träffar, "sangbord" gamingbord,
// "tv bank" 949 varor, "laser tag" en bredgaffel och "elkammin" melaminhyllor.
// Jämfört mot butikens 6 147 namn ändrades 34 av 3 465 sökningar ur katalogen,
// alla åt det här hållet.
test("sammanskrivet: flera sökord hittar ordet som ett, före ordträffarna", () => {
  const namn = [
    "Bredgaffel med 5 tänder och två glasfiberskaft – handtag i plast",
    "Lasertag 4 spelare med USB-laddning – pistoler och västar",
    "VATOS lasertag-set med träffsensorer – 2-pack eller 4-pack",
  ];
  // "laser" stammas till "las" och står i "glasfiber", "tag" i "handtag".
  assert.equal(nameMatch(namn[0], "laser tag").full, true);
  assert.deepEqual(rankByName(namn, (n) => n, "laser tag"), [namn[1], namn[2], namn[0]]);
  assert.equal(nameScore(namn[1], "laser tag"), 95);
  assert.equal(nameScore("Hundbur på hjul med två lådor", "hund bur"), 95);
  // Bara i namnets tillägg: 88, under frasen i tillägget (90).
  assert.equal(nameScore("Leksakspistoler med västar – lasertag för fyra", "laser tag"), 88);
});

test("sammanskrivet: ett sökord hittar namnet med bindestreck, och tvärtom", () => {
  assert.equal(nameScore("TV-bänk 160 cm med RGB-LED", "tvbänk"), 95);
  assert.equal(nameScore("Pop-up fotbollsmål 150 × 110 cm", "popup"), 95);
  assert.equal(nameScore("Sit-up-bänk höjdjusterbar med träningsband", "situpbänk"), 95);
  assert.equal(nameScore("Rektangulär LED-spegel för badrum", "led spegel"), 95);
  const tv = ["Läshörna för barn med sittbänk och bokhylla", "TV-bänk 140 cm med metallben", "Barnarbetsbänk i trä med verktyg"];
  assert.deepEqual(rankByName(tv, (n) => n, "tvbänk"), [tv[1]]);
});

test("sammanskrivet: träffen börjar ett ord och slutar där en del slutar", () => {
  // "topp" är inte "top-p…": träffen börjar mitt i "hardtop".
  assert.equal(nameScore("Hardtop-paviljong 300 cm med polykarbonattak", "topp"), 0);
  // Också när den börjar ett ord: efter fogen måste delen ta slut.
  assert.equal(nameScore("Top-paviljong 300 cm", "topp"), 0);
  // Mellanslag fogas aldrig ihop: "fäst olika" är ingen stol.
  assert.equal(nameScore("Krokar att fästa olika verktyg på", "stol"), 0);
  // "bädd soffa" är inte ordets början i "hörnbäddsoffa": ordträff, inte 95.
  assert.equal(nameScore("Modulär hörnbäddsoffa i mörkgrå chenille", "bädd soffa"), 60);
  // För kort för att jämföras sammanskrivet: "tv å" blir inte "två".
  assert.equal(nameMatch("Två viktskivor på 5 kg", "tv å").score < 95, true);
});

test("utan prickar: fatolj hittar fåtöljer, men bara när inget matchar med prickarna kvar", () => {
  const namn = [
    "Reclinerfåtölj med fotpall i gräddvit chenille",
    "Gamingbord 147 cm med skärmhylla",
    "Sängbord med låda och öppet fack – vitt",
    "Hopfällbart balkongbord för räcke, 120 cm",
    "TV-bänk 160 cm med RGB-LED",
    "Hopfällbar hantelbank med sju lägen",
  ];
  assert.deepEqual(rankByName(namn, (n) => n, "fatolj"), [namn[0]]);
  // "sangbord" låg två fel från både "gamingbord" och "balkongbord".
  assert.deepEqual(rankByName(namn, (n) => n, "sangbord"), [namn[2]]);
  // "tv bank": TV-bänken, inte hantelbanken (som saknar "tv").
  assert.deepEqual(rankByName(namn, (n) => n, "tv bank"), [namn[4]]);
  assert.equal(nameMatch(namn[0], "fatolj").vikt, true);
  // Reserv: står sökordet i ett namn med prickarna kvar visas bara sådana.
  const bar = ["Barstol i svart konstläder", "Bärbar högtalare med handtag"];
  assert.deepEqual(rankByName(bar, (n) => n, "bär"), [bar[1]]);
  assert.deepEqual(rankByName(["Lada i trä", "Låda i plast"], (n) => n, "lada"), ["Lada i trä"]);
});

test("ett stavfel före två: elkammin hittar elkaminer, inte melamin och kammare", () => {
  const namn = [
    "Två hyllplan i vit melamin, 58,4 × 35 cm",
    "Fladdermusholk med tre kammare och svart tak",
    "Elkamin med mantel och vedhylla – tresidigt glas",
  ];
  // Alla tre ligger inom två fel från "elkammin".
  for (const n of namn) assert.equal(nameMatch(n, "elkammin").stavfel, true, n);
  assert.equal(nameMatch(namn[2], "elkammin").fel, 1);
  assert.deepEqual(rankByName(namn, (n) => n, "elkammin"), [namn[2]]);
  // Utan någon träff med ett fel visas de med två, som förut.
  assert.deepEqual(rankByName(namn.slice(0, 2), (n) => n, "elkammin").length, 2);
});

test("synonym: kontorsfåtölj och skrivbordsstol hittar kontorsstolarna", () => {
  const namn = ["Kontorsfåtölj i sammetslook", "Ergonomisk kontorsstol i nät", "Skrivbordsstol utan armstöd", "Matstol i ek"];
  assert.deepEqual(rankByName(namn, (n) => n, "kontorsfåtölj"), [namn[0], namn[1], namn[2]]);
  assert.deepEqual(new Set(rankByName(namn, (n) => n, "skrivbordsstol")), new Set(namn.slice(0, 3)));
});
