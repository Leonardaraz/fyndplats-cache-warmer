// lib/sort-products.ts — sorteringsordningar för produktlistningarna.
//
// Designen (Leonard 2026-08-08: "det borde vara mer genomtänkt"; utökad
// 2026-08-18 med omdömessignalen — Leonard: "de med flest recensioner och
// bäst betyg är blandat i rekommenderat och populärast"):
//   • Nyast       = importdatum, fallande. Rakt av.
//   • Populärast  = bevisad efterfrågan: egna sålda enheter (90 d, riktiga
//                   Wix-ordrar) väger tyngst, antal omdömen är ombudet —
//                   varje omdöme är ett riktigt köp hos leverantören. Båda
//                   logaritmiskt. Produkter med signal rankas rakt av;
//                   svansen utan signal blandas per kategori som förut.
//   • Rekommenderat = butikens egen mix: bästsäljare väger tyngst
//                   (logaritmiskt — 10 sålda ska inte krossa allt annat),
//                   omdömesrika produkter lyfts (socialt bevis slår ren
//                   färskhet), nyheter får en färskhets-skjuts som klingar av
//                   på ett par veckor (nya produkter måste synas för att kunna
//                   BLI populära), och REA-produkter en liten knuff.
//                   Deterministiskt och förklarbart — ingen magi.
//
// SNITTBETYGET rankar vi INTE rakt på. Kåren är censurerad — under 3★
// importeras aldrig — så 87 % av omdömena är femmor och katalogsnittet 4,8.
// Ett snitt NÄRA 4,8 är därför brus; informationen sitter i avvikarna nedåt.
// Snittet räknas som AVVIKELSE från katalogsnittet, krympt mot 0 när omdömena
// är få (count/(count+10), empirisk Bayes) — en 4,0:a på 15 omdömen sjunker
// märkbart, en 5,0:a på 2 omdömen flyttar nästan ingenting.
//
// Rena komparatorer (enhetstestbara). Datumen kan komma som mikro- eller
// millisekunder (createdAt härleds ur Wix numericId = µs) → normalisera.

export interface SortableProduct {
  id?: string;
  createdAt?: number;
  popularity?: number;
  onSale?: boolean;
  /** Betygssammandraget som attachRatings hänger på (lib/rating.ts). */
  rating?: { count?: number; exact?: number };
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

// ── Omdömessignalen ────────────────────────────────────────────────────────

/** Katalogsnittet, uppmätt 2026-08-18 över ~1 500 godkända omdömen. Prior i
 *  krympningen — INTE en magisk konstant att trimma på känsla. */
const KATALOGSNITT = 4.8;
/** Krympstyrka: vid 10 omdömen väger produktens eget snitt 50/50 mot priorn. */
const KRYMP = 10;

/**
 * Bevisvärdet i en produkts omdömen: antalet (logaritmiskt — ombud för köp hos
 * leverantören) plus snittets krympta avvikelse från katalogsnittet (se
 * filhuvudet om varför rått snitt inte duger). Utan omdömen: 0.
 */
export function reviewSignal(p: SortableProduct): number {
  const count = Math.max(0, p.rating?.count ?? 0);
  if (!count) return 0;
  const exact = p.rating?.exact;
  const kvalitet =
    typeof exact === "number" && Number.isFinite(exact)
      ? (count / (count + KRYMP)) * (Math.max(0, Math.min(5, exact)) - KATALOGSNITT)
      : 0;
  // 0.8: en hel stjärnas belagd avvikelse ska märkas men aldrig ensam radera
  // antalets bevisvärde (15 omdömen ≈ 2.8p; 15 st 4,0:or tappar ≈ 0.4p).
  return Math.log1p(count) + 0.8 * kvalitet;
}

/**
 * Populärast-poängen: egna sälj väger ~tre gånger ett omdöme i log-rummet
 * (1 egen såld ≈ 2.1p ≈ 7 omdömen; 2 sålda slår 15 omdömen). Egen försäljning
 * är den starkaste signalen per enhet, men 90-dagarsfönstret är glest — utan
 * ombudet var "Populärast" i praktiken "Nyast" (0 sålda för 711 av 716).
 */
export function popularScore(p: SortableProduct): number {
  return 3 * Math.log1p(Math.max(0, p.popularity ?? 0)) + reviewSignal(p);
}

/** Populärast: poäng fallande, sedan nyast. */
export function compareByPopularity(a: SortableProduct, z: SortableProduct): number {
  return popularScore(z) - popularScore(a) || tieBreak(a, z);
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
  // Omdömen: 1.2 × signalen → 15 omdömen ≈ 3.3p. Slår färskhets-skjutsens max
  // (2p) med avsikt: belagt socialt bevis är värt mer än ren nyhet, men en
  // egen bästsäljare (5 sålda ≈ 5.4p) toppar fortfarande.
  const omdomen = 1.2 * reviewSignal(p);
  // Färskhets-skjuts: 2p dag 0, ~1p efter 10 dagar, ~0 efter en månad.
  const newnessScore = 2 * Math.exp(-ageDays / 14);
  const saleScore = p.onSale ? 0.4 : 0;
  return popScore + omdomen + newnessScore + saleScore;
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
 * "Populärast": produkter med bevisad efterfrågan (egna sälj och/eller
 * omdömen) rankas rakt av på poäng — det är ett rankat påstående, ingen
 * discovery-mix. Svansen utan signal blandas per kategori, där kategorier som
 * samlat signal turas om före kategorier utan.
 *
 * Det som skiljer listan från "Rekommenderat": ingen färskhets-skjuts, ingen
 * REA-knuff, ingen kategoriblandning i signaldelen. Före omdömessignalen var
 * skillnaden bara kategorivikten (uppmätt 2026-08-16: annars 0 av 714
 * positioner skilde) — nu skiljer även själva rankningen.
 */
export function orderPopular<T extends MixableProduct>(
  items: readonly T[],
  universal: ReadonlySet<string>,
): T[] {
  const grupp = (p: T) => groupKeyForMix(p, universal);
  const sorted = [...items].sort(compareByPopularity);
  const medSignal = sorted.filter((p) => popularScore(p) > 0);
  const resten = sorted.filter((p) => popularScore(p) <= 0);
  const vikt = new Map<string, number>();
  for (const p of items) {
    const k = grupp(p);
    vikt.set(k, (vikt.get(k) ?? 0) + popularScore(p));
  }
  return [...medSignal, ...interleaveByGroup(resten, grupp, (g) => vikt.get(g) ?? 0)];
}
