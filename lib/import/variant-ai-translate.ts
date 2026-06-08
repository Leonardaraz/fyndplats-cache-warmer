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
import { isColorAxis } from "./color-match";
import {
  buildTranslatorFromBase,
  inferMislabeledColorAxis,
  residualEnglishTokens,
  translateAxisName,
  translateValue,
  type VariantTranslator,
} from "./variant-translations";
import type { FeatureFlags } from "./types";

const OP = "variant-translate";
const AXIS_OP = "variant-axis-name";

/** Översätter en batch okända råvärden → svenska (råvärde→svenska). Default
 *  anropar Claude/Haiku via routern; injicerbar i test. */
export type TranslateBatchFn = (
  values: string[],
  productTitle?: string,
) => Promise<Record<string, string>>;

/** Föreslår rätt svenskt AXELNAMN för felmärkta "Color"-axlar (rå-axel→svenska).
 *  Default anropar Claude/Haiku via routern; injicerbar i test. */
export type NameAxesFn = (
  axes: { axis: string; values: string[] }[],
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
  opts?: { productTitle?: string; translateBatch?: TranslateBatchFn; nameAxes?: NameAxesFn },
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
        // Stickprovs-logg: BARA genuina översättningar (val skiljer sig från
        // råvärdet). Oförändrade (behållna modellnamn/koder) är ingen
        // fel-svensk-risk → skippas, så listan hålls scanbar. Jämför mot c.trim()
        // (samma normalisering som variantRowId) så ett ev. blanksteg inte gör
        // ett no-op till en "översättning". logVariantTranslation är best-effort
        // (sväljer fel) → loggningen kan aldrig fälla importen.
        if (val !== c.trim()) {
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

  // 4b. Axel-naming: en "Color"-axel vars värden varken är färger eller en känd
  //     deterministisk klass är felmärkt. Låt AI föreslå rätt svenskt axelnamn
  //     (cachat per axel+värdemängd, samma budget/fail-open som värde-AI:n). AI kan
  //     även "rädda" exotiska färger ordlistan missar → svarar "Färg" (ingen
  //     override). Lyckas AI inte → axeln läggs i unresolved (flaggar produkten).
  const nameAxes = opts?.nameAxes ?? aiNameAxes;
  const valuesByAxis = new Map<string, string[]>();
  for (const v of variants)
    for (const [axis, val] of Object.entries(v.options ?? {})) {
      const arr = valuesByAxis.get(axis) ?? [];
      if (!arr.includes(val)) arr.push(val);
      valuesByAxis.set(axis, arr);
    }
  const axisOverrides = new Map<string, string>();
  const unresolvedAxes: string[] = [];
  const suspectAxes: { axis: string; values: string[] }[] = [];
  for (const [axis, vals] of valuesByAxis) {
    if (translateAxisName(axis) !== "Färg") continue; // bara "Color"-axlar
    if (isColorAxis(vals)) continue; // riktiga färger → ok
    if (inferMislabeledColorAxis(vals)) continue; // känd klass → deterministiskt (gratis)
    const hit = await getCachedResult<string>(axisCacheKeyFor(axis, vals));
    if (hit && typeof hit.value === "string") {
      if (hit.value && hit.value !== "Färg") axisOverrides.set(axis, hit.value);
      continue;
    }
    suspectAxes.push({ axis, values: vals });
  }
  if (suspectAxes.length > 0) {
    let named: Record<string, string> = {};
    try {
      named = await nameAxes(suspectAxes, opts?.productTitle);
    } catch {
      named = {}; // namngivnings-miss får ALDRIG fälla importen
    }
    for (const { axis, values } of suspectAxes) {
      const name = named[axis]?.trim();
      if (name) {
        await setCachedResult(axisCacheKeyFor(axis, values), AXIS_OP, name, "variant-ai");
        if (name !== "Färg") axisOverrides.set(axis, name);
      } else {
        unresolvedAxes.push(axis); // AI kunde inte namnge → flagga produkten för polering
      }
    }
  }

  // 5. Bas: AI-värde om finns, annars statiska tabellen. Kollisions-säkerheten +
  //    ev. AI-axelnamn läggs ovanpå i buildTranslatorFromBase (IDENTISK med synk).
  const baseValue = (raw: string) => aiMap.get(raw) ?? translateValue(raw);
  const translator = buildTranslatorFromBase(variants, baseValue, translateAxisName, axisOverrides);

  // 6. Olösta = värden + ev. axlar AI inte kunde namnge → needsAiPolish-flaggan.
  const unresolved = candidates.filter((c) => !aiMap.has(c)).concat(unresolvedAxes);
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

/** Cache-nyckel per axel + värdemängd (sorterad → ordnings-oberoende), så samma
 *  felmärkta "Color"-axel namnges en gång, någonsin. */
function axisCacheKeyFor(axis: string, values: ReadonlyArray<string>): string {
  const sig = [...values].map((v) => v.trim()).sort().join("|");
  return makeCacheKey({ op: AXIS_OP, name: axis, description: sig });
}

/** Default-implementationen: ett Haiku-anrop som föreslår rätt svenskt axelnamn
 *  för felmärkta "Color"-axlar. failOpen = tomt → axeln behålls som "Färg" och
 *  flaggas för polering. */
async function aiNameAxes(
  axes: { axis: string; values: string[] }[],
  productTitle?: string,
): Promise<Record<string, string>> {
  const system = `En svensk e-handel importerar AliExpress-produkter. En variant-axel som säljaren döpt till "Color" innehåller ofta INTE färger — säljare lägger storlek, material, modell, kontakt-typ, antal m.m. under färg-fältet. Ge det KORREKTA svenska axelnamnet (ETT enda ord) utifrån värdena.
Regler:
- Om värdena FAKTISKT är färger (även ovanliga som Champagne/Ivory/Graphite) → svara "Färg".
- Annars välj ett kort, passande svenskt namn: Storlek, Material, Modell, Kontakt, Antal, Volym, Effekt, Mönster, Stil, Längd, Typ, Smak, Doft …
- Svara ENBART JSON: {"names": { "<axelnamn>": "<svenskt namn>" }} med EXAKT samma axelnamn som nycklar.
- Produktkontext (för att tolka tvetydiga värden): ${productTitle ?? "(okänd)"}.`;
  const user = JSON.stringify(axes.map((a) => ({ axel: a.axis, värden: a.values })));
  const res = await completeJsonRouted<{ names?: Record<string, string> }>({
    system,
    user,
    op: AXIS_OP,
    model: TEXT_MODEL, // Haiku — billigast
    maxTokens: 120,
    temperature: 0, // deterministiskt: samma axel+värden → alltid samma namn
    cacheKey: null, // vi cachar per axel själva
    failOpen: { names: {} },
  });
  return res.names ?? {};
}
