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
import {
  bildtypUrSignatur,
  medAndelse,
  restoreReviewImages,
  tolkaMål,
  type RestoreDeps,
} from "@/lib/reviews/aosom-image-restore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const WIX_BASE = "https://www.wixapis.com";
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

function wixHeaders(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const sov = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Aosoms bild-CDN — den enda värd rutten hämtar ifrån. */
const AOSOM_VARD = "img.aosomcdn.com";
/** Wix tar bilder upp till 25 MB; de största källfotona vi mätt är ~9 MB. */
const MAX_BYTE = 20 * 1024 * 1024;

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

/** Källfotots byte, eller null. Bara Aosoms CDN, högst MAX_BYTE. */
async function hämtaKälla(källa: string): Promise<Uint8Array<ArrayBuffer> | null> {
  // tolkaMål släpper bara igenom Aosoms CDN — men den här funktionen hämtar
  // vad den får, så kontrollen upprepas här och på slutadressen efter omdirigering.
  const värd = (u: string) => { try { return new URL(u).hostname; } catch { return ""; } };
  if (värd(källa) !== AOSOM_VARD) return null;
  try {
    const res = await fetch(källa, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
    if (!res.ok || värd(res.url || källa) !== AOSOM_VARD) { await res.body?.cancel(); return null; }
    if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTE) { await res.body?.cancel(); return null; }
    const b = new Uint8Array(await res.arrayBuffer());
    return b.byteLength > 0 && b.byteLength <= MAX_BYTE ? b : null;
  } catch {
    return null;
  }
}

/** Väntar tills Wix bearbetat filen: true = READY, false = FAILED eller för länge. */
async function väntaPåKlar(id: string): Promise<boolean> {
  const gräns = Date.now() + 30_000;
  while (Date.now() < gräns) {
    await sov(1500);
    const res = await fetch(
      `${WIX_BASE}/site-media/v1/files/get-file-by-id?fileId=${encodeURIComponent(id)}`,
      { headers: wixHeaders() },
    );
    if (res.status === 429) { await sov(2000); continue; }
    if (!res.ok) continue;
    const data = (await res.json().catch(() => ({}))) as { file?: { operationStatus?: string } };
    const status = data.file?.operationStatus;
    if (status === "READY") return true;
    if (status === "FAILED") return false;
  }
  return false;
}

/**
 * Hämtar källfotot, laddar upp det till Wix Media och returnerar adressen
 * FÖRST när filen är klar.
 *
 * VARFÖR INTE Import File (som första körningen använde, 2026-09-28). Wix
 * import hämtar källan själv och tror på värdens Content-Type. För 95 rader
 * skickade Aosoms CDN fel typ eller en .heif-ändelse på en JPEG, och varje
 * import slutade FAILED. Här bestäms typen av filens egna byte
 * (`bildtypUrSignatur`) och filen laddas upp via Generate File Upload URL med
 * rätt typ och ändelse.
 *
 * En uppladdad fil saknar `sourceUrl`, och mediastädningen rör aldrig en fil
 * utan källadress (lib/aosom/media-cleanup.ts, `arVarFil`). De här fotona kan
 * alltså inte städas bort igen.
 *
 * ☠️ Uppladdningen är asynkron som importen: ett lyckat svar betyder inte att
 * filen är klar. Att spara adressen utan att vänta på READY är precis hur en
 * död länk ser frisk ut i lagret.
 */
async function importeraOchBekrafta(källa: string, namn: string): Promise<string | null> {
  const byte = await hämtaKälla(källa);
  if (!byte) return null;
  const typ = bildtypUrSignatur(byte);
  if (!typ) return null;

  let uppladdning: string | undefined;
  for (let försök = 0; försök < 3 && !uppladdning; försök++) {
    const res = await fetch(`${WIX_BASE}/site-media/v1/files/generate-upload-url`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({ mimeType: typ.mime, fileName: medAndelse(namn, typ.andelse), private: false }),
    });
    if (res.status === 429) { await sov(3000 * (försök + 1)); continue; }
    if (!res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { uploadUrl?: string };
    uppladdning = data.uploadUrl;
  }
  if (!uppladdning?.startsWith("https://")) return null;

  let fil: { id?: string; url?: string; operationStatus?: string } | undefined;
  try {
    const res = await fetch(uppladdning, {
      method: "PUT",
      headers: { "Content-Type": typ.mime },
      body: new Blob([byte], { type: typ.mime }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) { await res.body?.cancel(); return null; }
    fil = ((await res.json().catch(() => ({}))) as { file?: typeof fil }).file;
  } catch {
    return null;
  }
  if (!fil?.id || !fil.url || !fil.url.startsWith("https://static.wixstatic.com/")) return null;
  if (fil.operationStatus === "READY") return fil.url;
  if (fil.operationStatus === "FAILED") return null;
  return (await väntaPåKlar(fil.id)) ? fil.url : null;
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
