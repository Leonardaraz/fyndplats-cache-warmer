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
import { pingAllSiteUrls, INDEXNOW_KEY_LOCATION } from "../../../../lib/indexnow";
import { SITE } from "../../../../lib/site-urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITEMAP_URL = `${SITE}/sitemap.xml`;

async function pingGoogle(): Promise<{ ok: boolean; status: number; deprecated: true; note: string }> {
  const url = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
  try {
    const res = await fetch(url, { method: "GET" });
    return {
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      deprecated: true,
      note: "Google deprecated sitemap ping (2023). Use Search Console for guaranteed submission.",
    };
  } catch (e) {
    return { ok: false, status: 0, deprecated: true, note: (e as Error).message };
  }
}

export async function GET() {
  const [indexNow, google] = await Promise.all([pingAllSiteUrls(), pingGoogle()]);
  return NextResponse.json({
    ok: indexNow.ok, // IndexNow is the path we actually rely on
    sitemap: SITEMAP_URL,
    indexNow: { ...indexNow, keyLocation: INDEXNOW_KEY_LOCATION },
    google,
    ranAt: new Date().toISOString(),
  });
}

// Allow POST too, so it can be triggered from a fetch() button without a navigation.
export const POST = GET;
