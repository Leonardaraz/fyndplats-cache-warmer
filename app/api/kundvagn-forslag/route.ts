import { NextResponse, type NextRequest } from "next/server";
import { getProducts, tillRecoProdukt } from "../../../lib/products";
import { kundvagnsForslag } from "../../../lib/related-pick";

// GET /api/kundvagn-forslag?ids=<Wix-produkt-id,…> — varukorgens förslag.
//
// Varor som kompletterar det som ligger i varukorgen, valda i
// kundvagnsForslag (lib/related-pick.ts). Förut var det samma åtta varor för
// alla besökare, oavsett varukorg.
//
// Förslagen hämtas av varukorgen själv när sidan laddat klart, inte i
// layouten: åtta produkter med pris i varje sidas data gjorde alla sidor
// "nya" så fort ett pris ändrades. Varukorgen skickar sina id sorterade, så
// samma varukorg ger samma adress och CDN:n delar svaret mellan besökare.
export const dynamic = "force-dynamic";
const CACHE = "public, max-age=300, s-maxage=900, stale-while-revalidate=3600";
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ID = 30;

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") || "").split(",").filter((s) => ID.test(s)).slice(0, MAX_ID);
  if (!ids.length) return NextResponse.json({ forslag: [] }, { headers: { "Cache-Control": CACHE } });
  const forslag = kundvagnsForslag(ids, await getProducts(), 3).map(tillRecoProdukt);
  return NextResponse.json({ forslag }, { headers: { "Cache-Control": CACHE } });
}
