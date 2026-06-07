# Fyndplats — Handoff till nästa Claude Code-session

**Senast uppdaterat:** 2026-05-28
**Branch:** `claude/hej-Lyf8v`
**PR:** [Leonardaraz/fyndplats-cache-warmer#3](https://github.com/Leonardaraz/fyndplats-cache-warmer/pull/3) (draft)

Den här filen är till för en ny Claude Code-instans som tar över på en annan
dator. Läs den först. Den summerar **två parallella spår** vi byggt i samma
repo plus exakt vad användaren behöver göra nu.

---

## TL;DR

Repot startade som en cache-warmer för fyndplats.se (Python-script + GitHub
Action — finns kvar orört i roten). Ovanpå det har vi byggt **två separata
saker** på branchen `claude/hej-Lyf8v`:

1. **Ett headless dropship-verktyg** (DSers-ersättning) — Next.js + MV3
   browser-tillägg som importerar AliExpress-produkter till Wix Stores V3
   med svensk SEO, lagersync, prisbevakning, order-webhook,
   fulfillment-kö och persistent lagring.
2. **En migrations-pipeline från Wix v1 → v3** för användarens befintliga
   207 produkter och 68 kategorier i Fyndplats-butiken till en ny headless
   site (`wix-vibe-site-u4lp`).

Båda är **kod-kompletta lokalt (68 enhetstester gröna, ren typecheck, ren
build)** men **inget har körts skarpt mot riktig data** ännu. Återstående
steg är användarens händer.

---

## Hur du picker upp

```bash
git clone https://github.com/Leonardaraz/fyndplats-cache-warmer
cd fyndplats-cache-warmer
git checkout claude/hej-Lyf8v
pnpm install
cp .env.example .env.local   # fyll i värden, se nedan
pnpm test                    # 68/68 ska vara gröna
pnpm typecheck               # rent
pnpm build                   # bygger
```

Verktyg: Node 22+, pnpm. Vitest för tester. Next.js 15 (App Router) för
admin/API. Anthropic SDK för Claude-anrop. Wix REST V3 för katalog/media.

---

## Repostruktur (det viktiga)

```
app/                           # Next.js app router (dropship-verktyget)
  admin/page.tsx               # dashboard: tasks, profit, audit
  api/
    import/route.ts            # AliExpress -> Wix V3 produkt
    sync/route.ts              # lager + prisbevakning
    wix-order/route.ts         # Wix eCom order-webhook (JWT-verifierad)
    tasks/route.ts             # listar fulfillment-tasks
    fulfillment/
      mark-ordered/route.ts    # task pending -> ordered
      complete/route.ts        # task ordered -> shipped + tracking till Wix
    orders/cancel/route.ts     # task -> cancelled (flaggar refundRequired)

lib/                           # backend-logik (alla domäner med tester)
  ai/claude.ts                 # Anthropic SDK-wrapper
  audit.ts                     # bekvämlighetsfunktion + isDryRun()
  config.ts                    # env -> PricingConfig / PaymentFeeConfig
  auth.ts                      # x-fyndplats-token -guard (timingSafeEqual)
  analytics/profit.ts          # vinstberäkning per produkt
  import/
    pricing.ts                 # VAT/IOSS + charm9-avrundning (testat)
    seo.ts                     # Claude -> svensk SEO + alt-texter
    pipeline.ts                # SEO -> pricing -> Wix create
    types.ts
  orders/
    types.ts, tasks.ts         # WixOrder -> per-line FulfillmentTask
    webhook.ts                 # RS256-JWT-verifiering (testat)
    status.ts                  # statusmaskin med guards (testat)
  queue/queue.ts               # återupptagbar kö (testat)
  store/
    index.ts                   # Store-interface
    memory.ts                  # MemoryStore (dev)
    wix-data.ts                # WixDataStore (persistent, /data/v2)
    factory.ts                 # getStore() väljer via STORE_BACKEND
  sync/
    inventory.ts               # SKU-matchning + bulk-update
    price-watch.ts             # marginal-skydd (testat)
  wix/
    client.ts                  # Catalog V3: createProduct, inventory, fulfillment
    media.ts                   # Site Media: /files/import

extension/                     # MV3 browser-tillägg
  manifest.json                # host_perms: aliexpress + alicdn
  content.js                   # skrapar AliExpress productSKUPropertyList
  popup.html/js                # variant-filter checkboxes + sample-color
  background.js                # OffscreenCanvas-färgsampling + API-anrop
  orders.html/js               # orderläge: kö, "markera beställd"
  options.html/js              # konfig: API-URL + token

migration/                     # v1 -> v3 katalog-migration (skilt från ovan)
  README.md, MIGRATION.md      # plan + verifierad fältmappning
  collections.json             # 68 kategorier (export från Fyndplats)
  sample-products.json         # 1 sample-produkt
  scripts/
    transform.ts               # pure v1 -> v3 (12 tester)
    transform.test.ts
    source.ts                  # paginerad v1 product-query
    target.ts                  # alla v3-skrivningar
    ricos.ts                   # HTML -> Ricos via /ricos/v1
    orchestrator.ts            # main: kör alla steg, resumable, dry-run

ping_sitemap.py                # ORIGINAL cache-warmer (rör inte)
.github/workflows/cache-warm.yml
```

---

## Spår 1 — Dropship-verktyget (PR #3)

### Vad det gör

Användaren har en separat affär (planerad headless site) där hon vill
dropshippa AliExpress-produkter utan att betala DSers. Verktyget:

1. Browser-tillägg på AliExpress läser produkten, visar varianter med
   kryssrutor (variant-filter), samplar färg från färgbilden via
   OffscreenCanvas (undgår CORS-tainting), POSTar till `/api/import`.
2. `/api/import` (token-skyddad) översätter till svenska + bygger SEO med
   Claude, lägger på påslag inkl. svensk moms (25%), flaggar IOSS-tröskel
   (>150€), laddar upp bilder till Wix Media Manager, skapar V3-produkt
   med färg-swatch-options (`SWATCH_CHOICES` + `ONE_COLOR` + `colorCode`).
   Avbockade varianter blir `visible:false` (inte borttagna — Wix kräver
   komplett variant-set).
3. `/api/sync` — flaggar inköpsprishöjningar eller auto-justerar Wix-pris
   för att behålla marginalen. Uppdaterar lager per variant via V3
   inventory bulk-update.
4. `/api/wix-order` — Wix eCom-webhook (RS256-JWT-verifierad,
   idempotent på event-id), skapar **en task per orderrad**
   (multi-leverantör per order stöds).
5. Tilläggets orderläge listar pending tasks i en återupptagbar kö
   (snapshot i `chrome.storage`), öppnar leverantörssidan, markerar
   beställd via `/api/fulfillment/mark-ordered`.
6. `/api/fulfillment/complete` pushar spårningsnummer till Wix-ordern
   via `/ecom/v1/.../create-fulfillment`.
7. `/api/orders/cancel` — guard mot att avbryta skickad rad, flaggar
   `refundRequired:true` om beställd hos leverantör.
8. Admin (`/admin`) visar: env-status, task-summary, lönsamhetstabell
   sorterad på lägsta vinst överst, senaste audit-händelser.

### Säkerhet / robusthet

- **Auth-token** (`EXTENSION_API_TOKEN`) på alla muterande endpoints,
  jämförd med `timingSafeEqual`.
- **Webhook-signaturverifiering**: RS256-JWT med Wix offentliga nyckel
  (testat med egen genererad keypair).
- **Idempotens**: webhook event-id avdupliceras i Store; tasks
  `createTaskIfAbsent` skapar bara om saknas.
- **Återupptagbar kö**: stuck "active" sätts om till "pending" vid
  resume så ingenting dubbel-beställs.
- **Audit-logg** på import/price-alert/order/ship/cancel.
- **`DRY_RUN=1`** kortsluter alla Wix-skrivningar (createProduct,
  inventory, fulfillment, media import) så hela flödet kan testas mot
  ej-live.

### Persistent lagring

`STORE_BACKEND=memory` (default, dev) eller `wix-data` (skarpt — kräver
fyra Wix Data-collections som måste skapas i CMS:
`FyndplatsMappings`, `FyndplatsWebhookEvents`, `FyndplatsTasks`,
`FyndplatsAudit`). Implementationen är `lib/store/wix-data.ts` mot
`/data/v2/items` (insert/save/get/query).

### Vad som INTE är gjort på dropship-spåret

- Auto-förifyllning av AliExpress-kassan (orderläget kräver fortfarande
  att användaren klickar i adress/variant manuellt). Plan: skör DOM-
  manipulation, måste byggas mot riktig kassasida och testas iterativt.
- Klarna/Stripe återbetalning (`/api/orders/cancel` flaggar bara).
- Spårningsnummer **in** från AliExpress (matas manuellt i dag).
- FX-kurs är en manuell `USD_TO_SEK` i env.
- Bild-retusch (vattenstämpel/bakgrund) — enbart beskär/WebP saknas.
- Värdehöjare ej påbörjade: Google Merchant-feed, kampanjläge,
  returstatistik per leverantör, leveranstidskontroll, dubblettvarning
  via bild-hash, interna länkar i beskrivning, recensions-/bildkurering.

### Verifierade Wix-fakta (under sessionen)

- **Catalog V3 product create**: `POST /stores/v3/products`. Body:
  `{ product: { name, slug, productType:"PHYSICAL", physicalProperties:{},
  variantsInfo:{ variants:[{sku, visible, price:{actualPrice:{amount:"99.00"}},
  choices:[{optionChoiceNames:{optionName, choiceName, renderType}}],
  inventoryStatus:{inStock, preorderEnabled} }] }, options:[{ name,
  optionRenderType, choicesSettings:{ choices:[{choiceType:"CHOICE_TEXT|ONE_COLOR",
  name, colorCode?}] }}], media:{ main:{url}, itemsInfo:{ items:[{url,altText}] }},
  brand:{name}, ribbon:{name}, plainDescription, infoSections:[{uniqueName,
  title, plainDescription}] }, fields:["URL","PLAIN_DESCRIPTION"] }`.
- **Pris är sträng**: `actualPrice.amount: "99.99"` (INTE tal).
- **Variant-choices kräver `renderType`** matchande optionens
  `optionRenderType`. Lätt att glömma — orsakar "variants not matching
  options"-fel.
- **`physicalProperties: {}`** är obligatoriskt för PHYSICAL-produkter.
- **`description` (rich)** kräver Ricos-noder. `plainDescription`
  accepterar HTML-sträng.
- **Inventory**: `trackingMethod` är `oneOf` med `{quantity:N}` ELLER
  `{inStock:bool}`. Bulk update: `POST /stores/v3/bulk/inventory-items/update`,
  kräver `id` + `revision` per item.
- **Fulfillment**: `POST /ecom/v1/fulfillments/orders/{orderId}/create-fulfillment`
  body `{ fulfillment: { lineItems:[{id, quantity}], trackingInfo:{
  trackingNumber, shippingProvider?, trackingLink? } } }`.
- **Media import**: `POST /site-media/v1/files/import` body
  `{ url, displayName, mimeType }` returnerar `file.url` (wixstatic) +
  `file.id`. V3 vill ha `url` i media-fältet (inte uploadId).
- **Order webhook**: levereras som RS256-JWT i request-body, ofta med
  `{ data: "<stringified event>" }` i payload. Event-shape:
  `{ id, slug:"approved|created", entityId:<orderId>, entityFqdn:"wix.ecom.v1.order",
  actionEvent: { body: { order: { id, number, lineItems:[{id,productName,
  quantity,physicalProperties.sku,catalogReference.catalogItemId,...}] } } } }`.

---

## Spår 2 — Migration v1 → v3

### Status

- Plan + verifierad fältmappning ligger i `migration/MIGRATION.md`.
- Transform-modul + 12 tester ligger i `migration/scripts/transform.ts`.
- Dry-run mot sample-produkten har körts och output ser korrekt ut.
- Orkestratorn är skriven (`migration/scripts/orchestrator.ts`),
  resumable, säkerhetsspärrad bakom `MIGRATION_CONFIRM=1`.
- **Inget har körts skarpt mot Wix.**

### Blockerare (verifierad)

Anrop till `GET /stores/v3/provision/version` på mål-sajten
`wix-vibe-site-u4lp` (`e6d27e90-4749-4720-9afe-0bbe91c1b3d3`) svarade
**`STORES_NOT_INSTALLED`**. Wix Stores måste installeras från
Wix-dashboardens app-marknad innan något kan skapas. Nya installationer
hamnar automatiskt på V3_CATALOG.

### Hur man kör skarpt (när Wix Stores är installerad)

```bash
export WIX_API_TOKEN=...              # OAuth-token med Stores + Categories + Media scope
export TARGET_SITE_ID=e6d27e90-4749-4720-9afe-0bbe91c1b3d3
export SOURCE_SITE_ID=8c62127f-c07a-4596-86b8-4e88b5cc502d   # Fyndplats (default)

pnpm migrate:dry-live    # hämtar från live v1, transformerar, skriver inget
# Granska migration/_work/v1-products.json och loggen.

export MIGRATION_CONFIRM=1
pnpm migrate:run         # skarpt — kategorier, bilder, produkter, lager
```

Progressfiler i `migration/_work/` (gitignored): `imageMap.json`,
`categoryMap.json`, `migrated-products.jsonl`, `failed.jsonl`,
`inventory-mismatch.jsonl`. Orkestratorn är resumable — kör igen efter
crash, hoppar över redan klara.

Räknad tid: ~30 min för ~2000+ bilder, ~5 min för 207 produkter +
Ricos-konverteringar.

### Verifierade migration-fakta

- **CreateCategory** kräver `parentCategory.id` (saknades i originalplanen).
  Hämta root via `POST /categories/v1/categories/list-trees` med
  `{ treeReference: { appNamespace: "@wix/stores" } }` → svaret innehåller
  `trees[0].rootCategoryId`.
- **`treeReference.appNamespace = "@wix/stores"`** (enda stödda värdet).
- **Wix Stores app-id**: `215238eb-22a5-4c36-9e7b-e7c08025e04e` (krävs i
  ItemReference för BulkAddItemsToCategory).
- **BulkAddItemsToCategory** (effektivare än per-item):
  `POST /categories/v1/bulk/categories/{categoryId}/add-items` body
  `{ items:[{catalogItemId, appId}], treeReference:{appNamespace} }`.
- **Ricos convert**: `POST /ricos/v1/ricos-document/convert/to-ricos` body
  `{ html, options:{ plugins:["image","link","textColor","heading"] } }`.
- **Bulk products create med Ricos description**: `POST /stores/v3/bulk/products/create`
  (INTE `bulk/products-with-inventory/create` — den accepterar bara
  `plainDescription`).

### Känd lös tråd

`setInventoryForProduct` i `orchestrator.ts` matchar inventory-items mot
initialStock på **positionsordning**. Om Wix returnerar items i annan
ordning än vi skickade variants loggas det till
`inventory-mismatch.jsonl` istället för att gå fel. När vi har första
riktiga svaret från Wix bör detta förbättras till SKU-baserad matchning
(hämta produkten + variants från Wix för att få SKU→variantId, sedan
matcha inventory på variantId). Sökord i koden: `inventory-mismatch.jsonl`.

---

## Env-variabler att fylla i (sammanfattning)

Se `.env.example` för fullständig lista. De viktigaste:

```
ANTHROPIC_API_KEY=...               # för SEO/översättning
WIX_API_TOKEN=...                   # OAuth-token med Stores + Categories + Media scope
WIX_SITE_ID=e6d27e90-...            # nya headless-sajten (samma som TARGET)
WIX_WEBHOOK_PUBLIC_KEY=...PEM...    # för att verifiera order-webhook
EXTENSION_API_TOKEN=...             # delad hemlighet med browser-tillägget
STORE_BACKEND=wix-data              # eller "memory" för dev
DRY_RUN=0                           # sätt 1 för att testa utan Wix-skrivningar

# Migration:
SOURCE_SITE_ID=8c62127f-c07a-4596-86b8-4e88b5cc502d
TARGET_SITE_ID=e6d27e90-4749-4720-9afe-0bbe91c1b3d3
MIGRATION_CONFIRM=1                 # säkerhetsspärr för skarp migration

# Prissättning:
USD_TO_SEK=10.5
VAT_RATE_PERCENT=25
IOSS_THRESHOLD_EUR=150
MARKUP_MULTIPLIER=2.5
MARKUP_FIXED_SEK=0
PRICE_ROUNDING=charm9
KLARNA_FEE_PERCENT=3
KLARNA_FEE_FIXED_SEK=2
```

---

## Kommandon

```bash
pnpm dev              # Next.js dev-server för dropship-admin
pnpm build            # produktionsbygge
pnpm test             # vitest (68 tester)
pnpm typecheck        # tsc --noEmit
pnpm migrate:dry      # transform mot sample-products.json (snabb verifiering)
pnpm migrate:dry-live # full pipeline mot live v1 utan att skriva (kräver env)
pnpm migrate:run      # SKARP migration (kräver MIGRATION_CONFIRM=1)
```

---

## Nästa konkreta steg (i ordning)

1. **Användaren installerar Wix Stores** på `wix-vibe-site-u4lp` via
   Wix-dashboardens app-marknad. Verifiera med `GET /stores/v3/provision/version`
   → ska svara `V3_CATALOG` istället för `STORES_NOT_INSTALLED`.
2. **Sätt env-variabler** lokalt enligt ovan.
3. **`pnpm migrate:dry-live`** för att hämta v1-katalogen och se
   transformerna mot riktig data (inga skrivningar).
4. **Granska** `migration/_work/v1-products.json` och logg-utskriften.
5. **`pnpm migrate:run`** för skarp migration.
6. När migrationen är klar: rök-testa dropship-flödet — ladda tillägget
   i Chrome, öppna en AliExpress-produkt, importera, lägg en testorder i
   Wix, gå igenom webhook → task → "markera beställd" → "skickad".
7. Adressera lös tråd: SKU-baserad inventory-mappning i
   `orchestrator.ts` när vi sett första riktiga svar.

---

## Beslut + kontext som kommit fram under sessionen

- Användaren prioriterade tre gap-områden över andra: **skatt & tull**
  (moms/IOSS), **riktiga order-scenarier** (multi-rad, retur), **säkerhet
  & robusthet** (auth, signatur, idempotens). GDPR/ångerrätt/FX-källa
  medvetet bortvalt **för nu**.
- Färgvarianter renderas som **swatch-bubblor med exakt färg från
  produktbilden** (samplad via OffscreenCanvas). Detta var ett uttryckligt
  önskemål.
- Avbockade varianter blev `visible:false` istället för att tas bort,
  eftersom Wix kräver komplett variantuppsättning.
- Vinst räknas alltid på **intäkt exkl. moms** (annars överskattas det).
- Migrationsplanen som användaren gav hade 6 fel som hen själv listat,
  vi hittade ett sjunde: `CreateCategory` kräver `parentCategory.id`,
  och vi hämtar root via `ListTrees`.
- Tilläggets DOM-skrapning av AliExpress är systemets **sköraste del** —
  selektorerna kommer att brytas när AliExpress ändrar sidor. Plats för
  underhåll: `extension/content.js` `extract()`.

---

## Att inte göra

- **Rör inte cache-warmern** (`ping_sitemap.py`, `.github/workflows/cache-warm.yml`)
  — den är produktion och separat.
- **Pusha aldrig direkt till `main`** — fortsätt på `claude/hej-Lyf8v`
  eller skapa en ny branch.
- **Kör inte `pnpm migrate:run` utan `MIGRATION_CONFIRM=1`** — och
  helst inte utan att först ha kört `migrate:dry-live` och granskat.
- **Skriv inte över befintliga fyra Wix Data-collections** om de finns
  på mål-sajten innan migration (collisions hanteras inte).

---

Lycka till. PR #3 är draft och redo att fortsätta på.
