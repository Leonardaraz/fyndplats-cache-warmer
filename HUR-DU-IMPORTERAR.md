# Hur du importerar produkter — steg för steg

För dig som vill ha en konkret hands-on-guide. Den förutsätter att
[`AKTIVERING.md`](./AKTIVERING.md) är klar (env-variabler i Vercel, Wix
Stores installerat, Chrome-tillägget laddat, OAuth-flödet körd).

---

## 1. Importera en produkt via Chrome-tillägget (vanligaste sättet)

### 1.1 Hitta en produkt på AliExpress
- Öppna https://www.aliexpress.com och hitta produkten du vill sälja.
- Var noggrann: kolla recensioner, leveranstid, säljarens rating, om de
  har Choice-frakt (snabbare).

### 1.2 Klicka tilläggsikonen
- När du är på `aliexpress.com/item/…` — klicka **Fyndplats Import**-ikonen
  uppe i Chrome.
- Tillägget läser sidan och visar en popup med:
  - Produktnamn (rådata på engelska/kinesiska)
  - Lista över varianter (färg, storlek osv) med checkboxar
  - För färg-varianter: ett färgprov samplas automatiskt från produkt-
    bilden (det blir swatch-bubbla i Fyndplats butiken)

### 1.3 Välj varianter
- **Bocka i** de varianter du vill ha till salu. Avbockade varianter
  döljs men finns kvar i Wix (Wix kräver komplett variantuppsättning).
- Ofta vill du t.ex. ta de tre mest populära färgerna, inte alla 12.

### 1.4 Klicka "Importera"
- Tillägget skickar produkten till `/api/import` på Vercel.
- Vad som händer i bakgrunden:
  1. Claude översätter och bygger svensk SEO (titel ≤60, meta-desc
     140-155, FAQ, alt-texter, JSON-LD).
  2. Prissättning: AE-pris USD → SEK → ×2.5 → +25% moms → avrunda till .90.
  3. Bilder laddas upp till Wix Media Manager.
  4. Produkten skapas i Wix Stores med `visible:false` och hamnar i
     **granskningskön**.

### 1.5 Granska och publicera
- Öppna https://fyndplats-cache-warmer.vercel.app/admin/queue
- Du ser en lista över produkter som väntar på granskning.
- Klicka **AliExpress**-länken om du vill jämföra med källan.
- Öppna produkten i Wix-redigeraren för att granska SEO + bilder.
- När du är nöjd: bocka i kryssrutan → klicka **Publicera valda**.
- Produkten blir synlig i butiken direkt.

> Tips: om någon översättning blev konstig — redigera direkt i Wix-
> redigeraren innan du publicerar.

---

## 2. Importera via API (om tillägget är trasigt)

```bash
curl -X POST https://fyndplats-cache-warmer.vercel.app/api/import \
  -H "x-fyndplats-token: $EXTENSION_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierProductId": "1005006123456789",
    "sourceUrl": "https://www.aliexpress.com/item/1005006123456789.html",
    "rawTitle": "Wireless Bluetooth Earbuds Pro Max",
    "rawDescription": "High quality earbuds...",
    "imageUrls": [
      "https://ae04.alicdn.com/kf/Sxxxxx.jpg"
    ],
    "variants": [
      {
        "supplierVariantId": "12000034567890",
        "options": { "Color": "Black" },
        "costUsd": 12.50,
        "stock": 200,
        "included": true
      }
    ]
  }'
```

Svar (201):
```json
{
  "ok": true,
  "draftStatus": "pending_review",
  "result": { "wixProductId": "...", "slug": "...", ... }
}
```

Produkten ligger nu i granskningskön och behöver fortfarande publiceras.

---

## 3. Var du ser pending-products

- **Webb-UI**: `/admin/queue`
- **API**: `GET /api/admin/queue` (kräver `x-fyndplats-token`-header).
- **Audit-loggen**: `/admin` (huvudsidan) → "Senaste händelser"
  visar `import-pending` när nya rader läggs i kön.

---

## 4. Hur synk fungerar (helt automatiskt)

| Vad | När | Vad det gör |
| --- | --- | --- |
| **Spårningsnummer** | Var 3:e timme | Plockar AE-tracking → Wix → 17TRACK |
| **Lagersaldon** | Var 6:e timme | AE → Wix per variant (slut = quantity 0) |
| **Priser** | Dagligen 04:00 UTC | AE → markup → Wix om ändrat |
| **Token-refresh** | Vid behov (innan API-anrop) | Helt transparent |

Spärrar:
- Priser kan inte sjunka mer än 20% per körning (skydd mot AE-glitches)
  — sådana rader flaggas i audit som `price-sync-blocked`.
- AE refresh-token varar ~180 dagar — 7 dagar innan utgång loggas
  varning. Då måste du köra OAuth-flödet igen
  (`/api/aliexpress/auth`).

