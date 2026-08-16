// POST/GET /api/cron/review-backfill
//
// Fyller på recensioner för produkter som redan ligger i butiken. Recensions-
// kedjan har funnits sedan 2026-07-08 men fick aldrig någon inmatning: enda
// vägen in var tilläggets DOM-skrapa, som missar AE:s lazy-laddade
// recensionssektion, och bulk-importen rör inte recensioner alls. Resultat:
// FyndplatsImportedReviews hade 0 rader på 876 produkter.
//
// Den här körningen hämtar i stället server-side (lib/aliexpress/reviews.ts).
//
// SÄKERHET — publicering ska väljas, inte råka hända:
//   - dryRun är DEFAULT PÅ. Utan ?dryRun=false skrivs ingenting; du får bara
//     siffrorna. Importerade recensioner auto-godkänns och syns direkt på
//     produktsidan, så skarpt läge är ett publiceringsbeslut.
//   - Ingen cron-schemaläggning i vercel.json. Rutten körs när den anropas.
//   - DeepL-budgeten kollas FÖRE varje produkt; körningen stannar hellre än
//     publicerar engelsk text (se lib/reviews/backfill.ts).
//
// Query:
//   ?dryRun=false        skarpt läge (default: torrkörning)
//   ?limit=25            produkter denna körning
//   ?maxPerProduct=8     tak per produkt (styr månadsbudgeten)
//   ?includeExisting=1   ta även produkter som redan har recensioner
//   ?onlyPublished=1     hoppa över utkast i /admin/queue

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { buildReviewBackfillDeps } from "@/lib/reviews/backfill-deps";
import {
  runReviewBackfill,
  DEFAULT_BACKFILL_LIMIT,
  DEFAULT_MAX_PER_PRODUCT,
} from "@/lib/reviews/backfill";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function intParam(req: NextRequest, name: string, fallback: number): number {
  const n = Number(req.nextUrl.searchParams.get(name));
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

function boolParam(req: NextRequest, name: string): boolean {
  const v = req.nextUrl.searchParams.get(name);
  return v === "1" || v === "true";
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") !== "false";
  const limit = intParam(req, "limit", DEFAULT_BACKFILL_LIMIT);
  const maxPerProduct = intParam(req, "maxPerProduct", DEFAULT_MAX_PER_PRODUCT);
  const includeExisting = boolParam(req, "includeExisting");
  const onlyPublished = boolParam(req, "onlyPublished");

  try {
    const summary = await runReviewBackfill(
      buildReviewBackfillDeps({ onlyPublished }),
      { dryRun, limit, maxPerProduct, includeExisting },
    );

    if (!dryRun && summary.reviewsImported > 0) {
      await audit(
        "reviews-backfill",
        "batch",
        `${summary.reviewsImported} recensioner på ${summary.withReviews} produkter ` +
          `(DeepL ${summary.charsSpent} tecken, stopp: ${summary.stoppedBy})`,
      );
    }

    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Backfill misslyckades", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
