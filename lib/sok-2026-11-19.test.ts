// Run: node --test --experimental-strip-types lib/sok-2026-11-19.test.ts
//
// Sökningen efter 124 provsökningar mot butiken 2026-11-19 (Leonard: "tycker
// du vår sökfunktion är 10/10?"). Varje prov bär den sökning som gick fel på
// live och vad den svarade då. Namnen är ur katalogen.
import test from "node:test";
import assert from "node:assert/strict";
import {
  expandSynonyms, fuzzyOrdslut, FYLL_PA_UNDER, kategoriPoang, matchaKategorier, nameMatch, nameScore, rankaMedInfo, rankByName,
} from "./search.ts";

const sok = (namn: string[], q: string) => rankByName(namn, (n) => n, q);
const info = (namn: string[], q: string) => rankaMedInfo(namn, (n) => n, q);

// ── Korta ord och tal står för sig ───────────────────────────────────────────
test('☠️ "tv" är inte "två": svart tv-bänk gav en diskbänkslåda överst', () => {
  const namn = [
    "Utdragbar förvaring under diskbänken i två nivåer, 2-pack, svart",
    "Trädgårdsbänk i gjutaluminium med tulpanmönster – tvåsitsig, svart",
    "Picknickset i svart metall med bord och två bänkar",
    "TV-bänk på hjul 80 cm, svart",
    "TV-bänk 160 cm med RGB-LED och glashylla",
  ];
  assert.deepEqual(sok(namn, "tv-bänk"), [namn[3], namn[4]]);
  assert.deepEqual(sok(namn, "tv bänk"), [namn[3], namn[4]]);
  assert.deepEqual(sok(namn, "tv"), [namn[3], namn[4]]);
  // Den som har alla tre orden först, sedan de andra tv-bänkarna.
  assert.deepEqual(sok(namn, "svart tv-bänk"), [namn[3], namn[4]]);
});

test("ett kort ord träffar som eget ord, också intill bindestreck och skiljetecken", () => {
  assert.equal(nameScore("Hundbädd XL 122 × 92 cm", "xl"), 100);
  assert.equal(nameScore("LED-list 5 m med fjärrkontroll", "5 m led"), 60);
  assert.equal(nameScore("Dexlansoprazol", "xl"), 0);
  assert.equal(nameScore("Två viktskivor på 5 kg", "tv"), 0);
  assert.equal(nameScore("Rullande TV-stativ för 32 till 70 tum", "tv"), 100);
});

test('ett tal är ett mått: "120" är inte "1200" eller "2120"', () => {
  assert.equal(nameMatch("Skrivbord 120 cm i ekfärg", "skrivbord 120").full, true);
  assert.equal(nameMatch("Skrivbord 1200 × 600 mm", "skrivbord 120").full, false);
  assert.equal(nameMatch("Vit byrå med sex lådor, 120,1 × 39 cm", "byrå 120").full, true);
  assert.equal(nameScore("Hylla 2120 mm", "120"), 0);
});

test("tre bokstäver räcker som delsträng: huvudet i en sammansättning", () => {
  assert.ok(nameScore("Elbil för barn 12 V", "bil") > 0);
  assert.ok(nameScore("Hundbur på hjul", "bur") > 0);
});

// ── Stavfel: i ett ord, vid ordets slut, med rätt första bokstav ─────────────
test('☠️ "pulka" är inte början av "polkagris": nio tomtar blev svaret', () => {
  const namn = ["Sjungande jultomte 120 cm med polkagriskäpp", "Uppblåsbar snögubbe 180 cm med LED – polkagriskäpp och julklapp"];
  assert.deepEqual(sok(namn, "pulka"), []);
  assert.equal(fuzzyOrdslut("pulka", "med polkagriskäpp", 1), Infinity);
});

test('☠️ "aosom" är inte "a som": ett stavfel går inte över ett mellanslag', () => {
  const namn = ["Skobänk i bambu med två hyllplan – sittyta som bär 120 kg", "Golvlampa som lysande pelare 129 cm"];
  assert.deepEqual(sok(namn, "aosom"), []);
  assert.equal(fuzzyOrdslut("aosom", "sittyta som bär", 1), Infinity);
});

