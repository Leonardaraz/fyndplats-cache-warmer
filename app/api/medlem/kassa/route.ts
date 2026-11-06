// POST /api/medlem/kassa  { cartId }
//
// Kassan för en inloggad medlem (E2): servern läser besökarens varukorg,
// räknar medlemspriset, skapar en ny Cart V2 med låsta priser och svarar med
// kassans adress. Prisbeslutet sparas innan svaret går.
//
// Svarar `ok: false` med skälet när medlemspris inte gäller eller något
// fallerar. Varukorgen går då till den vanliga kassan som förut: den här
// rutten får aldrig stoppa ett köp.
//
// Gäller vår kassa med Stripe för besökaren är adressen "/kassa", och kakan
// fp_kassa_korg pekar ut den låsta korgen (lib/kassa/lastkorg.ts). Annars Wix
// kassa som förut.

import { NextResponse } from "next/server";
import { PRIVAT, webbplats } from "@/lib/medlem/inloggad";
import { medlemskassa, medlemsprofil } from "@/lib/medlem/medlemspris";
import { egenKassaMedStripe } from "@/lib/kassa/medlemskassa";
import { LAST_KORG_BORT, LAST_KORG_KAKA, lastKorgKaka } from "@/lib/kassa/lastkorg";
import { cookies } from "next/headers";

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

  const svar = await medlemskassa(cartId, mp, webbplats(req), { egen: await egenKassaMedStripe() });
  if (svar.ok && svar.korg) {
    const { korg, ...utan } = svar;
    const res = NextResponse.json(utan, { headers: PRIVAT });
    res.cookies.set(lastKorgKaka(korg));
    return res;
  }
  // Ingen ny låst korg: en gammal kaka får inte peka kassan på den förra.
  const res = NextResponse.json(svar, { headers: PRIVAT });
  if ((await cookies()).get(LAST_KORG_KAKA)) res.cookies.set(LAST_KORG_BORT);
  return res;
}
