// Feature 3 — alternativa leverantörer.
//
// När en produkt går slut hos sin AliExpress-leverantör söker vi automatiskt
// efter andra säljare av samma/liknande produkt och rankar dem med Claude
// Haiku. Resultatet injiceras i real-tids-slut-mejlet (Feature 2) med
// färdiga "Importera →"-länkar till /admin/import.
//
// Flöde (findAlternativeSuppliers):
//   1. Strippa det säljarspecifika namnet till en generisk sökfråga.
//   2. aliexpress.ds.text.search (orders,desc) — samma klient som importen.
//   3. Filtrera bort originalprodukten, sortera på orders, topp 5.
//   4. Haiku-poängsätter 0-100 hur väl varje kandidat matchar originalet.
//   5. Returnera topp 3 efter poäng.
//
// Kostnad: ~1 Haiku-anrop (~$0.005) per slut-produkt, routat via lib/llm/router
// så det ärver daglig budgetcap + Gemini-fallback + persistent cache. Sätt
// OOS_ALTERNATIVES=off för att stänga av helt.

import {
  searchAliExpressByText,
  type AliExpressSearchResult,
} from "./client";
import { completeJsonRouted } from "../claude/client";
import { makeCacheKey } from "../llm/cache";
import { getAlternativeCache, isFresh } from "./alternative-cache";

export interface AlternativeSupplier {
  aliexpressId: string;
  title: string;
  priceUsd?: number;
  priceSek?: number;
  imageUrl?: string;
  productUrl: string;
  orders?: number;
  shipsFromCountries: string[];
  warehouseClass: "EU" | "CN" | "MIXED" | "UNKNOWN";
  /** 0-100 matchningspoäng (Haiku, eller heuristik om LLM ej tillgänglig). */
  score: number;
  /** Kort svensk motivering till poängen. */
  scoreReason: string;
  /** Färdig admin-import-länk (?source=alternative&aliexpressUrl=…&replacesProductId=…). */
  importUrl: string;
}

export function isAlternativesEnabled(): boolean {
  return (process.env.OOS_ALTERNATIVES ?? "on").toLowerCase() !== "off";
}

// Reklam-/fluff-ord som inte hjälper en generisk produktsökning. Tas bort
// (case-insensitive, hela ord). Beskrivande ord (Smart, Wireless, Bluetooth,
// Steel …) BEHÅLLS — de gör sökningen mer träffsäker.
const STOP_WORDS = new Set([
  "free", "shipping", "hot", "sale", "new", "newest", "arrival", "arrivals",
  "best", "seller", "top", "quality", "premium", "luxury", "fashion",
  "fashionable", "wholesale", "dropshipping", "drop", "ship", "for", "with",
  "and", "the", "your", "you", "pcs", "pcs.", "pc", "set", "sets", "lot",
  "hot-sale", "promotion", "promo", "discount", "cheap", "official", "store",
  "genuine", "original", "brand", "high", "super", "ultra", "professional",
  "pro", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026",
  "gift", "gifts", "christmas", "fast", "delivery",
]);

/**
 * Strippar ett säljarspecifikt produktnamn till en kort, generisk sökfråga.
 *   "🔥HOT 2024 New Smart Body Fat Scale Wireless Bluetooth Free Shipping"
 *     → "Smart Body Fat Scale Wireless Bluetooth"
 * Ren funktion — testad. Tar bort emoji, reklamfluff och dubbletter, kapar
 * till ≤ maxWords ord (default 8) och ≤ 80 tecken.
 */
