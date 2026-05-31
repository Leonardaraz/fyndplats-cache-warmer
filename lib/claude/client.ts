// Delad Claude-helper för import-flödet.
//
// All Anthropic-trafik (utöver legacy lib/ai/claude.ts) går genom denna fil så
// vi kan byta modell, lägga till retry, cache eller fail-open på ett ställe.
//
// Modellval:
//   - Vision (bildanalys) använder Sonnet 4.5 — det är där det kostar att gå ner i
//     intelligens. Override: CLAUDE_VISION_MODEL.
//   - Text (kategorisering, översättning) använder Haiku 4.5 — 3× billigare än
//     Sonnet med tillräcklig kvalitet för "välj-ur-lista"/"översätt"-uppgifter.
//     Override: CLAUDE_TEXT_MODEL.
//
// Routern (lib/llm/router.ts) ligger ovanpå allt:
//   1. Persistent cache (samma produkt → ingen LLM-anrop alls)
//   2. Daglig budgetcap (skipas Claude om dagens spend ≥ ANTHROPIC_DAILY_BUDGET_USD)
//   3. Gemini-fallback (vid credit-balance, 4xx eller budget exceeded)
//
// Den här filen exponerar samma publika API som tidigare (analyzeImages,
// suggestCategory) så att lib/import/pipeline.ts inte behöver röras.

import Anthropic from "@anthropic-ai/sdk";
import { runOperation, type ProviderCallResult } from "../llm/router";
import { makeCacheKey } from "../llm/cache";
import { CreditBalanceError, ProviderClientError } from "../llm/types";
import type { LlmUsage } from "../llm/types";
import {
  analyzeImagesGemini,
  completeJsonGemini,
  suggestCategoryGemini,
} from "../gemini/client";
import type {
  CategorySuggestion,
  CollectionOption,
  ImageAnalysisResult,
  ImageVerdict,
} from "./types";

export type { CategorySuggestion, CollectionOption, ImageAnalysisResult, ImageVerdict } from "./types";

let client: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas i miljön.");
    client = new Anthropic({ apiKey });
  }
  return client;
}

/** Modellnamn — overrideas via env. Default: Sonnet för vision, Haiku för text. */
export const VISION_MODEL = process.env.CLAUDE_VISION_MODEL || "claude-sonnet-4-5";
export const TEXT_MODEL = process.env.CLAUDE_TEXT_MODEL || "claude-haiku-4-5-20251001";

export function isImageAnalysisEnabled(): boolean {
  return (process.env.CLAUDE_IMAGE_ANALYSIS ?? "on").toLowerCase() !== "off";
}

export function isAutoCategorizationEnabled(): boolean {
  return (process.env.CLAUDE_AUTO_CATEGORIZATION ?? "on").toLowerCase() !== "off";
}

// ------------------------------------------------------------------
// Bildanalys
// ------------------------------------------------------------------

const IMAGE_SYSTEM = `Du är en svensk QA-granskare för en webshop. Du får produktbilder och ska bedöma om de duger som butikspresentation.
Flagga och avvisa bilder med:
- vattenstämplar eller logotyper från andra varumärken
- kinesisk text eller annan text-overlay i bilden (engelska produktnamn på själva produkten är ok)
- flera orelaterade produkter i samma bild (collage)
- suddiga, pixliga eller låg-kvalitetsbilder
- olämpligt innehåll (NSFW)

Använd "ok" för rena produktfoton.
Använd "warn" för bilder som duger men inte är ideala (t.ex. lifestyle-bild med liten text).
Använd "reject" för bilder som inte ska användas.

Anledningen ska vara på svenska, kort (≤80 tecken).`;

const BATCH_SIZE = 5;
// max_tokens: 500 per batch om 5 bilder. Tidigare 600 — sänkt eftersom JSON-svaret
// är ~12 tokens/bild + lite overhead = ~80 tokens. 500 ger marginal utan att slösa.
const IMAGE_MAX_TOKENS = 500;

export async function analyzeImages(imageUrls: string[]): Promise<ImageAnalysisResult[]> {
  if (imageUrls.length === 0) return [];
  if (!isImageAnalysisEnabled()) {
    return imageUrls.map((url) => ({ url, verdict: "ok" as const, reason: "" }));
  }

  const results: ImageAnalysisResult[] = [];
  for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
    const batch = imageUrls.slice(i, i + BATCH_SIZE);
    // Cache-key per batch — samma URL-set ger samma svar.
    const cacheKey = makeCacheKey({
      op: "analyzeImages",
      name: batch.join("|"),
      description: "",
    });
    const failOpen: ImageAnalysisResult[] = batch.map((url) => ({ url, verdict: "ok", reason: "" }));

    const run = await runOperation<ImageAnalysisResult[]>({
      op: "analyzeImages",
      cacheKey,
      claudeCall: () => analyzeImageBatchClaude(batch),
      geminiCall: () => analyzeImagesGemini(batch).then(toProviderResult("gemini-2.0-flash-vision")),
      failOpen,
    });
    results.push(...run.result);
  }
  return results;
}

