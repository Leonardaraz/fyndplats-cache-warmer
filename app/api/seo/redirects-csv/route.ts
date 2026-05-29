// GET /api/seo/redirects-csv?newPrefix=/products/
//
// Genererar och returnerar CSV med 301-redirects (old_url → new_url) för
// nedladdning. Användaren importerar i Cloudflare/Vercel/htaccess eller
// klistrar in i headless-repots next.config.js (se /api/seo/migration-map
// för Next-format).

import { type NextRequest, NextResponse } from "next/server";
import { listAllV1Products } from "@/lib/wix/v1-products";
import { listAllV3Products } from "@/lib/wix/v3-products";
import { buildMigrationReport, toRedirectsCsv } from "@/lib/seo/migration";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const newPrefix = req.nextUrl.searchParams.get("newPrefix") || "/products/";

  try {
    const [v1, v3] = await Promise.all([listAllV1Products(), listAllV3Products()]);
    const report = buildMigrationReport(v1, v3, newPrefix);
    const csv = toRedirectsCsv(report.pairs);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="seo-301-redirects.csv"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "fel" },
      { status: 502 },
    );
  }
}
