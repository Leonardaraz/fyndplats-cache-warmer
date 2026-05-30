# Aktivering — Fyndplats Dropship-verktyget

Steg-för-steg-guide för att komma igång från noll. Räkna med ~30 minuter
om alla konton redan finns; ~60 minuter om du skapar AliExpress Open
Platform-appen från grunden.

> Alla värden i den här filen som ser ut som `EXEMPEL_VÄRDE` ska bytas ut
> mot riktiga värden. **Spara aldrig riktiga värden i kod eller i ett
> publikt repo.**

---

## 1. Förutsättningar — konton som måste finnas

| Tjänst | Vad behövs | Var hittar du det |
| --- | --- | --- |
| **AliExpress Open Platform** | App-konsol för Drop Shipping API | https://openservice.aliexpress.com/ |
| **Wix** | Headless-sajt med Wix Stores installerat på `V3_CATALOG` | https://manage.wix.com |
| **Anthropic** | API-nyckel för Claude (översättning/SEO) | https://console.anthropic.com |
| **Vercel** | Projekt: `fyndplats-cache-warmer` | https://vercel.com/dashboard |
| **GitHub** | (Valfritt) Reserv-cron på Hobby-plan | https://github.com/Leonardaraz/fyndplats-cache-warmer |

---

## 2. Env-variabler i Vercel

Gå till Vercel-projektet → **Settings → Environment Variables**. Lägg in
varje variabel nedan med scope **Production, Preview, Development**
(förutom `DRY_RUN` som du nästan alltid bara vill ha i Preview/Development
under tester).

> **Skiljer sig från `fyndplats-headless`:** cache-warmer-projektet på
> Vercel är skilt från fyndplats-headless. Env-variabler från det ena
> projektet syns INTE i det andra. Om du har `WIX_API_KEY` i
> fyndplats-headless och behöver den här — kopiera värdet och lägg in
> det manuellt i cache-warmer-projektet också (eller använd
> `WIX_API_TOKEN`, se nedan).

### 2.1 AliExpress (obligatoriskt)

| Variabel | Värde / källa | När |
| --- | --- | --- |
| `ALIEXPRESS_APP_KEY` | App Key från Open Platform App Console | En gång |
| `ALIEXPRESS_APP_SECRET` | App Secret från Open Platform App Console | En gång |
| `ALIEXPRESS_ACCESS_TOKEN` | Skrivs in **automatiskt** av OAuth-callback (se §3) | Init |
| `ALIEXPRESS_REFRESH_TOKEN` | Skrivs in **automatiskt** av OAuth-callback (se §3) | Init |

Efter den första OAuth-auktoriseringen sköts refresh helt automatiskt av
verktyget — du behöver aldrig redeploya för att förnya tokens.

### 2.2 Anthropic (obligatoriskt — för översättning + SEO)

| Variabel | Värde / källa |
| --- | --- |
| `ANTHROPIC_API_KEY` | Från console.anthropic.com (sk-ant-…) |

### 2.3 Wix (obligatoriskt)

Cache-warmer-projektet pratar med Wix Stores Catalog V3 + Wix Data:

| Variabel | Värde / källa |
| --- | --- |
| `WIX_API_TOKEN` | OAuth-token med scope: **Stores write**, **Categories write**, **Media manager write**, **Data write** |
| `WIX_SITE_ID` | `e6d27e90-4749-4720-9afe-0bbe91c1b3d3` (fyndplats-headless) |
| `WIX_WEBHOOK_PUBLIC_KEY` | PEM från Wix Dev Center → Webhooks → Public key |

> Om du redan har `WIX_API_KEY` i fyndplats-headless: det är samma
> värdetyp (Bearer-token från Wix Headless API). Kopiera den hit som
> `WIX_API_TOKEN`. Vill du ha symmetri, byt namn på variabeln i båda
> projekten, men ändra då också alla referenser i koden — enklast att
> lämna namnen som de är.

### 2.4 Lagring (Wix Data-collections)

| Variabel | Default | Behöver skapas i Wix Data CMS |
| --- | --- | --- |
| `STORE_BACKEND` | `wix-data` i prod, `memory` i dev | — |
| `WIX_DATA_COL_MAPPINGS` | `FyndplatsMappings` | Ja |
| `WIX_DATA_COL_EVENTS` | `FyndplatsWebhookEvents` | Ja |
| `WIX_DATA_COL_TASKS` | `FyndplatsTasks` | Ja |
| `WIX_DATA_COL_AUDIT` | `FyndplatsAudit` | Ja |
| `WIX_DATA_COL_TOKENS` | `FyndplatsTokens` | Ja (ny — för auto-refresh) |

Skapa dem som **privata** collections i Wix Data → CMS → New Collection.
Fält behöver inte konfigureras manuellt — verktyget skickar JSON och Wix
skapar fälten dynamiskt.

### 2.5 Säkerhet

| Variabel | Generera så här | Användning |
| --- | --- | --- |
| `EXTENSION_API_TOKEN` | `openssl rand -hex 32` | Browser-tilläggets headers + manuell API-körning |
| `CRON_SECRET` | `openssl rand -hex 32` | Vercel Cron-anrop |

> Lägg in samma värde på `EXTENSION_API_TOKEN` i Chrome-tilläggets
> **Options-sida** efter att du installerat det.

### 2.6 Prissättning (defaults fungerar, men dubbelkolla)

