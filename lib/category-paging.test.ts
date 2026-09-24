// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hamtaAllaKategorier, KATEGORI_SIDTAK, type Kategorisida } from "./category-paging.ts";

// Bygger en kedja av sidor som SDK:ts CursorBasedIterator: items, hasNext(), next().
function kedja(storlekar: number[]): () => Promise<Kategorisida<number>> {
  let n = 0;
  const sida = (i: number): Kategorisida<number> => {
    const items = Array.from({ length: storlekar[i] }, () => n++);
    return {
      items,
      hasNext: () => i + 1 < storlekar.length,
      next: async () => sida(i + 1),
    };
  };
  return async () => sida(0);
}

test("alla sidor hämtas, inte bara de första hundra", async () => {
  // 2026-09-24: 109 kategorier. Med bara första sidan föll nio bort, och
  // Golvlampor gav 404 i produktion.
  const alla = await hamtaAllaKategorier(kedja([100, 9]));
  assert.equal(alla.length, 109);
  assert.deepEqual(alla.slice(98, 102), [98, 99, 100, 101]);
});

test("tre sidor i ordning", async () => {
  const alla = await hamtaAllaKategorier(kedja([100, 100, 9]));
  assert.equal(alla.length, 209);
  assert.equal(alla[208], 208);
});

test("en enda sida räcker när det inte finns fler", async () => {
  assert.equal((await hamtaAllaKategorier(kedja([57]))).length, 57);
});

test("taket KASTAR i stället för att kapa listan", async () => {
  // En avkortad lista ser frisk ut och ger ändå 404 på riktiga kategorisidor.
  await assert.rejects(hamtaAllaKategorier(kedja([100, 100, 100, 100]), 3), /avbryter hellre än kapar/);
  assert.ok(KATEGORI_SIDTAK >= 10);
});

test("butiken bygger kategorifrågan på ETT ställe, och båda läsarna går igenom pagineringen", () => {
  // Menyn (fetchCollections) och listan över kända slugar (fetchAllCategorySlugs)
  // läste var sin första sida. En direkt .find() i någon av dem återinför felet.
  const t = readFileSync("lib/products.ts", "utf8");
  assert.equal((t.match(/queryCategories\(/g) || []).length, 1, "queryCategories( ska bara finnas i forstaKategorisidan");
  assert.equal((t.match(/hamtaAllaKategorier<any>\(forstaKategorisidan\)/g) || []).length, 2,
    "både fetchCollections och fetchAllCategorySlugs ska hämta alla sidor");
});
