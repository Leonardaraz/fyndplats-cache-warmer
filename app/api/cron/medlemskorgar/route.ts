// Vercel Cron: GET /api/cron/medlemskorgar, varje timme kl :41 (vercel.json),
// utanför Aosoms synkfönster (:12–:29).
//
// Låsta medlemskorgar äldre än ett dygn tas bort, så att kassans länk slutar
// fungera och nästa köp räknas om med dagens nivå och priser (specen: "äldre
// än 24 timmar räknas om"). En korg som blev ett köp lämnas. Utfallet står på
// prisbeslutet (lib/medlem/korgstadning.ts).
//
// E3: samma körning mejlar kunder vars företag har godkänts i motorns admin
// sedan förra timmen (lib/medlem/foretagsmejl.ts).
//
// Svaret bär bara antal. Auth: "Authorization: Bearer $CRON_SECRET", samma
// mönster som övriga cron-rutter.

import { NextResponse } from "next/server";
import { stadaMedlemskorgar } from "@/lib/medlem/medlemspris";
import { mejlaGodkandaForetag } from "@/lib/medlem/foretagsmejl";
import { avmarkeraGodkandMejlad, foretagAttMejla, hamtaMedlem, markeraGodkandMejlad } from "@/lib/medlem/lager";
import { skickaForetagGodkant } from "@/lib/medlem/mejl";

function mejlaForetag() {
  return mejlaGodkandaForetag({
    attMejla: async (limit) => (await foretagAttMejla(limit)).map((p) => ({ medlemsId: p.medlemsId, namn: p.namn })),
    marka: markeraGodkandMejlad,
    avmarka: avmarkeraGodkandMejlad,
    epost: async (id) => {
      const m = await hamtaMedlem(id);
      return m && m.status === "aktiv" ? m.epost : null;
    },
    skicka: skickaForetagGodkant,
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function behorig(req: Request): boolean {
  const vantad = process.env.CRON_SECRET;
  if (!vantad) return true;
  return req.headers.get("authorization") === `Bearer ${vantad}`;
}

export async function GET(req: Request) {
  if (!behorig(req)) return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  const start = Date.now();
  try {
    const utfall = await stadaMedlemskorgar(start);
    const foretag = await mejlaForetag().catch(() => ({ provade: 0, skickade: 0, fel: 1 }));
    const fel = utfall.fel + foretag.fel;
    // En tom tugga är tyst (docs/claude/03-tom-cron-tugga-tyst.md i motorn).
    if (utfall.provade > 0 || foretag.provade > 0 || fel > 0) {
      console.log("[medlemskorgar]", JSON.stringify({ ...utfall, foretag, ms: Date.now() - start }));
    }
    return NextResponse.json({ ok: fel === 0, ...utfall, foretag, ms: Date.now() - start }, { status: fel === 0 ? 200 : 500 });
  } catch (e) {
    const fel = e instanceof Error ? e.message.slice(0, 160) : String(e);
    console.error("[medlemskorgar] fel:", fel);
    return NextResponse.json({ ok: false, fel }, { status: 500 });
  }
}
