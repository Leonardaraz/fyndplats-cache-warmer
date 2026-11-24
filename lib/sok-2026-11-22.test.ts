// Run: node --test --experimental-strip-types lib/sok-2026-11-22.test.ts
//
// Jämförelsesajternas produktnamn (Leonard 2026-11-22). PriceRunner visar
// butiken som säljare av "Homcom Barnelbil Med 2.4 G Fjärrkontroll", utan
// länk till varan. Kunden som skrev det namnet i sökrutan fick noll träffar:
// varan heter "Elbil barn SUV 12V – svart åkbil med fjärrkontroll" här.
//
//   1. Leverantörens märke står först i namnet och hör inte till varan.
//   2. Ett okänt sammansatt ord delas också när sökningen har flera ord, och
//      svaret är detsamma som när kunden skriver orden isär, så länge båda
//      delarna står kvar.
//   3. Ett okänt märke följt av ett ord ur synonymtabellen ("trixie kattträd")
//      gav noll sedan regeln om ärligt noll (2026-11-21). Hittat i samma
//      mätning, och rättat här.
//
// Butiken nedan är påhittad men byggd som den riktiga: namnen är tagna ur
// katalogens mönster.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LEVERANTORSMARKEN, matchaKategorier, medDeladeOrd, normalize, rankaMedInfo, utanMarken, type Kategoridata, type SokKat } from "./search.ts";

type Vara = { n: string; k: number[] };

const KAT: SokKat[] = [
  { n: "Leksaker & Spel", f: -1 }, // 0
  { n: "Elbilar för barn", f: 0 }, // 1
  { n: "Barn & Baby", f: -1 }, // 2
  { n: "Bil & släp", f: -1 }, // 3
  { n: "Hem & Inredning", f: -1 }, // 4
  { n: "Bil & Cykel", f: -1 }, // 5
  { n: "Trädgård & Utemöbler", f: -1 }, // 6
  { n: "Soffor", f: 4 }, // 7
  { n: "Trädgårdsskötsel", f: -1 }, // 8
];

const VAROR: Vara[] = [];
const lagg = (k: number, ...namn: string[]) => { for (const n of namn) VAROR.push({ n, k: [k] }); };

// Elbilarna heter "Elbil … barn", aldrig "barnelbil".
lagg(1,
  "Elbil MINI Cooper för barn 12 V med fjärrkontroll och två hastighetslägen",
  "Elbil för barn 12 V, grön UTV med lastflak och fjärrkontroll, 3–6 år",
  "Elbil Audi TT RS för barn 2–3 år – fjärrkontroll, mjukstart och bälte",
  "Elbil barn SUV 12V – svart åkbil med fjärrkontroll, MP3 och bälte, 3–6 år",
  "Elbil barn BMW i4 12V 115 cm – fjärrkontroll, MP3 och LED",
  "Elbil barn Lamborghini Aventador 12V – vingdörrar och fjärrkontroll",
  "Elbil för barn med lastflak, 6 V, utan fjärrstyrning",
  "Elgokart för barn 3–8 år i orange med justerbar sits",
);
// Annat för barn, och annat med fjärrkontroll.
lagg(2, "Barncykel 16 tum med stödhjul", "Barnstol i trä med bricka", "Barnsoffa 77 cm för två barn", "Barngrind 76 cm med dörr", "Barnbord med två stolar", "Gunga för barn med sele");
lagg(3, "Dieselvärmare 8 kW med fjärrkontroll och LCD-panel", "Dieselvärmare 5 kW 12 V med fjärrkontroll", "Trådlös CarPlay-adapter 4-i-1 för bilen");
lagg(4, "Takfläkt med lampa och fjärrkontroll, 132 cm", "Elkamin med fjärrkontroll och timer", "Paviljong 3 × 3 m med sidoväggar", "Kontorsstol i nät med nackstöd");
lagg(5, "Cykelställ för golv, 2-pack", "Cykelkärra 170 liter med kapell");
// VEVOR är ett märke butiken visar, och ett tillbehör får nämna det i namnet
// (fyra sådana namn på www 2026-11-24).
const MED_MARKET_I_NAMNET = "Knappform 58 mm med material, utbytbar form för VEVOR knappmaskin";
lagg(4, "Knappmaskin för runda märken, 58 mm", MED_MARKET_I_NAMNET);
// Utesofforna heter inte "trädgårdssoffa", och bara en nämner trädgården: de
// andra ligger i kategorin Trädgård & Utemöbler. Innesofforna ligger i Soffor.
lagg(6,
  "Utesoffa i konstrotting, 3-sits med dynor", "Hängsoffa 3-sits med stativ och tak", "Soffa i akacia för uteplatsen, 2-sits",
  "Loungefåtölj i konstrotting, grå dynor", "Solstol i aluminium, hopfällbar", "Parasoll 3 m med vev", "Hammock 3-sits med tak, beige",
  "Soffa för trädgård och balkong, grå dynor", "Loungesoffa med parasoll, grå",
  "Loungeset i aluminium med bord, grått", "Bistroset i metall med två stolar och bord",
);
lagg(7, "Soffa i sammet, grön", "Soffa med schäslong, ljusgrå", "Soffa i tyg med förvaring, beige", "Soffa 3-sits i manchester, brun");
lagg(8,
  "Trädgårdsslang 30 m med munstycke", "Trädgårdsvagn 75 liter", "Trädgårdssax med teleskopskaft", "Trädgårdsskjul 2 × 3 m i stål",
  "Trädgårdshandskar i läder", "Kompostkvarn för trädgård, 2 800 W",
);

