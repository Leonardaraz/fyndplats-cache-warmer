// POST /api/stripe-webhook
// Tar emot Stripe-webhooks och verifierar signaturen mot RÅ body innan vi litar på
// händelsen. Konfigurera endpointen i Stripe Dashboard och lägg dess signing secret
// i STRIPE_WEBHOOK_SECRET. Verifiering = inga förfalskade "betalning klar".

import { type NextRequest, NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/payments/stripe-webhook";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook ej konfigurerad." }, { status: 500 });
  }

  // Viktigt: signaturen verifieras mot oparsad body.
  const payload = await req.text();
  const header = req.headers.get("stripe-signature") ?? "";

  if (!verifyStripeSignature({ payload, header, secret })) {
    return NextResponse.json({ error: "Ogiltig signatur." }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON." }, { status: 400 });
  }

  // Hantera de händelser vi bryr oss om. Håll snabbt — Stripe vill ha 2xx direkt.
  if (event.type === "checkout.session.completed") {
    const session = event.data?.object ?? {};
    const email = (session.customer_email as string) ?? (session.customer_details as { email?: string })?.email ?? "okänd";
    const amount = session.amount_total as number | undefined;
    const meta = (session.metadata as Record<string, string>) ?? {};
    console.log(
      `[stripe-webhook] BETALNING: ${email} · ${meta.plan ?? "?"} · ${
        amount != null ? amount / 100 : "?"
      } kr · scan: ${meta.scanned_url ?? "-"}`,
    );
    // Här kopplar du senare på: skicka audit-rapporten, lägg order i din pipeline, osv.
  }

  return NextResponse.json({ received: true });
}
