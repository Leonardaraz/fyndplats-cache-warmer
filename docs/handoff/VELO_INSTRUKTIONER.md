# Aktivera Velo lazy-fetch i Wix Editor

**Tidsåtgång:** ~10 minuter. Lösning för: `/sparning?tn=...` visar tom timeline trots att 17TRACK har events.

## Steg 0: Verifiera CMS-fält

1. Wix Studio Editor → CMS → `TrackingEvents`-collection → Manage Fields
2. Verifiera att `lastFetchedAt` finns med typ **Date and Time**
3. Om saknas: + Add Field → Name: `lastFetchedAt`, Type: Date and Time → Save

## Steg 1: Öppna Velo Code-panel

1. Wix Studio Editor → vänster sidebar → `</>` Dev Mode (eller Code)
2. Expandera: Public & Backend → backend

## Steg 2: Lägg till `lazyFetchAndApply` i `backend/tracking.js`

Scrolla längst ner i filen, paste:a efter sista funktionen:

```javascript

// ---------------------------------------------------------------------------
// Lazy-fetch fallback för stale records
// ---------------------------------------------------------------------------

const LAZY_FETCH_COOLDOWN_MS = 30 * 60 * 1000;

export async function lazyFetchAndApply(trackingNumber, existingRecord) {
  const now = Date.now();
  const lastFetched = existingRecord?.lastFetchedAt
    ? new Date(existingRecord.lastFetchedAt).getTime()
    : 0;
  const ageMs = now - lastFetched;

  if (ageMs < LAZY_FETCH_COOLDOWN_MS) {
    console.log(`[lazy-fetch] throttled tn=${trackingNumber} ageSec=${Math.round(ageMs / 1000)}`);
    return { fetched: false, throttled: true };
  }

  console.log(`[lazy-fetch] start tn=${trackingNumber} cachedEvents=0 ageMs=${ageMs}`);
  try {
    const result = await forceRefresh(trackingNumber);
    console.log(`[lazy-fetch] ok tn=${trackingNumber} status=${result.status} events=${result.eventCount}`);
    return { fetched: true, ...result };
  } catch (err) {
    console.error(`[lazy-fetch] FEL tn=${trackingNumber}: ${err.message || err}`);
    if (existingRecord) {
      try {
        await wixData.update(
          COLLECTION,
          { ...existingRecord, lastFetchedAt: new Date() },
          { suppressAuth: true },
        );
      } catch (e) {
        console.warn(`[lazy-fetch] kunde inte bumpa lastFetchedAt: ${e.message || e}`);
      }
    }
    return { fetched: false, error: err.message || String(err) };
  }
}
```

**Save** (Ctrl+S).

## Steg 3: Uppdatera `backend/http-functions.js`

### 3a. Hitta import-raden (~rad 22):
```javascript
import { applyWebhookPayload, getTrackingData, forceRefresh } from "backend/tracking";
```
Ersätt med:
```javascript
import {
  applyWebhookPayload,
  getTrackingData,
  forceRefresh,
  lazyFetchAndApply,
} from "backend/tracking";
```

### 3b. Hitta i `export async function get_track`:
```javascript
const data = await getTrackingData(tn);
```
Ersätt med:
```javascript
    let data = await getTrackingData(tn);

    // Lazy-fetch fallback: när webhook-pushen failade eller aldrig kom har
    // vi en placeholder med events=[]. Fråga 17TRACK direkt (throttlat).
    if (
      data
      && (!data.events || data.events.length === 0)
      && data.status !== "Delivered"
    ) {
      const lazy = await lazyFetchAndApply(tn, data);
      if (lazy.fetched) {
        data = await getTrackingData(tn);
      }
    }
```

⚠️ Notera: `const data` blev `let data`.

**Save** (Ctrl+S).

## Steg 4: Publish

Uppe till höger i Wix Studio: orange **Publish**-knapp → confirm → vänta tills "Site published".

## Steg 5: Verifiera

```bash
curl https://www.fyndplats.se/_functions/track?tn=U0740014214SE
```

**Förväntat:**
- Första anrop: triggrar lazy-fetch → returnerar 8 events
- Andra anrop inom 30 min: cached
- Velo Site Monitoring visar `[lazy-fetch] start tn=U07...` loggar

## Felsökning

| Problem | Fix |
|---|---|
| Röd felsymbol vid import | Verifiera att `lazyFetchAndApply` finns i tracking.js (Steg 2) |
| Publish-knappen grå | Save båda filerna först |
| `lastFetchedAt` fält saknas | Tillbaka till Steg 0 |
| "wixData is not defined" | Verifiera `import wixData from 'wix-data';` högst upp i tracking.js |

## Git-backup

Koden finns även i cache-warmer-repot på branch `feat/velo-lazy-fetch-tracking`. Du kan PR:a → merga `main` för permanent git-record, men det aktiverar inget — bara Wix Editor Publish gör det.
