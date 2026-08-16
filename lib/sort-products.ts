// lib/sort-products.ts — sorteringsordningar för produktlistningarna.
//
// Designen (Leonard 2026-08-08: "det borde vara mer genomtänkt"):
//   • Nyast       = importdatum, fallande. Rakt av.
//   • Populärast  = sålda enheter (90 d, riktiga Wix-ordrar) fallande;
//                   lika många sålda → nyast först (nollsäljare ordnas alltså
//                   som "Nyast" — vettigt för en ung butik där de flesta
//                   produkter ännu inte hunnit sälja).
//   • Rekommenderat = butikens egen mix: bästsäljare väger tyngst
//                   (logaritmiskt — 10 sålda ska inte krossa allt annat),
//                   nyheter får en färskhets-skjuts som klingar av på ett par
//                   veckor (nya produkter måste synas för att kunna BLI
//                   populära), och REA-produkter en liten knuff. Determinis-
//                   tiskt och förklarbart — ingen magi.
//
// Rena komparatorer (enhetstestbara). Datumen kan komma som mikro- eller
// millisekunder (createdAt härleds ur Wix numericId = µs) → normalisera.

export interface SortableProduct {
  id?: string;
  createdAt?: number;
  popularity?: number;
  onSale?: boolean;
}

/** createdAt kan vara µs (Wix numericId) eller ms — normalisera till ms. */
export function createdAtMs(p: SortableProduct): number {
  const v = p.createdAt || 0;
  return v > 1e14 ? v / 1000 : v;
}

/** Stabil sista-instans-ordning så listan aldrig hoppar mellan renderingar. */
function tieBreak(a: SortableProduct, z: SortableProduct): number {
  return (z.createdAt || 0) - (a.createdAt || 0) || String(a.id ?? "").localeCompare(String(z.id ?? ""));
}

/** Populärast: sålda enheter fallande, sedan nyast. */
export function compareByPopularity(a: SortableProduct, z: SortableProduct): number {
  return (z.popularity ?? 0) - (a.popularity ?? 0) || tieBreak(a, z);
}

/**
 * Rekommenderat-poängen. `nowMs` skickas in (dag-upplösning i UI:t så server-
 * och klientrendering ger samma ordning — annars hydration-hopp vid midnatt).
 */
export function recommendedScore(p: SortableProduct, nowMs: number): number {
  const sold = Math.max(0, p.popularity ?? 0);
  const ageDays = Math.max(0, (nowMs - createdAtMs(p)) / 86_400_000);
  // log1p: 1 såld ≈ 2.1p, 5 ≈ 5.4p, 20 ≈ 9.1p — bästsäljare toppar utan att
  // en enda storsäljare låser listan för alltid.
  const popScore = 3 * Math.log1p(sold);
  // Färskhets-skjuts: 2p dag 0, ~1p efter 10 dagar, ~0 efter en månad.
  const newnessScore = 2 * Math.exp(-ageDays / 14);
  const saleScore = p.onSale ? 0.4 : 0;
  return popScore + newnessScore + saleScore;
}

/** Rekommenderat: poäng fallande, sedan stabil tie-break. */
export function compareByRecommended(nowMs: number) {
  return (a: SortableProduct, z: SortableProduct): number =>
    recommendedScore(z, nowMs) - recommendedScore(a, nowMs) || tieBreak(a, z);
}

// ── Kategoriblandning (Leonards begäran 2026-08-16) ────────────────────────
//
// Mätt samma dag: av signalerna som ska skilja sorteringarna åt har bara
// createdAt verklig variation. popularity är 0 för 711 av 716 produkter (18
// sålda enheter på 90 dagar, och 13 av dem ligger på produkter som inte finns
// kvar i katalogen), och imageScore är default 60 för SAMTLIGA 716 — ingen
// produkt har någonsin bildpoängsatts.
//
// Följden: "Populärast" lade fem produkter först och sorterade resten på
// createdAt, och "Rekommenderat" domineras av färskhets-poängen som också är
// en funktion av createdAt. Båda blev alltså "Nyast" med en annan etikett.
//
// Tills det finns försäljning att sortera på blandar vi i stället kategorier.
// Det gör första skärmen bredare — trädgård, husdjur, kök, verktyg i stället
// för tolv varor ur samma importbatch — vilket är genuint mer användbart för
// en besökare som inte vet vad hen letar efter. Deterministiskt och
// förklarbart, samma princip som resten av filen.

/**
 * Turas om mellan grupper och behåller ordningen INOM varje grupp.
 *
 * Gruppordningen bestäms av var gruppen först dyker upp i indata, så resultatet
 * är helt deterministiskt: samma indata ger alltid samma utdata, och server-
 * och klientrendering kan aldrig gå isär.
 *
 * Alla element kommer med — blandningen ändrar ordning, aldrig innehåll.
 */