async function analyzeImageBatchClaude(
  urls: string[],
): Promise<ProviderCallResult<ImageAnalysisResult[]>> {
  const claude = getClaude();
  const content: Anthropic.ContentBlockParam[] = [];
  urls.forEach((url, idx) => {
    content.push({ type: "text", text: `Bild ${idx + 1}:` });
    content.push({ type: "image", source: { type: "url", url } });
  });
  content.push({
    type: "text",
    text:
      `Bedöm bilderna ovan. Svara ENDAST med JSON-array, en post per bild i samma ordning:\n` +
      `[{"verdict": "ok"|"warn"|"reject", "reason": "svensk anledning eller tom"}]\n` +
      `Antal bilder: ${urls.length}.`,
  });

  let msg: Anthropic.Message;
  try {
    msg = await claude.messages.create({
      model: VISION_MODEL,
      // max_tokens 500 — JSON-svaret för 5 bilder är ~80-100 tokens; 500 ger
      // gott om marginal utan att betala för output som inte kommer användas.
      max_tokens: IMAGE_MAX_TOKENS,
      system: [
        {
          type: "text",
          text: IMAGE_SYSTEM,
          // Prompt caching: system-prompten är statisk över alla calls.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    throw mapAnthropicError(err);
  }

  const text = extractText(msg);
  const parsed = parseJsonArray<{ verdict: ImageVerdict; reason?: string }>(text);
  const result = urls.map((url, idx) => {
    const v = parsed[idx];
    const verdict: ImageVerdict =
      v?.verdict === "reject" || v?.verdict === "warn" || v?.verdict === "ok" ? v.verdict : "ok";
    return { url, verdict, reason: (v?.reason ?? "").slice(0, 200) };
  });
  return { result, usage: extractUsage(msg), model: VISION_MODEL };
}

// ------------------------------------------------------------------
// Auto-kategorisering
// ------------------------------------------------------------------

const CATEGORY_SYSTEM = `Du är en svensk e-handelskategoriserare. Du får en produkts namn + beskrivning samt en lista över
tillgängliga butikskategorier (med slugs). Välj den BÄST matchande slug:en.

Var konservativ med confidence:
- >0.85 = uppenbart match (t.ex. "ansiktsmask" i kategori "Skönhet")
- 0.6–0.85 = tydlig men inte glasklar match
- 0.4–0.6 = rimlig gissning
- <0.4 = osäker, lämna okategoriserad (collection_slug=null)

Anledningen ska vara på svenska, kort (≤120 tecken), och referera till produkten — t.ex.
"produkten är en ansiktsmask, hör hemma under Skönhet".`;

// max_tokens 300 enligt spec — JSON-svaret är ~30 tokens; 300 räcker även för
// en lång svensk reason.
const CATEGORY_MAX_TOKENS = 300;

/**
 * Cache-key — namn + första 500 tecken av beskrivning + sorterad slug-lista.
 * Identisk produkt + samma kollektioner → samma key → träffar persistent cache.
 */
export function categoryCacheKey(name: string, description: string, collections: CollectionOption[]): string {
  const colsFp = collections.map((c) => c.slug).sort().join(",");
  return makeCacheKey({
    op: "suggestCategory",
    name,
    description,
    dependencyFingerprint: colsFp,
  });
}

export async function suggestCategory(
  name: string,
  description: string,
  collections: CollectionOption[],
): Promise<CategorySuggestion> {
  const failOpen: CategorySuggestion = { collectionSlug: null, confidence: 0, reason: "" };
  if (!isAutoCategorizationEnabled() || collections.length === 0) {
    return failOpen;
  }

  const key = categoryCacheKey(name, description, collections);
  const run = await runOperation<CategorySuggestion>({
    op: "suggestCategory",
    cacheKey: key,
    claudeCall: () => suggestCategoryClaude(name, description, collections),
    geminiCall: () => suggestCategoryGemini(name, description, collections).then(toProviderResult(process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash-lite")),
    failOpen,
  });
  return run.result;
}

async function suggestCategoryClaude(
  name: string,
  description: string,
  collections: CollectionOption[],
): Promise<ProviderCallResult<CategorySuggestion>> {
  const claude = getClaude();
  const colsText = collections
    .map((c) => `- slug: "${c.slug}" | namn: "${c.name}"${c.description ? ` | beskrivning: ${c.description}` : ""}`)
    .join("\n");

  // Prompt caching: system + den statiska collections-listan cachas (samma
  // mellan alla produkter). Endast produktnamnet/-beskrivningen är dynamiskt.
  const staticUserPrefix = `Tillgängliga kategorier:\n${colsText}\n\n`;
  const dynamicUser = `Produktnamn: ${name}
Produktbeskrivning (kort): ${stripHtml(description).slice(0, 1500)}

Svara ENDAST med JSON:
{"collection_slug": "<en av slugs ovan eller null>", "confidence": 0.0-1.0, "reason": "kort svensk motivering"}`;

  let msg: Anthropic.Message;
  try {
    msg = await claude.messages.create({
      model: TEXT_MODEL,
      max_tokens: CATEGORY_MAX_TOKENS,
      system: [
        { type: "text", text: CATEGORY_SYSTEM, cache_control: { type: "ephemeral" } },
      ],
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: staticUserPrefix, cache_control: { type: "ephemeral" } },
            { type: "text", text: dynamicUser },
          ],
        },
      ],
    });
  } catch (err) {
    throw mapAnthropicError(err);
  }
  const text = extractText(msg);
  const parsed = parseJsonObject<{
    collection_slug?: string | null;
    confidence?: number;
    reason?: string;
  }>(text);

  const validSlugs = new Set(collections.map((c) => c.slug));
  const slug = parsed.collection_slug && validSlugs.has(parsed.collection_slug)
    ? parsed.collection_slug
    : null;
  const confidence = clamp01(parsed.confidence ?? 0);
  const result: CategorySuggestion = {
    collectionSlug: slug,
    confidence: slug ? confidence : 0,
    reason: (parsed.reason ?? "").slice(0, 240),
  };
  return { result, usage: extractUsage(msg), model: TEXT_MODEL };
}

// ------------------------------------------------------------------
// Bakåtkompatibilitet: tidigare exporterade in-process cache-helpers
// ------------------------------------------------------------------
// Behållna för att inte bryta lib/claude/client.test.ts publika ytan.
// Persistent cachen i lib/llm/cache.ts är nu källan-till-sanning;
// de här två är tunna in-memory wrappers ifall någon callare litar på dem.

const _legacyMem = new Map<string, CategorySuggestion>();

export function getCachedCategory(key: string): CategorySuggestion | null {
  return _legacyMem.get(key) ?? null;
}

export function setCachedCategory(key: string, suggestion: CategorySuggestion): void {
  if (_legacyMem.size > 500) {
    const firstKey = _legacyMem.keys().next().value;
    if (firstKey) _legacyMem.delete(firstKey);
  }
  _legacyMem.set(key, suggestion);
}

// ------------------------------------------------------------------
// Text-completion (för lib/ai/claude.ts completeJson fallback via router)
// ------------------------------------------------------------------

/**
 * Text-only JSON-completion (SEO etc.). Routas via samma router så den ärver
 * cache + budgetcap + Gemini-fallback. Cachebar via cacheKey (null = inte
 * cachebar, t.ex. om input ändras varje gång).
 */
export async function completeJsonRouted<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  op: string;
  cacheKey: string | null;
  model?: string;
  failOpen?: T;
}): Promise<T> {
  const model = opts.model || TEXT_MODEL;
  const run = await runOperation<T>({
    op: opts.op,
    cacheKey: opts.cacheKey,
    claudeCall: () => completeJsonClaude<T>({ ...opts, model }),
    geminiCall: () =>
      completeJsonGemini<T>({ system: opts.system, user: opts.user, maxTokens: opts.maxTokens }).then(
        toProviderResult(process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash-lite"),
      ),
    failOpen: opts.failOpen,
  });
  return run.result;
}

async function completeJsonClaude<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  model: string;
}): Promise<ProviderCallResult<T>> {
  const claude = getClaude();
  let msg: Anthropic.Message;
  try {
    msg = await claude.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1000,
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: opts.user }],
    });
  } catch (err) {
    throw mapAnthropicError(err);
  }
  const text = extractText(msg);
  return { result: parseJsonObject<T>(text), usage: extractUsage(msg), model: opts.model };
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

