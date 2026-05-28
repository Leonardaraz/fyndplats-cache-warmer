# Fyndplats — Velo-kod för automatisk spårning + triggade mejl

Den här mappen innehåller färdig Velo-kod som:

1. Triggar **"Ditt paket är på väg!"-mejlet** automatiskt när du markerar en
   order som skickad i Wix Stores (mall `VKnRVoH`).
2. **Auto-registrerar tracking-numret hos 17TRACK** vid samma tillfälle, så
   carrier-events börjar hämtas utan att du gör något.
3. Tar emot **webhook-pushar från 17TRACK** vid varje statusändring (skickad
   / på väg / levererad), lagrar events i Wix Data och triggar
   **"Ditt paket är framme!"-mejlet** (mall `VKnSIqs`) vid leverans.
4. Exponerar en **läs-endpoint** som din `/sparning`-sida anropar för att
   visa carrier-tidslinjen (Shatian Town departed, etc.) — instant, utan
   16TRACK-roundtrip.

## Installation (15 min, en gång)

### 1. Skapa Wix Data-collection
Wix Dashboard → **Content Manager → + New Collection**

- Namn: `TrackingEvents`
- Permissions: **Read = Anyone**, **Write = Admin**
- Fält:

| Fält              | Typ              | Index | Unik |
|-------------------|------------------|-------|------|
| `trackingNumber`  | Text             | ✓     | ✓    |
| `orderId`         | Text             | ✓     |      |
| `status`          | Text             |       |      |
| `statusCode`      | Number           |       |      |
| `carrier`         | Text             |       |      |
| `events`          | Object           |       |      |
| `lastFetchedAt`   | Date and Time    |       |      |
| `deliveredAt`     | Date and Time    |       |      |

### 2. Hemligheter
Dashboard → **Developer Tools → Secrets Manager → + Add Secret**

- `SEVENTEEN_TRACK_API_KEY` — din 17TRACK API-nyckel
  (gratisplan: 100 nummer/månad, [signa upp](https://api.17track.net))
- `DELIVERED_WEBHOOK_SECRET` — en lång slumpsträng
  (`openssl rand -hex 32`). Används både för webhooken och refresh-endpointen.

### 3. Klistra in Velo-koden
Wix Editor → **Dev Mode → Code Files**

- `backend/tracking.js`         ← från `wix-velo/backend/tracking.js`
- `backend/events.js`           ← från `wix-velo/backend/events.js`
- `backend/http-functions.js`   ← från `wix-velo/backend/http-functions.js`
- `Pages → Sparning → Code (</>)` ← från `wix-velo/pages/sparning.js`
   (se element-ID:n överst i filen — mappa mot din sidas element)

### 4. Publish

### 5. Sätt upp 17TRACK-webhook
17TRACK Dashboard → **Settings → Notification → Webhook**

- URL: `https://www.fyndplats.se/_functions/track_webhook?secret=<DELIVERED_WEBHOOK_SECRET>`
- Method: `POST`
- Trigger on: **alla status** (inte bara DELIVERED)

## Hur det funkar (datavägar)

```
Du markerar order som skickad i Wix Stores
        │
        ▼
[events.js] wixStores_onFulfillmentCreated
   ├─ skickar "På väg!"-mejlet (VKnRVoH)
   └─ registerTracking() ─► insert placeholder i TrackingEvents
                         ─► POST 17TRACK /register

17TRACK ser pakkets första scan
        │
        ▼
17TRACK webhook ─► POST /_functions/track_webhook?secret=…
        │
        ▼
[http-functions.js] post_track_webhook
   ├─ applyWebhookPayload() ─► uppdaterar TrackingEvents
   └─ om status = delivered:
         └─ sendDeliveredEmail()  (mall VKnSIqs)

Kund öppnar https://fyndplats.se/sparning?tn=…
        │
        ▼
[sparning.js] GET /_functions/track?tn=…
        │
        ▼
[http-functions.js] get_track ─► getTrackingData() ─► Wix Data
                                                   ─► JSON med events
        │
        ▼
Sidan ritar stegindikator + tidslinje
```

## Felsökning

- **`Site Monitoring → Logs`** i Wix Dashboard visar `console.log` /
  `console.error` från Velo. Bra första anhalt.
- **`TrackingEvents`-collectionen är tom efter en order:** kontrollera att
  `SEVENTEEN_TRACK_API_KEY` är satt och att fulfillment innehåller ett
  trackingnummer.
- **`/sparning` visar "Registrerad" i timmar:** 17TRACK behöver typiskt 6–24 h
  innan första carrier-scan dyker upp. Du kan tvinga refresh:
  `GET /_functions/track_refresh?tn=…&secret=…`.
- **Webhooken returnerar 403:** secret-paramentern i URL:en matchar inte
  värdet i Secrets Manager.

## Dropship-anonymisering

Den här koden ÄR dropship-vänlig out-of-the-box:

- `carrier` skrivs alltid som **"Fyndplats Frakt"** i `TrackingEvents` —
  17TRACK:s namn (Cainiao, China Post, etc.) sparas aldrig.
- Events från ursprungslandet (Kina/HK/Taiwan/Singapore/Japan/Korea/Vietnam/
  Thailand/Malaysia/Indonesien) **filtreras bort** innan de lagras. Sidan
  visar bara events från den svenska last-mile-leverantören.
- Beskrivningar som råkar nämna ursprungsstäder eller leverantörsnamn
  strippas av en regex (`LEAKY_PATTERN` i `tracking.js`).
- Page-koden fallar tillbaka på `"Fyndplats Frakt"` om carrier-fältet skulle
  vara tomt.

Vill du lägga till fler ursprungsländer eller känsliga ord: utöka
`ORIGIN_COUNTRIES` resp. `LEAKY_PATTERN` i `wix-velo/backend/tracking.js`.

## Säkerhet

- `events.js` körs internt — ingen extern auth behövs.
- `track_webhook` och `track_refresh` skyddas av `?secret=...` (delad
  hemlighet i Wix Secrets Manager).
- `get_track` är publikt anropbar — det är OK eftersom den bara läser
  tracking-data för ett känt trackingnummer. Den lämnar inte ut PII.
