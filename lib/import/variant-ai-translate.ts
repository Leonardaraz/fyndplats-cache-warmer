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
  axisNameUnresolved,
  buildTranslatorFromBase,
  inferMislabeledColorAxis,
  normalizeUnits,
  residualEnglishTokens,
  stripLeadingSupplierCode,
  translateAxisName,
  translateValue,
  unresolvedAxisNames,
  type VariantTranslator,
} from "./variant-translations";
import type { FeatureFlags } from "./types";

// Bumpad 2026-06-20 (variant-translate → -2): re-översätt cachade hopmashade
// compound-svar ("WhitePortable" → "vitBärbar") med den förbättrade prompten nedan.
// Cachen är per RÅVÄRDE; utan bumpen returnerar en cache-träff det gamla mashade
// svaret för alltid (det är en "betrodd" översättning, ≠ eko → självläker aldrig).
const OP = "variant-translate-2";
const AXIS_OP = "variant-axis-name";
// Bumpad 2026-07-02 (variant-verify-sv → -2): re-pröva cachade "ok"-domslut med den
// härdade prompten (Sångarbracket-incidenten: en blandspråks-sammansättning med en
// engelsk orddel INUTI ordet passerade grinden och bakades in i ett key-låst
// variantvärde). Per-slutvärde-cachen fylls om till ≈$0 (mest "Röd"/"Svart"-repriser).
const VERIFY_OP = "variant-verify-sv-2";

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

/** SVENSKHETS-GRINDEN: bedömer vilka av de SLUTLIGA (skeppningsklara) värdena
 *  som INTE är naturlig svenska. Returnerar delmängden icke-svenska, eller
 *  null vid fel (skiljs från äkta tom lista så ett transient fel ALDRIG cachas
 *  som "ok"). Default anropar Claude/Haiku via routern; injicerbar i test. */
