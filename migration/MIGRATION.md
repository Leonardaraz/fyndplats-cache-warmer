# Fyndplats v1 → Ny Headless v3 — Migrationsplan (verifierad mot live-schema)

Den här filen är till för att läsas av Claude Code i ditt nya headless-projekt. Den beskriver exakt hur produkter, varianter, bilder och kategorier ska flyttas från Fyndplats (v1) till nya v3-sajten utan kvalitetsförlust. Alla fältnamn, endpoints och enum-värden är verifierade mot Wix officiella API-spec per maj 2026.

## Förutsättningar

1. **Wix MCP installerat i Claude Code** för det nya projektet.
2. **Båda sajterna tillgängliga via Wix MCP:**
   - **Källa:** Fyndplats — `siteId = 8c62127f-c07a-4596-86b8-4e88b5cc502d` (v1)
   - **Mål:** Den nya headless-sajten — siteId fås via `ListWixSites`
3. **Wix Stores installerat på mål-sajten** — nya installationer hamnar på v3
4. **Bekräfta v3 på målsajten** med `GET https://www.wixapis.com/stores/v3/provision/version` — ska returnera `V3_CATALOG`
5. Filerna `collections.json` och `sample-products.json` ligger i samma mapp

## Översikt — körordning

```
1. Verifiera målsajt kör v3
2. Importera bilder till nya sajtens mediabibliotek → imageMap.json
3. Skapa kategorier från collections.json → categoryMap.json
4. Hämta produkter från Fyndplats v1 (paginerat)
5. Transformera v1 → v3 (se mappning nedan)
6. Bulk-skapa i v3 med Ricos-beskrivningar
7. Sätt initialt lager via Inventory API (separat anrop)
8. Tilläggs-koppla produkter till sina sekundära kategorier
9. Logga progress + retry på fel
```

## API-endpoints (alla verifierade)

| Syfte | Metod & URL | Scope/site |
|-------|-------------|-----------|
| Verifiera v3 på målsajt | `GET /stores/v3/provision/version` | mål-siteId |
| Hämta v1-produkter (källa) | `POST /stores/v1/products/query` | Fyndplats-siteId |
| Hämta v1-kategorier (källa) | `POST /stores/v1/collections/query` | Fyndplats-siteId |
| Skapa v3-kategori (mål) | `POST /categories/v1/categories` | mål-siteId |
| Bulk-skapa v3-produkter (med Ricos description) | `POST /stores/v3/bulk/products/create` | mål-siteId |
| HTML → Ricos konvertering | `POST /ricos/v1/ricos-document/convert/to-ricos` | mål-siteId |
| Importera bild till mediabibliotek | `POST /site-media/v1/files/import` | mål-siteId |

Basurl för alla: `https://www.wixapis.com`

**Viktigt om endpoint-val för produkter:**
Det finns två bulk-skapa-endpoints. Använd `bulk/products/create` (ej `bulk/products-with-inventory/create`) eftersom den senare bara accepterar `plainDescription` (HTML-sträng) och **inte** den rika Ricos-beskrivningen. Lager sätts i separat steg efteråt via Inventory API.

## Steg 1 — Verifiera v3

```
GET https://www.wixapis.com/stores/v3/provision/version
→ måste returnera { "catalogVersion": "V3_CATALOG" }
```

Om det returnerar `STORES_NOT_INSTALLED` eller `V1_CATALOG`, installera Wix Stores eller använd en annan sajt.

## Steg 2 — Importera bilder

För varje unik bild-URL i v1-produkterna:

```
POST https://www.wixapis.com/site-media/v1/files/import
Body:
{
  "url": "https://static.wixstatic.com/media/b379ce_...~mv2.jpg/...",
  "displayName": "<filnamn-eller-altText>",
  "mimeType": "image/jpeg" eller "image/png"
}
```

Svaret innehåller ett `file.id` (Wix Media Manager-ID) och `file.url` (wixstatic-URL). Spara `gammal-url → ny-url` i `imageMap.json`. Skriv till disk efter var 20:e import för säkerhets skull.

Det finns ~2000+ unika bilder i 207 produkter. Räkna med att det tar 15-30 minuter beroende på rate-limits.

## Steg 3 — Skapa kategorier

Iterera `collections.json`. För varje kategori (utom `00000000-...` "All Products" som finns automatiskt):

