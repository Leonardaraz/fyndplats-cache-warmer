// Vercel Cron: GET /api/cron/medlemsnivaer, 04:40 UTC dagligen (vercel.json).
//
// Medlemskapets dagliga jobb (lib/medlem/nattjobb.ts): avstämning av
// orderliggaren mot Wix, bakåtläsning tills liggaren är komplett, nivån per
// medlem och mejlen om ny nivå och kommande sänkning. 04:40 ligger efter
// order-sync (04:00), före morgonmejlet (06:00) och utanför Aosoms
// synkfönster (03:12–03:29 och 06:12–06:29).
//
// Svaret bär bara antal. Auth: "Authorization: Bearer $CRON_SECRET", samma
// mönster som övriga cron-rutter.

import { NextResponse } from "next/server";
import { korNattjobb } from "@/lib/medlem/nattjobb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function behorig(req: Request): boolean {
  const vantad = process.env.CRON_SECRET;
  if (!vantad) return true;
  return req.headers.get("authorization") === `Bearer ${vantad}`;
}

export async function GET(req: Request) {
  if (!behorig(req)) return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  const start = Date.now();
  try {
    const utfall = await korNattjobb(start + 240_000);
    const ok =
      utfall.avstamning.fel === 0 && (utfall.bakat?.fel ?? 0) === 0 && (utfall.medlemmar?.fel ?? 0) === 0 && (utfall.gallrade?.fel ?? 0) === 0;
    console.log("[medlemsnivaer]", JSON.stringify({ ...utfall, ms: Date.now() - start }));
    return NextResponse.json({ ok, ...utfall, ms: Date.now() - start }, { status: ok ? 200 : 500 });
  } catch (e) {
    const fel = e instanceof Error ? e.message.slice(0, 160) : String(e);
    console.error("[medlemsnivaer] fel:", fel);
    return NextResponse.json({ ok: false, fel }, { status: 500 });
  }
}
