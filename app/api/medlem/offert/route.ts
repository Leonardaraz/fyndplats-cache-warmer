// POST /api/medlem/offert  { cartId, meddelande? }
//
// "Begär offert" från varukorgen (E3-9, F7). Bara för ett godkänt företag och
// bara när korgen når gränsen: 6 exemplar av samma vara eller 20 000 kr exkl.
// moms. Servern läser och prissätter korgen själv; webbläsaren skickar bara
// korgens id och kundens meddelande. Högst tre obesvarade förfrågningar per
// konto. Svaret bär offertens id, aldrig priser.

import { NextResponse } from "next/server";
import { PRIVAT } from "@/lib/medlem/inloggad";
import { medlemsprofil, offertForfragan } from "@/lib/medlem/medlemspris";
import { rensaMeddelande } from "@/lib/medlem/offert";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  let cartId = "";
  let meddelande = "";
  try {
    const kropp = (await req.json()) as { cartId?: unknown; meddelande?: unknown };
    cartId = typeof kropp?.cartId === "string" ? kropp.cartId : "";
    meddelande = rensaMeddelande(kropp?.meddelande);
  } catch {
    // Fel form; svaras nedan.
  }
  if (!GUID.test(cartId)) return NextResponse.json({ ok: false, skal: "fel-form" }, { status: 400, headers: PRIVAT });
  const mp = await medlemsprofil();
  if ("utan" in mp) return NextResponse.json({ ok: false, skal: mp.utan }, { status: 403, headers: PRIVAT });
  try {
    const svar = await offertForfragan(cartId, mp, meddelande);
    return NextResponse.json(svar, { status: svar.ok ? 200 : 409, headers: PRIVAT });
  } catch (e) {
    console.error("[offert] förfrågan gick inte:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return NextResponse.json({ ok: false, skal: "tillfalligt" }, { status: 503, headers: PRIVAT });
  }
}
