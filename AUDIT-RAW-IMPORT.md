# Audit — rå-mode-import (AI_ENRICHMENT_ENABLED=false)

**Produkt:** Scttomon 5-in-1 Men's Grooming Kit (hårklippare/trimmer)
**AliExpress-id:** `1005010492587553`
**Käll-URL:** https://www.aliexpress.com/item/1005010492587553.html
**Wix-produkt-id:** `16672ab0-b524-4478-90aa-bc6b9cd00a6f`
**Skapad:** 2026-06-02 11:23 UTC · **draft (visible:false)** · draftStatus `pending_review`
**Matchad via:** SKU-prefix `AE-1005010492587553-*` (8 varianter) + mapping `supplierProductId`
**Granskad:** 2026-06-02 mot Wix Stores Catalog V3 + FyndplatsMappings (Wix Data)

> Matchning: produkten har **inget `aliexpressId` custom-fält** på Wix-produkten.
> AE-id finns bara i (a) variant-SKU:erna (`AE-<aeid>-<variant>`) och (b)
> mapping-raden (`supplierProductId`). Sökningen gjordes via båda.

---

## Sammanfattning

Rå-importen fungerade **i grunden korrekt**: produkten finns komplett i Wix som
draft, med 8 färgvarianter, svensk-översatta färgnamn, korrekt pris (standard-tier
2.5×), EU-ribbon, per-färg-bildväxling (linkedMedia) och spec-flik. Inga kritiska
datafel — **inga 0,9 kr-spöken, ingen butikscopy, hero-bild först.**

Men fem saker föll bort eller blev svaga. Två är rena pipeline-buggar
(säljardata + AI-polering-badge), tre är skrap-/rå-kvalitet (lager hårdkodat 10,
bildskräp, tunn beskrivning/specs).

---

## Fält-för-fält

| Fält | Finns? | Värde | Anmärkning |
|------|--------|-------|------------|
| **Titel (Wix name)** | ✅ (trunkerad) | `Scttomon 5-in-1 Men's Grooming Kit Hair Clipper Beard Trimmer Shaver N` | Rå AE-titel, **kapad mitt i ordet vid 70 tecken** ("Shaver N" = "…Shaver Nose Cutter with LED Display Charging Stand"). `buildFallbackSeo` gör `rawTitle.slice(0,70)`. OK i rå-läge (poleras i chatten). |
| **Rå titel (scrape)** | ✅ | `…Charging Stand - AliExpress` | Skrapan tog `<title>` inkl. suffixet **" - AliExpress"** — kosmetisk skräp-svans. |
| **Beskrivning** | ⚠️ tunn | `Buy … at Aliexpress for . Find more , and products. Enjoy ✓Free Shipping…` | Det här är AE:s **meta-description-boilerplate** med tomma platshållare (`for .`, `Find more ,`), inte den riktiga produkttexten. `features`/`packageContents` skrapades **inte** → ingen säljande text. Förväntat i rå-läge men extra tunt här. |
| **Bilder – antal** | ✅ | 20 i Wix (12 galleri + 8 swatch) | Hero = första bilden ✅ (`b379ce_4afe…`, 1280×1280, = AE:s primärbild). |
| **Bilder – kvalitet** | ⚠️ skräp | se nedan | **48×48-ikon importerad som galleribild** (Wix media [3], 48×48 px). **Dubblett**: samma foto skrapat 2× (full + `_220x220q75`-thumbnail). Flera käll-URL:er är **220×220-thumbnails**, inte full-res. |
| **Varianter – antal** | ✅ | 8 färger, alla `visible:true` | Inga avbockade/trimmade. |
| **Varianter – namn** | ✅ delvis översatt | `Svart without LED`, `Vit with LED`, `Grön with LED`, `Lila/Rosa/Blå/Orange with LED`, `Svart with LED` | **INGA F202504-koder** ✅. Färgord översatta till svenska ✅. MEN "with/without LED" kvar på engelska — `variant-translations.ts` saknar den frasen. Borde bli "…utan LED" / "…med LED". |
| **Variant-axel** | ✅ | en axel: `Färg` (SWATCH_CHOICES) | Färg-swatch med samplade hex-koder ✅. |
| **Per-färg bildväxling** | ✅ | linkedMedia satt på alla 8 val | Swatch-bild kopplad per färg (huvudbild byts vid färgval). Fungerar trots rå-läge (deterministiskt, gratis). |
| **Pris** | ✅ korrekt | **884,90 kr** (alla varianter) | costSek 283,16 → ×2,5 (**standard-tier / defaultMultiplier**) = 707,90 → ×1,25 moms = 884,88 → charm90 = **884,90**. Helt korrekt för standard-tier. |
| **Pris – per variant** | ⚠️ | samma pris på alla 8 | Skrapan satte **samma costUsd (26,97 / 283,16 kr) på alla varianter** — AE exponerade inget per-variant-pris. Acceptabelt men inte verifierat per färg. |
| **Variant-kostnad i Wix** | ❌ saknas på produkten | `revenueDetails.cost` = tomt | Pipelinen skickar `costAmount`, men det **persisterades inte** på Wix-varianten (kollat med `fields=MERCHANT_DATA`). Wix lönsamhetsrapport saknar inköp. *Mildras av* att kostnaden finns i mapping (`landedCostSek 283,16`) + FyndplatsImportCosts. |
| **Lager** | ⚠️ hårdkodat | **10 st/variant**, IN_STOCK (8 lagerposter) | **INTE per-variant `availQuantity` från AE** — föll tillbaka till default 10 för alla. Skrapan skickade ingen `stock` per variant. |
| **Ship-from (land)** | ✅ men ej på produkt | `["CZ"]` (Tjeckien, EU) | Lagras i **mapping** (`shipsFromCountries`, `warehouseClass:"EU"`, `hasEuWarehouse:true`) → Wix-**ribbon "EU-lager"** ✅. **Inget land-custom-fält på själva Wix-produkten** — bara ribbonen + mapping. |
| **Säljare-info** | ❌ **SAKNAS HELT** | — | Ingen `supplierId`/`supplierName` på mappingen, **FyndplatsSuppliers-kollektionen finns inte (404)**. Skrapan skickade ingen `supplier` → backend skippade `recordSupplierImport`. Inget namn/rating/store-URL sparat någonstans. |
| **Kategori** | ✅ tom (förväntat) | `uncategorized` | Rå-läge skippar auto-kategorisering (`runCategory=false`). Mapping-reason: "AI-berikning avstängd…". Korrekt beteende, inte en bugg. |
| **Specs (teknisk flik)** | ⚠️ tunn | 3 rader: `Electronic: Yes`, `Model Number: RFC-2018`, `Commodity Quality Certification: ce` | Råa engelska labels (rå-läge översätter ej) infogade som `<h2>Tekniska specifikationer</h2>` i beskrivningen ✅. Men bara 3 låg-värde-rader — AE-sidans fulla spec-tabell skrapades inte. |
| **Paketinnehåll-flik** | ❌ tom | — | `packageContents` skrapades inte → ingen "Vad ingår"-flik. |
| **SEO meta / og-taggar** | ✅ | title + description + og:title/og:description/og:type, `custom:true` | Fokusord satt: `scttomon 5-in-1 men's grooming` (isMain:true) ✅. Meta-desc = full rå titel + "- AliExpress". |
| **Granskningskö** | ⚠️ delvis | draftStatus `pending_review` ✅ men **`needsAiPolish` saknas** | Produkten hamnar i kön, men **utan "✨ Behöver AI-polering"-badgen och utan "Be Claude polera"-knappen** (queue-sidan filtrerar på `needsAiPolish===true`, vilket inte persisterades). |

