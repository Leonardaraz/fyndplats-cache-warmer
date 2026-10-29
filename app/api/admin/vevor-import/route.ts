// GET  /api/admin/vevor-import            importens läge och antalen
// POST /api/admin/vevor-import {atgard}    "pa" eller "av"
//
// Importens strömbrytare (lib/vevor/import.ts). Anropas av workflowen
// "VEVOR — importen" med CRON_SECRET.
//
//   pa   schemat börjar importera (var femte minut), tills allt är inne,
//        och tar sedan nya artiklar när läsaren hittar dem
//   av   schemat slutar importera; utkasten står kvar
//
// ☠️ SVARET BÄR BARA ANTAL, TIDER OCH WIX-ID. Markören är ett artikelnummer och
// skrivs bara som "satt", och rabatten bara som "satt", "saknas" eller
// "ogiltig". Svaret skrivs ut i en publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getAppConfig } from "@/lib/store/app-config";
import { countProducts, headlessSiteId } from "@/lib/wix/media-audit";
import { WixVevorImportLager, type Importtillstand } from "@/lib/vevor/import-lager";
import { TAK_MARGINAL, WIX_MAX_PRODUKTER } from "@/lib/vevor/import";
import { tolkaRabatt } from "@/lib/vevor/pris";

export const runtime = "nodejs";
export const maxDuration = 60;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function publikt(t: Importtillstand) {
  return {
    aktiv: t.aktiv,
    markor: t.markor ? "satt" : null,
    varvImporterade: t.varvImporterade,
    vilaTill: t.vilaTill,
    foraldralosa: t.foraldralosa.map((f) => f.wixProductId),
    stoppIFoljd: t.stoppIFoljd,
    larmAt: t.larmAt,
    senasteKorning: t.senasteKorning,
  };
}

/** Rabatten utan värdet: satt, saknas eller ogiltig. */
async function rabattlage(): Promise<"satt" | "saknas" | "ogiltig"> {
  const text = (await getAppConfig()).vevorProRabatt;
  if (!text) return "saknas";
  try {
    tolkaRabatt(text);
    return "satt";
  } catch {
    return "ogiltig";
  }
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  try {
    const lager = new WixVevorImportLager();
    const [t, iLager, produkterIWix, rabatt, fryst] = await Promise.all([
      lager.lasImport(),
      lager.raknaILager(),
      countProducts(headlessSiteId()),
      rabattlage(),
      lager.lasarensFrysning(),
    ]);
    return NextResponse.json({
      ok: true,
      ...publikt(t),
      rabatt,
      lasarenFryst: !!fryst,
      antal: {
        avlasningarILager: iLager,
        produkterIWix,
        tak: WIX_MAX_PRODUKTER,
        // Platser kvar under taket med marginalen. Räcker de inte till alla
        // avläsningar i lager stannar importen vid taket.
        platserKvar: WIX_MAX_PRODUKTER - TAK_MARGINAL - produkterIWix,
      },
    });
  } catch (err) {
    console.error("[vevor-import] läget gick inte att läsa:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "läget gick inte att läsa, se Vercels logg" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  const kropp = (await req.json().catch(() => null)) as { atgard?: unknown } | null;
  const atgard = kropp?.atgard;
  if (atgard !== "pa" && atgard !== "av") {
    return NextResponse.json({ ok: false, error: 'atgard ska vara "pa" eller "av"' }, { status: 400 });
  }
  try {
    const lager = new WixVevorImportLager();
    if (atgard === "pa") {
      // Utan rabatt i konfigurationen hade varje körning stoppats. Säg det nu.
      const rabatt = await rabattlage();
      if (rabatt !== "satt") {
        const fel = rabatt === "saknas" ? "saknas i konfigurationen" : "i konfigurationen går inte att läsa";
        return NextResponse.json({ ok: false, error: `VEVOR PRO-rabatten ${fel}` }, { status: 409 });
      }
    }
    await lager.uppdateraImport({ aktiv: atgard === "pa" });
    // Läs tillbaka: ett svar utan fel är inget kvitto.
    const efter = await lager.lasImport();
    if (efter.aktiv !== (atgard === "pa")) {
      return NextResponse.json({ ok: false, error: "ändringen syns inte vid återläsningen" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, atgard, ...publikt(efter) });
  } catch (err) {
    console.error("[vevor-import] ändringen föll:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "ändringen föll, se Vercels logg" }, { status: 502 });
  }
}
