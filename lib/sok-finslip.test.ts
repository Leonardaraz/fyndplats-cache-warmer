// lib/sok-finslip.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Sökmotorns regler från genomgången 2026-11-19 (Leonard: "djup analys och
// tester att den är 10/10"). Varje prov bär ett fel som fanns i butiken,
// hämtat ur kundernas egna sökningar (GA4), Googles frågor mot butiken och en
// genomgång av katalogens 7 724 namn. Namnen här är katalogens, kortade.
//
// Reglerna står i lib/search.ts, var och en med sitt ☠️.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { byggOrdforrad, kategoriPoang, markeraTraffar, markeringsord, matchaKategorier, normalize, rankaMedForslag, rankaMedInfo, rankByName, sokforslagINamn } from "./search.ts";

const sok = (namn: string[], q: string) => rankByName(namn, (n) => n, q);
const utfall = (namn: string[], q: string) => rankaMedInfo(namn, (n) => n, q);

// ── Mått skrivs på flera sätt ────────────────────────────────────────────────
test("mått: 70x70, 150cm och 12v läses som namnen skriver dem", () => {
  assert.equal(normalize("Matbord 70x70"), "matbord 70 × 70");
  assert.equal(normalize("150cm"), "150 cm");
  assert.equal(normalize("pump 12V"), "pump 12 v");
  // Modellnamn rörs inte: bara där en siffra står intill en enhet.
  assert.equal(normalize("BMW G310 GS"), "bmw g310 gs");
  const namn = ["Kvadratiskt matbord 70 × 70 cm för två", "Badrumsspegel 70x70 med LED", "Matbord 110 × 70 cm för fyra"];
  assert.equal(sok(namn, "matbord 70x70")[0], namn[0]);
  assert.deepEqual(sok(["Golvlampa 150 cm med skärm", "Soffa 220 cm"], "150cm"), ["Golvlampa 150 cm med skärm"]);
});

test("mått: bred, djup och hög är egenskaper, och rea hör till frågan", () => {
  const soffor = ["Böjd soffa 260 cm i krämvit chenille", "Soffa 220 cm i grått", "Skrivbordsstol med nätrygg – 55 cm bred"];
  // "bred" står inte i soffans namn, men soffan på 260 cm är svaret.
  assert.equal(sok(soffor, "soffa 260 cm bred")[0], soffor[0]);
  const kok = ["Barnkök i rosa med 33 delar", "Julgirlang med realistiska barrgrenar"];
  assert.deepEqual(sok(kok, "barnkök rea"), [kok[0]]);
});

// ── Böjningar som stammen inte når ───────────────────────────────────────────
const BOJT = [
  "Rund spegel med belysning Ø70 cm", "Väggdekoration med fyra runda speglar", "Spegelskåp för badrum",
  "Motionscykel med ryggstöd", "Barncykel 18 tum", "Ramväska cykel med mobilhållare", "Hallmöbel med klädhängare", "Hundbur som möbel i vitt", "Flyttfiltar för möbler 6-pack",
  "Bordslampa med keramikfot", "Bordslampor med USB 2-pack", "Väggmonterad hylla i stål", "Väggmonterade hyllor 2-pack",
  "Soffa med fyra kuddar", "Kudde i sammet", "Byrå med låda och hylla", "Byrå med tre lådor", "Tvåsitssoffa i manchester",
];

test("böjning: -el blir -lar och -ler (spegel, cykel, möbel)", () => {
  // ☠️ "speglar" gav 6 av butikens 126 speglar: stammen "spegl" står inte i "spegel".
  assert.deepEqual(sok(BOJT, "speglar").slice(0, 2), ["Rund spegel med belysning Ø70 cm", "Väggdekoration med fyra runda speglar"]);
  assert.equal(sok(BOJT, "spegel").includes("Väggdekoration med fyra runda speglar"), true);
  assert.deepEqual(sok(BOJT, "cyklar").sort(), ["Barncykel 18 tum", "Motionscykel med ryggstöd", "Ramväska cykel med mobilhållare"]);
  assert.deepEqual(sok(BOJT, "möbler").sort(), ["Flyttfiltar för möbler 6-pack", "Hallmöbel med klädhängare", "Hundbur som möbel i vitt"]);
  assert.equal(sok(BOJT, "möbel").includes("Flyttfiltar för möbler 6-pack"), true);
});

