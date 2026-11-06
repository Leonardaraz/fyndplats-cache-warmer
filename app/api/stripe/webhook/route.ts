// POST /api/stripe/webhook — Stripes händelser för vår kassa.
//
// Kunden kan stänga fliken efter betalningen (Klarna i en app, en tappad
// uppkoppling): då är det här som ordern skapas. Samma steg som kundens sida
// (/api/kassa/stripe/klar); låset i lib/kassa/flode.ts gör att bara en av dem
// skapar ordern.
//
// ☠️ KROPPEN LÄSES SOM TEXT, aldrig som JSON först: signaturen gäller exakt de
// bytes Stripe skickade (lib/kassa/stripe.ts, provaWebhook).
//
// Svaret styr Stripes omförsök: 2xx = klart, annat = Stripe försöker igen i
// upp till tre dygn. "pagar" (någon annan slutför just nu) och betalningar som
// inte är kassans svarar 200; ett Wix-fel svarar 500 så att Stripe tar om.

import { NextResponse } from "next/server";
import { slutforStripe } from "@/lib/kassa/flode";
import { stripeKassa } from "@/lib/kassa/stripe-kassa";
import { provaWebhook } from "@/lib/kassa/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Händelserna som betyder att kundens pengar är reserverade eller dragna. */
const SLUTFOR = new Set(["payment_intent.amount_capturable_updated", "payment_intent.succeeded"]);

export async function POST(req: Request) {
  const hemlighet = process.env.STRIPE_WEBHOOK_SECRET;
  if (!hemlighet) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET saknas");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const kropp = await req.text();
  const prov = provaWebhook(kropp, req.headers.get("stripe-signature"), hemlighet);
  if (!prov.ok) {
    console.warn(`[stripe-webhook] nekad: ${prov.orsak}`);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { handelse } = prov;
  if (!SLUTFOR.has(handelse.type)) return NextResponse.json({ ok: true, hoppad: handelse.type });

  const objekt = handelse.data?.object as { id?: unknown; metadata?: Record<string, string> } | undefined;
  const avsiktId = typeof objekt?.id === "string" ? objekt.id : "";
  if (!avsiktId.startsWith("pi_")) return NextResponse.json({ ok: true, hoppad: "inget id" });
  if (objekt?.metadata?.kalla !== "fp-kassa-stripe") return NextResponse.json({ ok: true, hoppad: "inte kassans" });

  const start = Date.now();
  try {
    const utfall = await slutforStripe(stripeKassa, avsiktId, new Date());
    console.info(`[stripe-webhook] ${handelse.type}: ${utfall.ok ? "ok" : utfall.kod} på ${Date.now() - start} ms`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`[stripe-webhook] ${handelse.type} föll efter ${Date.now() - start} ms: ${e instanceof Error ? e.message.slice(0, 300) : e}`);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
