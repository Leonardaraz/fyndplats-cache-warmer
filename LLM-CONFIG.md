# LLM-konfiguration

Den här filen dokumenterar alla env-variabler som styr LLM-routern
(`lib/llm/router.ts`) — så Leonard vet exakt vad som ska sättas i Vercel för
att importen ska gå billigt (Claude Haiku + prompt caching + persistent
result-cache) och fortsätta fungera även när Anthropic-saldot är 0
(Gemini-fallback).

## Snabbstart (kopiera till Vercel)

```bash
# --- Anthropic ---
ANTHROPIC_API_KEY=sk-ant-...                       # (redan satt)
ANTHROPIC_DAILY_BUDGET_USD=2.00                    # dagligt cap för Claude-spend
CLAUDE_TEXT_MODEL=claude-haiku-4-5-20251001        # billigt för översättning/kategorier
CLAUDE_VISION_MODEL=claude-sonnet-4-5              # behåll Sonnet för bildanalys
CLAUDE_SEO_MODEL=claude-sonnet-4-6                 # SEO är kvalitets-sensitiv

# --- Gemini-fallback (skapa gratis nyckel på aistudio.google.com/app/apikey) ---
GEMINI_API_KEY=AIza...
GEMINI_TEXT_MODEL=gemini-2.0-flash-lite            # 1500 req/dag gratis-tier
GEMINI_VISION_MODEL=gemini-2.0-flash               # också gratis

# --- Router-läge ---
LLM_PROVIDER_DEFAULT=auto                          # claude | gemini | auto

# --- Feature-flaggor (valfria, default on) ---
CLAUDE_IMAGE_ANALYSIS=on
CLAUDE_AUTO_CATEGORIZATION=on

# --- Wix Data-kollektioner (default-namnen funkar; sätt bara om du vill döpa om) ---
WIX_DATA_COL_LLM_CACHE=FyndplatsClaudeCache
WIX_DATA_COL_LLM_SPEND=FyndplatsAnthropicSpend
WIX_DATA_COL_LLM_STATS=FyndplatsLlmStats
```

## Vad varje variabel gör

### Anthropic-relaterat

| Variabel | Default | Förklaring |
|---|---|---|
| `ANTHROPIC_API_KEY` | (krävs för Claude) | API-nyckeln. Om saldo=0 returnerar API:t `invalid_request_error` med "credit balance too low" — då tar Gemini över. |
| `ANTHROPIC_DAILY_BUDGET_USD` | `2.00` | Hård cap på dagens Claude-spend. När capen nåtts skickas alla anrop till Gemini istället. Sätt `0` för att helt stänga av Claude. |
| `CLAUDE_TEXT_MODEL` | `claude-haiku-4-5-20251001` | För kategorisering. Haiku 4.5 är 3× billigare än Sonnet ($1/M in, $5/M ut vs $3/$15) och funkar utmärkt för "välj-ur-lista"-uppgifter. |
| `CLAUDE_VISION_MODEL` | `claude-sonnet-4-5` | För bildanalys (QA av produktbilder). Vision-kvalitet är viktig — behåll Sonnet. |
| `CLAUDE_SEO_MODEL` | `claude-sonnet-4-6` | För svensk SEO-copywriting. Kvalitets-sensitiv, behåll Sonnet. |

### Gemini-fallback

| Variabel | Default | Förklaring |
|---|---|---|
| `GEMINI_API_KEY` | (krävs för fallback) | Skapa en gratis nyckel på https://aistudio.google.com/app/apikey. Om saknas kör importen utan fallback (LLM-anrop kan failas — pipelinen är fail-open). |
| `GEMINI_TEXT_MODEL` | `gemini-2.0-flash-lite` | Gratis-tier: 1500 req/dag. Räcker för Fyndplats import-takt. |
| `GEMINI_VISION_MODEL` | `gemini-2.0-flash` | Också gratis. Bildanalys kräver att vi hämtar bilden och skickar som base64 (Gemini stödjer inte URL-källa). |

### Router

| Variabel | Default | Värden | Förklaring |
|---|---|---|---|
| `LLM_PROVIDER_DEFAULT` | `auto` | `auto`, `claude`, `gemini` | `auto` = försök Claude först, fall tillbaka till Gemini. `claude` = bara Claude (failar om credit balance är 0). `gemini` = bara Gemini (för testning / kostnadsnoll). Kan också overrideas runtime från `/admin/llm-usage`. |

