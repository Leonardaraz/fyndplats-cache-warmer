# Fyndplats – Agent-handbok: hela produkt-pipelinen (sourca → SEO-live)

> **START HÄR.** Det här är orienteringsdokumentet för en autonom agent (t.ex. Claude
> Agent) som ska sköta hela kedjan: hitta produkt → välja → importera → SEO-polera →
> publicera live. Läs detta i sin helhet **först**, och läs sedan
> **[`docs/seo-polish-runbook.md`](./seo-polish-runbook.md)** i sin helhet — det är den
> exekverbara, beprövade poleringsproceduren (Steg 0–6) med färdiga API-anrop.
>
> **Två dokument, en sanning:** den här handboken förklarar *hela processen och allt runt
> omkring*. Runbooken är *facit för själva poleringen*. Duplicera inte runbookens steg —
> följ den. Vid konflikt mellan dokumenten vinner runbooken för poleringsdetaljer.

---

## 0. Uppdraget i en mening

Förvandla råa AliExpress-produkter till **säljklara, svenska, SEO-optimerade Wix-produkter
som är publicerade live** — korrekt, säkert och utan att hitta på fakta.

## 1. Gyllene regler (bryt aldrig dessa)

1. **Hitta aldrig på siffror eller påståenden.** All produktdata (mått, material, effekt,
   ålder, kapacitet …) måste komma från **verifierad importdata** eller **DS-API:t**. Inga
   gissade specs, inga overifierade löften ("fri frakt", "vattentät" etc.) om det inte
   står i källan.
2. **Allt kundinnehåll på svenska.**
3. **Strippa leverantörsmärket helt** (se §3).
4. **Läs om färsk `revision` precis före varje PATCH.** En PATCH är partiell — bara fält du
   skickar ändras.
5. **En produkt poleras via EN väg i taget.** Aldrig parallellt (race-risk, se §6.6).
6. **Draft tills verifierat.** Publicera (`visible:true`) först när allt är kontrollerat.

## 2. Fasta fakta

| Sak | Värde |
|---|---|
| Butik | **Fyndplats** |
| Wix-site-ID | `e6d27e90-4749-4720-9afe-0bbe91c1b3d3` |
| Katalog | **Stores Catalog V3** (V1-siten `8c62127f…` ska ALDRIG användas) |
| Wix Stores appId (kategorier) | `215238eb-22a5-4c36-9e7b-e7c08025e04e` |
| treeReference (kategorier) | `{ "appNamespace": "@wix/stores" }` |
| Frontend | headless Next.js/Vercel, uppdateras via **ISR** (ingen redeploy) |
| Språk | svenska |
| Priser | slutar på **9**, hela kronor, avrunda **uppåt** |

> **Verifierat:** frontend läser `seoData`-taggarna `title` + `meta description` → de blir
> sidans `<title>`/meta. `Product`-JSON-LD och OpenGraph **genereras automatiskt** av
> frontend — du behöver INTE sätta `og:`-taggar.

## 3. Märkesregeln

Råimporten lägger leverantörens märke först i namnet (HOMCOM, Pawhut, Outsunny, Aiyaplay,
Vinsetto, Sportnow, Vevor, Costway, Giantex, Tobbi, Aosom …). **Ta bort det helt** ur namn
(H1), SEO-titel, meta description och alla bild-alt-texter. Sätt inga märkesfält.

- **Undantag:** *licensierade modellnamn* (t.ex. "Audi RS e-tron GT" på en officiellt
  licensierad åkbil) **behålls** — det är korrekt, högsökt produktbeskrivning, inte
  dropship-märke. Osäker? → flagga till Leonard.

## 4. Pipelinen i fem faser

```
A. Sourca   →  B. Välj   →  C. Importera  →  D. Polera (Steg 0–6)  →  E. Verifiera & live
 (DS-API)      (Claude       (bulk-kö,        (runbooken)              (Klart-kriterium)
               + grind)      redan byggt)
```

### Fas A — Sourca (hitta produkter)
- **Använd det officiella AliExpress DS/Open Platform-API:t** (`lib/aliexpress/client.ts`)
  — INTE webbläsning. AliExpress produktsidor är **JS-blockerade** (kan inte läsas
  tillförlitligt), och scraping bryter mot villkoren.
