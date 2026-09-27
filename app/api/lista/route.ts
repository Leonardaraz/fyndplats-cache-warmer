import { type NextRequest, NextResponse } from "next/server";
import { forListClient } from "../../../lib/list-payload";
import { listaFor } from "../../../lib/list-pages";
import { tolkaNyckel } from "../../../lib/list-key";
import { currentDayMs } from "../../../lib/sort-products";

// GET /api/lista?k=<alla | rea | kategori/<slug>>
//
// Hela produktlistan för en listsida — den del som INTE längre ligger i sidans
// HTML. Sidan bär de första korten och en sammanfattning för filterpanelen
// (lib/list-pages.ts, lib/list-overview.ts); ShopBrowser hämtar resten här när
// kunden rör filter, sortering eller "Visa fler", eller i förväg när
// webbläsaren är ledig.
//
// Samma urval som sidan, från samma funktion (listaFor), så korten står kvar
// när listan kommer.
//
// BILDER BARA FÖR DET SOM KAN SYNAS DIREKT (forListClient): de första korten
// och toppen av varje sortering. Resten tar ShopBrowser ur bildkartan
// (/api/kort-bilder), som delas av alla listsidor och hämtas en gång per
// besök. Med bild på allt vägde listan för hela sortimentet 465 kB
// komprimerad mot ~330 kB för den lista som låg i sidan förut — och listan
// förhämtas av nästan alla besökare, bildkartan bara av den som bläddrar.
//
// EN NYCKEL PER SIDA, inte per filterval: ett filter räknas i webbläsaren, så
// alla besökare på samma sida delar samma CDN-träff.
export const revalidate = 3600;

// CACHE-CONTROL EXPLICIT — `revalidate` ensam räcker inte för en route handler
// (uppmätt på /api/search-index 2026-08-28: MISS med age=0 sex gånger i rad).
// Samma huvud som /api/kort-bilder.
const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: NextRequest) {
  // Bara ?k= — varje annan parameter hade blivit en egen CDN-nyckel, alltså en
  // full uträkning per påhittad variant.
  const params = [...req.nextUrl.searchParams.keys()];
  const nyckel = params.length === 1 ? tolkaNyckel(req.nextUrl.searchParams.get("k")) : null;
  if (!nyckel) return NextResponse.json({ error: "okänd lista" }, { status: 400 });
  const dagMs = currentDayMs();
  const lista = await listaFor(nyckel, dagMs);
  if (!lista) {
    // En kategori som försvunnit sedan sidan byggdes. Kort cache, så den kan
    // komma tillbaka (kategorisidorna är självåterupplivande).
    return NextResponse.json({ error: "okänd lista" }, { status: 404, headers: { "Cache-Control": "public, s-maxage=300" } });
  }
  // En tom lista är nästan alltid ett tillfälligt läsfel mot Wix, inte en tom
  // kategori (sådana omdirigeras). Cacha den kort, så nästa hämtning försöker igen.
  const cache = lista.length ? CACHE : "public, s-maxage=60";
  return NextResponse.json(forListClient(lista, dagMs), { headers: { "Cache-Control": cache } });
}
