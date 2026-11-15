// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Mjuka bindestreck i menyns långa kategorinamn (2026-11-15). Se
// lib/mjukt-bindestreck.ts för varför: två namn bröts mitt i ordet i datorns meny.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EFTERLEDER, MINSTA_FORLED, MINSTA_ORD, MJUKT_BINDESTRECK, mjukaBindestreck } from "./mjukt-bindestreck.ts";

/** "|" står för det mjuka bindestrecket, så att provet går att läsa. */
const med = (s: string) => s.replaceAll("|", MJUKT_BINDESTRECK);
const utan = (s: string) => s.replaceAll(MJUKT_BINDESTRECK, "");

// Alla ord om minst 13 tecken i menyns 168 kategorinamn 2026-11-15, och var
// fogen ska sitta. De två första bröts mitt i ordet i 960–1440 px.
const MENYNS_LANGA_ORD: Record<string, string> = {
  Trädgårdsanläggning: "Trädgårds|anläggning",
  Verkstadsutrustning: "Verkstads|utrustning",
  Uppresningsfåtöljer: "Uppresnings|fåtöljer",
  Hushållsapparater: "Hushålls|apparater",
  Badrumsrenovering: "Badrums|renovering",
  Öronlappsfåtöljer: "Öronlapps|fåtöljer",
  Trädgårdsmaskiner: "Trädgårds|maskiner",
  Verkstadsmaskiner: "Verkstads|maskiner",
  Verktygstillbehör: "Verktygs|tillbehör",
  Kontorstillbehör: "Kontors|tillbehör",
  Serveringsvagnar: "Serverings|vagnar",
  köksorganisering: "köks|organisering",
  Trädgårdsskötsel: "Trädgårds|skötsel",
  Garageinredning: "Garage|inredning",
  Träningskläder: "Tränings|kläder",
  Trädgårdsdekor: "Trädgårds|dekor",
  Terrassvärmare: "Terrass|värmare",
  Boxningssäckar: "Boxnings|säckar",
  Träningsbänkar: "Tränings|bänkar",
  Elbilsladdning: "Elbils|laddning",
  Verktygsvagnar: "Verktygs|vagnar",
  Badrumsspeglar: "Badrums|speglar",
  Projektordukar: "Projektor|dukar",
  Snurrfåtöljer: "Snurr|fåtöljer",
  verktygslådor: "verktygs|lådor",
  Kontorsstolar: "Kontors|stolar",
  Välbefinnande: "Väl|befinnande",
  Redskapsbodar: "Redskaps|bodar",
  Hörnskrivbord: "Hörn|skrivbord",
  Juldekoration: "Jul|dekoration",
  marsvinsburar: "marsvins|burar",
  Massagebänkar: "Massage|bänkar",
  Motionscyklar: "Motions|cyklar",
  Massagestolar: "Massage|stolar",
};

test("varje långt ord i menyn får sin fog vid den sista leden", () => {
  for (const [ord, vantat] of Object.entries(MENYNS_LANGA_ORD)) {
    assert.equal(mjukaBindestreck(ord), med(vantat), ord);
  }
});

test("hela namn: bara de långa orden ändras, mellanrum och & står kvar", () => {
  assert.equal(mjukaBindestreck("Trädgårdsanläggning & konstgräs"), med("Trädgårds|anläggning & konstgräs"));
  assert.equal(mjukaBindestreck("Mat & vattenskålar"), "Mat & vattenskålar");
  assert.equal(mjukaBindestreck("Kontorsstolar och Hörnskrivbord"), med("Kontors|stolar och Hörn|skrivbord"));
  assert.equal(mjukaBindestreck(""), "");
});

test("korta ord, ord utan känd efterled och för kort förled lämnas orörda", () => {
  // 12 tecken: får plats i spalten.
  assert.equal(mjukaBindestreck("Arbetskläder"), "Arbetskläder");
  // Ingen efterled i listan.
  assert.equal(mjukaBindestreck("Trädgårdsarbete"), "Trädgårdsarbete");
  // "organisering" passar, men förleden "Om" är kortare än tre tecken.
  assert.equal(mjukaBindestreck("Omorganisering"), "Omorganisering");
});

