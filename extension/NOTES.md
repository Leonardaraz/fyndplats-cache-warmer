# Fyndplats AliExpress Import — extension-anteckningar

## Uppdatera tillägget (Leonards väg — inga nedladdningar)

1. Dubbelklicka på **`uppdatera.bat`** i den här mappen. Den hämtar senaste
   koden själv (git pull om mappen är en klon, annars zip från GitHub — repo:t
   är publikt) och skriver "KLART! Tillägget är nu version X".
2. `chrome://extensions` → klicka **↻ (uppdatera-pilen)** på Fyndplats Import —
   versionen i rutan ska stiga.
3. Ladda om AliExpress-fliken (F5).

## Agent-läge: sidstyrd import (FP_IMPORT)

AV som default — slås på med "Sidstyrd import" i inställningarna. Låter en
DOM-agent (t.ex. Claude i webbläsaren) trigga importen från produktsidan:

```js
// Läskoll utan sidoeffekter (rekommenderas före import):
window.postMessage({ type: "FP_PING", requestId: 1 }, "*");
// → { type: "FP_PONG", requestId, version, agentEnabled, productId, busy }

// Import (multiplier + requestId valfria; force hoppar över dubblettstoppet):
window.postMessage({ type: "FP_IMPORT", multiplier: 1.8, requestId: 2 }, "*");
window.addEventListener("message", (e) => {
  if (e.data?.type === "FP_IMPORT_RESULT") console.log(e.data); // { ok, wixProductId?, error?, duplicates? }
  if (e.data?.type === "FP_IMPORT_STATUS") console.log(e.data.text);
});
```

Samma flöde som popupen inkl. DS-API-räddningen OCH dubblettgrinden (popupens
modal ersätts av ett stopp med `duplicates` — gå förbi med `force: true`).
Importer landar ALLTID som utkast i granskningskön (pending_review) — inget
når butiken utan publicering.

## Ladda om tillägget efter en kodändring (detaljer)

`content.js` är ett **content-script** — Chrome cachar det tills tillägget laddas
om. Efter en `git pull`/kodändring:

1. Öppna `chrome://extensions` i Chrome.
2. Slå på **Developer mode** (växeln uppe till höger) om den inte redan är på.
3. Hitta **"Fyndplats AliExpress Import"** och klicka på **↻ (reload-ikonen)**.
   - Kontrollera att versionen visar **0.1.7** (bumpas vid varje content/discover-
     fix så man ser att omladdningen tog).
4. **Ladda om AliExpress-sidan** (F5) — content-scripten injiceras vid
   sidladdning, så en redan öppen flik kör fortfarande den gamla koden. Detta
   gäller BÅDE produktsidor (`content.js`) och sök-/kategorisidor (`discover.js`).
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

## EU-lager-läge + bulk-import på sök-/kategorisidor (v0.1.7, `discover.js`)

Nytt content-script `discover.js` (+ `discover.css`) körs på AliExpress sök-/
kategori-/butikssidor (`/w/`, `/wholesale*`, `/category/`, `/p/`, `/store/` på
`*.aliexpress.com` och `.us`). Produktsidor (`/item/`) hanteras fortsatt enbart av
`content.js` (uteslutna via `exclude_matches`).

### EU-filter — hur det funkar (verifierat live 2026-06-02)
AliExpress filtrerar ship-from **server-sida** via URL-param **`shpf_co=<ISO2>`**
(t.ex. `?shpf_co=ES`). Verifierat: `summer dress` 60→9 träffar, alla "Ship from
EU", sidofältets Spanien-radio blir vald. **Begränsning:** param tar bara ETT land
(komma-separerat `ES,PL,IT` ignoreras → inget filter). Det finns alltså inget sätt
att visa alla EU-länder samtidigt via AE:s officiella filter.

Korten på sök-sidan bär INGEN ship-from-data (varken i DOM eller i embedded-JSON
`_dida_config_._init_data_…itemList.content` — bara ett opakt `curPageLogisticsUid`).
DOM-filtrering kort-för-kort är därför omöjlig; server-sidans `shpf_co` är enda
tillförlitliga vägen. Slutsats: vi LÅSER oss till `shpf_co` och visar EU-länderna
som ett-klicks-chips.

