// Run: node --test --experimental-strip-types lib/sok-2026-11-19.test.ts
//
// Sökningen efter 124 provsökningar mot butiken 2026-11-19 (Leonard: "tycker
// du vår sökfunktion är 10/10?"). Varje prov bär den sökning som gick fel på
// live och vad den svarade då. Namnen är ur katalogen.
import test from "node:test";
import assert from "node:assert/strict";
import {
  byggOrdforrad, expandSynonyms, fuzzyOrdslut, FYLL_PA_UNDER, kategoriPoang, kortOrd, matchaKategorier, menadeDu, nameMatch, nameScore, rankaMedForslag, rankaMedInfo, rankByName, sokforslag, visaVarorFor,
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

test('förkortningar står för sig: "usb" är inte "husbilstrappa" och "led" inte "ledstång"', () => {
  assert.equal(nameScore("Husbilstrappa med ledstång och fyra steg", "usb"), 0);
  assert.equal(nameScore("Husbilstrappa med ledstång och fyra steg", "led"), 0);
  assert.ok(nameScore("LED-ljusbräda med USB-C och steglös dimring", "usb") > 0);
  assert.ok(nameScore("LED-ljusbräda med USB-C och steglös dimring", "led") > 0);
  assert.ok(nameScore("Badrumsspegel LED 100 × 80 cm", "badrumsspegel led") > 0);
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

test('☠️ ett kort ord blir inte kvar som det "ovanligaste": öppen spis el', () => {
  const namn = [
    "Gnistskydd för öppen spis 96 cm – tre paneler", "Gnistskydd för öppen spis i svart metall",
    "Kylbox 42,6 liter utan el – håller kylan i 72 timmar", "Öppen garderob i svart", "Spis med två plattor",
  ];
  const r = info(namn, "öppen spis el");
  assert.deepEqual(r.traffar, [namn[0], namn[1]]);
  assert.deepEqual(r.strukna, ["el"]);
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
  // Sedan 2026-11-21 står eldkorg i en grupp med eldstad och eldskål, men
  // "eldfat" är fortfarande bara kundens ord: det blir ingen nål åt andra hållet.
  assert.ok(expandSynonyms("eldkorg").includes("eldstad"));
  assert.equal(expandSynonyms("eldkorg").some((n) => n.startsWith("eldf")), false);
});

test('kategoriord ger varor som hör dit: "trädgårdsmöbler" gav en presenning', () => {
  const namn = ["Trädgårdsbord Ø 80 cm", "Loungegrupp i konstrotting", "Bistroset i vitt stål", "Skyddsöverdrag för utemöbler 135 × 135 cm", "Presenning 6 × 4 m"];
  assert.equal(sok(namn, "trädgårdsmöbler").length, 4);
  assert.equal(sok(namn, "utemöbler").length, 4);
});

test('☠️ möblerna går före tillbehöret som bara nämner ordet: "utemöbler" gav tre skyddsöverdrag först', () => {
  const namn = [
    "Skyddsöverdrag för utemöbler 135 × 135 cm", "Trädgårdsbord Ø 80 cm", "Loungegrupp i konstrotting",
    "Stapelbara utemöbler 7 delar – bord och sex stolar", "Parasoll till trädgårdsbord, 3 m",
  ];
  // Ordet i namnets huvuddel, sedan varor av rätt typ, sedan tillbehören.
  assert.deepEqual(sok(namn, "utemöbler"), [namn[3], namn[1], namn[2], namn[0], namn[4]]);
  assert.equal(nameScore(namn[1], "utemöbler"), 92);
  assert.equal(nameScore(namn[0], "utemöbler"), 90);
  // Synonymgrupperna rörs inte: ordet i namnet går fortfarande före synonymen.
  assert.ok(nameScore("Skydd för soptunna", "soptunna") > nameScore("Pedalhink 12 liter", "soptunna"));
});

test('ett sökord skrivet ihop träffar över bindestrecket, också bredvid andra ord', () => {
  const namn = ["TV-bänk på hjul 80 cm, svart", "Sittbänk 120 cm i ljusgrå linnelook – svart stålram"];
  assert.deepEqual(sok(namn, "svart tvbänk"), [namn[0]]);
  // Men "topp" är inte "top-p…".
  assert.equal(nameScore("Hardtop-paviljong 300 cm", "blå topp"), 0);
});

// ── Kategorier ───────────────────────────────────────────────────────────────
const KATEGORIER = [
  "Möbler", "Soffor & bäddsoffor", "Fåtöljer", "Snurr\u00adfåtöljer", "Soffbord & småbord", "TV-bänkar", "Byråer", "Speglar",
  "Belysning", "Golvlampor", "Utemöbler", "Trädgård", "Soptunnor", "Odlingslådor", "Klösträd", "Hundburar", "Hundkojor",
  "Kontors\u00adstolar", "Julgranar", "Jul\u00addekoration", "Leksaker & Spel", "Barn", "Elbilar för barn",
].map((name) => ({ name, slug: name.toLowerCase() }));
const kat = (q: string) => matchaKategorier(q, KATEGORIER).map((k) => k.name.replace(/\u00ad/g, ""));

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

test("plattaKategorier: avdelningarna först, sedan delarna, och en slug bara en gång", async () => {
  const { plattaKategorier, rentNamn } = await import("./sok-kategorier.ts");
  const trad = [
    { name: "Möbler", slug: "mobler", subs: [{ name: "Soffor", slug: "soffor" }, { name: "Utemöbler", slug: "utemobler" }] },
    { name: "Trädgård", slug: "tradgard", subs: [{ name: "Utemöbler", slug: "utemobler" }, { name: "", slug: "tom" }] },
  ];
  assert.deepEqual(plattaKategorier(trad).map((k) => k.slug), ["mobler", "tradgard", "soffor", "utemobler"]);
  assert.equal(rentNamn("Trädgårds­möbler"), "Trädgårdsmöbler");
});

// ── Den kalla vägen: samma varor som servern söker i (lib/sok-kall.ts) ──────
test("☠️ den kalla vägen söker också bland de slutsålda: varulistan har bara det som går att köpa", async () => {
  const { kandidater, kortUrIndex } = await import("./sok-kall.ts");
  const lista = [
    { id: "a", slug: "tv-bank-valnot", name: "TV-bänk i valnöt 160 cm", price: "1 599 kr", priceNum: 1599, inStock: true },
    { id: "b", slug: "sittbank", name: "Sittbänk 120 cm", price: "899 kr", priceNum: 899, inStock: true },
  ];
  const index = [
    { n: "TV-bänk i valnöt 160 cm", s: "tv-bank-valnot", i: "a.jpg", p: "1 599 kr" },
    { n: "Svart TV-bänk på hjul", s: "tv-bank-svart", i: "b.jpg", p: "Från 1 259 kr", o: 1 as const },
    { n: "Sittbänk 120 cm", s: "sittbank", i: "c.jpg", p: "899 kr", o: 1 as const }, // står redan i listan: listan vinner
    { n: "Hylla utan märke", s: "hylla", i: "d.jpg", p: "499 kr" },                // köpbar men inte i listan: läggs inte till
  ];
  const alla = kandidater(lista, index);
  // Raderna följer indexets ordning (lib/sok-ordning.ts), inte listans.
  assert.deepEqual(alla.map((p) => p.slug), ["tv-bank-valnot", "tv-bank-svart", "sittbank"]);
  // Listans kort vinner över indexets rad, men fotot som listan saknar tas ur indexet.
  assert.equal(alla[2].inStock, true);
  assert.equal(alla[2].price, "899 kr");
  assert.deepEqual(alla.map((p) => p.img), ["a.jpg", "b.jpg", "c.jpg"]);
  // Med den slutsålda med har ett namn alla sökord, så "svart" stryks inte.
  const r = rankaMedInfo(alla, (p) => p.name, "svart tv-bänk");
  assert.deepEqual(r.strukna, []);
  assert.equal(r.hela, 1);
  // Utan index: bara det som går att köpa, och då stryks ordet.
  assert.deepEqual(kandidater(lista, null).map((p) => p.slug), ["tv-bank-valnot", "sittbank"]);
  assert.deepEqual(rankaMedInfo(kandidater(lista, null), (p) => p.name, "svart tv-bänk").strukna, ["svart"]);

  // Kortet ritar samma pristext som indexet bär (components/productcard.tsx).
  assert.deepEqual(kortUrIndex(index[1]), {
    id: "", slug: "tv-bank-svart", name: "Svart TV-bänk på hjul", price: "1 259 kr", priceNum: 1259, inStock: false,
    img: "b.jpg", hasRange: true, priceFrom: "1 259 kr", priceFromNum: 1259,
  });
  const utanFoto = kortUrIndex({ n: "Pall", s: "pall", i: "", p: "12 999 kr", o: 1 });
  assert.equal(utanFoto.priceNum, 12999);
  assert.equal("img" in utanFoto, false);
  assert.equal(utanFoto.hasRange, undefined);
});

test("söksidans kalla väg lägger till de slutsålda ur sökindexet", async () => {
  const { readFileSync } = await import("node:fs");
  const kalla = readFileSync(new URL("../components/sok-kall.tsx", import.meta.url), "utf8");
  assert.match(kalla, /kandidater\(lista, slutsalda\)/);
  assert.match(kalla, /laddaSokIndex\(\)/);
});

// ── Sista genomgången av sökfältet (2026-11-19) ─────────────────────────────
test('priset i sökningen: "soffa under 2000" är soffor under 2 000 kr', async () => {
  const { tolkaPris, inomPris, prisTal, lagstaPris, prisText, harPris } = await import("./sok-pris.ts");
  assert.deepEqual(tolkaPris("soffa under 2000"), { fraga: "soffa", max: 2000 });
  assert.deepEqual(tolkaPris("soffa under 2 000 kr"), { fraga: "soffa", max: 2000 });
  assert.deepEqual(tolkaPris("Soffa Under 2000kr"), { fraga: "Soffa", max: 2000 });
  assert.deepEqual(tolkaPris("billig soffa max 1500:-"), { fraga: "billig soffa", max: 1500 });
  assert.deepEqual(tolkaPris("fåtölj över 5000"), { fraga: "fåtölj", min: 5000 });
  assert.deepEqual(tolkaPris("säng upp till 3.500 kr med madrass"), { fraga: "säng med madrass", max: 3500 });
  assert.deepEqual(tolkaPris("hylla under 200 kr"), { fraga: "hylla", max: 200 });
  assert.equal(harPris(tolkaPris("soffa under 2000")), true);
  assert.equal(harPris(tolkaPris("soffa")), false);

  assert.equal(inomPris({ max: 2000 }, 1999), true);
  assert.equal(inomPris({ max: 2000 }, 2000), true);
  assert.equal(inomPris({ max: 2000 }, 2001), false);
  assert.equal(inomPris({ min: 5000 }, 4999), false);
  assert.equal(inomPris({ min: 5000 }, 5000), true);
  assert.equal(inomPris({ max: 2000 }, 0), false, "ett pris som inte gick att läsa räknas inte som billigt");
  assert.equal(prisTal("Från 1 259 kr"), 1259);
  assert.equal(prisTal("12 999 kr"), 12999);
  assert.equal(prisTal(""), 0);
  assert.equal(lagstaPris({ priceNum: 2499, priceFromNum: 1899, hasRange: true }), 1899);
  assert.equal(lagstaPris({ priceNum: 2499 }), 2499);
  assert.equal(prisText({ max: 2000 }), "under 2 000 kr");
  assert.equal(prisText({ min: 12500 }), "över 12 500 kr");
});

test("☠️ ett tal efter “under” är inte alltid ett pris: ålder, mått och små tal", async () => {
  const { tolkaPris } = await import("./sok-pris.ts");
  for (const q of [
    "leksak under 3 år", "skrivbord under 120 cm", "tv-bänk max 160", "tält över 4 personer", "pool över 300 cm",
    "skåp under diskbänk", "förvaring under säng", "hantlar max 20 kg", "soffa", "",
  ]) assert.deepEqual(tolkaPris(q), { fraga: q }, q);
  // Bara ett pris och inga sökord: inget att ranka, så sökningen lämnas som den är.
  assert.deepEqual(tolkaPris("under 500"), { fraga: "under 500" });
  assert.deepEqual(tolkaPris("max 1000 kr"), { fraga: "max 1000 kr" });
});

test("priset gallrar träffarna, sökorden rankas utan det", async () => {
  const { tolkaPris, inomPris, prisTal } = await import("./sok-pris.ts");
  const varor = [
    { n: "Tvåsitssoffa i manchester", p: "2 499 kr" }, { n: "Bäddsoffa i grå chenille", p: "Från 1 899 kr" },
    { n: "Barnsoffa med kuddar", p: "799 kr" }, { n: "Soffbord i ek", p: "999 kr" },
  ];
  const pris = tolkaPris("soffa under 2000");
  const traffar = rankByName(varor, (v) => v.n, pris.fraga).filter((v) => inomPris(pris, prisTal(v.p)));
  assert.deepEqual(traffar.map((v) => v.n).sort(), ["Barnsoffa med kuddar", "Bäddsoffa i grå chenille"]);
  // "2000" stryks inte längre som ett sökord som saknas: det är inget sökord.
  assert.deepEqual(info(varor.map((v) => v.n), pris.fraga).strukna, []);
});

test("senaste sökningar: nyast först, en gång var, högst fem", async () => {
  const { medSokning, tolkaSparade, SENASTE_MAX } = await import("./sok-senaste.ts");
  let l: string[] = [];
  for (const s of ["hundbur", "soffa", "  Hundbur  ", "tv-bänk", "a", "matta", "lampa", "säng"]) l = medSokning(l, s);
  assert.deepEqual(l, ["säng", "lampa", "matta", "tv-bänk", "Hundbur"]);
  assert.equal(l.length, SENASTE_MAX);
  assert.deepEqual(medSokning(["soffa"], "x".repeat(61)), ["soffa"], "en orimligt lång sökning sparas inte");
  assert.deepEqual(tolkaSparade('["soffa",3,null,"",  "tv-bänk"]'), ["soffa", "tv-bänk"]);
  assert.deepEqual(tolkaSparade("inte json"), []);
  assert.deepEqual(tolkaSparade('{"a":1}'), []);
  assert.deepEqual(tolkaSparade(null), []);
});

test("☠️ sökhistoriken sparas bara med kundens ja till kakor", async () => {
  const { readFileSync } = await import("node:fs");
  const kalla = readFileSync(new URL("./sok-senaste.ts", import.meta.url), "utf8");
  // Varje skrivning och läsning av listan i lagringen står bakom farSpara().
  assert.match(kalla, /getItem\(SAMTYCKE_NYCKEL\) === "all"/);
  assert.match(kalla, /if \(farSpara\(\)\) sparade = tolkaSparade\(window\.localStorage\.getItem\(SENASTE_NYCKEL\)\)/);
  assert.match(kalla, /if \(farSpara\(\)\) window\.localStorage\.setItem\(SENASTE_NYCKEL/);
  assert.equal(kalla.split("localStorage.setItem").length, 2, "en enda skrivning");
  // Nyckeln och värdet är samma som i lib/consent.ts.
  const samtycke = readFileSync(new URL("./consent.ts", import.meta.url), "utf8");
  assert.match(samtycke, /export const CONSENT_KEY = "fp_cookie_consent";/);
});

test("sökrutan: antal i knappen, kryss, alla sökord i fetstil och uppläst rad", async () => {
  const { readFileSync } = await import("node:fs");
  const ruta = readFileSync(new URL("../components/searchbox.tsx", import.meta.url), "utf8");
  assert.match(ruta, /Visa alla \{totalt\} resultat för/);
  assert.match(ruta, /aria-label="Rensa sökfältet"/);
  assert.match(ruta, /enterKeyHint="search"/);
  assert.match(ruta, /aria-activedescendant=\{visas && active >= 0 && active < rader \? radId\(active\) : undefined\}/);
  // Antalet är listans sju, eller rutnätets tolv i mobilens sökläge (lib/sok-lage.test.ts).
  assert.match(ruta, /const antal = helskarm && arSmal\(\) \? RUTNAT : SUGGESTION_COUNT;/);
  assert.match(ruta, /m\.rankaForslagMedAntal\(idx, pris\.fraga, antal, harPris\(pris\) \?/);
  assert.match(ruta, /className="sugg-chip" key=\{t\} onClick=\{\(\) => goSearch\(t\)\}/);
  // Senaste sökningar, exemplen och sökförslagen tar plats från varorna: panelen blir inte högre.
  assert.match(ruta, /popular\.slice\(0, SUGGESTION_COUNT - \(visaTidigare \? RADER_SENASTE : 0\) - \(visaExempel \? RADER_CHIPS : 0\)\)/);
  assert.match(ruta, /hits\.slice\(0, SUGGESTION_COUNT - kategorier\.length - \(visaForslag \? RADER_CHIPS : 0\)\)/);
});

test("☠️ listan börjar om när varorna byts: prisreglaget blev ett filter ingen valt", async () => {
  const { readFileSync } = await import("node:fs");
  const vy = readFileSync(new URL("../components/sok-vy.tsx", import.meta.url), "utf8");
  // Nyckeln bär sökningen och läget. Sedan 2026-11-21 har den ett namn, för
  // rubrikens antal hör till samma lista (onAntal).
  assert.match(vy, /const listnyckel = `\$\{q\}\|\$\{visaAlla \? "alla" : "inom"\}`;/);
  assert.match(vy, /<ShopBrowser key=\{listnyckel\} products=\{visade\} defaultSort="rel" andraBilderUrKartan=\{klar\.kall\} onAntal=\{omAntal\} \/>/);
  // Knapparna i beskeden och i sökrutan ska inte få webbläsarens grå ram.
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  for (const k of [".search-rensa", ".sugg-rensa", ".sok-besked-knapp"]) {
    const regel = css.slice(css.indexOf(`${k}{`), css.indexOf("}", css.indexOf(`${k}{`)));
    assert.match(regel, /background:none;border:0/, k);
  }
});

test("förslagen med antal: gallringen görs före klippet", async () => {
  // rankaForslagMedAntal ligger i lib/sok-rankning.ts, som inte går att ladda här
  // (importerar utan ändelse). Regeln prövas på samma steg: ranka, gallra, klipp.
  const { inomPris, prisTal } = await import("./sok-pris.ts");
  const varor = Array.from({ length: 12 }, (_, i) => ({ n: `Soffa modell ${i + 1}`, p: `${(i + 1) * 500} kr` }));
  const alla = rankByName(varor, (v) => v.n, "soffa");
  const kvar = alla.filter((v) => inomPris({ max: 2000 }, prisTal(v.p)));
  assert.equal(kvar.length, 4);
  assert.equal(alla.slice(0, 3).filter((v) => inomPris({ max: 2000 }, prisTal(v.p))).length <= 3, true);
  const { readFileSync } = await import("node:fs");
  const index = readFileSync(new URL("./sok-rankning.ts", import.meta.url), "utf8");
  // Gallra på priset, lägg det köpbara först, klipp: i den ordningen (lib/sok-ordning.ts).
  // `ordnade` är träffarna som de rankades, eller billigast först för "soffa billigast" (2026-11-21).
  // Sedan 2026-11-25 går stegen genom namnForst (lib/sok-ordning.ts): varan som heter som
  // sökningen hos en prisjämförelsesajt står kvar först, och gallringen (`behall`) gäller alla.
  assert.match(index, /const \{ traffar: kvar, namn \} = namnForst\(\s+utfall\.traffar,\s+utfall\.namn,\s+\(resten\) => kopbaraForst\([\s\S]{0,220}\(h\) => h\.o === 1,\s+\),\s+behall,\s+\);\s+return \{\s+traffar: kvar\.slice\(0, antal\),/);
  assert.match(index, /totalt: kvar\.length/);
});

// ── Sökförslag: orden kunden är på väg att skriva ───────────────────────────
const KATALOG = [
  "Tvåsitssoffa i manchester", "Tvåsitssoffa i grå chenille", "Bäddsoffa med förvaring", "Bäddsoffa i sammet", "Hörnsoffa 240 cm",
  "Hörnsoffa med divan", "Soffbord i ek", "Soffbord med glasskiva", "Soffbord i marmorlook", "Soptunna 30 liter", "Soptunna med pedal",
  "Julgran 180 cm med LED", "Julgran 210 cm", "Julgranar 2-pack", "Talljulgran 150 cm", "Talljulgran 180 cm", "Hundbur 100 cm", "Hundbur i metall",
  "Hundgrind 76 cm", "Hundgrind i trä", "Hundgrind med dörr", "TV-bänk 160 cm", "TV-bänk i valnöt", "Tvättkorg i bambu", "Tvättkorg med lock",
  "Matta 160 × 230 cm", "Matta i jute", "Hängmatta med ställning", "Hängmatta i bomull", "Manuell gräsklippare", "Manuellt stansverktyg",
  "Justerbar hantelbänk", "Justerbar skrivbordsstol", "Konstgjord växt 120 cm", "Konstgjort gräs 2 × 5 m", "Kontorsstol i nät", "Kontorsstol med nackstöd",
  "Kontorsstol i svart", "Kontorsstol med fotstöd", "Kontorsstol i manchester", "Fåtölj i sammet", "Fåtölj med fotpall", "Soffa i grått tyg", "Soffa med schäslong",
];

test('sökförslag: "sof" fylls i, "soffa" blir smalare, och prickarna får saknas', () => {
  const f = byggOrdforrad(KATALOG);
  assert.deepEqual(sokforslag(f, "sof", 3), ["soffbord", "soffa"]);
  // Lika vanliga ord står i bokstavsordning: samma svar varje gång.
  assert.deepEqual(sokforslag(f, "soffa", 3), ["bäddsoffa", "hörnsoffa", "tvåsitssoffa"]);
  assert.deepEqual(sokforslag(f, "fatol", 3), ["fåtölj"]);
  assert.deepEqual(sokforslag(f, "hund", 3), ["hundgrind", "hundbur"]);
  // Det sista ordet fylls i, resten står kvar.
  assert.deepEqual(sokforslag(f, "grå sof", 2), ["grå soffbord", "grå soffa"]);
  // Inget att föreslå: tomt, inte en gissning.
  assert.deepEqual(sokforslag(f, "pulk", 3), []);
  assert.deepEqual(sokforslag(f, "s", 3), []);
  assert.deepEqual(sokforslag(f, "", 3), []);
});

test('☠️ sökförslag: "tv" är tv-bänk och inte tvåsitssoffa, och "matt" är matta före hängmatta', () => {
  const f = byggOrdforrad(KATALOG);
  assert.deepEqual(sokforslag(f, "tv", 3), ["tv-bänk"]);
  assert.deepEqual(sokforslag(f, "svart tv", 3), ["svart tv-bänk"]);
  assert.equal(sokforslag(f, "matt", 3)[0], "matta");
  assert.ok(sokforslag(f, "matt", 3).includes("hängmatta"));
  // "julgr" är inte färdigskrivet: julgran föreslås, en gång (inte också "julgranar").
  assert.deepEqual(sokforslag(f, "julgr", 3), ["julgran", "talljulgran"]);
  // Ordet som redan står i rutan, och dess böjningar, föreslås inte.
  assert.ok(!sokforslag(f, "soffa", 5).includes("soffa"));
  assert.ok(!sokforslag(f, "hundbur", 5).some((x) => /^hundbur/.test(x)));
});

test("sökförslag: adjektiv, färger och småord föreslås inte, och exemplen är varuord", () => {
  const f = byggOrdforrad(KATALOG);
  const ord = new Set(f.ord.map((o) => o.text));
  for (const o of ["manuell", "manuellt", "justerbar", "konstgjord", "konstgjort", "grått", "svart", "med"]) assert.ok(!ord.has(o), o);
  for (const o of ["kontorsstol", "soffbord", "julgran", "hundgrind"]) assert.ok(ord.has(o), o);
  // Ental och flertal är ett förslag.
  assert.equal(f.ord.filter((o) => /^julgran/.test(o.text)).length, 1);
  // Den tomma rutans exempel: det som oftast inleder ett namn, minst fem gånger.
  assert.deepEqual(f.exempel, ["kontorsstol"]);
  assert.deepEqual(byggOrdforrad([]), { ord: [], exempel: [], former: new Set() });
});

test("sökrutan visar sökförslagen och exemplen som chips som söker", async () => {
  const { readFileSync } = await import("node:fs");
  const ruta = readFileSync(new URL("../components/searchbox.tsx", import.meta.url), "utf8");
  assert.match(ruta, /const forslagen = harPris\(pris\) \? \[\] : m\.sokforslagFor\(idx, term, SOKFORSLAG\);\s+setForslag\(forslagen\);/);
  assert.match(ruta, /className="sugg-forslag sugg-chiprad" role="group" aria-label="Sökförslag"/);
  assert.match(ruta, /className="sugg-exempel sugg-chiprad"/);
  // Exemplens chips och sökförslagens: båda söker på sitt ord.
  assert.equal(ruta.split('className="sugg-chip sugg-chip-sok" key={t} onClick={() => goSearch(t)}').length, 2);
  assert.match(ruta, /className=\{`sugg-chip sugg-chip-sok\$\{t === visar \? " sugg-chip-visas" : ""\}`\} key=\{t\} onClick=\{\(\) => goSearch\(t\)\}/);
  assert.match(ruta, /className="sugg-tangenter" aria-hidden="true"/);
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.sugg-tangenter\{display:none\}\n@media\(hover:hover\) and \(pointer:fine\)/);
});

// ── Sista kontrollen: inget buggar, och sidan bär inte sökmotorn ────────────
test("☠️ sökmotorn laddas vid avsikt: sidhuvudet på varje sida bär den inte", async () => {
  const { readFileSync } = await import("node:fs");
  const las = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");
  const ruta = las("../components/searchbox.tsx");
  const importer = ruta.split("\n").filter((r) => /^import /.test(r)).join("\n");
  // Varken motorn eller rankningen får importeras överst i sökrutan …
  assert.doesNotMatch(importer, /lib\/search"|lib\/sok-rankning"/);
  // … och inte heller i något sökrutan importerar överst.
  for (const f of ["./sok-index.ts", "./sok-kategorier.ts", "./sok-pris.ts", "./sok-senaste.ts"]) {
    assert.doesNotMatch(las(f), /^import [^\n]*from "\.\/(search|sok-rankning)"/m, f);
  }
  assert.match(ruta, /motorLofte = import\("\.\.\/lib\/sok-rankning"\)/);
  // Ett fall får inte bli permanent, och avsikten hämtar båda.
  assert.match(ruta, /\(\) => \{ motorLofte = null; return null; \}/);
  assert.match(ruta, /void Promise\.all\(\[laddaSokIndex\(\), laddaMotor\(\)\]\)\.then\(\(\[idx, m\]\) => \{ if \(idx && m\) m\.varmUpp\(idx\); \}\);/);
  // Menyerna, som också ligger på varje sida, bär bara kategorilistan.
  for (const f of ["../components/meganav.tsx", "../components/mobilenav.tsx"]) assert.doesNotMatch(las(f), /lib\/search"|lib\/sok-rankning"/, f);
});

test("☠️ rutan räknar om förslagen för ordet som står i den", async () => {
  const { readFileSync } = await import("node:fs");
  const ruta = readFileSync(new URL("../components/searchbox.tsx", import.meta.url), "utf8");
  // Fokus med ett ord i rutan: förslagen för det ordet, inte en tom lista.
  assert.match(ruta, /if \(skrivet\.trim\(\)\.length >= KORTASTE_SOKNING\) \{\s+setTidigare\(senasteSokningar\(\)\);\s+await onType\(skrivet\);\s+return;/);
  // Ett valt förslag räknas om, så att listan inte står kvar för det gamla ordet.
  assert.match(ruta, /if \(vald\) void onType\(vald\);/);
  // ☠️ Krysset tömmer rutan i DOM innan fokus sätts: fokus läser rutans värde.
  assert.match(ruta, /const rensa = \(\) => \{\s+const el = inputRef\.current;\s+if \(el\) el\.value = "";\s+void onType\(""\);/);
  // Lämnar man resultatsidan töms rutan, också med fokus kvar i den.
  // Undantaget (2026-11-25): sökläget ställdes nyss tillbaka på den här adressen
  // efter ett bakåtsteg, och då är ordet söklägets (lib/sok-atervand.ts).
  assert.match(ruta, /else if \(fran === "\/sok" && !aterstalld\) \{ if \(el\) el\.value = ""; setQ\(""\); \}/);
  // Sökordet läses ur adressen på resultatsidan, utan useSearchParams.
  assert.match(ruta, /if \(pathname === "\/sok"\) \{ const t = sokordIAdressen\(\); if \(t && el && !el\.value\) setQ\(t\); \}/);
  assert.doesNotMatch(ruta, /^import [^\n]*useSearchParams/m);
});

test("filterlådan är vit som de andra lådorna, och auktionens viloläge är butikens egen kräm", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const regel = (borjan: string) => css.slice(css.indexOf(borjan), css.indexOf("}", css.indexOf(borjan)));
  for (const b of ["  .shopbar-panel{display:none", "  .shopbar.open .shopbar-panel{position:fixed", "  .panel-huvud{display:flex"]) {
    assert.ok(css.includes(b), b);
    assert.match(regel(b), /background:#fff/, b);
    assert.doesNotMatch(regel(b), /var\(--warm\)/, b);
  }
  // Auktionsscenens första steg står på två ställen och måste vara samma färger:
  // vitt överst som tonar till butikens kräm (--warm), inte den gamla persikan
  // och inte helt vitt (prövat och förkastat samma natt).
  assert.match(css, /--a-bg1:#FFFFFF; --a-bg2:#FFF6EF;/);
  assert.match(css, /--warm:#FFF6EF;/);
  const scen = readFileSync(new URL("../components/auction-stage.tsx", import.meta.url), "utf8");
  assert.match(scen, /\{ t: 0, bg1: "#FFFFFF", bg2: "#FFF6EF", /);
  assert.doesNotMatch(css + scen, /FCEFE0/i);
});

// ── Två bokstäver: början på ett ord, inte en sökning (Leonard 2026-11-19) ───
// Skärmbilderna: "få" och "bi" gav "Inga produkter matchade", och förslagen var
// fack, fälls och bitar.
const KORTA = [
  ...KATALOG,
  "Sängram 160 cm i ek", "Sängram 180 cm med gavel", "Sängbord i valnöt", "Sängbord med låda", "Skåp med två dörrar", "Skåp i vitt",
  "Badrumsskåp med spegel", "Badrumsskåp 60 cm", "Skoskåp med tre fack", "Skoskåp i ek", "Fågelbur med ställning", "Fågelbur i metall",
  "Hylla med fyra fack", "Väggskåp med sex fack", "Lådhurts med fem fack", "Vitrin i sammet", "Pall i sammet", "Puff i sammet", "Bänk i sammet",
  "Skärm för balkong", "Vindskydd med skärm", "Insynsskydd med skärm", "Sandlåda med lock", "Sandlåda i trä", "Leksaker för sand",
  "Upphöjd odlingslåda 120 cm", "Upphöjd odlingslåda i trä", "Upphöjd rabatt i metall", "Bord med höjd 75 cm", "Stativ med höjd 2 m",
  "Blandare för kök", "Blandare med dusch", "Karta över ett land", "Flagga för ett land",
  "Fåtölj i bouclé", "Sängram 140 cm i furu",
];

test("två bokstäver föreslår varor, inte egenskaper: \"få\" → fåtölj, aldrig fack", () => {
  const f = byggOrdforrad(KORTA);
  assert.deepEqual(sokforslag(f, "få", 3), ["fåtölj", "fågelbur"]);
  // "fack" står i fyra namn men inleder inget: det är en egenskap.
  assert.ok(f.ord.some((o) => o.text === "fack" && o.varu === 0));
  assert.ok(!sokforslag(f, "fa", 5).includes("fack"));
  // Huvudordet i namnets första ord räknas: tvåsitssoffa, bäddsoffa och
  // hörnsoffa gör "soffa" till den vanligaste varan på "so".
  assert.equal(sokforslag(f, "so", 3)[0], "soffa");
  assert.deepEqual(sokforslag(f, "so", 3), ["soffa", "soffbord", "soptunna"]);
  // skåp är huvudet i badrumsskåp, skoskåp och väggskåp.
  assert.equal(sokforslag(f, "sk", 3)[0], "skåp");
});

test("☠️ prickarna gäller när kunden har skrivit dem: \"sä\" är sängram, inte sammet eller sand", () => {
  const f = byggOrdforrad(KORTA);
  assert.deepEqual(sokforslag(f, "sä", 3), ["sängram", "sängbord"]);
  // Utan prickar räknas båda, de vanligaste varorna först.
  assert.deepEqual(sokforslag(f, "sa", 3), ["sängram", "sandlåda", "sängbord"]);
  // Samma regel för längre ord: "sän" och "skå" drar inte in sand och skärm.
  assert.deepEqual(sokforslag(f, "sän", 3), ["sängram", "sängbord"]);
  assert.ok(!sokforslag(f, "skå", 5).includes("skärm"));
  assert.equal(sokforslag(f, "skå", 5)[0], "skåp");
  // Utan prickar går ordet som börjar precis så först, det andra sist.
  assert.equal(sokforslag(f, "san", 3)[0], "sandlåda");
  assert.ok(sokforslag(f, "san", 3).includes("sängram"));
  assert.deepEqual(sokforslag(f, "fatol", 3), ["fåtölj"]);
  // Börjar ingen vara så med prickarna föreslås ingenting.
  assert.deepEqual(sokforslag(f, "sö", 3), []);
});

test("två bokstäver: inget förslag hellre än ett dåligt", () => {
  const f = byggOrdforrad(KORTA);
  // Måttens ord ("höjd", "bred") är egenskaper och står inte i ordförrådet
  // alls, och "blandare" gör inte "land" till en vara.
  assert.ok(!f.ord.some((o) => o.text === "höjd"));
  assert.deepEqual(sokforslag(f, "hö", 3), ["hörnsoffa"]);
  assert.ok(f.ord.some((o) => o.text === "land" && o.varu === 0));
  assert.deepEqual(sokforslag(f, "la", 3), []);
  // Inget börjar så.
  assert.deepEqual(sokforslag(f, "xq", 3), []);
  // Efter ett annat ord är två bokstäver oftast en färg eller ett mått.
  assert.deepEqual(sokforslag(f, "soffa gr", 3), []);
  assert.deepEqual(sokforslag(f, "svart so", 3), []);
  // "tv" står för sig och är varan: tv-bänk, som förut.
  assert.deepEqual(sokforslag(f, "tv", 3), ["tv-bänk"]);
  assert.deepEqual(sokforslag(f, "svart tv", 3), ["svart tv-bänk"]);
});

test("längre ord: varorna går före egenskaperna bland dem som börjar så", () => {
  const f = byggOrdforrad(KORTA);
  // "sammet" står i sex namn och "sammetsfåtölj" i inget: varan först ändå.
  const medSam = byggOrdforrad([...KORTA, "Sammetsgardin 2-pack", "Sammetsgardin 240 cm"]);
  assert.equal(sokforslag(medSam, "sam", 3)[0], "sammetsgardin");
  assert.ok(sokforslag(medSam, "sam", 3).includes("sammet"));
  // Det som gällde förut gäller kvar.
  assert.deepEqual(sokforslag(f, "sof", 3), ["soffbord", "soffa"]);
  assert.equal(sokforslag(f, "matt", 3)[0], "matta");
  assert.deepEqual(sokforslag(f, "julgr", 3), ["julgran", "talljulgran"]);
});

test("vilket ords varor listan visar: förslagets, när det skrivna är två bokstäver eller inte gav något", () => {
  // Två bokstäver: förslagets varor.
  assert.equal(visaVarorFor("få", ["fåtölj", "fågelbur"], 0), "fåtölj");
  // Också när det korta ordet råkar stå i namn ("2 st" i 107 namn).
  assert.equal(visaVarorFor("st", ["stolar", "ställ"], 107), "stolar");
  assert.equal(visaVarorFor(" Få ", ["fåtölj"], 0), "fåtölj");
  // ☠️ "tv" är varan: tv-bänk är samma ord med bindestreck.
  assert.equal(visaVarorFor("tv", ["tv-bänk", "tv-stativ"], 35), null);
  // Inget förslag: det skrivna gäller ("xl" står i namn).
  assert.equal(visaVarorFor("xl", [], 4), null);
  assert.equal(visaVarorFor("xq", [], 0), null);
  // Längre ord med träffar rörs inte.
  assert.equal(visaVarorFor("soffa", ["bäddsoffa"], 137), null);
  assert.equal(visaVarorFor("sof", ["soffbord"], 196), null);
  // Längre ord utan träff men med ett förslag: förslagets varor.
  assert.equal(visaVarorFor("soffb", ["soffbord"], 0), "soffbord");
  // Två ord är en sökning, hur korta de än är.
  assert.equal(visaVarorFor("tv xl", ["tv xl-bänk"], 3), null);
  assert.equal(kortOrd("få"), true);
  assert.equal(kortOrd(" bi "), true);
  assert.equal(kortOrd("f"), true);
  assert.equal(kortOrd(""), false);
  assert.equal(kortOrd("fåt"), false);
  assert.equal(kortOrd("a b"), false);
});

test("orden kunden var på väg att skriva, ur varornas namn: bara för ett enda ord", () => {
  const varor = KORTA.map((n) => ({ name: n }));
  assert.deepEqual(menadeDu(varor, (v) => v.name, "få"), ["fåtölj", "fågelbur"]);
  assert.deepEqual(menadeDu(varor, (v) => v.name, " bä "), ["bäddsoffa"]);
  assert.deepEqual(menadeDu(varor, (v) => v.name, "soffa gr"), []);
  assert.deepEqual(menadeDu(varor, (v) => v.name, "xq"), []);
  assert.deepEqual(menadeDu(varor, (v) => v.name, ""), []);
  assert.deepEqual(menadeDu([], (v: { name: string }) => v.name, "få"), []);
});

test("☠️ söksidan för två bokstäver: varorna för ordet, inte 605 varor ur beskrivningarna", () => {
  const varor = KORTA.map((n) => ({ name: n }));
  const fa = rankaMedForslag(varor, (v) => v.name, "få");
  assert.equal(fa.visar, "fåtölj");
  assert.ok(fa.utfall.traffar.length >= 3);
  assert.ok(fa.utfall.traffar.every((v) => /fåtölj/i.test(v.name)));
  // "tv" är varan, och ett längre ord rankas som förut.
  const tv = rankaMedForslag(varor, (v) => v.name, "tv");
  assert.equal(tv.visar, "");
  assert.deepEqual(tv.utfall.traffar.map((v) => v.name), rankaMedInfo(varor, (v) => v.name, "tv").traffar.map((v) => v.name));
  const soffa = rankaMedForslag(varor, (v) => v.name, "soffa");
  assert.equal(soffa.visar, "");
  assert.deepEqual(soffa.utfall.traffar.map((v) => v.name), rankaMedInfo(varor, (v) => v.name, "soffa").traffar.map((v) => v.name));
  // Två bokstäver som inget börjar på: ingenting, ärligt.
  const xq = rankaMedForslag(varor, (v) => v.name, "xq");
  assert.equal(xq.visar, "");
  assert.equal(xq.utfall.traffar.length, 0);
  // Två ord är en sökning.
  assert.equal(rankaMedForslag(varor, (v) => v.name, "få so").visar, "");
});

test("sökrutan visar förslagets varor och säger vilket ord det gäller", async () => {
  const { readFileSync } = await import("node:fs");
  const ruta = readFileSync(new URL("../components/searchbox.tsx", import.meta.url), "utf8");
  // Regeln avgör, och förslagets varor används bara när det finns några.
  assert.match(ruta, /const mal = m\.visaVarorFor\(term, forslagen, svar\.totalt\);\s+if \(mal\) \{\s+const forMalet = m\.rankaForslagMedAntal\(idx, mal, antal\);\s+if \(forMalet\.totalt > 0\) \{ svar = forMalet; visar = mal; \}/);
  // Kategorierna räknas för samma ord som varorna.
  assert.match(ruta, /m\.matchaKategorier\(visar \|\| pris\.fraga, registreradeKategorier\(\), KATEGORIFORSLAG\)/);
  // Rubriken, foten och Enter gäller ordet som visas.
  // Sedan 2026-11-26 också märket, när sökningen bara var det (lib/sok-2026-11-26.test.ts).
  assert.match(ruta, /const varuRubrik = visar \? `Visar “\$\{visar\}”` : marke \? `Säljs som \$\{marke\} hos prisjämförelsesajterna` : liknande \? "Närmast i stavning" : harPris\(pris\)/);
  assert.equal(ruta.split("varuRubrik}").length - 1, 2, "listans rubrik och söklägets");
  // En rättad stavning sägs på samma sätt, och bara stavningsnära träffar får sin egen rubrik.
  assert.match(ruta, /if \(!visar && svar\.rattat\) visar = svar\.rattat;/);
  assert.match(ruta, /setLiknandeFor\(!visar && svar\.liknande \? val : null\);/);
  assert.match(ruta, /const term = visar \|\| q\.trim\(\);/);
  assert.match(ruta, /onClick=\{\(\) => goSearch\(visar \|\| undefined\)\} disabled=\{soker\}/);
  assert.match(ruta, /else goSearch\(visar \|\| undefined\);/);
  // ☠️ Två bokstäver som inget börjar på: det tomma lägets förslag och en rad
  // som ber om lite till, aldrig "Inga produkter matchade".
  assert.match(ruta, /const vantar = m\.kortOrd\(term\) && svar\.totalt === 0 && forslagen\.length === 0 && kategorier\.length === 0;/);
  assert.match(ruta, /const isPopular = q\.trim\(\)\.length < 2 \|\| fortsatt;/);
  // ☠️ Båda lägena gäller bara texten de räknades för: rutan kan få ett nytt
  // ord ur adressen utan att förslagen räknas om.
  assert.match(ruta, /const fortsatt = fortsattFor !== null && fortsattFor === q;/);
  assert.match(ruta, /const visar = !isPopular && visarFor && visarFor\.q === q \? visarFor\.ord : "";/);
  assert.match(ruta, /setVisarFor\(visar \? \{ q: val, ord: visar \} : null\);/);
  assert.match(ruta, /setFortsattFor\(vantar \? val : null\);/);
  assert.match(ruta, /\{fortsatt && q\.trim\(\)\.length >= 2 && <div className="sugg-fortsatt" role="status">/);
  // Varje gren i onType nollställer båda lägena.
  assert.equal(ruta.split("setVisarFor(").length - 1, 3);
  assert.equal(ruta.split("setFortsattFor(").length - 1, 3);
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.sugg-chip-visas\{background:#fff;border-color:var\(--brand\);color:var\(--brand\)\}/);
  assert.match(css, /\.sugg-fortsatt\{/);
  const sida = readFileSync(new URL("../app/sok/page.tsx", import.meta.url), "utf8");
  const kall = readFileSync(new URL("../components/sok-kall.tsx", import.meta.url), "utf8");
  // ☠️ Söksidan rankar med samma regel, och två bokstäver letar aldrig i beskrivningarna.
  assert.match(sida, /const \{ utfall, visar: ordet \} = rankaMedForslag\(all, \(p\) => p\.name, fraga, await kategoridata\(\)\);/);
  // `all` är katalogen i sökningens ordning (lib/sok-ordning.test.ts).
  assert.match(sida, /const all = term \? katalogensSokordning\(await getProducts\(\)\) : \[\];/);
  assert.match(sida, /else if \(kategorier\.length === 0 && !kortOrd\(fraga\)\) \{/);
  assert.match(sida, /if \(visar\) kategorier = matchaKategorier\(visar, allaKategorier, 3\);/);
  assert.match(kall, /const \{ utfall: u, visar \} = rankaMedForslag\(kandidater\(lista, slutsalda\), \(p\) => p\.name, prisfraga\.fraga, kategoridata\(slutsalda\)\);/);
  // Sidan säger vilket ord träffarna gäller.
  const vy = readFileSync(new URL("../components/sok-vy.tsx", import.meta.url), "utf8");
  assert.match(vy, /\{klar\.visar && \(\s+<p className="sok-besked">\s+Du skrev “\{term\}”\. Här är träffarna för <b>“\{klar\.visar\}”<\/b>\./);
  assert.match(kall, /kategorier: visar \? matchaKategorier\(visar, registreradeKategorier\(\), 3\) : kategorier,/);
});

test("auktionens räkneverk klipper varje siffra: nästa siffra sticker inte fram under priset", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.a-odo-stack span\{height:1em;display:flex;align-items:flex-start;justify-content:center;overflow:hidden\}/);
  // Panelens fotknapp nollställer webbläsarens ram före sin egen överkant.
  assert.match(css, /\.sugg-all\{[^}]*;border:0;border-top:1px solid var\(--line\);/);
});
