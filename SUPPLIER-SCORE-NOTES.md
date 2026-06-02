# Säljar-score (Feature 6) + SEO-vänlig OOS-komplettering (Feature 8)

Två gratis-features (INGA Anthropic-anrop). Allt nytt är best-effort: en
misslyckad säljar-/restock-skrivning får aldrig fälla import-, order- eller
sync-flödet.

## Feature 6 — Säljar-score per AliExpress-leverantör

Spårar hur AE-säljare presterar över tid så vi kan undvika dem som börjar bli
dåliga (höga klagomål / långa leveranstider).

### Datamodell

- **Ny Wix Data-kollektion `FyndplatsSuppliers`** (en rad per AE seller-id).
  Fält: `supplierId`, `supplierName`, `supplierStoreUrl`, `aeRating`,
  `aeFollowers`, `productsImported`, `productsSold`, `avgShipDays`,
  `shipDaysSamples`, `complaintCount`, `complaintRate`, `firstSeenAt`,
  `lastUpdatedAt`, `status`.
  Skapas via `node scripts/ensure-supplier-collection.mjs` (idempotent).
- **`FyndplatsProducts`/mappnings-raden** (`FyndplatsMappings`) fick foreign key
  `supplierId` (+ denormaliserat `supplierName`) — `lib/store/index.ts`.

### Logik — `lib/import/supplier-tracking.ts`

- `recordSupplierImport(supplier, productWixId)` — upsertar säljaren, ökar
  `productsImported`, uppdaterar senast skrapade AE-fält (namn/rating/followers).
- `recordOrder(productWixId, {units?, shipDays?, supplierId?})` — ökar
  `productsSold` (med kvantitet), uppdaterar löpande `avgShipDays`.
- `recordComplaint(productWixId, reason, {supplierId?})` — ökar `complaintCount`.
- `getSupplierStatus(supplierId)` — returnerar raden (status m.m.).
- Rena, enhetstestade hjälpfunktioner (`lib/import/supplier-tracking.test.ts`):
  - `computeComplaintRate(complaintCount, productsSold)` — % (0 sålda → 0 %).
  - `computeSupplierStatus({complaintRate, avgShipDays})` — heuristik:
    - `complaintRate > 10%` → **blocked**
    - `complaintRate > 5%` → **warning**
    - `complaintRate ≤ 5%` och `avgShipDays > 30` → **warning**
    - annars → **good**
  - `updateRunningAverage()` — löpande medel för leveranstid.
  - `complaintRate` + `status` räknas ALLTID om (reconcile) vid varje mutation så
    de aldrig blir inkonsekventa med räknarna.

### Extension — fält som nu skrapas (`extension/content.js` → `extractSupplier`)

`supplierId` (AE store-id — vår nyckel), `supplierName`, `supplierStoreUrl`,
`aeRating` (1–5; härleds ur `positiveRate` när bara feedback-% finns),
`aeFollowers`. Källor i prioritet: inbäddad `storeModule/sellerModule` →
`/store/{id}`-länk → dedikerade DOM-block (`[data-pl="store-name"]`, `.store-info`
m.fl.). Skickas i import-payloaden (`extension/background.js`) bara när
`supplierId` kunde identifieras.

### Server-integration

- `app/api/import/route.ts` — tar emot `supplier`, sätter `supplierId`/
  `supplierName` på mappningen och kallar `recordSupplierImport` (best-effort).
- `app/api/wix-order/route.ts` (befintlig order-webhook) — kallar `recordOrder`
  per produkt med aggregerad kvantitet → `productsSold`.
- `app/api/supplier-status` (GET) — extensionen slår upp status FÖRE import.
- `app/api/supplier/order` (POST) + `app/api/supplier/complaint` (POST) — för
  fyndplats-headless webhook (`order_fulfilled` → order, `refund_created` →
  complaint). Headless-wiringen ligger i det repot; endpoints + funktioner är
  klara här.

### Varningar i UI

- **Extension (`popup.js`):** efter skrap slås säljarstatus upp.
  `blocked` → röd varning + `confirm()`-modal vid import ("hög klagomålsprocent
  (X%) … Importera ändå?"). `warning` → gul toast. `good`/okänd → ingen varning.
- **`/admin/queue`:** färgkodad säljar-badge per produkt (good/warning/blocked)
  med klagomåls-%, leveranstid, antal importerade/sålda och AE-score i tooltip.

### Backfill (`scripts/backfill-suppliers.mjs`)

Går igenom mappningar utan `supplierId`, hämtar AE-sidan och försöker plocka
säljar-id/namn ur HTML:en. **Ärlig begränsning:** AE:s nya PC-sida är
klient-renderad (`runParams=null`), så säljar-id finns ofta inte i den råa
HTML:en → de produkterna **skippas** (rapporteras) och får `supplierId` vid nästa
manuella om-import istället. DRY-RUN som default
(`BACKFILL_DRY_RUN=false` för att skriva).

## Feature 8 — SEO-vänlig Out-of-Stock

**Kärnan fanns redan** (se `OOS-HYBRID-NOTES.md`): produkter göms INTE vid OOS —
de behåller `visible:true`, `inventory=0` är OOS-signalen, headless filtrerar bort
dem ur listningar men renderar produktsidan med "Slutsåld"-banner, bevaknings-
formulär och `availability: OutOfStock`. Restock-bevakare
(`FyndplatsRestockSubscribers`, schema `{productId, email, subscribedAt,
notifiedAt}`) + restock-mejl skickas redan i `lib/sync/aliexpress-sync.ts`.

### Detta tillägg (cache-warmer)

- **`outOfStockSince`** — ny tidsstämpel i sync-state (`lib/sync/sync-log.ts`),
  sätts vid övergången aktiv→slut och nollas vid restock. Fryses i dry-run
  (samma semantik som `lastOosAlertAt`). Låter headless visa "Slutsåld sedan X".
- **`FyndplatsRestockLog`** — ny kollektion + `lib/restock/log.ts`. Varje restock
  loggas (produkt, tid, antal notifierade bevakare, nytt lagersaldo) för en
  admin-tidslinje. Skapas av `ensure-supplier-collection.mjs`.

## Verifiering

- `npx vitest run lib/import/supplier-tracking.test.ts` → 11 gröna (heuristik +
  complaintRate + löpande medel).
- `npx tsc --noEmit` rent för alla filer i denna task (övriga fel i trädet hör
  till de parallella dedup-/review-taskarna, inte denna).

## OOS-status idag

Faktiskt antal produkter som är OOS just nu kräver en live-körning av
`/api/cron/aliexpress-sync` mot Wix/AliExpress (kunde inte köras i bygg-sessionen
utan live-credentials). Hybrid-OOS gör att inga OOS-produkter göms — de var redan
synliga via det befintliga flödet; detta tillägg lägger bara till `outOfStockSince`
+ restock-loggen ovanpå.
