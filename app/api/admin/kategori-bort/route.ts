// POST /api/admin/kategori-bort — tar bort felaktiga kategorilänkar från produkter.
//
//   POST { lage, bekrafta, plan }
//     lage      torr | skriv | verifiera. Ett utelämnat eller okänt läge är 400,
//               aldrig ett implicit "skriv".
//     bekrafta  läget skriv: antalet länkar som torrkörningen sa att den tar bort
//     plan      { namn, rader: [{ kort, pid, bort[], behall[] }] }, med
//               kategorierna som sökvägar (tools/polish-assets/kategori-bort/)
//
// Anropas av workflowen "Kategori — ta bort felaktiga kategorilänkar", som läser
// planen ur grenen och kontrollerar dess sha256 innan den skickas hit. Reglerna
// bor i lib/polish/kategori-bort.ts: planen säger också vad som ska finnas kvar,
// alla villkor prövas före första skrivningen och skarpt läge kräver antalet.
//
// Rutten rör bara kategorilänkar (Categories-tjänstens remove-items). Ingen
// produkt-PATCH, så ingenting annat på produkten kan tappas.
//
// ☠️ SVARET GÅR TILL EN PUBLIK LOGG. Det bär kort-id, kategorinamn, utfall och antal.
//
// Auth följer huset: CRON_SECRET eller EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { BORT_LAGEN, type BortLage, korBort, valideraBortPlan } from "@/lib/polish/kategori-bort";
import { felText } from "@/lib/polish/skrivplan";
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

  let kropp: { lage?: unknown; bekrafta?: unknown; plan?: unknown };
  try {
    kropp = (await req.json()) as typeof kropp;
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }

  const lage = kropp.lage;
  if (typeof lage !== "string" || !(BORT_LAGEN as readonly string[]).includes(lage)) {
    return NextResponse.json({ ok: false, error: `lage måste vara ett av: ${BORT_LAGEN.join(", ")}` }, { status: 400 });
  }
  const bekrafta = typeof kropp.bekrafta === "number" && Number.isInteger(kropp.bekrafta) ? kropp.bekrafta : null;

  const v = valideraBortPlan(kropp.plan);
  if ("fel" in v) {
    return NextResponse.json({ ok: false, error: "Ogiltig plan — ingenting skrivet", fel: v.fel.slice(0, 50) }, { status: 400 });
  }

  try {
    const utfall = await korBort(v.plan, skapaWixAnrop(), lage as BortLage, bekrafta);
    console.log(`[kategori-bort] ${v.plan.namn} ${lage}: ${utfall.avbrutet ?? utfall.sammanfattning}`);
    return NextResponse.json({
      ok: utfall.ok,
      lage,
      plan: v.plan.namn,
      sammanfattning: utfall.sammanfattning,
      attTaBort: utfall.attTaBort,
      ...(utfall.avbrutet ? { avbrutet: utfall.avbrutet } : {}),
      rader: utfall.rader,
    });
  } catch (err) {
    // ☠️ Tvättat innan det lämnar rutten — ett Wix-fel kan citera data vi aldrig skickade.
    const msg = felText(err);
    console.error(`[kategori-bort] ${v.plan.namn} ${lage} misslyckades: ${msg}`);
    return NextResponse.json({ ok: false, lage, error: msg }, { status: 500 });
  }
}
