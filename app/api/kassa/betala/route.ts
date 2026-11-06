// POST /api/kassa/betala  { cartId, epost, fornamn, efternamn, telefon, gata, co?, postnr, ort, kupong?, tidigare? }
//
// Formuläret i vår kassa → Wix order och betalningsbegäran → adressen till Wix
// betalsida. Flödet och skälen står i lib/kassa/flode.ts. Beloppet kommer bara
// från Wix; kunden skickar aldrig ett pris.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { egenKassa, kassaLage, PROV_KAKA } from "@/lib/kassa/lage";
import { provaKassa } from "@/lib/kassa/formular";
import { betala, medTider, tidrad } from "@/lib/kassa/flode";
import { wixKassa } from "@/lib/kassa/wix-kassa";
import { WixApiError } from "@/lib/wix-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PRIVAT = { "Cache-Control": "private, no-store" };
const svar = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: PRIVAT });
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function tidigare(v: unknown): { orderId: string; betalningId: string } | null {
  if (!v || typeof v !== "object") return null;
  const t = v as Record<string, unknown>;
  return typeof t.orderId === "string" && GUID.test(t.orderId) && typeof t.betalningId === "string" && GUID.test(t.betalningId)
    ? { orderId: t.orderId, betalningId: t.betalningId }
    : null;
}

export async function POST(req: Request) {
  if (!egenKassa(await kassaLage(), (await cookies()).get(PROV_KAKA)?.value)) {
    return svar({ ok: false, kod: "stangd", meddelanden: ["Kassan är stängd just nu. Gå tillbaka till varukorgen och försök igen."] }, 503);
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return svar({ ok: false, kod: "fel", meddelanden: ["Formuläret kom inte fram. Försök igen."] }, 400);
  }
  const cartId = typeof body.cartId === "string" ? body.cartId : "";
  if (!GUID.test(cartId)) return svar({ ok: false, kod: "korg", meddelanden: ["Varukorgen hittades inte. Gå tillbaka till butiken."] }, 400);

  const prov = provaKassa(body);
  if (!prov.ok) return svar({ ok: false, kod: "formular", fel: prov.fel }, 400);

  // Tiden per Wix-anrop står i loggen (inga uppgifter om kunden), så att det
  // syns var kundens väntan går.
  const tider: Record<string, number[]> = {};
  const start = Date.now();
  try {
    const utfall = await betala(
      medTider(wixKassa, tider),
      { cartId, kund: prov.varden, tidigare: tidigare(body.tidigare), forsokId: Date.now().toString(36) },
      new Date(),
    );
    if (utfall.ok) console.info(`[kassa] betalsida ${utfall.aterbrukad ? "återanvänd" : "skapad"} på ${Date.now() - start} ms: ${tidrad(tider)}`);
    else console.info(`[kassa] stopp: ${utfall.kod} efter ${Date.now() - start} ms: ${tidrad(tider)}`);
    return svar(utfall, utfall.ok ? 200 : 409);
  } catch (e) {
    // Bara Wix fel hamnar här. Ingen kunddata i loggen: Actions- och Vercel-loggar läses av fler.
    console.error(`[kassa] betalningen föll efter ${Date.now() - start} ms (${tidrad(tider)}):`, e instanceof Error ? e.message.slice(0, 300) : e);
    // Wix nekar fler ordrar för samma köpare en stund efter många försök (429):
    // det går över av sig själv, så kunden får veta att vänta.
    if (e instanceof WixApiError && e.status === 429) {
      return svar({ ok: false, kod: "upptagen", meddelanden: ["Betalningen öppnades inte: för många försök på kort tid. Vänta en minut och tryck igen."] }, 429);
    }
    return svar({ ok: false, kod: "wix", meddelanden: ["Vi kunde inte öppna betalningen just nu. Försök igen om en stund."] }, 502);
  }
}
