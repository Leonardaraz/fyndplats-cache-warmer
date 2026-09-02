// GET /api/admin/review-backend-diff
//
// Läser recensionsaggregatet ur BÅDA lagren och jämför. Skriver ingenting.
//
// ☠️ PRE-FLIGHT FÖR STEG 3, inte en obduktion efter den. Växlingen
// `REVIEWS_BACKEND=postgres` byter databas under butikens stjärnor. Går något
// fel i den kopian svarar båda lagren ändå 200 med ett giltigt aggregat, och
// ett kort som tappat sitt betyg ser ut precis som en produkt utan omdömen.
// Sjunde gången samma lärdom: ett svar utan fel är inget kvitto.
//
// ☠️ BÅDA LAGREN INSTANTIERAS DIREKT, aldrig via `getReviewStore()`. Den
// fabriken returnerar det lager env-variabeln pekar på — alltså exakt ETT av
// de två — och en jämförelse av ett lager mot sig självt hade lyst grönt
// oavsett hur kopian ser ut. Det är hela poängen med rutten.
//
// Nyckel-löst på husets sätt: produktionen har WIX_API_TOKEN och DATABASE_URL,
// Actions har CRON_SECRET, och de möts i workflowen ("Migrering — kopiera
// drift-datan till Postgres", läget `betyg-diff`).

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { ReviewStore } from "@/lib/store/reviews";
import { PostgresReviewStore } from "@/lib/store/reviews-postgres";
import { jamforBetyg } from "@/lib/store/review-backend-diff";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // ☠️ Sekventiellt och var för sig, inte Promise.all. Faller den ena vill vi
  // veta VILKEN och varför — en samlad rejection hade gett ett meddelande som
  // inte säger vilket lager som är trasigt, och det är hela diagnosen.
  let wix;
  try {
    wix = await new ReviewStore().aggregateByProduct();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[review-backend-diff] Wix-läsningen föll:", message);
    return NextResponse.json({ ok: false, sida: "wix", error: message }, { status: 502 });
  }

  let postgres;
  try {
    postgres = await new PostgresReviewStore().aggregateByProduct();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[review-backend-diff] Postgres-läsningen föll:", message);
    return NextResponse.json({ ok: false, sida: "postgres", error: message }, { status: 502 });
  }

  const diff = jamforBetyg(wix, postgres);
  if (!diff.saker) console.warn("[review-backend-diff] EJ SÄKER:", diff.varning);

  return NextResponse.json({ ok: true, diff }, { status: 200 });
}