test("böjning: -a blir -or och -e blir -ar, åt båda håll", () => {
  // ☠️ "bordslampa" hittade inte "Bordslampor 2-pack".
  assert.deepEqual(sok(BOJT, "bordslampa").sort(), ["Bordslampa med keramikfot", "Bordslampor med USB 2-pack"]);
  assert.deepEqual(sok(BOJT, "bordslampor").sort(), ["Bordslampa med keramikfot", "Bordslampor med USB 2-pack"]);
  assert.equal(sok(BOJT, "hylla").includes("Väggmonterade hyllor 2-pack"), true);
  assert.equal(sok(BOJT, "kudde").includes("Soffa med fyra kuddar"), true);
  assert.equal(sok(BOJT, "kuddar").includes("Kudde i sammet"), true);
  // Bestämd form: lådan → låda, soffan → soffa.
  assert.equal(sok(BOJT, "lådan").includes("Byrå med låda och hylla"), true);
  assert.equal(sok(BOJT, "soffan").includes("Tvåsitssoffa i manchester"), true);
});

test("böjning: en form som inget namn har är inget ord", () => {
  // "inne" blir "innar", som står i "sittPINNAR".
  const namn = ["Sittpinnar för höns", "Katthus i trä för inne och ute"];
  assert.deepEqual(sok(namn, "inne"), [namn[1]]);
  // "rosor" är inte "rosa": en färg är ett annat ord.
  const rosor = ["Konstgjorda vita rosor, 120 stjälkar", "Rosa barnstudsmatta 92 cm", "Hylla i rostfritt stål", "Konstgjord ros i kruka"];
  assert.deepEqual(sok(rosor, "rosor").sort(), ["Konstgjord ros i kruka", "Konstgjorda vita rosor, 120 stjälkar"]);
});

// ── Ett ensamt sökord: böjningen spelar ingen roll ───────────────────────────
test("ensamt ord: stolar visar stolarna före matgruppen med fyra stolar", () => {
  const namn = [
    "Matgrupp 5 delar — glasbord 120 cm och fyra stolar", "Bord med två stolar för balkongen", "Kontorsstol i manchester",
    "Matstolar 2-pack i sammet", "Stolsdyna i bomull", "Klösstolpe i sisal",
  ];
  const stolar = sok(namn, "stolar");
  // Varorna som ÄR stolar först: i svenskan är sista ledet varan.
  assert.deepEqual(stolar.slice(0, 2).sort(), ["Kontorsstol i manchester", "Matstolar 2-pack i sammet"]);
  // Sedan de som har stolar med sig, och sist det som bara börjar likadant.
  assert.equal(stolar.indexOf("Bord med två stolar för balkongen") < stolar.indexOf("Stolsdyna i bomull"), true);
  // Samma varor först för ental och flertal.
  assert.deepEqual(sok(namn, "stol").slice(0, 2).sort(), stolar.slice(0, 2).sort());
});

test("ensamt ord: växter är växten, inte spaljén för klätterväxter", () => {
  const namn = ["Trädgårdsspaljé för klätterväxter i svart stål", "Konstgjord växt 95 cm med 33 blad", "Växthus i trä med sluttande tak"];
  assert.equal(sok(namn, "växter")[0], namn[1]);
});

test("ensamt ord: småorden i sökningen ändrar inte ordningen", () => {
  const namn = ["Uppresningsfåtölj i grå frotté", "Retro fåtölj med hundtandsmönster", "Fåtöljöverdrag i stretch"];
  // "fåtölj med": namnet som har just de orden går först.
  assert.equal(sok(namn, "fåtölj med")[0], namn[1]);
  assert.equal(sok(namn, "billiga fåtöljer").length, 3);
  assert.equal(sok(namn, "billiga fåtöljer")[2], namn[2]);
});

