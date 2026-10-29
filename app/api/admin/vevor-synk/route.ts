// GET  /api/admin/vevor-synk            synkens läge och senaste körningen
// POST /api/admin/vevor-synk {atgard}   "pa" eller "av"
//
// VEVOR-synkens strömbrytare (lib/vevor/synk.ts). Anropas av workflowen
// "VEVOR — synken" med CRON_SECRET.
//
//   pa   schemat synkar lager och pris på VEVOR-raderna en gång i timmen
//   av   schemat slutar synka; lager och priser står kvar som de är
//
// ☠️ SVARET BÄR BARA ANTAL, TIDER OCH LÄGEN. Markören är ett artikelnummer och
// skrivs bara som "satt", och rabatten bara som "satt", "saknas" eller
// "ogiltig". Svaret skrivs ut i en publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getSyncMarkorLager } from "@/lib/aosom/sync-markor";
import { getAppConfig } from "@/lib/store/app-config";
import { WixVevorLager } from "@/lib/vevor/lager";
import { rabattlage } from "@/lib/vevor/pris";
import { WixVevorSynkLager, type Synktillstand } from "@/lib/vevor/synk";

export const runtime = "nodejs";
export const maxDuration = 60;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function publikt(t: Synktillstand) {
  return { aktiv: t.aktiv, senasteKorning: t.senasteKorning };
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  try {
    const [t, markor, konfig, lasaren] = await Promise.all([
      new WixVevorSynkLager().lasTillstand(),
      getSyncMarkorLager().las("vevor"),
      getAppConfig(),
      new WixVevorLager().lasTillstand(),
    ]);
    return NextResponse.json({
      ok: true,
      ...publikt(t),
      markor: markor ? "satt" : null,
      rabatt: rabattlage(konfig.vevorProRabatt),
      lasarenFryst: !!lasaren.fryst,
      lasarenAktiv: lasaren.aktiv,
    });
  } catch (err) {
    console.error("[vevor-synk] läget gick inte att läsa:", err instanceof Error ? err.message : String(err));
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
    const lager = new WixVevorSynkLager();
    if (atgard === "pa") {
      // Utan rabatt skriver synken inga priser, och varje körning hade sagt
      // det i loggen. Säg det nu i stället.
      const rabatt = rabattlage((await getAppConfig()).vevorProRabatt);
      if (rabatt !== "satt") {
        const fel = rabatt === "saknas" ? "saknas i konfigurationen" : "i konfigurationen går inte att läsa";
        return NextResponse.json({ ok: false, error: `VEVOR PRO-rabatten ${fel}` }, { status: 409 });
      }
    }
    await lager.uppdateraTillstand({ aktiv: atgard === "pa" });
    // Läs tillbaka: ett svar utan fel är inget kvitto.
    const efter = await lager.lasTillstand();
    if (efter.aktiv !== (atgard === "pa")) {
      return NextResponse.json({ ok: false, error: "ändringen syns inte vid återläsningen" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, atgard, ...publikt(efter) });
  } catch (err) {
    console.error("[vevor-synk] ändringen föll:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "ändringen föll, se Vercels logg" }, { status: 502 });
  }
}