```
POST https://www.wixapis.com/categories/v1/categories
Body:
{
  "category": {
    "name": "<name>",
    "visible": <visible>
  },
  "treeReference": {
    "appNamespace": "@wix/stores"
  }
}
```

> **OBS:** `treeReference.appNamespace` måste vara `@wix/stores` för stores-kategorier. Verifiera mot create-category-dokumentationen om något verkar fel.

Svaret innehåller `category.id`. Spara `legacyId → newId` i `categoryMap.json`.

## Steg 4 — Hämta v1-produkter (paginerat)

```
POST https://www.wixapis.com/stores/v1/products/query (siteId=Fyndplats)
Body:
{
  "query": { "paging": { "limit": 100, "offset": <0/100/200> } },
  "includeVariants": true
}
```

Loopa tills `metadata.items < limit`. Totalt 207.

## Steg 5 — Transformera v1 → v3

Per produkt:

1. Konvertera `description` (HTML) → Ricos via:
   ```
   POST /ricos/v1/ricos-document/convert/to-ricos
   Body: { "html": "<p>...</p>", "options": { "plugins": ["image","link","textColor","heading"] } }
   → returnerar { "document": { "nodes": [...] } }
   ```
   Använd `document` direkt som värde för v3:s `description`-fält.
2. Konvertera varje `additionalInfoSections[].description` (HTML) → Ricos på samma sätt. Resultatet blir `description` i v3:s `infoSections[]`.
3. Bygg variant-listan. Om v1 saknar varianter, skapa en default-variant med `choices: []`.
4. Mappa bild-URL:er via `imageMap.json` till nya URL:er på mål-sajten.
5. Mappa `collectionIds[]` via `categoryMap.json`. Första (utom "All Products") blir `mainCategoryId`, övriga sparas i separat lista för Steg 8.

## v1 → v3 fält-mappning (verifierad mot live-schema)

### Top-level produkt

| v1 | v3 (Product) | Anmärkning |
|----|--------------|-----------|
| `name` | `name` | Direkt |
| `slug` | `slug` | v3 normaliserar; kan ändras om kollision |
| `visible` | `visible` | Direkt |
| `productType: "physical"` | `productType: "PHYSICAL"` | **VERSALER** — enum är `PHYSICAL`/`DIGITAL` |
| `brand: "Fyndplats"` | `brand: { name: "Fyndplats" }` | v3 är objekt |
| `ribbon: "..."` | `ribbon: { name: "..." }` | v3 är objekt |
| `description` (HTML-sträng) | `description: { nodes: [...] }` (Ricos) | **Konvertera via Ricos-API** |
| `description` (HTML-sträng) | `plainDescription: "<html>"` | Sätt också till samma HTML — används som SEO-fallback |
| `additionalInfoSections[]` | `infoSections[]` | Omdöpt (se nedan) |
| `collectionIds[0]` (första giltiga) | `mainCategoryId` | Resten kopplas i Steg 8 |
| `seoData` | — | Hoppa över. v3 regenererar från name + description |
| `manageVariants` | — | Implicit i v3 (alla produkter har varianter) |

### Info-sektioner

```
v1: additionalInfoSections: [{ title: "X", description: "<html>" }, ...]
v3: infoSections: [{
       uniqueName: "tekniska-specifikationer",   // slug-form av title, måste vara unik per sajt
       title: "Tekniska specifikationer",
       description: { nodes: [...] },             // Ricos från HTML
       plainDescription: "<html>"                 // HTML-fallback
     }, ...]
```

`uniqueName` är obligatoriskt och måste vara unikt på sajten. Använd t.ex. `<produkt-slug>-<section-slug>` för att garantera unikhet.

### Options (produkt-alternativ)

```
v1: productOptions: [{
      optionType: "drop_down",
      name: "Metallfärg",
      choices: [{ value: "Guld", description: "Guld", visible: true, inStock: true }, ...]
    }]

v3: options: [{
      name: "Metallfärg",
      optionRenderType: "TEXT_CHOICES",          // eller "SWATCH_CHOICES" för färgväljare
      choicesSettings: {
        choices: [
          { choiceType: "CHOICE_TEXT", name: "Guld" },
          { choiceType: "CHOICE_TEXT", name: "Silver" }
        ]
      }
    }]
```

Enum `optionRenderType`:

- `TEXT_CHOICES` — textbaserad lista (motsvarar v1:s `drop_down`)
- `SWATCH_CHOICES` — färg-/bild-väljare

### Varianter