export function genericizeQuery(name: string, maxWords = 8): string {
  const cleaned = name
    // Ta bort emoji + symboler, behåll bokstäver/siffror/mellanslag/bindestreck.
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const seen = new Set<string>();
  const words: string[] = [];
  for (const raw of cleaned.split(" ")) {
    const w = raw.trim();
    if (!w) continue;
    const lower = w.toLowerCase();
    if (STOP_WORDS.has(lower)) continue;
    // Rena siffror (mått/antal som "100", "5000mah" tillåts dock).
    if (/^\d+$/.test(w)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    words.push(w);
    if (words.length >= maxWords) break;
  }

  let query = words.join(" ");
  if (query.length > 80) query = query.slice(0, 80).trim();
  // Fallback: om allt ströks bort (bara stopord/siffror) — ta de längsta
  // icke-stopord-tokens (≥4 tecken) som troligen bär betydelse. Returnera ""
  // om inget meningsfullt finns; caller hoppar då över sökningen helt istället
  // för att söka på rena stopord (som ger irrelevanta träffar).
  if (!query) {
    const meaningful = cleaned
      .split(" ")
      .map((w) => w.trim())
      .filter((w) => w.length >= 4 && !/^\d+$/.test(w))
      .sort((a, b) => b.length - a.length)
      .slice(0, 3);
    query = meaningful.join(" ");
  }
  return query;
}

/** Normaliserar en titel till jämförbara tokens (samma rensning som genericize). */
function normalizeTokens(text: string): string[] {
  return text
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export interface RankOptions {
  /** AliExpress-id att exkludera (originalprodukten). */
  excludeProductId: string;
  /** Hur många kandidater att behålla efter rankning. Default 5. */
  topN?: number;
}

/**
 * Filtrerar bort originalprodukten + dubbletter och sorterar på orders desc.
 * Ren funktion — testad utan nätverk.
 */
export function filterAndRank(
  results: AliExpressSearchResult[],
  opts: RankOptions,
): AliExpressSearchResult[] {
  const topN = opts.topN ?? 5;
  const seen = new Set<string>();
  const filtered = results.filter((r) => {
    if (!r.productId) return false;
    if (r.productId === opts.excludeProductId) return false;
    if (seen.has(r.productId)) return false;
    seen.add(r.productId);
    return true;
  });
  filtered.sort((a, b) => (b.orders ?? 0) - (a.orders ?? 0));
  return filtered.slice(0, topN);
}

/** Bygger AliExpress produkt-URL om search-svaret inte gav någon. */
function productUrlFor(r: AliExpressSearchResult): string {
  return r.productUrl || `https://www.aliexpress.com/item/${r.productId}.html`;
}

/** Bygger /admin/import-länken för "Importera →". */
export function buildImportUrl(
  baseUrl: string,
  aliexpressUrl: string,
  replacesProductId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    source: "alternative",
    aliexpressUrl,
    replacesProductId,
  });
  return `${base}/admin/import?${params.toString()}`;
}

interface ScoreEntry {
  id: string;
  score: number;
  reason: string;
}

/**
 * Heuristisk fallback-poäng om Haiku/Gemini inte är tillgängliga: baseras på
 * ord-överlapp mot originalnamnet + en liten orders-bonus. Deterministisk.
 */
function heuristicScores(
  originalName: string,
  candidates: AliExpressSearchResult[],
): ScoreEntry[] {
  const origWords = new Set(
    genericizeQuery(originalName, 12).toLowerCase().split(" ").filter(Boolean),
  );
  const maxOrders = Math.max(1, ...candidates.map((c) => c.orders ?? 0));
  return candidates.map((c) => {
    const candWords = normalizeTokens(c.title);
    const overlap = candWords.filter((w) => origWords.has(w)).length;
    const overlapPct = origWords.size > 0 ? overlap / origWords.size : 0;
    const ordersBonus = (c.orders ?? 0) / maxOrders; // 0-1
    const score = Math.round(Math.min(100, overlapPct * 75 + ordersBonus * 25));
    return { id: c.productId, score, reason: "Heuristisk poäng (LLM ej tillgänglig)." };
  });
}

const SCORE_SYSTEM = `Du är en svensk inköpsassistent för en dropshipping-butik. En produkt har tagit slut hos sin leverantör. Du får originalproduktens namn och en lista alternativa AliExpress-träffar. Bedöm hur väl varje alternativ matchar originalet som ersättningsprodukt.

Poäng 0-100:
- 85-100 = uppenbart samma produkt (samma typ, funktion, specifikationer)
- 60-84 = mycket lik, fungerar som ersättning
- 40-59 = liknande kategori men osäker passform
- 0-39 = troligen fel produkt

Var konservativ. Motiveringen ska vara på svenska, max 80 tecken.`;

