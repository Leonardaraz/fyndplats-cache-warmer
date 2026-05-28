# Task C — Byt STORE_BACKEND från `memory` till `wix-data`

**Mål:** Persistera AliExpress access/refresh-tokens i Wix CMS istället för i process-minne. `memory`-backend förlorar tokens vid varje cold-start i Vercel → vi tappar OAuth-state och måste re-authentisera. `wix-data` backend skriver/läser från en Wix CMS-collection som överlever cold starts.

**Repo:** `Leonardaraz/fyndplats-cache-warmer`
**Branch-strategi:** Skapa branch `feat/wix-data-store`, öppna PR mot `main`. Merga först efter Task B-briefen verifierat token-refresh fungerar.

---

## 1. Innan du börjar — verifiera nuvarande struktur

Säg åt Claude Code att:
1. Läsa `lib/store/` (eller `lib/storage/`, `lib/tokens/` — exakt namn varierar) och hitta den existerande `MemoryStore`-implementationen.
2. Identifiera interfacet (sannolikt `getToken()`, `setToken()`, `getRefreshToken()`, `setRefreshToken()` eller liknande).
3. Hitta var `STORE_BACKEND` env-var läses och vilken factory som returnerar rätt store.

**Om interfacet INTE redan finns** måste det skapas först — annars är switchen meningslös.

---

## 2. Wix CMS-collection för token-storage

**Skapas i:** Wix Studio Editor → Content Manager → Add Collection
**Namn:** `AliExpressTokens`
**Permissions:**
- Read: **Admins** (inte Anyone — tokens är secrets)
- Write: **Admins**
- Permission Scope: **Site Members → No one**

**Schema:**

| Field key       | Display name        | Type        | Required | Notes                       |
|-----------------|---------------------|-------------|----------|-----------------------------|
| `key`           | Token Key           | Text        | Yes      | Alltid `aliexpress-main`    |
| `accessToken`   | Access Token        | Text        | Yes      | Långt — använd Long Text om Wix kräver det vid >256 tecken |
| `refreshToken`  | Refresh Token       | Text        | Yes      | Samma som ovan              |
| `expiresAt`     | Expires At          | Date & Time | Yes      | Vercel räknar ut från `expires_in` |
| `updatedAt`     | Updated At          | Date & Time | Yes      |                             |

Lägg **unique index** på `key`.

---

## 3. Wix API-tokens som behövs i Vercel

Du har redan `WIX_API_TOKEN` och `WIX_SITE_ID` i Vercel-env. Verifiera att `WIX_API_TOKEN`-rollen har **CMS Data Items: Read/Write** på `AliExpressTokens`-collectionen.

Om scopet saknas: gå till Wix Studio → Custom Apps → Fyndplats → Permissions → lägg till `wix.data.modify` och `wix.data.read`. Re-installera appen efter ändring (Wix kräver det för permission-uppdateringar).

---

## 4. Implementation — `lib/store/wix-data-store.ts` (eller motsvarande)

```typescript
// lib/store/wix-data-store.ts
//
// Wix CMS-backed token store. Använder Wix Data REST API direkt
// (inte SDK — vi kör Node.js på Vercel, inte i Velo).
//
// Authentication: Authorization-headern är site-tokens API key från Custom App.
// Site-id går i wix-site-id header.

import type { TokenStore, TokenRecord } from "./types";

const WIX_DATA_BASE = "https://www.wixapis.com/wix-data/v2";
const COLLECTION_ID = "AliExpressTokens";
const RECORD_KEY = "aliexpress-main";

interface WixDataItem {
  data: {
    _id?: string;
    key: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: string; // ISO
    updatedAt: string;
  };
}

function wixHeaders(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) {
    throw new Error("WIX_API_TOKEN och WIX_SITE_ID måste vara satta.");
  }
  return {
    Authorization: token,
    "wix-site-id": siteId,
    "Content-Type": "application/json",
  };
}

async function findRecord(): Promise<WixDataItem | null> {
  const res = await fetch(`${WIX_DATA_BASE}/items/query`, {
    method: "POST",
    headers: wixHeaders(),
    body: JSON.stringify({
      dataCollectionId: COLLECTION_ID,
      query: {
        filter: { key: RECORD_KEY },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Wix Data query failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { dataItems?: WixDataItem[] };
  return json.dataItems?.[0] ?? null;
}

export class WixDataStore implements TokenStore {
  async get(): Promise<TokenRecord | null> {
    const item = await findRecord();
    if (!item) return null;
    return {
      accessToken: item.data.accessToken,
      refreshToken: item.data.refreshToken,
      expiresAt: new Date(item.data.expiresAt),
    };
  }

  async set(record: TokenRecord): Promise<void> {
    const existing = await findRecord();
    const now = new Date().toISOString();
    const payload: WixDataItem = {
      data: {
        ...(existing?.data._id ? { _id: existing.data._id } : {}),
        key: RECORD_KEY,
        accessToken: record.accessToken,
        refreshToken: record.refreshToken,
        expiresAt: record.expiresAt.toISOString(),
        updatedAt: now,
      },
    };

    const url = existing
      ? `${WIX_DATA_BASE}/items/${existing.data._id}`
      : `${WIX_DATA_BASE}/items`;

    const res = await fetch(url, {
      method: existing ? "PUT" : "POST",
      headers: wixHeaders(),
      body: JSON.stringify({ dataCollectionId: COLLECTION_ID, ...payload }),
    });

    if (!res.ok) {
      throw new Error(`Wix Data ${existing ? "update" : "insert"} failed: ${res.status} ${await res.text()}`);
    }
  }
}
```

