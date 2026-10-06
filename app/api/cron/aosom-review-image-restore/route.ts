// POST /api/cron/aosom-review-image-restore — återställer raderade foton på
// Aosom-recensioner.
//
// Logiken och dess regler bor i lib/reviews/aosom-image-restore.ts. Den här filen
// kopplar bara in de riktiga beroendena: recensionslagret och Wix Media
// (hämta källfotot, ladda upp med rätt typ, vänta på READY). AliExpress-raderna
// har en egen väg: /api/cron/review-image-restore (#686).
//
// Anropas av workflowen aosom-review-image-restore.yml i varv. Torrt som default —
// `dryRun: false` krävs för att skriva. Svaret bär bara räknare, för
// workflowloggen är publik.

import { NextResponse } from "next/server";
import { getReviewStore } from "@/lib/store/reviews";
import { arAosomCdn, importeraOchBekrafta } from "@/lib/wix/bekraftad-bild";
import {
  restoreReviewImages,
  tolkaMål,
  type RestoreDeps,
} from "@/lib/reviews/aosom-image-restore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Ny rad tas inte efter så här lång tid — marginal till maxDuration. Lägre än
 * första körningens 230 s: nu går varje foto (upp till ~9 MB) genom funktionen
 * två gånger, och en rad med tre foton ska hinna bli klar innan Vercel bryter.
 */
const BUDGET_MS = 150_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Lever adressen? Wix CDN svarar 403 för en fil som inte finns. */
async function lever(url: string): Promise<boolean | null> {
  try {
    const res = await fetch(url, {
      headers: { Range: "bytes=0-0", "User-Agent": UA },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok || res.status === 206) return true;
    if (res.status === 403 || res.status === 404 || res.status === 410) return false;
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "ogiltig JSON" }, { status: 400 });
  }

  const mål = tolkaMål(body.rader);
  if (mål.length === 0) {
    return NextResponse.json({ error: "rader saknas" }, { status: 400 });
  }

  const store = getReviewStore();
  const deps: RestoreDeps = {
    listByProduct: (productId) => store.listByProduct(productId, 1000),
    upsert: (r) => store.upsert(r),
    lever,
    // Samma väg som AliExpress-återställningen (lib/wix/bekraftad-bild.ts):
    // hämta bytena, ladda upp med rätt typ, adressen först vid READY.
    importeraOchBekrafta: (källa, namn) => importeraOchBekrafta(källa, namn, arAosomCdn),
    now: () => Date.now(),
  };

  const dryRun = body.dryRun !== false;
  const stats = await restoreReviewImages(mål, deps, {
    dryRun,
    fromIndex: Math.max(0, Number(body.fromIndex) || 0),
    limit: Math.min(200, Math.max(1, Number(body.limit) || 25)),
    budgetMs: BUDGET_MS,
  });

  return NextResponse.json({ ok: true, dryRun, ...stats });
}
