// Legacy text-only Claude-helper. Behålls för bakåt-kompatibilitet med
// lib/import/seo.ts som tidigare anropade den direkt.
//
// All trafik routas nu via lib/llm/router.ts så SEO-anrop ärver:
//   - Persistent cache (samma produkt → ingen LLM-trafik)
//   - Daglig budgetcap (skip Claude när dagens spend ≥ ANTHROPIC_DAILY_BUDGET_USD)
//   - Gemini-fallback (vid credit-balance / 4xx / budget cap)

import { completeJsonRouted, getClaude } from "../claude/client";

export { getClaude };

/** Modellnamn för SEO-anrop. SEO är text-only och kvalitets-sensitiv —
 *  default Sonnet 4.6 men kan overrideas via CLAUDE_SEO_MODEL. */
export const SEO_MODEL = process.env.CLAUDE_SEO_MODEL || "claude-sonnet-4-6";

/**
 * Anropar Claude (med Gemini-fallback) och förväntar JSON tillbaka.
 *
 * Cache-key krävs så vi inte spillar pengar på re-imports av samma produkt.
 * Saknas en stabil nyckel kan caller skicka null — då hoppas cachen över.
 */
export async function completeJson<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  /** Operations-namn för stats. Default "completeJson". */
  op?: string;
  /** Stabil cache-key (t.ex. sha256 av input). null = ej cachebar. */
  cacheKey?: string | null;
  /** Failopen-värde om både Claude och Gemini failar. Saknas = kasta. */
  failOpen?: T;
}): Promise<T> {
  return completeJsonRouted<T>({
    system: opts.system,
    user: opts.user,
    maxTokens: opts.maxTokens,
    op: opts.op ?? "completeJson",
    cacheKey: opts.cacheKey ?? null,
    model: SEO_MODEL,
    failOpen: opts.failOpen,
  });
}