// ── Stammen är inte alltid ordet ─────────────────────────────────────────────
test("stam: en kort stam ska stå som ett ord", () => {
  // ☠️ "vaser" gav tvättvaskar, "burar" burkar, "ramar" ramper och "pilar" pilatesringar.
  assert.deepEqual(sok(["Kristallvaser i silver", "Bärbar campingvask med vattentank", "Bell-tält i canvas"], "vaser"), ["Kristallvaser i silver"]);
  assert.deepEqual(sok(["Fågelbur i vitt stål", "Kryddställ med 72 glasburkar"], "burar"), ["Fågelbur i vitt stål"]);
  assert.deepEqual(sok(["Sängram 140 × 200 cm", "Bilramper i svart plast", "Tröjramar med magnetlås"], "ramar").sort(), ["Sängram 140 × 200 cm", "Tröjramar med magnetlås"]);
  assert.deepEqual(sok(["Pil och båge för barn", "Pilatesbox med mjuk klädsel", "Darttavla med sex pilar"], "pilar").sort(), ["Darttavla med sex pilar", "Pil och båge för barn"]);
  // Böjningen av det korta ordet hittas fortfarande.
  assert.deepEqual(sok(["Elbil för barn 12 V", "Radiostyrd terrängbil", "Bilramper i svart plast"], "bilar").sort(), ["Elbil för barn 12 V", "Radiostyrd terrängbil"]);
});

test("stam: avledningar och ord som inte är böjda stammas inte", () => {
  // ☠️ "träning" hade stammen "trä" och gav 910 träffar.
  assert.deepEqual(sok(["Träningsbänk 146 cm", "Barnbord i trä"], "träning"), ["Träningsbänk 146 cm"]);
  assert.deepEqual(sok(["Fågelmatare med kamera", "Matbord 110 cm"], "matare"), ["Fågelmatare med kamera"]);
  assert.deepEqual(sok(["Solcellsladdare 30 W", "Laddbar bordslampa"], "laddare"), ["Solcellsladdare 30 W"]);
  assert.deepEqual(sok(["Klädhängare i bambu", "Hängmatta med ställning"], "hängare"), ["Klädhängare i bambu"]);
  assert.deepEqual(sok(["Modulära mattplattor med packning", "Barstolar 2-pack"], "packning"), ["Modulära mattplattor med packning"]);
  // Ord som ser böjda ut men är sin egen grundform.
  assert.deepEqual(sok(["Sandfilter för pool", "Flyttfilt 240 × 200 cm"], "filter"), ["Sandfilter för pool"]);
  assert.deepEqual(sok(["Korslinjelaser med grön stråle", "Kofferset med TSA-lås", "Spärrkedja, säker last 3600 kg"], "laser"), ["Korslinjelaser med grön stråle"]);
  assert.deepEqual(sok(["Hundtvättstation med höger avlopp", "Hög byrå med sex lådor"], "höger"), ["Hundtvättstation med höger avlopp"]);
  // "stegar" är stegen man klättrar på.
  assert.equal(sok(["Hopfällbar båtstege i rostfritt stål", "Husdjurstrappa 3 steg", "Fågellekplats med stegar"], "stegar").includes("Hopfällbar båtstege i rostfritt stål"), true);
});

