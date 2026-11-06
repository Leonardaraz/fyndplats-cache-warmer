// POST /api/medlem/forskott  { cartId }
//
// Förskottsfakturan (medlemskapet E3, villkoren 5.1, Leonards svar 3.3): ett
// godkänt företag köper varukorgen mot förskottsfaktura. Servern prissätter
// korgen som företag, skapar ordern obetald i Wix och tar bort besökarens
// varukorg. Motorn skickar fakturan och beställer varorna först när ordern är
// betald (lib/medlem/medlemspris.ts, `forskottsorder`).
//
// Svarar `ok: false` med skälet när det inte går. Kortet och Klarna i den
// vanliga kassan finns alltid kvar, så kunden är aldrig fast här.

import { NextResponse } from "next/server";
import { PRIVAT } from "@/lib/medlem/inloggad";
import { forskottsorder, medlemsprofil } from "@/lib/medlem/medlemspris";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

  const svar = await forskottsorder(cartId, mp);
  return NextResponse.json(svar, { headers: PRIVAT });
}
