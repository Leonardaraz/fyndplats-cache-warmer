// Premium bild-ranking: Sonnet vision + lifestyle-detection (komponent 3).
//
// Varje bild analyseras av Sonnet vision och scoras på:
//   • lifestyle vs flat-lay  (lifestyle = bonus, känns levande på PDP)
//   • vit bakgrund           (bra HERO-kandidat → bonus)
//   • skärpa/kvalitet        (hög = bonus)
//   • visar produkt-features (bonus)
// Sedan väljs de 6–8 bästa och ordnas: HERO (vit bg, skarp) → lifestyle → detalj → storlek.
//
// Går via visionJsonRouted (Sonnet) → cost-stats (op="premiumImageRank"). Vision är
// dyrt → bilderna batchas (5 åt gången). Fail-open: vid fel behålls inkommande ordning
// (aldrig tom galleri — samma "hellre bild än ingen"-policy som standardflödet).

import { visionJsonRouted, PREMIUM_VISION_MODEL } from "../claude/client";
import { makeCacheKey } from "../llm/cache";
import type { ImageAnalysisResult } from "../claude/types";

export type ImageRole = "hero" | "lifestyle" | "detail" | "size" | "other";

export interface ImageScore {
  url: string;
  lifestyle: boolean;
  whiteBg: boolean;
  /** 1–5 skärpa/kvalitet. */
  sharpness: number;
  showsFeatures: boolean;
  role: ImageRole;
  /** Sammanvägd 0–100 för sortering inom roll. */
  score: number;
}

export interface RankedImages {
  /** Valda + ordnade bild-URL:er (hero → lifestyle → detalj → storlek). */
  orderedUrls: string[];
  /** Per inkommande bild (samma form som standard-bildanalysen) för admin-vyn. */
  entries: ImageAnalysisResult[];
  /** Full score-tabell (för audit/felsökning). */
  scores: ImageScore[];
}

const BATCH_SIZE = 5;
const VISION_MAX_TOKENS = 900;

/** Hur många bilder premium-galleriet behåller. 6–8 enligt spec; override via env. */
function maxImages(): number {
  const n = Number(process.env.PREMIUM_IMAGE_MAX);
  return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : 8;
}

const SYSTEM = `Du är en svensk e-handels-art director. Du bedömer produktbilder för en PDP (produktsida)
och avgör vilka som ska visas och i vilken ordning. Du är generös: en bild med lite text/badge
duger fortfarande. Svara ENDAST med giltig JSON.`;

export async function rankProductImages(imageUrls: string[]): Promise<RankedImages> {
  const urls = imageUrls.filter((u) => typeof u === "string" && u);
  if (urls.length === 0) return { orderedUrls: [], entries: [], scores: [] };

  const scores: ImageScore[] = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchScores = await scoreBatch(batch);
    scores.push(...batchScores);
  }

  return assembleRanking(urls, scores, maxImages());
}

async function scoreBatch(batch: string[]): Promise<ImageScore[]> {
  const cacheKey = makeCacheKey({
    op: "premiumImageRank",
    name: batch.join("|"),
    description: "",
    dependencyFingerprint: `m=${PREMIUM_VISION_MODEL}`,
  });

  const user =
    `Bedöm bilderna ovan. Svara ENDAST med JSON-array, en post per bild i samma ordning:\n` +
    `[{"lifestyle": bool, "whiteBg": bool, "sharpness": 1-5, "showsFeatures": bool, ` +
    `"role": "hero"|"lifestyle"|"detail"|"size"|"other"}]\n` +
    `Definitioner: lifestyle = produkten används/visas i miljö; whiteBg = ren vit/enfärgad ` +
    `bakgrund (bra huvudbild); detail = närbild på funktion/material; size = mått-/storleksbild.\n` +
    `Antal bilder: ${batch.length}.`;

  const failOpen = { items: batch.map(() => null) };
  const raw = await visionJsonRouted<{ items?: unknown[] } | unknown[]>({
    op: "premiumImageRank",
    cacheKey,
    system: SYSTEM,
    user,
    imageUrls: batch,
    maxTokens: VISION_MAX_TOKENS,
    model: PREMIUM_VISION_MODEL,
    failOpen,
  });

  // Modellen kan svara antingen som array eller { items: [...] } — hantera båda.
  const arr: unknown[] = Array.isArray(raw) ? raw : Array.isArray((raw as { items?: unknown[] })?.items) ? (raw as { items: unknown[] }).items : [];
  return batch.map((url, idx) => normalizeScore(url, arr[idx]));
}

