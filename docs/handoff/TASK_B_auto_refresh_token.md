# Task B — Auto-refresh AliExpress access_token via Vercel Cron

**Mål:** AliExpress access_token expirerar efter ca 48h (refresh_token efter ~30 dagar). Manuell OAuth-runda var 2:a dag = oacceptabelt. Vercel Cron triggar en endpoint var 12:e timme som byter refresh_token → ny access_token, persisterar i Wix CMS via WixDataStore (Task C).

**Repo:** `Leonardaraz/fyndplats-cache-warmer`
**Branch:** `feat/auto-refresh-token`
**Beroende:** Task C (`WixDataStore`) måste mergeas först — refresh-cronet skriver tokens till samma storage.

---

## 1. Endpoint — `app/api/aliexpress/refresh/route.ts`

```typescript
// app/api/aliexpress/refresh/route.ts
//
// POST /api/aliexpress/refresh
// Triggad av Vercel Cron var 12:e timme. Refresher access_token via
// AliExpress signed-RPC mot /rest/auth/token/refresh.
//
// Authentication: Vercel Cron skickar Authorization: Bearer <CRON_SECRET>.
// Verifiera mot CRON_SECRET env-var.

import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { refreshAccessToken } from "@/lib/aliexpress/client";

// Disable static optimization för denna route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  // 1. Verifiera att anropet kommer från Vercel Cron (eller godkänd caller)
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const store = getStore();
    const current = await store.get();
    if (!current) {
      return NextResponse.json(
        { error: "no_tokens_in_store", hint: "Initial OAuth required" },
        { status: 412 },
      );
    }

    // 2. Skippa om access_token fortfarande är giltig >2h kvar
    const remainingMs = current.expiresAt.getTime() - Date.now();
    if (remainingMs > 2 * 60 * 60 * 1000) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "token_still_valid",
        expiresAt: current.expiresAt.toISOString(),
      });
    }

    // 3. Byt refresh_token → nytt token-par
    const fresh = await refreshAccessToken(current.refreshToken);

    // 4. Persistera
    // expires_in är sekunder enligt AliExpress docs
    const expiresAt = new Date(Date.now() + (fresh.expires_in ?? 172800) * 1000);
    await store.set({
      accessToken: fresh.access_token,
      refreshToken: fresh.refresh_token ?? current.refreshToken,
      expiresAt,
    });

    return NextResponse.json({
      ok: true,
      refreshed: true,
      newExpiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("Token refresh failed:", message);
    // Returnera 500 så Vercel Cron retry:ar (kommer in på loggen)
    return NextResponse.json({ error: "refresh_failed", message }, { status: 500 });
  }
}
```

**Detalj:** Pre-emptive skip (steg 2) sparar AliExpress API-anrop. Bara om <2h kvar gör vi faktisk refresh. Cron körs var 12:e timme → praktiskt sett refreshar vi i snitt en gång per 36-48h (när access_token närmar sig expiry).

---

## 2. Vercel Cron-konfig — `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/aliexpress/refresh",
      "schedule": "0 */12 * * *"
    }
  ]
}
```

**OBS — Vercel Hobby plan begränsning:** Hobby tillåter max 2 cron-jobs och varje cron körs **dagligen** (Hobby-cron stöd är 1× per dag, inte 12h-intervall). Verifiera mot https://vercel.com/docs/cron-jobs/usage-and-pricing.

Om Hobby blockerar `0 */12 * * *`:
- **Alternativ A:** Kör cron en gång per dag (`0 3 * * *`). Cron-koden får då hantera att access_token kan vara ute när cron körs. Lösning: lazy-refresh i `callApi`-helper (refresh-on-401-retry).
- **Alternativ B:** Uppgradera till Pro ($20/mån) — då fungerar `0 */12 * * *`.
- **Alternativ C:** Använd extern cron-service (Upstash QStash gratis-tier, cron-job.org gratis).

**Rekommendation:** Implementera Alternativ A (lazy-refresh-on-401) parallellt — det är ändå defensiv kod oavsett cron-frekvens.

---

## 3. Lazy-refresh i API-klient — `lib/aliexpress/client.ts`

Wrappa `callApi` med automatisk refresh på 401/expired_token:

```typescript
// Lägg till i lib/aliexpress/client.ts

