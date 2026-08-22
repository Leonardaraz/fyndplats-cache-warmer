// Dubblett-detektor (Feature 1, 2026-06-02).
//
// Innan en produkt importeras kollar vi om en mycket liknande redan finns i
// Wix-butiken. Tre signaler — alla DETERMINISTISKA, inga AI-anrop ($0):
//
//   1. AE Product-ID-match  → exakt sparat AliExpress-id = DEFINITIV dubblett (conf 1.0).
//   2. Bild-pHash-match     → Hamming-avstånd < 10 mellan huvudbilderna (conf ~0.6–0.97).
//   3. Titel-match          → Levenshtein < 5 ELLER ordmängd-overlap > 70% (conf ~0.6–0.95).
//
// Underlaget är FyndplatsProductHashes (en rad per befintlig produkt). Den bästa
// (högsta confidence) signalen per produkt returneras. Confidence-trösklar styr
// hur kraftfullt extension/admin varnar (>0.9 starkt, 0.6–0.9 mild, <0.6 tyst).

import { hammingDistanceHex, pHashFromUrl } from "./phash";
import { wixProductEditUrl } from "../admin-links";
import { listProductHashes, type ProductHashRecord } from "../store/product-hashes";

export type MatchType = "aeId" | "image" | "title";

export interface DuplicateMatch {
  wixProductId: string;
  productName: string;
  matchType: MatchType;
  /** 0–1. >0.9 = stark varning, 0.6–0.9 = mild, <0.6 filtreras bort. */
  confidence: number;
  /** Länk till produkten (Wix-dashboard-deeplink, alltid giltig via produkt-id). */
  url: string;
  /** Storefront-slug om känd (extension kan bygga en publik länk). */
  slug?: string;
  /** Förklaring för admin/loggar, t.ex. "pHash-avstånd 3" eller "ordmängd-overlap 0.86". */
  detail: string;
}

export interface DuplicateCandidate {
  title: string;
  firstImageUrl?: string;
  aliexpressProductId?: string;
}

export interface FindDuplicatesOptions {
  /** Förladdade hash-rader (undvik en Wix-query per anrop i bulk-flöden). */
  records?: ProductHashRecord[];
  /** Förberäknad pHash för kandidatbilden (undvik dubbel hashning i bulk). */
  candidateHash?: string | null;
  /** Confidence-golv för returnerade matcher (default 0.6 = mild varning och uppåt). */
  minConfidence?: number;
  /** Bild-pHash-tröskel (Hamming). Default 10. */
  imageDistanceThreshold?: number;
}

// --- Textsimilaritet (rena, enhetstestbara funktioner) ----------------------

