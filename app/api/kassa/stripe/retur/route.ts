// GET /api/kassa/stripe/retur — dit Stripe skickar kunden tillbaka efter Klarna
// (return_url i stripe.confirmPayment, app/kassa/kassa.tsx).
//
// ☠️ Stripe lägger betalningens id och client_secret i adressen. Sidorna laddar
// GA4 och Meta, som sparar hela adressen. Därför landar kunden här, i en rutt
// utan spårning: betalningens id läggs i en kort kaka som bara /kassa/klar
// ser, och kunden skickas vidare utan något i adressen (lib/kassa/stripe-klient.ts).
// Ingen växelkoll: en betalning som redan gjorts ska alltid kunna slutföras.

import { NextResponse } from "next/server";
import { AVSIKT_KAKA, AVSIKT_KAKA_SEK, AVSIKT_KAKA_SOKVAG, returMal } from "@/lib/kassa/stripe-klient";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const url = new URL(req.url);
  const { mal, avsikt } = returMal(url.searchParams);
  const svar = NextResponse.redirect(new URL(mal, url.origin), {
    status: 303,
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
  if (avsikt) {
    // Inte httpOnly: sidan läser kakan och tar bort den direkt (app/kassa/klar/tillbaka.tsx).
    svar.cookies.set(AVSIKT_KAKA, avsikt, { path: AVSIKT_KAKA_SOKVAG, maxAge: AVSIKT_KAKA_SEK, sameSite: "lax", secure: url.protocol === "https:" });
  }
  return svar;
}
