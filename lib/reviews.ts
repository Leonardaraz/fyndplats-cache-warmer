// Importerade och egna recensioner per produkt.
//
// ☠️ LÄSES VIA CACHE-WARMERNS API, INTE UR WIX DATA DIREKT (sedan 2026-09-02).
//
// Fram till dess frågade den här filen Wix Data rakt av. Det fungerade så
// länge recensionerna bodde där — men de flyttar till Postgres, eftersom Wix
// har ett GLOBALT tak på 4 000 rader och recensionerna är 2 514 av de ~3 355
// som är kvar. När Wix-raderna raderas hade den gamla vägen inte gått sönder:
// den hade blivit TOM. Produktsidan tappar hela sin recensionssektion, och
// varken en kodaudit eller en felräknare ser det, för ett tomt svar från rätt
// API mot rätt kollektion ser ut precis som ett friskt anrop.
//
// Det är exakt vad som hände /api/tracking-events 2026-09-01. Den läsaren är
// skälet till att den här skrivs om FÖRE raderingen och inte efter.
//
// Integritet: vi visar BARA initialer ("M.K."), aldrig namn eller land.
// Killswitchen REVIEW_DISPLAY_MODE=verified_buyer byter alla visningsnamn.
// ☠️ Den tillämpas i BÅDA projekten: API:t redigerar bort initialerna när dess
// egen switch är på, och den här filen gör om det på det den får. De två
// deploymenterna har varsin miljö, så en switch satt i bara det ena hade
// annars kunnat kringgås.

import { reviewImages } from "./review-images";
import { härkomst, normaliseraSource, type ReviewSource } from "./review-source";

/** Cache-warmern äger recensionslagret. Samma mönster som lib/ae-source.ts. */
const API_BAS =
  process.env.CACHE_WARMER_REVIEWS_URL
  ?? "https://fyndplats-cache-warmer.vercel.app/api/reviews";

export interface ProductReview {
  reviewIdAE: string;
  /** True när omdömet är skrivet av en kund hos oss, inte importerat. */
  firstParty: boolean;
  /** Varifrån raden kommer — styr etiketten. Se lib/review-source.ts. */
  source: ReviewSource;
  /** Kort etikett vid namnet ("✓ Verifierat köp", "Importerat omdöme", …). */
  ursprungEtikett: string;
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

/** Formen API:t svarar med. Fälten är redan publika — inga rånamn, inga land. */
interface ApiReview {
  reviewIdAE?: string;
  firstParty?: boolean;
  source?: string;
  rating?: number;
  text?: string;
  displayName?: string;
  initials?: string;
  date?: string;
  hasImage?: boolean;
  imageUrl?: string;
  imageUrls?: unknown;
}

const EMPTY: ProductReviews = {
  count: 0,
  average: null,
  reviews: [],
  firstPartyCount: 0,
  firstPartyAverage: null,
};

/**
 * Godkända recensioner för en produkt, sorterade med foto + senaste först.
 * ISR-cachat 1 h. Returnerar tomt om anropet failar — produktsidan fungerar då
 * precis som innan (ingen sektion), aldrig trasig.
 */
export async function getProductReviews(productId: string): Promise<ProductReviews> {
  if (!productId) return EMPTY;
  try {
    const res = await fetch(`${API_BAS}/${encodeURIComponent(productId)}`, {
      next: { revalidate: 3600, tags: ["reviews"] },
    });
    if (!res.ok) return EMPTY;
    const body = (await res.json()) as { reviews?: ApiReview[] };

    const reviews: ProductReview[] = (body.reviews || [])
      .filter((r) => r && String(r.text || "").trim().length > 0)
      .map((r) => {
        const source = normaliseraSource(r.source);
        const { etikett, förstahand } = härkomst(source);
        return {
          reviewIdAE: String(r.reviewIdAE || ""),
          // ☠️ Härledd ur source, inte ur API:ts firstParty-flagga. EN
          // definition av "vår kund", annars kan etiketten och flaggan säga
          // olika saker om samma rad.
          firstParty: förstahand,
          source,
          ursprungEtikett: etikett,
          rating: Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))),
          text: String(r.text || ""),
          // Initialerna är tomma när API:ts egen killswitch är på — då faller
          // reviewDisplayName tillbaka på "Verifierad köpare".
          displayName: reviewDisplayName(String(r.initials ?? r.displayName ?? "")),
          date: r.date ? String(r.date) : undefined,
          hasImage: Boolean(r.hasImage),
          imageUrl: r.hasImage && r.imageUrl ? String(r.imageUrl) : undefined,
          imageUrls: r.hasImage ? reviewImages(r) : [],
        };
      });

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

    return {
      count,
      average,
      reviews,
      firstPartyCount,
      firstPartyAverage,
    };
  } catch {
    return EMPTY;
  }
}
