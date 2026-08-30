// GET /api/aliexpress/product?id=<productId>
// Hämtar produktdata via AliExpress DS API och returnerar samma format som
// content-scriptet skickar — popupen kan använda vilken källa som helst.

import { type NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/aliexpress/client";
import { aliExpressIdFromListing } from "@/lib/aliexpress/product-id";
import { checkToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authErr = checkToken(req);
  if (authErr) return authErr;

  const productId = req.nextUrl.searchParams.get("id");
  if (!productId) {
    return NextResponse.json({ error: "id krävs" }, { status: 400 });
  }
  // Escape-hatch, inte formkontroll: rutten anropas av tillägget medan det står
  // PÅ en AliExpress-produktsida, så id:t är ett AE-id per konstruktion.
  //
  // extractAliExpressProductId hade sett ut som en gratis extra spärr här och är
  // det inte: den kräver 10–16 siffror medan tillägget släpper igenom sex
  // (`/^\d{6,}$/` i background.js). Äldre AE-listningar med kortare id hade
  // därmed börjat svara 400 på en väg som fungerat i evighet — en ren
  // funktionsförlust för noll vinst, eftersom en Aosom-rad aldrig kan nå hit.
  const aeId = aliExpressIdFromListing(productId);

  try {
    const product = await getProduct(aeId);
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
      // NEDTAGEN LISTNING (audit 2026-08-24). `inStock` räknades tidigare enbart
      // ur saldot — och en nedtagen listning svarar 200 med saldot FRUSET på
      // sista kända värdet. Det här var alltså enda stället där antagandet
      // "dött ser levande ut" aktivt tillverkades och skickades vidare till
      // tillägget, som bygger sina varianter på svaret.
      inStock:
        product.listingAvailability !== "offline"
        && product.variants.some((v) => (v.stock ?? 0) > 0),
      listingAvailability: product.listingAvailability ?? "unknown",
      ...(product.offlineReason ? { offlineReason: product.offlineReason } : {}),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
