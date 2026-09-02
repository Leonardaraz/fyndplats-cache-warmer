import { NextResponse } from "next/server";
import { reviewImages } from "@/lib/reviews/images";
import { getReviewStore, isVisibleStatus, type StoredReview } from "@/lib/store/reviews";
import { reviewDisplayMode, reviewDisplayName } from "@/lib/import/review-display";
import { isCustomerReview } from "@/lib/reviews/queue";

// Publik läs-endpoint: visar GODKÄNDA recensioner för en produkt. Headless-PDP:n
// läser normalt Wix Data direkt, men denna endpoint finns för felsökning/återbruk.
// Ingen auth — recensionerna är publik social proof. Returnerar BARA publika fält
// (visningsnamn enligt REVIEW_DISPLAY_MODE; original/land/rånamn utelämnas).

export const dynamic = "force-dynamic";

interface PublicReview {
  reviewIdAE: string;
  /**
   * True när raden är skriven av en av butikens EGNA kunder efter ett verifierat
   * köp, inte importerad från leverantören. Samma namn som headless-site:
   * lib/reviews.ts:101 använder, så de två vyerna av samma data stämmer överens.
   *
   * Fältet saknades här fram till 2026-08-22 — en konsument av den här rutten
   * kunde alltså inte skilja ett förstahandsomdöme från en AliExpress-import,
   * trots att bara det förra får räknas in i aggregateRating mot Google.
   */
  firstParty: boolean;
  rating: number;
  text: string;
  displayName: string;
  /**
   * Initialerna som de lagrats ("M.K.").
   *
   * ☠️ TOMSTRÄNG NÄR PANIKLÄGET ÄR PÅ. Butiken tillämpar sin EGEN
   * `REVIEW_DISPLAY_MODE` på det den får — men de två projekten har varsin
   * miljö, och en switch som bara är satt här hade annars kunnat kringgås av
   * att butiken läser `initials` i stället för `displayName`. Att redigera
   * bort dem HÄR gör att killswitchen biter oavsett vilket projekt den sitter
   * i. Rånamnet (`customerNameRaw`) lämnar aldrig lagret alls.
   */
  initials: string;
  /**
   * Radens ursprung: "customer" (vår egen kund), "aosom", eller utelämnat för
   * en AliExpress-import.
   *
   * ☠️ BUTIKEN MÅSTE KUNNA RENDERA HÄRKOMSTEN. Artikel 7.6 UCPD kräver
   * upplysning om huruvida recensionerna kommer från konsumenter som faktiskt
   * använt produkten, och bilaga I §23b förbjuder att presentera andras
   * omdömen som egna kunders. Utan fältet kan sidan inte följa reglerna —
   * `firstParty` räcker inte, för det säger bara "inte vår kund", inte vems.
   */
  source?: string;
  date?: string;
  hasImage: boolean;
  imageUrl?: string;
}

function toPublic(r: StoredReview): PublicReview {
  return {
    reviewIdAE: r.reviewIdAE,
    firstParty: isCustomerReview(r),
    rating: r.rating,
    text: r.textSwedish || r.textOriginal,
    displayName: reviewDisplayName(r.initials),
    // Redigeras bort när paniklaget är på — se fältets kommentar.
    initials: reviewDisplayMode() === "verified_buyer" ? "" : r.initials,
    ...(r.source ? { source: r.source } : {}),
    date: r.date,
    hasImage: Boolean(r.hasImage),
    ...(r.hasImage && r.imageUrl ? { imageUrl: r.imageUrl } : {}),
    // Hela listan också, annars ser den publika rutten bara en bild per
    // recension medan produktsidan visar alla (granskning 2026-08-19).
    ...(r.hasImage ? { imageUrls: reviewImages(r) } : {}),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  if (!productId) {
    return NextResponse.json({ error: "Saknar productId" }, { status: 400 });
  }

  let reviews: StoredReview[] = [];
  try {
    reviews = await getReviewStore().listByProduct(productId);
  } catch (err) {
    console.warn("[api/reviews] kunde inte läsa recensioner:", err instanceof Error ? err.message : err);
    return NextResponse.json({ productId, count: 0, average: null, reviews: [] }, { status: 200 });
  }

  const visible = reviews.filter((r) => isVisibleStatus(r.status));
  const average =
    visible.length > 0
      ? Math.round((visible.reduce((s, r) => s + r.rating, 0) / visible.length) * 10) / 10
      : null;

  return NextResponse.json(
    {
      productId,
      count: visible.length,
      average,
      reviews: visible.map(toPublic),
    },
    {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
