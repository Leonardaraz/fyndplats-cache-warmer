// Vercel Cron: GET /api/cron/medlemskorgar, varje timme kl :41 (vercel.json),
// utanför Aosoms synkfönster (:12–:29).
//
// Låsta medlemskorgar äldre än ett dygn tas bort, så att kassans länk slutar
// fungera och nästa köp räknas om med dagens nivå och priser (specen: "äldre
// än 24 timmar räknas om"). En korg som blev ett köp lämnas. Utfallet står på
// prisbeslutet (lib/medlem/korgstadning.ts).
//
// Svaret bär bara antal. Auth: "Authorization: Bearer $CRON_SECRET", samma
// mönster som övriga cron-rutter.

import { NextResponse } from "next/server";
import { stadaMedlemskorgar } from "@/lib/medlem/medlemspris";

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
    // En tom tugga är tyst (docs/claude/03-tom-cron-tugga-tyst.md i motorn).
    if (utfall.provade > 0) console.log("[medlemskorgar]", JSON.stringify({ ...utfall, ms: Date.now() - start }));
    return NextResponse.json({ ok: utfall.fel === 0, ...utfall, ms: Date.now() - start }, { status: utfall.fel === 0 ? 200 : 500 });
  } catch (e) {
    const fel = e instanceof Error ? e.message.slice(0, 160) : String(e);
    console.error("[medlemskorgar] fel:", fel);
    return NextResponse.json({ ok: false, fel }, { status: 500 });
  }
}