- Hämta kandidatdata: pris/kostnad (USD), antal orders, betyg, **lagerland (EU?)**,
  bildantal, varianter, specs.
- Search-endpoint: verifiera vad `/app/api/aliexpress/search` faktiskt gör innan du litar
  på den (kan vara ett skal).

### Fas B — Välj (urval)
Ranka/filtrera kandidater mot kriterier (justera med Leonard):
- Hälsosam marginal mot målpris i SEK.
- **EU-lager prioriteras** (snabb leverans; importen sätter "EU-lager"-ribbon).
- Betyg ≥ ~4,5, rimligt antal orders.
- ≥ ~5 produktbilder, tydliga specs.
- Passar butikens nisch.

> **GRIND (obligatorisk tills kvalitet är bevisad):** presentera shortlist för Leonard för
> godkännande **innan** import startar / pengar spenderas.

### Fas C — Importera (redan automatiserat)
- Mata godkända AliExpress-URL:er i **bulk-import-kön** (`lib/bulk-import/`). Vercel-cron
  (varje minut) hämtar via DS-API → `importProduct` (`lib/import/pipeline.ts`).
- Importen skapar produkten som **draft** (`visible:false`) i rå-läge och sätter
  `needsAiPolish:true`. Variantöversättning (statisk tabell → cache → Haiku-fallback) körs
  redan.
- **Kostnadsstyrning finns** — respektera den: kvalitetslägen `raw`/`standard`/`premium`
  (0 / 10,5 / 85 öre), daglig budgetcap `ANTHROPIC_DAILY_BUDGET_USD`, bulk-dagskap.

### Fas D — SEO-polera
**Läs och följ [`docs/seo-polish-runbook.md`](./seo-polish-runbook.md) exakt, Steg 0–6.**
Cheat-sheet (runbooken styr i detalj):

- **Steg 0 – Fokussökord:** svenskt = **huvudord + kvalificerare** (t.ex. `airfryer 7
  liter`, `klösträd med koja`, `kontorsstol massage`). Ringa in exakta produkttypen, inte
  bred kategori. **Båda orden MÅSTE finnas i titel, H1 och slug.**
- **Steg 1 – Läs produkten** (read-only GET, fält
  `DESCRIPTION,PLAIN_DESCRIPTION,URL,MEDIA_ITEMS_INFO,VARIANT_OPTION_CHOICE_NAMES`). Spara
  `revision`, `visible`, namn, slug, seoData, hela `media`, options, variants.
- **Steg 1b – ANALYSERA alla bilder FÖRST** (previews via wix-transform, se runbook Steg 1b):
  den visuella förståelsen styr fokussökord, beskrivning, alt-texter, huvudbildsval och
  tvätt-behov. Görs INNAN någon copy skrivs.
- **Steg 2 – PATCH namn + slug + seoData + `plainDescription`** (1 mutation):
  - **name (H1)** börjar med fokussökordet, **≤ 80 tecken** (hård gräns → 400-fel annars).
  - **slug**: ASCII (å/ä→a, ö→o), gemener, bindestreck, innehåller fokussökordet.
    **Byt slug BARA på draft** (live → 404 + ranking-tapp, headless saknar auto-redirect).
  - **seoData.tags ersätter HELA objektet** → skicka ALLTID både title- och meta-taggen.
    Titel ≤ 60 tecken, meta ≤ 155 tecken.
  - **`plainDescription` = ren HTML** (Wix auto-genererar Ricos). Struktur: ingress →
    `<p><strong>Egenskaper</strong></p>` + `<ul>` → `<h2>Tekniska specifikationer</h2>` →
    `<h2>Användning och skötsel</h2>` → `<h2>Vanliga frågor</h2>` (FAQ som feta
    `<p>`-frågor). **Flik-rubriker MÅSTE vara rena `<h2>Titel</h2>`** — aldrig
    fetstil/`<span>` på h2-raden (annars splittras inte flikarna på PDP:n). Fet text OK i
    stycken.
- **Steg 2b – Re-synka SKU** till nya sluggen (se §7). Skicka `options` + `variantsInfo`
  **verbatim** (ändra bara `sku`) + färsk revision → annars 428
  `MISSING_OPTIONS_ON_UPDATE_VARIANTS`.
