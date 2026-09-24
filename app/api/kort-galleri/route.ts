import { NextResponse } from "next/server";
import { getProducts } from "../../../lib/products";
import { wixMediaKey } from "../../../lib/wix-media-key";
import { extraKortbilder, lasSlugs } from "../../../lib/kort-galleri";

// GET /api/kort-galleri?s=slug1,slug2,… → { slug: ["nyckel", …], … }
//
// Produktkortens bilder utöver de två listan redan har, för ALLA kort som just
// ritats — en förfrågan per 24 kort, inte en per kort. Kortet
// (components/card-gallery.tsx) ber om dem direkt när det visas på en
// pekskärm, så de ligger på plats innan någon hinner svepa.
//
// Första versionen hämtade per produkt vid första svepet: en kall förfrågan per
// kort, och bilderna kom mitt i gesten (Leonard 2026-09-24: "det tog jättelång
// tid"). Se lib/kort-galleri.ts för varför de inte ligger i listnyttolasten.
const CACHE = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: Request) {
  const slugs = lasSlugs(new URL(req.url).searchParams.get("s"));
  const ut: Record<string, string[]> = {};
  if (slugs.length) {
    const alla = await getProducts();
    const bySlug = new Map(alla.map((p) => [p.slug, p]));
    for (const s of slugs) {
      const p = bySlug.get(s);
      // Okänd produkt: tom lista — kortet stannar bara på sina två bilder.
      ut[s] = p ? extraKortbilder(p.img, p.gallery, wixMediaKey) : [];
    }
  }
  return NextResponse.json(ut, { headers: { "Cache-Control": CACHE } });
}
