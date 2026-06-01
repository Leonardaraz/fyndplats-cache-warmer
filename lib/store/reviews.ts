// FyndplatsImportedReviews — Wix Data-collection med importerade AliExpress-
// recensioner (översatta till svenska via DeepL). Visas som social proof på
// produktsidorna (headless-PDP) och modereras i cache-warmerns /admin/reviews.
//
// Schema (dataItem.data):
//   _id:           "{productId}__{reviewIdAE}" (komposit → unik per produkt)
//   productId:     Wix product-id
//   reviewIdAE:    AliExpress review-id (dedup-nyckel)
//   rating:        1-5
//   textOriginal:  rå recensionstext (engelska/kinesiska)
//   textSwedish:   DeepL-översatt svensk text (= textOriginal om budget slut)
//   customerName:  anonymiserat, t.ex. "Verifierad kund från Tyskland"
//   customerCountry: ISO-2 eller råtext (kan saknas)
//   date:          ISO-datum (kan saknas)
//   hasImage:      boolean
//   imageUrl:      string (om vi importerade recensionsbilden)
//   hidden:        boolean — satt av moderering i /admin/reviews (döljs på PDP)
//   importedAt:    ISO-datum
//
// Mönster speglar lib/store/import-costs.ts (Wix Data v2-REST, tolerera saknad
// kollektion som tom).

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

export interface StoredReview {
  productId: string;
  reviewIdAE: string;
  rating: number;
  textOriginal: string;
  textSwedish: string;
  customerName: string;
  customerCountry?: string;
  date?: string;
  hasImage: boolean;
  imageUrl?: string;
  hidden?: boolean;
  importedAt?: string;
}

/** Komposit-id: unikt per produkt även om samma reviewIdAE förekommer globalt. */
export function reviewDocId(productId: string, reviewIdAE: string): string {
  return `${productId}__${reviewIdAE}`;
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
            ...review,
            hidden: review.hidden ?? false,
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

  async setHidden(productId: string, reviewIdAE: string, hidden: boolean): Promise<void> {
    const id = reviewDocId(productId, reviewIdAE);
    const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(COLLECTION_ID)}`;
    const getRes = await fetch(url, { method: "GET", headers: headers() });
    if (!getRes.ok) {
      throw new Error(`ReviewStore.setHidden/get (${getRes.status})`);
    }
    const body = (await getRes.json()) as { dataItem?: { data?: StoredReview } };
    const existing = body.dataItem?.data;
    if (!existing) throw new Error(`ReviewStore.setHidden: ${id} saknas`);
    await this.upsert({ ...existing, hidden });
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
