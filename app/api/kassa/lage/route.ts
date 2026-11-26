// GET /api/kassa/lage → { egen: boolean }
//
// Varukorgen frågar här när den öppnas: true skickar "Till kassan" till vår
// egen kassa (/kassa), false till Wix kassa som förut (lib/kassa/lage.ts).
//
// POST /api/kassa/lage → 204
//
// Varukorgen säger till när den skickar en kund till Wix kassa
// (checkout.fyndplats.se) i stället för vår egen (sagWixKassa i
// components/cart.tsx). Rutten skriver en rad med webbläsarens sort och
// ingenting annat; kroppen läses inte. ☠️ Vår kassa är på för alla sedan
// 2026-11-06: varje sådan rad är en kund som hamnade i den gamla kassan, för
// att växeln inte gick att läsa eller är avstängd. Utan raden syntes det
// ingenstans (Leonards fråga 2026-11-25).

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { egenKassa, kassaLage, PROV_KAKA } from "@/lib/kassa/lage";
import { webblasarsort } from "@/lib/kassa/stripe-klient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const lage = await kassaLage();
  const prov = (await cookies()).get(PROV_KAKA)?.value;
  return NextResponse.json({ egen: egenKassa(lage, prov) }, { headers: { "Cache-Control": "private, max-age=60" } });
}

export function POST(req: Request) {
  console.warn(`[kassa] varukorgen öppnar Wix kassa [${webblasarsort(req.headers.get("user-agent"))}]`);
  return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
}
