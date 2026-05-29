// GET /api/seo/sitemap?baseUrl=https://www.fyndplats.se&newPrefix=/products/
//
// Genererar och returnerar sitemap.xml för nya headless-sajten från V3-katalogen.
// Returneras som application/xml för nedladdning till headless-repots
// public/sitemap.xml (eller bättre: kopiera logik och dynamiskt generera i
// Next.js app-router sitemap.ts).
//
// Token-skyddad — undvik scraping av produktnamn av tredjepart.

import { type NextRequest, NextResponse } from "next/server";
import { listAllV3Products } from "@/lib/wix/v3-products";
import { buildSitemapXml } from "@/lib/seo/migration";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const baseUrl = req.nextUrl.searchParams.get("baseUrl") || "https://www.fyndplats.se";
  const newPrefix = req.nextUrl.searchParams.get("newPrefix") || "/products/";

  try {
    const v3 = await listAllV3Products();
    const xml = buildSitemapXml(v3, baseUrl, newPrefix);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="sitemap.xml"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "fel" },
      { status: 502 },
    );
  }
}
