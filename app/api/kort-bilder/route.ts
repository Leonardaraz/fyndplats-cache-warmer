import { NextResponse } from "next/server";
import { getProducts, forListings } from "../../../lib/products";
import { wixMediaKey } from "../../../lib/wix-media-key";

// Bildnycklarna för listsidornas produktkort — den halva av nyttolasten som
// INTE behövde ligga i sidans HTML.
//
// Bakgrund: listsidorna skickar hela katalogen till webbläsaren (filtren och
// sorteringen räknas där), men ritar 24 kort. Mätt 2026-09-04 var 313 kB av
// /alla-produkters HTML bild-URL:er för kort som aldrig ritades.
// lib/list-payload.ts behåller bilderna för de produkter som kan stå i vyn
// direkt; resten hämtas här när de närmar sig.
//
// EN KARTA, INTE EN FRÅGA PER URVAL. Alternativet var ?slugs=a,b,c — färre byte
// per svar, men en ny CDN-nyckel för varje filter- och sorteringskombination,
// alltså nästan bara missar. Hela kartan är en enda nyckel som träffar för alla
// besökare på alla listsidor, och webbläsaren återanvänder den mellan
// /alla-produkter, /kategori och /sok under besöket. Den hämtas dessutom aldrig
// alls av den som bara tittar på de första korten och klickar sig vidare.
export const revalidate = 3600;

// CACHE-CONTROL EXPLICIT — `revalidate` ensam räcker INTE för en route handler.
// Uppmätt i produktion 2026-08-28 på /api/search-index: utan huvudet svarade
// Vercel x-vercel-cache: MISS med age=0 sex hämtningar i rad. Samma huvud som
// den rutten använder, och av samma skäl: en människa väntar på resultatet.
const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

/** slug → [huvudbild, hover-bild] som media-nycklar. null = ingen hover-bild. */
export type KortBilder = Record<string, [string, string | null]>;

export async function GET() {
  const alla = await getProducts();
  // forListings, inte hela katalogen: exakt de produkter listsidorna kan visa,
  // så kartan aldrig bär rader ingen kan se.
  const produkter = forListings(alla);
  const ut: KortBilder = {};
  for (const p of produkter) {
    if (!p.img) continue;
    const huvud = wixMediaKey(p.img) ?? p.img;
    const hover = p.gallery?.find((g) => g !== p.img);
    ut[p.slug] = [huvud, hover ? (wixMediaKey(hover) ?? hover) : null];
  }
  return NextResponse.json(ut, { headers: { "Cache-Control": CACHE } });
}