export type VerifySwedishFn = (
  values: string[],
  productTitle?: string,
) => Promise<string[] | null>;

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
  opts?: {
    productTitle?: string;
    translateBatch?: TranslateBatchFn;
    nameAxes?: NameAxesFn;
    verifySwedish?: VerifySwedishFn;
  },
): Promise<AiTranslatorResult> {
  const translateBatch = opts?.translateBatch ?? aiTranslateBatch;

  // 1. Unika råvärden över alla axlar.
  const rawValues = new Set<string>();
  for (const v of variants) for (const val of Object.values(v.options ?? {})) rawValues.add(val);

  // 2. Kandidater = värden med kvarvarande engelska efter statisk översättning.
  const candidates = [...rawValues].filter((r) => residualEnglishTokens(r).length > 0);

  // 3. Per-värde-cache: samla träffar, lista missar. SJÄLVLÄKNING: en cachad
  //    eko-post utan siffror som fortfarande är (halv-)engelsk är FÖRGIFTAD
  //    (Haiku ekade ett vanligt ord, t.ex. "Rear Wheel" 2026-06-09) → behandla
  //    som MISS så värdet re-frågas denna import och cachen skrivs över när AI
  //    svarar svenska. En svensk träff (svar ≠ råvärde) är alltid betrodd.
  const aiMap = new Map<string, string>();
  const misses: string[] = [];
  for (const c of candidates) {
    const hit = await getCachedResult<string>(cacheKeyFor(c));
    if (hit && typeof hit.value === "string" && !isUntrustedEcho(c, hit.value)) {
      aiMap.set(c, hit.value);
    } else {
      misses.push(c);
    }
  }

  // 4. Översätt missarna i ETT anrop; cacha varje svar — även oförändrat (=
  //    "Claude beslöt att behålla det"). Men BETRO ekot bara för koder/modell-
  //    namn (innehåller siffror); ett rent-ord-eko är ett misslyckat svar →
  //    olöst (flaggas) och re-frågas vid nästa import (cachen = refresh-markör).
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
        // Cacha ALLTID svaret (även eko): vid envist eko refreshas posten och
        // re-ask:en förblir EN batchad fråga per import (bounded kostnad).
        await setCachedResult(cacheKeyFor(c), OP, val, "variant-ai");
        if (isUntrustedEcho(c, val)) continue; // rent-ord-eko = misslyckat → olöst
        aiMap.set(c, val);
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

  // 4b. Axel-naming: AI ger rätt svenskt axelnamn för (a) en "Color"-axel vars
  //     värden varken är färger eller en känd deterministisk klass (felmärkt), och
  //     (b) en axel vars namn fortfarande är rå engelska (tabell-miss). Cachat per
  //     axel+värdemängd, samma budget/fail-open som värde-AI:n. AI kan "rädda"
  //     exotiska färger → "Färg" (ingen override). Lyckas AI inte / ekar → axeln
  //     hamnar i unresolved (flaggar produkten) via slutpassen nedan.
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
  // No-op-ASYMMETRIN: ett ekat VÄRDE med siffror = "behållet med flit" (kod/
  // modellnamn, löst via isUntrustedEcho), men ett rent-ord-eko och ett ekat/
  // odugligt AXELNAMN är OLÖST och får aldrig nå kund. applyAxisName kapslar in
  // det: för en färg-axel är "Färg" = "det ÄR färger" (löst), ett riktigt svenskt
  // klassnamn = override, allt annat (tomt/eko/färg-aktigt) = kunde ej omklassa →
  // flagga; för ett engelskt namn = översätt (override), annars flaggar slutpassen.
  const applyAxisName = (axis: string, current: string, name: string | undefined) => {
    if (current === "Färg") {
      if (name === "Färg") return; // AI: "det ÄR färger" → behåll Färg (löst)
      if (name && name !== axis.trim() && !/\bcolou?rs?\b/.test(name.toLowerCase())) {
        axisOverrides.set(axis, name); // riktig svensk omklassning
      } else {
        unresolvedAxes.push(axis); // tomt/eko/färg-aktigt → kunde ej omklassa → flagga
      }
    } else if (name && name !== current.trim()) {
      axisOverrides.set(axis, name); // engelskt namn översatt (≠ rå-namnet)
    }
    // engelskt namn + tomt/eko → namnet stannar engelskt → slutpassen (LAYER C) flaggar
  };
  const suspectAxes: { axis: string; values: string[] }[] = [];
  for (const [axis, vals] of valuesByAxis) {
    const current = translateAxisName(axis);
    const colorish = current === "Färg";
    const englishName = axisNameUnresolved(axis, current); // tabell-miss, kvar engelska
    if (!colorish && !englishName) continue; // rent svenskt icke-färg-namn → klart
    if (colorish) {
      if (isColorAxis(vals)) continue; // riktiga färger → ok
      if (inferMislabeledColorAxis(vals)) continue; // känd klass → deterministiskt (gratis)
    }
    const hit = await getCachedResult<string>(axisCacheKeyFor(axis, vals));
    if (hit && typeof hit.value === "string") {
      applyAxisName(axis, current, hit.value.trim());
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
      if (name) await setCachedResult(axisCacheKeyFor(axis, values), AXIS_OP, name, "variant-ai");
      applyAxisName(axis, translateAxisName(axis), name);
    }
  }

  // 5. Bas: AI-värde om finns, annars statiska tabellen. Kollisions-säkerheten +
  //    ev. AI-axelnamn läggs ovanpå i buildTranslatorFromBase (IDENTISK med synk).
  //
  // STALE-EKO-SKYDD (2026-06-26): en cachad AI-post som bara EKAR råvärdet (AI
  // behöll det oförändrat — betrott pga siffror i koden) får INTE blockera den
  // deterministiska tabellens nya leverantörskod-stripp. Utan detta returnerar en
  // pre-stripp-cache "AE-FW-T2233-USB Plug" för alltid (ekot är "betrott", ≠
  // self-healing-fall) och kringgår translateValue. Gäller bara EKO-poster vars
  // råvärde har en strippbar kod → äkta AI-översättningar (svar ≠ råvärde, t.ex.
  // "Bakhjul") behålls oförändrat.
  const baseValue = (raw: string) => {
    const ai = aiMap.get(raw);
    if (ai !== undefined && ai.trim() === raw.trim() && stripLeadingSupplierCode(raw) !== raw) {
      return translateValue(raw);
    }
    // ENHETS-EFTERBEHANDLING (backdrop-stativet 2026-07-02): Haiku översätter
    // orden men bevarar mått ordagrant ("Stand base 6.5x10FT" → "Stativbas
    // 6.5x10ft") → AI-vägen kringgick ft→m/inch→tum och enheten key-låstes i
    // Wix. Kör därför AI-svaret genom normalizeUnits — nummer-ankrad och
    // idempotent på redan-svenska värden, så även CACHADE svar självläker vid
    // nästa import utan cache-bump eller nytt AI-anrop.
    return ai !== undefined ? normalizeUnits(ai) : translateValue(raw);
  };
  const translator = buildTranslatorFromBase(variants, baseValue, translateAxisName, axisOverrides);

  // 6. Olösta = (halv-)engelska värden + felmärkta färg-axlar AI inte kunde namnge
  //    + axlar vars SLUTNAMN ändå förblev rå engelska (unresolvedAxisNames →
  //    skyddsnät: AI av/fel/ekade). Dedupar så en axel aldrig listas dubbelt.
  // HALVÖVERSÄTTNINGAR (buffévärmaren 2026-06-09: "Silvery 4pcs" → "Silvery 4st"):
  // ett AI-svar som SKILJER sig från råvärdet är inget eko, men kan ändå BEHÅLLA
  // någon av råvärdets engelska tokens ("Silvery"). Svaret ANVÄNDS (bättre än
  // rått) men produkten FLAGGAS — annars skeppas halv-engelska tyst till kund.
  // OBS: vi jämför mot RÅVÄRDETS residual-tokens, inte svarets — att köra
  // residual-checken på SVARET skulle falsk-flagga äkta svenska ord som inte är
  // tabellnycklar ("Glöd"). Eko-fall undantas (styrs av isUntrustedEcho: betrodda
  // siffer-ekon flaggas inte). Modellnamns-svar ("iPhone Blå" behåller "iPhone")
  // kan ge falsk flagga → accepterat köbrus; badgen visar vilka.
  const halfTranslated = candidates.filter((c) => {
    const a = aiMap.get(c);
    if (a === undefined) return false;
    if (a.trim().toLowerCase() === c.trim().toLowerCase()) return false; // eko → eko-policyn
    // Splitta svaret på ALLT icke-alfanumeriskt (audit S1): "Shimmer, låda"/"Shimmer/låda"
    // ska fånga behållna "Shimmer" precis som "Shimmer låda" — interpunktion får
    // inte gömma ett kvarhållet engelskt ord.
    const answerTokens = new Set(a.toLowerCase().split(/[^\p{L}\p{N}]+/u));
    return residualEnglishTokens(c).some((tok) => answerTokens.has(tok.toLowerCase()));
  });
  // 7. SVENSKHETS-GRIND (Leonards direktiv 2026-06-09: "verktyget ska SJÄLVT
  //    känna av när det inte är svenska"): verifiera de FAKTISKA värden/axelnamn
  //    som skeppas — fångar kategoriskt det heuristiken missar (VERSAL-engelska
  //    som "STRIPED", exotiska AE-former, framtida okända klasser). Cachat per
  //    slutvärde (30 d TTL; mest "Röd"/"Svart"-repriser → ≈$0), ETT batchat
  //    Haiku-anrop för missarna, fail-open (null = inget cachas, inget flaggas —
  //    heuristik-lagren ovan förblir golvet). Flaggade SLUTVÄRDEN läggs i
  //    unresolved (badgen visar dem ordagrant).
  const verifySwedish = opts?.verifySwedish ?? aiVerifySwedish;
  const finals = new Set<string>();
  for (const v of variants)
    for (const val of Object.values(translator.options(v.options ?? {}))) finals.add(val);
  for (const name of translator.axisNames.values()) finals.add(name);
  // Bara strängar med något 3+-bokstavsord kan språkbedömas — mått/koder/siffror
  // ("3,6 x 3,6 m", "KM-6631", "5XL") är språkneutrala och skickas aldrig.
  const verifiable = [...finals].filter((f) => /[A-Za-zÅÄÖåäö]{3,}/.test(f));
  const gateFlagged: string[] = [];
  const verifyMisses: string[] = [];
  for (const f of verifiable) {
    const hit = await getCachedResult<string>(verifyKeyFor(f));
    if (hit && typeof hit.value === "string") {
      if (hit.value === "flag") gateFlagged.push(f);
    } else {
      verifyMisses.push(f);
    }
  }
  for (let i = 0; i < verifyMisses.length; i += CHUNK) {
    const chunk = verifyMisses.slice(i, i + CHUNK);
    let notSwedish: string[] | null = null;
    try {
      notSwedish = await verifySwedish(chunk, opts?.productTitle);
    } catch {
      notSwedish = null; // grinden får ALDRIG fälla importen
    }
    if (notSwedish === null) continue; // fel → cacha INGET (annars blir transienta fel "ok")
    const bad = new Set(notSwedish.map((s) => s.trim()));
    for (const f of chunk) {
      const verdict = bad.has(f.trim()) ? "flag" : "ok";
      await setCachedResult(verifyKeyFor(f), VERIFY_OP, verdict, "variant-ai");
      if (verdict === "flag") gateFlagged.push(f);
    }
  }

  const unresolved = [
    ...new Set(
      candidates
        .filter((c) => !aiMap.has(c))
        .concat(halfTranslated)
        .concat(unresolvedAxes)
        .concat(unresolvedAxisNames(translator))
        .concat(gateFlagged),
    ),
  ];
  return { translator, unresolved };
}

