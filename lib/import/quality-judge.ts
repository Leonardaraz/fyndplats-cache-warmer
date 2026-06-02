// Premium kvalitets-judge med strikt grind (komponent 6).
//
// Efter all generering bedömer en Opus-judge SLUTPRODUKTEN på en skala 1–10 mot
// Fyndplats brand voice. Premium-pipelinen använder domen så här:
//   • score ≥ tröskel (default 9,5) → produkten publiceras direkt.
//   • score <  tröskel               → en extra Opus self-critique-runda körs.
//   • fortfarande < tröskel          → publiceras INTE; flaggas för manuell polering
//                                       (men är ändå rikare än standard-läget).
//
// Går via completeJsonRouted (Opus) → cache + budgetcap + cost-stats (op="qualityJudge").
// Fail-open: vid fel returneras en neutral icke-godkänd dom så vi hellre flaggar för
// polering än publicerar en obedömd text.

import { completeJsonRouted } from "../claude/client";
import { brandVoiceSystemPrefix } from "../claude/brand-voice";
import { premiumModel } from "./generate-premium";
import { makeCacheKey } from "../llm/cache";
import type { AliExpressProduct } from "./types";

export interface QualityVerdict {
  /** 0–10 (en decimal). */
  score: number;
  passed: boolean;
  /** Konkret feedback att mata in i en ny förfiningsrunda. */
  feedback: string;
  /** Delbetyg per dimension (för audit). */
  breakdown?: Record<string, number>;
}

/** Godkänt-tröskel. Default 9,5; override via PREMIUM_QUALITY_THRESHOLD. */
export function qualityThreshold(): number {
  const n = Number(process.env.PREMIUM_QUALITY_THRESHOLD);
  return Number.isFinite(n) && n > 0 && n <= 10 ? n : 9.5;
}

const SYSTEM_SUFFIX = `

UPPGIFT: Du är slutgranskare. Betygsätt den FÄRDIGA produkttexten 1–10 mot Fyndplats brand voice
och försäljningskvalitet. Var sträng — 9,5+ betyder "behöver ingen manuell polering alls".

Bedöm dessa dimensioner (1–10 var): brandVoice, hook, konkretion, trovardighet, sprak, faqKvalitet.
Sätt ett helhetsbetyg (kan vara decimal) och ge KONKRET feedback på det som drar ner betyget.

Svara ENDAST med JSON:
{ "score": 9.5, "breakdown": { "brandVoice": 9, "hook": 9, "konkretion": 10, "trovardighet": 10,
  "sprak": 9, "faqKvalitet": 9 }, "feedback": "konkreta förbättringspunkter" }`;

export async function judgeQuality(input: {
  product: AliExpressProduct;
  title: string;
  metaDescription: string;
  descriptionHtml: string;
  faq: { q: string; a: string }[];
}): Promise<QualityVerdict> {
  const { product, title, metaDescription, descriptionHtml, faq } = input;
  const threshold = qualityThreshold();

  const faqText = faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n") || "(ingen FAQ)";
  const user = `SLUTPRODUKT ATT BETYGSÄTTA:

Titel: ${title}
Meta: ${metaDescription}

Beskrivning:
${descriptionHtml}

FAQ:
${faqText}

Betygsätt enligt reglerna.`;

  const cacheKey = makeCacheKey({
    op: "qualityJudge",
    name: title,
    description: descriptionHtml,
    dependencyFingerprint: `pid=${product.supplierProductId}|faq=${faq.length}|m=${premiumModel()}`,
  });

  // Fail-open: en obedömd produkt ska INTE auto-publiceras → neutral underkänd dom.
  const failOpen = { score: threshold - 0.5, feedback: "Judge kunde inte köras (fail-open).", breakdown: {} };

  const raw = await completeJsonRouted<{ score?: number; feedback?: string; breakdown?: Record<string, number> }>({
    op: "qualityJudge",
    cacheKey,
    system: brandVoiceSystemPrefix() + SYSTEM_SUFFIX,
    user,
    maxTokens: 800,
    model: premiumModel(),
    failOpen,
  });

  return normalizeVerdict(raw, threshold);
}

export function normalizeVerdict(
  raw: { score?: number; feedback?: string; breakdown?: Record<string, number> },
  threshold: number,
): QualityVerdict {
  const scoreNum = Number(raw.score);
  const score = Number.isFinite(scoreNum) ? Math.max(0, Math.min(10, scoreNum)) : 0;
  return {
    score,
    passed: score >= threshold,
    feedback: (raw.feedback ?? "").slice(0, 1000),
    breakdown: raw.breakdown && typeof raw.breakdown === "object" ? raw.breakdown : undefined,
  };
}
