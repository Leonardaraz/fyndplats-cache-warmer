// GET /api/review-andringar?sedan=<ISO> — vilka produkter har fått ändrade
// recensioner sedan en tidpunkt?
//
// Butiken cachar produktsidor i sex timmar sedan 2026-10-01 och tömmer bara de
// produkter som ändrats. Butikens cron (/api/cron/uppdatera-andrade, var femte
// minut) frågar den här rutten och tömmer recensionerna för just de produkterna.
//
// ☠️ SVARAR 501 SEDAN 2026-10-29. Ändringstiderna fanns bara i Postgres, och
// recensionerna bor i Wix sedan flytten tillbaka; Postgres-vägen togs bort
// 2026-11-05. Butiken tolkar 501 som "vet inte", och då gäller produktsidans
// säkerhetsnät på sex timmar. Vägen tillbaka är en fråga på Wix `_updatedDate`
// (docs/claude/24-initialerna.md) — ett eget bygge.
//
// EGET SEGMENT med flit, inte /api/reviews/<något>: den adressen fångas av
// [productId]-rutten och svarar 200 med fel form (se butikens
// lib/review-aggregates.ts om samma fälla).
//
// Svaret är bara produkt-id:n — inga texter, inga namn. AUTH som
// /api/auctions/avsluta: Bearer REVIEW_INGEST_SECRET (eller CRON_SECRET), den
// hemlighet butiken och motorn redan delar.

import { type NextRequest, NextResponse } from "next/server";
import { butikAuktoriserad } from "@/lib/auction/butiksvy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INGEN_CACHE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const auth = butikAuktoriserad(req.headers.get("authorization"));
  if (auth === "osatt") {
    return NextResponse.json({ ok: false, error: "REVIEW_INGEST_SECRET saknas — rutten är avstängd" }, { status: 503, headers: INGEN_CACHE });
  }
  if (auth === "nej") return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401, headers: INGEN_CACHE });

  // Wix Data-lagret har ingen tidsstämpel att fråga på här. Butiken tolkar
  // svaret som "vet inte", och då gäller produktsidans säkerhetsnät på sex timmar.
  return NextResponse.json(
    { ok: false, error: "recensionernas ändringstider finns inte i Wix-lagret" },
    { status: 501, headers: INGEN_CACHE },
  );
}
