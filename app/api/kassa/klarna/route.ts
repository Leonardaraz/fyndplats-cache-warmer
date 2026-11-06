// GET /api/kassa/klarna → { ruta: "osm" | "statisk" }
//
// Produktsidans Klarna-ruta och Klarnas skript frågar här (lib/use-klarna-ruta.ts)
// vilken ruta som stämmer med kassan kunden får: Klarnas egen (Leonards
// Klarna-avtal, Wix kassa) eller vår egen rad (Stripe-kassan på för alla).
// Skälen står vid klarnaRuta i lib/kassa/stripe-klient.ts.
//
// Svaret är detsamma för alla besökare (provkakan räknas inte) och cachas fem
// minuter i Vercels kant, så produktsidorna kostar ett anrop per kvart och
// region, inte ett per besök.

import { NextResponse } from "next/server";
import { kassaLage } from "@/lib/kassa/lage";
import { harStripe } from "@/lib/kassa/stripe";
import { klarnaRuta } from "@/lib/kassa/stripe-klient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ruta: klarnaRuta(await kassaLage(), harStripe()) },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } },
  );
}
