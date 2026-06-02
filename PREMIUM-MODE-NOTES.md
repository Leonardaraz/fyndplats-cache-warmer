# Premium quality mode (AI_QUALITY_MODE) — runbook

"10/10-läge" för import-pipelinen. Tre lägen, valbara **per import** (extension-dropdown)
eller globalt via env `AI_QUALITY_MODE` (default `standard`).

| Läge | Kostnad/produkt | Vad körs | Status efter import |
|------|-----------------|----------|---------------------|
| `raw` | 0 öre | Inga Claude-anrop. Rå AliExpress-data + deterministisk variant-översättning. | draft (manuell polering) |
| `standard` | ~10,5 öre | Batchat Haiku (SEO+kategori+flikar) + Sonnet bildanalys. | draft |
| `premium` | ~75–100 öre | Opus multi-pass + Sonnet vision-ranking + kvalitets-judge. | **publiceras direkt** vid judge ≥ 9,5 |

## Vad premium gör (komponent för komponent)

1. **Beskrivning — Opus multi-pass self-critique** (`lib/import/generate-premium.ts`)
   draft → en annan Opus-call kritiserar (generiskt? USP? hook? känsla?) → omskrivning.
2. **Brand voice + few-shot** (`lib/claude/brand-voice.ts` + `brand-voice-examples.json`)
   Stabil system-prompt-prefix (spec + guldexempel) som **alla** premium-text-anrop delar
   byte-identiskt → cachas av Anthropic prompt caching.
3. **Bildranking — Sonnet vision** (`lib/import/image-rank.ts`)
   Scorar lifestyle/vit-bg/skärpa/features, väljer 6–8 bästa, ordnar hero→lifestyle→detalj→storlek.
4. **FAQ — context-aware** (`lib/import/faq-gen.ts`)
   Opus läser beskrivning + kategori + skrapade AE-recensioner → 5–7 frågor kunder faktiskt ställer.
5. **SEO-meta — A/B mot 3 varianter** (`lib/import/seo-gen.ts`)
   3 meta-descriptions (140–155 tecken), judge väljer högst CTR.
6. **Kvalitets-judge med strikt grind** (`lib/import/quality-judge.ts`)
   Betyg 1–10. <9,5 → en extra Opus-förfining + ny judge. Fortfarande <9,5 → flaggas
   `needsManualPolish` (publiceras INTE, men är ändå rikare än standard).

Orkestreringen: `lib/import/premium-pipeline.ts`. Inkoppling: `lib/import/pipeline.ts`
(`resolveQualityMode` → premium-gren + vision-ranking + publish-beslut). Lägesväljaren
i `lib/import/quality-mode.ts` är bakåtkompatibel med `enableAI` / `AI_ENRICHMENT_ENABLED`.

## Env-flaggor

| Flagga | Default | Funktion |
|--------|---------|----------|
| `AI_QUALITY_MODE` | `standard` | global default (`raw`/`standard`/`premium`) |
| `CLAUDE_PREMIUM_MODEL` | `claude-opus-4-6` | text-modell för premium |
| `CLAUDE_PREMIUM_VISION_MODEL` | `claude-sonnet-4-5` | vision-modell för bildranking |
| `CLAUDE_SEO_META_MODEL` | Haiku | modell för SEO-meta-A/B (kort output → billig) |
| `PREMIUM_QUALITY_THRESHOLD` | `9.5` | judge-grind för auto-publicering |
| `PREMIUM_IMAGE_MAX` | `8` | hur många bilder premium-galleriet behåller |

Cost-stats per komponent syns i `/admin/llm-usage` på op-namnen `premiumDraft`,
`premiumCritique`, `premiumRewrite`, `premiumFaq`, `premiumImageRank`, `premiumSeoMeta`, `qualityJudge`.

## ⚠️ TVÅ saker Leonard behöver göra

1. **Fyll guldexemplen från riktiga Wix-produkter.** `brand-voice-examples.json`
   innehåller just nu **3 handskrivna seed-exempel** (Gua Sha, ansiktsroller, LED-lampa).
   Kör mot dina bäst polerade produkter:
   ```
   WIX_API_TOKEN=... WIX_SITE_ID=... node scripts/extract-brand-voice-examples.mjs 10
   ```
   (Skriptet väljer de rikaste synliga produkterna och skriver om JSON-filen.)

2. **Kör A/B-testet skarpt** (kostar Anthropic-credits — bara när du väljer det):
   ```
   ANTHROPIC_API_KEY=... npx tsx scripts/premium-ab-test.ts
   ```
   Förväntat: snittbetyg 9+ (mål 9,5+). Lägg till `--standard` för sida-vid-sida-jämförelse.

   *Obs:* byggdes och verifierades med typecheck + 523 enhetstester + `next build`
   (allt grönt), men den skarpa A/B-körningen mot Opus/Sonnet kräver din API-nyckel och
   gjordes inte automatiskt (premium kostar per import — du betalar bara när du väljer läget).
