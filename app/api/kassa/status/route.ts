// GET /api/kassa/status?order=<orderId>&betalning=<betalningId>
//
// Har ordern från vår kassa blivit betald, och går den väntande betalningen
// fortfarande att betala? Kassan frågar när kunden kommer tillbaka från Wix
// betalsida (som saknar en väg tillbaka till oss). En betalning som makulerats
// eller löpt ut visas aldrig som en länk: den leder till Wix sida "Det gick
// inte att öppna länken" (Leonards prov 2026-11-06). Svaret bär inget om kunden.

import { NextResponse } from "next/server";
import { arBetald, betalsidansAdress, hamtaBetalning, hamtaOrder } from "@/lib/kassa/wix-kassa";
import { KASSA_MARKOR } from "@/lib/kassa/flode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVAT = { "Cache-Control": "private, no-store" };
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Så länge en länk måste gälla för att kunden ska skickas dit. */
const MINST_KVAR_MS = 2 * 60_000;

export async function GET(req: Request) {
  const fraga = new URL(req.url).searchParams;
  const order = fraga.get("order") ?? "";
  const betalning = fraga.get("betalning") ?? "";
  if (!GUID.test(order)) return NextResponse.json({ ok: false }, { status: 400, headers: PRIVAT });
  try {
    const o = await hamtaOrder(order);
    if (!o) return NextResponse.json({ ok: true, finns: false, betald: false, betalbar: false }, { headers: PRIVAT });
    const betald = arBetald(o);
    const avbruten = o.status === "CANCELED";
    let betalbar = false;
    let url: string | undefined;
    let utgar: string | undefined;
    if (!betald && !avbruten && GUID.test(betalning)) {
      const b = await hamtaBetalning(betalning);
      const var_var = b?.orderId === order && (b.source?.externalId ?? "").startsWith(`${KASSA_MARKOR}:`);
      if (var_var && b?.status === "UNPAID" && Date.parse(b.expirationDate ?? "") - Date.now() > MINST_KVAR_MS) {
        betalbar = true;
        utgar = b.expirationDate;
        url = await betalsidansAdress(betalning);
      }
    }
    return NextResponse.json(
      {
        ok: true,
        finns: true,
        betald,
        avbruten,
        betalbar,
        ...(url ? { url, utgar } : {}),
        ...(betald && o.number && o.number !== "0" ? { nummer: o.number } : {}),
      },
      { headers: PRIVAT },
    );
  } catch (e) {
    console.error("[kassa] status föll:", e instanceof Error ? e.message.slice(0, 200) : e);
    return NextResponse.json({ ok: false }, { status: 502, headers: PRIVAT });
  }
}
