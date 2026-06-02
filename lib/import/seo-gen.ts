// Premium SEO-meta: A/B mot 3 varianter med judge (komponent 5).
//
// Genererar 3 varianter av meta-description (140–155 tecken) och låter en judge i
// SAMMA anrop välja den med högst CTR-potential (en enda call → ~2 öre, Haiku).
// Returnerar den valda + alla varianter (för audit) + judge-motiveringen.
//
// Går via completeJsonRouted → cache + budgetcap + cost-stats (op="premiumSeoMeta").
// Fail-open: vid fel returneras den inkommande beskrivningens fallback-meta.

import { completeJsonRouted, TEXT_MODEL } from "../claude/client";
import { makeCacheKey } from "../llm/cache";
import type { AliExpressProduct } from "./types";

export interface SeoMetaResult {
  chosen: string;
  variants: string[];
  reason: string;
}

/** Modell för meta-genereringen — Haiku räcker (kort output), override via env. */
function metaModel(): string {
  return process.env.CLAUDE_SEO_META_MODEL || TEXT_MODEL;
}

const SYSTEM = `Du är en svensk SEO- och CRO-expert. Du skriver meta-descriptions som maximerar klick (CTR)
i Googles sökresultat för en e-handel. En bra meta: 140–155 tecken, fångar produktens nytta +
en tydlig anledning att klicka (fynd, snabb leverans, känsla), naturlig svenska, inget keyword-spam,
ingen butiks-/startsidescopy. Svara ENDAST med giltig JSON.`;

export async function generateSeoMeta(input: {
  product: AliExpressProduct;
  title: string;
  descriptionHtml: string;
}): Promise<SeoMetaResult> {
  const { product, title, descriptionHtml } = input;
  const fallback: SeoMetaResult = {
    chosen: title.slice(0, 155),
    variants: [],
    reason: "fail-open",
  };

  const user = `Produkt: ${title}
Beskrivning (svensk): ${stripHtml(descriptionHtml).slice(0, 1200)}

Skapa 3 OLIKA meta-descriptions (var och en 140–155 tecken) med olika vinkel
(t.ex. nytta-fokus, känsla/ögonblick-fokus, fynd/leverans-fokus). Välj sedan den
med högst förväntad CTR och motivera kort.

Svara ENDAST med JSON:
{ "variants": ["…", "…", "…"], "bestIndex": 0, "reason": "kort svensk motivering" }`;

  const cacheKey = makeCacheKey({
    op: "premiumSeoMeta",
    name: title,
    description: descriptionHtml,
    dependencyFingerprint: `pid=${product.supplierProductId}|m=${metaModel()}`,
  });

  const raw = await completeJsonRouted<{ variants?: string[]; bestIndex?: number; reason?: string }>({
    op: "premiumSeoMeta",
    cacheKey,
    system: SYSTEM,
    user,
    maxTokens: 600,
    model: metaModel(),
    failOpen: { variants: [fallback.chosen], bestIndex: 0, reason: "fail-open" },
  });

  return pickBest(raw, fallback);
}

export function pickBest(
  raw: { variants?: string[]; bestIndex?: number; reason?: string },
  fallback: SeoMetaResult,
): SeoMetaResult {
  const variants = Array.isArray(raw.variants)
    ? raw.variants.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => clampMeta(v))
    : [];
  if (variants.length === 0) return fallback;
  const idx =
    typeof raw.bestIndex === "number" && raw.bestIndex >= 0 && raw.bestIndex < variants.length
      ? raw.bestIndex
      : 0;
  return {
    chosen: variants[idx],
    variants,
    reason: (raw.reason ?? "").slice(0, 240),
  };
}

/** Meta får aldrig spränga 160 tecken (Wix/Google klipper); trimma snyggt på ordgräns. */
function clampMeta(s: string): string {
  const t = s.trim();
  if (t.length <= 160) return t;
  const cut = t.slice(0, 158);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