- **Steg 3 – Skriv om ALLA bild-alt-texter** till varierad, sökordsrik svenska utifrån det
  som faktiskt syns (granskningen i Steg 1b). Se §6.1/§6.7.
- **Dubbletter:** exakt identiska galleribilder → behåll **en**, ta bort resten (kolla
  `linkedMedia` FÖRST, koppla om valet). Radera **inte** filen direkt — borttagen blir den
  föräldralös och frigörs i orphan-svepen. Se runbook Steg 3.
- **Steg 3b – Tvätta bort dropship-loggor/vattenstämplar/inbränd text** (spanska, engelska,
  kinesiska …) med **Metod A (Wix Generate Image)** — klarar numera även **röriga/komplexa
  bakgrunder** (person, regn, trä/sten), inte bara släta studiobakgrunder; Metod B (manuell
  täckning) är fallback endast för släta bakgrunder. Ren **infografik/spec-diagram** → ta bort
  ur galleriet (info hör hemma som text). Original raderas aldrig; `linkedMedia` kopplas om.
  Se runbook Steg 3b.
- **Steg 3c – Ren vit hjältebild** (premium): är hjältebilden en ren produktbild på ful/mörk/rörig
  bakgrund → klipp ut produkten (rembg/u2net) och lägg på **vit + mjuk skugga**, ~82 % av en 1:1-ruta;
  loggan i bakgrunden försvinner automatiskt. Nyttiga kontextbilder behålls (bara tvättade),
  infografik bort/flaggas. **Guardrail:** `Read` resultatet — behåll originalet vid felklipp (tunna
  kablar/smådelar). Original raderas aldrig; `linkedMedia` kopplas om. Se runbook Steg 3c.
- **Steg 4 – Kategori** (se §6 + ID-tabell). 1 anrop.
- **Steg 5 – Publicera** (`visible:true`) — först efter att Steg 2–4 verifierats.
- **Steg 6 – Varianter:** kontrollera. **Döp ALDRIG om variantvärden** (V3 key-lock, §6.5).

### Fas E — Verifiera (Klart-kriterium, per produkt)
- ✅ Fokussökordet finns i **titel, H1, slug, beskrivning OCH meta**.
- ✅ Alla bilder har svenska alt-texter och **kvar sina `image.url`**; antal oförändrat utom
  bilder som medvetet togs bort/ersattes i Steg 3b/3c (borttagen `linkedMedia`-bild → valet omkopplat).
- ✅ Hjältebilden är ren produktbild på **vit studio-bakgrund + mjuk skugga** när originalet hade
  ful/mörk/rörig bakgrund (Steg 3c) — visuellt granskad, original behållet vid felklipp.
- ✅ Flik-rubrikerna är **rena `<h2>`** (renderas som flikar, inte inline).
- ✅ SKU matchar polerade sluggen (inget engelskt råord, inget märke).
- ✅ `visible:true`. Pris slutar på 9.

## 5. Kategori-ID (Wix V3)

POST `https://www.wixapis.com/categories/v1/bulk/categories/add-item` med body
`{ "item": { "catalogItemId": "<PID>", "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e" },
"categoryIds": ["<CAT>"], "treeReference": { "appNamespace": "@wix/stores" } }`.

| Kategori | ID |
|---|---|
| Hem & Inredning (möbler/utemöbler) | `3ed832b7-213f-4bd8-bbc4-e95744a9b316` |
| Leksaker & Spel | `21b366b8-fd1a-4b3c-993c-9574711f5293` |
| Barn & Familj | `83c8248a-2d41-42fe-a8c8-0202a4630686` |
| Baby & Småbarn | `37c71745-8317-4b2d-aef5-14bbdd1cdd9e` |
| Sport & Fritid | `de100f8d-755f-433d-90b2-9b18edb41b9d` |
| Friluftsliv & Resa | `34c37816-2384-49d1-bb47-8d1415daad41` |
| Husdjur | `a2b4369f-50dc-49c4-b1d2-4367cf7f3692` |
| Köksmaskiner & Apparater | `ed3d8796-3d38-4c12-931f-0ef53394c89c` |
| Hushållsapparater | `9fab95c3-f077-4ae9-847b-dce89f5a8ddf` |
| Köksredskap & Tillbehör | `39413f03-83c9-4807-a621-4a3a53ae6f9f` |
| Kök & Husgeråd | `dd650fed-4549-480a-969a-d3e7732cd789` |
| Klockor & Solglasögon | `c62d706c-e3b8-4880-8cbf-14d656c9b3bc` |
| Elektronik & Tillbehör | `9054fdce-2f3d-4ad4-9cd9-c00645cbabea` |
| Verktyg & Hemmafix | `43674676-4407-406d-889d-a5eee646d167` |
| Bil & Cykel | `b02b889a-a80e-414e-ad12-00ba5722244b` |