function cacheKeyFor(rawValue: string): string {
  return makeCacheKey({ op: OP, name: rawValue, description: "" });
}

/** Cache-nyckel per SLUTVÄRDE för svenskhets-grinden ("ok"/"flag", 30 d TTL). */
function verifyKeyFor(finalValue: string): string {
  return makeCacheKey({ op: VERIFY_OP, name: finalValue, description: "" });
}

/** Default-implementationen av svenskhets-grinden: ett Haiku-anrop som pekar ut
 *  vilka skeppningsklara strängar som INTE är naturlig svenska. null vid fel. */
async function aiVerifySwedish(
  values: string[],
  productTitle?: string,
): Promise<string[] | null> {
  const system = `Du kvalitetsgranskar variantvärden för en SVENSK e-handel. Avgör för varje sträng om den är NATURLIG SVENSKA eller språkneutral (mått, koder, modellnamn, siffror, vedertagna lånord som LED/USB/Smart/Premium). Engelska ord ("Wheel", "STRIPED", "Rear", "Silvery") är INTE svenska — även i versaler eller mitt i en sträng.
Tre extra fall som ALDRIG är naturlig svenska och som du MÅSTE flagga: (a) två ord hopmashade utan mellanslag, ofta camelCase ("vitBärbar", "svartaDominostenar", "vitKinesiskBärbar"); (b) ett ord hopklistrat med ett ordningstal ("Type1", "Mode2", "Modell2"); (c) blandspråks-sammansättningar där en svensk och en engelsk orddel skrivits ihop till ETT ord ("Sångarbracket", "Fjäderclamp", "Väggmount") — en engelsk orddel INUTI ett sammansatt ord gör hela strängen icke-svensk, även när ordet vid första anblick ser svenskt ut. Äkta koder/modellnamn med versaler eller siffror inuti ("KM-6631", "USB3", "iPhone 15", "B6AC") är språkneutrala och flaggas INTE.
Svara ENBART JSON: {"notSwedish": ["<exakt sträng>", ...]} — EXAKT de inskickade strängar som INTE är naturlig svenska. Tom lista om alla är ok.
Produktkontext: ${productTitle ?? "(okänd)"}.`;
  try {
    const res = await completeJsonRouted<{ notSwedish?: string[] }>({
      system,
      user: JSON.stringify(values),
      op: VERIFY_OP,
      model: TEXT_MODEL,
      maxTokens: 500,
      temperature: 0,
      cacheKey: null, // vi cachar per slutvärde själva
      // INGEN failOpen: total-fail ska KASTA så grinden returnerar null och
      // inget cachas (annars skulle ett transient fel bli permanent "ok").
    });
    return Array.isArray(res.notSwedish) ? res.notSwedish : [];
  } catch {
    return null;
  }
}

