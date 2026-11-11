// GET /api/konto/lage — ska menyn visa "Mitt konto"? (lib/medlem/kontolank.ts)
// Och ska sidfoten visa "Företagskonto"? (lib/medlem/foretagsstart.ts)
//
// Sidhuvudet är detsamma för alla besökare och cachas, så länken frågar här
// efter laddningen. Svaret är publikt och lika för alla, och Vercels kant
// håller det i fem minuter: växeln till `pa` syns i menyn inom fem minuter,
// utan ett bygge. Ingen session läses.

import { NextResponse } from "next/server";
import { medlemsHemlighet, medlemsLage, prisLage } from "@/lib/medlem/lager";
import { KONTOLANK_CACHE_S, visaKontolank } from "@/lib/medlem/kontolank";
import { visaForetagsvag } from "@/lib/medlem/foretagsstart";

export const dynamic = "force-dynamic";

export async function GET() {
  const pa = visaKontolank(await medlemsLage(), Boolean(medlemsHemlighet()));
  // Länken till /konto/foretag: bara när kontot syns i menyn och företagskontot är öppet för alla.
  const foretag = pa && visaForetagsvag(true, (await prisLage()) === "pa");
  return NextResponse.json(
    { pa, foretag },
    { headers: { "Cache-Control": `public, s-maxage=${KONTOLANK_CACHE_S}, stale-while-revalidate=${KONTOLANK_CACHE_S}` } },
  );
}
