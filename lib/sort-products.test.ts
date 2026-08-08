// Sorteringsdesignen (Leonard 2026-08-08: tre sorteringsval gav samma ordning).
import test from "node:test";
import assert from "node:assert/strict";
import { compareByPopularity, compareByRecommended, createdAtMs, recommendedScore } from "./sort-products.ts";
import { aggregateSoldUnits } from "./popularity.ts";

const NOW = Date.UTC(2026, 7, 8); // fast "idag" — testerna är deterministiska
const DAY = 86_400_000;
// createdAt i µs precis som Wix numericId (lib/products härleder den så).
const prod = (id: string, daysOld: number, popularity: number, onSale = false) => ({
  id,
  createdAt: (NOW - daysOld * DAY) * 1000,
  popularity,
  onSale,
});

test("createdAtMs normaliserar µs (Wix numericId) och lämnar ms orörda", () => {
  assert.equal(createdAtMs({ createdAt: NOW * 1000 }), NOW); // µs → ms
  assert.equal(createdAtMs({ createdAt: NOW }), NOW); // redan ms
  assert.equal(createdAtMs({}), 0);
});

test("Populärast: sålda enheter fallande, nollsäljare ordnas som nyast", () => {
  const list = [prod("gammal-storsäljare", 200, 12), prod("ny-nollare", 1, 0), prod("gammal-nollare", 300, 0), prod("mellansäljare", 50, 3)];
  const sorted = [...list].sort(compareByPopularity).map((p) => p.id);
  assert.deepEqual(sorted, ["gammal-storsäljare", "mellansäljare", "ny-nollare", "gammal-nollare"]);
});

test("Rekommenderat: bästsäljare toppar, men färska nyheter slår gamla nollsäljare", () => {
  const list = [prod("gammal-nollare", 120, 0), prod("nyhet-idag", 0, 0), prod("bästsäljare", 90, 10)];
  const sorted = [...list].sort(compareByRecommended(NOW)).map((p) => p.id);
  // 10 sålda (≈7.2p) > färsk nyhet (2p) > gammal nollare (≈0p)
  assert.deepEqual(sorted, ["bästsäljare", "nyhet-idag", "gammal-nollare"]);
});

test("Rekommenderat: färskhets-skjutsen klingar av och REA ger bara en knuff", () => {
  // Nyhet (0 sålda, idag) slår en månadsgammal en-säljare knappt inte —
  // 1 såld ≈ 2.08p > 2.0p färsk. Försäljning ska vinna över ren färskhet.
  assert.ok(recommendedScore(prod("en-såld", 30, 1), NOW) > recommendedScore(prod("nyhet", 0, 0), NOW));
  // REA bryter lika mellan två annars identiska produkter…
  assert.ok(recommendedScore(prod("rea", 60, 2, true), NOW) > recommendedScore(prod("ej-rea", 60, 2), NOW));
  // …men slår ALDRIG en riktig försäljningsskillnad.
  assert.ok(recommendedScore(prod("säljer-mer", 60, 4), NOW) > recommendedScore(prod("rea-lite", 60, 2, true), NOW));
});

test("stabil ordning: identiska poäng bryts deterministiskt (aldrig hopp mellan renderingar)", () => {
  const a = prod("a", 10, 0);
  const b = { ...prod("b", 10, 0), createdAt: a.createdAt };
  const s1 = [a, b].sort(compareByRecommended(NOW)).map((p) => p.id);
  const s2 = [b, a].sort(compareByRecommended(NOW)).map((p) => p.id);
  assert.deepEqual(s1, s2);
});

test("aggregateSoldUnits: summerar per catalogItemId, hoppar annullerade och katalog-lösa rader", () => {
  const sold = aggregateSoldUnits([
    { lineItems: [{ quantity: 2, catalogReference: { catalogItemId: "p1" } }] },
    { lineItems: [{ quantity: 1, catalogReference: { catalogItemId: "p1" } }, { quantity: 3, catalogReference: { catalogItemId: "p2" } }] },
    { status: "CANCELED", lineItems: [{ quantity: 9, catalogReference: { catalogItemId: "p1" } }] },
    { lineItems: [{ quantity: 5 }] }, // ingen katalogkoppling → hoppa
    { lineItems: [{ catalogReference: { catalogItemId: "p3" } }] }, // qty saknas → 1
  ]);
  assert.equal(sold.get("p1"), 3);
  assert.equal(sold.get("p2"), 3);
  assert.equal(sold.get("p3"), 1);
});
