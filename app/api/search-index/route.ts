import { NextResponse } from "next/server";
import { getCollections, getProductsFarska } from "../../../lib/products";
import { listPris } from "../../../lib/price-range";
import { BARA_I_UNDERKATEGORIN } from "../../../lib/bara-i-underkategorin";
import { byggOrdforrad } from "../../../lib/search";
import { kategoriRad, sokKategorier, varansKategorier } from "../../../lib/sok-begrepp";
import { katalogensSokordning } from "../../../lib/sok-ordning";

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
  // Högst en timme gammal katalog: indexet byggs om i bakgrunden, och utan
  // förnyelsen fick sökrutan aldrig se en vara som publicerats efter att
  // instansen startade (lib/katalog-alder.ts).
  //
  // ORDNINGEN ÄR EN DEL AV SVARET: lika bra träffar står i indexets ordning, i
  // sökrutan och på söksidans kalla väg. Nyast först, uttalat, och samma som
  // söksidan rankar i (lib/sok-ordning.ts).
  const products = katalogensSokordning(await getProductsFarska());
  // KATEGORIERNA FÖLJER MED (2026-11-20). "barnmöbler" gav två varor, för ordet
  // står inte i namnen: sökningen läser nu också vilka kategorier varan ligger
  // i (lib/search.ts, "Kategorierna som begrepp"). Varje rad bär sina
  // kategorier som platser i tabellen (`k`), och tabellen står som indexets
  // SISTA rad. I samma svar, så att platserna aldrig pekar i en annan version
  // av tabellen, och som en rad utan namn och slug, så att en äldre sida som
  // hämtar indexet går förbi den (lib/sok-index.ts tar bort den).
  //
  // Faller kategoriläsningen skickas indexet utan dem, och sökningen söker i
  // namnen som förut.
  const kategorier = sokKategorier(await getCollections().catch(() => []));
  const index: object[] = products.map((p) => ({
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
    // Samma tre fall som components/productcard, i samma ordning (listPris i
    // lib/price-range.ts, som kontaktformulärets produktkort också använder).
    p: listPris(p),
    ...(p.inStock ? {} : { o: 1 }),
    ...kategorierFor(p, kategorier),
  }));
  // DEN TOMMA RUTANS SÖKEXEMPEL FÖLJER MED I SAMMA RAD (2026-11-20). Rutan
  // visar "Sök till exempel" över de populära varorna, och orden kommer ur
  // katalogens ordförråd. Webbläsaren byggde det innan sökläget kunde öppnas:
  // 130–160 ms på en strypt telefon, mätt i den största uppgiften vid
  // öppningen. Här räknas de en gång i timmen i stället, med samma funktion
  // på samma namn, så orden är desamma. Utan dem räknar rutan själv som förut.
  if (kategorier.kat.length > 0) index.push(kategoriRad(kategorier.kat, byggOrdforrad(products.map((p) => p.name)).exempel));
  return NextResponse.json(index, { headers: { "Cache-Control": CACHE } });
}

/** Radens `k`, eller ingenting när varan inte ligger i någon känd kategori. */
function kategorierFor(p: { id: string; collectionIds: string[] }, kategorier: ReturnType<typeof sokKategorier>): { k?: number[] } {
  const k = varansKategorier(p, kategorier, BARA_I_UNDERKATEGORIN);
  return k ? { k } : {};
}
