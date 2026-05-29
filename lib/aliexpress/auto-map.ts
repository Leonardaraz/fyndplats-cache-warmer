// AI-assisterad auto-mappning: kopplar en befintlig Wix-produkt till sin
// sannolika AliExpress-källa.
//
// Problemet: de migrerade Wix-produkterna bär INGEN AliExpress-referens (ingen
// SKU, inget källID). Vi kan därför inte slå upp källan deterministiskt — vi
// måste matcha på innehåll. Pipelinen:
//   1. Claude översätter det svenska SEO-namnet till koncisa engelska sökord.
//   2. AliExpress ds.text.search körs på sökorden.
//   3. Varje träff poängsätts mot sökorden (token-överlapp).
//   4. Högsta poäng klassas som high/medium/low confidence.
//
// Endast high-confidence bör auto-mappas; resten går till manuell bekräftelse.
// Poängfunktionerna är rena (inga sidoeffekter) så de kan enhetstestas.

import { runClaude } from "../ai/claude";
import { searchAliExpressByText, type AliExpressSearchResult } from "./client";

export type Confidence = "high" | "medium" | "low";

export interface MatchCandidate extends AliExpressSearchResult {
  /** Token-överlapp mot sökorden, 0..1. */
  score: number;
}

export interface ProductMatch {
  wixProductId: string;
  wixProductName: string;
  /** Engelska sökord som användes (Claude-genererade eller override). */
  searchQuery: string;
  /** Bästa träffen, eller null om sökningen gav inget. */
  best: MatchCandidate | null;
  confidence: Confidence;
  /** Alla träffar, poängsorterade (högst först). */
  candidates: MatchCandidate[];
}

// Ord som inte bär matchningssignal: svensk + engelsk marknadsförings-fluff,
// enheter och vanliga fyllnadsord. Tas bort före poängsättning så att t.ex.
// "trådlös ergonomisk mus 4000 dpi" matchar "wireless ergonomic mouse" på de
// betydelsebärande orden.
//
// OBS: tokenize() strippar diakriter FÖRE den slår mot denna lista, så posterna
// måste vara ASCII-foldade ("på" → "pa", "för" → "for", "bästa" → "basta").
const STOPWORDS = new Set([
  // svenska (ASCII-foldade)
  "och", "med", "for", "till", "av", "i", "pa", "den", "det", "en", "ett", "som",
  "pack", "st", "set", "ny", "nytt", "basta", "billig", "billiga", "premium",
  "universal", "hog", "extra", "super", "smart", "mini",
  // engelska
  "the", "and", "with", "for", "of", "to", "in", "on", "new", "best", "pcs",
  "pack", "set", "pro", "max", "plus", "premium", "universal", "high", "mini",
  "portable", "rechargeable", "wireless", "electric", "automatic",
]);

// Enhets-/siffermönster som bär lite signal (t.ex. "4000", "ml", "dpi").
const UNIT_RE = /^\d+(\.\d+)?(ml|l|w|v|dpi|mm|cm|g|kg|mah|ghz|hz|w|°)?$/i;

/** Normaliserar och tokeniserar en sträng till betydelsebärande ord. */
export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diakriter
    .replace(/[^a-z0-9åäö ]+/gi, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .filter((t) => !STOPWORDS.has(t))
    .filter((t) => !UNIT_RE.test(t) || t.length >= 3); // behåll "dpi", släpp "4"
}

/**
 * Poängsätter hur väl en kandidattitel matchar sökorden. Andelen sökord som
 * återfinns i titeln (substring-match så "mouse" matchar "gaming-mouse").
 * 0..1, där 1 = alla sökord finns i titeln.
 */
export function scoreTitleMatch(queryTokens: string[], candidateTitle: string): number {
  if (queryTokens.length === 0) return 0;
  const titleNorm = candidateTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  let hits = 0;
  for (const t of queryTokens) {
    if (titleNorm.includes(t)) hits++;
  }
  return hits / queryTokens.length;
}

/** Klassar en poäng till confidence-nivå. */
export function classifyConfidence(score: number): Confidence {
  if (score >= 0.6) return "high";
  if (score >= 0.35) return "medium";
  return "low";
}

const QUERY_SYSTEM =
  "Du är en e-handelsassistent. Användaren ger ett svenskt produktnamn (ofta " +
  "SEO-optimerat med extra ord). Returnera 3–6 koncisa ENGELSKA sökord som man " +
  "skulle skriva på AliExpress för att hitta exakt denna produkt. Endast " +
  "sökorden, inga citattecken, ingen förklaring, ingen punkt.";

/**
 * Översätter ett svenskt produktnamn till engelska AliExpress-sökord via Claude.
 * temperature 0 för deterministiskt resultat. Trimmar bort ev. citattecken.
 */
export async function buildSearchQuery(productName: string): Promise<string> {
  const out = await runClaude(`Produktnamn: ${productName}`, {
    system: QUERY_SYSTEM,
    maxTokens: 40,
    temperature: 0,
  });
  return out.replace(/^["'\s]+|["'\s.]+$/g, "").trim() || productName;
}

/**
 * Matchar en Wix-produkt mot AliExpress. Bygger sökord (om inget override),
 * söker, poängsätter och returnerar bästa kandidat + confidence.
 *
 * @param queryOverride  hoppa över Claude och använd dessa sökord direkt
 *                       (för test eller manuell omsökning).
 */
export async function matchProduct(
  wixProductId: string,
  wixProductName: string,
  opts: { queryOverride?: string } = {},
): Promise<ProductMatch> {
  const searchQuery = opts.queryOverride ?? (await buildSearchQuery(wixProductName));
  const results = await searchAliExpressByText(searchQuery);

  const qTokens = tokenize(searchQuery);
  const candidates: MatchCandidate[] = results
    .map((r) => ({ ...r, score: scoreTitleMatch(qTokens, r.title) }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0] ?? null;
  return {
    wixProductId,
    wixProductName,
    searchQuery,
    best,
    confidence: classifyConfidence(best?.score ?? 0),
    candidates,
  };
}
