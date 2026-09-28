// POST/GET /api/cron/review-image-restore
//
// Hämtar tillbaka AliExpress-recensionernas kundfoton som mediastädningen
// raderat. Logiken och bakgrunden: lib/reviews/image-restore.ts.
//
// Körs i varv av .github/workflows/review-image-restore.yml: varje anrop tar
// högst `limit` produkter och svarar med `nasta`, som nästa anrop skickar som
// `after`. `nasta: null` = hela listan genomgången.
//
// Query:
//   ?dryRun=false   skarpt läge (default: torrkörning, skriver inget)
//   ?limit=25       produkter att hämta från AE i detta anrop
//   ?after=<id>     fortsätt efter denna produkt
//   ?pages=10       AE-sidor à 20 per produkt (recensionen kan ligga djupt)

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { getReviewStore } from "@/lib/store/reviews";
import { isAliExpressMapping } from "@/lib/store/supplier";
import { fetchAeReviews } from "@/lib/aliexpress/reviews";
import { importImageToOwnMedia } from "@/lib/wix/media-import";
import { RECENSION_TAK } from "@/lib/aosom/media-cleanup";
import { runImageRestore } from "@/lib/reviews/image-restore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Marginal till maxDuration: en pågående produkt hinner bli klar. */
const TIDSBUDGET_MS = 230_000;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function intParam(req: NextRequest, name: string, fallback: number, max: number): number {
  const n = Number(req.nextUrl.searchParams.get(name));
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.trunc(n)) : fallback;
}

/**
 * 403/404 från Wix CDN = filen är raderad (Wix svarar 403 även för påhittade
 * adresser). Bara wixstatic-adresser prövas: en leverantörsadress på en
 * publicerad rad är ett annat fel, som /api/cron/review-translate lagar.
 */
async function arDod(url: string): Promise<boolean> {
  if (!url.startsWith("https://static.wixstatic.com/")) return false;
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-0" }, signal: AbortSignal.timeout(15_000) });
    await res.body?.cancel();
    return res.status === 403 || res.status === 404;
  } catch {
    return false;
  }
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") !== "false";
  const limit = intParam(req, "limit", 25, 200);
  const pages = intParam(req, "pages", 10, 25);
  const after = req.nextUrl.searchParams.get("after") || undefined;

  const reviews = getReviewStore();
  const store = getStore();

  try {
    const summary = await runImageRestore(
      {
        listAll: () => reviews.listAll(RECENSION_TAK),
        aeProductId: async (wixProductId) => {
          const m = await store.getMappingByWixProductId(wixProductId);
          return m?.supplierProductId && isAliExpressMapping(m) ? m.supplierProductId : null;
        },
        fetchReviews: async (aeId) => {
          const r = await fetchAeReviews(aeId, { pages });
          return { reviews: r.reviews, throttled: r.throttled };
        },
        isDead: arDod,
        importImage: (url, namn) => importImageToOwnMedia(url, namn),
        upsert: (r) => reviews.upsert(r),
      },
      { dryRun, limit, after, timeBudgetMs: TIDSBUDGET_MS },
    );

    if (!dryRun && summary.aterstallda > 0) {
      await audit(
        "reviews-image-restore",
        "batch",
        `${summary.bilderAterstallda} kundfoton återställda på ${summary.aterstallda} recensioner`,
      );
    }

    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ ok: false, error: "Återställningen misslyckades", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
