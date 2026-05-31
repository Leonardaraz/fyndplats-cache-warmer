# EU-warehouse-filter — implementationsnoteringar

Den här filen beskriver det nya EU-lager-filtret som lagts till i import-
verktyget (cache-warmer-repot). Branchen är inte pushad — listan över commit-
kommandon finns nederst.

## Modifierade/skapade filer

### Nya filer

- `lib/aliexpress/eu-countries.ts` — konstant-lista EU-warehouse-länder + normalisering/hjälpare
- `lib/watchlist/store.ts` — persistent bevakningslista (memory + Wix Data backend)
- `app/admin/discover/page.tsx` — server-shell för upptäcktssidan
- `app/admin/discover/DiscoverClient.tsx` — interaktiv sök-/import-UI
- `app/admin/discover/actions.ts` — server-actions (sök, importera, watchlist)
- `app/admin/discover/types.ts` — delade typer mellan client och actions
- `app/api/aliexpress/discover/route.ts` — utökad sök-endpoint (sortBy, max-pris, EU-filter, paginering)
- `app/api/cron/watchlist/route.ts` — dagligt cron-jobb för bevakningslistan (mejlar nya träffar)

### Modifierade filer

- `lib/aliexpress/types.ts` — `AliExpressDsVariant.shipFrom`, `AliExpressDsProduct.shipsFromCountries` + `hasEuWarehouse`
- `lib/aliexpress/client.ts` — `getProduct()` extraherar shipFrom per SKU; `searchAliExpressByText()` tar `options` (sortBy/page/pageSize/maxPriceUsd/categoryId) och returnerar `shipsFromCountries`/`warehouseClass`
- `lib/import/types.ts` — `AliExpressVariant.shipFrom`, `AliExpressProduct.shipsFrom`
- `lib/import/pipeline.ts` — aggregerar warehouse-koder, sätter Wix-ribbon `"EU-lager"`, returnerar `shipsFromCountries`/`hasEuWarehouse`/`warehouseClass`
- `lib/store/index.ts` — `ProductMappingRecord` får `shipsFromCountries` + `hasEuWarehouse` + `warehouseClass`
- `app/api/import/route.ts` — Zod-schemat tar emot `shipFrom` per variant + `shipsFrom` på toppen; persisterar warehouse-fälten på mapping-posten
- `app/admin/queue/page.tsx` — filter-chips (Alla / Endast EU-lager), sort-chips (Senast först / EU först), EU-badge på varje card
- `app/admin/page.tsx` — länk till `/admin/discover` i Verktyg-listan
- `extension/content.js` — läser `shipFrom` per variant från `skuPriceList`/`shippingModule`/`crossBorderModule`; aggregerar `result.shipsFrom`
- `extension/background.js` — vidarebefordrar `shipsFrom` (produkt) och `shipFrom` (variant) i POST-payloaden
- `extension/popup.js` — färgade badges per variant + sammanfattningsbadge i headern
- `extension/popup.html` — CSS för badges (EU/CN/unknown)

## Designval

- **EU-länder**: defaultlistan är `['ES','DE','CZ','PL','FR','IT','NL','BE','GB']` — GB ingår eftersom flera "EU-warehouses" är UK-baserade med snabb leverans inom Västeuropa. Kan överstyras via env `FYNDPLATS_EU_COUNTRIES="ES,DE,FR"` utan kodändring.
- **Lagring av warehouse-metadata**: chose to extend `ProductMappingRecord` (least invasive — collection-schemat behöver inga ändringar och allt blir tillgängligt i samma queries `/admin/queue` redan gör). I Wix Stores använder vi `ribbonName: "EU-lager"` istället för custom-fält eller product tags — det renderas inbyggt på produktkort/produktsida utan extra Velo-kod, och sajten kan läsa samma fält.
- **AliExpress-search-scope**: `/admin/discover` använder `aliexpress.ds.text.search` (samma som befintlig `/api/aliexpress/search`) eftersom det är den enda sökmetod vår app-grupp bevisat har permission på. `aliexpress.affiliate.product.query` finns men kräver en separat affiliate-app som vi inte har aktiverat. Begränsning: `ds.text.search` returnerar inte alltid `shipFrom`/`orders`/`rating` per träff — vi tolererar `UNKNOWN` warehouse på listsidan och bekräftar EU-status först när Leonard klickar Importera (då hämtas full produkt-detail).
- **Rate-limit**: `/api/aliexpress/discover` har en in-memory throttle på 2 s mellan anrop (skyddar mot dubbel-klick). Cron-jobbet pausar 2,1 s mellan termer.
- **Wix-ribbon för EU**: `ribbonName` sätts till `"EU-lager"` när någon variant skickas från EU. Headless-sajten plockar redan fram ribbonen — se följduppdrag nedan för exakt badge-spec.

## Följduppdrag i `fyndplats-headless` (Leonard kör separat)

Sajt-spec: visa en grön badge "EU-lager • snabb leverans" på produktkortet och produktsidan när Wix-produkten har `ribbon.name === "EU-lager"` (alternativt: när Wix-produkten har shipping-origin-data som matchar EU-listan).

**Filer att uppdatera (i `fyndplats-headless`):**

- `components/product/ProductCard.tsx` — render badge ovanpå produktbilden om `product.ribbon?.name === "EU-lager"`
- `app/produkt/[slug]/page.tsx` (eller motsvarande) — render badge under titeln på produktsidan
- Optional: dela en `EuWarehouseBadge.tsx` mellan kort + detalj