test("stavfelet träffar ordets slut, där huvudet står", () => {
  assert.equal(fuzzyOrdslut("kontorstol", "ergonomisk kontorsstol med hög rygg", 2), 1);
  assert.equal(fuzzyOrdslut("fåtöjl", "gungfåtölj med fotstöd", 1), 1);
  assert.equal(fuzzyOrdslut("julgrann", "julgranar 2-pack", 2), 1);
  assert.equal(fuzzyOrdslut("skrvbord", "gamingskrivbord i l-form", 2), 1);
  // En böjningsändelse eller två bokstäver får följa, inte ett helt ord.
  assert.equal(fuzzyOrdslut("konstjor", "konstgjorda växter", 2), 1);
  assert.equal(fuzzyOrdslut("växhus", "odlingslåda med växthuslock", 1), Infinity);
});

test('första bokstaven ska stämma: "cyckel" är cykel, inte nyckel', () => {
  assert.equal(fuzzyOrdslut("cyckel", "liggande motionscykel", 1), 1);
  assert.equal(fuzzyOrdslut("cyckel", "momentnyckel 1/2 tum", 1), Infinity);
  const namn = ["Momentnyckel 1/2 tum, 20 till 220 Nm", "Liggande motionscykel med ryggstöd"];
  assert.deepEqual(sok(namn, "cyckel"), [namn[1]]);
});

test('☠️ ett ord som finns i katalogen är rättstavat: "hundbur xl" gav en hundbädd', () => {
  const namn = [
    "Upphöjd hundbädd XL 122x92 cm – hopfällbar",
    "Hopfällbar hundtrappa till bil – tio steg",
    "Hundbur på hjul med två lådor – 100 cm",
    "Hopfällbar hundbur med kudde – två dörrar",
  ];
  const r = info(namn, "hundbur xl");
  assert.deepEqual(r.traffar, [namn[2], namn[3]]);
  assert.deepEqual(r.strukna, ["xl"]);
});

test("ett ord som INTE finns får fortfarande ett stavfel, också bredvid en färg", () => {
  const namn = ["Kontorsstol i svart PU-läder med hög rygg", "Kontorsstol i nät med nackstöd", "Sittbänk i svart sammet"];
  assert.deepEqual(sok(namn, "kontorstol svart")[0], namn[0]);
  assert.equal(info(namn, "kontorstol").traffar.length, 2);
});

// ── Inget namn har alla ord: stryk med besked ────────────────────────────────
test("strykningen: först ord som inte finns, sedan färg och mått, sedan det vanligaste", () => {
  const namn = [
    "Tresitsig bäddsoffa i chenille", "Tvåsitssoffa i manchester", "Barnstol i trä", "Barnbord i trä", "Barnbokhylla i trä",
    "Hundbur 100 cm", "Röd pall",
  ];
  // "2000" står inte i något namn.
  assert.deepEqual(info(namn, "soffa 2000"), { traffar: [namn[0], namn[1]], strukna: ["2000"] });
  // Färgen stryks före varan, också när färgen är ovanligare.
  assert.deepEqual(info(namn, "röd soffa"), { traffar: [namn[0], namn[1]], strukna: ["röd"] });
  // Utan färg eller mått: det vanligaste ordet säger minst ("barn" står i tre namn).
  assert.deepEqual(info(namn, "barn soffa").strukna, ["barn"]);
  // Ingenting struket när ett namn har alla ord.
  assert.deepEqual(info(namn, "hundbur 100").strukna, []);
});

test("ett ensamt ord som inte finns ger ärligt ingenting", () => {
  assert.deepEqual(info(["Soffa i grått tyg", "Byrå med sex lådor"], "kälke"), { traffar: [], strukna: [] });
  // Och två ord där inget finns.
  assert.deepEqual(info(["Soffa i grått tyg"], "kälke snowracer"), { traffar: [], strukna: [] });
});

test('frågeord räknas inte: "billig soffa" och "soffa under 2000 kr" är soffor', () => {
  const namn = ["3-sitssoffa i vit sammet med förvaring under sitsen", "Tvåsitssoffa i manchester", "Sidobord C-form – skjuts in under soffan"];
  assert.deepEqual(new Set(sok(namn, "billig soffa")), new Set(namn));
  const r = info(namn, "soffa under 2000 kr");
  assert.equal(r.traffar.length, 3);
  assert.deepEqual(r.strukna, ["2000"]);
});

