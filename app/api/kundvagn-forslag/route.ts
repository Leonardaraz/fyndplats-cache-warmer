import { NextResponse } from "next/server";
import { cartRecommendations, forListings, getCollections, getProducts } from "../../../lib/products";

// GET /api/kundvagn-forslag — varukorgens "Andra köpte också".
//
// Förslagen (åtta produkter med pris) låg förut i layouten och därmed i VARJE
// sidas data. Ändrades ett pris eller ett lager blev alla sidor "nya" för Vercel,
// och varje sida bar dessutom åtta produkter som bara syns när varukorgen öppnas.
// Nu hämtar varukorgen dem här när sidan laddat klart, och svaret delas av alla
// besökare via CDN:n. Samma urval som förut (cartRecommendations).
export const revalidate = 900;
const CACHE = "public, max-age=300, s-maxage=900, stale-while-revalidate=3600";

export async function GET() {
  const forslag = cartRecommendations(forListings(await getProducts()), await getCollections());
  return NextResponse.json({ forslag }, { headers: { "Cache-Control": CACHE } });
}
