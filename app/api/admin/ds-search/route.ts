// GET /api/admin/ds-search?q=men's%20underwear&token=YYY
//
// Läs-bar diagnostik: visar exakt vad AliExpress sök-API:t (aliexpress.ds.text.search)
// returnerar för en sökterm — antal träffar + per-träff shipsFromCountries +
// warehouse-klass. Används för att förstå varför "Alla EU (en sida)" / /admin/discover
// hittar 0 EU-lager-produkter (returnerar API:t inga produkter alls, eller produkter
// vars ship-from rapporteras som CN/tomt?).
//
// Token-skyddad via EXTENSION_API_TOKEN i query. Helt read-only.

import { type NextRequest, NextResponse } from "next/server";
import { searchAliExpressByText, debugRawTextSearch } from "@/lib/aliexpress/client";
import { classifyWarehouses } from "@/lib/aliexpress/eu-countries";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const provided = req.nextUrl.searchParams.get("token");
  const expected = process.env.EXTENSION_API_TOKEN;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "q krävs" }, { status: 400 });
  }
  try {
    // ?raw=1 → returnera otolkat API-råsvar (parse-fel vs genuint tomt).
    if (req.nextUrl.searchParams.get("raw") === "1") {
      const raw = await debugRawTextSearch(q);
      return NextResponse.json({ ok: true, q, raw });
    }
    const all = await searchAliExpressByText(q, { pageSize: 20 });
    const rows = all.map((p) => {
      const codes = p.shipsFromCountries ?? [];
      return {
        productId: p.productId,
        title: (p.title ?? "").slice(0, 60),
        priceUsd: p.priceUsd,
        shipsFromCountries: codes,
        warehouseClass: classifyWarehouses(codes),
      };
    });
    const withShipFrom = rows.filter((r) => r.shipsFromCountries.length > 0).length;
    return NextResponse.json({
      ok: true,
      q,
      count: rows.length,
      withShipFrom,
      results: rows,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, q, error: (e as Error).message }, { status: 500 });
  }
}
