// GET /api/auctions/rader?status=live|sold[&limit=N]
//
// Butikens läsväg till Fyndauktionen (/fyndauktion och startsidans banner).
// Butiken frågade tidigare Wix Data direkt; raderna flyttar till Postgres, och
// en butik som fortsatt läsa Wix hade efter raderingen visat en tom auktion
// utan ett enda fel. Motorn svarar ur det lager `AUCTIONS_BACKEND` pekar på,
// så butiken följer med i växlingen av sig själv.
//
// ☠️ Svaret är en allowlist (lib/auction/butiksvy.ts): golvet och
// varianttrackarna lämnar aldrig motorn. `lager` säger vilket lager som
// FAKTISKT svarade — en växling ska gå att se, inte antas.
//
//   status=live   alla live-rader (högst 50)
//   status=sold   de senast sålda, nyast först (limit, högst 50)

import { type NextRequest, NextResponse } from "next/server";
import { auktionslager, queryAuctions, senastSalda } from "@/lib/auction/store";
import { butikAuktoriserad, butiksrad } from "@/lib/auction/butiksvy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAK = 50;

export async function GET(req: NextRequest) {
  const auth = butikAuktoriserad(req.headers.get("authorization"));
  if (auth === "osatt") {
    return NextResponse.json({ ok: false, error: "REVIEW_INGEST_SECRET saknas — rutten är avstängd" }, { status: 503 });
  }
  if (auth === "nej") return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const status = p.get("status");
  if (status !== "live" && status !== "sold") {
    return NextResponse.json({ ok: false, error: 'status måste vara "live" eller "sold"' }, { status: 400 });
  }
  const begärt = Number(p.get("limit"));
  const limit = Number.isFinite(begärt) && begärt >= 1 ? Math.min(Math.floor(begärt), TAK) : TAK;

  try {
    const docs = status === "live" ? (await queryAuctions(["live"])).slice(0, TAK) : await senastSalda(limit);
    return NextResponse.json(
      { ok: true, lager: auktionslager(), rader: docs.map(butiksrad) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[auctions/rader] ${status}: ${msg}`);
    return NextResponse.json({ ok: false, error: msg.slice(0, 200) }, { status: 500 });
  }
}
