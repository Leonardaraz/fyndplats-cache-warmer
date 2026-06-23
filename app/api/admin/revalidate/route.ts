// Manuell ISR-invalidation. Användning:
//   curl -X POST "https://www.fyndplats.se/api/admin/revalidate?token=$ADMIN_SECRET&path=/produkt/skrivbord-ek-120cm-datorbord"
//
// Path-formatet är NEXT.js revalidatePath: konkret URL ('/produkt/<slug>')
// invalidatear en specifik sida; dynamisk pattern ('/produkt/[slug]') med
// type=page invalidatear ALLA sidor under routen. Den här endpointen tar bara
// path-parameter och låter Next.js gissa typ (det matchar den vanligaste use-
// casen: pusha en specifik PDP/kategori efter manuell content-ändring).
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });
  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}
