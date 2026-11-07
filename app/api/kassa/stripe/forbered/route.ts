// POST /api/kassa/stripe/forbered  { cartId, epost, fornamn, efternamn, telefon, gata, co?, postnr, ort, kupong?, avsiktId? }
//
// Stripe-kassans första steg: formuläret → Wix räkning → en PaymentIntent på
// Wix total, som kundens betalfält (Stripe Payment Element) använder. Inget
// dras och ingen order skapas här. Flödet och skälen: lib/kassa/flode.ts.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { egenKassa, kassaLage, PROV_KAKA } from "@/lib/kassa/lage";
import { provaKassa } from "@/lib/kassa/formular";
import { forberedStripe, medForsprang, medTider, tidrad } from "@/lib/kassa/flode";
import { stripeKassa } from "@/lib/kassa/stripe-kassa";
import { harStripe, StripeFel } from "@/lib/kassa/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PRIVAT = { "Cache-Control": "private, no-store" };
const svar = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: PRIVAT });
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const stangd = () => svar({ ok: false, kod: "stangd", meddelanden: ["Kassan är stängd just nu. Gå tillbaka till varukorgen och försök igen."] }, 503);
  if (!harStripe()) return stangd();
  // Växeln läses samtidigt med korgen och den förra betalningen (medForsprang):
  // den är cachad en minut, och när kunden fyllt i formuläret var den oftast
  // kall, 0,2–0,3 s före allt annat (mätt 2026-11-07). Läsningarna har ingen
  // verkan; svaren är desamma och i samma ordning som förut.
  const provkaka = (await cookies()).get(PROV_KAKA)?.value;
  const lage = kassaLage();
  let body: Record<string, unknown> | null = null;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }
  const cartId = typeof body?.cartId === "string" ? body.cartId : "";
  const prov = body ? provaKassa(body) : null;
  const avsiktId = typeof body?.avsiktId === "string" && /^pi_[A-Za-z0-9]+$/.test(body.avsiktId) ? body.avsiktId : null;
  const tider: Record<string, number[]> = {};
  const start = Date.now();
  const deps = body && GUID.test(cartId) && prov?.ok ? medForsprang(medTider(stripeKassa, tider), cartId, avsiktId) : null;
  if (!egenKassa(await lage, provkaka)) return stangd();
  if (!body || !prov) return svar({ ok: false, kod: "fel", meddelanden: ["Formuläret kom inte fram. Försök igen."] }, 400);
  if (!GUID.test(cartId)) return svar({ ok: false, kod: "korg", meddelanden: ["Varukorgen hittades inte. Gå tillbaka till butiken."] }, 400);
  if (!prov.ok) return svar({ ok: false, kod: "formular", fel: prov.fel }, 400);
  if (!deps) return svar({ ok: false, kod: "fel", meddelanden: ["Formuläret kom inte fram. Försök igen."] }, 400);

  try {
    const utfall = await forberedStripe(deps, { cartId, kund: prov.varden, avsiktId });
    console.info(`[kassa] stripe förbered ${utfall.ok ? "ok" : `stopp ${utfall.kod}`} på ${Date.now() - start} ms: ${tidrad(tider)}`);
    return svar(utfall, utfall.ok ? 200 : 409);
  } catch (e) {
    // Ingen kunddata i loggen: bara anropens tider och Wix/Stripes felkod.
    const kod = e instanceof StripeFel ? `stripe ${e.status} ${e.kod ?? ""}` : e instanceof Error ? e.message.slice(0, 300) : String(e);
    console.error(`[kassa] stripe förbered föll efter ${Date.now() - start} ms (${tidrad(tider)}): ${kod}`);
    return svar({ ok: false, kod: "tjanst", meddelanden: ["Vi kunde inte öppna betalningen just nu. Försök igen om en stund."] }, 502);
  }
}
