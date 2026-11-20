// Run: node --test --experimental-strip-types lib/sok-2026-11-20.test.ts
//
// Sökningen efter Leonards skärmbild 2026-11-20: "trägårdsmöbel" gav inga
// varor, och "barnmobel" samma. Tre saker byggdes den dagen, och varje prov
// här bär sökningen som gick fel och vad den svarade då:
//
//   1. kategorierna som begrepp ("barnmöbler" står inte i något namn),
//   2. varje sökord prövas mot katalogens ord innan namnen genomsöks,
//   3. halvskrivna ord skrivs färdigt, så att listan inte töms mitt i ordet.
//
// Samma kväll gjordes sökningen snabbare (avsnitt 6): samma svar, mindre arbete.
//
// Butiken nedan är påhittad men byggd som den riktiga: namnen bär varans ord
// ("Barnbord", "Trädgårdsbänk"), kategorierna bär hyllans ("Barnmöbler",
// "Utemöbler"). Siffrorna i kommentarerna är mätta mot den riktiga katalogen
// (7 886 varor, 172 kategorier) samma dag.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { byggOrdforrad, byggOrdforradSteg, forberedKatalog, forberedKatalogSteg, forfilterProv, kategoriPoang, matchaKategorier, normalize, ordlistansOrd, rankaMedForslag, rankaMedInfo, tokenize, type Kategoridata, type SokKat, type Sokutfall } from "./search.ts";
import { kategoriRad, lasKategoriRad, lasSokexempel, sokKategorier, varansKategorier } from "./sok-begrepp.ts";
import { medForsok } from "./sok-kall.ts";

type Vara = { n: string; k?: number[] };

const KAT: SokKat[] = [
  { n: "Möbler", f: -1 }, // 0
  { n: "Fåtöljer", f: 0 }, // 1
  { n: "Kontorsstolar", f: 0 }, // 2
  { n: "Barn & Familj", f: -1 }, // 3
  { n: "Barnmöbler", f: 3 }, // 4
  { n: "Leksaker & Spel", f: 3 }, // 5
  { n: "Trädgård & Utemöbler", f: -1 }, // 6
  { n: "Utemöbler", f: 6 }, // 7
  { n: "Trädgårdsdekor & Belysning", f: 6 }, // 8
  { n: "Hem & Inredning", f: -1 }, // 9
  { n: "Belysning", f: 9 }, // 10
  { n: "Husdjur", f: -1 }, // 11
  { n: "Selar, Koppel & Transport", f: 11 }, // 12
  { n: "Pool & spa", f: 6 }, // 13
  { n: "Sängar & sovrum", f: 0 }, // 14
  { n: "Förvaring & Organisering", f: 9 }, // 15
  { n: "Matbord & stolar", f: 0 }, // 16
  { n: "Badrum & Hemtextil", f: 9 }, // 17
  { n: "Kök & Husgeråd", f: -1 }, // 18
  { n: "Vattenkokare & brödrostar", f: 18 }, // 19
];

const VAROR: Vara[] = [];
const lagg = (k: number, ...namn: string[]) => { for (const n of namn) VAROR.push({ n, k: [k] }); };
const matt = [60, 80, 100, 120, 140, 160, 180, 200];

// Fåtöljer och kontorsstolar: namnen bär varans ord.
lagg(1, "Fåtölj i grön sammet med fotpall", "Fåtölj i beige manchester", "Snurrfåtölj i bouclé", "Öronlappsfåtölj i grått tyg", "Fåtölj med hög rygg i konstläder", "Loungefåtölj i rotting med dyna");
for (const m of matt) lagg(2, `Kontorsstol i nät med nackstöd, ${m} kg`);
lagg(2, "Ergonomisk kontorsstol med svankstöd", "Kontorsstol i manchester", "Gamingstol med fotstöd");
lagg(15, "Kontorsskåp med lås i stål", "Kontorshylla med fem plan", "Kontorsförvaring på hjul");

// Barnmöbler: inget namn har ordet "barnmöbler".
lagg(4, "Barnbord med två stolar i trä", "Barnbord med fyra stolar och djurmotiv", "Barnstol i massiv tall", "Barnfåtölj i rosa sammet", "Sittpuff för barn med förvaring", "Bokhylla för barn med tre fack", "Staffli för barn 3-i-1", "Barnsäng 70 × 140 cm med sänggrind");
// Leksaker: "leksak" står i några namn, de flesta heter något annat.
lagg(5, "Dockvagn i rotting", "Gunghäst i plysch med ljud", "Leksakskök i trä med spis", "Automatisk leksak med fjärrkontroll", "Byggklossar i skum 24 delar", "Sandlåda med lock");
lagg(5, "Elbil för barn 12 V med fjärrkontroll", "Elbil barn MINI Cooper 12 V", "Åkbil för barn 1–3 år", "Sparkbil för barn i rött", "Elbil för barn 6 V – grävmaskin", "Polisbil för barn med sirén");
lagg(5, "Leksaker för sandlådan 12 delar", "Leksaker i trä – verktygsset");

// Utemöbler: "utemöbler" står i ett par namn, resten heter trädgårds-.
lagg(7, "Stapelbara utemöbler 7 delar – bord och sex stolar", "Utemöbler i polyrotting – soffa och bord");
for (const m of matt) lagg(7, `Trädgårdsbord ${m} cm i akacia`);
lagg(7, "Trädgårdsbänk i massivt trä med ryggstöd", "Trädgårdsbänk i metall med blommönster", "Trädgårdsstol hopfällbar i stål", "Trädgårdssoffa i grå polyrotting", "Loungegrupp i rotting fyra delar", "Bistroset i metall tre delar", "Trädgårdsfåtölj med dyna");
// Trädgårdsdekor & Belysning: inget namn har "trädgårdsbelysning".
lagg(8, "Solcellslampa 177 cm – trädgårdslykta med LED", "Solcellslampa 160 cm – trädgårdslykta i svart", "Trädgårdsbro 135 cm i svart metall", "Trädgårdsbro av stål med räcke", "Solcellslykta 2-pack för uteplatsen", "Trädgårdsspaljé för klätterväxter", "Marklampa med jordspett 4-pack");
lagg(6, "Trädgårdsskåp i granträ med två hyllor", "Trädgårdsslang 30 m med munstycke", "Trädgårdsset i tre delar för balkongen", "Trädgårdsdusch med fotdusch", "Växthus i polykarbonat 190 cm", "Odlingslåda upphöjd i galvaniserat stål", "Komposttunna 300 liter", "Fodertråg i galvaniserat stål 60 cm", "Fodertråg för höns 100 cm");
lagg(13, "Pool med stålram 366 cm", "Spabad för fyra personer", "Poolstege med fyra steg", "Poolöverdrag runt 305 cm");

