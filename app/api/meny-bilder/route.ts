import { NextResponse } from "next/server";
import { categoryHero, getCategoryTree, MOSAIC_DENYLIST } from "../../../lib/category-groups";
import { getProducts, katalogenArDegraderad } from "../../../lib/products";
import { valjMenyBilder } from "../../../lib/meny-bilder";
import { MENY_BILD_VAL } from "../../../lib/meny-bild-val";

// GET /api/meny-bilder — menyns bilder: kategorislug → produktbild, och
// avdelningens miljöfoto (Unsplash, i rå form; menyn väljer storlek och form).
//
// VARFÖR EN EGEN FIL. Bilderna ligger inte i sidans HTML, av samma skäl som
// produktantalen (app/api/meny-antal/route.ts, lib/meny-antal.ts): menyn står på
// varje sida, och ett nytt bildval hade gjort alla sidor "nya" för Vercel.
// Menyn hämtar filen först när någon rör den (components/use-meny-bilder.ts),
// och svaret delas av alla besökare via CDN:n och webbläsarens cache.
//
// Samma träd som menyn (getCategoryTree), så varje kategori i menyn har en
// nyckel här. Urvalet och handvalen: lib/meny-bilder.ts och lib/meny-bild-val.ts.
export const revalidate = 3600;
// Explicit huvud: `revalidate` ensam räcker inte för en route handler
// (se app/api/lista/route.ts). Bilderna byts sällan, så webbläsaren får spara
// filen en timme.
const CACHE = "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  const [tree, produkter] = await Promise.all([getCategoryTree(), getProducts()]);
  // Reservkatalogen (Wix svarade inte) har gamla produkter utan kategorier. Ett
  // urval ur den hade stått kvar en timme; ingen bild alls är bättre, och svaret
  // sparas bara en minut.
  if (katalogenArDegraderad(produkter)) {
    return NextResponse.json({ bilder: {}, hjaltar: {} }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
  }
  const bilder = valjMenyBilder(tree, produkter, { val: MENY_BILD_VAL, neka: MOSAIC_DENYLIST });
  const hjaltar: Record<string, string> = {};
  for (const m of tree) {
    const foto = categoryHero(m.name);
    if (foto) hjaltar[m.slug] = foto;
  }
  return NextResponse.json({ bilder, hjaltar }, { headers: { "Cache-Control": CACHE } });
}
