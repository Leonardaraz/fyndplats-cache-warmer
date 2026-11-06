// POST /api/medlem/offert/kassa  { id }
//
// Kassan för en prissatt offert (E3-10): servern bygger en låst Cart V2 med
// offertens styckpriser och svarar med kassans adress. Bara kontots eget
// godkända företag och bara inom giltighetstiden; annars svarar rutten med
// skälet och ingen korg skapas. Med vår kassa och Stripe är adressen "/kassa"
// och kakan fp_kassa_korg pekar ut den låsta korgen, som för medlemskassan.

import { NextResponse } from "next/server";
import { PRIVAT, webbplats } from "@/lib/medlem/inloggad";
import { medlemsprofil, offertKassa } from "@/lib/medlem/medlemspris";
import { arOffertId } from "@/lib/medlem/offert";
import { egenKassaMedStripe } from "@/lib/kassa/medlemskassa";
import { lastKorgKaka } from "@/lib/kassa/lastkorg";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

export async function POST(req: Request) {
  let id = "";
  try {
    const kropp = (await req.json()) as { id?: unknown };
    id = typeof kropp?.id === "string" ? kropp.id : "";
  } catch {
    // Fel form; svaras nedan.
  }
  if (!arOffertId(id)) return NextResponse.json({ ok: false, skal: "fel-form" }, { status: 400, headers: PRIVAT });
  const mp = await medlemsprofil();
  if ("utan" in mp) return NextResponse.json({ ok: false, skal: mp.utan }, { status: 403, headers: PRIVAT });
  try {
    const svar = await offertKassa(id, mp, webbplats(req), { egen: await egenKassaMedStripe() });
    if (svar.ok && svar.korg) {
      const { korg, ...utan } = svar;
      const res = NextResponse.json(utan, { headers: PRIVAT });
      res.cookies.set(lastKorgKaka(korg));
      return res;
    }
    return NextResponse.json(svar, { status: svar.ok ? 200 : svar.skal === "saknas" ? 404 : 409, headers: PRIVAT });
  } catch (e) {
    console.error("[offertkassa] gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return NextResponse.json({ ok: false, skal: "tillfalligt" }, { status: 503, headers: PRIVAT });
  }
}