// Belysning: lamporna heter inte "belysning", men några andra varor nämner ordet.
lagg(10, "Golvlampa i mässing med marmorfot", "Bordslampa med tygskärm", "Taklampa i svart metall", "Pendellampa i rökfärgat glas", "Vägglampa med LED och strömbrytare", "Golvlampa med läsarm", "Bordslampor 2-pack i keramik", "Julbelysning 10 m med 100 LED", "Skrivbordslampa för kontor med USB");
lagg(14, "Sängram 160 × 200 cm med belysning och lådor", "Sängram 140 × 200 cm i ek", "Nattduksbord i vitt med låda", "Sänggavel i sammet 160 cm", "Garderob för sovrum med spegeldörr", "Dörrhandtag för sovrum och badrum");
lagg(17, "Badrumsspegel med belysning 80 cm", "Badrumsskåp med tippbar tvättkorg", "Badrumshylla i bambu med fem plan", "Duschmatta i trä 91 × 51 cm", "Handdukstork i krom");

// Husdjur.
lagg(11, "Hundbur XL på hjul", "Hundbur i metall 107 cm", "Hundbädd i grått 92 × 76 cm", "Hundkoja i trä med öppningsbart tak", "Hundkoja i plast med rött tak", "Hundramp för bil i aluminium", "Hundgrind 76 cm för dörröppning", "Agilityset för hund tre delar");
lagg(11, "Kattlåda med lock och kolfilter", "Klösträd 120 cm med grotta", "Kattsäng på ben 56 cm", "Kattunnel i trä med åtta dörrar", "Foderautomat för katt med wifi", "Katthus utomhus i barrträ", "Kloskrapa för katt i kartong");
lagg(12, "Cykelkoppel för hund med avståndsrör", "Hundsele med reflex i storlek M", "Transportbur för katt och liten hund", "Bilsele för hund med säkerhetsbälte", "Transportväska för katt på hjul");
lagg(15, "Matstation för hund med förvaring och två skålar", "Förvaringsskåp med 22 lådor i plast", "Förvaringsbox 3-pack med lock", "Vedförvaring för inomhusbruk i stål", "Vedförvaring med tak 180 cm", "Förvaringshylla i rostfritt stål", "Förvaringskorg i sjögräs 2-pack", "Förvaringsskåp i metall med lås");

// Matbord och stolar: två sorters varor i en kategori.
for (const m of [100, 120, 140, 160, 180]) lagg(16, `Matbord ${m} cm i ekfaner`);
lagg(16, "Matstolar i vitt massivt trä 2-pack", "Matstolar med svängd rygg 4-pack", "Matstol i sammet med metallben", "Matgrupp med bord och fyra stolar");
lagg(0, "Gungstol i grått tyg med fotpall", "Gungstol med nackstöd i sammet", "Skänk 120 cm med tre dörrar", "Skänk 160 cm i valnöt", "Soffa 260 cm bred i manchester", "Hallmöbel med bänk och klädstång");
lagg(18, "Köksvagn med tre hyllor och krokar", "Köksö på hjul med klaffskiva", "Kökshylla 100 cm med utdragskorgar", "Högt köksskåp i svart", "Stekpanna i gjutjärn 28 cm", "Knivset med block 15 delar", "Avfallshink för kök med tre fack");
// Varor utanför kategorierna som bara nämner ett ord.
lagg(9, "Väska i kanvas med axelrem", "Väskor 3-pack för resan", "Ställ för ved i svart stål", "Ställ för cyklar, fem platser", "Odlingstält 120 × 120 cm", "Laptophållare i aluminium", "Låsbart fönsterhandtag – barnsäkert", "Boxningssäck 180 cm med kedja", "Fristående boxningssäck 135 cm", "Boxningshandskar i konstläder", "Plastlåda med lås", "Stålhylla 180 cm");
lagg(7, "Stolar i böjträ 2-pack", "Hopfällbara stolar i stål 6-pack", "Stolar med armstöd 4-pack");
// Ord som står för sig, så att sökorden nedan går att dela: "mat" + "brödrostar",
// "gung" + "tillbehör", "lek" + "saker" och "boxning" + "sak".
lagg(19, "Brödrost med två fack i rostfritt stål", "Vattenkokare 1,7 liter i glas", "Frukostset med vattenkokare och brödrost");
lagg(18, "Termos för mat 1 liter", "Matlåda för mat och dryck med tre fack");
lagg(5, "Gung för små barn med säkerhetsbälte", "Tält för lek inomhus");
lagg(9, "Handskar för boxning och kampsport", "Tandskydd för boxning", "Hopprep för boxning och kondition");

const kd: Kategoridata<Vara> = { kat: KAT, av: (v) => v.k };
const sok = (q: string) => rankaMedInfo(VAROR, (v) => v.n, q, undefined, kd);
const namnen = (q: string, antal = 400) => sok(q).traffar.slice(0, antal).map((v) => v.n);
const iKategorin = (c: number) => VAROR.filter((v) => (v.k ?? []).some((k) => { for (let x = k; x >= 0; x = KAT[x].f) if (x === c) return true; return false; }));

// ── 1. Kategorierna som begrepp ──────────────────────────────────────────────
test('☠️ "barnmöbler" gav två varor: ordet står i kategorin, inte i namnen', () => {
  const barnmobler = iKategorin(4).map((v) => v.n).sort();
  // Utan kategorierna är ordet bara "barn" och "möbler": allt för barn, elbilarna med.
  const utan = rankaMedInfo(VAROR, (v) => v.n, "barnmöbler").traffar.map((v) => v.n);
  assert.ok(utan.includes("Elbil för barn 12 V med fjärrkontroll"));
  assert.deepEqual(namnen("barnmöbler").sort(), barnmobler);
  // Entalet, och utan prickar som på Leonards skärmbild.
  assert.deepEqual(namnen("barnmöbel").sort(), barnmobler);
  assert.deepEqual(namnen("barnmobel").sort(), barnmobler);
  assert.deepEqual(namnen("barnmobler").sort(), barnmobler);
  // Inget besked: ordet är rättstavat.
  assert.equal(sok("barnmobel").rattat, undefined);
});

test("en vara hör också till kategorins föräldrar", () => {
  const mobler = new Set(namnen("möbler", 1000));
  // Fåtöljerna ligger i Fåtöljer, som ligger under Möbler.
  for (const v of iKategorin(1)) assert.ok(mobler.has(v.n), v.n);
  // Barnmöblerna ligger under Barn & Familj, och är ändå möbler till namnet.
  assert.ok(mobler.has("Barnbord med två stolar i trä"));
  // En hundbur är ingen möbel.
  assert.ok(!mobler.has("Hundbur XL på hjul"));
});