/**
 * Poängsätter kandidaterna med Haiku (routat via budget-cap + Gemini-fallback
 * + cache). Faller tillbaka till heuristik om allt failar.
 */
async function scoreCandidates(
  originalName: string,
  candidates: AliExpressSearchResult[],
): Promise<ScoreEntry[]> {
  if (candidates.length === 0) return [];
  const failOpen = heuristicScores(originalName, candidates);

  const list = candidates
    .map((c, i) => `${i + 1}. id=${c.productId} | "${c.title}"${c.orders ? ` | ${c.orders} ordrar` : ""}`)
    .join("\n");
  const user = `Originalprodukt: "${originalName}"

Alternativ:
${list}

Svara ENDAST med JSON-array, en post per alternativ:
[{"id": "<aliexpress-id>", "score": 0-100, "reason": "kort svensk motivering"}]`;

  // Cachebar: samma original + samma kandidat-id:n → samma poäng.
  const cacheKey = makeCacheKey({
    op: "scoreAlternatives",
    name: originalName,
    description: "",
    dependencyFingerprint: candidates.map((c) => c.productId).join(","),
  });

  const parsed = await completeJsonRouted<ScoreEntry[]>({
    op: "scoreAlternatives",
    cacheKey,
    system: SCORE_SYSTEM,
    user,
    maxTokens: 500,
    failOpen,
  });

  if (!Array.isArray(parsed) || parsed.length === 0) return failOpen;
  // Normalisera + matcha tillbaka mot kandidat-id:n (LLM kan hoppa över någon).
  const byId = new Map(parsed.map((p) => [String(p.id), p]));
  return candidates.map((c) => {
    const hit = byId.get(c.productId);
    const score = hit && Number.isFinite(hit.score) ? Math.max(0, Math.min(100, Math.round(hit.score))) : 0;
    return {
      id: c.productId,
      score,
      reason: (hit?.reason ?? "").slice(0, 120) || "Ingen motivering.",
    };
  });
}

// =====================================================================
// Deterministisk rankning (PRIMÄR sökväg — gratis, ingen LLM)
// =====================================================================

/**
 * Pris inom ±pct av originalet? Okänt pris (endera sidan) → true, så vi inte
 * filtrerar bort kandidater bara för att pris saknas i search-svaret.
 */
export function priceWithinRange(
  candidateUsd: number | undefined,
  originalUsd: number | undefined,
  pct = 0.5,
): boolean {
  if (candidateUsd === undefined || originalUsd === undefined || originalUsd <= 0) return true;
  return candidateUsd >= originalUsd * (1 - pct) && candidateUsd <= originalUsd * (1 + pct);
}

/** EU-lager först, sedan blandat, sedan resten. */
function warehouseSortRank(cls: AlternativeSupplier["warehouseClass"]): number {
  return cls === "EU" ? 0 : cls === "MIXED" ? 1 : 2;
}

function tokenOverlap(title: string, queryTokens: string[]): number {
  const t = new Set(normalizeTokens(title));
  let n = 0;
  for (const q of queryTokens) if (t.has(q)) n++;
  return n;
}

export interface DeterministicRankOptions {
  excludeProductId: string;
  /** Originalproduktens inköpspris i USD (för ±50%-filtret). */
  originalCostUsd?: number;
  /** Antal att behålla. Default 3. */
  topN?: number;
}

/**
 * PRIMÄR sökväg: filtrera bort originalet + pris utanför ±50%, sortera
 * EU-lager först → orders desc → pris asc. Ren funktion — testad.
 * Om ±50%-filtret skulle tömma poolen behåller vi de ofiltrerade (hellre
 * något än inget — mejlet ska ändå ge förslag).
 */
