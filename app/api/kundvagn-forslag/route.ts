import { NextResponse, type NextRequest } from "next/server";
import { hamtaKundvagnsUnderlag } from "../../../lib/kundvagn-underlag";
import { kundvagnsForslag } from "../../../lib/related-pick";

// GET /api/kundvagn-forslag?ids=<Wix-produkt-id,…> — varukorgens förslag,
// och produktsidans slug för varorna i varukorgen (`lankar`).
//
// Varor som kompletterar det som ligger i varukorgen, valda i
// kundvagnsForslag (lib/related-pick.ts). Förut var det samma åtta varor för
// alla besökare, oavsett varukorg.
//
// Förslagen hämtas av varukorgen själv när sidan laddat klart, inte i
// layouten: förslag med pris i varje sidas data gjorde alla sidor "nya" så
// fort ett pris ändrades. Varukorgen skickar sina id sorterade, så samma
// varukorg ger samma adress och CDN:n delar svaret mellan besökare.
//
// Katalogen läses ur underlaget i datacachen (lib/kundvagn-underlag.ts), inte
// från Wix: en kall instans hade annars låtit kunden vänta en minut. Gick
// katalogen inte att läsa blir svaret tomt och cachas bara en minut.
export const dynamic = "force-dynamic";
const CACHE = "public, max-age=300, s-maxage=900, stale-while-revalidate=3600";
const KORT_CACHE = "public, max-age=60, s-maxage=60";
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ID = 30;

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") || "").split(",").filter((s) => ID.test(s)).slice(0, MAX_ID);
  if (!ids.length) return NextResponse.json({ forslag: [] }, { headers: { "Cache-Control": CACHE } });
  const underlag = await hamtaKundvagnsUnderlag().catch((e: Error) => {
    console.error("[kundvagn-forslag] underlaget gick inte att läsa:", e.message);
    return null;
  });
  if (!underlag) return NextResponse.json({ forslag: [] }, { headers: { "Cache-Control": KORT_CACHE } });
  const forslag = kundvagnsForslag(ids, underlag, 3).map(({ id, slug, name, img, price }) => ({ id, slug, name, img, price }));
  // Produktsidans slug för varorna i varukorgen, så att raderna kan länka dit
  // när Wix inte skickat någon adress (lib/kundvagn-lank.ts). Bara de varor
  // som finns i underlaget får en.
  const efterfragade = new Set(ids);
  const lankar: Record<string, string> = {};
  for (const v of underlag) if (efterfragade.has(v.id) && v.slug) lankar[v.id] = v.slug;
  return NextResponse.json({ forslag, lankar }, { headers: { "Cache-Control": CACHE } });
}
