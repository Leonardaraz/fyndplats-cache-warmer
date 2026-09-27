// POST /api/admin/aosom-sammanslagning
//
// Lägger ett Aosom-utkasts artikel som ett FÄRGVAL på en publicerad sida, och
// pensionerar utkastet. Hela förloppet, hindren och varför ordningen är som den
// är står i lib/aosom/sammanslagning.ts.
//
// Kropp:
//   { behall, utkast, fargBehall, fargUtkast, sku?, bilder?, apply? }
//
// ☠️ TORRKÖRNING ÄR DEFAULT. Utan `apply: true` skrivs ingenting — svaret är
// planen: priser, saldon, bildantal och hinder.
//
// ☠️ EN SIDA PER ANROP, OCH INGEN KÖR-ALLT-FLAGGA. Paret (sida, utkast) är en
// människas bedömning av att två sidor är samma vara i olika färger, och
// bilderna som följer med är en människas granskning. Samma hållning som
// ommappningen och prisreparationen.
//
// ☠️ SVARET BÄR ALDRIG ETT ARTIKELNUMMER ELLER EN KOSTNAD — det går till en
// publik Actions-logg. Auth följer huset: CRON_SECRET eller EXTENSION_API_TOKEN.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import { korSammanslagning, type SammanslagningInput } from "@/lib/aosom/sammanslagning";
import { skapaWixAnrop } from "@/lib/polish/skrivplan-wix";
import { felText } from "@/lib/polish/skrivplan";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  let body: Partial<SammanslagningInput> & { apply?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }
  const behall = body.behall?.trim();
  const utkast = body.utkast?.trim();
  const fargBehall = body.fargBehall?.trim();
  const fargUtkast = body.fargUtkast?.trim();
  if (!behall || !utkast || !fargBehall || !fargUtkast) {
    return NextResponse.json(
      { ok: false, error: "behall, utkast, fargBehall och fargUtkast krävs" },
      { status: 400 },
    );
  }
  const bilder = Array.isArray(body.bilder) ? body.bilder.map(Number) : undefined;
  const apply = body.apply === true;

  try {
    const store = getStore();
    const svar = await korSammanslagning(
      { behall, utkast, fargBehall, fargUtkast, sku: body.sku?.trim() || undefined, bilder },
      {
        wix: skapaWixAnrop(),
        getMapping: (id) => store.getMappingByWixProductId(id),
        listMappings: () => store.listMappings(),
        saveMapping: (m) => store.saveMapping(m),
        fetchFeed: () => fetchAosomFeed(),
      },
      { apply },
    );

    if (apply && svar.ok && svar.plan.tillstand !== "klar") {
      await store.appendAudit({
        at: new Date().toISOString(),
        kind: "aosom-sammanslagning",
        ref: behall,
        detail: `utkast ${utkast} blev färgen ${svar.plan.fargUtkast} (${svar.plan.prisUtkast} kr) `
          + `bredvid ${svar.plan.fargBehall} (${svar.plan.prisBehall} kr) — ${svar.steg.join(" · ")}`,
      });
    }

    const status = svar.ok ? 200 : svar.plan.hinder.length > 0 ? 422 : 500;
    return NextResponse.json(svar, { status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: felText(e) }, { status: 500 });
  }
}