export function rankDeterministic(
  results: AliExpressSearchResult[],
  opts: DeterministicRankOptions,
): AliExpressSearchResult[] {
  const topN = opts.topN ?? 3;
  const seen = new Set<string>();
  const base = results.filter((r) => {
    if (!r.productId || r.productId === opts.excludeProductId || seen.has(r.productId)) return false;
    seen.add(r.productId);
    return true;
  });
  const priced = base.filter((r) => priceWithinRange(r.priceUsd, opts.originalCostUsd, 0.5));
  const pool = priced.length > 0 ? priced : base;
  pool.sort((a, b) => {
    const w = warehouseSortRank(a.warehouseClass ?? "UNKNOWN") - warehouseSortRank(b.warehouseClass ?? "UNKNOWN");
    if (w !== 0) return w;
    const o = (b.orders ?? 0) - (a.orders ?? 0);
    if (o !== 0) return o;
    return (a.priceUsd ?? Infinity) - (b.priceUsd ?? Infinity);
  });
  return pool.slice(0, topN);
}

/**
 * Är de deterministiska träffarna trygga nog att använda utan Claude?
 * Kräver minst 3 träffar SOM dessutom delar kategori med originalet (token-
 * överlapp mot den generiska frågan). Annars → fallback till Haiku.
 */
export function isCategoryConfident(
  candidates: AliExpressSearchResult[],
  originalName: string,
): boolean {
  if (candidates.length < 3) return false;
  const queryTokens = genericizeQuery(originalName, 12).toLowerCase().split(" ").filter(Boolean);
  const need = queryTokens.length >= 2 ? 2 : 1;
  const consistent = candidates.filter((c) => tokenOverlap(c.title, queryTokens) >= need).length;
  return consistent >= 3;
}

/** Deterministisk display-poäng (ingen LLM): relevans + EU-bonus + popularitet. */
function deterministicScore(
  c: AliExpressSearchResult,
  queryTokens: string[],
  maxOrders: number,
): { score: number; reason: string } {
  const overlapPct = queryTokens.length ? Math.min(1, tokenOverlap(c.title, queryTokens) / queryTokens.length) : 0;
  const euBonus = c.warehouseClass === "EU" ? 1 : c.warehouseClass === "MIXED" ? 0.5 : 0;
  const ordersBonus = maxOrders > 0 ? (c.orders ?? 0) / maxOrders : 0;
  const score = Math.round(Math.min(100, overlapPct * 55 + euBonus * 25 + ordersBonus * 20));
  const reason =
    c.warehouseClass === "EU"
      ? "EU-lager, hög relevans & popularitet."
      : "Matchande produkt, rankad på popularitet & pris.";
  return { score, reason };
}

function toSupplier(
  r: AliExpressSearchResult,
  opts: { baseUrl: string; usdToSek: number; aliexpressId: string },
  scored: { score: number; reason: string },
): AlternativeSupplier {
  const productUrl = productUrlFor(r);
  return {
    aliexpressId: r.productId,
    title: r.title,
    priceUsd: r.priceUsd,
    priceSek: r.priceUsd !== undefined ? Math.round(r.priceUsd * opts.usdToSek) : undefined,
    imageUrl: r.imageUrl,
    productUrl,
    orders: r.orders,
    shipsFromCountries: r.shipsFromCountries ?? [],
    warehouseClass: r.warehouseClass ?? "UNKNOWN",
    score: scored.score,
    scoreReason: scored.reason,
    importUrl: buildImportUrl(opts.baseUrl, productUrl, opts.aliexpressId),
  };
}

export interface FindAlternativesOptions {
  aliexpressId: string;
  productName: string;
  /** Bas-URL för admin-import-länkarna (t.ex. https://…vercel.app). */
  baseUrl: string;
  /** USD→SEK för prisvisning i mejlet. */
  usdToSek: number;
  /** Originalproduktens senast kända inköpspris i USD (för ±50%-prisfiltret). */
  originalCostUsd?: number;
  /** Antal alternativ att returnera. Default 3. */
  returnCount?: number;
  /** Antal kandidater att poängsätta i fallback. Default 5. */
  scoreCount?: number;
  /** Hoppa över 30-dagars-cachen (för felsökning/återgenerering). */
  skipCache?: boolean;
}

