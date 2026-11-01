// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Google-flödets kategorikarta (GOOGLE_CATEGORY_BY_SLUG i
// app/feed/google.xml/route.ts) för VEVOR-trädet 2026-10-31. Flödet tar
// produktens första underkategori, och en underkategori utan rad ärver sin
// avdelnings. Varje ny avdelning och underkategori har en egen rad, kontrollerad
// mot Googles taxonomifil (taxonomy-with-ids.en-US.txt) samma dag. Filen kan
// inte hämtas här, så provet vaktar att raderna finns, att nycklarna är
// butikens slugar och att varje rad bär taxonomins namn i en kommentar.
//
// Rutten går inte att köra i node --test, så provet läser källan, som
// lib/google-feed-variant.test.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asciiSlug } from "./category-slug.ts";

const kalla = readFileSync("app/feed/google.xml/route.ts", "utf8");
const block = kalla.slice(
  kalla.indexOf("const GOOGLE_CATEGORY_BY_SLUG"),
  kalla.indexOf("};", kalla.indexOf("const GOOGLE_CATEGORY_BY_SLUG")),
);
const rader = new Map<string, { id: number; kommentar: string }>();
for (const m of block.matchAll(/^\s*"?([a-z0-9-]+)"?: (\d+),[ \t]*(?:\/\/[ \t]*(.*))?$/gm)) {
  rader.set(m[1], { id: Number(m[2]), kommentar: (m[3] ?? "").trim() });
}

// Det godkända trädet: de nya avdelningarna och de 51 nya underkategorierna,
// som de heter i Wix. Bil & släp och Elbilsladdning & solenergi flyttade och
// har sina rader sedan förut.
const NYA_AVDELNINGAR = ["Verktyg & Maskiner", "Bil & Garage", "Bygg & Renovering", "Företag & Proffs"];
const NYA_UNDERKATEGORIER = [
  // Verktyg & Maskiner
  "Elverktyg", "Verkstadsmaskiner", "Svetsning", "Kompressorer & tryckluft", "Högtryckstvättar & rengöring",
  "Verktygstillbehör", "Handverktyg", "Lyft & transport", "Stegar & ställningar", "Arbetskläder & skydd",
  // Bil & Garage
  "Domkrafter & billyftar", "Verkstadsutrustning", "Bilverktyg", "Garageinredning", "Bildelar", "Biltillbehör",
  "Takräcken & lastbärare", "Vinschar", "Flakboxar & pickuptillbehör", "Husbil & husvagn",
  // Bygg & Renovering
  "VVS & vatten", "Pumpar", "El & installation", "Värme, ventilation & AC", "Badrumsrenovering",
  "Golv & golvverktyg", "Färg & tapet", "Dörrar & dörrbeslag", "Beslag & järnvaror", "Byggmaterial & byggverktyg",
  "Trall & räcken",
  // Företag & Proffs
  "Storkök & restaurang", "Butik, evenemang & trafik", "Vård & labb", "Salong & spa",
  // Trädgård & Utemöbler
  "Pool & spa", "Trädgårdsmaskiner", "Staket & grindar", "Trädgårdsanläggning & konstgräs",
  // Sport & Fritid
  "Hantverk & sömnad", "Camping & kylboxar", "Båt & vattensport", "Jakt & fiske",
  // Kök & Husgeråd
  "Glass-, is- & dessertmaskiner", "Matförvaring & köksorganisering", "Köttkvarnar & charkuteri",
  // Hem & Inredning
  "Hemelektronik & tillbehör", "Mattor", "Kassaskåp",
  // Möbler och Skönhet & Hälsa
  "Kontorstillbehör", "Hjälpmedel",
];

test("kartan gick att läsa", () => {
  assert.ok(rader.size > 100, `läste bara ${rader.size} rader`);
  assert.equal(rader.get("bil-slap")?.id, 5613);
});

test("trädet är 4 nya avdelningar och 51 nya underkategorier", () => {
  assert.equal(NYA_UNDERKATEGORIER.length, 51);
  assert.equal(new Set(NYA_UNDERKATEGORIER.map(asciiSlug)).size, 51);
});

test("varje ny avdelning och underkategori har ett Google-ID med taxonomins namn", () => {
  for (const namn of [...NYA_AVDELNINGAR, ...NYA_UNDERKATEGORIER]) {
    const slug = asciiSlug(namn);
    const rad = rader.get(slug);
    assert.ok(rad, `${namn} (${slug}) saknar Google-kategori`);
    assert.ok(Number.isInteger(rad.id) && rad.id > 0, `${slug}: ogiltigt ID`);
    // Kommentaren är taxonomins engelska namn, "samma nod" eller "… > nod".
    assert.match(rad.kommentar, /^(samma nod|(… > )?[A-Z][A-Za-z,&' ]+( > [A-Z][A-Za-z,&' ]+)*)/, `${slug}: kommentaren saknar taxonomins namn`);
  }
});

test("de flyttade underkategorierna behåller sina ID:n", () => {
  assert.equal(rader.get("bil-slap")?.id, 5613);                 // Vehicles & Parts > Vehicle Parts & Accessories
  assert.equal(rader.get("elbilsladdning-solenergi")?.id, 4714); // Hardware > Power & Electrical Supplies > Solar Panels
  assert.equal(rader.get("verktyg-maskiner")?.id, 632);          // Hardware, som avdelningen hade under sitt gamla namn
});