const kd: Kategoridata<Vara> = { kat: KAT, av: (v) => v.k };
const namn = VAROR.map((v) => normalize(v.n));
const sok = (q: string) => rankaMedInfo(VAROR, (v) => v.n, q, namn, kd);
const traffar = (q: string) => sok(q).traffar.map((v) => v.n);
const ELBILAR_MED_FJARR = VAROR.filter((v) => v.n.startsWith("Elbil") && v.n.includes("fjärrkontroll")).map((v) => v.n).sort();

test("leverantörens märke hör till frågan, inte till varan", () => {
  // Mätt på www före ändringen: "homcom elbil" gav elbilarna med beskedet att
  // "homcom" strukits, alltså att ingen vara har ordet. Det är sant, och det
  // fick kunden att tro att varan inte finns.
  for (const marke of ["homcom", "Homcom", "HOMCOM", "outsunny", "pawhut", "vinsetto", "vevor", "fyndplats"]) {
    const u = sok(`${marke} elbil`);
    assert.deepEqual(u.strukna, [], marke);
    assert.deepEqual(u.traffar.map((v) => v.n), traffar("elbil"), marke);
  }
  // Märket ensamt är ingen vara.
  assert.deepEqual(traffar("homcom"), []);
  // Ett märke butiken inte känner stryks som förut, med besked.
  assert.deepEqual(sok("zzbrand elbil").strukna, ["zzbrand"]);
});

test("☠️ med och utan märket: samma varor, samma ordning och samma besked", () => {
  // Första versionen gjorde märket till ett småord och lät det stå kvar i
  // sökningen. Mätt mot katalogen: av 2 795 sökningar ändrade "homcom" svaret
  // för 844 (ordningen, för frasen i namnet räknas med småorden kvar, och
  // beskedet, som sa "träffarna för homcom fåtölj").
  const fragor = [
    "elbil", "elbil för barn 12 v", "elbilar för barn", "soffa i sammet", "barnelbil med fjärrkontroll", "barnelbil med fjärkontroll",
    "barnelbil rosa", "trädgårdssoffa 3-sits", "cykelhjälm barn", "ikea cykelvagn", "soffa utan schäslong",
  ];
  for (const q of fragor) {
    const utan = sok(q);
    for (const medMarke of [`homcom ${q}`, `HOMCOM ${q}`, `Outsunny ${q}`, `${q} vevor`, `Homcom: ${q}`, `pawhut® ${q}`]) assert.deepEqual(sok(medMarke), utan, medMarke);
  }
  // Rättningen nämner inte märket.
  assert.equal(sok("homcom barnelbil med fjärkontroll").rattat, "barn elbil med fjärrkontroll");
  // Märket mitt i sökningen.
  assert.deepEqual(sok("elbil homcom för barn"), sok("elbil för barn"));
});