/**
 * Hittar och rankar alternativa leverantörer för en slutsåld produkt.
 *
 * Kostnadsoptimerad (Feature 3): primär sökväg är GRATIS & deterministisk
 * (EU-först + orders + pris-±50%, cachad 30 dagar). Claude Haiku används BARA
 * som fallback när det deterministiska resultatet är < 3 träffar eller ser ut
 * att blanda kategorier — då re-rankar Haiku (budget-capad till $2/dag).
 *
 * Read-only mot AliExpress (ingen Wix-katalog-skrivning) — säker i dry-run.
 * Skriver dock till alternativ-cachen (egen kollektion) även i dry-run för att
 * spara API-anrop; det är ingen butiks-ändring. Kastar aldrig — returnerar []
 * om sökningen failar (mejlet skickas ändå).
 */
export async function findAlternativeSuppliers(
  opts: FindAlternativesOptions,
): Promise<AlternativeSupplier[]> {
  if (!isAlternativesEnabled()) return [];
  const returnCount = opts.returnCount ?? 3;
  const scoreCount = opts.scoreCount ?? 5;

  // 0) Cache: färsk + tillräckligt många → använd direkt (inget AE-anrop, ingen LLM).
  if (!opts.skipCache) {
    try {
      const cached = await getAlternativeCache().get(opts.aliexpressId);
      if (cached && isFresh(cached.computedAt, new Date()) && cached.alternatives.length >= returnCount) {
        return cached.alternatives.slice(0, returnCount);
      }
    } catch (err) {
      console.warn(
        `[alternatives] cache-läsning misslyckades för ${opts.aliexpressId}: ${err instanceof Error ? err.message.slice(0, 150) : String(err)}`,
      );
    }
  }

  // 1) Sök (kostar ett AE-anrop, ingen LLM-kostnad).
  const query = genericizeQuery(opts.productName);
  if (!query.trim()) {
    // Inget meningsfullt att söka på (bara stopord/siffror) — sök inte alls.
    return [];
  }
  let results: AliExpressSearchResult[];
  try {
    results = await searchAliExpressByText(query, { sortBy: "orders,desc", pageSize: 20 });
  } catch (err) {
    console.warn(
      `[alternatives] sökning misslyckades för "${query}": ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`,
    );
    return [];
  }

  const queryTokens = genericizeQuery(opts.productName, 12).toLowerCase().split(" ").filter(Boolean);
  const detTop = rankDeterministic(results, {
    excludeProductId: opts.aliexpressId,
    originalCostUsd: opts.originalCostUsd,
    topN: returnCount,
  });

  let alternatives: AlternativeSupplier[];

  if (isCategoryConfident(detTop, opts.productName)) {
    // PRIMÄR (gratis): deterministisk rankning, deterministiska display-poäng.
    const maxOrders = Math.max(1, ...detTop.map((c) => c.orders ?? 0));
    alternatives = detTop.map((r) => toSupplier(r, opts, deterministicScore(r, queryTokens, maxOrders)));
  } else {
    // FALLBACK (Haiku, budget-capad): re-ranka en bredare kandidatlista.
    const wide = filterAndRank(results, { excludeProductId: opts.aliexpressId, topN: scoreCount });
    if (wide.length === 0) return [];
    const scores = await scoreCandidates(opts.productName, wide).catch(() =>
      heuristicScores(opts.productName, wide),
    );
    const byId = new Map(scores.map((s) => [s.id, s]));
    const reranked = [...wide]
      .sort((a, b) => (byId.get(b.productId)?.score ?? 0) - (byId.get(a.productId)?.score ?? 0))
      .slice(0, returnCount);
    alternatives = reranked.map((r) => {
      const s = byId.get(r.productId);
      return toSupplier(r, opts, { score: s?.score ?? 0, reason: s?.reason ?? "" });
    });
  }

  if (alternatives.length === 0) return [];

  // 2) Cacha (30 dagar) — bara om vi fick en fullständig uppsättning.
  if (alternatives.length >= returnCount) {
    try {
      await getAlternativeCache().save(opts.aliexpressId, alternatives);
    } catch (err) {
      console.warn(
        `[alternatives] cache-skrivning misslyckades för ${opts.aliexpressId}: ${err instanceof Error ? err.message.slice(0, 150) : String(err)}`,
      );
    }
  }

  return alternatives.slice(0, returnCount);
}
