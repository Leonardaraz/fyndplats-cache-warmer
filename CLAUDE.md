# Fyndplats cache-warmer — projektanvisningar

## Utvecklingsrutin: AUDIT FÖRE MERGE (obligatoriskt)

Innan en PR mergas **SKA** dess diff auditeras och fynden rapporteras till Leonard
— korrekthet, edge-cases, regressioner och säkerhet. Merga först när granskningen
är ren, eller efter att fynden åtgärdats. Detta gäller **varje** PR, utan undantag
(även små/triviala ändringar). Bakgrund: en oauditerad merge (#97) införde en
regression som bröt alla imports — därför är detta en hård grind.

## Import-arbetsflöde & AI-kostnad (`AI_ENRICHMENT_ENABLED`)

Import-pipelinen (`lib/import/pipeline.ts → importProduct`) kan köras i två lägen.
Master-switchen är env-variabeln **`AI_ENRICHMENT_ENABLED`** (default `true`).

### Default-läge: RÅ import → polera via chatten (GRATIS)

Sätt `AI_ENRICHMENT_ENABLED=false` i Vercel (production). Då:

- Importen gör **inga dyra Claude-anrop** (ingen SEO-text, FAQ/flik-generering,
  kategorisering eller Sonnet-bildanalys). Undantag: **variantöversättningen** har
  en egen, billig AI-fallback — se nästa avsnitt (kan stängas av för hård $0).
- Produkten skapas ändå komplett i Wix från rå AliExpress-data: **rå titel/
  beskrivning**, svensk **variant-översättning** (statisk tabell + ev. cachad
  Haiku-fallback, via `variant-translations.ts` / `variant-ai-translate.ts`),
  **prissättning** + **lager** (deterministiskt), bilder, EU-lager-ribbon,
  spec-fliken från råa specs.
- Produkten blir **draft** (`visible:false`) och hamnar i **`/admin/queue`** med
  badgen **"✨ Behöver AI-polering"** (filter-chip finns).
- I kön finns knappen **"✨ Be Claude i chatten att polera"** → kopierar
  produkt-info + Wix-ID till urklipp. Klistra in i Cowork-chatten och säg
  *"polera denna"* så skriver Claude SEO/beskrivning/FAQ/kategori gratis i chatten
  istället för via betald API-pipeline.

### Variantöversättning: tabell → cache → Haiku (egen switch `VARIANT_AI_TRANSLATION_ENABLED`)

Variantvärden (t.ex. "Warm White", "100 inch") översätts till svenska FRÅN START
vid import — viktigt, för i Wix V3 speglar `choice.name` den låsta `choice.key`:en,
så värden kan inte döpas om i efterhand. Tre lager (`lib/import/variant-ai-translate.ts`):

1. **Statisk tabell** (`variant-translations.ts`, $0): golden-testad, auktoritativ.
2. **AI-fallback** (Haiku, default PÅ): bara för värden tabellen missar, **ett**
   batchat anrop per produkt, **cachat per värde för alltid** (→ nära $0; samma
   råvärde översätts en gång, någonsin). Routas via `completeJsonRouted` → ärver
   daglig budgetcap + Gemini-fallback + `failOpen` (importen fälls aldrig).
3. **Olösta värden** (AI av/fail/kvarvarande engelska) → produkten flaggas
   `needsAiPolish` och hamnar i poleringskön i stället för att nå kunden halv-engelsk.

Switchen är **`VARIANT_AI_TRANSLATION_ENABLED`** (default `true`), FRIKOPPLAD från
`AI_ENRICHMENT_ENABLED` — variantöversättningen kör alltså även i rå-läget (billig +
cachad). Sätt `=false` för hård $0 på varianter (svansen lämnas då engelsk + flaggas
för polering). Explicit `flags.translateVariants` vinner över env. Beslutspunkt:
`variantAiTranslationEnabled(flags)`. Golden-testet i `variant-translations.test.ts`
låser kända/fäll-fixade översättningar i CI.

### Bulk-läge: AI-berikning PÅ (kostar Anthropic-credits)

När du vill köra en riktig AI-batch:

1. Sätt `AI_ENRICHMENT_ENABLED=true` i Vercel (eller ta bort variabeln — default är på).
2. Kör batch-/bulk-importen.
3. Sätt tillbaka `AI_ENRICHMENT_ENABLED=false` när batchen är klar.

Alternativt, utan att röra env: anropa pipelinen med `flags.enableAI: true` per
import (t.ex. en admin "kör AI-batch"-knapp). **Explicit `flags.enableAI` vinner
alltid över env-flaggan** — `true` tvingar PÅ trots env=false, `false` tvingar AV
trots env=true. Flaggan är default men inte hård (`aiEnrichmentEnabled()`).

### Var det gatas

`aiEnrichmentEnabled(flags)` i `lib/import/pipeline.ts` är enda beslutspunkten.
När AI är av: `runSeo/runImageAnalysis/runCategory/batched` blir alla `false`,
`importProduct` returnerar `needsAiPolish:true`, och `lib/bulk-import/worker.ts`
tvingar realtidsvägen (ingen Batch API-pre-generering som annars kostar).

Övriga LLM-/kostnads-env-variabler dokumenteras i **`LLM-CONFIG.md`**.
