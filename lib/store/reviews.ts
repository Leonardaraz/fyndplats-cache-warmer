// FyndplatsImportedReviews — Wix Data-collection med importerade AliExpress-
// recensioner (översatta till svenska via DeepL). Visas som social proof på
// produktsidorna (headless-PDP) och modereras i cache-warmerns /admin/reviews.
//
// Integritets-/juridikdesign (2026-06-02):
//   - VISAR bara initialer ("M.K.") — aldrig fullständigt namn, aldrig land,
//     aldrig "Verifierad köpare" (den texten styrs av killswitch på PDP-sidan).
//   - LAGRAR full data internt för bevis (om Konsumentverket frågar): original-
//     text, översatt text, reviewIdAE, datum, ursprungsspråk, land och det råa
//     AE-användarnamnet. Vi byter ALDRIG namn baserat på ursprung — vi visar bara
//     inte hela förnamnet.
//
// Schema (dataItem.data):
//   _id:            "{productId}__{reviewIdAE}" (komposit → unik per produkt)
//   productId:      Wix product-id
//   reviewIdAE:     AliExpress review-id (dedup-nyckel)
//   rating:         1-5
//   textOriginal:   rå recensionstext (engelska/kinesiska) — BEVIS
//   textSwedish:    DeepL-översatt svensk text (= textOriginal om budget slut;
//                   = Leonards redigerade text om status === "edited")
//   sourceLanguage: detekterat ursprungsspråk från DeepL (t.ex. "EN", "ZH") — BEVIS
//   customerNameRaw: rått AE-användarnamn (LAGRAS, visas ALDRIG) — BEVIS
//   initials:       visningsnamn "M.K." (förnamn- + efternamnsinitial)
//   customerCountry: ISO-2/landnamn (LAGRAS, visas ALDRIG)
//   date:           ISO-datum (kan saknas)
//   hasImage:       boolean
//   imageUrl:       string (om vi importerade recensionsbilden)
//   status:         "pending" | "approved" | "rejected" | "edited"
//   importedAt:     ISO-datum

import { isExternalSupplierImage, ownImageUrlForReview } from "../wix/media-import";

const WIX_BASE = "https://www.wixapis.com";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const COLLECTION_ID =
  process.env.WIX_DATA_COL_REVIEWS ?? "FyndplatsImportedReviews";

export type ReviewStatus = "pending" | "approved" | "rejected" | "edited";

/** Status som visas publikt på produktsidan. */
export const VISIBLE_STATUSES: ReviewStatus[] = ["approved", "edited"];
export function isVisibleStatus(s: ReviewStatus | undefined): boolean {
  return s === "approved" || s === "edited";
}

export interface StoredReview {
  productId: string;
  reviewIdAE: string;
  rating: number;
  textOriginal: string;
  textSwedish: string;
  sourceLanguage?: string;
  /** Rått AE-användarnamn — LAGRAS för bevis, visas ALDRIG. */
  customerNameRaw?: string;
  /** Visningsnamn, t.ex. "M.K.". */
  initials: string;
  /** LAGRAS för bevis, visas ALDRIG. */
  customerCountry?: string;
  date?: string;
  hasImage: boolean;
  imageUrl?: string;
  status: ReviewStatus;
  importedAt?: string;
}

/** Komposit-id: unikt per produkt även om samma reviewIdAE förekommer globalt. */
export function reviewDocId(productId: string, reviewIdAE: string): string {
  return `${productId}__${reviewIdAE}`;
}

/**
 * Byter leverantörens bild-CDN mot vår egen adress INNAN raden blir synlig.
 *
 * Varför här och inte i kön: `lib/reviews/queue.ts` skriver med flit den råa
 * adressen och skjuter upp hemflytten till publiceringen — rader som aldrig
 * godkänns ska inte kosta medialagring. Men den utlovade hemflytten fanns
 * ingenstans i koden. Kön ställde in sig på att någon annan gjorde jobbet, och
 * ingen gjorde det: 44 publicerade recensioner låg 2026-08-18 kvar med
 * `aliexpress-media.com` i produktsidans HTML. Adressen står i klartext för den
 * som högerklickar på kundbilden.
 *
 * `upsert` är enda vägen in i kollektionen, så grinden sitter där i stället för
 * i varje anropare — då kan ingen ny publiceringsväg glömma den.
 *
 * Misslyckad import → bilden utelämnas (samma val som `ownImageUrlForReview`
 * redan gör). Att falla tillbaka på leverantörsadressen vore att återinföra
 * precis det vi tar bort, och recensionens värde ligger i texten.
 */