test("den längsta efterleden vinner: skrivbord före bord", () => {
  assert.ok(EFTERLEDER.includes("bord") && EFTERLEDER.includes("skrivbord"));
  assert.equal(mjukaBindestreck("Hörnskrivbord"), med("Hörn|skrivbord"));
  assert.equal(mjukaBindestreck("Avlastningsbord"), med("Avlastnings|bord"));
});

test("stora bokstäver, och två körningar ger samma sak som en", () => {
  assert.equal(mjukaBindestreck("VERKSTADSUTRUSTNING"), med("VERKSTADS|UTRUSTNING"));
  for (const ord of Object.keys(MENYNS_LANGA_ORD)) {
    const en = mjukaBindestreck(ord);
    assert.equal(mjukaBindestreck(en), en, ord);
  }
});

test("bindestrecket tar inget bort och sitter aldrig först, sist eller för nära kanten", () => {
  for (const ord of [...Object.keys(MENYNS_LANGA_ORD), "Omorganisering", "Trädgårdsarbete", "Tält"]) {
    const ut = mjukaBindestreck(ord);
    assert.equal(utan(ut), ord, ord);
    const delar = ut.split(MJUKT_BINDESTRECK);
    assert.ok(delar.length <= 2, `högst en fog: ${ord}`);
    if (delar.length === 2) {
      assert.ok(ord.length >= MINSTA_ORD, ord);
      assert.ok(delar[0].length >= MINSTA_FORLED, ord);
      assert.ok(EFTERLEDER.includes(delar[1].toLowerCase()), ord);
    }
  }
});

test("efterlederna är gemener, unika och minst fyra tecken", () => {
  assert.equal(new Set(EFTERLEDER).size, EFTERLEDER.length);
  for (const led of EFTERLEDER) {
    assert.equal(led, led.toLowerCase(), led);
    assert.ok(led.length >= 4, led);
  }
});

test("menyerna sätter fogen i den synliga texten men aldrig i aria-label", () => {
  const dator = readFileSync(new URL("../components/meganav.tsx", import.meta.url), "utf8");
  const mobil = readFileSync(new URL("../components/mobilenav.tsx", import.meta.url), "utf8");
  assert.match(dator, /<span className="meganav-sub-name">\s*\{mjukaBindestreck\(s\.name\)\}/);
  assert.match(mobil, /<span className="mm-sub-namn">\{mjukaBindestreck\(s\.name\)\}<\/span>/);
  assert.equal(mobil.match(/<span className="mm-avd-namn">\{mjukaBindestreck\(m\.name\)\}<\/span>/g)?.length, 2);
  for (const src of [dator, mobil]) {
    assert.doesNotMatch(src, /aria-label=\{[^}]*mjukaBindestreck/);
    assert.doesNotMatch(src, /href=\{[^}]*mjukaBindestreck/);
  }
});

test("modulen går till webbläsaren och har inga bakåtblickande uttryck", () => {
  const src = readFileSync(new URL("./mjukt-bindestreck.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /\(\?<[=!]/);
});

test("bindestrecket står som escape i koden, aldrig som ett osynligt tecken", () => {
  // Ett osynligt U+00AD i källkoden syns inte för den som läser och kan raderas
  // av misstag. Verktyg gör ibland om escape-sekvensen till själva tecknet.
  const src = readFileSync(new URL("./mjukt-bindestreck.ts", import.meta.url), "utf8");
  assert.equal(MJUKT_BINDESTRECK, String.fromCharCode(0xad));
  assert.ok(!src.includes(String.fromCharCode(0xad)), "osynligt mjukt bindestreck i lib/mjukt-bindestreck.ts");
  assert.ok(src.includes("\\u00AD"), "escape-sekvensen saknas");
  for (const fil of ["../components/meganav.tsx", "../components/mobilenav.tsx"]) {
    assert.ok(!readFileSync(new URL(fil, import.meta.url), "utf8").includes(String.fromCharCode(0xad)), fil);
  }
});
