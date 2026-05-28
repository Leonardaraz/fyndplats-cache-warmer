# Fyndplats — Velo-kod för automatisk spårning + triggade mejl

Den här mappen innehåller färdig Velo-kod som:

1. Triggar **"Ditt paket är på väg!"-mejlet** automatiskt när du markerar en
   order som skickad i Wix Stores (mall `VKnRVoH`).
2. **Auto-registrerar tracking-numret hos 17TRACK v2.4** med svenska
   översättningar (`lang: "sv"`) vid samma tillfälle.
3. Tar emot **webhook-pushar från 17TRACK** vid varje statusändring,
   verifierar **SHA256-signaturen**, lagrar events i Wix Data och triggar
   **"Ditt paket är framme!"-mejlet** (mall `VKnSIqs`) vid leverans.
4. Exponerar en **läs-endpoint** som din `/sparning`-iframe anropar för att
   visa carrier-tidslinjen — instant, utan 17TRACK-roundtrip.

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
| `subStatus`       | Text             |       |      |
| `carrier`         | Text             |       |      |
| `events`          | Object           |       |      |
| `milestone`       | Object           |       |      |
| `lastFetchedAt`   | Date and Time    |       |      |
| `deliveredAt`     | Date and Time    |       |      |

### 2. Hemligheter
Dashboard → **Developer Tools → Secrets Manager → + Add Secret**

- `SEVENTEEN_TRACK_API_KEY` — din 17TRACK API-nyckel. Logga in på
  https://api.17track.net → Settings → kopiera Security Key.
  Nya konton (efter 2026-01-07) får **200 gratis tracking-nummer engångs**.
- `DELIVERED_WEBHOOK_SECRET` — endast för manuell `/track_refresh`-endpoint.
  Generera med `openssl rand -hex 32`. Webhooken använder SHA256 istället.

### 3. Klistra in Velo-koden
Wix Editor → **Dev Mode → Code Files**

- `backend/tracking.js`         ← från `wix-velo/backend/tracking.js`
- `backend/events.js`           ← från `wix-velo/backend/events.js`
- `backend/http-functions.js`   ← från `wix-velo/backend/http-functions.js`

> **OBS:** `/sparning`-sidan är en **HTML Embed-widget** (iframe) som redan
> anropar `/_functions/track?tn=...`. Den behöver ingen Velo page-code. Om du
> vill stänga fyra små säkerhets-/robusthetshål i HTML-koden, se
> `sparning-html-patches.md`.

### 4. Publish

### 5. Sätt upp 17TRACK-webhook
https://api.17track.net/admin/settings → **Settings → Webhook URL**:

```
https://www.fyndplats.se/_functions/track_webhook
```

Ingen `?secret=...` behövs — vi verifierar via 17TRACK:s SHA256-signatur
(`sign`-headern). Klicka sedan **WebHook test → Test** — du ska få "Operation
Done" i grönt.

## Hur det funkar (datavägar)

```
Du markerar order som skickad i Wix Stores
        │
        ▼
[events.js] wixStores_onFulfillmentCreated
   ├─ skickar "På väg!"-mejlet (VKnRVoH)
   └─ registerTracking() ─► insert placeholder i TrackingEvents
                         ─► POST 17TRACK /register
                            (lang="sv", destination_country="SE")

17TRACK ser första scan (inom sekunder–minuter)
        │
        ▼
17TRACK webhook ─► POST /_functions/track_webhook
                   header: sign=<sha256 av "<body>/<api_key>">
        │
        ▼
[http-functions.js] post_track_webhook
   ├─ verifySignature() ─► SHA256-kontroll
   ├─ applyWebhookPayload()
   │      ├─ sanitizeProviders() ─► tar bara svensk last-mile
   │      ├─ sanitizeEvents() ─► filtrerar CN/HK/TW/SG/JP/KR/...
   │      └─ → uppdaterar TrackingEvents
   └─ vid status="Delivered":
         └─ sendDeliveredEmail()  (mall VKnSIqs)

Kund öppnar https://fyndplats.se/sparning?tn=…
        │
        ▼ (iframe-koden)
fetch /_functions/track?tn=…
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
- **`/sparning` visar "Registrerad" länge:** 17TRACK pollar carriers var
  6–12 h. Du kan tvinga refresh manuellt:
  `GET /_functions/track_refresh?tn=…&secret=<DELIVERED_WEBHOOK_SECRET>`.
- **Webhooken returnerar 403:** SHA256-signaturen matchade inte — kontrollera
  att `SEVENTEEN_TRACK_API_KEY` i Wix Secrets exakt matchar Security Key i
  17TRACK-dashboarden (inga extra mellanslag).

## Dropship-anonymisering

Den här koden är dropship-vänlig out-of-the-box:

- `carrier` skrivs alltid som **"Fyndplats Frakt"** i `TrackingEvents` —
  17TRACK:s namn (Cainiao, China Post, etc.) sparas aldrig.
- `providers[0]` (destinations-bolaget = svensk last-mile) väljs i första
  hand. Lyckas det inte filtreras hela ursprungsproviders bort baserat på
  `provider.country`.
- Per-event används `event.address.country` för exakt landsfilter (mycket
  renare än text-matching).
- Backup-regex (`LEAKY_PATTERN`) strippar fortfarande "Cainiao", "Shenzhen",
  "Shatian", etc. om någon rad slipper igenom.
- Page-koden fallar tillbaka på `"Fyndplats Frakt"` om carrier-fältet skulle
  vara tomt.

Utöka `ORIGIN_COUNTRIES` resp. `LEAKY_PATTERN` i `wix-velo/backend/tracking.js`
om du lägger till nya marknader.

## Säkerhet

- `events.js` körs internt — ingen extern auth behövs.
- `track_webhook` verifierar **SHA256(`body/api_key`)** mot `sign`-headern
  (kryptografiskt säkert, samma metod som 17TRACK rekommenderar).
- `track_refresh` skyddas av `?secret=...`-query mot `DELIVERED_WEBHOOK_SECRET`.
- `get_track` är publikt anropbar — OK, lämnar bara ut anonymiserade
  tracking-events för ett känt nummer.