| Variabel | Default | Vad det gör |
| --- | --- | --- |
| `USD_TO_SEK` | `10.5` | Manuell USD→SEK-kurs (uppdatera kvartalsvis) |
| `VAT_RATE_PERCENT` | `25` | Svensk moms |
| `IOSS_THRESHOLD_EUR` | `150` | Försändelser över → vanlig importdeklaration |
| `MARKUP_MULTIPLIER` | `2.5` | Inköp × 2.5 = pris exkl. moms |
| `MARKUP_FIXED_SEK` | `0` | Fast påslag i SEK |
| `PRICE_ROUNDING` | `charm90` | Slut på .90 (t.ex. 249.90) |
| `KLARNA_FEE_PERCENT` | `3` | Endast för lönsamhetsöversikten |
| `KLARNA_FEE_FIXED_SEK` | `2` | Endast för lönsamhetsöversikten |
| `MAX_PRICE_DROP_PERCENT` | `20` | Säkerhetsspärr på price-sync (blockera glitches) |

### 2.7 Testläge

| Variabel | När |
| --- | --- |
| `DRY_RUN=1` | Sätt 1 för att stänga av alla Wix-skrivningar (bra under tester) |

---

## 3. Engångs-OAuth mot AliExpress

Efter att §2.1 (`ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET`) är på plats:

1. Deploya till Vercel: `git push` eller `vercel --prod`.
2. Öppna `https://fyndplats-cache-warmer.vercel.app/api/aliexpress/auth`
   i webbläsaren. Du dirigeras till AliExpress' OAuth-sida.
3. Auktorisera appen. AliExpress redirectar tillbaka till
   `/api/aliexpress/callback?code=…`.
4. Callbacken byter koden mot `access_token + refresh_token` och **sparar
   båda i Wix Data-collection `FyndplatsTokens`**. Du ser ett JSON-svar
   som bekräftar att det funkade.
5. Klart. Från och med nu refresh:as access-token automatiskt innan varje
   API-anrop. Refresh-token har ~180 dagars livstid; ~7 dagar innan den
   går ut skrivs ett varningsmeddelande i audit-loggen — gör om steg 2-4
   när det syns.

---

## 4. Wix Stores måste vara installerad på V3_CATALOG

Verifiera:

```
curl -H "Authorization: $WIX_API_TOKEN" \
     -H "wix-site-id: $WIX_SITE_ID" \
     https://www.wixapis.com/stores/v3/provision/version
```

Förväntad svar: `{"catalogVersion":"V3_CATALOG"}`. Om du får
`STORES_NOT_INSTALLED` — gå till Wix-dashboarden → App Market → installera
**Wix Stores**. Nya installationer hamnar automatiskt på V3.

---

## 5. Sätt upp webhooks från Wix

Wix Dev Center → Webhooks → skapa två trigger:

1. **wixEcom.OrderApproved** → URL:
   `https://fyndplats-cache-warmer.vercel.app/api/wix-order`
2. **wixEcom.OrderCreated** → samma URL (vi avduplicerar via event-id).

Verktyget verifierar RS256-JWT-signaturen via `WIX_WEBHOOK_PUBLIC_KEY`.

---

## 6. Browser-tillägget

1. `extension/` → ladda som "unpacked extension" i Chrome.
2. Öppna tilläggets **Options**-sida:
   - **API URL**: `https://fyndplats-cache-warmer.vercel.app`
   - **API Token**: samma värde som `EXTENSION_API_TOKEN` i Vercel.
3. Klart. Besök en AliExpress-produkt → klicka tilläggsikonen → välj
   varianter → "Importera".

---

## 7. Cron-schemaläggning

Vercel Cron är primär. På **Pro-plan** är alla tre cron-rader aktiva.
På **Hobby-plan** kommer endast den dagliga `sync-prices` att köras —
för sub-daglig schemaläggning, behåll
`.github/workflows/poll-tracking.yml` (kräver två GitHub-secrets:
`POLL_TRACKING_URL` och `CRON_SECRET`).

Schemat:

| Endpoint | Frekvens | Vad |
| --- | --- | --- |
| `/api/cron/sync-prices` | Dagligen 04:00 UTC | AE → Wix priser |
| `/api/cron/sync-inventory` | Var 6:e timme | AE → Wix lager |
| `/api/cron/poll-tracking` | Var 3:e timme | AE → Wix spårningsnr |

Alla anrop kräver `Authorization: Bearer $CRON_SECRET` eller
`x-fyndplats-token: $EXTENSION_API_TOKEN` (för manuell körning).

---

## 8. Verifiering

Gå till `/admin` på din deploy. Du ska se:

- **Konfiguration**: alla rader OK (inga "saknas").
- **Schemalagda jobb**: tre cron-endpoints listade.
- **Senaste händelser**: när första synket körts kommer rader att synas
  (`inventory-sync`, `price-sync`, `ali-token-refresh` etc.).

Manuell rök-test:

```bash
# Manuell körning av price-sync (ersätt token).
curl -X POST \
  -H "x-fyndplats-token: $EXTENSION_API_TOKEN" \
  https://fyndplats-cache-warmer.vercel.app/api/cron/sync-prices
```

Förväntat svar: JSON med `productsChecked`, `productsUpdated`, `alerts`,
`errors`.

---

## Snabb-felsökning

| Symptom | Trolig orsak | Fix |
| --- | --- | --- |
| `Auktorisera först via /api/aliexpress/auth` | Tokens saknas | Kör §3 |
| `AliExpress refresh-token har gått ut` | >180 dagar sedan auth | Kör §3 igen |
| `WIX_API_TOKEN saknas` | Env-var inte satt | §2.3 |
| `STORES_NOT_INSTALLED` | Wix Stores ej installerad | §4 |
| Inget händer i cron-loggen | `CRON_SECRET` saknas eller fel | §2.5 |
| 401 från `/api/import` | `EXTENSION_API_TOKEN` matchar inte | §2.5 + Options-sida |
