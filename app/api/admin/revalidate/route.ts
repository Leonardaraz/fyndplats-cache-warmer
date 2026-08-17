// Manuell ISR-invalidation. Användning:
//   curl -X POST "https://www.fyndplats.se/api/admin/revalidate?token=$ADMIN_SECRET&path=/produkt/skrivbord-ek-120cm-datorbord"
//   curl -X POST "https://www.fyndplats.se/api/admin/revalidate?token=$ADMIN_SECRET&tag=reviews"
//
// Path-formatet är NEXT.js revalidatePath: konkret URL ('/produkt/<slug>')
// invalidatear en specifik sida; dynamisk pattern ('/produkt/[slug]') med
// type=page invalidatear ALLA sidor under routen. Den här endpointen tar bara
// path-parameter och låter Next.js gissa typ (det matchar den vanligaste use-
// casen: pusha en specifik PDP/kategori efter manuell content-ändring).
//
// `tag` tillkom 2026-08-17. Bakgrund: recensioner fylldes på för hundratals
// produkter, men produktsidorna är statiskt cachade i en timme och serverar
// den GAMLA sidan till den första besökaren efter att cachen gått ut — omdömena
// syntes alltså först vid andra sidbesöket. Med path hade det krävts ett anrop
// per produkt; recensionshämtningen är redan taggad ("reviews" i lib/reviews.ts),
// så ett enda tag-anrop tömmer allihop.
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  const tag = req.nextUrl.searchParams.get("tag");
  if (!path && !tag) {
    return NextResponse.json({ error: "path or tag required" }, { status: 400 });
  }

  // expire: 0 = töm direkt, samma form som wix-webhooken redan använder.
  if (tag) revalidateTag(tag, { expire: 0 });
  if (path) revalidatePath(path);

  return NextResponse.json({
    revalidated: true,
    ...(tag ? { tag } : {}),
    ...(path ? { path } : {}),
  });
}
