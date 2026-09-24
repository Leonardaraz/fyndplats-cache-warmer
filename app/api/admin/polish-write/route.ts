// POST /api/admin/polish-write — skriver en poleringsrunda till butikens Wix.
//
//   POST { steg, dryRun, plan }
//     steg    text | media | kategorier | sku | verifiera
//     dryRun  bara `false` skriver; allt annat är en torrkörning
//     plan    rundans skrivplan.json (tools/polish-gates/bygg-skrivplan.py)
//
// Anropas av workflowen "Polering — skriv en runda till Wix", som läser planen
// ur grenen och kontrollerar dess sha256 innan den skickas hit. Stegen och
// deras regler bor i lib/polish/skrivplan.ts.
//
// ☠️ SVARET GÅR TILL EN PUBLIK LOGG. Det bär kort-id, utfall och antal —
// aldrig artikelnummer eller kostnader, och planen innehåller inga sådana fält.
//
// Auth följer huset: CRON_SECRET (så en GitHub-workflow kan möta rutten utan
// att hemligheten passerar chatten) eller EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { felText, korSteg, STEG, type Steg, valideraPlan } from "@/lib/polish/skrivplan";
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
  if (typeof steg !== "string" || !(STEG as readonly string[]).includes(steg)) {
    return NextResponse.json({ ok: false, error: `steg måste vara ett av: ${STEG.join(", ")}` }, { status: 400 });
  }
  // ☠️ Torrt om inte uttryckligen false. Ett utelämnat fält får aldrig betyda
  // "skriv" — samma riktning som husets övriga skrivande rutter.
  const torr = kropp.dryRun !== false;

  const v = valideraPlan(kropp.plan);
  if ("fel" in v) {
    return NextResponse.json({ ok: false, error: "Ogiltig plan — ingenting skrivet", fel: v.fel.slice(0, 50) }, { status: 400 });
  }

  try {
    const utfall = await korSteg(steg as Steg, v.plan, skapaWixAnrop(), torr);
    console.log(
      `[polish-write] ${v.plan.runda} ${steg}${torr ? " (torrt)" : ""}: ${utfall.avbrutet ?? utfall.sammanfattning}`,
    );
    return NextResponse.json({
      ok: utfall.ok,
      steg,
      dryRun: torr,
      runda: v.plan.runda,
      sammanfattning: utfall.sammanfattning,
      ...(utfall.avbrutet ? { avbrutet: utfall.avbrutet } : {}),
      rader: utfall.rader,
    });
  } catch (err) {
    // ☠️ Tvättat innan det lämnar rutten — ett Wix-fel kan citera data vi aldrig skickade.
    const msg = felText(err);
    console.error(`[polish-write] ${v.plan.runda} ${steg} misslyckades: ${msg}`);
    return NextResponse.json({ ok: false, steg, error: msg }, { status: 500 });
  }
}
