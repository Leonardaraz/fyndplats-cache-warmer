// Run: node --test --experimental-strip-types lib/sok-2026-11-25.test.ts
//
// Jämförelsesajtens namn på varan, som nycklar (Leonard 2026-11-25). Kunden som
// skriver eller klistrar in det namn PriceRunner eller Prisjakt visar för en av
// våra varor ska få den varan först, fast den heter något annat här.
//
//   1. Namnen står aldrig i repot: bara enkelriktade summor av namnets ord.
//   2. Ett ord som liknar ett artikelnummer räknas inte, varken i namnet eller
//      i sökningen.
//   3. En nyckel kräver minst tre ord.
//   4. Varan står först, och sökningens egna träffar står kvar under.
//
// ☠️ Namnen här är påhittade, utom det enda som redan står i butikens
// anvisning (Leonards skärmbild 2026-11-22). Artikelnumren byggs vid körning
// av nollor: inget riktigt artikelnummer står i repot.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { MINST_ORD, artikelnummerlikt, namnetsSvar, namnnyckel, namnord, rankaMedInfo, type Kategoridata, type SokKat, type Sokutfall } from "./search.ts";
import { NAMNNYCKLAR } from "./namnnycklar-data.ts";

const ROT = new URL("..", import.meta.url).pathname;
const las = (...delar: string[]) => readFileSync(join(ROT, ...delar), "utf8");

// Påhittade artikelnummer, i de former som känns igen.
const AOSOM_LIKT = ["000", "-", "000", "V00", "XX"].join(""); // 000-000V00XX
const DELAT_LIKT = ["q0", "-", "0000"].join(""); // q0-0000
const LANGT_LIKT = ["ZZ", "0000", "QQ", "000", "ZZ", "0000"].join(""); // ZZ0000QQ000ZZ0000

type Vara = { n: string; s: string; k: number[]; o?: 1 };
const KAT: SokKat[] = [
  { n: "Leksaker & Spel", f: -1 }, // 0
  { n: "Elbilar för barn", f: 0 }, // 1
  { n: "Hem & Inredning", f: -1 }, // 2
  { n: "Soffor", f: 2 }, // 3
];
const VAROR: Vara[] = [
  { n: "Elbil MINI Cooper för barn 12 V med fjärrkontroll och två hastighetslägen", s: "elbil-mini", k: [1] },
  { n: "Elbil för barn 12 V, grön UTV med lastflak och fjärrkontroll, 3–6 år", s: "elbil-utv", k: [1] },
  { n: "Elbil Audi TT RS för barn 2–3 år – fjärrkontroll, mjukstart och bälte", s: "elbil-audi", k: [1] },
  { n: "Elbil barn SUV 12V – svart åkbil med fjärrkontroll, MP3 och bälte, 3–6 år", s: "elbil-suv", k: [1] },
  { n: "Soffa 3-sits i grått tyg med träben", s: "soffa-gra", k: [3] },
  { n: "Soffa 3-sits i beige tyg med träben", s: "soffa-beige", k: [3] },
  { n: "Hörnsoffa i sammet, mörkgrön", s: "hornsoffa", k: [3], o: 1 },
  { n: "Sidobord i bambu med hylla", s: "sidobord", k: [2] },
];

// Jämförelsesajtens namn på varorna. Det första står i butikens anvisning, resten är påhittade.
const SUV_NAMN = "Homcom Barnelbil Med 2.4 G Fjärrkontroll";
const BORD_NAMN = "Outsunny Zyxgrund Qvartell Brumbass 9000"; // inget av orden står i katalogen
const SOFFA_NAMN = "Homcom Tresitssoffa Skandinavisk Stil Linnelook"; // samma namn på två färger
const HORN_NAMN = "Vinsetto Divansoffa Sammet Vändbar Schäslong";
// Ett namn vars ord står i katalogen: sökningen själv hittar elbilarna, men sätter en annan först.
const AUDI_NAMN = "Aiyaplay Elbil för barn 12 V med fjärrkontroll";
// Ett namn med ett ord katalogen saknas ("rosa"): sökningen själv stryker det, med besked.
const BEIGE_NAMN = "Homcom Soffa 3-sits tyg träben rosa";