---

## Vad SAKNAS / är fel — och var det föll bort

### 🔴 Kritiskt

1. **Säljardata helt frånvarande** (name/rating/store-URL/score).
   - **Var:** *Extension-skrapan* (`extension/content.js`) la ingen `supplier`-nyckel
     i produkten → `background.js` utelämnade fältet → `route.ts` hoppade
     `recordSupplierImport`. Dessutom finns **FyndplatsSuppliers-kollektionen inte**
     (404 på query) — `scripts/ensure-supplier-collection.mjs` ligger oträd/ej körd.
   - **Följd:** Feature 6 (säljar-score, blockerings­varning) har noll data för den
     här produkten.

2. **`needsAiPolish` persisterades inte** → AI-polering-badge + chat-knapp visas inte.
   - **Var:** *cache-warmer save.* `route.ts` sätter `mappingExtras.needsAiPolish`
     men raden saknar fältet (bara `draftStatus:"pending_review"` finns).
     Trolig orsak: route.ts-varianten som skriver `needsAiPolish` är **oträdd/ej
     deployad** (jfr noteringar om uncommittad route.ts). Prod-route gav
     pending_review på annat vis men utan flaggan.
   - **Följd:** produkten syns i kön men man ser inte att den behöver poleras och
     "kopiera till chatten"-knappen saknas → manuellt jobb tappas lätt bort.

### 🟠 Skrap-/rå-kvalitet (förväntat svagare i rå-läge, men åtgärdbart i skrapan)

3. **Lager hårdkodat 10/variant** — inte AE:s `availQuantity`.
   - **Var:** *Extension-skrapan* skickade ingen `stock` per variant → `resolveImportStockQty`
     föll tillbaka till default 10. (Logiken är korrekt; indata saknas.)

4. **Bildskräp i galleriet:** en 48×48-ikon importerad som galleribild, en dubblett
   (samma foto i full + 220×220), och flera 220×220-thumbnail-URL:er istället för full-res.
   - **Var:** *Extension-skrapan* (`content.js`) plockade thumbnail-/ikon-URL:er ur
     sidan istället för enbart unika full-res galleribilder.

5. **Tunn beskrivning + tunna specs + inget paketinnehåll.**
   - **Var:** *Extension-skrapan* fick bara AE:s meta-description-boilerplate
     (tomma platshållare) och 3 spec-rader; `features`/`packageContents` tomma.
   - **Följd:** rå-läge har lite att jobba med innan chat-polering.

### 🟡 Kosmetiskt

6. **Wix-namn kapat mitt i ordet** vid 70 tecken (`…Shaver N`). `buildFallbackSeo`
   `slice(0,70)` utan ord-gräns. Poleras i chatten, men ser trasigt ut i listan.
7. **Rå titel bär " - AliExpress"-svans** från `<title>`.
8. **Variantnamn delvis oöversatta** ("with/without LED" på engelska).

---

## Det som FUNGERADE bra (ingen åtgärd)

- ✅ Produkt skapad komplett som draft, hamnar i `/admin/queue` (pending_review).
- ✅ 8 varianter, riktiga svenska färgnamn (inga SKU-koder).
- ✅ Pris korrekt: standard-tier 2.5× + 25% moms + charm90 = 884,90 kr.
- ✅ Färg-swatchar med samplade hex + per-färg bildväxling (linkedMedia) — gratis, deterministiskt.
- ✅ EU-lager upptäckt (CZ) → ribbon "EU-lager" + mapping-metadata.
- ✅ Hero-bild först; SEO-meta + og-taggar + fokusord satta.
- ✅ Spec-flik byggd ur rå specs; inga AI-anrop ($0) — exakt som rå-läge ska.
- ✅ Inga kontaminerings-buggar (ingen butikscopy, inga 0,9 kr, inga fyndplats.se-bilder).
