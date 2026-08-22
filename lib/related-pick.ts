// lib/related-pick.ts
//
// Ren urvalslogik för "Liknande produkter" — inga sidoeffekter, ingen JSON/IO-import,
// så den är enhetstestbar direkt (lib/related-products.test.ts). lib/related-products.ts
// re-exporterar dessa jämte kartläsaren (curatedRelatedSlugs).

import type { Product } from "./products";

// ── Meningsfullt kategori-överlapp ──────────────────────────────────────────
// Wix-katalogen har en "All Products"-kategori som sitter på VARENDA produkt
// (audit 2026-07: den täckte alla 420 produkter). En sådan universell kategori
// bär ingen relevanssignal — utan att exkludera den "delar" varje produkt kategori
// med varenda annan, så fallback-överlappet kunde dra in en helt orelaterad produkt
// (mätt: produkter i små kategorier fick ett irrelevant 4:e förslag). Vi hittar
// universella kategorier DYNAMISKT (täcker ≥90 % av katalogen) och räknar dem inte
// som "samma kategori". Robust: finns ingen sådan kategori exkluderas inget.
/** Läser bara collectionIds, så signaturen kräver inte mer än så — listsidorna
 *  skickar en smalare ListProduct (se lib/products.ts) och ska kunna anropa den. */
export function universalCollectionIds(all: { collectionIds?: string[] }[]): Set<string> {
  const uni = new Set<string>();
  if (all.length < 20) return uni;
  const count = new Map<string, number>();
  for (const p of all) for (const c of p.collectionIds || []) count.set(c, (count.get(c) || 0) + 1);
  const threshold = all.length * 0.9;
  for (const [c, n] of count) if (n >= threshold) uni.add(c);
  return uni;
}

/** Antal MENINGSFULLA (icke-universella) kategorier som två produkter delar. */
export function sharedCategoryCount(a: Product, b: Product, universal: Set<string>): number {
  const bs = new Set((b.collectionIds || []).filter((c) => !universal.has(c)));
  let n = 0;
  for (const c of a.collectionIds || []) if (!universal.has(c) && bs.has(c)) n++;
  return n;
}

// ── Merchandiser-signaler (gratis: allt kommer ur Wix-produktdatan) ──────────
//
// Fallbacken rankade förr på ENBART antal delade kategorier. Det gör att en
// produkt i "Hem & Inredning" (hundratals varor) ser exakt likadan ut som en i
// "Badrum & Hemtextil" (ett fåtal) — och att en skruvmejsel för 79 kr kan
// föreslås under en möbel för 3 000 kr. Den betalda merchandiser-modellen fick
// fyra instruktioner (scripts/score-related.mjs): komplement före dubbletter,
// PRISPASSNING, samma användningsområde, variation. Tre av dem går att räkna
// fram deterministiskt ur data vi redan har — gratis, för varje produkt, utan
// att en genererad ögonblicksbild kan bli inaktuell.

/**
 * Kategorisärskiljning som vikt: en kategori som få produkter delar bär mycket
 * mer signal än en som halva katalogen ligger i (klassisk IDF). Det ersätter
 * "räkna delade kategorier", där alla kategorier vägde lika mycket.
 *
 * Behöver INTE kategoriträdet — sällsyntheten mäts direkt i katalogen, så en
 * underkategori får automatiskt högre vikt än sin förälder.
 */
export function categoryWeights(all: Product[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const p of all) for (const c of p.collectionIds || []) freq.set(c, (freq.get(c) || 0) + 1);
  const w = new Map<string, number>();
  for (const [c, n] of freq) w.set(c, Math.log((all.length + 1) / (n + 1)) + 1);
  return w;
}

/**
 * Prispassning, 1.0 = perfekt. Mäter KVOT, inte krondifferens — "many times its
 * price" i merchandiser-prompten är multiplikativt: 200 vs 400 kr är samma
 * felsteg som 2 000 vs 4 000. Upp till 1,5× är gratis (normal prisspridning
 * inom en kategori), därefter faller den mjukt. Saknat pris → neutral (1.0),
 * så en produkt utan prisdata aldrig straffas.
 */
export function priceFit(a: number | undefined, b: number | undefined): number {
  if (!a || !b || a <= 0 || b <= 0) return 1;
  const ratio = Math.max(a, b) / Math.min(a, b);
  return 1 / (1 + Math.max(0, ratio - 1.5) / 2);
}

/**
 * Namnets ord, gemener, bara bokstäver. Siffror och mått försvinner av sig
 * själva (tokeniseringen delar på icke-bokstäver), och ord under tre tecken
 * släpps — de bär ingen produktbetydelse.
 */
export function nameTokens(name: string): string[] {
  return (name || "")
    .toLowerCase()
    .split(/[^a-zà-öø-ÿ]+/i)
    .filter((t) => t.length >= 3);
}

/** IDF över produktnamnens ord — samma sällsynthetsidé som categoryWeights. */
export function tokenWeights(all: Product[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const p of all) for (const t of new Set(nameTokens(p.name))) freq.set(t, (freq.get(t) || 0) + 1);
  const w = new Map<string, number>();
  for (const [t, n] of freq) w.set(t, Math.log((all.length + 1) / (n + 1)) + 1);
  return w;
}

