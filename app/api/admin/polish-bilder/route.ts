// POST /api/admin/polish-bilder — skriv BARA bildlistan på redan polerade sidor.
//
//   { "steg": "media" | "verifiera", "dryRun": false, "plan": { runda, produkter } }
//
// Tvilling till /api/admin/polish-write men för en plan utan text: en sida som
// bara ska få fler bilder ska inte behöva skicka sin publicerade text igen.
// Logiken bor i lib/polish/bildplan.ts, och mediesteget är skrivplanens eget.
//
// Anropas av .github/workflows/polish-bilder.yml, som läser planen ur grenen
// och kontrollerar dess sha256.
//
// ☠️ Svaret går till en PUBLIK Actions-logg. Planen bär inga artikelnummer
// (valideraBildplan vägrar formen) och felmeddelandena tvättas (felText).

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { felText } from "@/lib/polish/skrivplan";
import { BILDSTEG, korBildsteg, valideraBildplan, type Bildsteg } from "@/lib/polish/bildplan";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";

export const runtime = "nodejs";
export const maxDuration = 300;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  let kropp: { steg?: unknown; dryRun?: unknown; plan?: unknown };
  try {
    kropp = (await req.json()) as typeof kropp;
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }

  const steg = kropp.steg;
  if (typeof steg !== "string" || !(BILDSTEG as readonly string[]).includes(steg)) {
    return NextResponse.json({ ok: false, error: `steg måste vara ett av: ${BILDSTEG.join(", ")}` }, { status: 400 });
  }
  // ☠️ Torrt om inte uttryckligen false, samma riktning som polish-write.
  const torr = kropp.dryRun !== false;

  const v = valideraBildplan(kropp.plan);
  if ("fel" in v) {
    return NextResponse.json({ ok: false, error: "Ogiltig plan — ingenting skrivet", fel: v.fel.slice(0, 50) }, { status: 400 });
  }

  try {
    const utfall = await korBildsteg(steg as Bildsteg, v.plan, skapaWixAnrop(), torr);
    console.log(
      `[polish-bilder] ${v.plan.runda} ${steg}${torr ? " (torrt)" : ""}: ${utfall.avbrutet ?? utfall.sammanfattning}`,
    );
    return NextResponse.json({
      ok: utfall.ok,
      steg,
      dryRun: torr,
      runda: v.plan.runda,
      sammanfattning: utfall.sammanfattning,
      rader: utfall.rader,
    });
  } catch (err) {
    const msg = felText(err);
    console.error(`[polish-bilder] ${v.plan.runda} ${steg} misslyckades: ${msg}`);
    return NextResponse.json({ ok: false, steg, error: msg }, { status: 500 });
  }
}
