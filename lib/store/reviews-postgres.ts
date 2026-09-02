// Recensionslagret i Postgres.
//
// ☠️ VARFÖR DEN FINNS. Wix Data har ett GLOBALT tak på 4 000 rader över alla
// kollektioner. Efter att drift-datan flyttade (2026-08-31) ligger vi på
// ~3 355, och recensionerna är **2 514 av dem** — 75 % av allt som är kvar.
// Aosoms egna produktrecensioner är uppmätta till ~9 500 texter och får aldrig
// plats så länge raderna bor i Wix. Recensionerna är alltså inte offret för
// taket, de ÄR taket.
//
// ⚠️ ATT SKRIVA HIT FRIGÖR INGENTING I SIG. Taket rör sig först när
// Wix-raderna raderas, och det får inte ske förrän butiksrepot slutat läsa dem
// direkt (`lib/reviews.ts` och `lib/review-aggregates.ts` på grenen
// headless-site). Därför står `FyndplatsImportedReviews` kvar i
// `ALDRIG_RADERA`. Samma lärdom som spårningssidan gav 2026-09-01: en
// migrering är klar först när alla LÄSARE följt med, och en läsare som blir
// TOM syns varken i en kodaudit eller i en felräknare.
//
// AFFÄRSLOGIKEN DELAS, den kopieras inte. `normaliseraFörSkrivning` bor i
// reviews.ts och används av båda lagren — statusfallbacken och hemflytten av
// kundbilder är regler om recensioner, inte om databasen. En tvilling här hade
// betytt att en publicerad recension pekade på leverantörens CDN i det ena
// lagret men inte i det andra, beroende på vilken env-variabel som råkade vara
// satt. Samma skäl som `SHIP_AXIS_RE`, `EU_TULL_CODES` och `mapWithConcurrency`.

import { sql } from "../db/client";
import {
  MAX_LIST_ALL,
  VISIBLE_STATUSES,
  normaliseraFörSkrivning,
  reviewDocId,
  type ProduktBetyg,
  type ReviewStatus,
  type ReviewStoreLike,
  type StoredReview,
} from "./reviews";

/** Wix-metafälten följer med i den kopierade JSON:en. De hör inte till posten. */
function rensa(data: unknown): StoredReview {
  const d = { ...(data as Record<string, unknown>) };
  delete d._id;
  delete d._owner;
  delete d._createdDate;
  delete d._updatedDate;
  return d as unknown as StoredReview;
}

/** `date` är valfritt och ibland skräp. En ogiltig sträng blir null, aldrig NaN. */
function tidEller(v: unknown): string | null {
  return typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null;
}

export class PostgresReviewStore implements ReviewStoreLike {
  async exists(productId: string, reviewIdAE: string): Promise<boolean> {
    const q = sql();
    const rows = await q`select 1 from reviews where id = ${reviewDocId(productId, reviewIdAE)} limit 1`;
    return rows.length > 0;
  }

  async upsert(review: StoredReview): Promise<void> {
    const post = await normaliseraFörSkrivning(review);
    const id = reviewDocId(post.productId, post.reviewIdAE);
    const q = sql();
    await q`
      insert into reviews (id, product_id, review_id_ae, status, rating, date, data, updated_at)
      values (
        ${id}, ${post.productId}, ${post.reviewIdAE}, ${post.status},
        ${Number.isFinite(post.rating) ? post.rating : null},
        ${tidEller(post.date)}, ${JSON.stringify(post)}, now()
      )
      on conflict (id) do update set
        product_id   = excluded.product_id,
        review_id_ae = excluded.review_id_ae,
        status       = excluded.status,
        rating       = excluded.rating,
        date         = excluded.date,
        data         = excluded.data,
        updated_at   = now()
    `;
  }

