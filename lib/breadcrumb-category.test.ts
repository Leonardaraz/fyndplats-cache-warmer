// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { huvudord, typord, valjBrodsmula, type BrodsmuleKategori } from "./breadcrumb-category.ts";
import { categoryIndexable, countPerCategoryPage } from "./category-threshold.ts";

const kat = (id: string, parentId: string | null = null): BrodsmuleKategori => ({ id, name: id, slug: id, parentId });

const hem = kat("hem-inredning");
const mobler = kat("mobler");
const fatoljer = kat("fatoljer", "mobler");
const snurr = kat("snurrfatoljer", "mobler");
const forvaring = kat("forvaring-organisering", "hem-inredning");
const byraer = kat("byraer", "mobler");
const tunn = kat("tunn-kategori", "mobler");
const alla = [hem, mobler, fatoljer, snurr, forvaring, byraer, tunn];

const antal = new Map([
  ["hem-inredning", 1739], ["mobler", 878], ["fatoljer", 264], ["snurrfatoljer", 18],
  ["forvaring-organisering", 390], ["byraer", 27], ["tunn-kategori", 3],
]);
const valj = (egna: BrodsmuleKategori[], n = antal) => valjBrodsmula(egna, alla, n, categoryIndexable);

test("den smalaste underkategorin vinner, och avdelningen är dess förälder", () => {
  // Snurrfåtöljer (18) och inte Fåtöljer (264): det är den smala sidan som
  // saknar länkar från sina egna produkter.
  const b = valj([mobler, fatoljer, snurr]);
  assert.equal(b.underkategori?.slug, "snurrfatoljer");
  assert.equal(b.avdelning?.slug, "mobler");
});

test("avdelningen följer underkategorin, inte ordningen i produktens kategorier", () => {
  // En byrå ligger i både Hem & Inredning (med Förvaring) och Möbler (med
  // Byråer). Kedjan ska hänga ihop: Möbler / Byråer, inte Hem & Inredning / Byråer.
  const b = valj([hem, forvaring, mobler, byraer]);
  assert.equal(b.underkategori?.slug, "byraer");
  assert.equal(b.avdelning?.slug, "mobler");
});

test("en tunn underkategori (1–4 produkter) hoppas över, eftersom sidan är noindex", () => {
  const b = valj([mobler, fatoljer, tunn]);
  assert.equal(b.underkategori?.slug, "fatoljer");
  assert.equal(valj([mobler, tunn]).underkategori, undefined);
  assert.equal(valj([mobler, tunn]).avdelning?.slug, "mobler");
});

test("lika många produkter avgörs på sluggen, så att valet är stabilt", () => {
  const n = new Map(antal);
  n.set("fatoljer", 18);
  assert.equal(valj([mobler, snurr, fatoljer], n).underkategori?.slug, "fatoljer");
  assert.equal(valj([mobler, fatoljer, snurr], n).underkategori?.slug, "fatoljer");
});

test("utan indexerbar underkategori gäller den gamla regeln", () => {
  assert.deepEqual(valj([hem, mobler]), { avdelning: hem });
  assert.deepEqual(valj([fatoljer], new Map()), { avdelning: fatoljer });
  assert.deepEqual(valj([]), { avdelning: undefined });
});

test("en underkategori vars förälder inte är en avdelning hoppas över", () => {
  const djup = kat("djup", "fatoljer");
  const foraldralos = kat("foraldralos", "finns-inte");
  const n = new Map(antal);
  n.set("djup", 12);
  n.set("foraldralos", 12);
  const b = valjBrodsmula([mobler, djup, foraldralos], [...alla, djup, foraldralos], n, categoryIndexable);
  assert.deepEqual(b, { avdelning: mobler });
});

