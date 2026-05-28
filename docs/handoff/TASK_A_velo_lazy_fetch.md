# Task A — Velo lazy-fetch till Vercel cache-warmer

**Mål:** När en besökare öppnar en produktsida på fyndplats.se → Wix Velo skickar en throttlad request till Vercel-endpoint `https://fyndplats-cache-warmer.vercel.app/api/cache-warm` som uppdaterar pris/lager från AliExpress för just den produkten. Max 1 fetch per produkt per 5 min (throttle).

**Plats:** Wix Studio Editor → Velo (Code panel) på fyndplats.se.

---

## 1. CMS-collection (skapas via Wix Editor → Content Manager → Add Collection)

**Namn:** `Throttle`
**Permissions:** Custom → Read/Write: *Site (anyone can read/write via backend code)* — eller säkrare: *Admins* om alla anrop går via Web Module (rekommenderat).
**Schema:**
| Field key       | Display name        | Type        | Required | Notes                          |
|-----------------|---------------------|-------------|----------|--------------------------------|
| `key`           | Throttle Key        | Text        | Yes      | Unique. Format: `cache-warm:{productId}` |
| `lastFetchAt`   | Last Fetch At       | Date & Time | Yes      |                                |

Lägg ett **unique index** på `key` om Wix Editor exponerar det (Content Manager → Settings → Indexes). Annars hanterar koden duplicate-handling.

---

## 2. Secret (lagras i Wix Secrets Manager — Velo Sidebar → Secrets Manager)

**Secret name:** `cacheWarmerToken`
**Secret value:** Be Leonard hämta från Vercel `EXTENSION_API_TOKEN` (Production env) och paste:a manuellt i Wix Secrets Manager. **Klistra ALDRIG token-värdet i kod, chat eller commit-meddelanden** — bara direkt i Secrets Manager UI.

(Det är samma värde som `EXTENSION_API_TOKEN` i Vercel. Cache-warmer-endpoint validerar `Authorization: Bearer <token>` mot detta. Tokenen roterades 2026-05-28 efter en chat-läcka — använd ALDRIG värden från äldre dokument/briefer.)

---

## 3. Backend Web Module — `backend/cache-warmer.web.js`

Skapa filen via Velo Sidebar → Backend → Web Modules → New `.web.js` file.

```javascript
// backend/cache-warmer.web.js
import { Permissions, webMethod } from 'wix-web-module';
import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import wixData from 'wix-data';

const THROTTLE_MS = 5 * 60 * 1000; // 5 minuter
const CACHE_WARMER_URL = 'https://fyndplats-cache-warmer.vercel.app/api/cache-warm';

/**
 * Trigga cache-warm för en produkt. Throttlas till 1 anrop per produkt per 5 min.
 * Anropas från product-page (frontend) via Velo.
 *
 * @param {string} productId — AliExpress product ID (string)
 * @returns {Promise<{ok: boolean, throttled?: boolean, status?: number}>}
 */
export const warmProduct = webMethod(
  Permissions.Anyone,
  async (productId) => {
    if (!productId || typeof productId !== 'string') {
      return { ok: false, error: 'invalid_product_id' };
    }

    const key = `cache-warm:${productId}`;
    const now = new Date();

    // 1. Throttle-check via Throttle-collection
    try {
      const existing = await wixData
        .query('Throttle')
        .eq('key', key)
        .find({ suppressAuth: true });

      if (existing.items.length > 0) {
        const last = new Date(existing.items[0].lastFetchAt);
        if (now.getTime() - last.getTime() < THROTTLE_MS) {
          return { ok: true, throttled: true };
        }
      }

      // 2. Uppdatera/skapa throttle-rad FÖRST (race-condition-safe)
      if (existing.items.length > 0) {
        await wixData.update(
          'Throttle',
          { ...existing.items[0], lastFetchAt: now },
          { suppressAuth: true },
        );
      } else {
        await wixData.insert(
          'Throttle',
          { key, lastFetchAt: now },
          { suppressAuth: true },
        );
      }
    } catch (err) {
      // Loggas men blockerar inte själva fetchen — bättre att fetcha för mycket
      // än för lite under en degraded throttle-collection.
      console.warn('Throttle-check misslyckades:', err.message);
    }

    // 3. Hämta secret + skicka POST till Vercel
    let token;
    try {
      token = await getSecret('cacheWarmerToken');
    } catch (err) {
      console.error('cacheWarmerToken saknas i Secrets Manager:', err.message);
      return { ok: false, error: 'missing_secret' };
    }

    try {
      const res = await fetch(CACHE_WARMER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      // Fire-and-forget — vi väntar på response för att kunna logga, men
      // returnerar inte body till frontend (för att inte exponera intern info).
      return { ok: res.ok, status: res.status };
    } catch (err) {
      console.error('Cache-warm fetch misslyckades:', err.message);
      return { ok: false, error: 'fetch_failed' };
    }
  },
);
```

**Varför `suppressAuth: true`?** Throttle-collectionen körs i backend (Web Module) men `wixData.query/insert/update` respekterar collection-permissions per default. Eftersom besökaren är anonym och vi vill att skrivningar går igenom oavsett collection-permissions, sätter vi `suppressAuth: true` i backend.

**Varför uppdaterar vi throttle FÖRE fetch?** Om fetchen tar 2 sekunder och 10 besökare öppnar samma produktsida samtidigt får vi annars 10 fetches. Bättre att markera "vi är på väg" först.