async function refreshIfNeeded(): Promise<string> {
  const store = getStore();
  const current = await store.get();
  if (!current) throw new Error("Inga tokens i store. Initial OAuth krävs.");

  // Refresh om <30 min kvar
  if (current.expiresAt.getTime() - Date.now() < 30 * 60 * 1000) {
    const fresh = await refreshAccessToken(current.refreshToken);
    const expiresAt = new Date(Date.now() + (fresh.expires_in ?? 172800) * 1000);
    await store.set({
      accessToken: fresh.access_token,
      refreshToken: fresh.refresh_token ?? current.refreshToken,
      expiresAt,
    });
    return fresh.access_token;
  }
  return current.accessToken;
}

// Modifiera callApi för att hämta token från store istället för env:
async function callApi<T>(method: string, bizParams: Record<string, string>): Promise<T> {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  if (!appKey || !appSecret) throw new Error("App-nycklar saknas");

  const accessToken = await refreshIfNeeded();
  const params = buildParams(method, bizParams, appKey, appSecret, accessToken);
  // ... resten av existerande implementation
}
```

---

## 4. CRON_SECRET — env-var

Generera ett kryptografiskt random värde och sätt i Vercel:

```bash
# Lokalt — kopiera output, klistra i Vercel env (Sensitive)
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Sätt i Vercel: `CRON_SECRET=<värdet>` (Sensitive, Production + Preview + Development).

Vercel Cron skickar automatiskt `Authorization: Bearer ${CRON_SECRET}` om du sätter samma värde där — eller du kan triggas externt med samma header.

---

## 5. Acceptans-kriterier

- [ ] `app/api/aliexpress/refresh/route.ts` finns och validerar CRON_SECRET
- [ ] `vercel.json` har cron-konfig (anpassad efter Hobby/Pro)
- [ ] `refreshIfNeeded()` används i `callApi` (lazy-refresh som backup)
- [ ] `CRON_SECRET` satt i Vercel
- [ ] Unit tests: refresh-skippas om token har >2h kvar
- [ ] Unit tests: refresh genomförs och persisteras i store om <30min kvar
- [ ] Manuell test: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://fyndplats-cache-warmer.vercel.app/api/aliexpress/refresh` returnerar `{ ok: true, skipped: true }` om token är fräsch
- [ ] Vercel Cron syns i Vercel Dashboard → Settings → Crons (om Hobby tillåter)

---

## 6. Edge cases & saker att tänka på

- **Race condition vid samtidig refresh:** Om cron + lazy-refresh båda triggar samtidigt → båda försöker använda samma refresh_token. AliExpress invaliderar gamla refresh_token vid första lyckade refresh. Lösning: distributed lock via Wix CMS-collection `Locks` (key + acquiredAt + expiresAt) **eller** acceptera att en av två failar och retry sker nästa gång. Rekommenderar det enklare: acceptera.

- **refresh_token expirerar (~30 dagar):** Om ingen refresh på 30+ dagar måste hela OAuth-flowet köras om manuellt. Lägg en monitoring-alert: om `expiresAt` ligger >29 dagar bak → skicka email till `info@fyndplats.com` (kan göras via Vercel-integration eller bara console-error som loggas).

- **Hobby cron-begränsning:** Som nämnt — `0 */12 * * *` kanske inte fungerar. Validera först i Vercel Dashboard, fall tillbaka till daglig + lazy-refresh.

- **Felaktig signering på refresh-endpoint:** `refreshAccessToken` använder `signRestRequest("/auth/token/refresh", ...)`. Verifiera att den existerande implementationen i `lib/aliexpress/client.ts` matchar — den fanns redan klar från tidigare arbete.

---

## 7. Kontext för Claude Code

- **Repo:** `Leonardaraz/fyndplats-cache-warmer`
- **Befintliga env-vars (relevant):**
  - `ALIEXPRESS_APP_KEY=535350`
  - `ALIEXPRESS_APP_SECRET` (Sensitive — finns)
  - `STORE_BACKEND` (sätts till `wix-data` efter Task C-merge)
- **Lägg till:**
  - `CRON_SECRET` (Sensitive, generera nytt)
- **OAuth-flow finns redan klar** — `refreshAccessToken()` i `lib/aliexpress/client.ts` är implementerad och testad mot AliExpress live API. Task B använder den, ändrar den inte.
- **Task C-beroende:** Vänta tills Task C är mergead till `main` innan Task B-PR mergeas. Annars saknas `WixDataStore`.