/** Eko-asymmetrins VÄRDE-regel (incident 2026-06-09 "Rear Wheel"): ett AI-eko
 *  (svar === råvärde) är betrott BARA när råvärdet innehåller en siffra — äkta
 *  koder/modellnamn har det ("KM-6631", "iPhone 15 Pro", "B6AC"). Ett rent
 *  alfabetiskt eko som fortfarande har engelska tokens ("Rear Wheel", "Fork")
 *  är ett misslyckat svar → olöst + re-ask vid cache-träff. Delas av steg 3
 *  (cache-träff) och steg 4 (färskt svar) så bedömningen aldrig glider isär. */
function isUntrustedEcho(raw: string, answer: string): boolean {
  // Skiftlägesokänslig eko-detektering (audit S3): "Rear wheel" för råvärdet
  // "Rear Wheel" är ETT EKO, inte en översättning — annars skulle ett case-
  // normaliserat eko betros, cachas som "översatt" och ALDRIG självläka
  // (framtida träffar ≠ råvärdet) = exakt incident-hålet fast permanent.
  if (answer.trim().toLowerCase() !== raw.trim().toLowerCase()) return false; // riktig översättning
  if (/\d/.test(raw)) return false; // siffra → kod/modell → betrott eko
  return residualEnglishTokens(raw).length > 0; // rena ord, kvar-engelska
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
- Behåll ett värde OFÖRÄNDRAT BARA om det innehåller siffror eller är en uppenbar märkes-/modellbeteckning: koder ("KM-6631", "B6AC"), modellnamn med siffror ("iPhone 15 Pro"), mått (cm/mm), storlekar (S/M/L/XL/5XL) och rena siffror.
- Vanliga engelska substantiv och adjektiv ("Rear Wheel", "Fork", "Glow", "Vertical Type") är ALDRIG modellnamn — de MÅSTE översättas till naturlig svenska ("Bakhjul", "Gaffel", "Glöd", "Vertikal").
- Är råvärdet HOPSKRIVET eller camelCase ("WhitePortable", "BlackDominoes", "WhiteChinesePortable") → dela upp i ord och svara med naturlig svenska MED mellanslag ("Vit bärbar", "Svarta dominobrickor", "Vit kinesisk bärbar"). ALDRIG hopmashat utan mellanslag ("vitBärbar").
- Blanda ALDRIG språk i samma ord: en svensk och en engelsk orddel får inte skrivas ihop ("Sångarbracket", "Fjäderclamp" är FEL). Varje ord i svaret ska vara antingen riktig svenska eller ett avsiktligt behållet kod-/modellnamn.
- Hittar du ingen säker svensk översättning av ett ord → behåll HELA värdet exakt oförändrat (det flaggas då för manuell granskning; ett oförändrat värde är alltid bättre än en gissning).
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

/** Default-implementationen: ett Haiku-anrop som föreslår rätt svenskt axelnamn —
 *  för felmärkta "Color"-axlar OCH för axlar med kvarvarande engelskt namn.
 *  failOpen = tomt → namnet behålls och axeln flaggas för polering. */
async function aiNameAxes(
  axes: { axis: string; values: string[] }[],
  productTitle?: string,
): Promise<Record<string, string>> {
  const system = `En svensk e-handel importerar AliExpress-produkter. Ge det KORREKTA svenska AXELNAMNET (ETT enda ord) för en variant-axel, utifrån axelns engelska namn OCH dess värden. Två typfall: (a) säljaren döpte axeln till "Color" men värdena är INTE färger (storlek/material/modell/kontakt/antal m.m. ligger under färg-fältet), eller (b) axelnamnet är engelska och behöver översättas.
Regler:
- Om värdena FAKTISKT är färger (även ovanliga som Champagne/Ivory/Graphite) → svara "Färg".
- Annars: om axelnamnet är ett vanligt engelskt attribut, översätt det ("Lighting Mode" → "Ljusläge"). Stämmer namnet inte med värdena, namnge utifrån värdena i stället.
- Välj ett kort, passande svenskt namn: Storlek, Material, Modell, Kontakt, Antal, Volym, Effekt, Mönster, Stil, Längd, Typ, Smak, Doft …
- Svara ENBART JSON: {"names": { "<axelnamn>": "<svenskt namn>" }} med EXAKT samma (engelska rå-)axelnamn som nycklar.
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