test("en negativ plats ärver inte uppåt: varan syns bara på sin egen hylla", () => {
  const varor: Vara[] = [...VAROR, { n: "Reservdyna i skum 40 × 40 cm", k: [-(4 + 1)] }, { n: "Skyddsöverdrag i grå polyester", k: [-(1 + 1)] }];
  const data: Kategoridata<Vara> = { kat: KAT, av: (v) => v.k };
  const hittar = (q: string, n: string) => rankaMedInfo(varor, (v) => v.n, q, undefined, data).traffar.some((v) => v.n === n);
  // På sin egen hylla, Barnmöbler, syns den.
  assert.equal(hittar("barnmöbler", "Reservdyna i skum 40 × 40 cm"), true);
  // På förälderns, Barn & Familj, syns barnmöblerna men inte den.
  assert.equal(hittar("familj", "Barnstol i massiv tall"), true);
  assert.equal(hittar("familj", "Reservdyna i skum 40 × 40 cm"), false);
  // Detsamma när ordet också står i några namn och kategorin fyller på
  // (medBegrepp): fåtöljerna är möbler, överdraget i Fåtöljer är det inte.
  assert.equal(hittar("möbler", "Snurrfåtölj i bouclé"), true);
  assert.equal(hittar("möbler", "Skyddsöverdrag i grå polyester"), false);
});

test('☠️ "belysning" visade en sängram före varenda lampa: kategorin går före en bisats', () => {
  const u = namnen("belysning");
  const plats = (n: string) => u.indexOf(n);
  // Ordet är varan: först.
  assert.equal(plats("Julbelysning 10 m med 100 LED"), 0);
  // Lamporna, som inte har ordet i namnet, kommer med.
  for (const v of iKategorin(10)) assert.ok(plats(v.n) >= 0, v.n);
  // Sängramen och spegeln nämner bara ordet: de finns kvar, efter varan.
  assert.ok(plats("Sängram 160 × 200 cm med belysning och lådor") > 0);
  assert.ok(plats("Badrumsspegel med belysning 80 cm") > 0);
});

test('☠️ "utemöbler": underkategorin fyller på, inte hela avdelningen', () => {
  const u = namnen("utemöbler");
  // Namnträffarna först.
  assert.ok(u[0].includes("utemöbler") || u[0].startsWith("Utemöbler"));
  assert.ok(u.includes("Trädgårdsbänk i massivt trä med ryggstöd"));
  // Växthuset och slangen ligger i avdelningen Trädgård & Utemöbler, inte i Utemöbler.
  assert.ok(!u.includes("Växthus i polykarbonat 190 cm"));
  assert.ok(!u.includes("Trädgårdsslang 30 m med munstycke"));
});

test('☠️ en kategori som räknar upp tre sorters varor fyller inte på: "koppel"', () => {
  const u = namnen("koppel");
  assert.deepEqual(u, ["Cykelkoppel för hund med avståndsrör"]);
  // Selen och transportburen ligger i Selar, Koppel & Transport men är inga koppel.
  assert.ok(!u.includes("Hundsele med reflex i storlek M"));
});

test('☠️ "Matbord & stolar": den som söker matbord får inte stolarna', () => {
  const u = namnen("matbord");
  assert.ok(u.length >= 5);
  assert.ok(u.every((n) => !n.startsWith("Matstol")), u.join(" | "));
});

test('☠️ i en sökning på flera ord ska varans ord stå i namnet: "skänk 120 cm"', () => {
  // Första versionen lät varje ord träffa genom kategorin, och "skänk 120 cm
  // bred" gick från fyra skänkar till 69 varor ur Sideboards & vitrinskåp.
  // Skänken med rätt mått först, sedan skänken utan (se FYLL_PA_UNDER), och
  // ingenting annat ur Möbler.
  assert.deepEqual(namnen("skänk 120 cm"), ["Skänk 120 cm med tre dörrar", "Skänk 160 cm i valnöt"]);
  // Ett begreppsord får träffa genom kategorin också bredvid andra ord.
  const u = namnen("barnmöbler rosa");
  assert.equal(u[0], "Barnfåtölj i rosa sammet");
});

test("hela kategorins namn som sökning ger kategorin", () => {
  const pool = iKategorin(13).map((v) => v.n).sort();
  assert.deepEqual(namnen("pool och spa").sort(), pool);
  assert.deepEqual(namnen("pool & spa").sort(), pool);
  assert.deepEqual(namnen("pool spa").sort(), pool);
});

test("kategorichipset känner ordet utan prickar och i ental", () => {
  assert.ok(kategoriPoang("Barnmöbler", "barnmobel") > 0);
  assert.ok(kategoriPoang("Barnmöbler", "barnmöbler") > 0);
  assert.equal(kategoriPoang("Barnmöbler", "hundbur"), 0);
});

// ── 2. Är sökordet ett ord? ──────────────────────────────────────────────────
test('☠️ "vaska" stod i "guldVASKArsats": utan prickar söks ordet med prickar, utan besked', () => {
  const u = sok("vaska");
  assert.deepEqual(u.traffar.map((v) => v.n).sort(), ["Transportväska för katt på hjul", "Väska i kanvas med axelrem", "Väskor 3-pack för resan"]);
  assert.equal(u.rattat, undefined);
  assert.equal(u.sokt, "väska");
});

test('☠️ "stäl" stod i "odlingSTÄLt": ordet skrivs färdigt till "ställ", inte "stål"', () => {
  const u = sok("stäl");
  assert.deepEqual(u.traffar.map((v) => v.n).sort(), ["Ställ för cyklar, fem platser", "Ställ för ved i svart stål"]);
  assert.equal(u.rattat, undefined);
});

test('☠️ "lapor" stod i "LAPtophållare": ett ord som inte finns rättas, med besked', () => {
  const u = sok("lapor");
  // "lampor" när katalogen har ordet för sig, annars begreppsordet "lampa".
  assert.match(u.rattat ?? "", /^lamp(a|or)$/);
  assert.ok(u.traffar.length >= 5);
  assert.ok(u.traffar.slice(0, 5).every((v) => /lamp/i.test(v.n)), u.traffar.map((v) => v.n).join(" | "));
  assert.ok(!u.traffar.some((v) => v.n.startsWith("Laptophållare")));
});

test('☠️ "xtolar" gav ingenting: första bokstaven får vara fel i ord på fem tecken och uppåt', () => {
  const u = sok("xtolar");
  assert.equal(u.rattat, "stolar");
  assert.ok(u.traffar.length >= 3);
});

test("butiker och märken rättas aldrig till något annat", () => {
  for (const q of ["ikea", "jysk", "biltema"]) {
    const u = sok(q);
    assert.equal(u.rattat, undefined, q);
    assert.equal(u.traffar.length, 0, q);
  }
});

test('☠️ "barnsaker" är inte "barnsäkert": ett känt ord och ett allmänt huvudord delas', () => {
  const u = sok("barnsaker");
  assert.equal(u.rattat, undefined);
  // Fönsterhandtaget stod ensamt förut ("barnsäkert" utan prickar).
  assert.ok(u.traffar.length > 5);
  assert.notEqual(u.traffar[0].n, "Låsbart fönsterhandtag – barnsäkert");
  assert.ok(u.traffar.some((v) => v.n === "Barnstol i massiv tall"));
});

