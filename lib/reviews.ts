// Importerade AliExpress-recensioner (översatta till svenska) per produkt.
// Skrivs av cache-warmern (lib/store/reviews.ts → FyndplatsImportedReviews) och
// läses här server-side via Wix Data REST — samma WIX_API_KEY-mönster som
// lib/image-scores.ts. Visas som social proof + schema.org på produktsidan.

const WIX_BASE = "https://www.wixapis.com";
const COL = process.env.WIX_DATA_COL_REVIEWS || "FyndplatsImportedReviews";

export interface ProductReview {
  reviewIdAE: string;
  rating: number;
  text: string;
  customerName: string;
  customerCountry?: string;
  date?: string;
  hasImage: boolean;
  imageUrl?: string;
}

export interface ProductReviews {
  count: number;
  /** Snittbetyg (1 decimal) eller null om inga recensioner. */
  average: number | null;
  reviews: ProductReview[];
}

function wixDataHeaders(): Record<string, string> | null {
  const token = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) return null;
  return { "Content-Type": "application/json", Authorization: token, "wix-site-id": siteId };
}

interface WixReviewRow {
  reviewIdAE?: string;
  rating?: number;
  textSwedish?: string;
  textOriginal?: string;
  customerName?: string;
  customerCountry?: string;
  date?: string;
  hasImage?: boolean;
  imageUrl?: string;
  hidden?: boolean;
}

const EMPTY: ProductReviews = { count: 0, average: null, reviews: [] };

/**
 * Synliga (ej dolda) recensioner för en produkt, sorterade med foto + senaste
 * först. ISR-cachat 1 h. Returnerar tomt om token/kollektion saknas eller anropet
 * failar — produktsidan fungerar då precis som innan (ingen recensions-sektion).
 */
export async function getProductReviews(productId: string): Promise<ProductReviews> {
  const h = wixDataHeaders();
  if (!h || !productId) return EMPTY;
  try {
    const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        dataCollectionId: COL,
        query: { filter: { productId }, paging: { limit: 100 } },
      }),
      next: { revalidate: 3600, tags: ["reviews"] },
    });
    if (!res.ok) return EMPTY;
    const body = (await res.json()) as { dataItems?: { data?: WixReviewRow }[] };
    const rows = (body.dataItems || [])
      .map((d) => d.data)
      .filter((d): d is WixReviewRow => Boolean(d && !d.hidden && (d.textSwedish || d.textOriginal)));

    const reviews: ProductReview[] = rows.map((r) => ({
      reviewIdAE: String(r.reviewIdAE || ""),
      rating: Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))),
      text: String(r.textSwedish || r.textOriginal || ""),
      customerName: String(r.customerName || "Verifierad kund"),
      customerCountry: r.customerCountry ? String(r.customerCountry) : undefined,
      date: r.date ? String(r.date) : undefined,
      hasImage: Boolean(r.hasImage),
      imageUrl: r.hasImage && r.imageUrl ? String(r.imageUrl) : undefined,
    }));

    // Foto först, sedan senaste datum, sedan längst text — mest övertygande överst.
    reviews.sort((a, b) => {
      if (Number(b.hasImage) !== Number(a.hasImage)) return Number(b.hasImage) - Number(a.hasImage);
      const db = Date.parse(b.date || "") || 0;
      const da = Date.parse(a.date || "") || 0;
      if (db !== da) return db - da;
      return b.text.length - a.text.length;
    });

    const count = reviews.length;
    const average =
      count > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;
    return { count, average, reviews };
  } catch {
    return EMPTY;
  }
}
