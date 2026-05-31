// Delade typer för Claude/Gemini-providers. Bröts ut ur lib/claude/client.ts
// så lib/gemini/client.ts kan importera utan att dra in Anthropic-SDK.

export type ImageVerdict = "ok" | "warn" | "reject";

export interface ImageAnalysisResult {
  url: string;
  verdict: ImageVerdict;
  /** Svensk anledning som visas i kö-UI:t. Tom sträng om verdict=ok. */
  reason: string;
}

export interface CollectionOption {
  slug: string;
  name: string;
  description?: string;
}

export interface CategorySuggestion {
  collectionSlug: string | null;
  /** 0-1, där >0.7 = auto-assign, 0.4-0.7 = förslag, <0.4 = osäker. */
  confidence: number;
  /** Svensk motivering som visas i kö-UI:t. */
  reason: string;
}
