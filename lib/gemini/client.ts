// Gemini-fallback för LLM-routern.
//
// Använder Google AI Studio's REST API direkt (ingen npm-dep nödvändig — vi
// håller @anthropic-ai/sdk som enda LLM-dep). Free tier i 2026-05 är 1500
// req/dag för flash-lite, tillräckligt för Fyndplats import-takt.
//
// Mirrors interface från lib/claude/client.ts:
//   - analyzeImages(urls)            → ImageAnalysisResult[]
//   - suggestCategory(name, desc, collections) → { suggestion, usage }
//
// Returnerar { result, usage } så routern kan logga kostnad (0 för Gemini free).

import { ProviderClientError } from "../llm/types";
import type { LlmUsage } from "../llm/types";
import type { CategorySuggestion, CollectionOption, ImageAnalysisResult, ImageVerdict } from "../claude/types";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash-lite";
export const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-2.0-flash";

function apiKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY saknas — Gemini-fallback inte tillgänglig.");
  return k;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  fileData?: { mimeType: string; fileUri: string };
}

async function callGemini(
  model: string,
  parts: GeminiPart[],
  systemPrompt: string,
  maxTokens: number,
  temperature = 0.2,
): Promise<{ text: string; usage: LlmUsage }> {
  const url = `${API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${apiKey()}`;
  const body = {
    contents: [{ role: "user", parts }],
    systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
      responseMimeType: "application/json",
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new ProviderClientError(`Gemini ${model} -> ${res.status}: ${errText.slice(0, 300)}`, res.status);
  }
  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
  const usage: LlmUsage = {
    inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
  };
  return { text, usage };
}

// --- Bildanalys ----------------------------------------------------------

const IMAGE_SYSTEM = `Du är en svensk QA-granskare för en webshop. Du får produktbilder och ska bedöma om de duger som butikspresentation.
Flagga och avvisa bilder med vattenstämplar, logotyper, kinesisk text-overlay, collage av flera produkter, suddiga bilder, eller olämpligt innehåll.
Använd "ok" för rena produktfoton, "warn" för dugliga men ej ideala, "reject" för bilder som inte ska användas. Anledning ≤80 svenska tecken.`;

const BATCH_SIZE = 5;

export async function analyzeImagesGemini(imageUrls: string[]): Promise<{ result: ImageAnalysisResult[]; usage: LlmUsage }> {
  if (imageUrls.length === 0) return { result: [], usage: { inputTokens: 0, outputTokens: 0 } };
  const aggregateUsage: LlmUsage = { inputTokens: 0, outputTokens: 0 };
  const results: ImageAnalysisResult[] = [];

  for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
    const batch = imageUrls.slice(i, i + BATCH_SIZE);
    const imageParts = await Promise.all(batch.map(fetchImageAsInlineData));
    const parts: GeminiPart[] = [];
    batch.forEach((_, idx) => {
      parts.push({ text: `Bild ${idx + 1}:` });
      parts.push(imageParts[idx]);
    });
    parts.push({
      text:
        `Bedöm bilderna ovan. Svara ENDAST med JSON-array, en post per bild i samma ordning:\n` +
        `[{"verdict": "ok"|"warn"|"reject", "reason": "svensk anledning eller tom"}]\n` +
        `Antal bilder: ${batch.length}.`,
    });
    // max_tokens 500 räcker för 5 bilder × en kort svensk reason — dokumenterat
    // i specen som "Image analysis: max_tokens: 500 per image batch".
    const { text, usage } = await callGemini(GEMINI_VISION_MODEL, parts, IMAGE_SYSTEM, 500);
    aggregateUsage.inputTokens += usage.inputTokens;
    aggregateUsage.outputTokens += usage.outputTokens;
    const parsed = parseJsonArray<{ verdict?: string; reason?: string }>(text);
    results.push(
      ...batch.map((url, idx) => {
        const v = parsed[idx];
        const verdict: ImageVerdict =
          v?.verdict === "reject" || v?.verdict === "warn" || v?.verdict === "ok" ? v.verdict : "ok";
        return { url, verdict, reason: (v?.reason ?? "").slice(0, 200) };
      }),
    );
  }
  return { result: results, usage: aggregateUsage };
}

async function fetchImageAsInlineData(url: string): Promise<GeminiPart> {
  // Gemini stödjer inte URL-källa direkt (förutom GCS) — vi hämtar bilden och
  // skickar som base64. Begränsa storleken för att hålla request-bodyn liten.
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new ProviderClientError(`Kunde inte hämta bild ${url}: ${res.status}`, res.status);
  const mimeType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  // ~4 MB hard cap så vi inte trippar request size limits.
  const trimmed = buf.length > 4_000_000 ? buf.subarray(0, 4_000_000) : buf;
  return { inlineData: { mimeType, data: trimmed.toString("base64") } };
}

// --- Kategorisering ------------------------------------------------------

const CATEGORY_SYSTEM = `Du är en svensk e-handelskategoriserare. Du får en produkts namn + beskrivning samt en lista över tillgängliga butikskategorier (med slugs). Välj den BÄST matchande slug:en.
Confidence: >0.85 uppenbart, 0.6-0.85 tydlig, 0.4-0.6 rimlig gissning, <0.4 osäker (lämna null). Anledning ≤120 svenska tecken.`;

export async function suggestCategoryGemini(
  name: string,
  description: string,
  collections: CollectionOption[],
): Promise<{ result: CategorySuggestion; usage: LlmUsage }> {
  if (collections.length === 0) {
    return { result: { collectionSlug: null, confidence: 0, reason: "" }, usage: { inputTokens: 0, outputTokens: 0 } };
  }
  const colsText = collections
    .map((c) => `- slug: "${c.slug}" | namn: "${c.name}"${c.description ? ` | beskrivning: ${c.description}` : ""}`)
    .join("\n");
  const user = `Produktnamn: ${name}
Produktbeskrivning (kort): ${stripHtml(description).slice(0, 1500)}

Tillgängliga kategorier:
${colsText}

Svara ENDAST med JSON:
{"collection_slug": "<en av slugs ovan eller null>", "confidence": 0.0-1.0, "reason": "kort svensk motivering"}`;

  // max_tokens 300 enligt spec — JSON-svaret är litet.
  const { text, usage } = await callGemini(GEMINI_TEXT_MODEL, [{ text: user }], CATEGORY_SYSTEM, 300);
  const parsed = parseJsonObject<{ collection_slug?: string | null; confidence?: number; reason?: string }>(text);
  const validSlugs = new Set(collections.map((c) => c.slug));
  const slug = parsed.collection_slug && validSlugs.has(parsed.collection_slug) ? parsed.collection_slug : null;
  const confidence = clamp01(parsed.confidence ?? 0);
  const suggestion: CategorySuggestion = {
    collectionSlug: slug,
    confidence: slug ? confidence : 0,
    reason: (parsed.reason ?? "").slice(0, 240),
  };
  return { result: suggestion, usage };
}

// --- Text-completion (för lib/ai/claude.ts completeJson fallback) --------

export async function completeJsonGemini<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ result: T; usage: LlmUsage }> {
  const { text, usage } = await callGemini(
    GEMINI_TEXT_MODEL,
    [{ text: opts.user }],
    opts.system,
    opts.maxTokens ?? 1000,
    opts.temperature,
  );
  return { result: parseJsonObject<T>(text), usage };
}

// --- Helpers -------------------------------------------------------------

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
    throw new Error(`Gemini returnerade ogiltig JSON: ${clean.slice(0, 300)}`);
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