function extractUsage(msg: Anthropic.Message): LlmUsage {
  const u = msg.usage as unknown as {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  const cached = (u?.cache_read_input_tokens ?? 0);
  return {
    inputTokens: (u?.input_tokens ?? 0) + (u?.cache_creation_input_tokens ?? 0) + cached,
    outputTokens: u?.output_tokens ?? 0,
    cachedInputTokens: cached,
  };
}

function mapAnthropicError(err: unknown): Error {
  if (!(err instanceof Error)) return new Error(String(err));
  // Anthropic SDK returnerar APIError med .status och .error.type.
  const e = err as Error & { status?: number; error?: { error?: { type?: string; message?: string } } };
  const type = e.error?.error?.type ?? "";
  const msg = e.message ?? "";
  if (
    type === "invalid_request_error" &&
    /credit balance|too low|insufficient/i.test(msg)
  ) {
    return new CreditBalanceError(msg);
  }
  if (typeof e.status === "number" && e.status >= 400 && e.status < 500) {
    return new ProviderClientError(msg, e.status);
  }
  return err;
}

function toProviderResult<T>(model: string) {
  return (input: { result: T; usage: LlmUsage }): ProviderCallResult<T> => ({
    result: input.result,
    usage: input.usage,
    model,
  });
}

function stripCodeFence(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fence ? fence[1].trim() : text;
}

function parseJsonObject<T>(text: string): T {
  const clean = stripCodeFence(text);
  try {
    return JSON.parse(clean) as T;
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`Claude returnerade ogiltig JSON: ${clean.slice(0, 300)}`);
  }
}

function parseJsonArray<T>(text: string): T[] {
  const clean = stripCodeFence(text);
  try {
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    }
    return [];
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Exporterade för test.
export const __testing = { extractText, parseJsonObject, parseJsonArray, stripHtml, clamp01, mapAnthropicError };
