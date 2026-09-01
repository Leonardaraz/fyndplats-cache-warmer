// GET /api/tracking-events?tn=<spårningsnummer>
//
// AliExpress egna spårningshändelser för ett spårningsnummer — källan som
// headless-sajtens /sparning använder FÖRST (17TRACK klarar inte alla
// EU-fraktkedjor: "Carrier cannot be detected" för t.ex. PostNord parcel
// connect, medan AliExpress alltid känner sin egen order).
//
// Uppslag: tasken (trackingNumber sätts av poll-tracking vid skeppning) →
// aliexpressOrderId → aliexpress.ds.order.tracking.get.
//
// ☠️ RUTTEN FRÅGADE FÖRR WIX DATA DIREKT, och det överlevde inte migreringen.
// Den gjorde `POST /wix-data/v2/items/query` mot FyndplatsTasks med en egen
// fetch-helper i stället för att gå via storen. Steg 6 (POSTGRES-MIGRATION.md)
// tömde den kollektionen 2026-09-01, och rutten svarade från den sekunden
// **404 "Okänt spårningsnummer" för varje kund** — koden var oförändrad, datan
// var borta. Verifierat i drift: en riktig kunds spårningsnummer gav 404 kl
// 20:35 samma dag.
//
// Kodauditen efter raderingen hittade den inte, eftersom den letade efter
// TRASIGA LÄSARE och den här läsaren inte är trasig — den är tom. Regeln som
// följde: en migrerad kollektion nås BARA genom storen, och `store-access-
// audit.test.ts` fäller nu på källkodsnivå om en rutt går utanför den.
//
// PUBLIK med samma hotmodell som headless /api/track: nyckeln är själva
// spårningsnumret, och svaret innehåller ENBART transportdata (händelser,
// transportör, ETA) — aldrig kund-, adress- eller orderuppgifter.
// Quota-skydd: formatfilter + 5 min in-memory-cache.

import { NextResponse, type NextRequest } from "next/server";
import { getTracking } from "@/lib/aliexpress/client";
import { getStore } from "@/lib/store/factory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TN = /^[A-Z0-9]{8,40}$/;

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expiry: number; body: unknown; status: number }>();

function cacheGet(key: string) {
  const hit = cache.get(key);
  if (!hit || Date.now() > hit.expiry) {
    cache.delete(key);
    return null;
  }
  return hit;
}

function cacheSet(key: string, body: unknown, status: number) {
  if (cache.size >= 500) for (const k of [...cache.keys()].slice(0, 50)) cache.delete(k);
  cache.set(key, { expiry: Date.now() + CACHE_TTL_MS, body, status });
}

export async function GET(req: NextRequest) {
  const tn = (req.nextUrl.searchParams.get("tn") || "").trim().toUpperCase();
  if (!tn || !VALID_TN.test(tn)) {
    return NextResponse.json({ error: "Ogiltigt spårningsnummer." }, { status: 400 });
  }

  const cached = cacheGet(tn);
  if (cached) return NextResponse.json(cached.body, { status: cached.status });

  try {
    const task = await getStore().getTaskByTrackingNumber(tn);
    if (!task?.aliexpressOrderId) {
      // Cacha INTE 404 — poll-tracking kan sätta trackingNumber när som helst.
      return NextResponse.json({ error: "Okänt spårningsnummer." }, { status: 404 });
    }

    const tracking = await getTracking(task.aliexpressOrderId);
    const body = {
      trackingNumber: tracking.trackingNumber ?? tn,
      carrier: tracking.shippingProvider ?? null,
      etaTimestamp: tracking.etaTimestamp ?? null,
      // Endast transportdata — inga kund-/order-fält.
      events: tracking.events.map((e) => ({ time: e.time, description: e.description })),
    };
    cacheSet(tn, body, 200);
    return NextResponse.json(body);
  } catch (err) {
    console.warn(`[tracking-events] ${tn}: ${err instanceof Error ? err.message.slice(0, 200) : err}`);
    return NextResponse.json({ error: "Spårningskällan svarade inte." }, { status: 502 });
  }
}
