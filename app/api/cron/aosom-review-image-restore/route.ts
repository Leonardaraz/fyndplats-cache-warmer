// POST /api/cron/aosom-review-image-restore — återställer raderade foton på
// Aosom-recensioner.
//
// Logiken och dess regler bor i lib/reviews/aosom-image-restore.ts. Den här filen
// kopplar bara in de riktiga beroendena: recensionslagret och Wix Media
// (import + vänta på READY). AliExpress-raderna har en egen väg:
// /api/cron/review-image-restore (#686).
//
// Anropas av workflowen aosom-review-image-restore.yml i varv. Torrt som default —
// `dryRun: false` krävs för att skriva. Svaret bär bara räknare, för
// workflowloggen är publik.

import { NextResponse } from "next/server";
import { getReviewStore } from "@/lib/store/reviews";
import {
  restoreReviewImages,
  tolkaMål,
  type RestoreDeps,
} from "@/lib/reviews/aosom-image-restore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const WIX_BASE = "https://www.wixapis.com";
/** Ny rad tas inte efter så här lång tid — marginal till maxDuration. */
const BUDGET_MS = 230_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function wixHeaders(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const sov = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function gissaMime(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
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

/**
 * Importerar till Wix Media och returnerar adressen FÖRST när filen är klar.
 *
 * ☠️ Import File är asynkron: svaret bär en adress direkt, men Wix hämtar
 * källan efteråt och kan misslyckas. Att spara adressen utan att vänta är
 * precis hur en död länk ser frisk ut i lagret.
 */
async function importeraOchBekrafta(källa: string, namn: string): Promise<string | null> {
  let fil: { id?: string; url?: string } | undefined;
  for (let försök = 0; försök < 3 && !fil; försök++) {
    const res = await fetch(`${WIX_BASE}/site-media/v1/files/import`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({ url: källa, mimeType: gissaMime(källa), displayName: namn, private: false }),
    });
    if (res.status === 429) { await sov(3000 * (försök + 1)); continue; }
    if (!res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { file?: { id?: string; url?: string } };
    fil = data.file;
  }
  if (!fil?.id || !fil.url || !fil.url.startsWith("https://static.wixstatic.com/")) return null;

  const gräns = Date.now() + 30_000;
  while (Date.now() < gräns) {
    await sov(1500);
    const res = await fetch(
      `${WIX_BASE}/site-media/v1/files/get-file-by-id?fileId=${encodeURIComponent(fil.id)}`,
      { headers: wixHeaders() },
    );
    if (res.status === 429) { await sov(2000); continue; }
    if (!res.ok) continue;
    const data = (await res.json().catch(() => ({}))) as { file?: { operationStatus?: string } };
    const status = data.file?.operationStatus;
    if (status === "READY") return fil.url;
    if (status === "FAILED") return null;
  }
  return null;
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
    importeraOchBekrafta,
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
