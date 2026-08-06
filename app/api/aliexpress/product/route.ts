// GET /api/aliexpress/product?id=<productId>
// Hämtar produktdata via AliExpress DS API och returnerar samma format som
// content-scriptet skickar — popupen kan använda vilken källa som helst.

import { type NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/aliexpress/client";
import { checkToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authErr = checkToken(req);
  if (authErr) return authErr;

  const productId = req.nextUrl.searchParams.get("id");
  if (!productId) {
    return NextResponse.json({ error: "id krävs" }, { status: 400 });
  }

  try {
    const product = await getProduct(productId);
    // Normalisera till det format som importpipelinen förväntar sig.
    return NextResponse.json({
      supplierProductId: product.productId,
      sourceUrl: `https://www.aliexpress.com/item/${product.productId}.html`,
      rawTitle: product.title,
      rawDescription: product.description,
      imageUrls: product.images,
      variants: product.variants.map((v) => ({
        supplierVariantId: v.skuId,
        options: v.skuProps,
        costUsd: v.price,
        stock: v.stock,
        included: true,
        swatchImageUrl: v.imageUrl,
        // Per-variant lagerland — driver EU/CN-badgen i popupen (samma fält
        // som content-scriptets skrapade varianter bär).
        shipFrom: v.shipFrom,
      })),
      shipsFrom: product.shipsFromCountries,
      inStock: product.variants.some((v) => (v.stock ?? 0) > 0),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