// ── Slumpträffar inne i andra ord ────────────────────────────────────────────
test("slumpträff: ett kort ord inne i ett längre är ingen träff", () => {
  const inte = (namn: string, q: string) => assert.deepEqual(sok([namn], q), [], `${q} ska inte träffa ${namn}`);
  // Mätt i katalogen 2026-11-19: lås gav 94 uppblåsbara varor, tyg 86 verktyg, ring 250 med förvaring.
  inte("Uppblåsbar paddleboard 3,35 m", "lås");
  inte("Verktygsvagn med överskåp", "tyg");
  inte("Skobänk med förvaring", "ring");
  inte("Väggmontering för tv", "ring");
  inte("Slushmaskin 6 liter", "ask");
  inte("Soluppvärmd utomhusdusch", "hus");
  inte("Limpistol 60 W", "stol");
  inte("Hopfällbar plattformsvagn", "form");
  inte("Hopfällbar transportbur", "sport");
  inte("Fontänbassäng i plast", "säng");
  inte("Teleskopiska stabilisatorben", "bil");
  inte("Bell-tält i canvas", "vas");
  inte("Bordsdiskmaskin med sex program", "ram");
  inte("Hållare med sex monteringsfästen", "sten");
  inte("Skivstång 220 cm", "tång");
  inte("Växthusplast 4 × 10 m", "last");
  inte("Hylla i metall", "tall");
  // De riktiga sammansättningarna står kvar.
  assert.equal(sok(["Cykellås med kod"], "lås").length, 1);
  assert.equal(sok(["Tyggarderob 110 cm"], "tyg").length, 1);
  assert.equal(sok(["Gymnastikringar för barn"], "ring").length, 1);
  assert.equal(sok(["Växthus i trä"], "hus").length, 1);
  assert.equal(sok(["Kontorsstol i nät"], "stol").length, 1);
  assert.equal(sok(["Himmelssäng i metall"], "säng").length, 1);
  assert.equal(sok(["Elbil för barn"], "bil").length, 1);
});

test("slumpträff: -bar är en ändelse, ingen bar", () => {
  const namn = ["Hopfällbar stegpall", "Justerbart skrivbord", "Trap bar (hexbar) i svart stål", "Barstol i svart konstläder", "Frukostbar med två pallar"];
  // ☠️ "bar" gav 2 206 träffar.
  assert.deepEqual(sok(namn, "bar").sort(), ["Barstol i svart konstläder", "Frukostbar med två pallar", "Trap bar (hexbar) i svart stål"]);
  // Den som skriver "bär" är på väg mot "bärbar": träffen står kvar.
  assert.deepEqual(sok(["Barstol i svart konstläder", "Bärbar högtalare med handtag"], "bär"), ["Bärbar högtalare med handtag"]);
});

test("särskrivet: el bil är elbil och sy bord är sybord", () => {
  const namn = ["Elbil för barn 12 V", "Mobil bokvagn i vitt", "Hopfällbart sybord med hylla", "Skrivbord med systembord"];
  assert.equal(sok(namn, "el bil")[0], namn[0]);
  assert.equal(sok(namn, "el bil").includes("Mobil bokvagn i vitt"), false);
  assert.equal(sok(namn, "sy bord")[0], namn[2]);
});

// ── Ordningen inom samma poäng ───────────────────────────────────────────────
test("ordning: varan före tillbehöret, sammansättningen före slumpen", () => {
  const bord = ["Bordslampa med skärm", "Bordsduk för rektangulärt bord", "Matbord 110 cm", "Runt bord i bambu"];
  // Eget ord i huvuddelen, sist i ett ord i huvuddelen, eget ord efter "för", början av ett ord.
  assert.deepEqual(sok(bord, "bord"), ["Runt bord i bambu", "Matbord 110 cm", "Bordsduk för rektangulärt bord", "Bordslampa med skärm"]);
  // ☠️ "Star" gav bollkaSTARen före tältet Star River: "e" är ingen böjning av ett namn.
  const star = ["Bollkastare för hund", "Naturehike Star River tvåmanstält"];
  assert.equal(sok(star, "star")[0], star[1]);
  // En avledning är ett annat ord: rörbockaren är ingen bock, dörrkransen ingen kran.
  assert.equal(sok(["Hydraulisk rörbockare 16 ton", "Sågbockar 2-pack"], "bock")[0], "Sågbockar 2-pack");
  assert.equal(sok(["Konstgjord krans med eukalyptus", "Bänkmonterad kran"], "kran")[0], "Bänkmonterad kran");
});

