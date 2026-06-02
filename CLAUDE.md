# Fyndplats cache-warmer — projektanvisningar

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
- Produkten blir en **draft i Wix** (osynlig i butiken) via det existerande
  draft-default-beteendet (`IMPORT_DRAFT_DEFAULT`) — inga extra UI-ändringar i
  `/admin/queue` behövs.

**Poleringsflöde (gratis):** Leonard säger *"polera produkten X"* i Cowork-chatten
→ Claude skriver svensk SEO-titel/beskrivning/FAQ/kategori och uppdaterar Wix-
produkten direkt via **Wix MCP** (eller admin). Kostnaden hamnar i chatt-sessionen,
inte i den betalda import-API-pipelinen.

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
När AI är av: `runSeo/runImageAnalysis/runCategory/batched` blir alla `false`
(rå titel/beskrivning via `buildFallbackSeo`, okategoriserad, spec-flik ur råa
specs), och `lib/bulk-import/worker.ts` tvingar realtidsvägen (ingen Batch
API-pre-generering som annars kostar).

Övriga LLM-/kostnads-env-variabler dokumenteras i **`LLM-CONFIG.md`**.