async function withOwnImage(review: StoredReview): Promise<StoredReview> {
  if (!isExternalSupplierImage(review.imageUrl)) return review;
  const egen = await ownImageUrlForReview(review.imageUrl, review.reviewIdAE);
  if (!egen) {
    console.warn(`[reviews] kunde inte flytta hem kundbild för ${review.reviewIdAE} — publiceras utan bild.`);
  }
  return { ...review, imageUrl: egen, hasImage: Boolean(egen) };
}

export class ReviewStore {
  async exists(productId: string, reviewIdAE: string): Promise<boolean> {
    const id = reviewDocId(productId, reviewIdAE);
    const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(COLLECTION_ID)}`;
    const res = await fetch(url, { method: "GET", headers: headers() });
    if (res.status === 404) return false;
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
        return false;
      }
      throw new Error(`ReviewStore.exists (${res.status}): ${text.slice(0, 200)}`);
    }
    return true;
  }

  async upsert(review: StoredReview): Promise<void> {
    const id = reviewDocId(review.productId, review.reviewIdAE);
    const status = review.status ?? "approved";
    const skickas = isVisibleStatus(status) ? await withOwnImage(review) : review;
    const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COLLECTION_ID,
        dataItem: {
          id,
          dataCollectionId: COLLECTION_ID,
          data: {
            _id: id,
            ...skickas,
            status,
            importedAt: review.importedAt ?? new Date().toISOString(),
          },
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ReviewStore.upsert (${res.status}): ${text.slice(0, 200)}`);
    }
  }

  async listByProduct(productId: string, limit = 100): Promise<StoredReview[]> {
    return this.query({ productId }, limit);
  }

  async listAll(limit = 1000): Promise<StoredReview[]> {
    return this.query({}, limit);
  }

  private async get(productId: string, reviewIdAE: string): Promise<StoredReview | null> {
    const id = reviewDocId(productId, reviewIdAE);
    const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(COLLECTION_ID)}`;
    const res = await fetch(url, { method: "GET", headers: headers() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`ReviewStore.get (${res.status})`);
    const body = (await res.json()) as { dataItem?: { data?: StoredReview } };
    return body.dataItem?.data ?? null;
  }

  /** Moderering: sätt status (godkänn/avvisa). */
  async setStatus(productId: string, reviewIdAE: string, status: ReviewStatus): Promise<void> {
    const existing = await this.get(productId, reviewIdAE);
    if (!existing) throw new Error(`ReviewStore.setStatus: ${reviewDocId(productId, reviewIdAE)} saknas`);
    await this.upsert({ ...existing, status });
  }

  /** Moderering: redigera den svenska texten (t.ex. liten typo) → status "edited". */
  async editText(productId: string, reviewIdAE: string, newSwedish: string): Promise<void> {
    const existing = await this.get(productId, reviewIdAE);
    if (!existing) throw new Error(`ReviewStore.editText: ${reviewDocId(productId, reviewIdAE)} saknas`);
    await this.upsert({ ...existing, textSwedish: newSwedish, status: "edited" });
  }

  private async query(filter: Record<string, unknown>, limit: number): Promise<StoredReview[]> {
    const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COLLECTION_ID,
        query: { filter, sort: [{ fieldName: "date", order: "DESC" }], paging: { limit } },
      }),
    });
    if (!res.ok) {
      if (res.status === 404) return [];
      const text = await res.text();
      if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
        return [];
      }
      throw new Error(`ReviewStore.query (${res.status}): ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as { dataItems?: { data?: StoredReview }[] };
    return (body.dataItems ?? [])
      .map((d) => d.data)
      .filter((d): d is StoredReview => Boolean(d?.productId && d?.reviewIdAE));
  }
}

let singleton: ReviewStore | null = null;
export function getReviewStore(): ReviewStore {
  if (!singleton) singleton = new ReviewStore();
  return singleton;
}