  async listByProduct(productId: string, limit = 100): Promise<StoredReview[]> {
    const q = sql();
    const rows = await q`
      select data from reviews
       where product_id = ${productId}
       order by date desc nulls last
       limit ${limit}
    `;
    return rows.map((r) => rensa((r as { data: unknown }).data));
  }

  /**
   * Ett GROUP BY i stället för Wix aggregate-API. Samma svarsform, så butiken
   * inte kan märka vilket lager som svarade — det är hela poängen med att
   * migrera bakom ett interface.
   *
   * ☠️ Statusfiltret är `VISIBLE_STATUSES`, delat med Wix-lagret och med
   * `isVisibleStatus`. En tvilling här hade betytt att ett kort visar ett
   * snitt som produktsidan sedan inte kan belägga.
   */
  async aggregateByProduct(): Promise<ProduktBetyg[]> {
    const q = sql();
    const rows = await q`
      select product_id,
             count(*)::int            as antal,
             round(avg(rating)::numeric, 1) as snitt
        from reviews
       where status = any(${VISIBLE_STATUSES as unknown as string[]})
         and rating is not null
       group by product_id
    `;
    return (rows as { product_id: string; antal: number; snitt: string | number }[])
      .filter((r) => r.product_id && Number(r.antal) > 0)
      .map((r) => ({
        productId: r.product_id,
        antal: Number(r.antal),
        snitt: Number(r.snitt),
      }));
  }

  async listAll(limit = MAX_LIST_ALL): Promise<StoredReview[]> {
    const q = sql();
    const rows = await q`select data from reviews order by date desc nulls last limit ${limit}`;
    return rows.map((r) => rensa((r as { data: unknown }).data));
  }

  /**
   * ☠️ FILTRET KÖRS I DATABASEN, inte hos oss.
   *
   * En väntande rad kan ha vilket AE-datum som helst — recensionerna är ofta
   * månader gamla — så den kan ligga var som helst i den datumsorterade
   * listan. Att hämta "de nyaste N" och filtrera efteråt hittar den inte.
   * Regeln stod redan i Wix-versionen och gäller ordagrant här.
   */
  async listByStatus(status: ReviewStatus, limit = MAX_LIST_ALL): Promise<StoredReview[]> {
    const q = sql();
    const rows = await q`
      select data from reviews
       where status = ${status}
       order by date desc nulls last
       limit ${limit}
    `;
    return rows.map((r) => rensa((r as { data: unknown }).data));
  }

  private async get(productId: string, reviewIdAE: string): Promise<StoredReview | null> {
    const q = sql();
    const rows = await q`select data from reviews where id = ${reviewDocId(productId, reviewIdAE)} limit 1`;
    if (rows.length === 0) return null;
    return rensa((rows[0] as { data: unknown }).data);
  }

  /**
   * Moderering: sätt status.
   *
   * ☠️ KASTAR på en saknad rad, precis som Wix-versionen. Ett tyst no-op hade
   * varit exakt den bugg `link-ae-order` fick ett eget test för: `updateTask`
   * var en tyst no-op på en saknad rad i alla tre backends, och anroparen
   * trodde att skrivningen tagit.
   */
  async setStatus(productId: string, reviewIdAE: string, status: ReviewStatus): Promise<void> {
    const befintlig = await this.get(productId, reviewIdAE);
    if (!befintlig) {
      throw new Error(`PostgresReviewStore.setStatus: ${reviewDocId(productId, reviewIdAE)} saknas`);
    }
    await this.upsert({ ...befintlig, status });
  }

  /** Moderering: skriv om den svenska texten → status "edited". */
  async editText(productId: string, reviewIdAE: string, newSwedish: string): Promise<void> {
    const befintlig = await this.get(productId, reviewIdAE);
    if (!befintlig) {
      throw new Error(`PostgresReviewStore.editText: ${reviewDocId(productId, reviewIdAE)} saknas`);
    }
    await this.upsert({ ...befintlig, textSwedish: newSwedish, status: "edited" });
  }
}
