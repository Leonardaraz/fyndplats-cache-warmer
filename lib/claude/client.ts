// Delad Claude-helper för import-flödet.
// All Anthropic-trafik (utöver legacy lib/ai/claude.ts) går genom denna fil så
// vi kan byta modell, lägga till retry, cache eller fail-open på ett ställe.
//
// Modellval: claude-sonnet-4-5 har vision och fungerar bra för svensk text +
// bildanalys. Modellnamnet kan overrideas via env (CLAUDE_VISION_MODEL,
// CLAUDE_TEXT_MODEL) utan att röra koden.

import Anthropic from "@anthropic-ai/sdk";
import crypto from "node:crypto";

let client: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas i miljön.");
    client = new Anthropic({ apiKey });
  }
  return client;
}

/** Visioning + textmodellnamn — overrideas via env. */
export const VISION_MODEL = process.env.CLAUDE_VISION_MODEL || "claude-sonnet-4-5";
export const TEXT_MODEL = process.env.CLAUDE_TEXT_MODEL || "claude-sonnet-4-5";

/** Feature-flagga: stäng av all bildanalys om Claude beter sig konstigt. */
export function isImageAnalysisEnabled(): boolean {
  // Default ON — kräver explicit "off" för att stängas av.
  return (process.env.CLAUDE_IMAGE_ANALYSIS ?? "on").toLowerCase() !== "off";
}

/** Feature-flagga: stäng av auto-kategorisering. */
export function isAutoCategorizationEnabled(): boolean {
  return (process.env.CLAUDE_AUTO_CATEGORIZATION ?? "on").toLowerCase() !== "off";
}

// ------------------------------------------------------------------
// Bildanalys
// ------------------------------------------------------------------

export type ImageVerdict = "ok" | "warn" | "reject";

export interface ImageAnalysisResult {
  url: string;
  verdict: ImageVerdict;
  /** Svensk anledning som visas i kö-UI:t. Tom sträng om verdict=ok. */
  reason: string;
}

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

/**
 * Skickar bild-URL:er till Claude vision i batcher om 5 (sparar tokens) och
 * returnerar verdict per bild. Fail-open: vid Claude-fel returneras alla
 * bilder som "ok" så importen inte stoppas — bättre att Leonard granskar
 * manuellt än att hela importen failar.
 */
export async function analyzeImages(imageUrls: string[]): Promise<ImageAnalysisResult[]> {
  if (imageUrls.length === 0) return [];
  if (!isImageAnalysisEnabled()) {
    return imageUrls.map((url) => ({ url, verdict: "ok" as const, reason: "" }));
  }

  const results: ImageAnalysisResult[] = [];
  for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
    const batch = imageUrls.slice(i, i + BATCH_SIZE);
    try {
      const batchResults = await analyzeImageBatch(batch);
      results.push(...batchResults);
    } catch (err) {
      // Logga men låt importen fortsätta. Bilderna märks som ok så de visas;
      // Leonard kan fortfarande ta bort dem manuellt i kön.
      console.warn(
        `[claude] analyzeImageBatch failed for batch starting at ${i}:`,
        err instanceof Error ? err.message : String(err),
      );
      results.push(...batch.map((url) => ({ url, verdict: "ok" as const, reason: "" })));
    }
  }
  return results;
}

async function analyzeImageBatch(urls: string[]): Promise<ImageAnalysisResult[]> {
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

  const msg = await claude.messages.create({
    model: VISION_MODEL,
    max_tokens: 600,
    system: IMAGE_SYSTEM,
    messages: [{ role: "user", content }],
  });

  const text = extractText(msg);
  const parsed = parseJsonArray<{ verdict: ImageVerdict; reason?: string }>(text);
  // Försvar mot fel-antal: pad med ok om Claude tappar bort en bild.
  return urls.map((url, idx) => {
    const v = parsed[idx];
    const verdict: ImageVerdict =
      v?.verdict === "reject" || v?.verdict === "warn" || v?.verdict === "ok" ? v.verdict : "ok";
    return { url, verdict, reason: (v?.reason ?? "").slice(0, 200) };
  });
}

// ------------------------------------------------------------------
// Auto-kategorisering
// ------------------------------------------------------------------

export interface CollectionOption {
  /** Wix-collection-id eller slug — det vi mappar tillbaka mot. */
  slug: string;
  name: string;
  /** Kort beskrivning (valfri) som ger Claude hint om vad som hör hit. */
  description?: string;
}