Flöde när EU-läge är PÅ:
1. Läs tillgängliga ship-from-länder ur sidofältets **"Shipping from"**-lista
   (hittas via rubriktexten, EN+SV; landsnamn → ISO via `NAME_TO_ISO`). Korsa med
   EU-listan. (Sidofältet finns bara för sökningar som HAR EU-lager — t.ex. kläder;
   "led lampor" saknar det helt → då finns inga EU-produkter att visa.)
2. Om inget `shpf_co` satt → auto-redirect (`location.replace`) till bästa
   tillgängliga EU-land (`EU_PRIORITY`). Guard i `sessionStorage` (`fp_eu_applied`)
   hindrar redirect-loop och respekterar AE:s "Clear all".
3. Banner högst upp: flagg-chips per EU-land (aktivt = orange), "Sortera: Mest
   sålda" (`sortType=total_tranpro_desc`), och "Stäng av på denna flik".

Två av/på-nivåer (per krav):
- **Globalt**: `chrome.storage.sync.euOnly` (togglas i popupen; broadcastar
  `EU_MODE_CHANGED` till alla öppna AE-flikar).
- **Per flik**: "Stäng av på denna flik" → `sessionStorage.fp_eu_tab_off` (släpper
  filtret bara på den fliken, globala läget kvar).

### Bulk-select + bulk-import
- Kryssruta (uppe vänster) + "Importera"-snabbknapp injiceras på varje kort
  (`a[href*="/item/"]` → närmaste `.card-out-wrapper`). MutationObserver +
  rAF-debounce dekorerar nya kort vid scroll/paginering. Markerat kort: orange ram
  + "FYNDPLATS"-stämpel. Markeringen lever kvar (Map på productId) vid om-rendering.
- Sticky bottom-bar: antal valda + miniatyrer + "Importera alla valda (N)" + "Rensa".
- **Import**: `discover.js` → background `BULK_IMPORT`. Background kör SEKVENTIELLT:
  öppnar varje produkt i en **dold flik** (`active:false`), väntar på `complete`,
  ber `content.js` om `EXTRACT_PRODUCT` (upp till 6 försök × ~2 s, eftersom AE
  renderar klient-sida), postar till `/api/import` (samma path som enskild import),
  stänger fliken. Status streamas till ursprungsfliken via `BULK_PROGRESS` och
  slutresultat via `BULK_DONE` (INTE via sendResponse — MV3-workern kan pausas under
  ett flerminuters jobb). Modal visar progress-bar + per-produkt-status +
  "Försök igen" på fel. Toast + länk till `/admin/queue` när klart.

### Manuell verifiering (kräver omladdat tillägg + apiBase/token i inställningar)
1. Popup → slå på "🇪🇺 EU-lager-läge".
2. Sök t.ex. "summer dress" → sidan filtreras till ett EU-land, banner med chips.
3. Bocka 3 kort → bottom-bar → "Importera alla valda" → modal räknar upp → de tre
   ska dyka upp i `/admin/queue`.
4. "Stäng av på denna flik" → filtret släpps bara där. Popup-toggle av → filtret
   släpps överallt.

## CHANGELOG
- **0.1.7** — EU-lager-läge (server-side `shpf_co`-filter + landschips) och bulk-
  select/bulk-import på sök-/kategorisidor (`discover.js`/`discover.css`,
  background `BULK_IMPORT`, popup-toggle). Ny `tabs`-permission.
- 0.1.6 — ship-from svenska landsnamn → ISO; per-variant-lager; m.m. (se git-logg).

## Känt (utanför denna fix)
- AE:s ship-from-filter tar bara **ett** land i taget — "EU-läge" visar därför ett
  EU-land åt gången (växla via chips), inte alla samtidigt. Det är en AE-begränsning,
  inte en bugg.
- Sök-/kategorisidor som saknar EU-lager (t.ex. många rena Kina-kategorier) visar
  bannern "Inga EU-lager hittades för denna sökning".
- Popupens variant-rad visar `costUsd` med dollartecken (`$…`) — det är
  inköpskostnaden i USD, inte slutpriset. Slutpris (SEK inkl. moms) räknas på
  servern.
