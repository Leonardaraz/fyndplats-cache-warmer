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

// ── Kategoriblandning (2026-08-16) ─────────────────────────────────────────
// Leonard: "Nyast", "Rekommenderat" och "Populärast" visade samma lista.
// Uppmätt orsak: bara createdAt varierar (popularity 0 för 711 av 716,
// imageScore 60 för alla 716). Blandningen ger de två senare egen karaktär.
import { interleaveByGroup, groupKeyForMix } from "./sort-products.ts";

test("interleaveByGroup – turas om mellan grupper", () => {
  const items = [
    { g: "a", n: 1 }, { g: "a", n: 2 }, { g: "a", n: 3 },
    { g: "b", n: 4 }, { g: "b", n: 5 },
    { g: "c", n: 6 },
  ];
  assert.deepEqual(
    interleaveByGroup(items, (x) => x.g).map((x) => x.n),
    [1, 4, 6, 2, 5, 3],
  );
});

test("interleaveByGroup – tappar aldrig element", () => {
  const items = Array.from({ length: 97 }, (_, i) => ({ g: `g${i % 7}`, n: i }));
  const ut = interleaveByGroup(items, (x) => x.g);
  assert.equal(ut.length, 97);
  assert.deepEqual(new Set(ut.map((x) => x.n)).size, 97);
});

test("interleaveByGroup – behåller ordningen inom en grupp", () => {
  const items = [{ g: "a", n: 1 }, { g: "b", n: 9 }, { g: "a", n: 2 }, { g: "a", n: 3 }];
  const a = interleaveByGroup(items, (x) => x.g).filter((x) => x.g === "a").map((x) => x.n);
  assert.deepEqual(a, [1, 2, 3]);
});

test("interleaveByGroup – deterministisk och tål tom lista", () => {
  const items = [{ g: "b", n: 1 }, { g: "a", n: 2 }];
  assert.deepEqual(interleaveByGroup(items, (x) => x.g), interleaveByGroup(items, (x) => x.g));
  assert.deepEqual(interleaveByGroup([], () => "x"), []);
});

test("interleaveByGroup – en enda grupp lämnas orörd", () => {
  const items = [{ g: "a", n: 1 }, { g: "a", n: 2 }, { g: "a", n: 3 }];
  assert.deepEqual(interleaveByGroup(items, (x) => x.g).map((x) => x.n), [1, 2, 3]);
});

test("groupKeyForMix – hoppar över universella kategorier", () => {
  const uni = new Set(["ALL"]);
  assert.equal(groupKeyForMix({ id: "p1", collectionIds: ["ALL", "husdjur"] }, uni), "husdjur");
});

test("groupKeyForMix – produkt utan meningsfull kategori får en EGEN grupp", () => {
  const uni = new Set(["ALL"]);
  const a = groupKeyForMix({ id: "p1", collectionIds: ["ALL"] }, uni);
  const b = groupKeyForMix({ id: "p2", collectionIds: [] }, uni);
  assert.notEqual(a, b, "okategoriserade får inte klumpas ihop till en enda grupp");
});

test("interleaveByGroup – gruppvikt lyfter tunga grupper först", () => {
  const items = [
    { g: "tom", n: 1 }, { g: "tom", n: 2 },
    { g: "saljer", n: 3 }, { g: "saljer", n: 4 },
  ];
  const vikt = (g: string) => (g === "saljer" ? 5 : 0);
  assert.deepEqual(
    interleaveByGroup(items, (x) => x.g, vikt).map((x) => x.n),
    [3, 1, 4, 2],
    "gruppen med vikt ska öppna listan",
  );
});

test("interleaveByGroup – lika vikt behåller ursprunglig gruppordning", () => {
  const items = [{ g: "a", n: 1 }, { g: "b", n: 2 }, { g: "a", n: 3 }, { g: "b", n: 4 }];
  assert.deepEqual(
    interleaveByGroup(items, (x) => x.g, () => 0).map((x) => x.n),
    interleaveByGroup(items, (x) => x.g).map((x) => x.n),
  );
});

// Beviset som den lokala miljön inte kan ge: utan Wix-nyckel är popularity 0
// för allt, och då ÄR de två listorna identiska. Med verklig säljdata — fem
// produkter med en såld var, precis som i butiken — måste de skilja sig.
import { orderRecommended, orderPopular } from "./sort-products.ts";

function katalog() {
  const p: { id: string; createdAt: number; popularity: number; collectionIds: string[] }[] = [];
  const kategorier = ["kok", "husdjur", "tradgard", "verktyg"];
  for (let i = 0; i < 40; i++) {
    p.push({
      id: `p${i}`,
      createdAt: 1_000_000 - i,               // fallande = p0 nyast
      popularity: 0,
      collectionIds: ["ALL", kategorier[i % 4]],
    });
  }
  // Fem säljare, alla i "verktyg" — en kategori som annars ligger sist.
  for (const i of [7, 11, 15, 19, 23]) p[i].popularity = 1;
  return p;
}

test("orderPopular skiljer sig från orderRecommended när det FINNS försäljning", () => {
  const alla = katalog();
  const uni = new Set(["ALL"]);
  const rek = orderRecommended(alla, uni, 1_000_000).map((x) => x.id);
  const pop = orderPopular(alla, uni).map((x) => x.id);
  assert.notDeepEqual(rek, pop, "listorna måste skilja sig när säljdata finns");
  assert.equal(rek.length, pop.length);
  assert.equal(new Set(pop).size, alla.length, "ingen produkt får tappas");
});

test("orderPopular sätter faktiska säljare först", () => {
  const alla = katalog();
  const pop = orderPopular(alla, new Set(["ALL"]));
  const forst5 = pop.slice(0, 5).map((x) => x.id).sort();
  assert.deepEqual(forst5, ["p11", "p15", "p19", "p23", "p7"]);
});

test("orderPopular lyfter kategorier där det sålts före kategorier utan", () => {
  const alla = katalog();
  const pop = orderPopular(alla, new Set(["ALL"]));
  // Direkt efter de fem säljarna ska en verktygsprodukt komma — dess kategori
  // bär all försäljning och ska därför öppna blandningen.
  const efterSaljarna = pop[5];
  assert.equal(efterSaljarna.collectionIds[1], "verktyg");
});

test("utan försäljning ÄR listorna identiska — och det är korrekt", () => {
  const alla = katalog().map((p) => ({ ...p, popularity: 0 }));
  const uni = new Set(["ALL"]);
  assert.deepEqual(
    orderRecommended(alla, uni, 1_000_000).map((x) => x.id),
    orderPopular(alla, uni).map((x) => x.id),
    "utan data finns inget att skilja dem åt med",
  );
});