### Wix Data-kollektioner

Routern skapar 3 nya kollektioner i Wix CMS första gången de skrivs till:

1. **FyndplatsClaudeCache** — persistent resultatcache. Schema:
   ```
   _id (Text, key), key (Text), op (Text), value (Object),
   provider (Text), createdAt (Date), expiresAt (Date)
   ```

2. **FyndplatsAnthropicSpend** — dagligt spend, en rad per UTC-datum. Schema:
   ```
   _id (Text, key = "YYYY-MM-DD"), day (Text), totalUsd (Number),
   callsByProvider (Object), updatedAt (Date)
   ```
   Innehåller också en singleton-rad med `_id="provider-override"` för
   admin-toggle.

3. **FyndplatsLlmStats** — en rad per LLM-anrop (cache hit, success, failure).
   Schema:
   ```
   _id (Text, key), day (Text), provider (Text), op (Text),
   success (Boolean), cacheHit (Boolean), costUsd (Number),
   latencyMs (Number), at (Date), detail (Text)
   ```

> Kollektionerna skapas automatiskt vid första skrivning om Wix Data-API:t har
> rätt scopes. Om du vill skapa dem manuellt först (rekommenderas för att kunna
> sätta indexes), skapa dem som **App Collections** med läs+skriv för "Admin".

## Hur stora besparingarna är (uppskattning)

För en typisk Fyndplats import-runda (1 produkt, 6 bilder, 1 kategorisering, 1 SEO):

| Steg | Före (Sonnet 4.5/4.6) | Efter (Haiku + cache) | Besparing |
|---|---|---|---|
| Kategorisering | ~$0.0012 | ~$0.0004 (Haiku) | 67% |
| Med prompt cache (system + collections) | — | ~$0.00006 | 95% |
| Bildanalys (Sonnet, 1×5 + 1×1 batch) | ~$0.018 | ~$0.018 (modell oförändrad) | 0% (men cache-hit på reimport = 100%) |
| SEO | ~$0.045 | ~$0.030 (max_tokens 3000→2000) + cache-hit på reimport | 33% direkt, 100% på reimport |
| **Total första import** | ~**$0.065** | ~**$0.048** | **26%** |
| **Total reimport (cache-hit)** | ~$0.065 | ~**$0.000** | **100%** |

Tillsammans med dagscapen + Gemini-fallback betyder det att Leonard maxat
~$2/dag oavsett trafik, och 100% av reimports är gratis.

## Hur Gemini-fallbacken triggas

Routern faller över till Gemini när **något** av följande inträffar:

1. Claude returnerar `invalid_request_error` med "credit balance too low" →
   `CreditBalanceError` (mappat i `lib/claude/client.ts:mapAnthropicError`)
2. Claude returnerar någon 4xx (utom 401/403 som är auth-fel) →
   `ProviderClientError`
3. Dagens spend ≥ `ANTHROPIC_DAILY_BUDGET_USD` → Claude hoppas över helt
4. `LLM_PROVIDER_DEFAULT=gemini` (eller runtime-overrid via admin-UI)

Om både Claude och Gemini failar returneras `failOpen`-värdet — t.ex. en tom
kategoriseringssuggestion eller rå-titeln för SEO. Importen kraschar aldrig.

## Admin-vy

Gå till `/admin/llm-usage` för:
- Dagens budgetbar (spend vs cap)
- Provider-mode-toggle (auto / claude / gemini) — sparas i Wix, ingen deploy
- Sammanfattning över 30 dagar: anrop, cache hit-rate, kostnad per provider
- Per-dag-tabell

## Felsökning

- **"Credit balance too low"-fel i Vercel-loggar trots GEMINI_API_KEY satt** —
  kolla att kollektionerna ovan har skapats i Wix CMS, annars kan
  budget-trackern inte läsa/skriva och Claude-anropet körs i evighet.
- **Cache verkar inte träffa** — kontrollera att `STORE_BACKEND=wix-data` är satt
  i prod (default `memory` försvinner vid varje cold-start).
- **Höga Claude-kostnader trots cache** — kolla `/admin/llm-usage`. Om cache
  hit-rate är låg är det troligen för att produkterna är unika varje gång
  (cache-keyen hashar namn + första 500 tecken av beskrivning).
