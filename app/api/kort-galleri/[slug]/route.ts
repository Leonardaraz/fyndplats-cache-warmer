import { NextResponse } from "next/server";
import { getProducts } from "../../../../lib/products";
import { wixMediaKey } from "../../../../lib/wix-media-key";
import { extraKortbilder } from "../../../../lib/kort-galleri";

// GET /api/kort-galleri/<slug> → ["nyckel", …]
//
// Produktkortets bilder utöver de två listan redan har — hämtas av kortet
// (components/card-gallery.tsx) först när någon börjar svepa. Se
// lib/kort-galleri.ts för varför de inte ligger i listnyttolasten.
//
// En CDN-nyckel per produkt: samma svar till alla besökare, och bara för
// produkter någon faktiskt sveper på.
const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const alla = await getProducts();
  const p = alla.find((x) => x.slug === slug);
  // Okänd produkt: tom lista, inte 404 — kortet ska bara stanna på två bilder.
  const ut = p ? extraKortbilder(p.img, p.gallery, wixMediaKey) : [];
  return NextResponse.json(ut, { headers: { "Cache-Control": CACHE } });
}
