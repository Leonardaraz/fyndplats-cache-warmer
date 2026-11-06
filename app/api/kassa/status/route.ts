// GET /api/kassa/status?order=<orderId>
//
// Har ordern från vår kassa blivit betald? Kassan frågar när kunden kommer
// tillbaka från Wix betalsida (som saknar en väg tillbaka till oss). Svaret
// bär bara om den är betald och ordernumret, inget om kunden.

import { NextResponse } from "next/server";
import { arBetald, hamtaOrder } from "@/lib/kassa/wix-kassa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVAT = { "Cache-Control": "private, no-store" };
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const order = new URL(req.url).searchParams.get("order") ?? "";
  if (!GUID.test(order)) return NextResponse.json({ ok: false }, { status: 400, headers: PRIVAT });
  try {
    const o = await hamtaOrder(order);
    if (!o) return NextResponse.json({ ok: true, finns: false, betald: false }, { headers: PRIVAT });
    const betald = arBetald(o);
    return NextResponse.json(
      { ok: true, finns: true, betald, avbruten: o.status === "CANCELED", ...(betald && o.number && o.number !== "0" ? { nummer: o.number } : {}) },
      { headers: PRIVAT },
    );
  } catch (e) {
    console.error("[kassa] status föll:", e instanceof Error ? e.message.slice(0, 200) : e);
    return NextResponse.json({ ok: false }, { status: 502, headers: PRIVAT });
  }
}
