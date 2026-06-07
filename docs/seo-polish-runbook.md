# Fyndplats – SEO-optimera en produkt (runbook, inga uppslag behövs)

> Detta är en **körbar** instruktion. Följ stegen i ordning med de färdiga API-anropen nedan. Du behöver **inte** slå upp något schema (`SearchWixAPISpec`) – allt format är redan bekräftat och ifyllt.

## Fasta fakta (gäller alltid)

- Butik: **Fyndplats**, site ID `e6d27e90-4749-4720-9afe-0bbe91c1b3d3`, **Catalog V3** (default). (V1-siten `8c62127f-…` ska INTE användas.)
- Allt innehåll skrivs på **svenska**.
- **Inga märken (gäller alltid):** råimporten lägger alltid märkesnamnet (HOMCOM, Pawhut, osv.) först i `name`/titeln. Ta bort märket **helt** – ur produktnamn (H1), SEO-titel, meta description och alla bild-alt-texter – och låt det generiska sökordet stå först. Sätt **inga** märkesfält. Importen själv fyller inte i något märkesfält, men har en äldre produkt redan ett ifyllt fält: rensa det i samma Steg 2-PATCH (`"brand": null`; bekräfta fältformatet i Product V3 första gången).
- Frontend är headless Next.js/Vercel och uppdateras automatiskt via ISR – **ingen redeploy**.
- **Verifierat (2026-06-05):** frontend läser `seoData`-taggarna `title` + `meta description` → de blir sidans `<title>` och meta. `Product`-JSON-LD (namn, pris, lager, betyg) och OpenGraph **genereras automatiskt** av frontend från produktfälten – du behöver alltså INTE sätta `og:`-taggar i `seoData`.
- `ExecuteWixAPI` kräver godkännande. Skriv `fields` i request-**body** vid query/PATCH. **Läs om `revision` precis före varje PATCH.** API-svar är plain strings (skriv ändå `v?.value ?? v`).
- En PATCH är partiell: **bara fält du skickar ändras**. Skicka aldrig `options`/`variantsInfo` om du inte avser röra varianterna.
- **Priser slutar på 9, inga decimaler.** Importen sätter redan priset till hela kronor som avrundas **uppåt** till närmaste tal som slutar på 9 (t.ex. 499, 489, 579) — **ingen `.90`**. Ändrar du ett pris: avrunda alltid **uppåt** till närmaste 9-slut och skriv hela kronor (aldrig `,90`).
- **SKU sätts automatiskt — rör den inte.** Importen ger varje variant ett läsbart artikelnummer (`FP-<produkt>-<variant>`, t.ex. `FP-temperingsmaskin-choklad-17-l`) som syns i kassan/Google och mappar till AliExpress i bakgrunden. SKU:n behöver **inte** ändras vid polering; byt den inte (mappningen till leverantören hänger på den).

**Input:** Wix-produkt-ID (+ ev. AliExpress-URL).

-----

## Steg 0 – Välj fokussökord (avgör allt annat)

Välj det svenska sökord folk faktiskt söker på, sammansatt av **huvudord + kvalificerare**, t.ex. `starthjälp bil`.
**Ringa in den exakta produkttypen, inte den breda kategorin.** Använd ordet för vad produkten *faktiskt är* (formen/typen), inte en generisk grupp – t.ex. `sadelstol` (inte "arbetsstol"), `hopfällbar massagebänk` (inte "möbel"). Det specifika ordet har oftast högre köpintention och mindre konkurrens, och matchar vad köparen söker.
**Regel:** båda orden MÅSTE hamna i **titel, produktnamn (H1) och slug** – annars flaggar Wix SEO-assistenten dem som röda. Ordet finns redan grönt i beskrivning/meta om det står i texten.
Specs får bara komma från känd importdata eller `web_search` (AliExpress-sidor är JS-blockerade). **Hitta inte på siffror.**

-----

## Steg 1 – Läs produkten (1 anrop, read-only)

```
GET https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}?fields=DESCRIPTION&fields=PLAIN_DESCRIPTION&fields=URL&fields=MEDIA_ITEMS_INFO
```

Spara: `revision`, nuvarande `name`, `slug`, `seoData`, **`visible`**, samt **hela `media`** (du behöver `media.main` + alla `media.itemsInfo.items` med deras `id`, `uploadId`, `image` till Steg 3).

-----

## Steg 2 – PATCH namn + slug + seoData (1 anrop, mutation)

Bygg innehållet:

- **name (H1):** svenskt, sökordsrikt, börjar med fokussökordet (huvud + kvalificerare).
- **slug:** **ASCII** (inte å/ä/ö), gemener, bindestreck, innehåller fokussökordet inkl. kvalificeraren. (ASCII undviker kodningskrångel på headless-frontenden; Google klarar ändå båda.)
  - ⚠️ **Slug-varning (headless):** byt slug **bara på produkter som inte gått live än** (nyimporterade draft-produkter). Wix auto-redirect (`preventAutoRedirect:false`) gäller **bara Wix-hostade sajter, inte din headless** – så att byta slug på en redan indexerad produkt gör att den gamla URL:en **404:ar** och ranking tappas. För en redan publicerad produkt: **behåll befintlig slug**.