/**
 * Hur lika två produktnamn är, 0–1, viktat på ordens sällsynthet (cosinus).
 *
 * ERSÄTTER en förstaords-"typ" som granskningen 2026-08-15 fällde. Att ta
 * första ordet antog att katalogens namn börjar med substantivet. Uppmätt gör
 * de inte det: 91 av 756 produkter börjar med ett ADJEKTIV, och det vanligaste
 * "typ"-ordet var `hopfällbar` — 22 produkter, däribland en arbetsbänk, en
 * bardisk och en dragvagn i SAMMA kategori, som därmed trycktes ner mot
 * varandra fast de inte har något med varandra att göra. Samtidigt missades
 * fallet regeln fanns för: "Cykelpump 160 PSI" och "Elektrisk cykelpump
 * 150PSI" fick olika förstaord och dämpades inte alls.
 *
 * Sällsyntheten löser båda: `hopfällbar` finns överallt → nästan ingen vikt,
 * medan `cykelpump` är ovanligt → hög vikt. Ordets PLATS i namnet spelar
 * ingen roll längre.
 */
export function nameSimilarity(a: string, b: string, w: Map<string, number>): number {
  const ta = new Set(nameTokens(a));
  const tb = new Set(nameTokens(b));
  if (!ta.size || !tb.size) return 0;
  const wt = (t: string) => w.get(t) ?? 1;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += wt(t);
  let na = 0;
  for (const t of ta) na += wt(t);
  let nb = 0;
  for (const t of tb) nb += wt(t);
  return shared / Math.sqrt(na * nb);
}

/**
 * Slutgiltig "Liknande produkter"-lista för PDP:n. Två lager:
 *   1. Kuraterade LLM-val (bäst först) — bara i lager + fortfarande existerande.
 *   2. Fallback/påfyllning: merchandiser-rankat kategori-överlapp (se ovan).
 *      Täcker HELT när kuraterad lista saknas — vilket den gör för 45 % av
 *      katalogen, eftersom den kuraterade kartan är en ögonblicksbild.
 * Aldrig produkten själv, aldrig dubbletter, max `limit`. Ren funktion → testbar.
 */
export function pickRelated(p: Product, all: Product[], curatedSlugs: string[], limit = 4): Product[] {
  const bySlug = new Map(all.map((x) => [x.slug, x]));
  const universal = universalCollectionIds(all);
  const out: Product[] = [];
  const seen = new Set<string>([p.slug]); // aldrig produkten själv
  const add = (x?: Product) => { if (x && !seen.has(x.slug)) { out.push(x); seen.add(x.slug); } };

  // 1) Kuraterade val (bäst först) — bara i lager + fortfarande i katalogen.
  for (const s of curatedSlugs) {
    if (out.length >= limit) break;
    const x = bySlug.get(s);
    if (x && x.inStock) add(x);
  }
  // 2) Merchandiser-rankad fallback/påfyllning. Bara varor i lager: ett förslag
  //    är ett aktivt tips från butiken, och att tipsa om något man inte kan köpa
  //    är sämre än att visa tre förslag i stället för fyra. (Tidigare sorterades
  //    slutsålda bara sist — de kom ändå med när överlappet var tunt.)
  if (out.length < limit) {
    const w = categoryWeights(all);
    const maxPop = Math.max(1, ...all.map((x) => x.popularity || 0));
    const cands = all
      .map((x) => {
        const bs = new Set((x.collectionIds || []).filter((c) => !universal.has(c)));
        let affinity = 0;
        for (const c of p.collectionIds || []) if (!universal.has(c) && bs.has(c)) affinity += w.get(c) || 1;
        // Popularitet är verklig försäljning (90 dagar) — den signalen hade den
        // betalda modellen aldrig ens tillgång till. Den viktas lätt: den ska
        // skilja mellan likvärdiga kandidater, inte köra över relevansen.
        const boost = 1 + 0.2 * ((x.popularity || 0) / maxPop) + 0.05 * ((x.imageScore || 0) / 100);
        return { x, score: affinity * priceFit(p.priceNum, x.priceNum) * boost, affinity };
      })
      .filter((s) => s.affinity > 0 && s.x.inStock && !seen.has(s.x.slug))
      .sort((a, b) => b.score - a.score);

    // Greedy med variationsdämpning: merchandisern skulle ta "en eller två
    // äkta alternativ, inte fem av samma sak". Varje redan vald produkt (och
    // produkten man tittar på) drar ner kandidater som LIKNAR den, viktat på
    // namnlikhet. Dämpning, aldrig uteslutning — en produkt vars enda grannar
    // är syskonmodeller ska inte få tom lista.
    const tw = tokenWeights(all);
    const against: string[] = [p.name]; // syskonmodeller dämpas direkt mot produkten själv
    while (out.length < limit) {
      let best: { x: Product; adj: number } | null = null;
      for (const s of cands) {
        if (seen.has(s.x.slug)) continue;
        let damp = 1;
        for (const other of against) damp *= 1 - 0.6 * nameSimilarity(s.x.name, other, tw);
        const adj = s.score * damp;
        if (!best || adj > best.adj) best = { x: s.x, adj };
      }
      if (!best) break;
      against.push(best.x.name);
      add(best.x);
    }
  }
  return out;
}