test("ordning: ett ord om tre bokstäver visar sina sammansättningar före andra ord", () => {
  const sko = ["Skopa i rostfritt stål", "Skorstensfejarsats", "Skohylla med fyra hyllplan", "Skoskåp med tre luckor", "Hylla i stål", "Skåp i vitt"];
  // "sko" + "hylla" och "sko" + "skåp" är ord i katalogen; "pa" och "rstensfejarsats" är det inte.
  assert.deepEqual(sok(sko, "sko").slice(0, 2).sort(), ["Skohylla med fyra hyllplan", "Skoskåp med tre luckor"]);
  const bar = ["Barnbord med två stolar", "Högtryckstvätt 135 bar och 1800 W", "Barstol i svart", "Hopfällbar stol i böjträ"];
  // "135 bar" är en enhet, och "barn" är ett annat ord. "stol" står för sig i katalogen, så "bar" + "stol" är en sammansättning.
  assert.equal(sok(bar, "bar")[0], "Barstol i svart");
});

test("ordning: huvuddelen slutar vid i, på, under och parentes, men inte vid ett decimalkomma", () => {
  const kruka = ["Konstgjord växt i kruka", "Kruka i terrakotta"];
  assert.equal(sok(kruka, "kruka")[0], kruka[1]);
  const sang = ["Förvaring under sängen med lock", "Hopfällbar säng 190 × 80 cm"];
  assert.equal(sok(sang, "säng")[0], sang[1]);
  const hjul = ["Hylla på hjul med fem plan", "Svängbara hjul med broms, 4 tum"];
  assert.equal(sok(hjul, "hjul")[0], hjul[1]);
  // "1,5 m" är ett tal: ordet efter hör till huvuddelen.
  const tramp = ["Skydd med trampolin", "Barn 1,5 m trampolin"];
  assert.equal(sok(tramp, "trampolin")[0], tramp[1]);
});

// ── Inget namn har alla sökord ───────────────────────────────────────────────
const VARMARE = [
  "Dieselvärmare 5–8 kW blå", "Dieselvärmare 8 kW med fjärrkontroll", "Stabilisatorben för husvagn", "Trappsteg för husvagn",
  "Hopfällbar campingtoalett", "Stegpall av stål", "Stegpall med ledstång", "Hopfällbar hylla", "Hopfällbar stol", "Hopfällbar bänk",
  "Elbil för barn 12 V", "Elbil Audi för barn", "Elbil MINI för barn", "Elektrisk brandbil för barn 3–5 år", "Sparkcykel för barn",
  "Skrivbordsstol med nätrygg – 55 cm bred", "Skrivbord 120 cm i vitt", "Skrivbord med hylla, 100 cm", "Hörnskrivbord 140 cm",
  "Klädhängare i bambu", "Golvstående broschyrställ",
];

test("strykval: orden som säger mest om varan blir kvar", () => {
  // ☠️ Förr ströks det vanligaste ordet först: det ovanligaste blev kvar, hur lite det än sa.
  const diesel = utfall(VARMARE, "dieselvärmare husvagn");
  assert.deepEqual(diesel.strukna, ["husvagn"]);
  assert.equal(diesel.traffar.every((n) => n.startsWith("Dieselvärmare")), true);
  // Ett beskrivande ord väger mindre än varan.
  const pall = utfall(VARMARE, "ihopfällbar stegpall");
  assert.deepEqual(pall.strukna, ["ihopfällbar"]);
  assert.deepEqual(pall.traffar.sort(), ["Stegpall av stål", "Stegpall med ledstång"]);
  assert.deepEqual(utfall(VARMARE, "klädhängare golvstående").traffar, ["Klädhängare i bambu"]);
  // En bardisk är en vara, fast ordet slutar som "elektrisk".
  const disk = ["Hopfällbar bardisk med hylla", "Svart soffa", "Svart byrå", "Svart hylla", "Svart stol"];
  assert.deepEqual(utfall(disk, "svart bardisk").traffar, ["Hopfällbar bardisk med hylla"]);
  // Ett mycket ovanligare ord vinner över sökningens första.
  const brandbil = utfall(VARMARE, "elbil brandbil barn");
  assert.deepEqual(brandbil.traffar, ["Elektrisk brandbil för barn 3–5 år"]);
  assert.deepEqual(brandbil.strukna, ["elbil"]);
});

