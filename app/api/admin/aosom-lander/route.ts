// GET /api/admin/aosom-lander — frakten per land ur Aosoms feed.
//
// Underlaget för vilka länder vi kan sälja Aosom-varorna i (2026-10-21): per
// land hur många varor som går att skicka dit, och vad frakten och den landade
// kostnaden blir jämfört med Sverige. Svaret bär bara antal, andelar och
// kvoter. Logiken och skälen står i lib/aosom/frakt-per-land.ts.
//
// Anropas av workflowen "Aosom — frakt och skeppbarhet per land" med
// CRON_SECRET. Rutten läser bara, och skriver ingenting.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import { felSvar, loggtext, matFraktPerLand } from "@/lib/aosom/frakt-per-land";
import { getStore } from "@/lib/store/factory";
import { listVisibleV3ProductIds } from "@/lib/wix/v3-products";

export const runtime = "nodejs";
export const maxDuration = 300;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  try {
    const svar = await matFraktPerLand({
      hamtaFlodet: () => fetchAosomFeed(undefined, fetch, { fraktPerLand: true }),
      listaMappningar: () => getStore().listMappings(),
      listaSynliga: () => listVisibleV3ProductIds(),
    });
    const p = svar.tackning.publicerade;
    console.log(
      `[aosom-lander] ${svar.flodetRader} rader, ${svar.landskolumner} länder. `
        + `Publicerade artiklar: ${p.mappade}, varav ${p.iFlodet} i feeden.`,
    );
    return NextResponse.json({ ok: true, ...svar });
  } catch (err) {
    console.error(`[aosom-lander] föll: ${loggtext(err)}`);
    const { status, error } = felSvar(err);
    return NextResponse.json({ ok: false, error }, { status });
  }
}
