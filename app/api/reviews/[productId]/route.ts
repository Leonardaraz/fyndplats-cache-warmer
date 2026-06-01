import { NextResponse } from "next/server";
import { getReviewStore, type StoredReview } from "@/lib/store/reviews";

// Publik läs-endpoint: visar SYNLIGA (ej dolda) recensioner för en produkt.
// Headless-PDP:n hämtar den vid build/request för att rendera recensions-
// sektionen + schema.org. Ingen auth — recensionerna är publik social proof.
// Returnerar bara publika fält (originaltext utelämnas).

export const dynamic = "force-dynamic";

interface PublicReview {
  reviewIdAE: string;
  rating: number;
  text: string;
  customerName: string;
  customerCountry?: string;
  date?: string;
  hasImage: boolean;
  imageUrl?: string;
}

function toPublic(r: StoredReview): PublicReview {
  return {
    reviewIdAE: r.reviewIdAE,
    rating: r.rating,
    text: r.textSwedish || r.textOriginal,
    customerName: r.customerName,
    customerCountry: r.customerCountry,
    date: r.date,
    hasImage: Boolean(r.hasImage),
    ...(r.hasImage && r.imageUrl ? { imageUrl: r.imageUrl } : {}),
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
    // Saknad kollektion / Wix-fel → tom lista (PDP visar då ingen recension).
    console.warn("[api/reviews] kunde inte läsa recensioner:", err instanceof Error ? err.message : err);
    return NextResponse.json({ productId, count: 0, average: null, reviews: [] }, { status: 200 });
  }

  const visible = reviews.filter((r) => !r.hidden);
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
      // Cacha en timme på CDN; recensioner ändras sällan.
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