test("strykval: skrivbordsstolen går inte före skrivborden för att den är 55 cm bred", () => {
  const u = utfall(VARMARE, "skrivbord 85 cm bred");
  assert.equal(u.traffar.length >= 3, true);
  assert.equal(u.traffar[0].startsWith("Skrivbord"), true);
  assert.equal(u.traffar.indexOf("Skrivbordsstol med nätrygg – 55 cm bred") > u.traffar.indexOf("Hörnskrivbord 140 cm"), true);
  assert.equal(u.strukna.includes("85"), true);
  // En färg felskriven med dubblad bokstav är fortfarande en färg.
  const soffor = ["U-soffa med bäddfunktion", "Soffa 220 cm i krämvitt", "Konstgjorda cypresser – gråa detaljer"];
  assert.equal(utfall(soffor, "soffa gråå").traffar[0].toLowerCase().includes("soffa"), true);
});

// ── Stavningen rättas mot katalogens ord, och sidan säger det ────────────────
const STAVAT = [
  "Elkamin med mantel och vedhylla", "Elkamin 2000 W i svart", "Två hyllplan i vit melamin", "Dimbar LED-pendellampa i svart metall",
  "Barnbord med två stolar", "Barnbord i trä", "Barbord med svart metallram", "Barbord i ek", "Barbord med fyra pallar",
  "Satsbord 2-pack i guld", "Satsbord med glasskiva", "Satsbord i marmorlook", "Runda satsbord i svart", "Satsbord 3 delar", "Satsbord i ek",
  "Svetsbord på hjul", "Sparkbil för barn", "Rörutdragarset för rörgängor",
  "L-formad bokhylla för hörn", "Hundgrind med kattlucka",
];

test("stavning: ellamin är elkamin, och utfallet säger det", () => {
  // ☠️ En kunds sökning (GA4): 39 träffar med pendellampor och melamin.
  const u = utfall(STAVAT, "Ellamin");
  assert.equal(u.rattat, "elkamin");
  assert.deepEqual(u.traffar.sort(), ["Elkamin 2000 W i svart", "Elkamin med mantel och vedhylla"]);
  // rankaMedForslag lämnar ordet vidare som "visar": sidan och rutan säger vad de visar.
  assert.equal(rankaMedForslag(STAVAT, (n) => n, "ellamin").visar, "elkamin");
  assert.equal(utfall(STAVAT, "sparbil").rattat, "sparkbil");
  // Flera ord: bara det felstavade byts.
  assert.equal(utfall(STAVAT, "hundgrind kattluka").rattat, "hundgrind kattlucka");
});

test("stavning: en tappad bokstav före en bytt, en bytt vokal före en bytt konsonant", () => {
  // "barnord": ett b saknas (barnbord), hellre än n bytt mot b (barbord, som står i fler namn).
  assert.equal(utfall(STAVAT, "barnord").rattat, "barnbord");
  // "setsbord": e för a (satsbord, i sex namn), hellre än ett tappat v
  // (svetsbord, i ett). Bland ungefär lika nära vinner det vanligaste ordet.
  assert.equal(utfall(STAVAT, "setsbord").rattat, "satsbord");
});

test("stavning: ett ord vi inte har ger ingenting, inte det som råkar likna", () => {
  // ☠️ "Örhängen" (GA4) gav en rörutdragare: "örhäng" ligger ett fel från "r|örgäng|or".
  assert.deepEqual(utfall(STAVAT, "örhängen").traffar, []);
  assert.deepEqual(utfall(STAVAT, "homcom").traffar, []);
  // Träffar som bara ligger nära i stavning sägs vara det.
  const nara = utfall(STAVAT, "formanden");
  if (nara.traffar.length > 0) assert.equal(nara.liknande, true);
  // En rättad stavning är inte "liknande": den har sitt eget besked.
  assert.equal(utfall(STAVAT, "ellamin").liknande, undefined);
});