test("utanMarken: märket tas bort som ord, och står kvar när det är hela sökningen", () => {
  assert.equal(utanMarken("Homcom Barnelbil Med 2.4 G Fjärrkontroll"), "Barnelbil Med 2.4 G Fjärrkontroll");
  assert.equal(utanMarken("Outsunny PawHut hundkoja"), "hundkoja");
  assert.equal(utanMarken("soffa VEVOR"), "soffa");
  // Skiljetecknen intill märket följer med det.
  assert.equal(utanMarken("Homcom, soffa"), "soffa");
  assert.equal(utanMarken("Homcom: soffa"), "soffa");
  assert.equal(utanMarken("HOMCOM® Barnelbil - 12V"), "Barnelbil - 12V");
  assert.equal(utanMarken("soffa, Homcom"), "soffa");
  assert.equal(utanMarken("soffa - VEVOR"), "soffa");
  assert.equal(utanMarken("2-pack homcom-stolar"), "2-pack stolar");
  // Ingenting att ta bort: sökningen är orörd, tecken för tecken.
  for (const q of ["vit byrå", "  soffa   grå ", "elbil för barn"]) assert.equal(utanMarken(q), q);
  // Märket ensamt ger noll som förut, och står därför kvar.
  for (const q of ["homcom", "Homcom Outsunny", " vevor "]) assert.equal(utanMarken(q), q);
  // Bara som eget ord.
  for (const q of ["homcomsoffa grå", "xhomcom soffa", "vevor2 soffa"]) assert.equal(utanMarken(q), q);
  // ☠️ "soffa utan homcom" gav sex soffor med ordet "utan" i namnet: märket är
  // ett småord, och ett småord går inte att välja bort. Ingen vara heter
  // Homcom, så märket tas bort med sitt "utan".
  assert.equal(utanMarken("soffa utan homcom"), "soffa");
  assert.equal(utanMarken("soffa ej Vevor"), "soffa");
  assert.equal(utanMarken("soffa utan schäslong homcom"), "soffa utan schäslong");
  assert.deepEqual(sok("soffa utan homcom"), sok("soffa"));
  // "utan" som inte står framför märket rörs inte.
  assert.equal(utanMarken("homcom soffa utan schäslong"), "soffa utan schäslong");
});

test("kategoriförslagen läser inte märket som ett ord", () => {
  const katalog = KAT.map((k, i) => ({ name: k.n, slug: String(i) }));
  const utan = matchaKategorier("elbilar", katalog, 3);
  assert.deepEqual(utan.map((k) => k.name), ["Elbilar för barn"]);
  for (const q of ["homcom elbilar", "Aiyaplay elbilar", "elbilar homcom"]) assert.deepEqual(matchaKategorier(q, katalog, 3), utan, q);
});

