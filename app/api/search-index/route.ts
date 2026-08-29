import { NextResponse } from "next/server";
import { getProducts } from "../../../lib/products";
import { formatPrice } from "../../../lib/price-range";

// Lightweight product index for the search autocomplete: name / slug / image / price.
// Cached and revalidated hourly so the dropdown filters instantly client-side after a
// single fetch (no per-keystroke network round-trips).
export const revalidate = 3600;

// `o: 1` = slutsåld. Sätts BARA på slutsålda (39 av ~455) så payloaden knappt
// växer. Autocomplete använder den till två saker: hålla slutsålt utanför
// "Populära produkter" (tomt sökfält = bläddring) och lägga slutsålda träffar
// sist med en diskret etikett (ifylld sökning = avsikt). Se components/searchbox.
// CDN-CACHE, EXPLICIT. Utan Cache-Control-huvudet svarade rutten
// `public, max-age=0, must-revalidate` och Vercel cachade den ALDRIG: uppmätt i
// produktion 2026-08-28, sex hämtningar i rad gav x-vercel-cache: MISS med
// age=0 varje gång, TTFB 0,29–0,92 s. Samtidigt svarade en vanlig produktsida
// HIT och /api/feed/image-sitemap.xml — som sätter huvudet själv — låg på
// age=7433. Skillnaden var alltså inte ISR, utan att den här rutten saknade
// huvudet. `revalidate = 3600` ensam räcker inte för en route handler.
//
// Det spelar roll för känslan i sökrutan: indexet hämtas när fältet får fokus,
// så den där sekunden är precis vad besökaren väntar på innan förslagen syns.
//
// max-age (webbläsaren) är kortare än s-maxage (CDN) med flit. Feed-rutterna
// kör 3600 på båda, men de läses av maskiner. Här ser en människa resultatet:
// 5 min räcker för att slippa nya hämtningar under samma besök, medan CDN:t
// bär timmen — så en produkt som tar slut syns som slutsåld i dropdownen inom
// minuter i stället för inom en timme.
const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  const products = await getProducts();
  const index = products.map((p) => ({
    n: p.name,
    s: p.slug,
    i: p.img,
    // Samma prisformat som resten av butiken. Rutten skickade förr Wix rå-sträng
    // ("1 759,00kr"), så sökförslagen var den enda ytan kvar med det gamla
    // formatet — synligt i dropdownen medan produktkort, produktsida,
    // listsidor och startsidan alla säger "1 759 kr" via formatPrice.
    //
    // "FRÅN" MÅSTE MED. Ett första försök skrev bara formatPrice(priceNum) och
    // tappade spann-prefixet. Uppmätt över 186 produkter från tolv kategorier:
    // 28 av dem (15 %) har prisspann, och för dem sa kortet "Från 1 179 kr"
    // medan sökförslaget sa "1 179 kr" — samma siffra (priceNum och
    // priceFromNum var lika i 28 fall av 28), men utan att antyda att det finns
    // dyrare varianter. Halvvägs efterliknat är sämre än inte alls.
    //
    // Samma tre fall som components/productcard, i samma ordning.
    p: p.hasRange
      ? `Från ${p.priceFromNum ? formatPrice(p.priceFromNum) : p.priceFrom}`
      : p.priceNum
        ? formatPrice(p.priceNum)
        : p.price,
    ...(p.inStock ? {} : { o: 1 }),
  }));
  return NextResponse.json(index, { headers: { "Cache-Control": CACHE } });
}
