// GET /api/cron/indexnow  → pingar IndexNow för nyligen ändrade/publicerade
// produkter så Google/Bing m.fl. crawlar dem snabbt.
//
// Detta är RYGGRADEN i indexerings-hastigheten: den täcker ALLA sätt en produkt
// går live på — inklusive manuella SEO-poleringar gjorda direkt mot Wix-API:t,
// då ingen annan kod i detta repo kör. Körs dagligen via GitHub Actions.
//
// Default: pingar produkter med `updatedDate` inom senaste 48h (?hours=N override).
// `?all=1` pingar ALLA synliga produkter (engångs-backfill av hela katalogen).
//
// Säkerhet: samma mönster som /api/cron/poll-tracking — Bearer CRON_SECRET
// (Vercel/GitHub Actions) eller x-fyndplats-token (manuell körning).

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { listAllV3Products } from "@/lib/wix/v3-products";
import { pingProductSlugs, indexNowConfigured } from "@/lib/seo/indexnow";

export const runtime = "nodejs";
export const maxDuration = 120;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  if (!indexNowConfigured()) {
    return NextResponse.json({ ok: true, skipped: "not-configured", pinged: 0 });
  }
  try {
    const all = req.nextUrl.searchParams.get("all") === "1";
    const hours = Number(req.nextUrl.searchParams.get("hours") ?? "48") || 48;
    const cutoff = Date.now() - hours * 3600_000;

    const products = await listAllV3Products();
    const slugs = products
      // Aldrig pinga draft-URL:er (skulle peka på en dold/404-sida).
      .filter((p) => p.slug && p.visible !== false)
      .filter((p) => {
        if (all) return true;
        const t = p.updatedDate ? Date.parse(p.updatedDate) : Number.NaN;
        return Number.isNaN(t) ? false : t >= cutoff;
      })
      .map((p) => p.slug);

    const result = await pingProductSlugs(slugs);
    return NextResponse.json({
      ok: result.ok,
      pinged: result.submitted,
      status: result.status,
      mode: all ? "all" : `updated<=${hours}h`,
      catalogTotal: products.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "fel" },
      { status: 502 },
    );
  }
}
