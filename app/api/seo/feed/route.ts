// GET /api/seo/feed  → Google Shopping / Prisjakt-produktfeed (RSS 2.0).
//
// Genererar feeden från V3-katalogen (samma källa som sitemapen). READ-ONLY —
// rör ingenting i butiken. Lämna in denna URL i Google Merchant Center och/eller
// Prisjakt/PriceRunner för gratis produktlistningar.
//
// Auth: x-fyndplats-token (som övriga interna endpoints) ELLER ?token=<FEED_TOKEN>
// så Merchant Center/Prisjakt kan hämta feeden via en URL med token-parametern.

import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { listAllV3Products } from "@/lib/wix/v3-products";
import { buildShoppingFeedXml } from "@/lib/seo/feed";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

function feedAuthorized(req: NextRequest): boolean {
  // Intern körning med x-fyndplats-token.
  if (isAuthorized(req)) return true;
  // Feed-token i query (för Merchant Center/Prisjakt-hämtning). Timing-säker.
  const expected = process.env.FEED_TOKEN;
  if (!expected) return false;
  const provided = req.nextUrl.searchParams.get("token") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!feedAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  try {
    const products = await listAllV3Products();
    const xml = buildShoppingFeedXml(products);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "fel" },
      { status: 502 },
    );
  }
}
