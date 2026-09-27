// GET/POST /api/cron/gpsr-fill
//
// Fyller produktsäkerhetsposterna (GPSR) för Aosom-produkterna: märke och
// svensk säkerhetstext per produkt. Se lib/gpsr/aosom.ts för varför.
//
// Query:
//   ?dryRun=false   skarpt läge (default: torrkörning, sparar ingenting och
//                   returnerar några färdiga poster i `prov` att granska)
//   ?limit=400      tak på antal utvinningar denna körning
//
// Svaret bär `kvar`. Är den större än noll återstår produkter — nästa körning
// tar dem. En körning utan ändrade källor gör inga modellanrop alls.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import { fyllGpsr } from "@/lib/gpsr/fyll";
import { listaGpsr, sparaGpsr } from "@/lib/gpsr/lager";
import { utvinnSakerhet } from "@/lib/gpsr/sakerhet";

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
    const store = getStore();
    // Tidsbudgeten ligger under maxDuration så att körningen hinner svara med
    // sina siffror i stället för att dödas mitt i en omgång.
    const summary = await fyllGpsr(
      {
        listaMappningar: () => store.listMappings(),
        hamtaFeed: () => fetchAosomFeed(),
        listaPoster: listaGpsr,
        spara: sparaGpsr,
        utvinn: utvinnSakerhet,
      },
      { dryRun, limit, timeBudgetMs: 230_000 },
    );

    if (!dryRun && summary.sparade > 0) {
      await audit(
        "gpsr-fill",
        "batch",
        `${summary.sparade} produktsäkerhetsposter sparade, ${summary.fel} fel, ${summary.kvar} kvar`,
      );
    }
    if (summary.fel > 0) {
      console.error(`[gpsr-fill] ${summary.fel} utvinningar misslyckades — försöks igen nästa körning.`);
    }

    return NextResponse.json({ ok: true, ...summary }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[gpsr-fill] fel:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
