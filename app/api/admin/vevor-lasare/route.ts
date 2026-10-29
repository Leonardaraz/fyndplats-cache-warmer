// GET  /api/admin/vevor-lasare            läsarens läge och antalen i Wix
// POST /api/admin/vevor-lasare {atgard}    "pa", "av" eller "tina"
//
// Läsarens strömbrytare och frysningens upplåsning (lib/vevor/lasare.ts).
// Anropas av workflowen "VEVOR — läsaren" med CRON_SECRET.
//
//   pa    schemat börjar läsa (var femte minut)
//   av    schemat slutar läsa; avläsningarna står kvar
//   tina  läsaren får läsa igen efter en spärr. Gör det bara när du vet
//         varför VEVOR spärrade, och att det inte händer igen.
//
// ☠️ SVARET BÄR BARA ANTAL OCH TIDER. Kontrollsidornas webb-id står i
// tillståndet men aldrig i svaret: svaret skrivs ut i en publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { WixVevorLager, type Lasartillstand } from "@/lib/vevor/lager";

export const runtime = "nodejs";
export const maxDuration = 60;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function publikt(t: Lasartillstand) {
  return {
    aktiv: t.aktiv,
    fryst: t.fryst,
    kontroller: t.kontroller.length,
    kartaAt: t.kartaAt,
    prioriteradAt: t.prioriteradAt,
    robotsAt: t.robots?.at ?? null,
    robotsRegler: t.robots?.regler.length ?? null,
    stoppIFoljd: t.stoppIFoljd,
    senasteKorning: t.senasteKorning,
  };
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  try {
    const lager = new WixVevorLager();
    const [t, antal] = await Promise.all([lager.lasTillstand(), lager.rakna(new Date().toISOString())]);
    return NextResponse.json({ ok: true, ...publikt(t), antal });
  } catch (err) {
    console.error("[vevor-lasare] läget gick inte att läsa:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "läget gick inte att läsa, se Vercels logg" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  const kropp = (await req.json().catch(() => null)) as { atgard?: unknown } | null;
  const atgard = kropp?.atgard;
  if (atgard !== "pa" && atgard !== "av" && atgard !== "tina") {
    return NextResponse.json({ ok: false, error: 'atgard ska vara "pa", "av" eller "tina"' }, { status: 400 });
  }
  try {
    const lager = new WixVevorLager();
    // Bara det fält åtgärden gäller. En körning som pågår skriver sina egna
    // fält och kan inte ångra det här (lib/vevor/lager.ts, uppdateraTillstand).
    if (atgard === "pa") await lager.uppdateraTillstand({ aktiv: true });
    if (atgard === "av") await lager.uppdateraTillstand({ aktiv: false });
    if (atgard === "tina") {
      const t = await lager.lasTillstand();
      if (t.fryst) console.log(`[vevor-lasare] tinad, var fryst sedan ${t.fryst.at} (${t.fryst.skal})`);
      await lager.uppdateraTillstand({ fryst: null });
    }
    // Läs tillbaka: ett svar utan fel är inget kvitto.
    const efter = await lager.lasTillstand();
    const stammer =
      (atgard === "pa" && efter.aktiv) || (atgard === "av" && !efter.aktiv) || (atgard === "tina" && !efter.fryst);
    if (!stammer) return NextResponse.json({ ok: false, error: "ändringen syns inte vid återläsningen" }, { status: 500 });
    return NextResponse.json({ ok: true, atgard, ...publikt(efter) });
  } catch (err) {
    console.error("[vevor-lasare] ändringen föll:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: "ändringen föll, se Vercels logg" }, { status: 502 });
  }
}