export function normalizeScore(url: string, raw: unknown): ImageScore {
  const r = (raw ?? {}) as Record<string, unknown>;
  const lifestyle = r.lifestyle === true;
  const whiteBg = r.whiteBg === true;
  const sharpnessNum = Number(r.sharpness);
  const sharpness = Number.isFinite(sharpnessNum) ? Math.max(1, Math.min(5, Math.round(sharpnessNum))) : 3;
  const showsFeatures = r.showsFeatures === true;
  const role = isRole(r.role) ? r.role : inferRole({ lifestyle, whiteBg });

  // Sammanvägd score: skärpa väger tungt, sedan features, lifestyle och vit bg som bonus.
  const score =
    sharpness * 12 + // 12–60
    (showsFeatures ? 18 : 0) +
    (lifestyle ? 12 : 0) +
    (whiteBg ? 10 : 0);

  return { url, lifestyle, whiteBg, sharpness, showsFeatures, role, score };
}

/**
 * Väljer topp-N och ordnar dem hero → lifestyle → detalj → storlek → övrigt.
 * HERO väljs som den bäst scorande bilden med vit bakgrund (annars högsta score).
 * Behåller alltid minst en bild (aldrig tomt galleri).
 */
export function assembleRanking(urls: string[], scores: ImageScore[], max: number): RankedImages {
  const byUrl = new Map(scores.map((s) => [s.url, s]));
  // Toppurval på score (men minst 1, högst `max`).
  const ranked = [...scores].sort((a, b) => b.score - a.score);
  const keep = ranked.slice(0, Math.max(1, Math.min(max, ranked.length)));
  const keepSet = new Set(keep.map((s) => s.url));

  // HERO: bästa vit-bg-bilden bland de behållna, annars den högst scorande.
  const heroCandidates = keep.filter((s) => s.whiteBg);
  const hero = (heroCandidates.length ? heroCandidates : keep)[0];

  const roleOrder: ImageRole[] = ["hero", "lifestyle", "detail", "size", "other"];
  const effectiveRole = (s: ImageScore): ImageRole =>
    s.url === hero.url ? "hero" : s.role === "hero" ? "lifestyle" : s.role;

  const orderedUrls = [...keep]
    .sort((a, b) => {
      if (a.url === hero.url) return -1;
      if (b.url === hero.url) return 1;
      const ra = roleOrder.indexOf(effectiveRole(a));
      const rb = roleOrder.indexOf(effectiveRole(b));
      if (ra !== rb) return ra - rb;
      return b.score - a.score;
    })
    .map((s) => s.url);

  // Entries: en post per INKOMMANDE bild (admin-vyn). Behållna = ok, bortvalda = warn
  // (aldrig reject — vi tar bara bort dem ur galleriet, flaggar dem inte som dåliga).
  const entries: ImageAnalysisResult[] = urls.map((url) => {
    const s = byUrl.get(url);
    const kept = keepSet.has(url);
    return {
      url,
      verdict: kept ? "ok" : "warn",
      reason: s ? describeScore(s, url === hero.url, kept) : "",
    };
  });

  return { orderedUrls, entries, scores };
}

function describeScore(s: ImageScore, isHero: boolean, kept: boolean): string {
  const tags = [
    isHero ? "huvudbild" : s.role,
    s.lifestyle ? "lifestyle" : null,
    s.whiteBg ? "vit bg" : null,
    `skärpa ${s.sharpness}/5`,
    kept ? null : "ej i galleriet",
  ].filter(Boolean);
  return tags.join(", ").slice(0, 80);
}

function inferRole(flags: { lifestyle: boolean; whiteBg: boolean }): ImageRole {
  if (flags.whiteBg) return "hero";
  if (flags.lifestyle) return "lifestyle";
  return "other";
}

function isRole(v: unknown): v is ImageRole {
  return v === "hero" || v === "lifestyle" || v === "detail" || v === "size" || v === "other";
}
