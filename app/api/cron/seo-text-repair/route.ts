// GET/POST /api/cron/seo-text-repair
//
// Städar publicerad produkttext från två fel som båda hittats av svep och inget
// av en spärr:
//
//   1. ☠️ Leverantörens artikelnummer i texten. dealproffsen.se publicerar
//      Aosoms artikelnummer som `sku`/`mpn` i sin JSON-LD, så samma sträng hos
//      oss gör våra sidor joinbara mot deras — och därmed mot vad vi betalar.
//      Hittad tre gånger: 33 produktkort och fyra sidor 2026-09-02, 51 sidor
//      till 2026-09-03 sedan svepets egen regex rättats.
//   2. Trasiga syskonlänkar. Wix skriver om en rotrelativ `href="/produkt/x"`
//      till `https:/produkt/x` — en snedstreck, alltså värdnamnet `produkt`.
//      Länken pekar på en domän som inte finns.
//
// Query:
//   ?dryRun=false        skarpt läge (default: torrkörning, skriver ingenting)
//   ?limit=50            tak på antal SKRIVNINGAR denna körning
//   ?after=<markör>      fortsätt listningen där förra körningen slutade
//   ?onlyPublished=false ta med osynliga utkast (default: bara publicerade)
//
// Svaret bär `cursor`. Är den satt återstår produkter — kör igen med `?after=`.
//
// ☠️ `lagade` räknas först efter en ÅTERLÄSNING som visar att texten är ren.
// Ett svar utan fel är inget kvitto: ett globalt SYNC_DRY_RUN sväljer
// skrivningen tyst, och då blir raden `misslyckade` i stället för `lagade`.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { runTextRepair, liveDeps } from "@/lib/seo/text-repair";

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

  const q = req.nextUrl.searchParams;
  const dryRun = q.get("dryRun") !== "false";
  const n = Number(q.get("limit"));
  const limit = Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;
  const after = q.get("after") ?? undefined;
  const onlyPublished = q.get("onlyPublished") !== "false";

  try {
    const sum = await runTextRepair(await liveDeps(), { dryRun, limit, after, onlyPublished });
    if (!dryRun && (sum.lagade > 0 || sum.misslyckade > 0)) {
      await audit(
        "seo-text-repair",
        undefined,
        `lagade=${sum.lagade} misslyckade=${sum.misslyckade} kod=${sum.medKod} lankar=${sum.medTrasigLank}`,
      );
    }
    return NextResponse.json({ ok: true, ...sum });
  } catch (e) {
    const fel = e instanceof Error ? e.message : String(e);
    await audit("seo-text-repair-fatal", undefined, fel.slice(0, 300));
    return NextResponse.json({ ok: false, error: fel }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