// ── Sökförslagen prövas mot namnen ───────────────────────────────────────────
const FORSLAG = [
  "Vägghylla i svart metall", "Vägghylla med fem kuber", "Vägghylla i ek", "Väggmonterad kryddhylla i bambu", "Bokhylla med fem hyllplan",
  "Golvlampa med fotbrytare", "Golvlampa med fotbrytare i svart", "Golvlampa med tre skärmar", "Fotbollsmål 180 cm", "Fotbollsmål i stål",
  "Fotpall i sammet", "Fotpall med förvaring", "TV-bänk 160 cm", "TV-bänk i valnöt", "Sittbänk för hallen", "Sittbänk med förvaring",
  "Smal byrå med fyra lådor", "Smal hurts 37 cm", "Elbil för barn", "Elbil Audi för barn", "Bilbana med två bilar", "Bilbana för barn",
];

test("förslag: särskrivet föreslås ihopskrivet, och flera ord ska finnas i något namn", () => {
  const forrad = byggOrdforrad(FORSLAG);
  const namn = FORSLAG.map(normalize);
  const forslag = (q: string) => sokforslagINamn(forrad, namn, q, 3);
  // ☠️ Butikens vanligaste egna sökning är "Vägg hylla".
  assert.equal(forslag("vägg hylla")[0], "vägghylla");
  assert.equal(forslag("el bil")[0], "elbil");
  assert.deepEqual(forslag("tv bänk"), ["tv-bänk"]);
  // ☠️ "golvlampa fot" blev "golvlampa fotbollsmål".
  const fot = forslag("golvlampa fot");
  assert.equal(fot.includes("golvlampa fotbollsmål"), false);
  assert.equal(fot.includes("golvlampa fotpall"), false);
  assert.deepEqual(fot, ["golvlampa fotbrytare"]);
  // Ett ensamt ord går som förut.
  assert.equal(forslag("fotb")[0], "fotbollsmål");
  // ☠️ "smal" är inte slutet av "fotbollsmål": prickarna gäller när ordet finns.
  assert.equal(forslag("smal").includes("fotbollsmål"), false);
});

// ── Kategorierna som matchar sökningen ───────────────────────────────────────
test("kategorier: ett kort ord är huvudet i kategorins ord, inte bokstäver i slutet", () => {
  // ☠️ "bar" gav "Baby & Småbarn", "tyg" gav Verktyg och "ring" Förvaring.
  assert.equal(kategoriPoang("Baby & Småbarn", "bar"), 0);
  assert.equal(kategoriPoang("Verktyg", "tyg"), 0);
  assert.equal(kategoriPoang("Förvaring & Organisering", "ring"), 0);
  assert.equal(kategoriPoang("Badrumsrenovering", "ring"), 0);
  // Huvudet i en sammansättning hittas, också efter en kort förled och i flertal.
  assert.equal(kategoriPoang("Växthus & Odling", "hus") > 0, true);
  assert.equal(kategoriPoang("Elbilar för barn", "bil") > 0, true);
  assert.equal(kategoriPoang("Uppresningsfåtöljer", "fåtölj") > 0, true);
  assert.equal(kategoriPoang("Soffor & bäddsoffor", "soffa") > 0, true);
  assert.equal(kategoriPoang("Badrumsspeglar", "spegel") > 0, true);
  const kat = [{ name: "Baby & Småbarn" }, { name: "Barbord" }, { name: "Speglar" }, { name: "Badrumsspeglar" }];
  assert.deepEqual(matchaKategorier("speglar", kat, 3).map((k) => k.name), ["Speglar", "Badrumsspeglar"]);
  assert.deepEqual(matchaKategorier("bar", kat, 3), []);
});