---

## 4. Frontend page-kod (Product Page i Velo)

Lägg i product-page-koden (`Pages → Product Page`):

```javascript
import { warmProduct } from 'backend/cache-warmer.web';

$w.onReady(async () => {
  const product = await $w('#productPage1').getProduct();
  if (!product) return;

  // AliExpress product ID lagras i custom field "aliexpressProductId"
  // (eller motsvarande). Justera fältnamnet efter din produkt-modell.
  const aliId = product.additionalInfoSections?.find(
    (s) => s.title === 'aliexpressProductId',
  )?.description;

  if (!aliId) return;

  // Fire-and-forget — vi blockerar inte sid-render på detta.
  warmProduct(aliId).catch(() => {
    // Tyst fail — cache-warm är best-effort, inte kritiskt.
  });
});
```

**OBS — produktmodell-mappning:** Du behöver verifiera HUR AliExpress product ID är lagrat på Wix-produkten. Vanliga lösningar:
- **Wix Stores custom fields** (`additionalInfoSections`) — kod ovan
- **Product SKU prefix** (t.ex. SKU = `AE-1005006xxxxxxxxxx`) — då: `aliId = product.sku?.replace(/^AE-/, '')`
- **External ID** via `product.externalId`

Säg åt Claude Code att inspektera ett befintligt produktobjekt i Velo-konsolen (`console.log(product)`) först innan koden hårdkodas mot ett fältnamn.

---

## 5. Testa lokalt i Velo

1. Öppna Velo-konsolen i Wix Editor preview-läge.
2. Besök en produktsida.
3. Verifiera i konsolen att `warmProduct` returnerade `{ ok: true, status: 200 }` (eller `{ ok: true, throttled: true }` om <5min sedan senaste).
4. Kolla Vercel-logs (`fyndplats-cache-warmer` → Logs) att request kom in med rätt productId.
5. Öppna samma produkt igen direkt → ska få `throttled: true`.
6. Vänta 5 min → ska få ny fetch.

---

## 6. Edge cases & saker att tänka på

- **Bot-trafik:** Throttle per `cache-warm:{productId}` skyddar AliExpress API från bots som scrapeer prod-sidor. Ingen behov av rate-limit per IP.
- **Cold start:** Första besöket efter Wix-deploy kan ta 1-2s extra för Web Module att starta — påverkar inte produktsidan eftersom anropet är fire-and-forget.
- **Failed fetch:** Om Vercel är nere markeras throttle ändå (vi vill inte spam-retry). Nästa naturliga besök efter 5min triggar ny fetch.
- **Multi-region:** Cache-warmer-endpoint kör på Vercel edge — Sverige-trafik landar i Stockholm-regionen, ingen extra latens.

---

## 7. Acceptans-kriterier (säg åt Claude Code att checka alla):

- [ ] CMS-collection `Throttle` finns med rätt schema och permissions
- [ ] Secret `cacheWarmerToken` lagrad i Wix Secrets Manager
- [ ] `backend/cache-warmer.web.js` deployad utan syntax-fel
- [ ] Product-page-kod kallar `warmProduct(aliId)` med rätt ID-mappning
- [ ] Test 1: Färskt besök → Vercel log visar "cache-warm received: productId=X"
- [ ] Test 2: Direkt återbesök → `throttled: true` returneras, ingen Vercel-call
- [ ] Test 3: Vänta 5 min → ny fetch går igenom
- [ ] Inga rena `console.error` i Velo (utöver de avsiktliga warn-loggarna)

---

## 8. Bonus — om Claude Code har tid kvar

Lägg en backend-cron via Velo Scheduled Jobs (Velo Sidebar → Backend → Code Files → `jobs.config`) som **rensar** Throttle-rader äldre än 1 dygn. Annars växer collectionen monotont:

```javascript
// backend/throttle-cleanup.jw.js
import wixData from 'wix-data';

export async function cleanupThrottle() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stale = await wixData
    .query('Throttle')
    .lt('lastFetchAt', cutoff)
    .find({ suppressAuth: true });
  if (stale.items.length === 0) return;
  await wixData.bulkRemove(
    'Throttle',
    stale.items.map((i) => i._id),
    { suppressAuth: true },
  );
}
```

`jobs.config`:
```json
{
  "jobs": [
    {
      "functionLocation": "/throttle-cleanup",
      "description": "Rensa stale Throttle-rader",
      "executionConfig": { "cronExpression": "0 3 * * *" }
    }
  ]
}
```

(Körs 03:00 varje natt.)

---

## Kontext för Claude Code

- **Repo:** Detta är **inte** ett Git-repo — koden bor inne i Wix Studio Editor (Velo). Ingen `git commit`.
- **Vercel-endpoint:** `https://fyndplats-cache-warmer.vercel.app/api/cache-warm` finns redan deployad och validerar `Authorization: Bearer <EXTENSION_API_TOKEN>`. Källkod ligger i GitHub-repo `Leonardaraz/fyndplats-cache-warmer`.
- **AliExpress-integration:** Redan klar — cache-warmer anropar `aliexpress.ds.product.get` och uppdaterar Wix Stores inventory + pris via V3 Catalog API. Velo behöver bara trigga den.
- **Wix Site ID:** `8c62127f-c07a-4596-86b8-4e88b5cc502d` (för referens — Velo behöver det inte explicit).
