// POST /api/medlem/kassa  { cartId }
//
// Kassan för en inloggad medlem (E2): servern läser besökarens varukorg,
// räknar medlemspriset, skapar en ny Cart V2 med låsta priser och svarar med
// kassans adress. Prisbeslutet sparas innan svaret går.
//
// Svarar `ok: false` med skälet när medlemspris inte gäller eller något
// fallerar. Varukorgen går då till den vanliga kassan som förut: den här
// rutten får aldrig stoppa ett köp.

import { NextResponse } from "next/server";
import { PRIVAT, webbplats } from "@/lib/medlem/inloggad";
import { medlemskassa, medlemsprofil } from "@/lib/medlem/medlemspris";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  let cartId = "";
  try {
    const kropp = (await req.json()) as { cartId?: unknown };
    cartId = typeof kropp?.cartId === "string" ? kropp.cartId : "";
  } catch {
    // Fel form; svaras nedan.
  }
  if (!GUID.test(cartId)) return NextResponse.json({ ok: false, skal: "fel-form" }, { status: 400, headers: PRIVAT });

  const mp = await medlemsprofil();
  if ("utan" in mp) return NextResponse.json({ ok: false, skal: mp.utan }, { headers: PRIVAT });

  const svar = await medlemskassa(cartId, mp, webbplats(req));
  return NextResponse.json(svar, { headers: PRIVAT });
}