test('☠️ "kattprylar" gav ingenting: ett allmänt huvudord krävs aldrig', () => {
  const katt = namnen("katt").sort();
  assert.ok(katt.length >= 5);
  assert.deepEqual(namnen("kattprylar").sort(), katt);
  assert.deepEqual(namnen("kattsaker").sort(), katt);
});

test('☠️ "köksprylar": förledet får bära ett foge-s', () => {
  const u = namnen("köksprylar");
  assert.ok(u.includes("Köksvagn med tre hyllor och krokar"));
  assert.ok(u.includes("Köksö på hjul med klaffskiva"));
  assert.equal(sok("köksprylar").liknande, undefined);
});

test('☠️ "boxningssäk" är inte "boxnings" + "sak": prickarna ska stämma', () => {
  const u = sok("boxningssäk");
  assert.equal(u.rattat, "boxningssäck");
  assert.deepEqual(u.traffar.map((v) => v.n).sort(), ["Boxningssäck 180 cm med kedja", "Fristående boxningssäck 135 cm"]);
});

test('☠️ "lekssaker" är "leksaker" med ett s för mycket, inte "leks" + "saker"', () => {
  const u = sok("lekssaker");
  assert.equal(u.rattat, "leksaker");
  assert.deepEqual(u.traffar.map((v) => v.n), namnen("leksaker"));
  assert.match(u.traffar[0].n, /leksak/i);
});

// ── 3. Halvskrivna ord ───────────────────────────────────────────────────────
test('☠️ "trägårdsmöbel": inga varor på Leonards skärmbild, och tom lista mitt i ordet', () => {
  const facit = namnen("trädgårdsmöbler");
  assert.ok(facit.length >= 10);
  assert.ok(facit.includes("Trädgårdsbänk i massivt trä med ryggstöd"));
  // Varje tangent från "trägårdsm" visar trädgårdsmöblerna, med besked.
  for (const q of ["trägårdsm", "trägårdsmö", "trägårdsmöb", "trägårdsmöbe", "trägårdsmöbel", "trägårdsmöbler"]) {
    const u = sok(q);
    assert.equal(u.rattat, "trädgårdsmöbler", q);
    assert.deepEqual(u.traffar.map((v) => v.n), facit, q);
  }
});

test('☠️ "tradgardsmo" blev "trädgårdsbro": början på ett begreppsord skrivs färdigt', () => {
  const facit = namnen("trädgårdsmöbler");
  for (const q of ["tradgardsm", "tradgardsmo", "tradgardsmob", "tradgardsmobler"]) {
    const u = sok(q);
    assert.deepEqual(u.traffar.map((v) => v.n), facit, q);
    // Bara prickar som saknas: inget besked.
    assert.equal(u.rattat, undefined, q);
  }
  // En början som katalogens ord delar söks som den står.
  assert.ok(namnen("tradgards").includes("Trädgårdsskåp i granträ med två hyllor"));
});

test('"barnm" är på väg mot "barnmöbler", inte ett "barn" med ett m för mycket', () => {
  const facit = namnen("barnmöbler");
  for (const q of ["barnm", "barnmo", "barnmob", "barnmobe"]) assert.deepEqual(namnen(q), facit, q);
});

test('☠️ "trägå" blev "tråg": ett halvskrivet ord med ett fel rättas mot orden som börjar så', () => {
  for (const q of ["trägå", "trägår", "trägård"]) {
    const u = sok(q);
    assert.equal(u.rattat, "trädgård", q);
    assert.ok(u.traffar.length >= 20, q);
    assert.ok(!u.traffar.slice(0, 5).some((v) => v.n.startsWith("Fodertråg")), q);
  }
});

test('☠️ "kontorsmöb" gav ingenting mitt i ordet: sammansättningen skrivs färdig', () => {
  const facit = namnen("kontorsmöbler");
  assert.ok(facit.length >= 8);
  assert.ok(facit[0].toLowerCase().includes("kontors"));
  for (const q of ["kontorsmö", "kontorsmöb", "kontorsmöbl", "kontorsmöble"]) {
    const u = sok(q);
    assert.deepEqual(u.traffar.map((v) => v.n), facit, q);
    assert.equal(u.rattat, undefined, q);
  }
  // Med ett fel i huvudordet rättas ordet, och svaret är detsamma.
  assert.deepEqual(namnen("kontorsmöbker"), facit);
  assert.equal(sok("kontorsmöbker").rattat, "kontorsmöbler");
});

test('"kattpr" och "kökspr" är på väg mot prylarna', () => {
  assert.deepEqual(namnen("kattpry"), namnen("kattprylar"));
  assert.deepEqual(namnen("kökspr"), namnen("köksprylar"));
});

test('☠️ "barnbi" blev "barnbord": orden som står i samma namn skriver färdigt', () => {
  const facit = namnen("barnbil");
  assert.ok(facit.length >= 4);
  assert.ok(facit.every((n) => /bil/i.test(n)), facit.join(" | "));
  const u = sok("barnbi");
  assert.deepEqual(u.traffar.map((v) => v.n), facit);
  assert.equal(u.rattat, undefined);
});

test('☠️ ett ord nära ett katalogord skrivs inte färdigt: "matbrod" är "matbord"', () => {
  // Första versionen gjorde "mat" + "brödrostar" av det.
  const u = sok("matbrod");
  assert.equal(u.rattat, "matbord");
  assert.ok(u.traffar.every((v) => v.n.startsWith("Matbord")), u.traffar.map((v) => v.n).join(" | "));
  // "gungstil" blev "gungs" + "tillbehör".
  assert.equal(sok("gungstil").rattat, "gungstol");
});

test('☠️ "hundförvaring" blev "vedförvaring": två vanliga ord delas före en rättning med flera fel', () => {
  const u = sok("hundförvaring");
  assert.equal(u.rattat, undefined);
  assert.equal(u.traffar[0].n, "Matstation för hund med förvaring och två skålar");
  // Ett fel räcker fortfarande för en rättning.
  assert.equal(sok("vedförvarign").rattat, "vedförvaring");
});

test('☠️ "trägårdsbelysning" gav två lampor: den rättade delningen svarar som det rättstavade ordet', () => {
  const facit = namnen("trädgårdsbelysning");
  assert.ok(facit.length >= 5);
  const u = sok("trägårdsbelysning");
  assert.equal(u.rattat, "trädgårdsbelysning");
  assert.deepEqual(u.traffar.map((v) => v.n), facit);
  // Och medan ordet skrivs.
  assert.deepEqual(namnen("trädgårdsbelys"), facit);
  assert.deepEqual(namnen("trädgårdsbel"), facit);
});

