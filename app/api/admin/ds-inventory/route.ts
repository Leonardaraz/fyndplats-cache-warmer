// GET /api/admin/ds-inventory?productId=XXX&token=YYY
//
// Läs-bar diagnostik: visar exakt vad AliExpress DS-API:t returnerar per variant
// (skuId, skuProps, price, stock) för en produkt. Används för att verifiera att
// importens per-variant-lager stämmer med leverantörens verklighet (t.ex. när en
// variant visar 0 i Wix — är den genuint slut, eller en felmatchning?).
//
// Token-skyddad via EXTENSION_API_TOKEN i query (så den kan triggas utan headers).
// Helt read-only — gör inga skrivningar.

import { type NextRequest, NextResponse } from "next/server";
import { getInventory } from "@/lib/aliexpress/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const provided = req.nextUrl.searchParams.get("token");
  const expected = process.env.EXTENSION_API_TOKEN;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId krävs" }, { status: 400 });
  }
  try {
    const inventory = await getInventory(productId);
    return NextResponse.json({ ok: true, productId, count: inventory.length, inventory });
  } catch (e) {
    return NextResponse.json(
      { ok: false, productId, error: (e as Error).message },
      { status: 500 },
    );
  }
}
