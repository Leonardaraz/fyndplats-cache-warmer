// Importerade AliExpress-recensioner (översatta till svenska) per produkt.
// Skrivs av cache-warmern (lib/store/reviews.ts → FyndplatsImportedReviews) och
// läses här server-side via Wix Data REST — samma WIX_API_KEY-mönster som
// lib/image-scores.ts. Visas som social proof + schema.org på produktsidan.
//
// Integritet: vi visar BARA initialer ("M.K."), aldrig namn eller land. Killswitch
// REVIEW_DISPLAY_MODE=verified_buyer byter alla visningsnamn till "Verifierad
// köpare" (panic-läge). Bara status approved/edited visas publikt.

import { reviewImages } from "./review-images";

const WIX_BASE = "https://www.wixapis.com";
const COL = process.env.WIX_DATA_COL_REVIEWS || "FyndplatsImportedReviews";

export interface ProductReview {
  reviewIdAE: string;
  /** True när omdömet är skrivet av en kund hos oss, inte importerat. */
  firstParty: boolean;
  rating: number;
  text: string;
  /** Visningsnamn enligt REVIEW_DISPLAY_MODE — "M.K." eller "Verifierad köpare". */
  displayName: string;
  date?: string;
  hasImage: boolean;
  /** Första bilden. Kvar för anropare som bara visar en. */
  imageUrl?: string;
  /** Alla bilder recensenten postade, i visningsordning. */
  imageUrls: string[];
}

export interface ProductReviews {
  count: number;
  /** Snittbetyg (1 decimal) eller null om inga recensioner. */
  average: number | null;
  reviews: ProductReview[];
  /** Antal omdömen skrivna av VÅRA kunder (source: "customer"). */
  firstPartyCount: number;
  /** Snittet för enbart dessa, eller null. */
  firstPartyAverage: number | null;
}

function reviewDisplayName(initials: string): string {
  const mode = (process.env.REVIEW_DISPLAY_MODE || "").toLowerCase();
  if (mode === "verified_buyer") return "Verifierad köpare";
  return initials || "Verifierad köpare";
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
  initials?: string;
  date?: string;
  hasImage?: boolean;
  imageUrl?: string;
  imageUrls?: unknown;
  status?: string;
  /** "customer" = skrivet av en kund hos oss. Saknas → gammal AE-import. */
  source?: string;
}

const EMPTY: ProductReviews = { count: 0, average: null, reviews: [], firstPartyCount: 0, firstPartyAverage: null };
const VISIBLE = new Set(["approved", "edited"]);

/**
 * Godkända (approved/edited) recensioner för en produkt, sorterade med foto +
 * senaste först. ISR-cachat 1 h. Returnerar tomt om token/kollektion saknas eller
 * anropet failar — produktsidan fungerar då precis som innan (ingen sektion).
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
      .filter((d): d is WixReviewRow =>
        Boolean(d && VISIBLE.has(String(d.status || "")) && (d.textSwedish || d.textOriginal)),
      );

    const reviews: ProductReview[] = rows.map((r) => ({
      reviewIdAE: String(r.reviewIdAE || ""),
      firstParty: String(r.source || "") === "customer",
      rating: Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))),
      text: String(r.textSwedish || r.textOriginal || ""),
      displayName: reviewDisplayName(String(r.initials || "")),
      date: r.date ? String(r.date) : undefined,
      // hasImage-flaggan avgör om bilder ska visas alls; listan läses ur BÅDA
      // fälten (se lib/review-images.ts om varför datamodellen är tvådelad).
      hasImage: Boolean(r.hasImage),
      imageUrl: r.hasImage && r.imageUrl ? String(r.imageUrl) : undefined,
      imageUrls: r.hasImage ? reviewImages(r) : [],
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

    // Egna kunders omdömen räknas SEPARAT. Bara de får någonsin bli
    // aggregateRating mot Google — importerade omdömen visas för kunden men
    // är inte vårt eget betyg, och att skicka dem som det vore att ljuga.
    const egna = reviews.filter((r) => r.firstParty);
    const firstPartyCount = egna.length;
    const firstPartyAverage =
      firstPartyCount > 0
        ? Math.round((egna.reduce((s, r) => s + r.rating, 0) / firstPartyCount) * 10) / 10
        : null;

    return { count, average, reviews, firstPartyCount, firstPartyAverage };
  } catch {
    return EMPTY;
  }
}
