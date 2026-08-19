// FyndplatsImportedReviews — Wix Data-collection med importerade AliExpress-
// recensioner (översatta till svenska i chatten). Visas som social proof på
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
//   textSwedish:    svensk text (= textOriginal tills någon skrivit om den;
//                   = Leonards redigerade text om status === "edited")
//   sourceLanguage: ursprungsspråk enligt AE (t.ex. "EN", "ZH") — BEVIS
//   customerNameRaw: rått AE-användarnamn (LAGRAS, visas ALDRIG) — BEVIS
//   initials:       visningsnamn "M.K." (förnamn- + efternamnsinitial)
//   customerCountry: ISO-2/landnamn (LAGRAS, visas ALDRIG)
//   date:           ISO-datum (kan saknas)
//   hasImage:       boolean
//   imageUrl:       string (om vi importerade recensionsbilden)
//   status:         "pending" | "approved" | "rejected" | "edited"
//   importedAt:     ISO-datum

import { isExternalSupplierImage, ownImageUrlForReview } from "../wix/media-import";
import { reviewImageFields, reviewImages } from "../reviews/images";

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
  /** Första bilden. Eget fält för bakåtkompatibilitet — se lib/reviews/images.ts. */
  imageUrl?: string;
  /** Hela bildlistan. Skrivs bara när recensionen har fler än en. */
  imageUrls?: string[];
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
 * Misslyckad import → raden lämnas ORÖRD, med leverantörsadressen kvar.
 *
 * Det är motsatt val mot `ownImageUrlForReview`, som utelämnar bilden vid fel —
 * och skillnaden är avsiktlig. Där skapas raden från grunden, så en utelämnad
 * bild kostar ingenting. Här UPPDATERAS en befintlig rad, och eftersom Wix
 * `items/save` är en helersättning (och JSON.stringify tappar `undefined`)
 * hade ett `undefined` raderat den enda pekaren till kundbilden. Ett 60
 * sekunder långt avbrott hos Wix media under en modereringsrunda hade då tyst
 * och oåterkalleligt slängt varje bild som godkändes i det fönstret — utan väg
 * att försöka igen, för källadressen är borta.
 *
 * Kvarlämnad leverantörsadress är däremot reparerbar: den syns i samma
 * kontroll som hittade de 44 ursprungliga (`imageUrl` som innehåller
 * leverantörens värd) och kan flyttas hem i efterhand.
 */
async function withOwnImage(review: StoredReview): Promise<StoredReview> {
  const bilder = reviewImages(review);
  // Ingen bild, eller inga som pekar på leverantören → rör inte raden. Att
  // skriva om den i onödan är inte gratis: items/save är en helersättning.
  if (bilder.length === 0 || !bilder.some(isExternalSupplierImage)) return review;

  // ALLA bilder, en i taget. Misslyckas EN behålls dess KÄLLADRESS — se noten
  // ovan om varför ett undefined vore oåterkalleligt. De som lyckades flyttas
  // hem ändå; en delvis hemflyttad rad är strikt bättre än ingen, och resten
  // syns i samma kontroll och kan tas om.
  const ut: string[] = [];
  let missar = 0;
  for (const [n, bild] of bilder.entries()) {
    if (!isExternalSupplierImage(bild)) {
      ut.push(bild);
      continue;
    }
    // Samma suffix-regel som importen: utan den skriver bild 2 och 3 över den
    // första i mediabiblioteket.
    const egen = await ownImageUrlForReview(
      bild,
      n === 0 ? review.reviewIdAE : `${review.reviewIdAE}-${n + 1}`,
    );
    ut.push(egen ?? bild);
    if (!egen) missar++;
  }
  if (missar > 0) {
    console.warn(
      `[reviews] kunde inte flytta hem ${missar} av ${bilder.length} kundbilder för ` +
        `${review.reviewIdAE} — behåller källadresserna för nytt försök.`,
    );
  }
  return { ...review, ...reviewImageFields(ut) };
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
