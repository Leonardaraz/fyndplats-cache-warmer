// GET /api/kassa/stripe/retur — dit Stripe skickar kunden tillbaka efter Klarna
// (return_url i stripe.confirmPayment, app/kassa/kassa.tsx).
//
// ☠️ Stripe lägger betalningens client_secret i adressen. Sidorna laddar GA4 och
// Meta, som sparar hela adressen. Därför landar kunden här, i en rutt utan
// spårning, och skickas vidare till /kassa/klar med bara betalningens id.
// Ingen växelkoll: en betalning som redan gjorts ska alltid kunna slutföras.

import { NextResponse } from "next/server";
import { returMal } from "@/lib/kassa/stripe-klient";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(new URL(returMal(url.searchParams), url.origin), {
    status: 303,
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}