/** Normaliserar en titel: gemener, ta bort skiljetecken, kollapsa whitespace. */
export function normalizeTitle(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein-avstånd (edit distance) mellan två strängar. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Tokeniserar en titel till en mängd ord (längd ≥ 2, för att slippa brus). */
export function wordSet(s: string): Set<string> {
  return new Set(normalizeTitle(s).split(" ").filter((w) => w.length >= 2));
}

/** Jaccard-ordmängd-overlap mellan två titlar: |A∩B| / |A∪B|, 0–1. */
export function wordOverlap(a: string, b: string): number {
  const A = wordSet(a);
  const B = wordSet(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export interface TitleSimilarity {
  levenshtein: number;
  overlap: number;
  /** True om Levenshtein < 5 ELLER ordmängd-overlap > 0.7 (MISSTÄNKT dubblett). */
  suspect: boolean;
  /** Sammanvägd 0–1 (max av overlap och 1 − lev/maxlen). */
  score: number;
}

/** Jämför två titlar enligt dubblett-reglerna (Levenshtein < 5 ELLER overlap > 0.7). */
export function compareTitles(a: string, b: string): TitleSimilarity {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  const lev = levenshtein(na, nb);
  const overlap = wordOverlap(a, b);
  const maxLen = Math.max(na.length, nb.length, 1);
  const score = Math.max(overlap, 1 - lev / maxLen);
  const suspect = lev < 5 || overlap > 0.7;
  return { levenshtein: lev, overlap, suspect, score };
}

// --- Confidence-mappning -----------------------------------------------------

/** Bild-confidence ur pHash-avstånd (0 → 0.97, nära tröskeln → ~0.55). */
function imageConfidence(distance: number, threshold: number): number {
  // Linjärt avtagande, klampat så ett exakt sammanfall aldrig överstiger aeId.
  const conf = 1 - distance / (threshold * 2.4);
  return Math.max(0.5, Math.min(0.97, conf));
}

/** Titel-confidence ur similaritetsmåttet (suspect garanteras ≥ 0.6). */
function titleConfidence(sim: TitleSimilarity): number {
  return Math.max(0.6, Math.min(0.95, sim.score));
}

/** Admin-deeplink till produkten i Wix-dashboarden (lib/admin-links.ts).
 *
 *  Byggde tidigare URL:en på `WIX_SITE_ID` — men det id:t pekar på GAMLA
 *  Fyndplats där CMS-collectionerna lever, medan produkten ligger i
 *  V3-katalogen på HEADLESS-sajten. Länken landade alltså på fel sajt.
 *  Rättat 2026-08-21 när länkarna samlades på ett ställe. */
function dashboardUrl(wixProductId: string): string {
  return wixProductEditUrl(wixProductId);
}

// --- Huvud-API ---------------------------------------------------------------

/**
 * Hittar befintliga produkter som liknar kandidaten. Returnerar den starkaste
 * signalen per produkt, sorterat efter confidence (högst först). Tom lista = inga
 * misstänkta dubbletter över minConfidence.
 *
 * Fail-open: kan kandidatbilden inte hashas hoppar vi bara över bild-signalen.
 */
export async function findDuplicates(
  candidate: DuplicateCandidate,
  opts: FindDuplicatesOptions = {},
): Promise<DuplicateMatch[]> {
  const records = opts.records ?? (await listProductHashes());
  const minConfidence = opts.minConfidence ?? 0.6;
  const imgThreshold = opts.imageDistanceThreshold ?? 10;

  // Hasha kandidatbilden EN gång (om vi har en URL och inte redan fått en hash).
  let candHash: string | null | undefined = opts.candidateHash;
  if (candHash === undefined) {
    candHash = candidate.firstImageUrl ? await pHashFromUrl(candidate.firstImageUrl) : null;
  }

  const aeId = candidate.aliexpressProductId?.trim();
  const best = new Map<string, DuplicateMatch>();

  const consider = (m: DuplicateMatch): void => {
    if (m.confidence < minConfidence) return;
    const prev = best.get(m.wixProductId);
    if (!prev || m.confidence > prev.confidence) best.set(m.wixProductId, m);
  };

  for (const rec of records) {
    // 1. AE Product-ID — exakt match = definitiv dubblett.
    if (aeId && rec.aeProductId && rec.aeProductId.trim() === aeId) {
      consider({
        wixProductId: rec.wixProductId,
        productName: rec.productName,
        matchType: "aeId",
        confidence: 1.0,
        url: dashboardUrl(rec.wixProductId),
        slug: rec.slug,
        detail: `Samma AliExpress-produkt-id (${aeId}).`,
      });
      continue; // Starkaste möjliga signal — ingen mening att även titel-/bildmatcha.
    }

    // 2. Bild-pHash.
    if (candHash && rec.phash) {
      const dist = hammingDistanceHex(candHash, rec.phash);
      if (dist < imgThreshold) {
        consider({
          wixProductId: rec.wixProductId,
          productName: rec.productName,
          matchType: "image",
          confidence: imageConfidence(dist, imgThreshold),
          url: dashboardUrl(rec.wixProductId),
          slug: rec.slug,
          detail: `pHash-avstånd ${dist} (< ${imgThreshold}).`,
        });
      }
    }

    // 3. Titel.
    const sim = compareTitles(candidate.title, rec.productName);
    if (sim.suspect) {
      consider({
        wixProductId: rec.wixProductId,
        productName: rec.productName,
        matchType: "title",
        confidence: titleConfidence(sim),
        url: dashboardUrl(rec.wixProductId),
        slug: rec.slug,
        detail: `Levenshtein ${sim.levenshtein}, ordmängd-overlap ${sim.overlap.toFixed(2)}.`,
      });
    }
  }

  return [...best.values()].sort((a, b) => b.confidence - a.confidence);
}
