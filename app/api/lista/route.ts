import { type NextRequest, NextResponse } from "next/server";
import { forClient } from "../../../lib/products";
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
// när listan kommer. Alla produkter bär sin bild: listan hämtas för att visas,
// och en andra hämtning från /api/kort-bilder hade bara lagt till väntan.
//
// EN NYCKEL PER SIDA, inte per filterval: ett filter räknas i webbläsaren, så
// alla besökare på samma sida delar samma CDN-träff.
export const revalidate = 3600;

// CACHE-CONTROL EXPLICIT — `revalidate` ensam räcker inte för en route handler
// (uppmätt på /api/search-index 2026-08-28: MISS med age=0 sex gånger i rad).
// Samma huvud som /api/kort-bilder.
const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: NextRequest) {
  const nyckel = tolkaNyckel(req.nextUrl.searchParams.get("k"));
  if (!nyckel) return NextResponse.json({ error: "okänd lista" }, { status: 400 });
  const lista = await listaFor(nyckel, currentDayMs());
  if (!lista) {
    // En kategori som försvunnit sedan sidan byggdes. Kort cache, så den kan
    // komma tillbaka (kategorisidorna är självåterupplivande).
    return NextResponse.json({ error: "okänd lista" }, { status: 404, headers: { "Cache-Control": "public, s-maxage=300" } });
  }
  return NextResponse.json(forClient(lista), { headers: { "Cache-Control": CACHE } });
}
