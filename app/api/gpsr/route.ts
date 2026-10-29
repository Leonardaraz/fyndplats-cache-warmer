// GET /api/gpsr?id=<wixProductId>
//
// Produktsäkerhetsuppgifterna (GPSR) för en produkt, i exakt den form
// butikens flik "Produktsäkerhet" visar dem: märke, tillverkare och ansvarig
// i EU, och säkerhetsinformation på svenska. Se lib/gpsr/aosom.ts.
//
// AOSOM. Inga modellanrop: svaret slås upp i den incheckade
// lib/gpsr/aosom-data.json via produktens mappning. Aosoms artikelnummer
// lämnar aldrig motorn (tillPublik). En Aosom-produkt som saknas i datan
// (importerad efter senaste bygget, eller borta ur feeden men kvar i butiken)
// får ändå tillverkaren — den är samma för alla Aosom-märken och är det lagen
// kräver först. Säkerhetstexten skriver poleringen då i produktbeskrivningen
// (<h2>Produktsäkerhet</h2>, se docs/seo-polish-runbook.md), och butiken tar
// den därifrån.
//
// VEVOR (steg 7). Tillverkaren och EU-ansvarig ur Wix CMS: artikelns egen
// rad, annars standardraden som gäller alla VEVOR-varor
// (lib/vevor/gpsr-standard.ts). Aldrig ur en incheckad fil: repot är publikt, och
// en fil nycklad på artikelnummer hade publicerat vårt urval. Svaret har två
// parter (`tillverkare` och `euAnsvarig`) i stället för Aosoms en (`ansvarig`).
// Är uppgifterna inte kompletta svarar rutten 404, och då visar butiken ingen
// flik. Varan är då heller inte publicerad (lib/publicering.ts).
//
// Ingen auth — allt i svaret står på den publika produktsidan.
//
// 404 när produkten varken är en Aosom-vara eller en VEVOR-vara med kompletta
// uppgifter.

import { type NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store/factory";
import { aosomSkuOf, mappingSupplier, vevorSkuOf } from "@/lib/store/supplier";
import { assertNever } from "@/lib/assert-never";
import { tillPublik } from "@/lib/gpsr/aosom";
import { gpsrForSku } from "@/lib/gpsr/data";
import { publikGpsr } from "@/lib/vevor/gpsr";
import { wixGpsrLager } from "@/lib/vevor/gpsr-lager";
import { lasEffektiva } from "@/lib/vevor/gpsr-standard";

export const dynamic = "force-dynamic";

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CACHE_OK = "public, s-maxage=3600, stale-while-revalidate=86400";
/**
 * En VEVOR-vara utan kompletta uppgifter cachas inte: uppgifterna förs in
 * precis innan varan publiceras, och ett 404 som låg kvar i Vercels cache ett
 * dygn hade gett den publicerade sidan en sida utan flik.
 */
const CACHE_INTE = "no-store";

function saknas(cache: string) {
  return NextResponse.json({ saknas: true }, { status: 404, headers: { "Cache-Control": cache } });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "ogiltigt id" }, { status: 400 });
  }
  try {
    const mappning = await getStore().getMappingByWixProductId(id);
    if (!mappning) return saknas(CACHE_OK);
    const leverantor = mappingSupplier(mappning);
    switch (leverantor) {
      case "aosom": {
        const sku = aosomSkuOf(mappning);
        if (!sku) return saknas(CACHE_OK);
        const post = gpsrForSku(sku) ?? { m: null, s: [] };
        return NextResponse.json(tillPublik(post), { headers: { "Cache-Control": CACHE_OK } });
      }
      case "vevor": {
        const sku = vevorSkuOf(mappning);
        const rad = sku ? (await lasEffektiva(wixGpsrLager, [sku])).get(sku) ?? null : null;
        const publik = publikGpsr(rad);
        if (!publik) return saknas(CACHE_INTE);
        return NextResponse.json(publik, { headers: { "Cache-Control": CACHE_OK } });
      }
      case "aliexpress":
      case "okand":
        return saknas(CACHE_OK);
      default:
        return assertNever(leverantor, "leverantör");
    }
  } catch (err) {
    console.error("[gpsr] läsfel:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "läsfel" }, { status: 502 });
  }
}