- **title-tagg:** ≤ ~60 tecken, fokussökord först, ev. `| Fyndplats`.
- **meta description:** ≤ ~155 tecken, nytta + sökord, **inga overifierade påståenden** (ingen "fri frakt" om det inte stämmer).

> **Viktigt:** en PATCH av `seoData` **ersätter hela objektet** – skicka därför ALLTID med samtliga taggar nedan, inte bara den du ändrar.

```
GET .../products/{PRODUCT_ID}        // hämta färsk revision precis innan
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": {
  "id": "{PRODUCT_ID}",
  "revision": "{FÄRSK_REVISION}",
  "name": "<Produktnamn med fokussökord>",
  "slug": "<slug-med-fokussokord>",
  "seoData": {
    "tags": [
      { "type": "title", "children": "<SEO-titel ≤60 tecken>", "custom": false, "disabled": false },
      { "type": "meta", "props": { "name": "description", "content": "<meta ≤155 tecken>" }, "children": "", "custom": true, "disabled": false }
    ],
    "settings": {
      "preventAutoRedirect": false,
      "keywords": [
        { "term": "<fokussökord, t.ex. starthjälp bil>", "isMain": true, "origin": "USER" },
        { "term": "<relaterat sökord>", "isMain": false, "origin": "USER" },
        { "term": "<relaterat sökord>", "isMain": false, "origin": "USER" }
      ]
    }
  }
} }
```

> Frontend bygger OpenGraph + `Product`-JSON-LD själv från produktfälten, så `og:`-taggar i `seoData` behövs inte. Vill du ändå ha dem skadar de inte.

### (Om beskrivningen också ska skrivas om)

Lägg fokussökordet naturligt i texten. Skicka `"description": { "nodes": [...] }` i samma PATCH. Ricos-format:

- Stycke: `{"type":"PARAGRAPH","id":"p1","nodes":[{"type":"TEXT","id":"","nodes":[],"textData":{"text":"…","decorations":[]}}],"paragraphData":{}}`
- Rubrik: `{"type":"HEADING","id":"h1","nodes":[<TEXT>],"headingData":{"level":2}}`
- Punktlista: `{"type":"BULLETED_LIST","id":"ul1","nodes":[{"type":"LIST_ITEM","id":"li1","nodes":[{"type":"PARAGRAPH","id":"","nodes":[<TEXT>],"paragraphData":{}}]}]}`
- Fet: `"decorations":[{"type":"BOLD","fontWeightValue":700}]`
- Bra struktur: ingress → **Egenskaper** (punkter) → **Tekniska specifikationer** (punkter) → **Vanliga frågor** (FAQ **i beskrivningen**, INTE som egen info-sektion – siten har ett tak på 400 info-sektioner).

-----

## Steg 3 – Skriv om ALLA bild-alt-texter (1 anrop, mutation)

Rå-import lämnar engelska alt-texter med "AliExpress" – byt alla till svenska, sökordsrika, varierade. Koppla ev. variantbilder till sina optionsvärden.

> **Fälla:** skicka tillbaka **hela** media-objektet och ändra **bara `altText`**. En ofullständig array kan **radera bilderna**. Sätt både `media.main` och `media.itemsInfo.items`. **Verifiera efteråt** att alla items har kvar `image.url`.

Procedur (utgå från `media.itemsInfo.items` från Steg 1):

```js
const itemsA = items.map((it, i) => ({ ...it, altText: newAlt[i], image: it.image ? { ...it.image, altText: newAlt[i] } : it.image }));
const mainIdx = Math.max(0, items.findIndex(it => it.id === media.main?.id));
// hämta färsk revision, sedan:
PATCH .../products/{PRODUCT_ID}
body = { product: { id:"{PRODUCT_ID}", revision:"{FÄRSK}", media: { main: itemsA[mainIdx], itemsInfo: { items: itemsA } } } }
```

Verifiera direkt efter:

```
GET .../products/{PRODUCT_ID}?fields=MEDIA_ITEMS_INFO   // alla items ska ha image.url, count oförändrad
```

-----

## Steg 4 (rekommenderat) – koppla rätt kategori

Om produkten bara ligger i "All Products", koppla en riktig kategori (1 anrop, mutation):

```
POST https://www.wixapis.com/categories/v1/bulk/categories/add-item
```

```json
{ "item": { "catalogItemId": "{PRODUCT_ID}", "appId": "215238eb-22a5-4c36-9e7b-e7c08025e04e" },
  "categoryIds": ["{CATEGORY_ID}"],
  "treeReference": { "appNamespace": "@wix/stores" } }
```

