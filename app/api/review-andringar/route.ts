// GET /api/review-andringar?sedan=<ISO> — vilka produkter har fått ändrade
// recensioner sedan en tidpunkt?
//
// Butiken cachar produktsidor i sex timmar sedan 2026-10-01 och tömmer bara de
// produkter som ändrats. Wix-sidan av en ändring ser butiken själv (V3
// `updatedDate`), men recensionerna bor här i motorns Postgres. Butikens cron
// (/api/cron/uppdatera-andrade, var femte minut) frågar därför den här rutten
// och tömmer recensionerna för just de produkterna.
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
import { getReviewStore } from "@/lib/store/reviews";
import { PostgresReviewStore } from "@/lib/store/reviews-postgres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Längre bakåt än så är inte en ändringslista utan en export. */
const MAX_BAKAT_MS = 7 * 24 * 3600 * 1000;
/** Högst så många produkter per svar. Fler sätter `trunkerad: true`, så att
 *  butiken kan logga det i stället för att tro att listan är hel. */
const MAX_PRODUKTER = 2000;
const INGEN_CACHE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const auth = butikAuktoriserad(req.headers.get("authorization"));
  if (auth === "osatt") {
    return NextResponse.json({ ok: false, error: "REVIEW_INGEST_SECRET saknas — rutten är avstängd" }, { status: 503, headers: INGEN_CACHE });
  }
  if (auth === "nej") return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401, headers: INGEN_CACHE });

  const sedanText = req.nextUrl.searchParams.get("sedan");
  const sedan = sedanText ? Date.parse(sedanText) : NaN;
  const nu = Date.now();
  if (!Number.isFinite(sedan) || sedan < nu - MAX_BAKAT_MS || sedan > nu + 60_000) {
    return NextResponse.json(
      { ok: false, error: "`sedan` ska vara ett ISO-datum inom en vecka bakåt" },
      { status: 400, headers: INGEN_CACHE },
    );
  }

  const lager = getReviewStore();
  if (!(lager instanceof PostgresReviewStore)) {
    // Wix Data-lagret har ingen tidsstämpel att fråga på. Butiken tolkar svaret
    // som "vet inte", och då gäller produktsidans säkerhetsnät på sex timmar.
    return NextResponse.json(
      { ok: false, error: "bara Postgres-lagret har ändringstider" },
      { status: 501, headers: INGEN_CACHE },
    );
  }
  try {
    const lista = await lager.produkterAndradeSedan(new Date(sedan), MAX_PRODUKTER + 1);
    const trunkerad = lista.length > MAX_PRODUKTER;
    return NextResponse.json(
      { ok: true, sedan: new Date(sedan).toISOString(), produkter: lista.slice(0, MAX_PRODUKTER), ...(trunkerad ? { trunkerad } : {}) },
      { headers: INGEN_CACHE },
    );
  } catch (e) {
    // Detaljen till loggen, inte till svaret: ett databasfel kan bära namn på
    // tabeller och användare.
    console.error("[review-andringar] läsningen föll:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "kunde inte läsa recensionsändringarna" }, { status: 500, headers: INGEN_CACHE });
  }
}
