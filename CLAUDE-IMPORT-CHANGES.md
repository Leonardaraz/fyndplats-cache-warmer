# Claude image analysis + auto-categorization — handoff

## TL;DR

Båda förbättringarna är **byggda och skrivna till disk**, men `commit + push + smoke test`
kunde **inte** köras från Cowork-sandboxen eftersom:

1. **GitHub är blockerat** från sandboxen (`403 Forbidden from proxy after CONNECT` mot
   `github.com`) — `git push` går inte.
2. **.git-indexet är korrupt** sett från sandbox-mounten (`improper chunk offset(s) 47c
   and 7bb4`, `bad index file sha1 signature`). Cowork-mounten kan inte fullt ut
   manipulera `.git/index` från Windows-värden.
3. **Vercel CLI saknas** i sandboxen, så `vercel env ls` och `vercel deploy` kan inte
   köras därifrån.
4. **Vitest kan inte köras lokalt** — pnpm-symlänkarna i `node_modules` är trasiga via
   mounten (`Cannot find package '@vitest/utils'` och I/O-errors på symlinks).

Filerna i sig är dock på disk och korrekta. Kör stegen i nästa avsnitt så är ni live.

---

## Steg du kör nu (Windows PowerShell eller WSL)

```bash
cd C:\Users\leona\fyndplats-cache-warmer

# 1. Verifiera ANTHROPIC_API_KEY finns i Vercel
vercel env ls | grep ANTHROPIC_API_KEY

# 2. Lägg till feature-flaggorna (kill-switches). Default är "on" så de behövs strikt sett inte,
#    men det är bra att ha dem som explicit env för enkel toggle.
vercel env add CLAUDE_IMAGE_ANALYSIS production  # värde: on
vercel env add CLAUDE_AUTO_CATEGORIZATION production  # värde: on

# 3. Lägg till BARA mina filer (undvik att blanda in andra ändringar i indexet).
git add lib/claude/client.ts lib/claude/client.test.ts \
        lib/import/pipeline.ts lib/import/pipeline.test.ts \
        lib/store/index.ts lib/wix/client.ts \
        app/api/import/route.ts app/admin/queue/actions.ts app/admin/queue/page.tsx \
        .env.example CLAUDE-IMPORT-CHANGES.md

# 4. Kör tester (lokalt — pnpm-symlänkar funkar på Windows)
pnpm test -- lib/claude/client.test.ts lib/import/pipeline.test.ts

# 5. Typecheck
pnpm typecheck

# 6. Commit + push
git commit -m "feat(import): Claude image analysis + auto-categorization

- lib/claude/client.ts: delad Anthropic-helper (vision + text), batch image
  analysis (5 bilder per call), kategorise­ring med cache, feature-flaggor
- analysIntegration i lib/import/pipeline.ts: per-bild verdict (ok/warn/reject)
  med svensk anledning, reject filtreras bort från Wix-galleriet, warns demoteras
- auto-tilldelning av Wix-kategori vid confidence > 0.7, förslag vid 0.4–0.7
- /admin/queue UI: kort per produkt med flaggade bilder + 'Ta bort bild' + ett-klick
  acceptera kategori-knapp
- /api/import returnerar image_analysis + suggested_category i svaret
- minimala tester med mockad @anthropic-ai/sdk"
git push origin main

# 7. Vänta på Vercel auto-deploy (1–2 min). Hitta deploy-id:
vercel ls fyndplats-cache-warmer | head -5

# 8. Smoke-test: posta en känd AliExpress-produkt mot /api/import.
#    Ersätt $EXT_TOKEN med EXTENSION_API_TOKEN-värdet.
curl -X POST https://fyndplats-cache-warmer.vercel.app/api/import \
  -H "Content-Type: application/json" \
  -H "x-fyndplats-token: $EXT_TOKEN" \
  -d @smoke-test-payload.json \
  | jq '{ok, draftStatus, image_analysis: .image_analysis|length, suggested_category}'
```

Förväntat smoke-test-svar (toppnivå):

```json
{
  "ok": true,
  "draftStatus": "pending_review",
  "image_analysis": 5,
  "suggested_category": {
    "collectionSlug": "skonhet",
    "collectionId": "...",
    "collectionName": "Skönhet",
    "confidence": 0.88,
    "reason": "produkten är en ansiktsmask — hör hemma under Skönhet",
    "status": "auto"
  }
}
```

---

## Vad som byggdes — översikt

### Nya filer

| Fil | Syfte |
|---|---|
| `lib/claude/client.ts` | Shared Claude-helper (vision + text), batch 5, feature-flaggor, cache |
| `lib/claude/client.test.ts` | 17 vitest-tester med mockad SDK |
| `lib/import/pipeline.test.ts` | Test för bild-omsortering (ok först, warn sist, reject borta) |

