// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { valjBrodsmula, type BrodsmuleKategori } from "./breadcrumb-category.ts";
import { categoryIndexable, countPerCategory } from "./category-threshold.ts";

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

test("countPerCategory räknar varje produkt en gång per kategori", () => {
  const n = countPerCategory([{ collectionIds: ["a", "b"] }, { collectionIds: ["a"] }, {}]);
  assert.equal(n.get("a"), 2);
  assert.equal(n.get("b"), 1);
  assert.equal(n.size, 2);
});

test("produktsidan och sitemapen räknar på samma sätt", () => {
  // Brödsmulan får bara länka till en sida som indexeras, och det avgör
  // sitemapens räkning. Två egna räkneloopar hade kunnat glida isär.
  const sida = readFileSync("app/produkt/[slug]/page.tsx", "utf8");
  assert.match(sida, /valjBrodsmula\(ownCats, navCols, countPerCategory\(forListings\(all\)\), categoryIndexable\)/);
  const karta = readFileSync("lib/site-urls.ts", "utf8");
  assert.match(karta, /countPerCategory\(forListings\(await getProducts\(\)\)\)/);
  assert.doesNotMatch(karta, /catCounts\.set\(/, "sitemapen ska inte räkna i en egen loop");
});
