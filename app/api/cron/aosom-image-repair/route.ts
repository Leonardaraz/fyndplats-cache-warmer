// GET/POST /api/cron/aosom-image-repair
//
// Laddar om bilderna på Aosom-produkter som fick för få vid importen.
//
// VARFÖR DEN FINNS
//
// Svepet 2026-08-27 importerade 675 produkter. 397 fick NOLL bilder och 87 fick
// färre än fem — medan importen rapporterade `failed: 0`, eftersom produkten
// skapades och det bara var bilderna som föll bort. Roten satt i
// lib/wix/media.ts: rejectade uppladdningar filtrerades bort utan logg, och det
// fanns inget återförsök mot Wix 429. Båda är lagade där. Den här rutten städar
// upp efter dem.
//
// VAD DEN INTE RÖR
//
// Bara `media`, via setProductMedia med `fieldMask: ["media"]`. Synlighet,
// varianter, priser och texter är orörda — en Aosom-produkt är ett osynligt
// utkast och ska förbli det.
//
// Query:
//   ?dryRun=false     skarpt läge (default: torrkörning, skriver ingenting)
//   ?limit=25         produkter denna körning
//   ?after=845-030CG  fortsätt efter det här artikelnumret
//   ?sku=845-030CG    kör bara dessa (riktad omkörning)
//   ?bilder=alla      ladda om alla nio i stället för de fem rena

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { runImageRepair, liveDeps } from "@/lib/aosom/image-repair";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Under maxDuration med marginal — feeden tar ~5 s att hämta och tolka. */
const TIME_BUDGET_MS = 240_000;

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

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") !== "false";
  const limit = intParam(req, "limit", 25);
  const after = req.nextUrl.searchParams.get("after") ?? undefined;
  const bilderParam = (req.nextUrl.searchParams.get("bilder") ?? "").trim();
  const bildpositioner = bilderParam === "alla"
    ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
    : bilderParam
      ? bilderParam.split(",").map((s) => Number(s.trim())).filter((n) => n >= 1 && n <= 9)
      : undefined;
  const onlySkus = (req.nextUrl.searchParams.get("sku") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const summary = await runImageRepair(await liveDeps(), {
      dryRun,
      limit,
      after,
      onlySkus: onlySkus.length ? onlySkus : undefined,
      bildpositioner: bildpositioner?.length ? bildpositioner : undefined,
      timeBudgetMs: TIME_BUDGET_MS,
    });

    if (!dryRun && summary.reparerade > 0) {
      await audit(
        "aosom-image-repair",
        "batch",
        `${summary.reparerade} produkter fick tillbaka sina bilder, `
          + `${summary.kvarstaendeMissar} bilder saknas fortfarande, `
          + `${summary.kvar} kvar (stopp: ${summary.stoppedBy})`,
      );
    }

    return NextResponse.json(
      {
        ok: true,
        ...summary,
        next: summary.cursor
          ? `/api/cron/aosom-image-repair?dryRun=${dryRun ? "true" : "false"}&limit=${limit}`
            + `&after=${encodeURIComponent(summary.cursor)}`
          : null,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Bildreparationen misslyckades", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