test("märkeslistan är densamma som den som döljer märkena i flödena", () => {
  // lib/varumarke.ts gör leverantörens märken till butikens eget i strukturerad
  // data och flöden. Sökningen känner samma märken, plus VEVOR.
  const kalla = readFileSync(new URL("./varumarke.ts", import.meta.url), "utf8");
  const lista = /const WHITE_LABEL = new Set\(\[([^\]]+)\]\)/.exec(kalla);
  assert.ok(lista, "hittar inte WHITE_LABEL i lib/varumarke.ts");
  const whiteLabel = [...lista[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(whiteLabel.length >= 10);
  for (const m of whiteLabel) assert.ok(LEVERANTORSMARKEN.includes(m), `${m} saknas i LEVERANTORSMARKEN`);
  for (const m of LEVERANTORSMARKEN) assert.ok(whiteLabel.includes(m) || m === "vevor", `${m} står inte i lib/varumarke.ts`);
  // Aosoms märken och butikens eget står aldrig i ett varunamn.
  for (const v of VAROR) for (const m of LEVERANTORSMARKEN) assert.equal(normalize(v.n).split(/[^a-zåäö0-9]+/).includes(m), v.n === MED_MARKET_I_NAMNET && m === "vevor", `${v.n}: ${m}`);
});

test("en vara som nämner märket i namnet hittas som de andra", () => {
  // Märket tas bort ur sökningen också här: maskinen heter Knappmaskin, och
  // tillbehöret som nämner den kommer efter. På www gav "vevor knappmaskin"
  // bara de fyra tillbehören.
  assert.deepEqual(traffar("vevor knappmaskin"), ["Knappmaskin för runda märken, 58 mm", MED_MARKET_I_NAMNET]);
  assert.deepEqual(sok("vevor knappmaskin"), sok("knappmaskin"));
  assert.deepEqual(traffar("knappform vevor"), [MED_MARKET_I_NAMNET]);
  // Märket ensamt söks som det står, och varan som nämner det hittas.
  // ☠️ Bara den: "vevor" lästes som flertalet av "vev", och parasollet "med
  // vev" kom med (på www fatpumpar och markiser).
  assert.deepEqual(traffar("vevor"), [MED_MARKET_I_NAMNET]);
  assert.equal(traffar("vev")[0], "Parasoll 3 m med vev");
});

test("☠️ ett märke är inget stavfel: märket ensamt ger inga varor som bara liknar det", () => {
  // Ett annat okänt ord nära "carplay" rättas som vanligt, med besked.
  const fel = sok("carplau");
  assert.equal(fel.traffar.length, 1);
  assert.ok(fel.rattat || fel.liknande);
  // "aiyaplay" ligger lika nära, men är leverantörens märke: på www gav det en
  // CarPlay-adapter som "ligger närmast i stavning".
  assert.deepEqual(sok("aiyaplay"), { traffar: [], strukna: [] });
  assert.deepEqual(sok("Aiyaplay Homcom"), { traffar: [], strukna: [] });
  for (const marke of LEVERANTORSMARKEN) if (marke !== "vevor") assert.deepEqual(traffar(marke), [], marke);
});

test("☠️ PriceRunners namn: ett okänt sammansatt ord delas också i en sökning på flera ord", () => {
  // Ordet ensamt delades redan ("barnelbil" → barn + elbil): de sju elbilarna
  // först, och sedan resten av kategorin Elbilar för barn (elgokarten).
  const ensamt = traffar("barnelbil");
  assert.equal(ensamt.slice(0, 7).every((n) => n.startsWith("Elbil")), true);
  assert.deepEqual(ensamt.slice(7), ["Elgokart för barn 3–8 år i orange med justerbar sits"]);
  // Mätt på www: noll träffar för alla tre.
  for (const q of ["barnelbil med fjärrkontroll", "homcom barnelbil med fjärrkontroll", "Homcom Barnelbil Med 2.4 G Fjärrkontroll"]) {
    const u = sok(q);
    assert.deepEqual(u.strukna, [], q);
    assert.deepEqual(u.traffar.map((v) => v.n).sort(), ELBILAR_MED_FJARR, q);
    assert.match(u.sokt ?? "", /\bbarn elbil\b/, q);
  }
  // Varan från skärmbilden är med, och ingen dieselvärmare eller takfläkt.
  const t = traffar("Homcom Barnelbil Med 2.4 G Fjärrkontroll");
  assert.ok(t.includes("Elbil barn SUV 12V – svart åkbil med fjärrkontroll, MP3 och bälte, 3–6 år"));
  assert.equal(t.some((n) => n.startsWith("Dieselvärmare") || n.startsWith("Takfläkt")), false);
  // Samma svar som för den som skriver orden isär.
  assert.deepEqual(new Set(traffar("barnelbil med fjärrkontroll")), new Set(traffar("barn elbil med fjärrkontroll")));
  // ☠️ Också med skiljetecken intill ordet: första versionen delade sökningen
  // vid blanktecken, och "Barnelbil," var inget ord.
  for (const q of ["Homcom Barnelbil, med fjärrkontroll", "barnelbil/fjärrkontroll", "Barnelbil. Fjärrkontroll.", "HOMCOM Barnelbil - med fjärrkontroll"]) {
    assert.deepEqual(traffar(q).sort(), ELBILAR_MED_FJARR, q);
  }
  // ☠️ Också när ordet är böjt: "barnelbilar" och "barnelbilen" gav noll fast
  // "barnelbil" delades, för inget ord i namnen börjar på "elbilar".
  for (const q of ["barnelbilar med fjärrkontroll", "barnelbilen med fjärrkontroll", "homcom barnelbilar med fjärrkontroll"]) {
    assert.deepEqual(traffar(q).sort(), ELBILAR_MED_FJARR, q);
    assert.deepEqual(sok(q).strukna, [], q);
  }
});

test("delningen gäller bara ord som katalogen inte har, och bara när sökningen inte räckte", () => {
  // Butiken har ingen hjälm: "cykelhjälm" går inte att dela i två kända ord,
  // och svaret är fortfarande ett ärligt noll (inte allt för barn).
  assert.deepEqual(traffar("cykelhjälm barn"), []);
  // Ett ord som namnen har delas inte: "barncykel" står i ett namn.
  assert.equal(sok("barncykel med stödhjul").sokt, undefined);
  assert.deepEqual(traffar("barncykel med stödhjul"), ["Barncykel 16 tum med stödhjul"]);
  // En sökning som redan ger sina träffar rörs inte.
  assert.equal(sok("elbil barn fjärrkontroll").sokt, undefined);
  // Ett halvskrivet ord delas inte: "barnelb" är på väg mot något.
  assert.equal(sok("barnelb med fjärrkontroll").sokt, undefined);
  // En del på tre bokstäver är för kort för att vara säker: "trä" står för sig
  // i ett namn, men "träelbil" delas inte, och svaret är ett ärligt noll.
  assert.equal(sok("träelbil med fjärrkontroll").sokt, undefined);
  assert.deepEqual(traffar("träelbil med fjärrkontroll"), []);
});

test("☠️ båda delarna av det delade ordet ska stå kvar", () => {
  // Skrivet isär stryker sökningen "elbil" och visar barncykeln. Ordet som
  // delades är varutypen, och stryks en del av det är svaret en annan sökning:
  // hellre ett ärligt noll, som förut.
  const isar = sok("barn elbil med stödhjul");
  assert.deepEqual(isar.strukna, ["elbil"]);
  assert.deepEqual(isar.traffar.map((v) => v.n), ["Barncykel 16 tum med stödhjul"]);
  assert.deepEqual(traffar("barnelbil med stödhjul"), []);
  assert.equal(sok("barnelbil med stödhjul").sokt, undefined);
  // Ett delat svar utan träffar gäller inte heller: sökningen är som den skrevs.
  assert.deepEqual(sok("barn elbil med stödhjul zzzz"), { traffar: [], strukna: [] });
  assert.deepEqual(sok("barnelbil med stödhjul zzzz"), { traffar: [], strukna: [] });
});

test("andra ord stryks som vanligt, med besked", () => {
  // Ingen elbil heter rosa. Skrivet isär ger "barn elbil rosa" elbilarna med
  // beskedet att "rosa" strukits, och det sammansatta ordet ger samma svar.
  // Förut: noll.
  const u = sok("barnelbil rosa");
  assert.deepEqual(u.strukna, ["rosa"]);
  assert.equal(u.sokt, "barn elbil rosa");
  assert.deepEqual(u.traffar.map((v) => v.n), traffar("barn elbil rosa"));
  assert.equal(u.traffar.length, 7);
  assert.equal(u.traffar.every((v) => v.n.startsWith("Elbil")), true);
  // Stavningen rättas också som vanligt, och sidan säger vad den visar.
  const fel = sok("barnelbil med fjärkontroll");
  assert.equal(fel.rattat, "barn elbil med fjärrkontroll");
  assert.deepEqual(fel.strukna, []);
  assert.deepEqual(fel.traffar.map((v) => v.n).sort(), ELBILAR_MED_FJARR);
});

test("sökningen som den skrevs gäller när delningen inte stryker färre ord", () => {
  // "barnelbil" stryks som okänt och dieselvärmarna visas, med besked. Delad
  // skulle sökningen stryka "dieselvärmare" i stället och visa elbilarna: lika
  // många strukna ord, och då gäller det kunden skrev.
  const u = sok("barnelbil dieselvärmare");
  assert.deepEqual(u.strukna, ["barnelbil"]);
  assert.equal(u.sokt, undefined);
  assert.equal(u.traffar.length, 2);
  assert.equal(u.traffar.every((v) => v.n.startsWith("Dieselvärmare")), true);
  assert.deepEqual(sok("barn elbil dieselvärmare").strukna, ["dieselvärmare"]);
});

test("delningen gäller också när sökningen som den skrevs strök ordet och visade resten", () => {
  // "zzzzsoffa" går inte att dela: ordet stryks, och parasollerna visas med
  // besked. Så svarade också "trädgårdssoffa parasoll" förut. Delad har en
  // vara alla orden, och ingenting stryks.
  const okant = sok("zzzzsoffa parasoll");
  assert.deepEqual(okant.strukna, ["zzzzsoffa"]);
  assert.deepEqual(okant.traffar.map((v) => v.n).sort(), ["Loungesoffa med parasoll, grå", "Parasoll 3 m med vev"]);
  const u = sok("trädgårdssoffa parasoll");
  assert.deepEqual(u.strukna, []);
  assert.equal(u.sokt, "trädgård soffa parasoll");
  assert.deepEqual(u.traffar.map((v) => v.n), ["Loungesoffa med parasoll, grå"]);
});

test("☠️ ett foge-s: formen utan s provas också, och den som stryker minst gäller", () => {
  // "trädgårdssoffa" står inte i något namn. Delat med s:et kvar ("trädgårds
  // soffa 3-sits") finns bara soffan som nämner trädgården, och "sits" stryks.
  // Utan s:et är "trädgård" kategorins ord, och utesofforna med tre sitsar
  // kommer med utan att något stryks.
  assert.deepEqual(traffar("trädgårdssoffa 3-sits"), traffar("trädgård soffa 3-sits"));
  const u = sok("trädgårdssoffa 3-sits");
  assert.equal(u.sokt, "trädgård soffa 3-sits");
  assert.deepEqual(u.strukna, []);
  assert.deepEqual(u.traffar.slice(0, 2).map((v) => v.n).sort(), ["Hängsoffa 3-sits med stativ och tak", "Utesoffa i konstrotting, 3-sits med dynor"]);
  // Innesoffan med tre sitsar hör inte till trädgården.
  assert.equal(u.traffar.some((v) => v.n === "Soffa 3-sits i manchester, brun"), false);
  const medS = sok("trädgårds soffa 3-sits");
  assert.deepEqual(medS.strukna, ["sits"]);
  assert.deepEqual(medS.traffar.map((v) => v.n), ["Soffa för trädgård och balkong, grå dynor"]);
  // Stryker formen med s en del av ordet gäller den inte alls.
  assert.deepEqual(sok("trädgårds soffa konstrotting").strukna, ["trädgårds"]);
  assert.deepEqual(traffar("trädgårdssoffa konstrotting"), ["Utesoffa i konstrotting, 3-sits med dynor"]);
  assert.deepEqual(sok("trädgårdssoffa konstrotting").strukna, []);
});

test("medDeladeOrd: vilka ord som delas", () => {
  const dela = (q: string, lista: readonly string[] = namn) => medDeladeOrd(q, lista, KAT);
  assert.deepEqual(dela("barnelbil med fjärrkontroll"), [{ q: "barn elbil med fjärrkontroll", delar: ["barn", "elbil"] }]);
  assert.deepEqual(dela("Homcom Barnelbil Med 2.4 G Fjärrkontroll"), [{ q: "homcom barn elbil med 2.4 g fjärrkontroll", delar: ["barn", "elbil"] }]);
  // Skiljetecknen står kvar där de stod.
  assert.deepEqual(dela("Barnelbil, med fjärrkontroll"), [{ q: "barn elbil, med fjärrkontroll", delar: ["barn", "elbil"] }]);
  assert.deepEqual(dela("barnelbil/fjärrkontroll"), [{ q: "barn elbil/fjärrkontroll", delar: ["barn", "elbil"] }]);
  // Med foge-s: båda formerna, den med s:et först.
  assert.deepEqual(dela("trädgårdssoffa 3-sits"), [
    { q: "trädgårds soffa 3-sits", delar: ["trädgårds", "soffa"] },
    { q: "trädgård soffa 3-sits", delar: ["trädgård", "soffa"] },
  ]);
  // Huvudordet får vara böjt, när katalogen har entalet.
  assert.deepEqual(dela("barnelbilar med fjärrkontroll"), [{ q: "barn elbilar med fjärrkontroll", delar: ["barn", "elbilar"] }]);
  assert.deepEqual(dela("barnelbilen med fjärrkontroll"), [{ q: "barn elbilen med fjärrkontroll", delar: ["barn", "elbilen"] }]);
  // Två ord att dela: det med färre former står kvar i sin sista.
  assert.deepEqual(dela("barnelbil trädgårdssoffa"), [
    { q: "barn elbil trädgårds soffa", delar: ["barn", "elbil", "trädgårds", "soffa"] },
    { q: "barn elbil trädgård soffa", delar: ["barn", "elbil", "trädgård", "soffa"] },
  ]);
  // Ett ensamt ord går den gamla vägen (delningar), inte den här.
  assert.deepEqual(dela("barnelbil"), []);
  // Ord som namnen har, småord, märken och tal rörs inte. "barnsoffa" står i
  // ett namn, fast både "barn" och "soffa" är vanliga ord här.
  for (const q of ["barncykel med stödhjul", "barnsoffa 77 cm", "elbil barn fjärrkontroll", "homcom elbil", "för barn", "120 cm bred"]) assert.deepEqual(dela(q), [], q);
  // Också i en annan böjning: "barnstolar" är namnets "barnstol", hur vanliga
  // "barn" och "stol" än är. Utan barnstolen i katalogen delas ordet.
  const medStolar = [...namn, ...["Stol i ek", "Stol i bok", "Stol med armstöd", "Stol i sammet, grön", "Stol för matbordet"].map(normalize)];
  assert.deepEqual(dela("barnstolar i trä", medStolar), []);
  assert.deepEqual(dela("barnstolar i trä", medStolar.filter((n) => !n.startsWith("barnstol"))), [{ q: "barn stolar i trä", delar: ["barn", "stolar"] }]);
  // En del på tre bokstäver, eller en som står i för få namn, räcker inte.
  assert.deepEqual(dela("träelbil med fjärrkontroll"), []);
  assert.deepEqual(dela("barngunga med sele"), []);
  // ☠️ Kunden kan vara mitt i ett ord som katalogen har: finns ett ord som
  // börjar så delas det inte.
  const medLangtOrd = [...namn, normalize("Barnelbilsskydd i plast, 2-pack")];
  assert.deepEqual(dela("barnelbil med fjärrkontroll", medLangtOrd), []);
});

test("medDeladeOrd: ord som butiken redan förstår delas inte", () => {
  const fler = (...nya: string[]) => [...namn, ...nya.map(normalize)];
  // Ett ord i synonymtabellen har sin betydelse därifrån ("cykelvagn" är en
  // cykelkärra), också när båda delarna är vanliga ord i katalogen.
  const medVagnar = fler("Cykel 24 tum", "Cykel 26 tum", "Cykel 28 tum", "Vagn för ved", "Vagn med flak", "Vagn i stål", "Vagn 75 liter", "Vagn med hjul");
  assert.deepEqual(medDeladeOrd("cykelvagn för två barn", medVagnar, KAT), []);
  assert.deepEqual(medDeladeOrd("cykelvagnen för två barn", medVagnar, KAT), []);
  // Samma delar i ett ord som tabellen inte har delas.
  assert.deepEqual(medDeladeOrd("vagncykel för två barn", medVagnar, KAT), [{ q: "vagn cykel för två barn", delar: ["vagn", "cykel"] }]);
  // En kategoris ord har sin betydelse från kategorin.
  const medKategori = [...KAT, { n: "Barnelbilar", f: 0 }];
  assert.deepEqual(medDeladeOrd("barnelbilar med fjärrkontroll", namn, medKategori), []);
  assert.deepEqual(medDeladeOrd("barnelbilar med fjärrkontroll", namn, KAT), [{ q: "barn elbilar med fjärrkontroll", delar: ["barn", "elbilar"] }]);
  // ☠️ Ett filter är ingen filt (INTE_BOJT): "filter" står i ett enda namn här
  // och är inget vanligt ord, hur många filtar butiken än har.
  const medFiltar = fler("Filt i ull, grå", "Filt i ull, beige", "Filt i fleece, blå", "Filt i bomull, vit", "Filt med fransar, rosa", "Filter till dammsugare, 2-pack");
  assert.deepEqual(medDeladeOrd("barnfilter till dammsugare", medFiltar, KAT), []);
  assert.deepEqual(medDeladeOrd("barnfiltar i ull", medFiltar, KAT), [{ q: "barn filtar i ull", delar: ["barn", "filtar"] }]);
  // Entalet ska vara ett ord i katalogen: "spor" är inget, fast sex namn har
  // ord som börjar så.
  const medSporrar = fler("Sport och lek, set för tre", "Sporre i stål, storlek 1", "Sporre i stål, storlek 2", "Sporre i stål, storlek 3", "Sporre i mässing", "Sporre med rem");
  assert.deepEqual(medDeladeOrd("barnsport i skolan", medSporrar, KAT), []);
  // Butikens eget namn och leverantörernas märken är småord, hur de än går
  // att dela ("fynd" och "plats").
  const medFynd = fler("Fynd i låda 1", "Fynd i låda 2", "Fynd i låda 3", "Fynd i låda 4", "Fynd i låda 5", "Plats för skor 1", "Plats för skor 2", "Plats för skor 3", "Plats för skor 4", "Plats för skor 5");
  assert.deepEqual(medDeladeOrd("fyndplats soffa", medFynd, KAT), []);
  assert.deepEqual(medDeladeOrd("fyndplatsen soffa", medFynd, KAT), [{ q: "fynd platsen soffa", delar: ["fynd", "platsen"] }]);
});

test("☠️ ärligt noll: ett ord ur synonymtabellen är en varutyp, också när varorna heter något annat", () => {
  // Mätt på www 2026-11-22: "trixie kattträd", "ikea barpall", "jysk solstol"
  // och "ikea köksbord" gav noll, fast "ikea soffa" gav sofforna utan "ikea".
  // Butiken här har en cykelkärra, och tabellen säger att en cykelvagn är en.
  assert.deepEqual(traffar("cykelvagn"), ["Cykelkärra 170 liter med kapell"]);
  for (const marke of ["ikea", "jysk", "trixie"]) {
    const u = sok(`${marke} cykelvagn`);
    assert.deepEqual(u.strukna, [marke], marke);
    assert.deepEqual(u.traffar.map((v) => v.n), ["Cykelkärra 170 liter med kapell"], marke);
  }
  // Envägsorden likaså: "utemöbler" är loungeset och bistroset, och inget namn
  // har ordet.
  const ute = sok("jysk utemöbler");
  assert.deepEqual(ute.strukna, ["jysk"]);
  assert.deepEqual(ute.traffar.map((v) => v.n).sort(), ["Bistroset i metall med två stolar och bord", "Loungeset i aluminium med bord, grått"]);
  // Det ärliga nollet står kvar där det hör hemma: "barn" och "fjärrkontroll"
  // är inga varutyper, och butiken har ingen hjälm.
  assert.deepEqual(traffar("cykelhjälm barn"), []);
  assert.deepEqual(traffar("cykelhjälm med fjärrkontroll"), []);
  assert.deepEqual(traffar("ikea kids"), []);
});
