// GET /api/cron/kassa-stadning (Vercel cron, varje timme)
//
// ☠️ En order från vår kassa reserverar lagret från det att den skapas
// (lib/kassa/flode.ts). En kund som lämnar betalsidan utan att betala håller
// alltså varan. Det här jobbet släpper de ordrarna när betalningslänken löpt
// ut: betalningen makuleras och ordern avbryts med återlagring, utan mejl.
// Bara betalningar med kassans markör rörs, och aldrig en betald order.

import { NextResponse } from "next/server";
import { attSlappa } from "@/lib/kassa/flode";
import { senasteKassaBetalningar, slappOrder } from "@/lib/kassa/wix-kassa";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PER_KORNING = 30;

function behorig(req: Request): boolean {
  const vantad = process.env.CRON_SECRET;
  if (!vantad) return process.env.VERCEL_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${vantad}`;
}

export async function GET(req: Request) {
  if (!behorig(req)) return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  try {
    const kandidater = attSlappa(await senasteKassaBetalningar(100), new Date()).slice(0, MAX_PER_KORNING);
    let slappta = 0;
    let betalda = 0;
    let fel = 0;
    for (const k of kandidater) {
      try {
        const r = await slappOrder(k.orderId, k.betalningId, null);
        if (r === "slappt") slappta++;
        else if (r === "betald") betalda++;
      } catch (e) {
        fel++;
        console.error("[kassa-stadning] kunde inte släppa en order:", e instanceof Error ? e.message.slice(0, 200) : e);
      }
    }
    // Tyst när inget fanns att göra; bara antal, aldrig kund eller order.
    if (slappta || fel) console.info(`[kassa-stadning] släppta ${slappta}, betalda ${betalda}, fel ${fel} av ${kandidater.length}`);
    return NextResponse.json({ ok: fel === 0, kandidater: kandidater.length, slappta, betalda, fel });
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 300) : String(e);
    console.error("[kassa-stadning] föll", msg);
    return NextResponse.json({ ok: false, error: "wix" }, { status: 500 });
  }
}
