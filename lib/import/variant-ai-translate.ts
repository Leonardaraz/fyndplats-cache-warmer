// AI-fallback för variantöversättning (billigaste vägen).
//
// Den statiska tabellen (variant-translations.ts) översätter allt den kan, $0.
// För de RÅVÄRDEN som fortfarande är engelska efter det passet fyller Claude
// (Haiku, billigast) i — EN gång per unikt värde, sedan cachat för alltid.
// Cachen gör översättningen deterministisk, vilket är ett KRAV: i Wix V3 speglar
// choice.name den låsta choice.key:en, så samma råvärde måste alltid ge samma
// svenska (annars driver namnen isär vid omimport).
//
// Kostnadsminimering:
//   1. Tabell först → kända värden (färger/storlekar/…) går ALDRIG till Claude.
//   2. Persistent cache per värde → varje unikt råvärde översätts en gång, någonsin.
//   3. Batchat → alla okända värden för en produkt i ETT Haiku-anrop.
//   4. Routas via completeJsonRouted → ärver daglig budgetcap + Gemini-fallback +
//      failOpen (tomt). Importen fälls ALDRIG; olösta värden faller på tabell/
//      råvärde och flaggas för polering.

import crypto from "node:crypto";
import { completeJsonRouted, TEXT_MODEL } from "../claude/client";
import { getCachedResult, makeCacheKey, setCachedResult } from "../llm/cache";
import { logVariantTranslation } from "../llm/variant-log";
import {
  buildTranslatorFromBase,
  residualEnglishTokens,
  translateAxisName,
  translateValue,
  type VariantTranslator,
} from "./variant-translations";
import type { FeatureFlags } from "./types";

const OP = "variant-translate";

/** Översätter en batch okända råvärden → svenska (råvärde→svenska). Default
 *  anropar Claude/Haiku via routern; injicerbar i test. */
export type TranslateBatchFn = (
  values: string[],
  productTitle?: string,
) => Promise<Record<string, string>>;

export interface AiTranslatorResult {
  translator: VariantTranslator;
  /** Råvärden som förblev (halv-)engelska efter både tabell och AI (AI skippad/
   *  fail/inget svar) → produkten bör flaggas för manuell polering. */
  unresolved: string[];
}

/**
 * Är AI-fallbacken för variantöversättning på? Egen switch, FRIKOPPLAD från
 * AI_ENRICHMENT_ENABLED/qualityMode — den är så billig (tabell+cache först,
 * Haiku, budgetcap) att den får köra även i rå-läget. Explicit
 * flags.translateVariants vinner över env. Default PÅ; env
 * VARIANT_AI_TRANSLATION_ENABLED=false stänger av.
 */
export function variantAiTranslationEnabled(flags?: FeatureFlags): boolean {
  if (typeof flags?.translateVariants === "boolean") return flags.translateVariants;
  return (process.env.VARIANT_AI_TRANSLATION_ENABLED ?? "true").toLowerCase() !== "false";
}

/**
 * Bygger en kollisions-säker variantöversättare där den statiska tabellen
 * kompletteras med Claude-översättningar för de värden tabellen missar.
 * Determinism via per-värde-cache. Returnerar även de värden som förblev olösta
 * (för needsAiPolish-flaggan).
 */
