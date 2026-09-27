// GET /api/gpsr?id=<wixProductId>
//
// Produktsäkerhetsuppgifterna (GPSR) för en produkt, i exakt den form
// butikens flik "Produktsäkerhet" visar dem: märke, tillverkare och ansvarig
// i EU, och säkerhetstext på svenska. Se lib/gpsr/aosom.ts.
//
// Ingen auth: allt i svaret står på den publika produktsidan. Aosoms
// artikelnummer och källtexten lämnar aldrig motorn (tillPublik).
//
// 404 när produkten saknar post — en AliExpress-produkt, eller en
// Aosom-produkt som fyllningen inte hunnit till. Butiken visar då ingen flik
// i stället för en halv.

import { type NextRequest, NextResponse } from "next/server";
import { tillPublik } from "@/lib/gpsr/aosom";
import { hamtaGpsr } from "@/lib/gpsr/lager";

export const dynamic = "force-dynamic";

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "ogiltigt id" }, { status: 400 });
  }
  try {
    const post = await hamtaGpsr(id);
    if (!post) {
      return NextResponse.json({ saknas: true }, {
        status: 404,
        headers: { "Cache-Control": "public, s-maxage=3600" },
      });
    }
    return NextResponse.json(tillPublik(post), {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    console.error("[gpsr] läsfel:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "läsfel" }, { status: 502 });
  }
}
