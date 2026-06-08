// Stickprovs-logg för AI-översatta variantvärden (råengelska → svenska).
//
// Bakgrund: LLM-cachen (cache.ts) lagrar bara hash(nyckel) → värde, så råvärdet
// går inte att rekonstruera ur den. För att Leonard ska kunna ÖGNA de
// AI-gissade översättningarna (och fånga fel-men-svenska värden, som
// review-kön inte ser) loggar vi paret HÄR vid översättningstillfället, till en
// egen liten kollektion. Admin-vyn /admin/variant-translations listar dem.
//
// Värde-keyad: id = sha256(råvärde) → en rad per unikt råvärde (senaste svenska
// vinner). Best-effort: får ALDRIG fälla importen.

import { LLM_COLLECTIONS, llmQuery, llmSave } from "./storage";

export interface VariantTranslationRecord {
  /** sha256(raw.trim()) — stabilt id, dedupar per råvärde (senaste sv vinner). */
  id: string;
  /** Engelskt råvärde från AliExpress (verbatim, för displaytrohet). */
  raw: string;
  /** Svenska som AI:n (Haiku) gav. */
  sv: string;
  /** Produkttiteln värdet först sågs i — kontext vid granskning. */
  productTitle?: string;
  /** Alltid "variant-ai" i dag; fält för framtida översättningsvägar. */
  provider: string;
  /** ISO-tid för (senaste) skrivningen. */
  at: string;
}

/**
 * Loggar ETT råvärde→svenska-par. Best-effort — sväljer alla fel (samma
 * kontrakt som cache-skrivningen), så loggningen aldrig kan fälla importen.
 */
export async function logVariantTranslation(rec: VariantTranslationRecord): Promise<void> {
  try {
    await llmSave(
      LLM_COLLECTIONS.variantTranslations,
      rec.id,
      rec as unknown as Record<string, unknown>,
    );
  } catch (e) {
    console.warn(`[variant-log] kunde inte logga "${rec.raw}" -> "${rec.sv}": ${String(e).slice(0, 160)}`);
  }
}

/**
 * Listar loggade AI-översättningar, nyast först. Sorteringen görs även i JS,
 * eftersom memory-backenden (lokalt/test) ignorerar sort i llmQuery — så vyn är
 * nyast-först i BÅDA backends. Returnerar [] om kollektionen saknas (graciöst).
 */
export async function listVariantTranslations(limit = 500): Promise<VariantTranslationRecord[]> {
  const rows = await llmQuery<VariantTranslationRecord>(
    LLM_COLLECTIONS.variantTranslations,
    undefined,
    [{ fieldName: "at", order: "DESC" }],
    limit,
  );
  // ISO-8601 sorterar lexikografiskt == kronologiskt; desc == nyast först.
  return [...rows].sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
}