**Föreslagen badge-markup (Tailwind):**

```tsx
function EuWarehouseBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 ring-1 ring-green-200">
      <span aria-hidden>🇪🇺</span>
      EU-lager · snabb leverans
    </span>
  );
}
```

Visa den på produktkortet i ett `<div className="absolute top-2 left-2 z-10">`-overlay, och på produktsidan inline under titeln.

## Verifiering efter deploy

1. **Tilläggspopupen visar badges**:
   - Öppna en AliExpress-produkt där sellern har "Ships from Spain" → popup ska visa `🇪🇺 EU-lager (ES)` i headern, grön EU-badge per variant.
   - Öppna en typisk Kina-produkt → orange/röd "Kina"-badge.

2. **`/api/import` accepterar shipsFrom**:
   ```powershell
   curl -X POST https://fyndplats-cache-warmer.vercel.app/api/import `
     -H "Content-Type: application/json" `
     -H "x-fyndplats-token: $env:EXTENSION_API_TOKEN" `
     -d '{"supplierProductId":"test","sourceUrl":"https://www.aliexpress.com/item/test.html","rawTitle":"Test","rawDescription":"","imageUrls":[],"shipsFrom":["ES"],"variants":[{"supplierVariantId":"v1","options":{},"costUsd":1,"shipFrom":"ES","included":true}]}'
   ```
   Förväntat: 201, `result.hasEuWarehouse=true`, `result.warehouseClass="EU"`.

3. **`/admin/queue` visar badge + filter**:
   - Importera en EU-produkt → öppna `/admin/queue` → cardet ska ha grön "EU-lager"-badge.
   - Klicka "Endast EU-lager"-chipen → bara EU-produkter syns.
   - Klicka "EU först"-sort → EU-produkter ligger överst.

4. **`/admin/discover` söker och importerar**:
   - Öppna `/admin/discover`.
   - Sök "yogamatta" med EU-filter på → träfflistan ska visa EU-warehouses (eller okänd om AliExpress-listan saknar fältet).
   - Klicka Importera på en träff → produkten ska dyka upp i `/admin/queue` med EU-badge (om EU) eller Kina-badge.

5. **Watchlist + cron**:
   - Lägg till "led-lampa" som bevakning på `/admin/discover`.
   - Trigga cron manuellt:
     ```powershell
     curl https://fyndplats-cache-warmer.vercel.app/api/cron/watchlist `
       -H "x-fyndplats-token: $env:EXTENSION_API_TOKEN"
     ```
   - Förväntat: `{ok:true, terms:1, diffsByTerm:[{term:"led-lampa", newCount: N}]}`.
   - Kör en gång till direkt — `newCount` ska vara 0 (allt redan sett).
   - Mejlcheck: efter första körningen bör Leonard få ett "Fyndplats bevakning"-mejl om EU-träffar fanns.

6. **Wix-produkt får ribbon**:
   - I Wix Stores-admin: granska den nyimporterade produkten → fältet "Etikett/Ribbon" ska vara "EU-lager".

## Env-tillägg som kan behövas

- `FYNDPLATS_EU_COUNTRIES` *(valfritt)* — komma-separerad lista, t.ex. `"ES,DE,FR"` — överstyr default-EU-listan.
- `WATCHLIST_NOTIFY_EMAIL` *(valfritt)* — vart watchlist-cron mejlar; fallback till `SYNC_NOTIFY_EMAIL`.
- `WIX_DATA_COL_WATCHLIST` *(valfritt)* — Wix Data-collection-namn för bevakningslistan; default `"FyndplatsDiscoverWatchlist"`. Skapas på första add.

## Vercel Cron — lägg till i `vercel.json`

Lägg till en post i `crons`-arrayen (skapa arrayen om den saknas):

```json
{
  "crons": [
    { "path": "/api/cron/watchlist", "schedule": "0 6 * * *" }
  ]
}
```

## Commit + push (PowerShell — Leonard kör manuellt)

Branch är inte pushad. Kör följande från projektroten:

```powershell
cd C:\Users\leona\fyndplats-cache-warmer

# Granska först vad som ändrats
git status
git diff --stat

# Lägg till alla nya och modifierade filer i EU-filtret
git add `
  lib/aliexpress/eu-countries.ts `
  lib/aliexpress/types.ts `
  lib/aliexpress/client.ts `
  lib/import/types.ts `
  lib/import/pipeline.ts `
  lib/store/index.ts `
  lib/watchlist/store.ts `
  app/api/import/route.ts `
  app/api/aliexpress/discover/route.ts `
  app/api/cron/watchlist/route.ts `
  app/admin/page.tsx `
  app/admin/queue/page.tsx `
  app/admin/discover/page.tsx `
  app/admin/discover/DiscoverClient.tsx `
  app/admin/discover/actions.ts `
  app/admin/discover/types.ts `
  extension/content.js `
  extension/background.js `
  extension/popup.js `
  extension/popup.html `
  EU-FILTER-NOTES.md

git status
git commit -m "feat(import): EU warehouse filter and discovery"
git push origin main
```

Om `git status` visar att en parallell task (profitability, mappings-fix) också har ändringar på samma fil — granska diffen först och pick:a in deras del innan commit, så ingenting tappas.