test('☠️ "sovrumsmöbler" gav sex varor: förledet utan foge-s fyller på', () => {
  const u = namnen("sovrumsmöbler");
  assert.ok(u.includes("Garderob för sovrum med spegeldörr"));
  assert.ok(u.includes("Nattduksbord i vitt med låda"), u.join(" | "));
});

// ── 4. Samma svar i alla tre vägarna ─────────────────────────────────────────
test("söksidans rankning tar emot kategorierna och säger vilket ord träffarna gäller", () => {
  const a = rankaMedForslag(VAROR, (v) => v.n, "trägårdsmöbel", kd);
  assert.equal(a.visar, "trädgårdsmöbler");
  assert.deepEqual(a.utfall.traffar.map((v) => v.n), namnen("trädgårdsmöbler"));
  // En tyst färdigskrivning behöver inget besked.
  assert.equal(rankaMedForslag(VAROR, (v) => v.n, "barnmobel", kd).visar, "");
  // Utan kategorier söks bara namnen, som förut.
  assert.notDeepEqual(rankaMedForslag(VAROR, (v) => v.n, "barnmöbler").utfall.traffar.map((v) => v.n), namnen("barnmöbler"));
});

test("förberedelsen i förväg ändrar inga svar", () => {
  const namn = VAROR.map((v) => normalize(v.n));
  const fore = rankaMedInfo(VAROR, (v) => v.n, "barnmobel", namn, kd).traffar.map((v) => v.n);
  const andra = VAROR.map((v) => normalize(v.n));
  forberedKatalog(VAROR, andra, kd);
  assert.deepEqual(rankaMedInfo(VAROR, (v) => v.n, "barnmobel", andra, kd).traffar.map((v) => v.n), fore);
});

test("sökindexet bär kategorierna: en tabell sist och platser på varje vara", () => {
  const kategorier = [
    { id: "a", name: "Barn & Familj", parentId: null },
    { id: "b", name: "Barnmöbler", parentId: "a" },
    { id: "c", name: "Populära", parentId: null },
    { id: "d", name: "REA", parentId: null },
    { id: "e", name: "Möbler", parentId: null },
  ];
  const k = sokKategorier(kategorier);
  // Urvalen som inte är kategorier följer inte med.
  assert.deepEqual(k.kat, [{ n: "Barn & Familj", f: -1 }, { n: "Barnmöbler", f: 0 }, { n: "Möbler", f: -1 }]);
  // Bara den djupaste kategorin: föräldern räknar sökningen in själv.
  assert.deepEqual(varansKategorier({ id: "1", collectionIds: ["a", "b", "c"] }, k), [1]);
  assert.deepEqual(varansKategorier({ id: "1", collectionIds: ["b", "e"] }, k), [1, 2]);
  assert.equal(varansKategorier({ id: "1", collectionIds: ["c", "okänd"] }, k), undefined);
  // En vara som bara hör till sin underkategori bär negativa platser.
  assert.deepEqual(varansKategorier({ id: "9", collectionIds: ["a", "b"] }, k, new Set(["9"])), [-2]);
  // Tabellen fram och tillbaka.
  assert.deepEqual(lasKategoriRad(JSON.parse(JSON.stringify(kategoriRad(k.kat)))), k.kat);
  assert.equal(lasKategoriRad({ n: "Barnbord", s: "barnbord" }), null);
  assert.equal(lasKategoriRad({ kat: [["Möbler", "fel"]] }), null);
  assert.equal(lasKategoriRad(null), null);
});

