// GET /api/konto/lage — ska menyn visa "Mitt konto"? (lib/medlem/kontolank.ts)
//
// Sidhuvudet är detsamma för alla besökare och cachas, så länken frågar här
// efter laddningen. Svaret är publikt och lika för alla, och Vercels kant
// håller det i fem minuter: växeln till `pa` syns i menyn inom fem minuter,
// utan ett bygge. Ingen session läses.

import { NextResponse } from "next/server";
import { medlemsHemlighet, medlemsLage } from "@/lib/medlem/lager";
import { KONTOLANK_CACHE_S, visaKontolank } from "@/lib/medlem/kontolank";

export const dynamic = "force-dynamic";

export async function GET() {
  const pa = visaKontolank(await medlemsLage(), Boolean(medlemsHemlighet()));
  return NextResponse.json(
    { pa },
    { headers: { "Cache-Control": `public, s-maxage=${KONTOLANK_CACHE_S}, stale-while-revalidate=${KONTOLANK_CACHE_S}` } },
  );
}
