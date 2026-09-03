// POST /api/admin/remap-supplier — lägg om en publicerad AliExpress-rad till Aosom.
//
// Bakgrunden och varje spärrs motiv bor i lib/store/remap-supplier.ts och är
// testade där. Rutten är tunn: auth, torrkörning, loop, kvitto, audit.
//
// ☠️ TRE EGENSKAPER SOM INTE SKA TAS BORT
//
// 1. INGEN "KÖR ALLT"-FLAGGA. Anroparen räknar upp paren. Samma regel som
//    prisreparationen: "listan med id:n är kvitteringen på att en människa läst
//    planen". Här är den ännu hårdare motiverad — en felparad rad byter vad vi
//    KÖPER, och ordern hamnar hos fel leverantör med rätt kvitto.
//
// 2. TORRKÖRNING ÄR DEFAULT. Utan ?dryRun=false skrivs ingenting. Svaret är då
//    exakt den plan en skarp körning skulle utföra, med kostnadsdeltat per par.
//
// 3. ☠️ RADEN LÄSES TILLBAKA. `saveMapping` rapporterar framgång oavsett, och
//    huset har brunnit fem gånger på ett svar utan fel. `verifiera` jämför den
//    ÅTERLÄSTA raden mot planen och en avvikelse blir `misslyckade`.
//
// Kundens pris rörs INTE här — se noten vid grossSek i modulen.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import {
  planeraOmlaggning,
  applicera,
  verifiera,
  type Omlaggningsplan,
} from "@/lib/store/remap-supplier";

export const runtime = "nodejs";
export const maxDuration = 60;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

type Par = { live: string; utkast: string; tvingaFordyring?: boolean };

type Rad = {
  live: string;
  utkast: string;
  status: "planerad" | "omlagd" | "vagrad" | "fel";
  skal?: string;
  detalj?: string;
  fran?: string;
  till?: string;
  franLandedCostSek?: number;
  tillLandedCostSek?: number;
  deltaSek?: number;
  deltaPct?: number;
  avvikelser?: string[];
};

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let kropp: { pairs?: Par[] };
  try {
    kropp = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "ogiltig JSON" }, { status: 400 });
  }

  const pairs = Array.isArray(kropp.pairs) ? kropp.pairs : [];
  if (!pairs.length) {
    return NextResponse.json(
      {
        ok: false,
        error: "pairs saknas. Skicka [{live, utkast}] — det finns ingen "
          + "kör-allt-flagga, uppräkningen ÄR kvitteringen på att någon läst planen.",
      },
      { status: 400 },
    );
  }
  if (pairs.length > 50) {
    return NextResponse.json(
      { ok: false, error: `${pairs.length} par är för många — max 50 per körning.` },
      { status: 400 },
    );
  }

  const dryRun = new URL(req.url).searchParams.get("dryRun") !== "false";
  const store = getStore();
  const rader: Rad[] = [];
  let omlagda = 0, vagrade = 0, misslyckade = 0;

  for (const par of pairs) {
    const bas: Rad = { live: par.live, utkast: par.utkast, status: "fel" };
    try {
      const [live, utkast] = await Promise.all([
        store.getMappingByWixProductId(par.live),
        store.getMappingByWixProductId(par.utkast),
      ]);
      if (!live) {
        rader.push({ ...bas, skal: "live_mappning_saknas" });
        misslyckade++;
        continue;
      }
      if (!utkast) {
        rader.push({ ...bas, skal: "utkast_mappning_saknas" });
        misslyckade++;
        continue;
      }

      const { plan, fel } = planeraOmlaggning(live, utkast, {
        tvingaFordyring: par.tvingaFordyring === true,
      });
      if (fel || !plan) {
        rader.push({ ...bas, status: "vagrad", skal: fel?.skal, detalj: fel?.detalj });
        vagrade++;
        continue;
      }

      const sammanfattning = plansammanfattning(plan);
      if (dryRun) {
        rader.push({ ...bas, status: "planerad", ...sammanfattning });
        continue;
      }

      await store.saveMapping(applicera(live, plan));

      // ☠️ Kvittot: läs om raden i ett EGET anrop. En verifiering på det vi just
      // skickade mäter vår egen variabel, inte databasen.
      const efter = await store.getMappingByWixProductId(par.live);
      const v = efter
        ? verifiera(efter, plan)
        : { ok: false, avvikelser: ["raden gick inte att läsa tillbaka"] };
      if (!v.ok) {
        rader.push({ ...bas, status: "fel", skal: "skrivningen_tog_inte",
                     avvikelser: v.avvikelser, ...sammanfattning });
        misslyckade++;
        continue;
      }

      await store.appendAudit({
        at: new Date().toISOString(),
        kind: "mapping-supplier-remapped",
        ref: par.live,
        detail: JSON.stringify({
          fran: plan.franSupplierProductId,
          till: plan.tillSupplierProductId,
          deltaSek: plan.deltaSek,
          deltaPct: plan.deltaPct,
          utkast: par.utkast,
        }),
      });
      rader.push({ ...bas, status: "omlagd", ...sammanfattning });
      omlagda++;
    } catch (e) {
      // Ett fel fäller inte resten — nästa par kan vara det som går att lägga om.
      rader.push({ ...bas, skal: "undantag", detalj: (e as Error).message });
      misslyckade++;
    }
  }

  const sparadSek = rader
    .filter((r) => r.status === "omlagd")
    .reduce((s, r) => s + (r.deltaSek ?? 0), 0);

  return NextResponse.json({
    ok: misslyckade === 0,
    dryRun,
    granskade: pairs.length,
    omlagda,
    vagrade,
    misslyckade,
    kostnadsforandringSek: Math.round(sparadSek * 100) / 100,
    rader,
  });
}

function plansammanfattning(plan: Omlaggningsplan) {
  return {
    fran: plan.franSupplierProductId,
    till: plan.tillSupplierProductId,
    franLandedCostSek: plan.franLandedCostSek,
    tillLandedCostSek: plan.tillLandedCostSek,
    deltaSek: plan.deltaSek,
    deltaPct: plan.deltaPct,
  };
}