```
v1: variants: [{
      choices: { "Metallfärg": "Guld" },
      variant: { sku: "FYND-001", priceData: { price: 99.99 } },
      stock: { quantity: 21, trackQuantity: true }
    }]

v3: variantsInfo: {
      variants: [{
        sku: "FYND-001",
        visible: true,
        choices: [
          { optionChoiceNames: { optionName: "Metallfärg", choiceName: "Guld", renderType: "TEXT_CHOICES" } }
        ],
        price: {
          actualPrice: { amount: "99.99" },          // sträng, ej tal
          compareAtPrice: { amount: "129.99" }       // valfritt, för "ord. pris X kr"
        },
        inventoryStatus: { inStock: true, preorderEnabled: false }
      }]
    }
```

**Viktiga detaljer:**

- `actualPrice.amount` är en **sträng**, inte ett tal: `"99.99"` inte `99.99`
- För produkter utan varianter i v1: skapa **en** variant med `choices: []`
- `inventoryStatus.inStock` är bara en boolean. Exakta lagersaldon sätts i separat Inventory API-anrop efter produktskapande.
- v3:s variant-choices använder `optionChoiceNames` med namn-strängar + `renderType` matchande optionen

### Media (bilder)

```
v1: media.items: [{ image: { url: "https://...", width: 800, height: 800 } }, ...]

v3: media: {
      main: { url: "https://static.wixstatic.com/...", altText: "..." },
      itemsInfo: {
        items: [
          { url: "https://static.wixstatic.com/...", altText: "..." },
          ...
        ]
      }
    }
```

**Första objektet i `items[]` blir automatiskt main-bild.** Max 50 bilder per produkt i v3.

## Steg 6 — Bulk-skapa produkter

Skapa 20 produkter per anrop (säkert under max 100):

```
POST /stores/v3/bulk/products/create (siteId=mål)
Body:
{
  "products": [ <transformed product 1>, <transformed product 2>, ... ],
  "returnEntity": true,
  "fields": ["CURRENCY", "URL"]
}
```

Spara svaret. Varje produkts nya `id` och `slug` skrivs till `migrated-products.jsonl` (en rad per produkt).

## Steg 7 — Sätt initiala lagersaldon

För varje skapad variant där v1 hade `stock.quantity > 0`, anropa Inventory API:

- Endpoint: `POST /stores/v3/bulk/inventory-items/update`
- Body: `{ inventoryItems: [{ inventoryItem: { id, revision, trackQuantity: true, trackingMethod: { quantity: N } } }] }`
- Hämta först inventory-items via `POST /stores/v3/inventory-items/query` med `{ query: { filter: { productId } } }` för att få `id` + `revision`.

Detta görs som separat steg efter produktskapande eftersom `variantsInfo.variants.inventoryStatus.inStock` bara är en boolean.

## Steg 8 — Koppla produkter till sekundära kategorier

För varje produkt som tillhör fler än en kategori i v1, anropa kategori-tilläggs-endpointen (sök i docs: `add-products-to-category` eller motsvarande under `/categories/v1/categories/`).

## Återupptagning efter krasch

Filer som skriptet underhåller:

- `imageMap.json` — gamla URL → nya URL på mål-sajten (+ file.id)
- `categoryMap.json` — gamla legacy-ID → nya v3-ID
- `migrated-products.jsonl` — en rad per skapad produkt
- `failed.jsonl` — produkter med fel, för retry

Skriptet kan återuppta från där det avbröts: kolla vilka produkter (per slug) som redan finns i målsajten innan skapande.

## Verifiering efter migration

1. `POST /stores/v3/products/query` → räkna 207
2. Stickprov 10 slumpvis produkter — verifiera namn, pris, antal varianter, antal bilder
3. Öppna en variant-tung produkt och kolla att alla varianter med rätt SKU finns
4. Verifiera att Ricos-beskrivningarna rendrar korrekt i frontenden (formatering, inline-bilder, listor)
5. Räkna kategorier (68) och kontrollera att 5-10 produkter har rätt mainCategoryId + sekundära kategorier

## Dry-run mode (krav)

Skriptet **måste** ha en `--dry-run` flag som:

- Läser produkter från `sample-products.json` (eller fetchar paginerat från v1 om `--source=live`)
- Transformerar dem till v3-strukturen
- Skriver ut JSON för exempel-produkterna i konsolen
- **Skapar inget** på målsajten

Kör dry-run mot `sample-products.json` först, granska output, kör sen skarpt.
