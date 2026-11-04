// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { valjBrodsmula, type BrodsmuleKategori } from "./breadcrumb-category.ts";
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
  assert.match(sida, /valjBrodsmula\(ownCats, navCols, antalPerSida, categoryIndexable\)/);
  // Bläddringsraden räknar med samma antal och samma regel (2026-11-04).
  assert.match(sida, /valjBrodsmula\(egna, navCols, antalPerSida, categoryIndexable\)/);
  assert.match(sida, /produktGrannar\(navCols, ownCats, all, p\.slug, dedupeProducts, hemvistFor\)/);
  const karta = readFileSync("lib/site-urls.ts", "utf8");
  assert.match(karta, /countPerCategoryPage\(forListings\(await getProducts\(\)\), collections\)/);
  assert.doesNotMatch(karta, /catCounts\.set\(/, "sitemapen ska inte räkna i en egen loop");
  const kategori = readFileSync("app/kategori/[slug]/page.tsx", "utf8");
  assert.match(kategori, /countPerCategoryPage\(forListings\(products\), cols\)\.get\(c\.id\)/);
});
