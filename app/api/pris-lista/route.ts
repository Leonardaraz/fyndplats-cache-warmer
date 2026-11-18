import { type NextRequest, NextResponse } from "next/server";
import { forListClient } from "../../../lib/list-payload";
import { PRIS_PA_SIDAN, PRIS_SIDA, resolvePriceList } from "../../../lib/seo/programmatic";
import { attachRatings } from "../../../lib/review-aggregates";
import { currentDayMs } from "../../../lib/sort-products";

// GET /api/pris-lista?k=<pris>-<sida>   (k=500-1 är korten 25 till 72 under 500 kr)
//
// Nästa kort på översikterna /under-{200,500,1000}-kr, för knappen "Visa fler"
// (components/pris-fler.tsx, Leonard 2026-11-18). Sidan bär de första korten;
// resten hämtas härifrån, 48 i taget, i samma ordning som sidan
// (resolvePriceList i lib/seo/programmatic.ts).
//
// EN parameter, som /api/lista: varje annan parameter hade blivit en egen
// CDN-nyckel. Sidnumret har ett tak ur listans längd, så påhittade nummer ger
// 404 i stället för en uträkning.
export const revalidate = 3600;

const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: NextRequest) {
  const params = [...req.nextUrl.searchParams.keys()];
  const m = params.length === 1 ? /^(\d{2,5})-(\d{1,3})$/.exec(req.nextUrl.searchParams.get("k") ?? "") : null;
  if (!m) return NextResponse.json({ error: "okänd lista" }, { status: 400 });
  const pris = Number(m[1]);
  const sida = Number(m[2]);
  const lista = await resolvePriceList(pris);
  if (!lista) return NextResponse.json({ error: "okänd lista" }, { status: 404, headers: { "Cache-Control": "public, s-maxage=300" } });
  const fran = PRIS_PA_SIDAN + (sida - 1) * PRIS_SIDA;
  if (sida < 1 || fran >= lista.length) return NextResponse.json({ error: "okänd sida" }, { status: 404, headers: { "Cache-Control": "public, s-maxage=300" } });
  const kort = forListClient(await attachRatings(lista.slice(fran, fran + PRIS_SIDA)), currentDayMs());
  return NextResponse.json({ kort, kvar: Math.max(0, lista.length - fran - kort.length) }, { headers: { "Cache-Control": CACHE } });
}