export function interleaveByGroup<T>(
  items: readonly T[],
  groupOf: (item: T) => string,
  /** Valfri gruppvikt: högre vikt turas om FÖRST. Utan den används den ordning
   *  grupperna först dyker upp i indata. Används av "Populärast" för att lyfta
   *  kategorier där det faktiskt har sålts — fem produktsälj räcker inte för
   *  att ranka 716 produkter, men de räcker för att ranka kategorier. */
  groupWeight?: (group: string, members: readonly T[]) => number,
): T[] {
  const buckets = new Map<string, T[]>();
  for (const it of items) {
    const k = groupOf(it);
    const b = buckets.get(k);
    if (b) b.push(it);
    else buckets.set(k, [it]);
  }
  let entries = [...buckets.entries()];
  if (groupWeight) {
    // Stabil: lika vikt behåller ursprunglig gruppordning.
    const vikt = new Map(entries.map(([k, v]) => [k, groupWeight(k, v)]));
    entries = entries
      .map((e, i) => ({ e, i }))
      .sort((a, b) => (vikt.get(b.e[0]) ?? 0) - (vikt.get(a.e[0]) ?? 0) || a.i - b.i)
      .map((x) => x.e);
  }
  const queues = entries.map(([, v]) => v);
  const out: T[] = [];
  let kvar = items.length;
  let i = 0;
  while (kvar > 0) {
    const q = queues[i % queues.length];
    if (q.length) { out.push(q.shift() as T); kvar--; }
    i++;
    // När bara tomma köer återstår i varvet skulle loopen snurra vidare i
    // onödan; kvar-räknaren garanterar terminering men vi hoppar ändå över
    // tomma köer genom att filtrera bort dem varje helt varv.
    if (i % queues.length === 0) {
      for (let j = queues.length - 1; j >= 0; j--) if (!queues[j].length) queues.splice(j, 1);
      if (!queues.length) break;
      i = 0;
    }
  }
  return out;
}

/**
 * Gruppnyckel för blandningen: produktens första MENINGSFULLA kategori.
 *
 * `universal` är kategorier som ligger på nästan hela katalogen ("All
 * Products") — de bär ingen särskiljande information och duger inte som
 * grupp. Saknar produkten meningsfull kategori får den en egen grupp via
 * sitt id, så den varken klumpas ihop med andra eller försvinner.
 */
export function groupKeyForMix(
  p: { id?: string; collectionIds?: string[] },
  universal: ReadonlySet<string>,
): string {
  for (const c of p.collectionIds ?? []) if (!universal.has(c)) return c;
  return `__egen:${p.id ?? ""}`;
}

/** Produkt-form som de två blandade ordningarna behöver. */
export interface MixableProduct extends SortableProduct {
  collectionIds?: string[];
}

/**
 * "Rekommenderat": poängen ordnar INOM varje kategori, blandningen avgör
 * vilken kategori som kommer härnäst. Grupperna turas om i den ordning de
 * först förekommer — ingen kategori gynnas.
 */
export function orderRecommended<T extends MixableProduct>(
  items: readonly T[],
  universal: ReadonlySet<string>,
  nowMs: number,
): T[] {
  const sorted = [...items].sort(compareByRecommended(nowMs));
  return interleaveByGroup(sorted, (p) => groupKeyForMix(p, universal));
}

/**
 * "Populärast": produkter som FAKTISKT sålt först, därefter en blandning där
 * kategorier med försäljning turas om före kategorier utan.
 *
 * Kategorivikten är det som skiljer den här listan från "Rekommenderat". Utan
 * den blev de identiska (uppmätt 2026-08-16: 0 av 714 positioner skilde),
 * eftersom båda annars ordnas på createdAt inom varje grupp.
 */
export function orderPopular<T extends MixableProduct>(
  items: readonly T[],
  universal: ReadonlySet<string>,
): T[] {
  const grupp = (p: T) => groupKeyForMix(p, universal);
  const sorted = [...items].sort(compareByPopularity);
  const salda = sorted.filter((p) => (p.popularity ?? 0) > 0);
  const resten = sorted.filter((p) => (p.popularity ?? 0) <= 0);
  const vikt = new Map<string, number>();
  for (const p of items) {
    const k = grupp(p);
    vikt.set(k, (vikt.get(k) ?? 0) + (p.popularity ?? 0));
  }
  return [...salda, ...interleaveByGroup(resten, grupp, (g) => vikt.get(g) ?? 0)];
}
