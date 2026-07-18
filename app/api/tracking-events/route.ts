// GET /api/tracking-events?tn=<spårningsnummer>
//
// AliExpress egna spårningshändelser för ett spårningsnummer — källan som
// headless-sajtens /sparning använder FÖRST (17TRACK klarar inte alla
// EU-fraktkedjor: "Carrier cannot be detected" för t.ex. PostNord parcel
// connect, medan AliExpress alltid känner sin egen order).
//
// Uppslag: FyndplatsTasks (trackingNumber sätts av poll-tracking vid
// skeppning) → aliexpressOrderId → aliexpress.ds.order.tracking.get.
//
// PUBLIK med samma hotmodell som headless /api/track: nyckeln är själva
// spårningsnumret, och svaret innehåller ENBART transportdata (händelser,
// transportör, ETA) — aldrig kund-, adress- eller orderuppgifter.
// Quota-skydd: formatfilter + 5 min in-memory-cache.

import { NextResponse, type NextRequest } from "next/server";
import { getTracking } from "@/lib/aliexpress/client";
import { WIX_BASE, wixHeaders } from "@/lib/wix/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TN = /^[A-Z0-9]{8,40}$/;
const TASKS_COL = process.env.WIX_DATA_COL_TASKS ?? "FyndplatsTasks";

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

async function findTaskByTracking(tn: string): Promise<{ aliexpressOrderId?: string } | null> {
  const res = await fetch(`${WIX_BASE}/wix-data/v2/items/query`, {
    method: "POST",
    headers: wixHeaders(),
    body: JSON.stringify({
      dataCollectionId: TASKS_COL,
      query: { filter: { trackingNumber: tn }, paging: { limit: 1 } },
    }),
  });
  if (!res.ok) throw new Error(`task-uppslag ${res.status}`);
  const body = (await res.json()) as { dataItems?: Array<{ data?: { aliexpressOrderId?: string } }> };
  return body.dataItems?.[0]?.data ?? null;
}

export async function GET(req: NextRequest) {
  const tn = (req.nextUrl.searchParams.get("tn") || "").trim().toUpperCase();
  if (!tn || !VALID_TN.test(tn)) {
    return NextResponse.json({ error: "Ogiltigt spårningsnummer." }, { status: 400 });
  }

  const cached = cacheGet(tn);
  if (cached) return NextResponse.json(cached.body, { status: cached.status });

  try {
    const task = await findTaskByTracking(tn);
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
