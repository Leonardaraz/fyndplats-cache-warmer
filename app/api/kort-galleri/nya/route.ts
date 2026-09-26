import { NextResponse } from "next/server";
import { getProductImages } from "../../../../lib/products";
import { wixMediaKey } from "../../../../lib/wix-media-key";
import { extraKortbilder, lasNyaSlugs } from "../../../../lib/kort-galleri";

// GET /api/kort-galleri/nya?s=slug1,slug2 → { slug: ["nyckel", …], … }
//
// Extrabilderna för produkter som är NYARE än katalogen den förbyggda delen
// (/api/kort-galleri/<del>) byggdes ur. Leonard 2026-09-26: med sorteringen
// "Nyast" fick korten bara två bilder, för de nyaste produkterna fanns inte i
// delarna än — de byggs vid deployen och förnyas var sjätte timme, och en
// instans håller sin katalog tills den återvinns.
//
// Läser varje produkt DIREKT från Wix (getProductImages, ett uppslag på slug), inte
// ur den cachade katalogen: den kan vara precis lika gammal som delen. Kortet
// ber bara hit för produkter som uttryckligen är nyare än delen, så det är
// några få anrop, inte en per kort.
//
// Statiskt segment bredvid den dynamiska [del]-rutten; Next väljer det
// statiska först, och [del] har dynamicParams=false.
export const dynamic = "force-dynamic";

const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: Request) {
  const slugs = lasNyaSlugs(new URL(req.url).searchParams.get("s"));
  const ut: Record<string, string[]> = {};
  await Promise.all(
    slugs.map(async (s) => {
      try {
        const p = await getProductImages(s);
        // Okänd produkt: tom lista — kortet stannar på sina två bilder.
        ut[s] = p ? extraKortbilder(p.img, p.gallery, wixMediaKey) : [];
      } catch {
        ut[s] = [];
      }
    }),
  );
  return NextResponse.json(ut, { headers: { "Cache-Control": CACHE } });
}