// ── Färg och mått står ofta inte i namnet ────────────────────────────────────
test("få hela träffar fylls på med varorna utan färgen i namnet, efter de hela", () => {
  const namn = ["TV-bänk 160 cm med RGB-LED", "TV-bänk på hjul 80 cm, svart", "Väggmonterad TV-bänk i valnöt", "Svart sittbänk 100 cm"];
  const r = info(namn, "svart tv-bänk");
  assert.deepEqual(r.traffar, [namn[1], namn[0], namn[2]]);
  assert.deepEqual(r.strukna, []);
  assert.deepEqual(r.utan, ["svart"]);
  assert.equal(r.hela, 1);
});

test("en hel skärm med hela träffar fylls inte på", () => {
  const vita = Array.from({ length: FYLL_PA_UNDER }, (_, i) => `Vit byrå med ${i + 2} lådor`);
  const r = info([...vita, "Byrå i ek med sex lådor"], "vit byrå");
  assert.equal(r.traffar.length, FYLL_PA_UNDER);
  assert.equal(r.utan, undefined);
});

test("utan färg eller mått i sökningen fylls ingenting på", () => {
  const namn = ["Solcellslampa på stång", "Golvlampa i mässing", "Solcellsladdare 20 W"];
  assert.deepEqual(info(namn, "solcell lampa"), { traffar: [namn[0]], strukna: [] });
});

// ── Kundens ord för varor som heter något annat ──────────────────────────────
test("☠️ länstol, kommod, papperskorg och pallkrage hittar varorna", () => {
  const namn = [
    "Gungfåtölj med fotstöd i grå linnelook", "Byrå med sju tyglådor", "Sensorsoptunna 10 liter", "Pedalhink 12 liter i vitt",
    "Upphöjd odlingslåda i granträ", "Runt barnbord med två molnstolar", "Barnstaffli med två förvaringskorgar",
  ];
  assert.deepEqual(sok(namn, "länstol"), [namn[0]]);
  assert.deepEqual(sok(namn, "kommod"), [namn[1]]);
  assert.deepEqual(new Set(sok(namn, "papperskorg")), new Set([namn[2], namn[3]]));
  assert.deepEqual(sok(namn, "pallkrage"), [namn[4]]);
});

test("grupperna gäller åt båda hållen, och en exakt träff går först", () => {
  const namn = ["Klösträd 140 cm – katträd med flera plattformar", "Kattträningshjul i trä", "Studsmatta för barn 150 cm", "Barntrampolin 1,5 m"];
  assert.deepEqual(sok(namn, "kattträd"), [namn[0]]);
  assert.deepEqual(sok(namn, "trampolin"), [namn[3], namn[2]]);
  assert.deepEqual(sok(namn, "studsmatta"), [namn[2], namn[3]]);
});

test("envägsorden gäller bara från kundens ord", () => {
  assert.deepEqual(expandSynonyms("länstol"), ["fåtölj"]);
  assert.deepEqual(expandSynonyms("fåtölj").includes("länstol"), false);
  // "byrå" som gruppmedlem hade blivit nålen "byr", som står i "labyrint".
  assert.equal(nameScore("Labyrintspel i trä", "kommod"), 0);
  // "eldfat" som gruppmedlem hade gett nålen "eldf", som står i "eldfast".
  assert.deepEqual(expandSynonyms("eldfat"), ["eldkorg"]);
  assert.deepEqual(expandSynonyms("eldkorg"), []);
});

test('kategoriord ger varor som hör dit: "trädgårdsmöbler" gav en presenning', () => {
  const namn = ["Trädgårdsbord Ø 80 cm", "Loungegrupp i konstrotting", "Bistroset i vitt stål", "Skyddsöverdrag för utemöbler 135 × 135 cm", "Presenning 6 × 4 m"];
  assert.equal(sok(namn, "trädgårdsmöbler").length, 4);
  assert.equal(sok(namn, "utemöbler").length, 4);
  // Den som har ordet i namnet först.
  assert.equal(sok(namn, "utemöbler")[0], namn[3]);
});