---

## 5. Vad gör du när en sync misslyckas?

### 5.1 Hitta felet
`/admin` → "Senaste händelser" visar rader som:
- `inventory-sync-error` — något specifikt produkt-id strulade
- `price-sync-error` — samma men för pris-jobbet
- `poll-tracking-error` — kunde inte hämta tracking

Kolla `detail`-kolumnen för felmeddelandet.

### 5.2 Vanliga orsaker
- **`AliExpress refresh-token har gått ut`** → kör `/api/aliexpress/auth`
  igen, godkänn appen.
- **`Wix create-product misslyckades (401)`** → `WIX_API_TOKEN`
  förfallen. Generera ny i Wix Dev Center och uppdatera Vercel-env.
- **`Wix create-product misslyckades (400)`** → variantuppsättningen är
  inkomplett eller renderType matchar inte option-definitionen. Logga in
  i Vercel-loggar och titta på request-bodyn.
- **`STORES_NOT_INSTALLED`** → Wix Stores är inte aktiverat på
  målsajten. Installera från Wix App Market.
- **`ALIEXPRESS_APP_KEY...måste vara satta`** → env-variabler saknas i
  Vercel. Lägg in dem och redeploya.

### 5.3 Kör om manuellt
Alla cron-endpoints accepterar manuell körning via x-fyndplats-token:

```bash
# Kör inventory-sync direkt
curl -X POST \
  -H "x-fyndplats-token: $EXTENSION_API_TOKEN" \
  https://fyndplats-cache-warmer.vercel.app/api/cron/sync-inventory

# Kör price-sync direkt
curl -X POST \
  -H "x-fyndplats-token: $EXTENSION_API_TOKEN" \
  https://fyndplats-cache-warmer.vercel.app/api/cron/sync-prices

# Hämta tracking direkt
curl -H "x-fyndplats-token: $EXTENSION_API_TOKEN" \
  https://fyndplats-cache-warmer.vercel.app/api/cron/poll-tracking
```

Svaret är JSON med `productsUpdated`, `alerts`, `errors` osv.

---

## 6. Vanliga felmeddelanden och lösningar

| Felmeddelande | Vad det betyder | Fix |
| --- | --- | --- |
| `Otillåten` (401) | Fel/saknad `x-fyndplats-token`-header | Kolla att tilläggets API token = `EXTENSION_API_TOKEN` i Vercel |
| `Valideringsfel` (422) | Payload uppfyller inte schema | Jämför med exemplet i §2 |
| `Inga varianter valda för import` | Alla `included:false` | Bocka i minst en variant i popupen |
| `Claude returnerade ogiltig JSON` | LLM:en svarade med kommentar/text | Försök importera igen, det är tillfälligt |
| `ALIEXPRESS_APP_KEY...måste vara satta` | Env-variabel saknas | Lägg i Vercel + redeploya |
| `Auktorisera först via /api/aliexpress/auth` | Tokens saknas i Store + env | Kör OAuth-flödet (AKTIVERING.md §3) |
| `Wix create-product misslyckades (...)` | Wix API-fel | Kolla error-body för detalj; vanligast `variants not matching options` |
| `Wix bulk-update-inventory misslyckades (409)` | Revision mismatch (race) | Cron-jobbet försöker igen nästa körning |
| `price-sync-blocked` i audit | Säkerhetsspärren träffade | Kolla AE-priset manuellt — eller höj `MAX_PRICE_DROP_PERCENT` |

---

## 7. Aktivt underhåll varje månad (rekommendation)

- **Kolla audit-loggen** — leta efter återkommande `*-error`-rader.
- **Uppdatera USD_TO_SEK** — manuell FX-kurs som påverkar alla framtida
  importer och prissyncar.
- **Granska refresh-token-varningar** — kör om OAuth innan utgång.
- **Rensa rejected-produkter** — gå in i Wix och radera permanent om
  så önskas (kön sätter bara draftStatus, raderar inget).
- **Kolla orderläget** i tilläggets `orders.html` — finns det stuck
  tasks som inte processats?

---

## 8. Sammanfattning av admin-sidans två vyer

| Sida | URL | Syfte |
| --- | --- | --- |
| Översikt | `/admin` | Env-status, fulfillment-tasks, lönsamhet, audit |
| Granskningskö | `/admin/queue` | Publicera/avvisa importerade utkast |

---

## Snabbreferens — vanligaste flödet

1. Öppna AliExpress-produkt → klicka tilläggsikon → bocka varianter →
   **Importera**.
2. Gå till `/admin/queue` → granska → **Publicera valda**.
3. När en kund lägger order → tilläggets order-läge öppnar och du
   beställer manuellt på AliExpress → markera "beställd".
4. Vänta. Spårningsnumret hämtas av cron-jobbet och pushas till Wix →
   kunden får "På väg"-mejlet automatiskt.
