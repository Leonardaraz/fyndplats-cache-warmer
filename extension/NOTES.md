# Fyndplats AliExpress Import — extension-anteckningar

## Ladda om tillägget efter en kodändring

`content.js` är ett **content-script** — Chrome cachar det tills tillägget laddas
om. Efter en `git pull`/kodändring:

1. Öppna `chrome://extensions` i Chrome.
2. Slå på **Developer mode** (växeln uppe till höger) om den inte redan är på.
3. Hitta **"Fyndplats AliExpress Import"** och klicka på **↻ (reload-ikonen)**.
   - Kontrollera att versionen visar **0.1.1** (bumpas vid varje content.js-fix
     så man ser att omladdningen tog).
4. **Ladda om AliExpress-produktsidan** (F5) — content-scriptet injiceras vid
   sidladdning, så en redan öppen flik kör fortfarande den gamla koden.
5. Klicka på tilläggsikonen → popupen ska visa varianter och en aktiv
   **"Importera valda varianter"**-knapp.

> Är tillägget inte laddat alls: `chrome://extensions` → **Load unpacked** →
> välj mappen `extension/`.

## Hur produktdatan extraheras (content.js)

AliExpress nya PC-sida (`pc-detail`) renderas helt klient-sida via React.
`window.runParams` är numera `null` och **ingen produkt-JSON ligger inbäddad** i
sidan (datat hämtas via XHR rakt in i React-state, ej åtkomligt). Därför är
JSON-LD + DOM huvudkällan. Strategin är lagervis (faller tillbaka i tur och
ordning) — se kommentarsblocket högst upp i `content.js`.

### Pris (`extractPriceUsd`)
Måste bli **USD** — servern (`lib/config.ts` → `pricingConfigFromEnv`, env
`USD_TO_SEK` default 10.5) räknar `costSek = costUsd * usdToSek` och därefter
markup ×2.5 + moms (`lib/import/pricing.ts`). Sidan visar Leonards lokalvaluta
(SEK), så vi konverterar via `UNITS_PER_USD` (SEK-kursen = serverns default
usdToSek så det går "tur och retur" rent).

Källor i prioritetsordning:

| # | Källa | Hur |
|---|-------|-----|
| 1 | **JSON-LD `<Product>` offers** | `script[type="application/ld+json"]` → `offers.price` (Offer) eller `offers.lowPrice` (AggregateOffer) + `offers.priceCurrency` (ISO, t.ex. `"SEK"`). **Renaste källan.** |
| 2 | `<title>` | `"196.11SEK 36% Off \| …"` → regex `^([\d.,]+)\s*([A-Za-z]{3})` (punkt-decimal + ISO-kod). |
| 3 | og:title / twitter:title | samma format som title. |
| 4 | Pris-span i DOM | `[class*="price--currentPriceText"]` → lokalformaterat (`"196,11 kr"`), valuta gissas via `detectCurrency`. |

### Bilder
**Värdnamnet bytte** från `alicdn.com` → `aliexpress-media.com` / `ae-pic-*`.
Det gamla `alicdn`-only-filtret slängde alla bilder → "saknar bild"-buggen.
Nu accepteras alla via `IMAGE_HOST_RE = /(alicdn\.com|aliexpress-media\.com|ae-pic)/i`.

- Galleri: `[class*="slider--img"] img`, `[class*="image-view"] img`,
  `[class*="slider--item"] img`, `[class*="magnifier"] img`.
- Fallback: `meta[property="og:image"]` (ofta `ae01.alicdn.com`), annars alla `<img>`.
- `cleanImageUrl` strippar storleks-/format-suffix:
  `"….png_220x220q75.jpg_.avif"` → `"….png"` (full upplösning).

### Varianter (`extractDomSkuGroups`)
SKU-rutorna i DOM:

- Grupp-container: `[class*="sku-item--property"]`, lista: `[class*="sku-item--skuList"]`.
- Gruppnamn (`Color` / `Size` / `Ships From`): `[class*="sku-item--title"]`,
  texten före `":"` (titeln visar `"Color: <valt värde>"`).
- Optionsvärden: `[class*="sku-item--box"]` (text) och `[class*="sku-item--imageWrap"]`
  (färg-swatch med `<img>`).
- Grupper vars namn matchar `SHIP_PROP_RE` (`ship|skicka|frakt|country|land|warehouse|lager`)
  blir **warehouse-koder** (`shipsFrom`), inte variant-dimensioner.
- Övriga grupper bildar en **kartesisk produkt** (taklagt till 60 varianter).

> **Begränsning:** AliExpress visar bara priset för den *valda* varianten i DOM,
> så alla DOM-byggda varianter får **baspriset**. En varning läggs i `_warnings`
> ("Kontrollera priserna före publicering"). Skulle AliExpress någon gång åter
> bädda in `skuModule.skuPriceList` plockar lager 1 upp riktiga per-variant-priser
> automatiskt (den koden finns kvar).

## Verifierat 2026-05-31 (4 produkttyper)

| Produkt | item-id | Resultat |
|---------|---------|----------|
| Kroppsvåg (Leonards testlänk) | 1005010348804994 | pris $18.68 (JSON-LD 196,11 kr), 7 bilder, Color×7 |
| T-shirt (Color + Size) | 1005009544488417 | pris $4.01, 6 bilder, Color + Size (kartesiskt) |
| Poster (Color + Ships From) | 1005006830101552 | pris $1.34, 6 bilder, Color + Ships From-filtrering |
| Enkel produkt (inga varianter) | 1005003351373581 | pris $2.27, 6 bilder, 1 default-variant |

## Känt (utanför denna fix)
- Popupens variant-rad visar `costUsd` med dollartecken (`$…`) — det är
  inköpskostnaden i USD, inte slutpriset. Slutpris (SEK inkl. moms) räknas på
  servern.
