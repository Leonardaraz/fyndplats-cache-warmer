// GET /api/debug/ds-inventory?productId=XXX&token=YYY
//
// TILLFÄLLIG diagnostik (2026-06-04): visar exakt vad AliExpress DS-API:t
// returnerar per variant (skuId, skuProps, stock) för en given produkt, så vi
// kan se varför importens lager-matchning faller tillbaka på default 10 (skuId
// + optionskombo träffar 0). Token-skyddad, helt read-only. Tas bort när
// matchningen är fixad.

import { type NextRequest, NextResponse } from "next/server";
import { getInventory } from "@/lib/aliexpress/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = process.env.EXTENSION_API_TOKEN;
  const provided = req.nextUrl.searchParams.get("token");
  if (!token || provided !== token) {
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
