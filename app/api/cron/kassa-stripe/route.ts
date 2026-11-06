// GET /api/cron/kassa-stripe (Vercel cron, var 15:e minut)
//
// Nätet under Stripe-kassan (lib/kassa/flode.ts), som /api/cron/order-backfill
// är det under Wix-ordrarna. Kundens sida och webhooken gör ordern på
// sekunder; det här jobbet tar betalningarna som ändå blev liggande: kunden
// stängde fliken under Klarna, webhooken saknas eller felade, Wix tog inte
// emot betalningen på ordern (låset står på "registrera"), eller en
// reservation utan order gick inte att släppa.
//
// Det läser kassans betalningar från de tre senaste dygnen i Stripe (List,
// inte Search, som kan ligga efter), tar de som är godkända eller dragna men
// saknar order och är äldre än fem minuter, äldst först, och kör samma steg
// som klar och webhooken (låset gör att bara en kör åt gången). Är en sådan
// betalning inte klar (arKlart) efter 30 minuter mejlas OPS_ALERT_EMAIL, en
// gång per betalning. Tyst när inget finns att göra.

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { arKlart, attSlutfora, slutforStripe } from "@/lib/kassa/flode";
import { stripeKassa } from "@/lib/kassa/stripe-kassa";
import { harStripe, listaAvsikter } from "@/lib/kassa/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Varje slutförande tar några sekunder; resten tas nästa kvart. */
const MAX_PER_KORNING = 8;
/** Inget nytt slutförande börjar efter så här lång tid (funktionen har 60 s). */
const TIDSGRANS_MS = 35_000;
const DYGN = 24 * 60 * 60;
const FROM = process.env.RESEND_FROM || "Fyndplats <orders@fyndplats.se>";

function behorig(req: Request): boolean {
  const vantad = process.env.CRON_SECRET;
  if (!vantad) return process.env.VERCEL_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${vantad}`;
}

async function larma(ids: string[]): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || ids.length === 0) return;
  const till = process.env.OPS_ALERT_EMAIL || "info@fyndplats.com";
  const en = ids.length === 1;
  const text = [
    `${ids.length} betalning${en ? "" : "ar"} i Stripe-kassan har varit godkänd${en ? "" : "a"} i över 30 minuter utan att bli klar${en ? "" : "a"}: ingen order med betalningen på, eller en reservation som inte gick att släppa.`,
    "",
    ids.map((id) => `• ${id}`).join("\n"),
    "",
    "Nätet försöker igen var 15:e minut. Sök på id:t i Stripe (Betalningar) och kontrollera i Wix att ordern finns och är betald.",
    "Står ordern som obetald fast pengarna är dragna: registrera betalningen på ordern i Wix. Finns ingen order: släpp reservationen eller betala tillbaka i Stripe.",
  ].join("\n");
  try {
    await new Resend(key).emails.send({ from: FROM, to: till, subject: `☠️ Kassan: ${ids.length} betalning${en ? "" : "ar"} inte klar${en ? "" : "a"}`, text });
  } catch (e) {
    console.error("[kassa-stripe] larmet kunde inte skickas:", e instanceof Error ? e.message.slice(0, 200) : e);
  }
}

export async function GET(req: Request) {
  if (!behorig(req)) return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  if (!harStripe()) return NextResponse.json({ ok: true, hoppad: "stripe saknas" });
  const start = Date.now();
  const nuSek = Math.floor(start / 1000);
  try {
    const { ids, larm } = attSlutfora(await listaAvsikter(nuSek - 3 * DYGN), nuSek);
    const klarIds = new Set<string>();
    let klara = 0;
    let utanOrder = 0;
    let kvarstar = 0;
    let fel = 0;
    for (const id of ids.slice(0, MAX_PER_KORNING)) {
      if (Date.now() - start > TIDSGRANS_MS) break;
      try {
        const u = await slutforStripe(stripeKassa, id, new Date());
        if (!arKlart(u)) kvarstar++;
        else {
          klarIds.add(id);
          if (u.ok) klara++;
          else utanOrder++;
        }
      } catch (e) {
        fel++;
        console.error("[kassa-stripe] slutförandet föll:", e instanceof Error ? e.message.slice(0, 200) : e);
      }
    }
    // Larm bara för det som fortfarande inte är klart efter försöket (också de
    // som inte hanns med i den här körningen).
    const kvar = larm.filter((id) => !klarIds.has(id));
    await larma(kvar);
    // Bara antal, aldrig kund eller belopp.
    if (ids.length) console.info(`[kassa-stripe] ${ids.length} att slutföra: klara ${klara}, utan order ${utanOrder}, kvarstår ${kvarstar}, fel ${fel}, larm ${kvar.length}`);
    return NextResponse.json({ ok: fel === 0 && kvarstar === 0, attSlutfora: ids.length, klara, utanOrder, kvarstar, fel, larm: kvar.length });
  } catch (e) {
    console.error("[kassa-stripe] föll", e instanceof Error ? e.message.slice(0, 300) : String(e));
    return NextResponse.json({ ok: false, error: "stripe" }, { status: 500 });
  }
}
