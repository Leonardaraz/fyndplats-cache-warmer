// GET /api/medlem/korg?c=<varukorgens id>
//
// Förhandsvisningen i varukorgen (E2): summorna med medlemspris för den
// inloggade medlemmen, räknade med samma funktion som kassan. Ingenting låses
// och ingen korg skapas; det gör först "Till kassan" (/api/medlem/kassa).
//
// Svaret bär summorna, nivån och procenten, aldrig golvet eller kostnaden.
// Utan medlemspris svarar rutten `medlemspris: false`, och varukorgen visar
// listpriset som förut.

import { NextResponse } from "next/server";
import { PRIVAT } from "@/lib/medlem/inloggad";
import { medlemsprisForKorg, medlemsprofil } from "@/lib/medlem/medlemspris";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const cartId = new URL(req.url).searchParams.get("c") ?? "";
  if (!GUID.test(cartId)) return NextResponse.json({ medlemspris: false, skal: "fel-form" }, { status: 400, headers: PRIVAT });
  const mp = await medlemsprofil();
  if ("utan" in mp) return NextResponse.json({ medlemspris: false, skal: mp.utan }, { headers: PRIVAT });
  const k = await medlemsprisForKorg(cartId, mp);
  if (!k) return NextResponse.json({ medlemspris: false, skal: "fel" }, { headers: PRIVAT });
  // Ett företag ser sina priser exkl. moms och nästa steg i trappan också
  // när korgen ännu inte ger någon rabatt (E3-7).
  if (k.rabattOre === 0 && !k.foretag) return NextResponse.json({ medlemspris: false, skal: "ingen-rabatt" }, { headers: PRIVAT });
  return NextResponse.json({ medlemspris: true, ...k }, { headers: PRIVAT });
}
