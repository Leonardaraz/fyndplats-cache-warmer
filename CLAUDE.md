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

- Importen gör **noll Claude-anrop** ($0 Anthropic): ingen SEO-text, ingen
  FAQ/flik-generering, ingen kategorisering, ingen Sonnet-bildanalys.
- Produkten skapas ändå komplett i Wix från rå AliExpress-data: **rå titel/
  beskrivning**, deterministisk svensk **variant-översättning** (gratis, via
  `variant-translations.ts`), **prissättning** + **lager** (deterministiskt),
  bilder, EU-lager-ribbon, spec-fliken från råa specs.
- Produkten blir **draft** (`visible:false`) och hamnar i **`/admin/queue`** med
  badgen **"✨ Behöver AI-polering"** (filter-chip finns).
- I kön finns knappen **"✨ Be Claude i chatten att polera"** → kopierar
  produkt-info + Wix-ID till urklipp. Klistra in i Cowork-chatten och säg
  *"polera denna"* så skriver Claude SEO/beskrivning/FAQ/kategori gratis i chatten
  istället för via betald API-pipeline.

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