test("produktens egen avdelning går först (ChatGPT:s audit 2026-11-03)", () => {
  // Uppresningsfåtöljen låg i Möbler, Fåtöljer och Massage & Återhämtning, men
  // inte i avdelningen Skönhet & Hälsa. Massage & Återhämtning (74) är smalare
  // än Fåtöljer (264), så den gamla regeln gav Skönhet & Hälsa / Massage.
  const skonhet = kat("skonhet-halsa");
  const massage = kat("massage-aterhamtning", "skonhet-halsa");
  const uppres = kat("uppresningsfatoljer", "mobler");
  const trad = [...alla, skonhet, massage, uppres];
  const n = new Map([...antal, ["skonhet-halsa", 900], ["massage-aterhamtning", 74], ["uppresningsfatoljer", 34]]);
  const v = (egna: BrodsmuleKategori[]) => valjBrodsmula(egna, trad, n, categoryIndexable);

  const fore = v([mobler, fatoljer, massage]);
  assert.equal(fore.avdelning?.slug, "mobler");
  assert.equal(fore.underkategori?.slug, "fatoljer");

  // Med Uppresningsfåtöljer kopplad (2026-11-04) är den den smalaste i Möbler.
  const efter = v([mobler, fatoljer, massage, uppres]);
  assert.equal(efter.avdelning?.slug, "mobler");
  assert.equal(efter.underkategori?.slug, "uppresningsfatoljer");

  // Ligger produkten i båda avdelningarna vinner den smalaste av dem.
  assert.equal(v([mobler, fatoljer, skonhet, massage]).underkategori?.slug, "massage-aterhamtning");

  // Utan någon egen avdelning gäller regeln från 2026-09-24.
  assert.equal(v([fatoljer, massage]).underkategori?.slug, "massage-aterhamtning");
});

// PRODUKTTYPENS KATEGORI FÖRST (Leonard 2026-11-05). Fallen är kategorikollens
// största grupper. Motorns kopia (lib/kategorikoll/brodsmula.test.ts) har samma fall.
const namngiven = (id: string, name: string, parentId: string | null = null): BrodsmuleKategori => ({
  id,
  name,
  slug: id,
  parentId,
});
const hemN = namngiven("hem-inredning", "Hem & Inredning");
const moblerN = namngiven("mobler", "Möbler");
const forvaringN = namngiven("forvaring-organisering", "Förvaring & Organisering", "hem-inredning");
const skoskap = namngiven("skoskap-skobankar", "Skoskåp & skobänkar", "mobler");
const fatoljerN = namngiven("fatoljer", "Fåtöljer", "mobler");
const uppresN = namngiven("uppresningsfatoljer", "Uppresningsfåtöljer", "mobler");
const skonhetN = namngiven("skonhet-halsa", "Skönhet & Hälsa");
const massageN = namngiven("massage-aterhamtning", "Massage & Återhämtning", "skonhet-halsa");
const julN = namngiven("jul-hogtider", "Jul & Högtider");
const julgranar = namngiven("julgranar", "Julgranar", "jul-hogtider");
const dekoration = namngiven("dekoration-prydnad", "Dekoration & Prydnad", "hem-inredning");
const tradN = [hemN, moblerN, forvaringN, skoskap, fatoljerN, uppresN, skonhetN, massageN, julN, julgranar, dekoration];
const antalN = new Map([
  ["hem-inredning", 1739], ["mobler", 878], ["forvaring-organisering", 390], ["skoskap-skobankar", 41],
  ["fatoljer", 264], ["uppresningsfatoljer", 34], ["skonhet-halsa", 900], ["massage-aterhamtning", 74],
  ["jul-hogtider", 300], ["julgranar", 60], ["dekoration-prydnad", 45],
]);
const valjN = (egna: BrodsmuleKategori[], namn?: string, n = antalN) =>
  valjBrodsmula(egna, tradN, n, categoryIndexable, namn);

test("skoskåpet behåller sin typkategori fast det bara är kopplat till avdelningen Hem & Inredning", () => {
  // Kollen 2026-11-05: 27 skoskåp hade gått till Förvaring & Organisering med regeln från 2026-11-04.
  const egna = [hemN, forvaringN, skoskap];
  const b = valjN(egna, "Skoskåp med tre fack och sittdyna");
  assert.equal(b.underkategori?.id, "skoskap-skobankar");
  assert.equal(b.avdelning?.id, "mobler");
  // Utan namn gäller egen avdelning först, som förut.
  assert.equal(valjN(egna).underkategori?.id, "forvaring-organisering");
});

test("uppresningsfåtöljen går till Uppresningsfåtöljer, inte till Massage & Återhämtning", () => {
  const egna = [moblerN, fatoljerN, massageN, uppresN];
  const b = valjN(egna, "Elektrisk uppresningsfåtölj med liggfunktion – chenille");
  assert.equal(b.underkategori?.id, "uppresningsfatoljer");
  // Utan typord i namnet: egen avdelning först (Möbler), den smalaste där.
  assert.equal(valjN([moblerN, fatoljerN, massageN], "Massagestol med värme").underkategori?.id, "fatoljer");
});