// ── Sökrutan ─────────────────────────────────────────────────────────────────
test("markering: böjda former markeras, småord inte", () => {
  const speglar = markeringsord("speglar");
  assert.equal(speglar[0], "speglar");
  assert.equal(speglar.includes("spegel"), true);
  assert.equal(markeringsord("stolar").includes("stol"), true);
  assert.equal(markeringsord("fåtölj med fotpall").includes("med"), false);
  // Längst först: "bordslampa" ska inte markeras som bara "bord".
  const ord = markeringsord("bord bordslampa");
  assert.equal(ord.indexOf("bordslampa") < ord.indexOf("bord"), true);
  // Bitarna på udda platser är träffarna, med sökningens egna spärrar:
  // ☠️ förr markerades "bar" i "Hopfällbar" och "sänkbara".
  const bar = markeraTraffar("Hopfällbar bardisk med bärväska – portabel bar", markeringsord("bar"));
  assert.deepEqual(bar.filter((_, i) => i % 2 === 1), ["bar", "bar"]);
  assert.equal(bar.join(""), "Hopfällbar bardisk med bärväska – portabel bar");
  assert.deepEqual(markeraTraffar("Trap bar (hexbar) i svart stål", ["bar"]).filter((_, i) => i % 2 === 1), ["bar", "bar"]);
  assert.deepEqual(markeraTraffar("Rund spegel med belysning", markeringsord("speglar")).filter((_, i) => i % 2 === 1), ["spegel"]);
  assert.deepEqual(markeraTraffar("Verktygsvagn i tyg", ["tyg"]).filter((_, i) => i % 2 === 1), ["tyg"]);
  // Versalerna i namnet står kvar.
  assert.deepEqual(markeraTraffar("Elkamin med mantel", ["elkamin"]), ["", "Elkamin", " med mantel"]);
  assert.deepEqual(markeraTraffar("Soffa", []), ["Soffa"]);
});

test("sökrutan: listboxen bär bara raderna, och har ett eget id per ruta", () => {
  const ruta = readFileSync(new URL("../components/searchbox.tsx", import.meta.url), "utf8");
  // Tre sökrutor finns i sidan (sidhuvudet, mobilraden, mobilmenyn): ett fast id vore dubblerat.
  assert.equal(ruta.includes('id="search-suggestions"'), false);
  assert.match(ruta, /const listaId = `\$\{uid\}-lista`;/);
  assert.match(ruta, /aria-controls=\{listaId\}/);
  assert.match(ruta, /<div role="listbox" id=\{listaId\} aria-label="Förslag">/);
  // Panelen själv är ingen listbox: den bär chips, rubriker och en fot.
  assert.match(ruta, /<div className="sugg" ref=\{panelRef\}/);
  assert.equal(/className="sugg"[^>]*role="listbox"/.test(ruta), false);
  // Rubrikerna inne i listboxen är presentation, och antalet läses upp.
  assert.equal((ruta.match(/className="sugg-head" role="presentation"/g) ?? []).length, 3);
  assert.match(ruta, /<div className="sr-only" role="status" aria-live="polite">\{upplast\}<\/div>/);
});

test("sökrutan: tabb ut stänger panelen, men ett tryck på iPhone gör det inte", () => {
  const ruta = readFileSync(new URL("../components/searchbox.tsx", import.meta.url), "utf8");
  // ☠️ relatedTarget är null när ett förslag trycks på iPhone: då får panelen inte stängas.
  assert.match(ruta, /const till = e\.relatedTarget as Node \| null;\s+if \(till && wrapRef\.current && !wrapRef\.current\.contains\(till\)\) setOpen\(false\);/);
  assert.match(ruta, /<div className="searchwrap" ref=\{wrapRef\} onBlur=\{onBlur\}>/);
});

test("sökrutan: panelen slutar ovanför tangentbordet, och bokstaven ritas före rankningen", () => {
  const ruta = readFileSync(new URL("../components/searchbox.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(ruta, /const vv = window\.visualViewport;/);
  assert.match(ruta, /wrap\.style\.setProperty\("--sok-max"/);
  // Utan variabeln (ingen visualViewport) gäller den gamla höjden.
  assert.match(css, /\.sugg\{[^}]*max-height:min\(640px,var\(--sok-max,calc\(100dvh - 200px\)\)\)/);
  // ☠️ Turen lämnas tillbaka innan rankningen, och en nyare tangent tar över efteråt.
  assert.match(ruta, /await new Promise<void>\(\(klar\) => setTimeout\(klar, 0\)\);\s+if \(senaste\.current !== val\) return;/);
  // Krysset är 44 px att träffa, och fotens knapp högre på pekskärm.
  assert.match(css, /\.search-rensa::after\{content:"";position:absolute;inset:-8px\}/);
  assert.match(css, /@media \(pointer:coarse\)\{[^}]*\}\.sugg-all\{padding-top:14px;padding-bottom:14px\}\}/);
});