const NYCKLAR: Record<string, string[]> = {
  "elbil-suv": [namnnyckel(SUV_NAMN)!],
  sidobord: [namnnyckel(BORD_NAMN)!],
  "soffa-gra": [namnnyckel(SOFFA_NAMN)!],
  hornsoffa: [namnnyckel(HORN_NAMN)!],
  "elbil-audi": [namnnyckel(AUDI_NAMN)!],
  // Den beigea soffan bär två namn: ett som den delar med den grå, och ett eget.
  "soffa-beige": [namnnyckel(SOFFA_NAMN)!, namnnyckel(BEIGE_NAMN)!],
};
const UTAN: Kategoridata<Vara> = { kat: KAT, av: (v) => v.k };
const MED: Kategoridata<Vara> = { ...UTAN, nycklar: (v) => NYCKLAR[v.s] };
const sok = (q: string, kd: Kategoridata<Vara> | undefined = MED) => rankaMedInfo(VAROR, (v) => v.n, q, undefined, kd);
const adresser = (q: string, kd?: Kategoridata<Vara>) => sok(q, kd ?? MED).traffar.map((v) => v.s);

test("namnets ord: gemener, skiljetecken bort, tal och bokstäver var för sig", () => {
  assert.deepEqual(namnord("Barnelbil Med 2.4 G Fjärrkontroll"), ["barnelbil", "med", "2.4", "g", "fjärrkontroll"]);
  assert.deepEqual(namnord("  BARNELBIL, med 2,4g  fjärrkontroll! "), ["barnelbil", "med", "2.4", "g", "fjärrkontroll"]);
  assert.deepEqual(namnord("Paviljong 3x3 m"), namnord("paviljong 3 x 3m"));
  assert.deepEqual(namnord("Tv-bänk (120cm) – vit/ek"), ["tv", "bänk", "120", "cm", "vit", "ek"]);
  assert.deepEqual(namnord(""), []);
});

test("☠️ ett ord som liknar ett artikelnummer räknas inte", () => {
  // "000-000" är Aosoms form utan en enda bokstav: den känns bara igen på formen.
  for (const o of [AOSOM_LIKT, AOSOM_LIKT.toLowerCase(), DELAT_LIKT, LANGT_LIKT, "A00-000", "00g-000", "0d0-000", "000-000"]) {
    assert.equal(artikelnummerlikt(o), true, o);
  }
  // Mått, enheter och vanliga ord med siffror är inga artikelnummer.
  for (const o of ["120x60cm", "100x50x30cm", "12v", "2.4g", "2400w", "3-sits", "2-i-1", "tv-bänk", "mp3", "usb-c", "ip65", "4k", "e27", "a4", "h2o", "led", "barnelbil", "180"]) {
    assert.equal(artikelnummerlikt(o), false, o);
  }
  // Namnet är detsamma med och utan numret, var det än står.
  const utan = namnord("Barnelbil Med 2.4 G Fjärrkontroll");
  assert.deepEqual(namnord(`Barnelbil ${AOSOM_LIKT} Med 2.4 G Fjärrkontroll`), utan);
  assert.deepEqual(namnord(`Barnelbil Med 2.4 G Fjärrkontroll (${LANGT_LIKT})`), utan);
  assert.deepEqual(namnord(`${DELAT_LIKT}, Barnelbil Med 2.4 G Fjärrkontroll`), utan);
});

test("nyckeln: samma för samma namn hur det än skrivs, och aldrig för färre än tre ord", () => {
  assert.equal(MINST_ORD, 3);
  const nyckel = namnnyckel(SUV_NAMN);
  assert.match(nyckel!, /^[0-9a-z]{6,11}$/);
  for (const skrivet of [
    "homcom barnelbil med 2.4 g fjärrkontroll",
    "Barnelbil Med 2.4 G Fjärrkontroll", // utan märket
    "HOMCOM® Barnelbil, med 2,4g fjärrkontroll.",
    `Homcom Barnelbil Med 2.4 G Fjärrkontroll ${AOSOM_LIKT}`,
    "  Homcom   Barnelbil Med 2.4 G   Fjärrkontroll  ",
  ]) assert.equal(namnnyckel(skrivet), nyckel, skrivet);
  // Ett annat namn, och samma ord i en annan ordning, är andra nycklar.
  assert.notEqual(namnnyckel("Homcom Barnelbil Med 2.4 G Fjärrstyrning"), nyckel);
  assert.notEqual(namnnyckel("Homcom Fjärrkontroll Med 2.4 G Barnelbil"), nyckel);
  // För få ord: märket räknas inte, och inte artikelnumret.
  for (const kort of ["", "barnelbil", "homcom barnelbil", "Homcom Barnelbil Röd", `Homcom Barnelbil ${AOSOM_LIKT} ${LANGT_LIKT}`, AOSOM_LIKT, "homcom"]) {
    assert.equal(namnnyckel(kort), null, kort);
  }
});

