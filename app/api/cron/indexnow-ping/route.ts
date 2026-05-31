// app/api/cron/indexnow-ping/route.ts
// Vercel Cron entry: GET /api/cron/indexnow-ping
// Schedule: Mondays 03:00 UTC ("0 3 * * 1", see vercel.json).
//
// Submits the whole sitemap to IndexNow (Bing, Yandex, …) so freshly added or
// updated products/categories/posts get re-crawled within hours instead of days.
// Google ignores IndexNow, but Bing/others honour it — and it's free.
//
// New products/posts also get pinged in real time from the Wix webhook
// (lib/indexnow#pingProductSlug / pingBlogSlug); this weekly sweep is the safety
// net that catches anything the webhook missed.
import { NextResponse } from "next/server";
import { pingAllSiteUrls } from "../../../../lib/indexnow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorised(request: Request): boolean {
  // Vercel sets `Authorization: Bearer <CRON_SECRET>` on cron requests when
  // CRON_SECRET is configured. Same pattern as the abandoned-cart cron.
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // allow in dev when unconfigured
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }
  const result = await pingAllSiteUrls();
  return NextResponse.json(result);
}
