// Google Business Profile-omdömen för /omdomen. Hämtar ALLA omdömen via det
// officiella Business Profile-API:t (accounts.locations.reviews.list, v4) server-
// side, ISR-cachat. Kräver env (OAuth refresh token + konto/plats-ID). Saknas env
// eller failar anropet → tom lista och sidan ser ut precis som innan (graceful,
// fail-open — exakt samma mönster som lib/reviews.ts).
//
// Integritet/ToS: visar reviewerns PUBLIKA visningsnamn (som det står på Google)
// + "via Google"-attribution. Vi modifierar inte texten (utöver att föredra
// originalspråket när Google bifogar en maskinöversättning).
//
// SEO: vi lägger AVSIKTLIGT inte aggregateRating/Review-schema på Organization-
// entiteten (self-serving rating → Googles riktlinjer, manuell åtgärd-risk; se
// noten i lib/social-proof.ts). Detta är ENBART visuell visning.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVIEWS_BASE = "https://mybusiness.googleapis.com/v4";

/** En kundbild som hör till ett omdöme. Se `photos` nedan. */
export interface ReviewPhoto {
  /** URL till bilden. Wix-media eller /public — samma loader som allt annat. */
  src: string;
  /** Vad bilden visar, på svenska. Aldrig kundens namn — alt beskriver bilden. */
  alt: string;
}

export interface GoogleReview {
  id: string;
  rating: number; // 1..5
  text: string; // kan vara tom (stjärn-bara omdöme) → filtreras bort ur listan
  author: string; // reviewer.displayName (publikt på Google)
  date?: string; // createTime (ISO)
  /** KOMMER ALDRIG FRÅN API:T — bara från lib/curated-reviews.ts.
   *
   *  Business Profile-API:ts reviews-endpoint returnerar ingen media; kundbilder
   *  ligger i en helt egen media-endpoint utan koppling till omdömets id. Fältet
   *  fylls därför för hand. app/omdomen/page.tsx BYTER lista när API:t svarar,
   *  så då försvinner både de kurerade omdömena och deras bilder — se noten
   *  överst i curated-reviews.ts för vad som måste göras då. */
  photos?: ReviewPhoto[];
}

export interface GoogleReviewsResult {
  /** Totalt antal omdömen på profilen (även stjärn-bara), från API:t. */
  count: number;
  /** Snittbetyg (1 decimal) eller null. */
  average: number | null;
  /** Omdömen MED text, senaste först. */
  reviews: GoogleReview[];
}

const EMPTY: GoogleReviewsResult = { count: 0, average: null, reviews: [] };

const STAR: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function cfg() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const account = process.env.GOOGLE_GBP_ACCOUNT_ID;
  const location = process.env.GOOGLE_GBP_LOCATION_ID;
  if (!clientId || !clientSecret || !refreshToken || !account || !location) return null;
  return { clientId, clientSecret, refreshToken, account, location };
}

type Cfg = NonNullable<ReturnType<typeof cfg>>;

// Google bifogar ibland en maskinöversättning:
//   "(Translated by Google) <en>\n\n(Original)\n<sv>"
// Vi föredrar originaltexten (svenska) och tar bort wrapper-etiketterna.
function preferOriginal(comment: string): string {
  const idx = comment.lastIndexOf("(Original)");
  const base = idx >= 0 ? comment.slice(idx + "(Original)".length) : comment;
  return base.replace(/\(Translated by Google\)/g, "").trim();
}

async function getAccessToken(c: Cfg): Promise<string | null> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: c.clientId,
        client_secret: c.clientSecret,
        refresh_token: c.refreshToken,
        grant_type: "refresh_token",
      }),
      // Access-token lever ~1 h; cacha strax under det så vi inte växlar per request.
      next: { revalidate: 3000, tags: ["google-reviews"] },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { access_token?: string };
    return body.access_token || null;
  } catch {
    return null;
  }
}

interface RawReview {
  reviewId?: string;
  starRating?: string;
  comment?: string;
  createTime?: string;
  reviewer?: { displayName?: string };
}

/**
 * Alla omdömen (med text) från Google-företagsprofilen, senaste först. ISR-cachat
 * 6 h. Returnerar tomt om env saknas eller anropet failar → /omdomen fungerar då
 * precis som innan (ingen omdömes-sektion renderas).
 */
export async function getGoogleReviews(): Promise<GoogleReviewsResult> {
  const c = cfg();
  if (!c) return EMPTY;
  const token = await getAccessToken(c);
  if (!token) return EMPTY;

  try {
    const all: RawReview[] = [];
    let pageToken: string | undefined;
    let average: number | null = null;
    let total = 0;

    // Paginera 50/sida; tak på 6 sidor (300) som rimlighetsskydd.
    for (let page = 0; page < 6; page++) {
      const url = new URL(
        `${REVIEWS_BASE}/accounts/${c.account}/locations/${c.location}/reviews`,
      );
      url.searchParams.set("pageSize", "50");
      url.searchParams.set("orderBy", "updateTime desc");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 21600, tags: ["google-reviews"] },
      });
      if (!res.ok) break;
      const body = (await res.json()) as {
        reviews?: RawReview[];
        averageRating?: number;
        totalReviewCount?: number;
        nextPageToken?: string;
      };
      if (Array.isArray(body.reviews)) all.push(...body.reviews);
      if (typeof body.averageRating === "number") average = Math.round(body.averageRating * 10) / 10;
      if (typeof body.totalReviewCount === "number") total = body.totalReviewCount;
      pageToken = body.nextPageToken;
      if (!pageToken) break;
    }

    const reviews: GoogleReview[] = all
      .map((r) => ({
        id: String(r.reviewId || ""),
        rating: STAR[String(r.starRating || "")] || 0,
        text: preferOriginal(String(r.comment || "")),
        author: String(r.reviewer?.displayName || "").trim() || "Google-användare",
        date: r.createTime ? String(r.createTime) : undefined,
      }))
      .filter((r) => r.rating > 0 && r.text.length > 0)
      .sort((a, b) => (Date.parse(b.date || "") || 0) - (Date.parse(a.date || "") || 0));

    return { count: total || all.length, average, reviews };
  } catch {
    return EMPTY;
  }
}