test("varan som heter så hos jämförelsesajten står först, och sökningens träffar står kvar under", () => {
  const utan = sok(AUDI_NAMN, UTAN);
  // Sökningen själv hittar elbilarna, och sätter en annan än Audin först.
  assert.ok(utan.traffar.length >= 3, `sökningen gav ${utan.traffar.length}`);
  assert.notEqual(utan.traffar[0].s, "elbil-audi");
  const med = sok(AUDI_NAMN);
  assert.equal(med.traffar[0].s, "elbil-audi");
  assert.equal(med.namn, 1);
  // Samma varor som sökningen själv gav, ingen två gånger, och i samma inbördes ordning.
  assert.deepEqual(med.traffar.slice(1).map((v) => v.s), utan.traffar.map((v) => v.s).filter((s) => s !== "elbil-audi"));
  assert.equal(new Set(med.traffar).size, med.traffar.length);
  // ☠️ Sökningen själv fyllde på listan och sa det (`utan`, `hela`). Svaret på
  // namnet bär bara varorna, antalet och en tom lista strukna ord: inget besked
  // om en sökning på ord, och inget fält som följer med av sig självt.
  assert.deepEqual(utan.utan, ["12"]);
  assert.equal(utan.hela, 3);
  assert.deepEqual(Object.keys(med).sort(), ["namn", "strukna", "traffar"]);
  assert.deepEqual(med.strukna, []);
});

test("☠️ ett struket ord i sökningen följer inte med till namnets svar", () => {
  const utan = sok(BEIGE_NAMN, UTAN);
  assert.deepEqual(utan.strukna, ["rosa"]);
  assert.deepEqual(utan.traffar.map((v) => v.s), ["soffa-gra", "soffa-beige"]);
  const med = sok(BEIGE_NAMN);
  assert.deepEqual(med.traffar.map((v) => v.s), ["soffa-beige", "soffa-gra"]);
  assert.deepEqual(med.strukna, []);
  assert.equal(med.namn, 1);
  assert.deepEqual(Object.keys(med).sort(), ["namn", "strukna", "traffar"]);
});

test("☠️ namnets svar bär bara sina egna fält, vad sökningen än sa", () => {
  const [a, b, c] = ["a", "b", "c"];
  // Varje besked sökningen kan ge, på en gång.
  const fullt: Sokutfall<string> = {
    traffar: [b, a, c], strukna: ["rosa"], utan: ["12"], hela: 2, rattat: "soffa", sokt: "tv bänk", inte: ["belysning"], hemma: 2,
  };
  const ut = namnetsSvar(fullt, [a]);
  assert.deepEqual(ut, { traffar: [a, b, c], strukna: [], namn: 1, inte: ["belysning"], sokt: "tv bänk" });
  // ☠️ Träffar som bara låg nära i stavning är gissningar: de står inte kvar under varan.
  assert.deepEqual(namnetsSvar({ traffar: [b, c], strukna: [], liknande: true }, [a]), { traffar: [a], strukna: [], namn: 1 });
  // En rättad stavning är ingen gissning: träffarna står kvar, utan beskedet.
  assert.deepEqual(namnetsSvar({ traffar: [b, c], strukna: [], rattat: "soffa" }, [a]), { traffar: [a, b, c], strukna: [], namn: 1 });
  // Flera varor på samma namn, i den ordning de kom, och ingen två gånger.
  assert.deepEqual(namnetsSvar({ traffar: [c, b, a], strukna: [] }, [a, b]), { traffar: [a, b, c], strukna: [], namn: 2 });
  // Utan varor är svaret sökningens eget, samma objekt.
  assert.equal(namnetsSvar(fullt, []), fullt);
});

test("☠️ ger sökningen själv ingenting står varan där ensam: namnet är svaret", () => {
  // "barnelbil" står inte i något namn i den här lilla katalogen, och orden
  // som blir kvar räcker inte: sökningen svarar noll. Varan heter så ändå.
  assert.deepEqual(adresser(SUV_NAMN, UTAN), []);
  const med = sok(SUV_NAMN);
  assert.deepEqual(med.traffar.map((v) => v.s), ["elbil-suv"]);
  assert.equal(med.namn, 1);
  assert.deepEqual(med.strukna, []);
});

test("samma svar hur namnet än skrivs: utan märket, med skiljetecken och med ett artikelnummer", () => {
  const facit = adresser(SUV_NAMN);
  for (const skrivet of [
    "barnelbil med 2.4 g fjärrkontroll",
    "HOMCOM Barnelbil, med 2,4g fjärrkontroll",
    `Homcom Barnelbil Med 2.4 G Fjärrkontroll ${AOSOM_LIKT}`,
  ]) {
    assert.equal(sok(skrivet).namn, 1, skrivet);
    assert.equal(adresser(skrivet)[0], "elbil-suv", skrivet);
    assert.deepEqual(adresser(skrivet), facit, skrivet);
  }
});

