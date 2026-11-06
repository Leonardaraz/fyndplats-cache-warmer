// GET /api/kassa/lage → { egen: boolean }
//
// Varukorgen frågar här när den öppnas: true skickar "Till kassan" till vår
// egen kassa (/kassa), false till Wix kassa som förut (lib/kassa/lage.ts).

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { egenKassa, kassaLage, PROV_KAKA } from "@/lib/kassa/lage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const lage = await kassaLage();
  const prov = (await cookies()).get(PROV_KAKA)?.value;
  return NextResponse.json({ egen: egenKassa(lage, prov) }, { headers: { "Cache-Control": "private, max-age=60" } });
}