---

## 5. Factory-uppdatering

I `lib/store/index.ts` (eller motsvarande factory-fil):

```typescript
import { MemoryStore } from "./memory-store";
import { WixDataStore } from "./wix-data-store";
import type { TokenStore } from "./types";

let cached: TokenStore | null = null;

export function getStore(): TokenStore {
  if (cached) return cached;
  const backend = process.env.STORE_BACKEND ?? "memory";
  switch (backend) {
    case "memory":
      cached = new MemoryStore();
      break;
    case "wix-data":
      cached = new WixDataStore();
      break;
    default:
      throw new Error(`Okänt STORE_BACKEND: ${backend}`);
  }
  return cached;
}
```

---

## 6. Migrering av nuvarande tokens

Process:
1. Innan deploy: gå till Wix CMS, skapa **manuellt** en rad i `AliExpressTokens` med nuvarande `ALIEXPRESS_ACCESS_TOKEN`, `ALIEXPRESS_REFRESH_TOKEN` från Vercel-env, och `expiresAt` = nu + 12h (säker fallback).
2. Sätt `STORE_BACKEND=wix-data` i Vercel-env (Production + Preview).
3. Deploy.
4. Verifiera via cache-warm endpoint att tokens läses från CMS, inte från env.
5. När verifierat OK: ta bort `ALIEXPRESS_ACCESS_TOKEN` och `ALIEXPRESS_REFRESH_TOKEN` från Vercel-env (de behövs inte längre).

**OBS:** Steg 5 vänta med tills Task B (auto-refresh) också är deployad och verifierad. Annars: om Wix CMS är nere har vi inget fallback.

---

## 7. Acceptans-kriterier

- [ ] CMS-collection `AliExpressTokens` skapad med rätt schema + permissions
- [ ] `WixDataStore`-klass implementerad och täcker `TokenStore`-interfacet
- [ ] Factory dirigerar baserat på `STORE_BACKEND`
- [ ] Unit tests för `WixDataStore.get()` och `.set()` (mocka `fetch`)
- [ ] Manuell smoke-test: skriv en token, läs tillbaka, verifiera värdet
- [ ] Inga lint/type-fel
- [ ] PR-beskrivning länkar denna brief

---

## 8. Edge cases

- **Wix Data eventual consistency:** Direkt efter `set()` kan en `get()` returnera gammalt värde i upp till 1-2s. Lös genom att alltid använda samma in-process cache (`cached` i factory) plus invalidera den vid `set()`. Inkluderas redan i koden ovan via class-instans.
- **Race conditions vid token-refresh:** Om två cold starts försöker refresha samma refresh_token samtidigt → en lyckas, en får 401 (refresh_token är single-use). Hanteras i Task B med distributed lock eller bara accept att refresh sker oftare än nödvändigt.
- **WIX_API_TOKEN saknar scopes:** Om collection-läsning ger 403 → permission-update på Custom App krävs (se p. 3).

---

## 9. Kontext för Claude Code

- **Repo:** `Leonardaraz/fyndplats-cache-warmer`
- **Stack:** Next.js 16 / Node runtime / Vercel
- **Befintliga env-vars:**
  - `WIX_API_TOKEN` (Sensitive)
  - `WIX_SITE_ID=8c62127f-c07a-4596-86b8-4e88b5cc502d`
  - `STORE_BACKEND=memory` (ändras till `wix-data`)
  - `ALIEXPRESS_ACCESS_TOKEN`, `ALIEXPRESS_REFRESH_TOKEN` (Sensitive — migreras bort i p. 6)
- **AliExpress integration finns redan klar** — Task C ändrar bara var tokens lagras, inte hur de används.