export interface CategorySuggestion {
  collectionSlug: string | null;
  /** 0–1, där >0.7 = auto-assign, 0.4–0.7 = förslag, <0.4 = osäker. */
  confidence: number;
  /** Svensk motivering som visas i kö-UI:t. */
  reason: string;
}

const CATEGORY_SYSTEM = `Du är en svensk e-handelskategoriserare. Du får en produkts namn + beskrivning samt en lista över
tillgängliga butikskategorier (med slugs). Välj den BÄST matchande slug:en.

Var konservativ med confidence:
- >0.85 = uppenbart match (t.ex. "ansiktsmask" i kategori "Skönhet")
- 0.6–0.85 = tydlig men inte glasklar match
- 0.4–0.6 = rimlig gissning
- <0.4 = osäker, lämna okategoriserad (collection_slug=null)

Anledningen ska vara på svenska, kort (≤120 tecken), och referera till produkten — t.ex.
"produkten är en ansiktsmask, hör hemma under Skönhet".`;

// Liten in-memory cache per process. Re-imports av samma produkt slipper
// ringa Claude. Cache-key = sha256(namn + beskrivning + collections-fingeravtryck).
const categoryCache = new Map<string, CategorySuggestion>();

export function categoryCacheKey(name: string, description: string, collections: CollectionOption[]): string {
  const colsFp = collections.map((c) => c.slug).sort().join(",");
  return crypto
    .createHash("sha256")
    .update(`${name.trim()}|${description.trim().slice(0, 2000)}|${colsFp}`)
    .digest("hex");
}

export function getCachedCategory(key: string): CategorySuggestion | null {
  return categoryCache.get(key) ?? null;
}

export function setCachedCategory(key: string, suggestion: CategorySuggestion): void {
  // Begränsa cachens storlek — undvik unbounded growth i long-running processer.
  if (categoryCache.size > 500) {
    const firstKey = categoryCache.keys().next().value;
    if (firstKey) categoryCache.delete(firstKey);
  }
  categoryCache.set(key, suggestion);
}

/**
 * Frågar Claude om bästa kategorin. Fail-open: returnerar null-suggestion
 * vid fel så importen fortsätter (produkten blir bara okategoriserad).
 */
export async function suggestCategory(
  name: string,
  description: string,
  collections: CollectionOption[],
): Promise<CategorySuggestion> {
  if (!isAutoCategorizationEnabled() || collections.length === 0) {
    return { collectionSlug: null, confidence: 0, reason: "" };
  }

  const key = categoryCacheKey(name, description, collections);
  const cached = getCachedCategory(key);
  if (cached) return cached;

  try {
    const claude = getClaude();
    const colsText = collections
      .map((c) => `- slug: "${c.slug}" | namn: "${c.name}"${c.description ? ` | beskrivning: ${c.description}` : ""}`)
      .join("\n");

    const user = `Produktnamn: ${name}
Produktbeskrivning (kort): ${stripHtml(description).slice(0, 1500)}

Tillgängliga kategorier:
${colsText}

Svara ENDAST med JSON:
{"collection_slug": "<en av slugs ovan eller null>", "confidence": 0.0-1.0, "reason": "kort svensk motivering"}`;

    const msg = await claude.messages.create({
      model: TEXT_MODEL,
      max_tokens: 400,
      system: CATEGORY_SYSTEM,
      messages: [{ role: "user", content: user }],
    });
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
    const suggestion: CategorySuggestion = {
      collectionSlug: slug,
      confidence: slug ? confidence : 0,
      reason: (parsed.reason ?? "").slice(0, 240),
    };
    setCachedCategory(key, suggestion);
    return suggestion;
  } catch (err) {
    console.warn(
      "[claude] suggestCategory failed:",
      err instanceof Error ? err.message : String(err),
    );
    return { collectionSlug: null, confidence: 0, reason: "" };
  }
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

function stripCodeFence(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fence ? fence[1].trim() : text;
}

function parseJsonObject<T>(text: string): T {
  const clean = stripCodeFence(text);
  try {
    return JSON.parse(clean) as T;
  } catch {
    // Försök hitta första {...} i texten.
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
export const __testing = { extractText, parseJsonObject, parseJsonArray, stripHtml, clamp01 };
