// Google Business Profile-omdömen för /omdomen. Två vägar, server-side + ISR-cachat:
//   1) Business Profile-API:t (v4) — ALLA omdömen, kräver OAuth (client id/secret +
//      refresh token) + konto/plats-ID. Bäst, men kräver Google-godkännande + OAuth.
//   2) Places API (fallback) — bara EN API-nyckel (GOOGLE_PLACES_API_KEY) + Place ID
//      (GOOGLE_PLACE_ID). Snabbt att aktivera; visar snittbetyg, totalt antal och upp
//      till 5 omdömen (Googles Places-tak). Används automatiskt när (1) saknar env.
// Saknas bägge eller failar anropet → tom lista och sidan ser ut precis som innan
// (graceful, fail-open — de kurerade äkta omdömena visas i stället).
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

export interface GoogleReview {
  id: string;
  rating: number; // 1..5
  text: string; // kan vara tom (stjärn-bara omdöme) → filtreras bort ur listan
  author: string; // reviewer.displayName (publikt på Google)
  date?: string; // createTime (ISO)
  photo?: string; // reviewerns publika Google-profilbild (Places ger den; GBP → saknas → initial-fallback)
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

// Fallback-väg: Google Places API (Place Details). Bara EN nyckel + Place ID,
// ingen OAuth eller Business-Profile-godkännande → snabbast att aktivera. Google
// returnerar snittbetyg, totalt antal omdömen och upp till 5 omdömen; "Se alla på
// Google"-länken på /omdomen tar besökaren till hela listan. Fail-open.
const PLACES_URL = "https://maps.googleapis.com/maps/api/place/details/json";

interface PlacesReview {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number; // unix-sekunder
  profile_photo_url?: string;
}

async function getPlacesReviews(): Promise<GoogleReviewsResult> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return EMPTY;
  try {
    const url = new URL(PLACES_URL);
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "rating,user_ratings_total,reviews");
    url.searchParams.set("reviews_sort", "newest");
    url.searchParams.set("reviews_no_translations", "true");
    url.searchParams.set("language", "sv");
    url.searchParams.set("key", key);
    const res = await fetch(url.toString(), {
      // 6 h ISR → ett Places-anrop var 6:e timme oavsett trafik = nära $0.
      next: { revalidate: 21600, tags: ["google-reviews"] },
    });
    if (!res.ok) return EMPTY;
    const body = (await res.json()) as {
      status?: string;
      result?: { rating?: number; user_ratings_total?: number; reviews?: PlacesReview[] };
    };
    if (body.status !== "OK" || !body.result) return EMPTY;
    const r = body.result;
    const average = typeof r.rating === "number" ? Math.round(r.rating * 10) / 10 : null;
    const count = typeof r.user_ratings_total === "number" ? r.user_ratings_total : 0;
    const reviews: GoogleReview[] = (r.reviews || [])
      .map((rv) => ({
        id: `${rv.time || ""}-${String(rv.author_name || "").slice(0, 16)}`,
        rating: Math.round(Number(rv.rating || 0)),
        text: preferOriginal(String(rv.text || "")),
        author: String(rv.author_name || "").trim() || "Google-användare",
        date: rv.time ? new Date(rv.time * 1000).toISOString() : undefined,
        photo: rv.profile_photo_url || undefined,
      }))
      .filter((rv) => rv.rating > 0 && rv.text.length > 0)
      .sort((a, b) => (Date.parse(b.date || "") || 0) - (Date.parse(a.date || "") || 0));
    return { count: count || reviews.length, average, reviews };
  } catch {
    return EMPTY;
  }
}

/**
 * Alla omdömen (med text) från Google-företagsprofilen, senaste först. ISR-cachat
 * 6 h. Föredrar Business-Profile-API:t (alla omdömen); saknas den OAuth-env:en
 * faller vi tillbaka på Places API (en nyckel + Place ID). Saknas bägge → tomt →
 * /omdomen visar de kurerade äkta omdömena precis som innan.
 */
export async function getGoogleReviews(): Promise<GoogleReviewsResult> {
  const c = cfg();
  if (!c) return getPlacesReviews();
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
