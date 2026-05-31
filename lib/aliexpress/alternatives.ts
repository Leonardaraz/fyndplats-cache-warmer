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
  // Fallback: om allt ströks (kort/konstigt namn) — använd originalets första ord.
  if (!query) query = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).slice(0, 6).join(" ");
  return query;
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
    const candWords = c.title.toLowerCase().split(/\s+/).filter(Boolean);
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

export interface FindAlternativesOptions {
  aliexpressId: string;
  productName: string;
  /** Bas-URL för admin-import-länkarna (t.ex. https://…vercel.app). */
  baseUrl: string;
  /** USD→SEK för prisvisning i mejlet. */
  usdToSek: number;
  /** Antal alternativ att returnera. Default 3. */
  returnCount?: number;
  /** Antal kandidater att poängsätta. Default 5. */
  scoreCount?: number;
}

/**
 * Hittar och rankar alternativa leverantörer för en slutsåld produkt.
 * Read-only mot AliExpress (ingen Wix-skrivning) — säker att köra i dry-run.
 * Kastar inte: returnerar [] om sökningen failar (mejlet skickas ändå).
 */
export async function findAlternativeSuppliers(
  opts: FindAlternativesOptions,
): Promise<AlternativeSupplier[]> {
  if (!isAlternativesEnabled()) return [];
  const returnCount = opts.returnCount ?? 3;
  const scoreCount = opts.scoreCount ?? 5;

  const query = genericizeQuery(opts.productName);
  let results: AliExpressSearchResult[];
  try {
    results = await searchAliExpressByText(query, { sortBy: "orders,desc", pageSize: 20 });
  } catch (err) {
    console.warn(
      `[alternatives] sökning misslyckades för "${query}": ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`,
    );
    return [];
  }

  const ranked = filterAndRank(results, { excludeProductId: opts.aliexpressId, topN: scoreCount });
  if (ranked.length === 0) return [];

  const scores = await scoreCandidates(opts.productName, ranked).catch(() =>
    heuristicScores(opts.productName, ranked),
  );
  const scoreById = new Map(scores.map((s) => [s.id, s]));

  const enriched: AlternativeSupplier[] = ranked.map((r) => {
    const s = scoreById.get(r.productId);
    const productUrl = productUrlFor(r);
    const priceSek =
      r.priceUsd !== undefined ? Math.round(r.priceUsd * opts.usdToSek) : undefined;
    return {
      aliexpressId: r.productId,
      title: r.title,
      priceUsd: r.priceUsd,
      priceSek,
      imageUrl: r.imageUrl,
      productUrl,
      orders: r.orders,
      shipsFromCountries: r.shipsFromCountries ?? [],
      warehouseClass: r.warehouseClass ?? "UNKNOWN",
      score: s?.score ?? 0,
      scoreReason: s?.reason ?? "",
      importUrl: buildImportUrl(opts.baseUrl, productUrl, opts.aliexpressId),
    };
  });

  enriched.sort((a, b) => b.score - a.score);
  return enriched.slice(0, returnCount);
}
