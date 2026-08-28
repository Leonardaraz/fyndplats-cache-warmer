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

// Varför app/alla-produkter skickar sitt dagMs vidare till ShopBrowser
// (components/shopbrowser.tsx): sidan är ISR-cachad, så dess HTML kan bära
// gårdagens dag i upp till en timme efter midnatt. Räknar klienten ut sin EGEN
// dag sorteras rutnätet om vid hydrering.
//
// Ordningen är dagskänslig av en icke-uppenbar anledning: färskhets-poängen
// (2·e^(−ålder/14)) krymper med tiden medan REA- och omdömespoängen står stilla,
// så deras inbördes förhållande skiftar. Varierar BARA åldern händer ingenting —
// alla produkter åldras lika mycket. Testet pinnar båda halvorna, så en framtida
// omskrivning av recommendedScore inte tyst gör propen onödig eller nödvändig
// utan att någon märker det.
test("Rekommenderat är dagskänsligt när REA möter färskhet — men inte av ålder ensam", () => {
  const bara_alder = [prod("a", 1, 0), prod("b", 20, 0), prod("c", 60, 0)];
  const idag = [...bara_alder].sort(compareByRecommended(NOW)).map((p) => p.id);
  const imorgon = [...bara_alder].sort(compareByRecommended(NOW + DAY)).map((p) => p.id);
  assert.deepEqual(idag, imorgon, "bara ålder varierar → ordningen står still");

  // Färsk utan rea vs något äldre MED rea: rea-knuffen (0,4p) är konstant medan
  // färskhets-försprånget klingar av, så paret byter plats när dagen går.
  const rea = [prod("fersk-utan-rea", 8, 0, false), prod("aldre-med-rea", 20, 0, true)];
  const f0 = recommendedScore(rea[0]!, NOW) - recommendedScore(rea[1]!, NOW);
  const f1 = recommendedScore(rea[0]!, NOW + 30 * DAY) - recommendedScore(rea[1]!, NOW + 30 * DAY);
  assert.ok(f0 > 0, "idag leder den färska");
  assert.ok(f1 < 0, "senare leder rea-produkten — försprånget har klingat av");
  assert.ok(Math.abs(f1) < Math.abs(f0) || f1 < 0, "avståndet krymper över tid");
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

test("utan försäljning OCH utan omdömen är listorna identiska — och det är korrekt", () => {
  const alla = katalog().map((p) => ({ ...p, popularity: 0 }));
  const uni = new Set(["ALL"]);
  assert.deepEqual(
    orderRecommended(alla, uni, 1_000_000).map((x) => x.id),
    orderPopular(alla, uni).map((x) => x.id),
    "utan data finns inget att skilja dem åt med",
  );
});

// ── Omdömessignalen (Leonard 2026-08-18: "de med flest recensioner och bäst
// betyg är blandat i rekommenderat och populärast") ────────────────────────
//
// Kåren är censurerad (minst 3★ importeras, 87 % femmor, katalogsnitt 4,8) så
// RÅTT snitt rankar brus. Antalet bär bevisvärdet; snittet räknas bara som
// krympt avvikelse från katalogsnittet. Vikterna nedan är designbeslut och
// låses här — ändra dem medvetet eller inte alls.
import { reviewSignal, popularScore } from "./sort-products.ts";

const medOmdomen = (id: string, daysOld: number, popularity: number, count: number, exact = 4.8) => ({
  ...prod(id, daysOld, popularity),
  rating: { count, exact, stars: Math.round(exact), value: "x" },
});

test("reviewSignal: 0 utan omdömen, växer med antalet, aldrig av snittet ensamt", () => {
  assert.equal(reviewSignal(prod("utan", 10, 0)), 0);
  assert.ok(reviewSignal(medOmdomen("fa", 10, 0, 3)) < reviewSignal(medOmdomen("manga", 10, 0, 15)));
  // Många lite-sämre omdömen slår få perfekta: 15×4,0 ska vinna över 2×5,0 —
  // antalet är bevis, snittet i en censurerad kår är det inte.
  assert.ok(reviewSignal(medOmdomen("manga-40", 10, 0, 15, 4.0)) > reviewSignal(medOmdomen("fa-50", 10, 0, 2, 5.0)));
});

test("reviewSignal: belagd avvikelse nedåt sänker, krympningen dämpar små underlag", () => {
  const bra = reviewSignal(medOmdomen("bra", 10, 0, 15, 4.8));
  const samre = reviewSignal(medOmdomen("samre", 10, 0, 15, 4.0));
  assert.ok(samre < bra, "15 st 4,0:or ska ligga under 15 st katalogsnitt");
  // Samma avvikelse på 2 omdömen ska straffas MINDRE än på 15 (krympningen).
  const straff15 = bra - samre;
  const straff2 = reviewSignal(medOmdomen("b2", 10, 0, 2, 4.8)) - reviewSignal(medOmdomen("s2", 10, 0, 2, 4.0));
  assert.ok(straff2 < straff15, "litet underlag → mindre utslag");
});

test("Populärast: egna sälj väger tyngst men omdömen är ombudet", () => {
  // 2 egna sålda (≈3.3p) slår 15 omdömen (≈2.8p) — riktiga kundordrar vinner.
  assert.ok(popularScore(prod("tva-salda", 10, 2)) > popularScore(medOmdomen("omdomesrik", 10, 0, 15)));
  // MEN 15 belagda köp hos leverantören slår 1 egen såld enhet (≈2.1p) —
  // medvetet: ett ensamt sälj på 90 dagar är svagare bevis än 15 omdömen.
  assert.ok(popularScore(medOmdomen("omdomesrik", 10, 0, 15)) > popularScore(prod("en-sald", 10, 1)));
});

test("orderPopular: omdömesrik nollsäljare går i signal-skiktet, före blandningen", () => {
  const alla = katalog();
  // p26 (kategori "tradgard", inga sälj) får 12 omdömen.
  const medRating = alla.map((p) => (p.id === "p26" ? { ...p, rating: { count: 12, exact: 4.9 } } : p));
  const pop = orderPopular(medRating, new Set(["ALL"])).map((x) => x.id);
  // Signal-skiktet: fem säljare (2.08p) + p26 (log1p(12)≈2.56p) — p26 FÖRST.
  assert.deepEqual(pop.slice(0, 6).sort(), ["p11", "p15", "p19", "p23", "p26", "p7"].sort());
  assert.equal(pop[0], "p26");
});

test("Rekommenderat: belagt socialt bevis slår ren färskhet — men inte en bästsäljare", () => {
  // Gammal produkt med 15 omdömen (≈3.3p) > dagsfärsk utan (2p).
  assert.ok(
    recommendedScore(medOmdomen("omdomesrik-gammal", 90, 0, 15), NOW) > recommendedScore(prod("nyhet-idag", 0, 0), NOW),
  );
  // 5 egna sålda (≈5.4p) > 15 omdömen (≈3.3p): egen kassa vinner.
  assert.ok(
    recommendedScore(prod("bastsaljare", 90, 5), NOW) > recommendedScore(medOmdomen("omdomesrik-gammal", 90, 0, 15), NOW),
  );
});
