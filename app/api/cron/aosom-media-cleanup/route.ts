// GET/POST /api/cron/aosom-media-cleanup
//
// Raderar Aosom-bilder som ingen produkt använder.
//
// ☠️ VARFÖR DEN BEHÖVDES (2026-08-28)
//
// Wix-lagringen tog slut mitt under den fjärde bildfix-körningen. Orsaken är att
// `image-repair.ts` laddar upp alla fem bilderna på nytt för varje produkt den
// lagar och ersätter medialistan — de gamla filerna blir kvar och ingen städar
// dem. Fyra körningar mot en katalog som växte till 2 712 produkter blev
// tusentals föräldralösa filer à drygt en megabyte.
//
// SPÄRRAR
//
// Bara filer vars namn börjar med `aosom-`, och bara de som INTE sitter på någon
// produkt. Referenslistan byggs ur hela katalogen, inte bara Aosom-delen. Och
// `planeraStadning` KASTAR om referenslistan är misstänkt liten — en halvläst
// produktlistning gör varje fil föräldralös, och en körning hade då raderat hela
// butikens bildbank permanent.
//
// Raderingen är PERMANENT med flit: papperskorgen räknas fortfarande mot
// lagringen, så en vanlig radering frigör ingenting.
//
// Query:
//   ?dryRun=false     skarpt läge (default: torrkörning, raderar ingenting)
//   ?limit=500        tak på antal filer denna körning

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { runMediaCleanup, liveDeps } from "@/lib/aosom/media-cleanup";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") !== "false";
  const n = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;

  try {
    const summary = await runMediaCleanup(await liveDeps(), { dryRun, limit });

    if (!dryRun && summary.raderade > 0) {
      await audit(
        "aosom-media-cleanup",
        "batch",
        `${summary.raderade} föräldralösa bilder raderade permanent, `
          + `${summary.frigjordMb} MB frigjort, ${summary.misslyckade} misslyckade`,
      );
    }

    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    // Massfel-spärren landar här. 500 är rätt — körningen SKA synas som
    // misslyckad, inte som en lyckad städning som råkade inte radera något.
    return NextResponse.json({ error: "Mediastädningen misslyckades", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
