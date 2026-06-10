// GET /api/catalog-snapshot?token=<ADMIN_SECRET>
//
// Exporterar den AKTUELLA mappade katalogen (samma Product[]-form som
// products.json) så att refresh-catalog-snapshot-workflowen kan hålla
// fallback-filen färsk. Bakgrund (kod röd 2026-06-10): products.json innehöll
// en handfull uråldriga produkter, så när Wix-API:t låg nere såg butiken tom ut.
//
// SÄKERHETSSPÄRR: exporterar BARA när katalogen kom från en lyckad LIVE-
// hämtning (source === "live"). Under ett pågående avbrott svarar routen 503 →
// workflowen hoppar över committen → snapshoten kan aldrig förgiftas med
// fallback-data. Auth: ?token= mot ADMIN_SECRET (samma mönster som
// /api/admin/detect-image-crops).

import { NextResponse, type NextRequest } from "next/server";
import { getCatalogSnapshot } from "../../../lib/products";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic"; // alltid färsk bedömning, aldrig route-cache

export async function GET(req: NextRequest) {
  const expected = process.env.ADMIN_SECRET;
  const provided = req.nextUrl.searchParams.get("token");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const { source, products } = await getCatalogSnapshot();
  if (source !== "live") {
    return NextResponse.json(
      { error: "Katalogen är i fallback-läge — exporterar inte (skulle förgifta snapshoten)", source },
      { status: 503 },
    );
  }
  return NextResponse.json({ source, count: products.length, products });
}
