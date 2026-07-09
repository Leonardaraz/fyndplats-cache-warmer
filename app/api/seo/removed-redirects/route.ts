// GET /api/seo/removed-redirects?format=json|csv
//
// Kurerade 301-redirects för produkter vi medvetet tagit bort (icke-EU-lager)
// som fortfarande rankar i Google. Källa: lib/seo/removed-redirects.ts.
//
//   format=json (default) → { ok, count, redirects: [{source,destination,permanent}], items }
//     redirects-arrayen klistras rakt in i headless-repots next.config.js under
//     `async redirects()`. items[] tar med reason/targetNote för granskning.
//   format=csv            → nedladdningsbar CSV för Cloudflare/Vercel/.htaccess.
//
// Se docs/removed-products-seo-fix.md för hela handoffen (inkl. den systemiska
// 404-fixen som måste göras i headless-repot).

import { type NextRequest, NextResponse } from "next/server";
import {
  REMOVED_REDIRECTS,
  toRemovedRedirectsCsv,
  toRemovedRedirectsNextConfig,
} from "@/lib/seo/removed-redirects";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") || "json";

  if (format === "csv") {
    return new NextResponse(toRemovedRedirectsCsv(), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="removed-products-redirects.csv"',
      },
    });
  }

  return NextResponse.json({
    ok: true,
    count: REMOVED_REDIRECTS.length,
    redirects: toRemovedRedirectsNextConfig(),
    items: REMOVED_REDIRECTS,
  });
}