Vanliga kategori-ID: **Bil & Cykel** `b02b889a-a80e-414e-ad12-00ba5722244b` · Elektronik & Tillbehör `9054fdce-2f3d-4ad4-9cd9-c00645cbabea` · Friluftsliv & Resa `34c37816-2384-49d1-bb47-8d1415daad41` · Verktyg & Hemmafix `43674676-4407-406d-889d-a5eee646d167`. (Fler ID:n finns i den fullständiga poleringsreferensen.)

-----

## Steg 5 – PUBLICERA produkten (1 anrop, mutation)

Rå-importer skapas som **draft** (`visible:false`) och syns inte i butiken. När poleringen ovan är klar och verifierad: gör produkten synlig (hämta färsk `revision` först).

```
GET .../products/{PRODUCT_ID}        // färsk revision
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": { "id": "{PRODUCT_ID}", "revision": "{FÄRSK_REVISION}", "visible": true } }
```

> Hoppa över detta bara om produkten medvetet ska förbli draft. Frontend uppdateras via ISR (ingen redeploy).

-----

## Steg 6 – Varianter (kontrollera, fixa bara vid behov)

Importen sköter varianterna automatiskt och deterministiskt (inga AI-anrop) — oftast behöver du inte göra något:

- **Bildbyte per färg/modell är redan kopplat** (`linkedMedia`): huvudbilden byts när kunden väljer t.ex. "Blå". **Rör inte detta när det fungerar** (det gör det i de flesta fall — från skrapans swatch-bilder eller DS-API:ts per-SKU-bilder).
- **Variantnamn översätts till svenska** deterministiskt ("Color"→"Färg", "Red"→"Röd"). Tabellen täcker dock inte allt — sammansatta/ovanliga värden kan bli klumpiga eller halv-engelska. **Dem får du gärna putsa** till naturlig svenska (samma ton som produktnamnet).

**A) Putsa variantnamn (valfritt).** Hämta färsk `revision`, skicka tillbaka **HELA** `options`-arrayen + `variantsInfo` **verbatim** (annars 428), ändra bara `choices[].name`.
⚠️ Byter du namnet på ett val som har en kopplad bild tappas kopplingen — sätt då om `linkedMedia` (se B) i samma PATCH.

**B) Om ett färg-/modellval saknar bildbyte** (text-val utan att huvudbilden ändras) — koppla valet till rätt galleribild. Verifierat mot V3:

1. **GET** produkten med `fields=MEDIA_ITEMS_INFO`, hitta rätt bilds `media.itemsInfo.items[].id` (matcha på motiv/`altText`) och läs färsk `revision`.
2. **PATCH**: sätt `linkedMedia: [{ "id": "<media-item-id>" }]` på rätt `choices[]`. Skicka **HELA** `options` + `variantsInfo` **verbatim** + färsk `revision`.
3. Wix ingest:ar bilder **asynkront** (~5 s) — verifiera via re-GET att `linkedMedia` sitter kvar; annars PATCHa om med ny `revision`.

```
GET .../products/{PRODUCT_ID}?fields=MEDIA_ITEMS_INFO        // media-item-id + färsk revision
PATCH https://www.wixapis.com/stores/v3/products/{PRODUCT_ID}
```

```json
{ "product": {
  "revision": "{FÄRSK_REVISION}",
  "options": [
    { "name": "Färg",
      "choicesSettings": { "choices": [
        { "name": "Blå", "linkedMedia": [ { "id": "{MEDIA_ITEM_ID}" } ] }
      ] } }
  ],
  "variantsInfo": "{VERBATIM_FRÅN_GET}"
} }
```

> Skicka `options` **komplett** (alla optioner och val, inte bara det du ändrar) och `variantsInfo` exakt som det kom från GET — annars svarar V3 428 `MISSING_VARIANT_OPTION_CHOICE`. Bilden måste redan ligga i produktens media-pool (den gör den efter import).

-----

## Klart-kriterium

- Fokussökordet finns i **titel, produktnamn (H1), slug, beskrivning och meta** → alla punkter i Wix SEO-assistenten blir gröna efter att panelen **laddats om**.
- Alla bilder har svenska alt-texter och **har kvar sina URL:er**.
- Produkten är **publicerad** (`visible:true`) – annars syns den inte i butiken.
- (Engångs-bekräftat: frontend renderar `<title>`/`<h1>`/meta från fälten och skickar egen `Product`-JSON-LD. Du behöver inte kontrollera detta per produkt.)

-----

## Utanför SEO (gör bara om uttryckligen ombedd)

- **Variant felmärkt som "Färg":** den delade optionen "Färg" (`0b32a475-…`, TEXT_CHOICES) hänger på ~100+ produkter – döp INTE om den. Skapa en egen unikt namngiven option och koppla om varianterna. Unikhet gäller `name`+`type`+`renderType`; choices kräver `choiceType:"CHOICE_TEXT"`; produktens option kräver `choicesSettings`. Se fullständig poleringsreferens.
- **Info-sektioner:** skapa inte en per produkt (taket är 400). Lägg innehåll i beskrivningen.
