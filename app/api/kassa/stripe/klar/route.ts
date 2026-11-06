// POST /api/kassa/stripe/klar  { avsiktId }
//
// Kundens sida efter betalningen (direkt för kort och Apple/Google Pay, efter
// returen för Klarna): den reserverade betalningen blir en betald Wix-order.
// Samma steg tas av webhooken (/api/stripe/webhook); låset gör att bara en av
// dem skapar ordern, och den andra svarar "pagar".
//
// ☠️ INGEN VÄXELKOLL HÄR. En betalning som redan reserverats ska alltid kunna
// slutföras, också om kassan stängts emellan: annars står kundens pengar
// reserverade utan order. Flödet prövar själv att betalningen är kassans.

import { NextResponse } from "next/server";
import { slutforStripe, utfallLage } from "@/lib/kassa/flode";
import { stripeKassa } from "@/lib/kassa/stripe-kassa";
import { harStripe } from "@/lib/kassa/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PRIVAT = { "Cache-Control": "private, no-store" };
const svar = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: PRIVAT });

export async function POST(req: Request) {
  if (!harStripe()) return svar({ ok: false, kod: "stangd", meddelanden: ["Kassan är stängd just nu."] }, 503);
  let avsiktId = "";
  try {
    const body = (await req.json()) as Record<string, unknown>;
    avsiktId = typeof body.avsiktId === "string" ? body.avsiktId : "";
  } catch {
    /* tom kropp */
  }
  if (!/^pi_[A-Za-z0-9]+$/.test(avsiktId)) return svar({ ok: false, kod: "okand", meddelanden: ["Betalningen hittades inte."] }, 400);
  const start = Date.now();
  try {
    const utfall = await slutforStripe(stripeKassa, avsiktId, new Date());
    console.info(`[kassa] stripe slutför ${utfallLage(utfall)} på ${Date.now() - start} ms`);
    // "pagar" och "behandlas" är inga fel: sidan frågar igen om en stund.
    const status = utfall.ok ? 200 : utfall.kod === "pagar" || utfall.kod === "behandlas" ? 202 : 409;
    return svar(utfall, status);
  } catch (e) {
    console.error(`[kassa] stripe slutför föll efter ${Date.now() - start} ms: ${e instanceof Error ? e.message.slice(0, 300) : e}`);
    return svar({ ok: false, kod: "tjanst", meddelanden: ["Vi slutför din beställning. Ladda om sidan om en liten stund."] }, 502);
  }
}
