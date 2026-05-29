// GET /api/seo/migration-map?newPrefix=/products/
//
// Returnerar full V1↔V3-matchningsrapport som JSON: par, orphans, stats.
// Token-skyddad eftersom det avslöjar full produktkatalog från båda sajterna.

import { type NextRequest, NextResponse } from "next/server";
import { listAllV1Products } from "@/lib/wix/v1-products";
import { listAllV3Products } from "@/lib/wix/v3-products";
import { buildMigrationReport } from "@/lib/seo/migration";
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
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "fel" },
      { status: 502 },
    );
  }
}