test("julgranen stannar i Julgranar fast den är kopplad till avdelningen Hem & Inredning", () => {
  const b = valjN([hemN, dekoration, julgranar], "Konstgjord julgran 150 cm med 1724 grenspetsar");
  assert.equal(b.underkategori?.id, "julgranar");
  assert.equal(b.avdelning?.id, "jul-hogtider");
});

test("ett ord efter med, för eller tankstreck räknas inte, och en tunn typkategori hoppas över", () => {
  const egna = [hemN, forvaringN, skoskap];
  assert.equal(valjN(egna, "Bänk med skoskåp").underkategori?.id, "forvaring-organisering");
  assert.equal(valjN(egna, "Hallmöbel – skoskåp och krokar").underkategori?.id, "forvaring-organisering");
  const tunn = new Map(antalN);
  tunn.set("skoskap-skobankar", 3);
  assert.equal(valjN(egna, "Skoskåp med tre fack", tunn).underkategori?.id, "forvaring-organisering");
});

test("bara produktens egna kategorier kan bli typkategori", () => {
  // Ett skoskåp som inte är kopplat till Skoskåp & skobänkar får inte den brödsmulan.
  assert.equal(valjN([hemN, forvaringN], "Skoskåp med tre fack").underkategori?.id, "forvaring-organisering");
});

test("typord och huvudord", () => {
  for (const f of ["skoskåp", "skobänkar", "skobänk"]) assert.ok(typord("Skoskåp & skobänkar").includes(f), f);
  assert.ok(typord("TV-bänkar").includes("bänk"));
  assert.ok(!typord("TV-bänkar").includes("tv"));
  assert.ok(typord("Sideboards & vitrinskåp").includes("sideboard"));
  assert.ok(typord("Soptunnor").includes("soptunna"));
  assert.ok(typord("Byråer").includes("byrå"));
  assert.ok(typord("Julgranar").includes("julgran"));
  assert.deepEqual([...huvudord("Elektrisk uppresningsfåtölj med liggfunktion – chenille")], ["elektrisk", "uppresningsfåtölj"]);
  assert.deepEqual([...huvudord("TV-bänk i ek")], ["tv", "bänk"]);
});

test("countPerCategoryPage räknar varje produkt en gång per kategori", () => {
  const n = countPerCategoryPage([{ collectionIds: ["a", "b"] }, { collectionIds: ["a"] }, {}], []);
  assert.equal(n.get("a"), 2);
  assert.equal(n.get("b"), 1);
  assert.equal(n.size, 2);
});

test("produktsidan, kategorisidan och sitemapen räknar på samma sätt", () => {
  // Brödsmulan får bara länka till en sida som indexeras, och det avgör
  // sitemapens räkning. Två egna räkneloopar hade kunnat glida isär.
  // Kategorisidans robots-tagg räknade själv, bara på produkter direkt i
  // kategorin, och gav Verktyg & Fordon (i dag Verktyg & Maskiner) noindex
  // (uppmätt 2026-10-11).
  const sida = readFileSync("app/produkt/[slug]/page.tsx", "utf8");
  assert.match(sida, /const antalPerSida = countPerCategoryPage\(forListings\(all\), cols\);/);
  assert.match(sida, /valjBrodsmula\(ownCats, navCols, antalPerSida, categoryIndexable, p\.name\)/);
  // Bläddringsraden räknar med samma antal och samma regel (2026-11-04).
  assert.match(sida, /valjBrodsmula\(egna, navCols, antalPerSida, categoryIndexable, q\.name\)/);
  assert.match(sida, /produktGrannar\(navCols, ownCats, all, p\.slug, dedupeProducts, hemvistFor\)/);
  const karta = readFileSync("lib/site-urls.ts", "utf8");
  assert.match(karta, /countPerCategoryPage\(forListings\(await getProducts\(\)\), collections\)/);
  assert.doesNotMatch(karta, /catCounts\.set\(/, "sitemapen ska inte räkna i en egen loop");
  const kategori = readFileSync("app/kategori/[slug]/page.tsx", "utf8");
  assert.match(kategori, /countPerCategoryPage\(forListings\(products\), cols\)\.get\(c\.id\)/);
});
