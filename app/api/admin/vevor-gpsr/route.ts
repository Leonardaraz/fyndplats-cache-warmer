// GET/POST /api/admin/vevor-gpsr — produktsäkerheten (GPSR) för VEVOR-varor.
//
//   GET                       antal VEVOR-varor per GPSR-status
//   GET  ?wixProductId=<id>   en varas status och uppgifter
//   POST { atgard: "satt", wixProductIds, tillverkare, euAnsvarig, kalla, dryRun }
//   POST { atgard: "rensa", wixProductIds, dryRun }
//   POST { atgard: "standard", tillverkare, euAnsvarig, kalla, dryRun }
//   POST { atgard: "rensa_standard", dryRun }
//
// Standardraden gäller alla VEVOR-varor utan egen rad
// (lib/vevor/gpsr-standard.ts, Leonard 2026-10-29). En egen rad går före.
//
// En part är { namn, adress, epost }. `euAnsvarig` eller `tillverkare` får
// vara null när källan bara nämner den ena. Samma uppgifter kan föras in för
// flera varor i ett anrop (syskon med samma manual), högst 50.
//
// Uppgifterna och reglerna: lib/vevor/gpsr.ts. Lagringen: lib/vevor/gpsr-lager.ts.
// Spärren som läser dem: lib/publicering.ts.
//
// ☠️ SVARET GÅR TILL EN PUBLIK LOGG (workflowen "VEVOR — produktsäkerhet
// (GPSR)"). Det bär Wix-id, status och parterna, aldrig artikelnummer.
//
// Torrt om inte `dryRun: false`. Auth som husets övriga: CRON_SECRET eller
// EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { tvattaGpsr } from "@/lib/vevor/gpsr";
import { wixGpsrLager } from "@/lib/vevor/gpsr-lager";
import {
  lasGpsr,
  lasStandard,
  MAX_PRODUKTER,
  raknaGpsr,
  rensaGpsr,
  rensaStandard,
  sattGpsr,
  sattStandard,
  type GpsrSattDeps,
} from "@/lib/vevor/gpsr-satt";
import { WixVevorLager } from "@/lib/vevor/lager";

export const runtime = "nodejs";
export const maxDuration = 120;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function deps(): GpsrSattDeps {
  const store = getStore();
  const avlasningar = new WixVevorLager();
  return {
    mappningar: (ids) => store.getMappingsByWixProductIds(ids),
    allaMappningar: () => store.listMappings(),
    sparaMappning: (rad) => store.saveMapping(rad),
    lager: wixGpsrLager,
    harManual: async (skus) => {
      const a = await avlasningar.avlasningar(skus);
      return new Map(skus.map((s) => [s, Boolean(a.get(s)?.manualSokvag)]));
    },
  };
}

function fel(status: number, meddelande: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: meddelande, ...extra }, { status });
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) return fel(401, "Otillåten");
  const id = req.nextUrl.searchParams.get("wixProductId")?.trim();
  try {
    if (id) {
      if (!UUID.test(id)) return fel(400, "wixProductId är inget Wix-id");
      const svar = await lasGpsr(id, deps());
      if ("fel" in svar && svar.fel) return fel(404, `${id}: ${svar.fel}`);
      return NextResponse.json({ ok: true, ...svar });
    }
    const d = deps();
    const [rakning, standard] = await Promise.all([raknaGpsr(d), lasStandard(d)]);
    console.log(
      `[vevor-gpsr] ${rakning.vevor} VEVOR-varor: `
        + Object.entries(rakning.perStatus).map(([s, n]) => `${s} ${n}`).join(", ")
        + `, egna rader ${rakning.egnaRader}, standardrad ${rakning.standard ?? "saknas"}`,
    );
    return NextResponse.json({ ok: true, ...rakning, standardRad: standard });
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 200);
    console.error(`[vevor-gpsr] läsfel: ${msg}`);
    return fel(500, msg);
  }
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) return fel(401, "Otillåten");
  let kropp: Record<string, unknown>;
  try {
    kropp = (await req.json()) as Record<string, unknown>;
  } catch {
    return fel(400, "Ogiltig JSON");
  }
  if (!kropp || typeof kropp !== "object" || Array.isArray(kropp)) return fel(400, "Kroppen måste vara ett objekt");

  const atgard = kropp.atgard;
  // ☠️ Torrt om inte uttryckligen false.
  const torrt = kropp.dryRun !== false;
  if (atgard === "standard" || atgard === "rensa_standard") {
    try {
      if (atgard === "rensa_standard") {
        await rensaStandard(deps(), torrt);
        console.log(`[vevor-gpsr] rensa_standard${torrt ? " (torrt)" : ""}`);
        return NextResponse.json({ ok: true, atgard, dryRun: torrt });
      }
      const g = tvattaGpsr({ tillverkare: kropp.tillverkare, euAnsvarig: kropp.euAnsvarig, kalla: kropp.kalla });
      if (!g.ok) return fel(400, "Ogiltiga uppgifter — ingenting skrivet", { fel: g.fel });
      const svar = await sattStandard(g.gpsr, deps(), torrt);
      console.log(`[vevor-gpsr] standard${torrt ? " (torrt)" : ""}: ${svar.status}${svar.fel ? `, fel: ${svar.fel}` : ""}`);
      return NextResponse.json({ ok: !svar.fel, atgard, dryRun: torrt, ...svar });
    } catch (err) {
      const msg = (err instanceof Error ? err.message : String(err)).slice(0, 200);
      console.error(`[vevor-gpsr] ${atgard} misslyckades: ${msg}`);
      return fel(500, msg);
    }
  }
  if (atgard !== "satt" && atgard !== "rensa") {
    return fel(400, "atgard måste vara satt, rensa, standard eller rensa_standard");
  }
  const ids = Array.isArray(kropp.wixProductIds) ? kropp.wixProductIds : [];
  if (ids.length === 0 || ids.length > MAX_PRODUKTER) return fel(400, `wixProductIds: 1–${MAX_PRODUKTER} Wix-id`);
  if (!ids.every((v): v is string => typeof v === "string" && UUID.test(v))) return fel(400, "wixProductIds: bara Wix-id");
  const unika = [...new Set(ids)];
  const torr = torrt;

  try {
    let rader;
    if (atgard === "satt") {
      const g = tvattaGpsr({ tillverkare: kropp.tillverkare, euAnsvarig: kropp.euAnsvarig, kalla: kropp.kalla });
      if (!g.ok) return fel(400, "Ogiltiga uppgifter — ingenting skrivet", { fel: g.fel });
      rader = await sattGpsr(unika, g.gpsr, deps(), torr);
    } else {
      rader = await rensaGpsr(unika, deps(), torr);
    }
    const felRader = rader.filter((r) => r.fel).length;
    console.log(`[vevor-gpsr] ${atgard}${torr ? " (torrt)" : ""}: ${rader.length - felRader} klara, ${felRader} fel`);
    return NextResponse.json({ ok: felRader === 0, atgard, dryRun: torr, rader });
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 200);
    console.error(`[vevor-gpsr] ${atgard} misslyckades: ${msg}`);
    return fel(500, msg);
  }
}