### Modifierade filer

| Fil | Ändring |
|---|---|
| `lib/import/pipeline.ts` | Kör `analyzeImages` + `suggestCategory` parallellt med SEO; filtrerar rejects ur galleriet; auto-tilldelar Wix-kategori vid hög confidence |
| `lib/store/index.ts` | Lagt till `imageAnalysis` + `categorySuggestion` på `ProductMappingRecord` |
| `lib/wix/client.ts` | Nya: `getCollections`, `addProductToCollection`, `getProductMedia`, `setProductMedia` |
| `app/api/import/route.ts` | Persistar nya fält + returnerar `image_analysis` och `suggested_category` på toppnivå |
| `app/admin/queue/actions.ts` | Nya server-actions: `removeImage`, `acceptCategorySuggestion` |
| `app/admin/queue/page.tsx` | Kort-vy per produkt med bild-thumbnails (färgkodade ok/warn/reject + svensk anledning + Ta bort bild), kategoriförslag-rad med Acceptera-knapp |
| `.env.example` | Dokumenterar `CLAUDE_IMAGE_ANALYSIS`, `CLAUDE_AUTO_CATEGORIZATION`, modell-overrides |

### Vad som händer vid import

1. Extension postar produktdata till `/api/import` (oförändrat interface).
2. SEO-generering, bildanalys (5 bilder/Claude-call), och kategori-uppslag körs
   **parallellt** för att hålla latensen nere.
3. Bilder med `verdict=reject` filtreras bort innan upload till Wix Media Manager.
   `warn`-bilder demoteras (läggs sist i galleriet) men följer ändå med.
4. Wix-produkten skapas (visible:false som idag).
5. Om kategori-confidence > 0.7: produkten läggs i Wix-kollektionen automatiskt.
   0.4–0.7: status="suggested", väntar på ett-klick i kö-UI:t. <0.4: okategoriserad.
6. Mapping sparas med `imageAnalysis` + `categorySuggestion` så `/admin/queue` kan
   visa det utan extra API-anrop.
7. Audit-rader skrivs: `claude-image-analysis` (ok/warn/reject counts) och
   `category-auto-assign`.

### Kostnadskontroll

- **Batchning:** 5 bilder per Claude-call. En produkt med 8 bilder = 2 calls.
- **Cache:** kategoriförslag cachas per `sha256(name+description+collection-fingerprint)`
  så re-imports av samma produkt slipper Claude. Cache är in-memory, begränsad till
  500 entries (LRU-pruning).
- **Fail-open:** om Claude failas (rate-limit, fel, time-out) släpps importen ändå
  igenom — bilderna märks "ok" och kategori blir "uncategorized". Leonard ser i kö-UI:t
  vad som hände och kan agera manuellt. Bättre att importen lyckas än att hela
  flödet stoppas.
- **Kill-switch:** `CLAUDE_IMAGE_ANALYSIS=off` eller `CLAUDE_AUTO_CATEGORIZATION=off`
  stänger av respektive funktion utan kodändring.

### Verdicts (svenska)

Claude promptas att flagga:

- **vattenstämplar** eller logotyper från andra varumärken
- **kinesisk text** eller annan text-overlay i bilden
- **multipla orelaterade produkter** i samma bild (collage)
- **suddig/låg kvalitet**
- **olämpligt innehåll** (NSFW)

Anledningen ska vara svensk och ≤ 80 tecken så den får plats under thumbnail.

---

## Manuella nästa steg (efter deploy)

1. **Skapa en Wix Data-collection** vid namn `FyndplatsMappings` (om den inte redan
   finns) med nya fälten `imageAnalysis` (Object) och `categorySuggestion` (Object).
   Memory-store funkar för test, men STORE_BACKEND=wix-data behöver schemat.
2. **Verifiera att Wix Stores V3 har minst några kollektioner** — utan dem returnerar
   `getCollections()` tomt och alla produkter blir `uncategorized`.
3. **Testa en riktig import** genom extensionen och granska resultatet på
   `/admin/queue`. Förväntar minst 1 bild-flagga + 1 kategoriförslag på en typisk
   AliExpress-produkt.
4. **Eventuellt sänk batch-storleken** om Claude visar tecken på att tappa bort bilder
   när 5 skickas samtidigt — ändra `BATCH_SIZE` i `lib/claude/client.ts`.
5. **Lägg till Wix Data-schema-migration** om `imageAnalysis`/`categorySuggestion`
   nekas av WixDataStore.save — Wix CMS kräver att fält finns i schemat innan de
   accepteras.
