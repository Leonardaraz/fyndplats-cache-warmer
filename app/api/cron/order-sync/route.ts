// app/api/cron/order-sync/route.ts
// Vercel Cron entry: GET /api/cron/order-sync
// Schedule: "0 4 * * *" (04:00 UTC dagligen — se vercel.json). Körs FÖRE
// morgonmejlet (06:00 UTC) så dashboarden ser en komplett spegel samma morgon.
//
// Varför: order_created-webhooken speglar ordrar i realtid till lokala `orders`-
// tabellen, men en tappad webhook (leveransfel/deploy-fönster) skulle lämna ett
// hål. Det här cronet pollar Wix Orders-API:t och fyller diffen (idempotent
// upsert via lib/order-sync → recordOrder). Saknar API-nyckeln Read-behörighet
// (403) blir det en no-op och webhook-spegeln räcker.
//
// Auth: Vercel Cron skickar "Authorization: Bearer $CRON_SECRET". Saknas
// CRON_SECRET i miljön släpper vi igenom (samma mönster som övriga cron-routes).

import { NextResponse } from "next/server";
import { syncOrdersFromWix } from "@/lib/order-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorised(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // dev fallback
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  const lookbackDays = daysParam ? Math.max(1, Math.min(90, Number(daysParam))) : undefined;

  const result = await syncOrdersFromWix({ lookbackDays });
  console.log("[order-sync]", result);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