export async function buildVariantTranslatorAI(
  variants: ReadonlyArray<{ options: Record<string, string> }>,
  opts?: { productTitle?: string; translateBatch?: TranslateBatchFn },
): Promise<AiTranslatorResult> {
  const translateBatch = opts?.translateBatch ?? aiTranslateBatch;

  // 1. Unika råvärden över alla axlar.
  const rawValues = new Set<string>();
  for (const v of variants) for (const val of Object.values(v.options ?? {})) rawValues.add(val);

  // 2. Kandidater = värden med kvarvarande engelska efter statisk översättning.
  const candidates = [...rawValues].filter((r) => residualEnglishTokens(r).length > 0);

  // 3. Per-värde-cache: samla träffar, lista missar.
  const aiMap = new Map<string, string>();
  const misses: string[] = [];
  for (const c of candidates) {
    const hit = await getCachedResult<string>(cacheKeyFor(c));
    if (hit && typeof hit.value === "string") aiMap.set(c, hit.value);
    else misses.push(c);
  }

  // 4. Översätt missarna i ETT anrop; cacha varje svar — även oförändrat, vilket
  //    betyder "Claude beslöt att behålla det" (t.ex. modellnamn) → fråga aldrig
  //    igen, och flagga det inte som olöst.
  // Chunka så ETT anrop aldrig blir så stort att svaret trunkeras (patologisk
  // produkt med hundratals unika engelska värden) → bundet utdata per anrop.
  const CHUNK = 50;
  for (let i = 0; i < misses.length; i += CHUNK) {
    const chunk = misses.slice(i, i + CHUNK);
    let translated: Record<string, string> = {};
    try {
      translated = await translateBatch(chunk, opts?.productTitle);
    } catch {
      translated = {}; // en översättnings-miss får ALDRIG fälla importen
    }
    for (const c of chunk) {
      const sv = translated[c];
      if (typeof sv === "string" && sv.trim()) {
        const val = sv.trim();
        aiMap.set(c, val);
        await setCachedResult(cacheKeyFor(c), OP, val, "variant-ai");
        // Stickprovs-logg: BARA genuina översättningar (val !== c). Oförändrade
        // (behållna modellnamn/koder) är ingen fel-svensk-risk → skippas, så
        // listan hålls scanbar. logVariantTranslation är best-effort (sväljer
        // fel) → loggningen kan aldrig fälla importen.
        if (val !== c) {
          await logVariantTranslation({
            id: variantRowId(c),
            raw: c,
            sv: val,
            productTitle: opts?.productTitle,
            provider: "variant-ai",
            at: new Date().toISOString(),
          });
        }
      }
    }
  }

  // 5. Bas: AI-värde om finns, annars statiska tabellen. Kollisions-säkerheten
  //    läggs ovanpå i buildTranslatorFromBase (IDENTISK med synk-vägen).
  const baseValue = (raw: string) => aiMap.get(raw) ?? translateValue(raw);
  const translator = buildTranslatorFromBase(variants, baseValue, translateAxisName);

  // 6. Olösta = kandidater som varken cache eller AI gav ett värde för.
  const unresolved = candidates.filter((c) => !aiMap.has(c));
  return { translator, unresolved };
}

function cacheKeyFor(rawValue: string): string {
  return makeCacheKey({ op: OP, name: rawValue, description: "" });
}

/** Stabilt rad-id för stickprovs-loggen: hashar BARA råvärdet (medvetet frikopplat
 *  från cache-nyckel-formeln, så rad-id:t inte skiftar om den ändras), vilket
 *  dedupar till en rad per unikt engelskt värde. */
function variantRowId(rawValue: string): string {
  return crypto.createHash("sha256").update(rawValue.trim()).digest("hex");
}

/** Default-implementationen: ett batchat Haiku-anrop via routern (budgetcap +
 *  Gemini-fallback). failOpen = tomt → alla värden faller på tabell/råvärde. */
async function aiTranslateBatch(
  values: string[],
  productTitle?: string,
): Promise<Record<string, string>> {
  const system = `Du översätter engelska AliExpress-variantvärden till svenska för en svensk e-handel. Svara ENBART med JSON: {"sv": { "<råvärde>": "<svensk översättning>" }} med EXAKT samma råvärden som nycklar, och ett värde för VARJE råvärde.
Regler:
- Översätt bara riktiga engelska ord till naturlig svenska.
- Lämna koder, modellnamn (t.ex. "iPhone 15 Pro"), mått (cm/mm), storlekar (S/M/L/XL/5XL) och rena siffror OFÖRÄNDRADE — returnera dem som de är.
- Behåll ordning och separatorer (bindestreck/mellanslag).
- Var koncis och konsekvent: samma engelska ord ska alltid ge samma svenska.
- Produktkontext (för att tolka tvetydiga ord som "Spring"): ${productTitle ?? "(okänd)"}.`;
  const user = JSON.stringify(values);
  const res = await completeJsonRouted<{ sv?: Record<string, string> }>({
    system,
    user,
    op: OP,
    model: TEXT_MODEL, // Haiku — billigast
    maxTokens: 700,
    temperature: 0, // deterministiskt: samma råvärde → alltid samma svenska (V3 key-lås)
    cacheKey: null, // vi cachar per värde själva (billigare än per-batch)
    failOpen: { sv: {} },
  });
  return res.sv ?? {};
}
