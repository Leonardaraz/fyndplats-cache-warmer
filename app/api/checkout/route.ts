// POST /api/checkout  { plan: "audit" | "monitoring", email?, url? }
// Skapar en Stripe Checkout Session och returnerar { url } som klienten skickas till.
// Rör aldrig Stripe-kontot vid build — läser pris-ID/nyckel ur miljön (se .env.example).

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/payments/stripe";

export const runtime = "nodejs";

const Body = z.object({
  plan: z.enum(["audit", "monitoring"]),
  email: z.string().email().optional(),
  url: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : "Ogiltig begäran.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Bygg success/cancel-URL:er från inkommande origin så det funkar i alla miljöer.
  const origin = req.nextUrl.origin;

  try {
    const url = await createCheckoutSession({
      plan: parsed.plan,
      email: parsed.email,
      scannedUrl: parsed.url,
      successUrl: `${origin}/grade?betalning=klar`,
      cancelUrl: `${origin}/grade?betalning=avbruten`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
