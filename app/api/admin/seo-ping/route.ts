// app/api/admin/seo-ping/route.ts
// Manual "submit the sitemap NOW" endpoint for Leonard.
// Admin-protected by proxy.ts (ADMIN_SECRET cookie, or ?key=<ADMIN_SECRET>).
//
//   GET /api/admin/seo-ping?key=<ADMIN_SECRET>
//
// Does two things immediately:
//   1. Bing/Yandex/etc — submits every sitemap URL via IndexNow (the supported,
//      non-deprecated path).
//   2. Google — hits the legacy https://www.google.com/ping?sitemap= endpoint.
//      Google DEPRECATED this in 2023 (it's a no-op / 404 on their side now); we
//      still fire it best-effort and report the status honestly. The real way to
//      (re)submit to Google is Search Console, which needs OAuth we don't wire here.
import { NextResponse } from "next/server";
import { pingAllSearchEngines, INDEXNOW_KEY_LOCATION, SITEMAP_URL } from "../../../../lib/indexnow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Same code path as the weekly cron: Google + Bing/Yandex in one shot.
  const { indexNow, google } = await pingAllSearchEngines();
  return NextResponse.json({
    ok: indexNow.ok, // IndexNow is the path we actually rely on (Google ping is best-effort)
    sitemap: SITEMAP_URL,
    indexNow: { ...indexNow, keyLocation: INDEXNOW_KEY_LOCATION },
    google,
    ranAt: new Date().toISOString(),
  });
}

// Allow POST too, so it can be triggered from a fetch() button without a navigation.
export const POST = GET;