test("de tre vägarna skickar kategorierna till samma rankning", () => {
  const las = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");
  // Sökindexet: varans platser på varje rad, och tabellen sist.
  const rutt = las("../app/api/search-index/route.ts");
  assert.match(rutt, /\.\.\.kategorierFor\(p, kategorier\)/);
  assert.match(rutt, /index\.push\(kategoriRad\(kategorier\.kat, byggOrdforrad\(products\.map\(\(p\) => p\.name\)\)\.exempel\)\)/);
  // Sökrutan: tabellen lyfts av indexet och följer med till rankningen.
  const index = las("./sok-index.ts");
  assert.match(index, /lasKategoriRad\(/);
  assert.match(index, /export function sokKategorierHamtade\(\)/);
  const rankning = las("./sok-rankning.ts");
  assert.match(rankning, /rankaMedInfo\([^;]*kategoridata\(\)\)/);
  assert.match(rankning, /forberedKatalogSteg\(/);
  // Söksidan, varm och kall.
  assert.match(las("../app/sok/page.tsx"), /rankaMedForslag\(all, \(p\) => p\.name, fraga, await kategoridata\(\)\)/);
  assert.match(las("../components/sok-kall.tsx"), /rankaMedForslag\(kandidater\(lista, slutsalda\), \(p\) => p\.name, prisfraga\.fraga, kategoridata\(slutsalda\)\)/);
});

// ── 5. Söksidan försöker igen själv ──────────────────────────────────────────
test("☠️ första sökningen efter en deploy visade felrutan: listan hämtas igen innan sidan ger upp", async () => {
  const pauser: number[] = [];
  const paus = async (nr: number) => { pauser.push(nr); };
  // Första försöket hinner inte (servern läser katalogen), andra får svar.
  let anrop = 0;
  const svar = await medForsok(async (nr) => { anrop++; if (nr === 1) throw new Error("avbruten efter 20 s"); return "listan"; }, 3, paus);
  assert.equal(svar, "listan");
  assert.equal(anrop, 2);
  assert.deepEqual(pauser, [1]);
  // Alla försök misslyckas: det sista felet kommer ut, och ingen paus efter det sista.
  pauser.length = 0;
  anrop = 0;
  await assert.rejects(medForsok(async (nr) => { anrop++; throw new Error(`fel ${nr}`); }, 3, paus), /fel 3/);
  assert.equal(anrop, 3);
  assert.deepEqual(pauser, [1, 2]);
  // Kunden har sökt på något annat: inga fler försök.
  anrop = 0;
  let borta = false;
  await assert.rejects(medForsok(async () => { anrop++; borta = true; throw new Error("nere"); }, 3, paus, () => borta), /nere/);
  assert.equal(anrop, 1);
  // Sidan använder den, med tre försök.
  const sidan = readFileSync(new URL("../components/sok-kall.tsx", import.meta.url), "utf8");
  assert.match(sidan, /medForsok\(hamtaLista, FORSOK, /);
  assert.match(sidan, /const FORSOK = 3;/);
  assert.match(sidan, /setSvar\(\{ q, data: "fel" \}\)/);
});

// ── 6. Farten: samma svar, mindre arbete (Leonard 2026-11-20) ────────────────
// "jag vill att du kollar hastigheten till sökfältet är så optimerad som
// möjligt". Mätt på den riktiga katalogen (7 886 varor, 182 tangenter i 21
// ord): 3 295 ms blev 918 ms på en dator, den tyngsta tangenten 114 ms blev
// 19 ms, och 13 933 provsökningar gav samma svar som före. Proven här håller
// det som gjorde det möjligt: varje genväg ska ge exakt det den långa vägen ger.

/** Allt i ett svar som kunden kan se, som en text att jämföra. */
const somText = (u: Sokutfall<Vara>): string =>
  JSON.stringify([u.traffar.map((v) => v.n), u.rattat ?? null, u.sokt ?? null, u.liknande ?? null, u.strukna, u.utan ?? null, u.hela ?? null]);
/** Ordet skrivet tangent för tangent, och suddat tillbaka. */
const tangenter = (ord: string): string[] => {
  const fram = [...ord].map((_, i) => ord.slice(0, i + 1));
  return [...fram, ...fram.slice(0, -1).reverse()];
};
const SKRIVNA = ["trägårdsmöbel", "barnmobel", "kontorsmöbler", "hundkoppel", "kattprylar", "badrumsmöbler", "lekssaker", "trägårdsbelysning", "svart tv-bänk", "matbrod", "boxningssäk", "fatolj", "xtolar", "soffa 260 cm bred"];

test("☠️ samma sökning räknades om vid varje tangent: minnet ger exakt det en ny räkning ger", () => {
  // En namnlista för hela skrivandet, som i sökrutan: svaren ligger kvar i minnet.
  const namn = VAROR.map((v) => normalize(v.n));
  let antal = 0;
  for (const ord of SKRIVNA) {
    for (const q of tangenter(ord)) {
      const medMinne = somText(rankaMedInfo(VAROR, (v) => v.n, q, namn, kd));
      // En ny namnlista har inget minne: den långa vägen.
      const utan = somText(rankaMedInfo(VAROR, (v) => v.n, q, VAROR.map((v) => normalize(v.n)), kd));
      assert.equal(medMinne, utan, `"${q}" (i "${ord}")`);
      antal++;
    }
  }
  // Fler sökningar än minnet rymmer (48): de äldsta har fallit ur och räknats om.
  assert.ok(antal > 250, `bara ${antal} sökningar`);
  // Och provet är inte tomt: orden ger varor.
  assert.ok(rankaMedInfo(VAROR, (v) => v.n, "kontorsmöb", namn, kd).traffar.length > 5);
  // RESERVVARVET: ett okänt ord söks först strängt, och ger det ingenting söks
  // stammen var som helst (stammen av "ardsbar" står utan prickar mitt i
  // "trädgårdsbord"). Minnet minns att första varvet var strängt, annars blev
  // andra svaret tomt. Inget i de 13 933 provsökningarna mot den riktiga
  // katalogen går den här vägen, så provet är det enda som håller den.
  const reserv = rankaMedInfo(VAROR, (v) => v.n, "ardsbar", namn, kd);
  assert.ok(reserv.traffar.length > 5 && reserv.traffar.every((v) => /gårdsb/i.test(v.n)), `${reserv.traffar.length} träffar`);
  assert.equal(somText(rankaMedInfo(VAROR, (v) => v.n, "ardsbar", namn, kd)), somText(reserv));
  assert.equal(somText(rankaMedInfo(VAROR, (v) => v.n, "ardsbar", VAROR.map((v) => normalize(v.n)), kd)), somText(reserv));
});

test("den som ändrar ett svar på plats ändrar inte nästa svar", () => {
  const namn = VAROR.map((v) => normalize(v.n));
  for (const q of ["kontorsmöb", "svart tv-bänk", "barnmobel", "soffa 260 cm bred"]) {
    const forsta = rankaMedInfo(VAROR, (v) => v.n, q, namn, kd);
    const fore = somText(forsta);
    forsta.traffar.reverse();
    forsta.traffar.length = 0;
    forsta.strukna.push("ändrat");
    forsta.utan?.push("ändrat");
    assert.equal(somText(rankaMedInfo(VAROR, (v) => v.n, q, namn, kd)), fore, q);
  }
});

test("andra kategorier eller andra varor på samma namnlista börjar om", () => {
  const namn = VAROR.map((v) => normalize(v.n));
  const med = somText(rankaMedInfo(VAROR, (v) => v.n, "barnmöbler", namn, kd));
  // Utan kategorier är svaret ett annat, också direkt efter svaret med.
  const utan = somText(rankaMedInfo(VAROR, (v) => v.n, "barnmöbler", namn));
  assert.notEqual(utan, med);
  assert.equal(utan, somText(rankaMedInfo(VAROR, (v) => v.n, "barnmöbler", VAROR.map((v) => normalize(v.n)))));
  // Andra kategorier (samma namn, en annan tabell): minnet gäller inte dem.
  const annan: Kategoridata<Vara> = { kat: KAT.map((k) => ({ ...k })), av: () => undefined };
  assert.equal(somText(rankaMedInfo(VAROR, (v) => v.n, "barnmöbler", namn, annan)), somText(rankaMedInfo(VAROR, (v) => v.n, "barnmöbler", VAROR.map((v) => normalize(v.n)), annan)));
  // Och tillbaka: samma svar som först.
  assert.equal(somText(rankaMedInfo(VAROR, (v) => v.n, "barnmöbler", namn, kd)), med);
  // Andra varor med samma namn (sökrutan hämtar indexet på nytt): svaret bär
  // de nya varorna, inte de som låg i minnet.
  assert.equal(rankaMedInfo(VAROR, (v) => v.n, "fåtölj", namn, kd).traffar.includes(VAROR[0]), true);
  const nya = VAROR.map((v) => ({ ...v }));
  const efter = rankaMedInfo(nya, (v) => v.n, "fåtölj", namn, kd).traffar;
  assert.equal(efter.includes(nya[0]), true);
  assert.equal(efter.includes(VAROR[0]), false);
});

test("förfiltret håller aldrig tillbaka en träff", () => {
  const namn = VAROR.map((v) => normalize(v.n));
  const fragor = new Set<string>();
  for (const ord of [...SKRIVNA, "el bil", "tv bänk", "usb", "rosor", "stolar", "70x140", "120 cm", "utemöbler", "bänk", "sängram med belysning", "fåtöljer", "hund bur", "led"]) for (let k = 2; k <= ord.length; k++) fragor.add(ord.slice(0, k));
  let traffar = 0;
  let stoppade = 0;
  for (const q of fragor) {
    for (const okant of [false, true]) {
      for (const lage of [0, 1, 2] as const) {
        for (const v of VAROR) {
          const r = forfilterProv(v.n, q, namn, lage, okant);
          if (r.traffar) {
            traffar++;
            assert.ok(r.slapps, `"${q}" träffar "${v.n}" (läge ${lage}${okant ? ", okänt ord" : ""}) men förfiltret höll tillbaka det`);
          } else if (!r.slapps) stoppade++;
        }
      }
    }
  }
  // Provet är inte tomt åt något håll: det finns träffar, och filtret stoppar namn.
  assert.ok(traffar > 5000, `bara ${traffar} träffar`);
  assert.ok(stoppade > 50_000, `filtret stoppade bara ${stoppade} namn`);
  // Ett långt ord stoppar de flesta namn redan på tecknen.
  const kontor = VAROR.filter((v) => forfilterProv(v.n, "kontorsstol", namn, 0).slapps).length;
  assert.ok(kontor < VAROR.length / 2, `${kontor} av ${VAROR.length} släpptes igenom`);
  assert.equal(forfilterProv("Väska i kanvas med axelrem", "kontorsstol", namn, 0).slapps, false);
  // Stavfelsledet släpper igenom ett namn som saknar ett av tecknen ("kontorsstål"),
  // och två i ett långt ord: där tillåts två fel.
  assert.equal(forfilterProv("Kontorsstol i manchester", "kontorsstål", namn, 2).slapps, true);
  assert.deepEqual(forfilterProv("Kontorsstol i manchester", "kontqrsszol", namn, 2), { traffar: true, slapps: true });
  assert.deepEqual(forfilterProv("Kontorsstol i manchester", "kontqrsszol", namn, 1), { traffar: false, slapps: false });
  // En böjd form med andra tecken än stammen: "stänger" är "stång", och
  // namnet har varken ä, e eller r.
  const stanger = ["stång för gardin 120 cm", "skivstång 20 kg", "tabard i bomull"];
  assert.deepEqual(forfilterProv("Stång 120 cm", "stänger gardin", stanger, 0), { traffar: true, slapps: true });
  assert.deepEqual(forfilterProv("Skivstång 20 kg", "stänger", stanger, 0), { traffar: true, slapps: true });
  // Två korta ord sammanskrivna utan prickar: "tå bä" står i "tabard", och
  // inget av orden har sina tecken i namnet.
  assert.deepEqual(forfilterProv("Tabard i bomull", "tå bä", stanger, 1), { traffar: true, slapps: true });
  assert.deepEqual(forfilterProv("Tabard i bomull", "tå bä", stanger, 0), { traffar: false, slapps: false });
});

test("ordlistan delar namnen i samma ord som tokenize", () => {
  const prov = [...VAROR.map((v) => v.n), "TV-bänk 70x70 cm – i EK, 1,5 m", "3D-skrivare & tillbehör/filament", "Café-bord (2-pack)", "  ", "", "Å Ä Ö åäö é É", "120cm×60cm", "a_b+c=d", "Ställ\tmed\nradbrytning"].map(normalize);
  const lista = ordlistansOrd(prov);
  assert.deepEqual(lista.ord, prov.map((n) => tokenize(n)));
  // Ordräkningen ur ordlistan: i hur många NAMN ordet står (ett ord som står
  // två gånger i ett namn räknas en gång), i den ordning orden först står.
  const antal = new Map<string, number>();
  for (const n of prov) for (const t of new Set(tokenize(n))) antal.set(t, (antal.get(t) ?? 0) + 1);
  assert.deepEqual(lista.antal, [...antal]);
  // Provet har ord som står två gånger i samma namn ("mat" i matlådan, "cm" i måtten).
  assert.ok(prov.some((n) => tokenize(n).length !== new Set(tokenize(n)).size));
});

test("uppvärmningen i steg, i vilken ordning som helst, ändrar inga svar", () => {
  // "speglar" når "Badrumsspegel" bara genom sista ledet ("spegel" står aldrig
  // för sig), och "2pack" bara genom namnen med fogar ("2-pack"): stegen som
  // bygger dem ska bygga rätt.
  const fragor = [...SKRIVNA.flatMap(tangenter), "speglar", "2pack", "stolar", "barnbil"];
  const facit = new Map(fragor.map((q) => [q, somText(rankaMedInfo(VAROR, (v) => v.n, q, VAROR.map((v) => normalize(v.n)), kd))]));
  assert.match(facit.get("speglar") ?? "", /Badrumsspegel/);
  assert.match(facit.get("2pack") ?? "", /2-pack/);
  for (const ordning of [(s: (() => void)[]) => s, (s: (() => void)[]) => [...s].reverse(), (s: (() => void)[]) => s.slice(3), (s: (() => void)[]) => s.slice(0, 2), (s: (() => void)[]) => [s[4], s[2]]]) {
    const namn = VAROR.map((v) => normalize(v.n));
    const steg = forberedKatalogSteg(VAROR, namn, kd);
    assert.equal(steg.length, 6);
    for (const gor of ordning(steg)) gor();
    for (const [q, svar] of facit) assert.equal(somText(rankaMedInfo(VAROR, (v) => v.n, q, namn, kd)), svar, q);
  }
  // Sökrutan gör ett steg per ledig stund, och bara en gång per hämtat index.
  const rankning = readFileSync(new URL("./sok-rankning.ts", import.meta.url), "utf8");
  assert.match(rankning, /\.\.\.\(ordforrad\.has\(idx\) \? \[\] : byggOrdforradSteg\(idx\.map\(\(h\) => h\.n\), \(f\) => \{ if \(!ordforrad\.has\(idx\)\) ordforrad\.set\(idx, f\); \}\)\),/);
  assert.match(rankning, /\(\) => \{ steg\?\.push\(\.\.\.forberedKatalogSteg\(idx, namnFor\(idx\), kategoridata\(\)\)\); \},/);
  assert.match(rankning, /steg\.shift\(\)\?\.\(\);\n    if \(steg\.length > 0\) vanta\(false\);/);
  assert.match(rankning, /if \(uppvarmda\.has\(idx\)\) return;/);
});

test("kategoriförslagen: kategorins former räknas en gång, poängen är densamma", () => {
  const kategorier = KAT.map((k, i) => ({ name: k.n, slug: String(i) }));
  for (const q of ["barnmobel", "fatoljer", "tv-bänk", "svart kontorsstol", "trädgård", "pool och spa", "belysning", "zz", "leksaker spel"]) {
    const forsta = matchaKategorier(q, kategorier, 5);
    // Andra gången ligger kategorins former i minnet.
    assert.deepEqual(matchaKategorier(q, kategorier, 5), forsta, q);
    // Listan är poängen, bäst först, och bara kategorier med poäng.
    const poang = (k: { name: string }) => kategoriPoang(k.name, q);
    const vantat = kategorier.map((k, i) => ({ k, i, p: poang(k) })).filter((r) => r.p > 0).sort((a, b) => b.p - a.p || a.k.name.length - b.k.name.length || a.i - b.i).slice(0, 5).map((r) => r.k);
    assert.deepEqual(forsta, vantat, q);
  }
  assert.deepEqual(matchaKategorier("barnmobel", kategorier, 3).map((k) => k.name), ["Barnmöbler"]);
  // Mjuka bindestreck i namnet räknas inte, första gången eller sedan.
  assert.ok(kategoriPoang("Barn\u00admöbler", "barnmöbler") > 0);
  assert.equal(kategoriPoang("Barn\u00admöbler", "barnmöbler"), kategoriPoang("Barnmöbler", "barnmöbler"));
});

test("det som räknas en gång per namnlista hör till rätt namn", () => {
  // Namnet utan prickar och med fogar: "tvbank" är "TV-bänk", och bara det namnet.
  const varor = ["Soffbord i glas", "Sittpuff i sammet", "TV-bänk 120 cm i ek", "Matta 160 cm i ull", "Pall i trä"].map((n) => ({ n }));
  const namn = varor.map((v) => normalize(v.n));
  for (const q of ["tvbank", "tv bank", "tvbänk", "tv-bank"]) assert.deepEqual(rankaMedInfo(varor, (v) => v.n, q, namn).traffar.map((v) => v.n), ["TV-bänk 120 cm i ek"], q);
  // Och när listan är uppvärmd i förväg (forberedKatalog bygger samma sak).
  const varma = varor.map((v) => normalize(v.n));
  forberedKatalog(varor, varma);
  for (const q of ["tvbank", "tv bank", "tvbänk", "tv-bank"]) assert.deepEqual(rankaMedInfo(varor, (v) => v.n, q, varma).traffar.map((v) => v.n), ["TV-bänk 120 cm i ek"], q);
  // Huvuddelen: "soffbord" är varan i det första namnet och ett tillbehör i det andra.
  const bord = ["Underlägg för soffbord i filt", "Soffbord i glas", "Bricka till soffbord", "Soffbord med hylla"].map((n) => ({ n }));
  const bordNamn = bord.map((v) => normalize(v.n));
  assert.deepEqual(rankaMedInfo(bord, (v) => v.n, "soffbord", bordNamn).traffar.map((v) => v.n), ["Soffbord i glas", "Soffbord med hylla", "Underlägg för soffbord i filt", "Bricka till soffbord"]);
});

test("färger och småord föreslås aldrig som rättning, inte heller ur ordbokens förräknade fält", () => {
  const varor = [...Array.from({ length: 25 }, (_, i) => ({ n: `Kudde ${40 + i} cm i turkos sammet` })), { n: "Soffbord i glas" }, { n: "Sittpuff i sammet" }];
  const namn = varor.map((v) => normalize(v.n));
  // "turjo" ligger ett fel från början på "turkos", som står i 25 namn: en
  // färg är ändå inget ord att rätta till ("dlang" är "slang", inte "lång").
  const u = rankaMedInfo(varor, (v) => v.n, "turjo", namn);
  assert.equal(u.rattat, undefined);
  assert.equal(u.sokt, undefined);
  // Början på färgen som den står är inget fel: den skrivs färdigt utan besked.
  assert.equal(rankaMedInfo(varor, (v) => v.n, "turko", namn).sokt, "turkos");
});

test("☠️ sökläget byggde ordförrådet innan det kunde öppnas: indexet bär sökexemplen färdiga", () => {
  // Raden fram och tillbaka, med och utan exempel. Tabellen läses som förut.
  const kat = [{ n: "Möbler", f: -1 }];
  assert.deepEqual(kategoriRad(kat), { kat: [["Möbler", -1]] });
  assert.deepEqual(kategoriRad(kat, []), { kat: [["Möbler", -1]] });
  const rad = JSON.parse(JSON.stringify(kategoriRad(kat, ["fåtölj", "soffa"])));
  assert.deepEqual(rad, { kat: [["Möbler", -1]], ex: ["fåtölj", "soffa"] });
  assert.deepEqual(lasKategoriRad(rad), kat);
  assert.deepEqual(lasSokexempel(rad), ["fåtölj", "soffa"]);
  // Ett äldre index, eller en rad som inte är vad den ska vara: inga exempel,
  // och rutan räknar dem själv som förut.
  assert.deepEqual(lasSokexempel({ kat: [["Möbler", -1]] }), []);
  assert.deepEqual(lasSokexempel({ ex: ["soffa", 7] }), []);
  assert.deepEqual(lasSokexempel({ ex: "soffa" }), []);
  assert.deepEqual(lasSokexempel({ ex: [""] }), []);
  assert.deepEqual(lasSokexempel({ ex: ["x".repeat(41)] }), []);
  assert.deepEqual(lasSokexempel(null), []);
  assert.equal(lasSokexempel({ ex: Array.from({ length: 40 }, (_, i) => `ord${i}`) }).length, 24);
  // Servern räknar dem med samma funktion på samma namn som rutan gjorde, och
  // rutan tar de färdiga när de finns.
  const las = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");
  assert.match(las("../app/api/search-index/route.ts"), /kategoriRad\(kategorier\.kat, byggOrdforrad\(products\.map\(\(p\) => p\.name\)\)\.exempel\)/);
  assert.match(las("./sok-index.ts"), /exempel = lasSokexempel\(d\[d\.length - 1\]\);\n\s+d\.pop\(\);/);
  assert.match(las("./sok-rankning.ts"), /const fardiga = sokExempelHamtade\(\);\n  return \(fardiga\.length > 0 \? fardiga : ordforradFor\(idx\)\.exempel\)\.slice\(0, max\);/);
});

test("ordförrådet byggt i steg är samma ordförråd", () => {
  const namn = VAROR.map((v) => v.n);
  const helt = byggOrdforrad(namn);
  for (const delar of [1, 3, 4, 7, 1000]) {
    let klart: ReturnType<typeof byggOrdforrad> | null = null;
    const steg = byggOrdforradSteg(namn, (f) => { klart = f; }, delar);
    assert.equal(steg.length, Math.ceil(namn.length / Math.max(1, Math.ceil(namn.length / delar))) + 1, `${delar} delar`);
    // Inget är klart förrän sista steget.
    for (const gor of steg.slice(0, -1)) gor();
    assert.equal(klart, null);
    steg[steg.length - 1]();
    assert.ok(klart);
    const f = klart as ReturnType<typeof byggOrdforrad>;
    assert.deepEqual(f.ord, helt.ord, `${delar} delar`);
    assert.deepEqual(f.exempel, helt.exempel);
    assert.deepEqual([...f.former], [...helt.former]);
  }
  // Provet är inte tomt: butiken har ord att föreslå.
  assert.ok(helt.ord.length > 20);
  // En tom katalog: bara avslutningen.
  let tomt: ReturnType<typeof byggOrdforrad> | null = null;
  const steg = byggOrdforradSteg([], (f) => { tomt = f; });
  assert.equal(steg.length, 1);
  steg[0]();
  assert.deepEqual((tomt as unknown as ReturnType<typeof byggOrdforrad>).ord, []);
});
