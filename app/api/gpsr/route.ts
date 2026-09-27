// GET /api/gpsr?id=<wixProductId>
//
// Produktsäkerhetsuppgifterna (GPSR) för en produkt, i exakt den form
// butikens flik "Produktsäkerhet" visar dem: märke, tillverkare och ansvarig
// i EU, och säkerhetsinformation på svenska. Se lib/gpsr/aosom.ts.
//
// Inga modellanrop: svaret slås upp i den incheckade lib/gpsr/aosom-data.json
// via produktens mappning. Ingen auth — allt i svaret står på den publika
// produktsidan. Aosoms artikelnummer lämnar aldrig motorn (tillPublik).
//
// 404 när produkten inte är en Aosom-produkt eller saknas i datan (en
// produkt importerad efter senaste bygget). Butiken visar då ingen flik.

import { type NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store/factory";
import { aosomSkuOf } from "@/lib/store/supplier";
import { tillPublik } from "@/lib/gpsr/aosom";
import { gpsrForSku } from "@/lib/gpsr/data";

export const dynamic = "force-dynamic";

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CACHE_OK = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "ogiltigt id" }, { status: 400 });
  }
  try {
    const mappning = await getStore().getMappingByWixProductId(id);
    const sku = mappning ? aosomSkuOf(mappning) : null;
    const post = sku ? gpsrForSku(sku) : null;
    if (!post) {
      return NextResponse.json({ saknas: true }, { status: 404, headers: { "Cache-Control": CACHE_OK } });
    }
    return NextResponse.json(tillPublik(post), { headers: { "Cache-Control": CACHE_OK } });
  } catch (err) {
    console.error("[gpsr] läsfel:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "läsfel" }, { status: 502 });
  }
}