test('ett sökord skrivet ihop träffar över bindestrecket, också bredvid andra ord', () => {
  const namn = ["TV-bänk på hjul 80 cm, svart", "Sittbänk 120 cm i ljusgrå linnelook – svart stålram"];
  assert.deepEqual(sok(namn, "svart tvbänk"), [namn[0]]);
  // Men "topp" är inte "top-p…".
  assert.equal(nameScore("Hardtop-paviljong 300 cm", "blå topp"), 0);
});

// ── Kategorier ───────────────────────────────────────────────────────────────
const KATEGORIER = [
  "Möbler", "Soffor & bäddsoffor", "Fåtöljer", "Snurr­fåtöljer", "Soffbord & småbord", "TV-bänkar", "Byråer", "Speglar",
  "Belysning", "Golvlampor", "Utemöbler", "Trädgård", "Soptunnor", "Odlingslådor", "Klösträd", "Hundburar", "Hundkojor",
  "Kontors­stolar", "Julgranar", "Jul­dekoration", "Leksaker & Spel", "Barn", "Elbilar för barn",
].map((name) => ({ name, slug: name.toLowerCase() }));
const kat = (q: string) => matchaKategorier(q, KATEGORIER).map((k) => k.name.replace(/­/g, ""));

test("kategorinamnen står i plural: soffa, fåtölj, spegel och byrå hittar sina", () => {
  assert.deepEqual(kat("soffa"), ["Soffor & bäddsoffor"]);
  assert.deepEqual(kat("fåtölj"), ["Fåtöljer", "Snurrfåtöljer"]);
  assert.deepEqual(kat("spegel"), ["Speglar"]);
  assert.deepEqual(kat("byrå"), ["Byråer"]);
  assert.deepEqual(kat("julgran"), ["Julgranar"]);
});

test('☠️ "soffa" är inte "soffbord", fast båda blir "soff" i kanonisk form', () => {
  assert.equal(kategoriPoang("Soffbord & småbord", "soffa"), 0);
  assert.equal(kategoriPoang("Soffbord & småbord", "soffor"), 0);
});

test("den allmänna kategorin före den smala, och högst tre", () => {
  assert.deepEqual(kat("möbler"), ["Möbler", "Utemöbler"]);
  assert.deepEqual(kat("barn"), ["Barn", "Elbilar för barn"]);
  assert.deepEqual(kat("hund"), ["Hundburar", "Hundkojor"]);
  assert.equal(matchaKategorier("möbler", KATEGORIER, 1).length, 1);
});

test("synonymer, envägsord och stavning gäller kategorierna också", () => {
  assert.deepEqual(kat("länstol"), ["Fåtöljer", "Snurrfåtöljer"]);
  assert.deepEqual(kat("kommod"), ["Byråer"]);
  assert.deepEqual(kat("papperskorg"), ["Soptunnor"]);
  assert.deepEqual(kat("pallkrage"), ["Odlingslådor"]);
  assert.deepEqual(kat("kattträd"), ["Klösträd"]);
  assert.deepEqual(kat("lampa"), ["Belysning", "Golvlampor"]);
  assert.deepEqual(kat("julpynt"), ["Juldekoration"]);
  assert.deepEqual(kat("trädgårdsmöbler"), ["Utemöbler", "Trädgård"]);
});

test("färg och mått hör inte till kategorin, och bindestreck skiljer inte", () => {
  assert.deepEqual(kat("svart tv-bänk"), ["TV-bänkar"]);
  assert.deepEqual(kat("tvbänk"), ["TV-bänkar"]);
  assert.deepEqual(kat("kontorsstol"), ["Kontorsstolar"]);
  assert.deepEqual(kat("xl"), []);
  assert.deepEqual(kat("180 cm"), []);
});

test("ett ord utan kategori ger ingen, och varje ord måste träffa", () => {
  assert.deepEqual(kat("pulka"), []);
  assert.deepEqual(kat("retur"), []);
  assert.deepEqual(kat("soffa pulka"), []);
  assert.deepEqual(kat("a"), []);
  assert.deepEqual(kat(""), []);
});
