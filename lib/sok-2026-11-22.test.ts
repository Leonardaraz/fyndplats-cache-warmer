// Run: node --test --experimental-strip-types lib/sok-2026-11-22.test.ts
//
// Jämförelsesajternas produktnamn (Leonard 2026-11-22). PriceRunner visar
// butiken som säljare av "Homcom Barnelbil Med 2.4 G Fjärrkontroll", utan
// länk till varan. Kunden som skrev det namnet i sökrutan fick noll träffar:
// varan heter "Elbil barn SUV 12V – svart åkbil med fjärrkontroll" här.
//
//   1. Leverantörens märke står först i namnet och hör inte till varan.
//   2. Ett okänt sammansatt ord delas också när sökningen har flera ord.
//
// Butiken nedan är påhittad men byggd som den riktiga: namnen är tagna ur
// katalogens mönster.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LEVERANTORSMARKEN, medDeladeOrd, normalize, rankaMedInfo, type Kategoridata, type SokKat } from "./search.ts";

type Vara = { n: string; k: number[] };

const KAT: SokKat[] = [
  { n: "Leksaker & Spel", f: -1 }, // 0
  { n: "Elbilar för barn", f: 0 }, // 1
  { n: "Barn & Baby", f: -1 }, // 2
  { n: "Bil & släp", f: -1 }, // 3
  { n: "Hem & Inredning", f: -1 }, // 4
  { n: "Bil & Cykel", f: -1 }, // 5
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
lagg(3, "Dieselvärmare 8 kW med fjärrkontroll och LCD-panel", "Dieselvärmare 5 kW 12 V med fjärrkontroll");
lagg(4, "Takfläkt med lampa och fjärrkontroll, 132 cm", "Elkamin med fjärrkontroll och timer", "Paviljong 3 × 3 m med sidoväggar", "Kontorsstol i nät med nackstöd");
lagg(5, "Cykelställ för golv, 2-pack", "Cykelkärra 170 liter med kapell");

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
  // Inget varunamn bär ett av dem: då vore ordet ett sökord.
  for (const v of VAROR) for (const m of LEVERANTORSMARKEN) assert.equal(normalize(v.n).split(/[^a-zåäö0-9]+/).includes(m), false, `${v.n}: ${m}`);
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
  // i ett namn, men "träelbil" delas inte, och svaret är ett ärligt noll i
  // stället för elbilarna med beskedet att "trä" strukits.
  assert.equal(sok("träelbil med fjärrkontroll").sokt, undefined);
  assert.deepEqual(traffar("träelbil med fjärrkontroll"), []);
});

test("medDeladeOrd: vilka ord som delas", () => {
  const dela = (q: string, lista: readonly string[] = namn) => medDeladeOrd(q, lista, KAT);
  assert.equal(dela("barnelbil med fjärrkontroll"), "barn elbil med fjärrkontroll");
  assert.equal(dela("Homcom Barnelbil Med 2.4 G Fjärrkontroll"), "homcom barn elbil med 2.4 g fjärrkontroll");
  // Ett ensamt ord går den gamla vägen (delningar), inte den här.
  assert.equal(dela("barnelbil"), null);
  // Ord som namnen har, småord, märken och tal rörs inte.
  for (const q of ["barncykel med stödhjul", "elbil barn fjärrkontroll", "homcom elbil", "för barn", "120 cm bred"]) assert.equal(dela(q), null, q);
  // ☠️ Kunden kan vara mitt i ett ord som katalogen har: finns ett ord som
  // börjar så delas det inte.
  const medLangtOrd = [...namn, normalize("Barnelbilsskydd i plast, 2-pack")];
  assert.equal(dela("barnelbil med fjärrkontroll", medLangtOrd), null);
  // Ett begreppsord (synonymtabellen) eller ett kategoriord är känt fast inget namn har det.
  assert.equal(dela("kattträd med grotta"), null);
});
