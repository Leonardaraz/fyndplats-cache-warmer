// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Filterpanelens sammanfattning räknas på servern (lib/list-overview.ts) med
// samma funktioner som ShopBrowser använder på sökresultaten. Delarna testas
// här; list-overview själv importerar dem och går inte att köra i node --test.
import test from "node:test";
import assert from "node:assert/strict";
import { priceBounds, prisHistogram } from "./price-range.ts";
import { fargNycklar } from "./variant-color-image.ts";

const priser = [149, 199, 249, 299, 349, 399, 499, 599, 799, 999, 1299, 1999, 2999, 4999, 9999, 24999];
const items = priser.map((priceNum) => ({ priceNum }));

test("histogrammet: 46 fack, alla produkter räknade, sista facket märkt vid öppet tak", () => {
  const b = priceBounds(items);
  assert.ok(b);
  const h = prisHistogram(items, b);
  assert.equal(h.length, 46);
  for (const s of h) assert.ok(s.h >= 4 && s.h <= 68, `höjd ${s.h}`);
  assert.equal(h.filter((s) => s.over).length, b.openTop ? 1 : 0);
  if (b.openTop) assert.ok(h[45].over);
  // Mittpunkterna stiger jämnt över skalan.
  assert.ok(h[0].mid > b.min && h[45].mid < b.max);
});

test("histogrammet är oberoende av ordningen (server och klient får samma staplar)", () => {
  const b = priceBounds(items);
  assert.deepEqual(prisHistogram([...items].reverse(), b), prisHistogram(items, b));
});

test("inget reglage, inga staplar", () => {
  assert.deepEqual(prisHistogram(items, null), []);
});

test("färgnycklar: minst två distinkta, annars ingen skena", () => {
  assert.deepEqual(fargNycklar([{ colors: ["svart"] }, { colors: ["svart"] }, {}]), []);
  const k = fargNycklar([{ colors: ["vit", "svart"] }, { colors: ["svart"] }]);
  assert.deepEqual([...k].sort(), ["svart", "vit"]);
});