Hittar du ingen passande → POST `https://www.wixapis.com/categories/v1/categories/query`
med `{ "query": { "paging": { "limit": 100 } }, "treeReference": { "appNamespace":
"@wix/stores" } }` och matcha på `name`. (Det finns ~45 kategorier.)

## 6. Hårda fällor — lär dig dessa

1. **`media.main` är readOnly i V3.** Skickar du den i en PATCH svarar Wix `200 OK` men
   **ignorerar tyst hela `media`-objektet** (no-op som ser ut att lyckas). Patcha BARA
   `media.itemsInfo.items`; `main` följer med automatiskt.
2. **Längdgränser:** namn (H1) **≤ 80** tecken (annars 400-fel), titel **≤ 60**, meta
   **≤ 155**.
3. **`seoData` ersätts helt** vid PATCH → skicka alltid samtliga taggar (title + meta),
   inte bara den du ändrar.
4. **Slug bara på draft.** Att byta slug på en redan publicerad/indexerad produkt 404:ar
   den gamla URL:en (headless saknar Wix auto-redirect) → ranking-tapp. Live → behåll slug.
5. **V3 key-lock:** `choice.name` speglar den låsta `choice.key`:en. **Döp inte om
   variantvärden i efterhand** — ändringen fastnar inte och att röra `key` riskerar
   leverantörsmappningen (`wixVariantId → supplierVariantId`). Måttvärden som
   `"65X30X104 cm"` är OK som de är. Fult/engelskt värde → flagga till Leonard.
6. **Race condition:** polera ALDRIG samma produkt via två vägar samtidigt (t.ex. den här
   agenten + admin-knappen). En parallell polering kan klottra över din (revisionen hoppar,
   fel version vinner). **Ta ett per-produkt-lås.** Läs färsk revision precis före varje
   PATCH; vid revisionskonflikt → läs om och försök igen, klubba inte över andras ändringar.
7. **Bild-alt Steg 3:** skicka **hela** `itemsInfo.items`-arrayen och ändra bara `altText`
   (+ `image.altText`). Ofullständig array kan **radera bilder**. Matcha swatch-/färgbilder
   på **media-id**, inte altText. **Verifiera efteråt** att alla items har kvar `image.url`.
8. **Hitta inte på siffror.** Vid måttkonflikt (t.ex. titel säger 75,5×75×137 men
   specsektionen 78×76×140) → använd den uttryckliga "total measurements"-specen och håll
   måttet utanför H1. Flagga konflikten.
9. **Falska "engelska"-träffar i din verifiering:** svenska låneord innehåller engelska
   delsträngar — *rebounder* (innehåller "Rebound"), *pump*, *camping/campingen*,
   *dinosaurie* (innehåller "Dinosaur"). Använd ord-/frasgränser, inte nakna delsträngar,
   när du kollar efter kvarvarande engelska.
10. **Idempotens/retries:** Wix-/MCP-anslutningar kan tappa kopplingen mitt i ett jobb —
    bygg retry + idempotenta steg så att ett omkört steg inte skapar dubbletter eller halva
    tillstånd.

## 7. SKU-algoritm (Steg 2b, exakt)

Format `FP-<produkt>-<variant>` ur den **polerade sluggen** + variantens optionsvärde(n).
ASCII (å/ä→a, ö→o), ledande **märkesord strippat**, **bindeord strippade** (med/i/för/och…),
variant-tokens som redan finns i produkt-delen **dedupade**, produkt-del **≤ 24 tecken**
(kapa på hel-ords-gräns), variant-del **≤ 12 tecken**, hela **≤ 40 tecken** (Wix-gräns),
**unik inom produkten** (kollision → `-2`/`-3`…). Saknar produkten optionsvärden → bara
`FP-<produkt>`.