test("☠️ ett namn utan ett enda ord ur katalogen ger varan, och inga gissningar under den", () => {
  const utan = sok(BORD_NAMN, UTAN);
  // Sökningen själv har ingenting säkert att svara med.
  assert.ok(utan.traffar.length === 0 || utan.liknande === true || utan.strukna.length > 0);
  const med = sok(BORD_NAMN);
  assert.equal(med.traffar[0].s, "sidobord");
  assert.equal(med.namn, 1);
  if (utan.liknande) assert.deepEqual(med.traffar.map((v) => v.s), ["sidobord"]);
  assert.equal(med.liknande, undefined);
});

test("ett namn som två varor delar ger båda först, i katalogens ordning", () => {
  const med = sok(SOFFA_NAMN);
  assert.equal(med.namn, 2);
  assert.deepEqual(med.traffar.slice(0, 2).map((v) => v.s), ["soffa-gra", "soffa-beige"]);
  assert.equal(new Set(med.traffar).size, med.traffar.length);
});

test("en slutsåld vara står också först i rankningen: ordningen efter lager är vyns", () => {
  const med = sok(HORN_NAMN);
  assert.equal(med.traffar[0].s, "hornsoffa");
  assert.equal(med.traffar[0].o, 1);
  assert.equal(med.namn, 1);
});

test("☠️ samma varulista med en annan källa till nycklar räknas om", () => {
  // Uppslaget sparas per varulista. Sparades det utan att minnas vem som läste
  // nycklarna gav den andra källan den förstas svar (mätningen 2026-11-25:
  // en körning utan nycklar först, och sedan hade ingen vara någon).
  const tom: Kategoridata<Vara> = { ...UTAN, nycklar: () => undefined };
  const annan: Kategoridata<Vara> = { ...UTAN, nycklar: (v) => (v.s === "sidobord" ? [namnnyckel(SUV_NAMN)!] : undefined) };
  assert.equal(sok(SUV_NAMN, tom).namn, undefined);
  assert.equal(sok(SUV_NAMN, MED).traffar[0].s, "elbil-suv");
  assert.equal(sok(SUV_NAMN, annan).traffar[0].s, "sidobord");
  assert.equal(sok(SUV_NAMN, tom).namn, undefined);
  assert.equal(sok(SUV_NAMN, MED).traffar[0].s, "elbil-suv");
});

test("☠️ en vanlig sökning är orörd: utan nyckel, med för få ord eller med ett artikelnummer ensamt", () => {
  for (const q of ["elbil för barn 12 v", "soffa 3-sits grå", "homcom barnelbil", "barnelbil", "sidobord bambu", "soffa", "xyzzy", AOSOM_LIKT, `homcom ${AOSOM_LIKT}`]) {
    assert.deepEqual(sok(q, MED), sok(q, UTAN), q);
    assert.equal(sok(q).namn, undefined, q);
  }
  // Utan nycklar i kategoridatan, och utan kategoridata alls, söker sökningen som förut.
  assert.equal(sok(SUV_NAMN, UTAN).namn, undefined);
  assert.equal(rankaMedInfo(VAROR, (v) => v.n, SUV_NAMN).namn, undefined);
});

test("datafilen bär bara adresser och nycklar, aldrig ett namn", () => {
  const poster = Object.entries(NAMNNYCKLAR);
  assert.ok(poster.length > 0);
  for (const [adress, nycklar] of poster) {
    assert.match(adress, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, adress);
    assert.ok(nycklar.length > 0, adress);
    for (const n of nycklar) assert.match(n, /^[0-9a-z]{6,11}$/, `${adress}: ${n}`);
    assert.deepEqual([...nycklar], [...new Set(nycklar)].sort(), adress);
  }
  // Rad för rad: efter huvudet står bara `"adress": ["nyckel", …],`. Ett namn
  // hade haft blanksteg, versaler eller å, ä och ö, och fäller här.
  const rader = las("lib", "namnnycklar-data.ts").split("\n");
  const start = rader.findIndex((r) => r.startsWith("export const NAMNNYCKLAR"));
  assert.ok(start > 0);
  const data = rader.slice(start + 1, rader.lastIndexOf("};"));
  assert.equal(data.length, poster.length);
  for (const r of data) assert.match(r, /^  "[a-z0-9-]+": \["[0-9a-z]{6,11}"(?:,"[0-9a-z]{6,11}")*\],$/, r.slice(0, 60));
  // Huvudet säger hur filen kom till, och ingenting annat.
  for (const r of rader.slice(0, start)) assert.ok(r === "" || r.startsWith("//"), r);
});

