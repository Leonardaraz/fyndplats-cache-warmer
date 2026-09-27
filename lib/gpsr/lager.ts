// lib/gpsr/lager.ts
//
// Var produktsäkerhetsposterna bor: llm_kv, samlingen FyndplatsGpsr, nycklad
// på Wix-produktens id. Samma lager som variantöversättningarna — en post är
// ett resultat av en modellkörning som ska överleva, inte en cache.
//
// Ingen ny tabell, alltså ingen schemaändring att köra.

import { llmGet, llmQuery, llmSave } from "../llm/storage";
import type { GpsrPost } from "./aosom";

export const GPSR_SAMLING = process.env.WIX_DATA_COL_GPSR ?? "FyndplatsGpsr";

/** Tak för helläsningen. Katalogen har ~5 300 Aosom-produkter. */
const MAX_POSTER = 20_000;

export async function hamtaGpsr(wixProductId: string): Promise<GpsrPost | null> {
  return llmGet<GpsrPost>(GPSR_SAMLING, wixProductId);
}

export async function sparaGpsr(p: GpsrPost): Promise<void> {
  await llmSave(GPSR_SAMLING, p.wixProductId, p as unknown as Record<string, unknown>);
}

/**
 * Alla poster, för fyllningens jämförelse. Ett anrop i stället för ett per
 * produkt. Kastar om taket nås — en avkortad lista hade fått fyllningen att
 * tro att tusentals produkter saknade post och köra om dem alla.
 */
export async function listaGpsr(): Promise<GpsrPost[]> {
  const alla = await llmQuery<GpsrPost>(GPSR_SAMLING, undefined, undefined, MAX_POSTER);
  if (alla.length >= MAX_POSTER) {
    throw new Error(`FyndplatsGpsr nådde läsgränsen ${MAX_POSTER} — höj den innan fyllningen körs.`);
  }
  return alla;
}
