// GET /api/review-customer
//
// Alla GODKÄNDA omdömen från butikens EGNA kunder, i ett svar — underlaget för
// butikens produktomdömesflöde till Google Merchant Center
// (headless-site: app/feed/produktrecensioner.xml).
//
// VARFÖR DEN FINNS (Leonard 2026-09-26). Kundernas omdömen, insamlade via
// länken i leveransmejlet (/omdome/<token>), ska till Google som produktbetyg.
// Butiken kunde bara läsa omdömen produkt för produkt: 1 959 anrop för att
// hitta 4 rader, och 22 av dem föll i ett prov. Ett flöde som tappar rader
// tyst är värre än inget flöde — Google kräver ALLA omdömen, inte ett urval.
//
// BARA source === "customer". Importerade leverantörsomdömen får visas på
// produktsidan men aldrig skickas till Google som våra egna — samma regel som
// aggregateRating i butikens JSON-LD (isCustomerReview, lib/reviews/queue.ts).
//
// ☠️ EGET SEGMENT, inte /api/reviews/customer. Den adressen är butikens
// SKRIV-rutt (POST, bakom REVIEW_INGEST_SECRET), och allt annat under
// /api/reviews/ fångas av den dynamiska `[productId]`-rutten — se
// /api/review-aggregates för hur det felet ser ut (200 med fel form).
//
// Ingen auth: fälten är exakt de som redan visas publikt på produktsidan.
// Rånamn, land och ordernummer lämnar aldrig lagret, och initialerna
// redigeras bort när REVIEW_DISPLAY_MODE=verified_buyer.

import { NextResponse } from "next/server";
import { getReviewStore, VISIBLE_STATUSES, type StoredReview } from "@/lib/store/reviews";
import { reviewDisplayMode } from "@/lib/import/review-display";
import { isCustomerReview } from "@/lib/reviews/queue";

export const dynamic = "force-dynamic";

export interface CustomerReviewPublic {
  productId: string;
  reviewIdAE: string;
  rating: number;
  text: string;
  /** "M.K." — tom sträng när paniklaget är på. */
  initials: string;
  date?: string;
}

function toPublic(r: StoredReview): CustomerReviewPublic {
  return {
    productId: r.productId,
    reviewIdAE: r.reviewIdAE,
    rating: r.rating,
    text: r.textSwedish || r.textOriginal,
    initials: reviewDisplayMode() === "verified_buyer" ? "" : r.initials,
    ...(r.date ? { date: r.date } : {}),
  };
}

export async function GET() {
  try {
    const store = getReviewStore();
    const rader: StoredReview[] = [];
    for (const status of VISIBLE_STATUSES) rader.push(...(await store.listByStatus(status)));
    const egna = rader.filter(isCustomerReview).map(toPublic);
    // Stabil ordning: nyast först, sedan id. Flödet ska se likadant ut mellan
    // två hämtningar när inget ändrats.
    egna.sort((a, z) => (z.date ?? "").localeCompare(a.date ?? "") || a.reviewIdAE.localeCompare(z.reviewIdAE));
    return NextResponse.json(
      { ok: true, antal: egna.length, omdomen: egna },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    // ☠️ 502, INTE ETT TOMT SVAR. Noll egna omdömen är ett giltigt tillstånd,
    // så ett tomt 200 hade inte gått att skilja från en läsning som föll — och
    // flödet hade då sagt till Google att alla omdömen försvunnit.
    const message = err instanceof Error ? err.message : "Okänt fel";
    console.error("[api/review-customer] läsningen föll:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