test("☠️ bara servern läser datafilen: sökrutan får nycklarna med indexet", () => {
  const far = new Set(["app/api/search-index/route.ts", "app/sok/page.tsx"]);
  const hittade: string[] = [];
  const ga = (mapp: string) => {
    for (const namn of readdirSync(join(ROT, mapp))) {
      if (namn === "node_modules" || namn.startsWith(".")) continue;
      const stig = `${mapp}/${namn}`;
      if (statSync(join(ROT, stig)).isDirectory()) ga(stig);
      else if (/\.tsx?$/.test(namn) && !/\.test\.ts$/.test(namn) && /^import [^;]*namnnycklar-data/m.test(las(stig))) hittade.push(stig);
    }
  };
  for (const mapp of ["app", "components", "lib"]) ga(mapp);
  assert.deepEqual(hittade.sort(), [...far].sort());
  // Indexet: fältet `x`, bara på de rader som har nycklar.
  assert.match(las("app", "api", "search-index", "route.ts"), /\.\.\.\(NAMNNYCKLAR\[p\.slug\] \? \{ x: NAMNNYCKLAR\[p\.slug\] \} : \{\}\),/);
  assert.match(las("lib", "sok-index.ts"), /export type SokTraff = \{ n: string; s: string; i: string; p: string; o\?: 1; k\?: number\[\]; x\?: string\[\] \};/);
  // De tre vägarna ger sökningen nycklarna.
  assert.match(las("lib", "sok-rankning.ts"), /\{ kat, av: radensKategorier, nycklar: radensNycklar \}/);
  assert.match(las("lib", "sok-rankning.ts"), /const radensNycklar = \(h: SokTraff\) => h\.x;/);
  assert.match(las("app", "sok", "page.tsx"), /nycklar: \(p\) => NAMNNYCKLAR\[p\.slug\] \};/);
  assert.match(las("components", "sok-kall.tsx"), /for \(const h of index\) if \(h\.x\) nycklar\.set\(h\.s, h\.x\);/);
  assert.match(las("components", "sok-kall.tsx"), /nycklar: \(p\) => namnuppslag\.get\(p\.slug\) \};/);
});

test("vyerna säger att första varan är den kunden sökte", () => {
  const vy = las("components", "sok-vy.tsx");
  assert.match(vy, /\{klar\.namn !== undefined && klar\.namn > 0 && \(/);
  assert.match(vy, /<b>Den första varan<\/b> heter så hos prisjämförelsesajterna\./);
  assert.match(vy, /Den här varan heter <b>“\{term\}”<\/b> hos prisjämförelsesajterna\./);
  const ruta = las("components", "searchbox.tsx");
  // Märket står på de första korten, och Slutsåld går före det i rutnätet.
  assert.match(ruta, /setNamnFor\(!visar && svar\.namn \? \{ q: val, antal: svar\.namn \} : null\);/);
  assert.match(ruta, /const soktaVaror = !isPopular && namnFor !== null && namnFor\.q === q \? namnFor\.antal : 0;/);
  assert.match(ruta, /\{hi < soktaVaror && !h\.o && <span className="sugg-kort-sokt">Varan du sökte<\/span>\}/);
  assert.match(ruta, /\{hi < soktaVaror && <span className="sugg-sokt">Varan du sökte<\/span>\}/);
  // Ett nollställt läge bär inget märke från förra sökningen.
  assert.equal((ruta.match(/setNamnFor\(null\);/g) ?? []).length, 2);
  const css = las("app", "globals.css");
  assert.match(css, /\.sugg-kort-sokt\{[^}]*background:var\(--brand\);color:#fff/);
  assert.match(css, /\.sugg-sokt\{[^}]*background:var\(--brand\);color:#fff/);
});

test("☠️ nyckelkoden är skriven utan bakåtblick: Safari före 16.4 läser inte en sådan", () => {
  const kod = las("lib", "search.ts");
  const fran = kod.indexOf("// ── JÄMFÖRELSESAJTENS NAMN PÅ VARAN");
  const till = kod.indexOf("// rankByName med besked.");
  assert.ok(fran > 0 && till > fran);
  assert.doesNotMatch(kod.slice(fran, till), /\(\?<[=!]/);
  // Inga egenskapsklasser heller (\p{…}): de kräver flaggan u och är onödiga här.
  assert.doesNotMatch(kod.slice(fran, till), /\\p\{/);
});