> **Återanvänd `buildVariantSkus` från `lib/import/sku.ts` — reimplementera inte.** Det är
> den auktoritativa implementationen (märkes-/bindeords-strip + token-dedup +
> kollisionssuffix, konstanter `SKU_MAX=40`, `PRODUCT_PART_MAX=24`, `VARIANT_PART_MAX=12`).
> Den inline-JS som finns i runbookens Steg 2b är en **förenklad spegling** för manuell
> körning; vid skillnad gäller `sku.ts`.

SKU:n är en ren etikett — synk/fulfillment nycklar på `wixVariantId`, inte SKU-strängen, så
det är ofarligt att byta.

## 8. Autonomigrindar (innan full autonomi)

- **Människo-grind på shortlist** (Fas B) innan import/pengar.
- **Draft som default; publicera via kvalitetsdomare.** Premium-läget auto-publicerar vid
  tröskel (≥ 9,5), annars draft + flagga för manuell granskning.
- **Respektera budgetcap** (`ANTHROPIC_DAILY_BUDGET_USD`, bulk-dagskap).
- **AUDIT FÖRE MERGE** om du rör kod: enligt `CLAUDE.md` ska varje PR:s diff auditeras och
  fynden rapporteras till Leonard innan merge — korrekthet, edge-cases, regressioner,
  säkerhet. Hård grind, inga undantag.
- **Rör inte** redan publicerade/polerade produkter "på nytt" utan anledning (särskilt inte
  sluggen). Är en produkt redan klar → rapportera det, polera inte om.

## 9. Rapportering per produkt

Rapportera kort efter varje produkt: fokussökord, längder (H1/titel/meta), SKU före→efter,
kategori, antal alt-texter, och **alla flaggor** (märkesbeslut, måttkonflikt, fult
variantvärde, redan-polerad, race upptäckt).

## 10. Vad som redan är byggt vs. vad du ska köra/bygga

**Klart:** import (DS-API + bulk-kö + cron varje minut), variantöversättning,
kostnadslägen, budgetcap, EU-lager-ribbon, hälsokoll-cron.

**Att köra (idag manuellt via chatt + en polish-knapp som bara kopierar till urklipp):**
Fas A/B (sourcing + urval via DS-API) och Fas D/E (polering).

**Rekommenderad byggordning:**
1. **Automatisera poleringen (Fas D/E) som en worker först** — störst manuell-arbets-vinst,
   lägst risk, runbooken är redan deterministisk. Lägg på per-produkt-lås (§6.6).
2. DS-API-sourcing + en Claude-urvalsscorer (Fas A/B).
3. Människo-grind på shortlisten.
4. Auto-publicering via kvalitetsdomare.

## 11. Var saker bor i koden

| Vad | Fil |
|---|---|
| Import-pipeline (beslutspunkt AI på/av) | `lib/import/pipeline.ts` (`importProduct`, `aiEnrichmentEnabled`) |
| Produkt-input-form | `lib/import/types.ts` (`AliExpressProduct`) |
| AliExpress DS-API-klient | `lib/aliexpress/client.ts` |
| URL → produkt | `lib/import/from-url.ts` |
| Bulk-import (kö/worker/batch) | `lib/bulk-import/` |
| Cron-jobb | `vercel.json` + `app/api/cron/*` |
| Variantöversättning | `lib/import/variant-translations.ts`, `variant-ai-translate.ts` |
| Budgetcap/router | `lib/llm/budget.ts`, `lib/llm/router.ts` |
| SKU | `lib/import/sku.ts` |
| Poleringsprocedur (FACIT) | **`docs/seo-polish-runbook.md`** |
| Övriga LLM-/kostnads-env | `LLM-CONFIG.md` |
| Projektregler (audit-före-merge, kostnadslägen) | `CLAUDE.md` |

---

**Sammanfattning:** Import är klart. Polering är en deterministisk runbook (automatisera
först). Sourcing + urval körs via DS-API:t + en urvals-Claude, med människo-grind före
pengar/publicering tills det är intrimmat. Följ runbooken exakt för poleringen, respektera
fällorna i §6, och rapportera alla flaggor.
