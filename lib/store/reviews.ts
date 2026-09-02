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
import { reviewsBackend } from "./backend";
import { PostgresReviewStore } from "./reviews-postgres";
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

/** Wix Data tar max 1000 rader per fråga — vi paginerar med den sidstorleken. */
const QUERY_PAGE_SIZE = 500;

/**
 * Tak för hur många rader en listning hämtar. Inte en sanning om kollektionen,
 * bara ett skydd mot att en admin-sida försöker rendera obegränsat många.
 */
export const MAX_LIST_ALL = 5000;

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
  /**
   * Radens ursprung. `"customer"` = butikens EGEN kund, skriven via
   * /omdome/<token> efter ett verifierat köp (headless-site:lib/customer-review.ts).
   * Saknas fältet = importerad AliExpress-recension (alla rader före 2026-08-17).
   *
   * Fältet har alltid funnits i datan men saknades i typen, och därför läste
   * ingenting här det. Följden var att kundens SVENSKA omdöme flaggades
   * "oöversatt" och hamnade i översättningskön — se isAwaitingTranslation.
   */
  source?: string;
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

/**
 * Det som gäller om en recension oavsett VAR den lagras.
 *
 * ☠️ REGLER OM RECENSIONER, INTE OM DATABASEN — därför bor de här och inte i
 * varje lager. En tvilling hade betytt att en publicerad recension pekar på
 * leverantörens CDN i det ena lagret men inte i det andra, beroende på vilken
 * env-variabel som råkade vara satt. Samma skäl som `SHIP_AXIS_RE`,
 * `EU_TULL_CODES` och `mapWithConcurrency` har en enda definition.
 *
 * Två regler:
 *
 * 1. **Statusfallbacken pekar åt det SÄKRA hållet.** Den var "approved" fram
 *    till 2026-08-19, vilket var rimligt när DeepL översatte varje rad innan
 *    den skrevs — men numera är texten källspråket tills en människa skrivit
 *    om den. En anropare som glömmer sätta status ska hamna i modereringskön,
 *    inte på produktsidan. Alla nuvarande anropare sätter den explicit; det
 *    här är nätet under dem.
 * 2. **Bilden flyttas hem först vid publicering.** En `pending`-rad som pekar
 *    på aliexpress-media.com är NORMALT, inte ett fel — att flytta hem bilder
 *    för rader som kanske aldrig godkänns vore slöseri med både anrop och
 *    medialagring. Se avsnittet om recensionsbilder i CLAUDE.md.
 */
export async function normaliseraFörSkrivning(review: StoredReview): Promise<StoredReview> {
  const status = review.status ?? "pending";
  const medBild = isVisibleStatus(status) ? await withOwnImage(review) : review;
  return {
    ...medBild,
    status,
    importedAt: review.importedAt ?? new Date().toISOString(),
  };
}

/**
 * Vad ett recensionslager kan. Wix- och Postgres-versionen implementerar den
 * här, så anroparna aldrig behöver veta vilken som är i drift.
 */
export interface ProduktBetyg {
  productId: string;
  antal: number;
  /** Snitt med en decimal. */
  snitt: number;
}

export interface ReviewStoreLike {
  exists(productId: string, reviewIdAE: string): Promise<boolean>;
  /**
   * Antal + snitt per produkt för HELA katalogen, i ETT anrop.
   *
   * ☠️ EN FRÅGA, INTE EN PER PRODUKT. Butikens listningssidor visar stjärnor på
   * varje kort; den naiva vägen hade blivit 24+ anrop per sida och ~800 på
   * /alla-produkter. Samma form som `listV3ProductPrices` löste för priserna.
   *
   * Bara publikt synliga statusar räknas — ett kort får aldrig visa ett snitt
   * som produktsidan sedan inte kan belägga.
   */
  aggregateByProduct(): Promise<ProduktBetyg[]>;
  upsert(review: StoredReview): Promise<void>;
  listByProduct(productId: string, limit?: number): Promise<StoredReview[]>;
  listAll(limit?: number): Promise<StoredReview[]>;
  listByStatus(status: ReviewStatus, limit?: number): Promise<StoredReview[]>;
  setStatus(productId: string, reviewIdAE: string, status: ReviewStatus): Promise<void>;
  editText(productId: string, reviewIdAE: string, newSwedish: string): Promise<void>;
}

export class ReviewStore implements ReviewStoreLike {
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
    // Statusfallbacken och hemflytten av bilden bor i normaliseraFörSkrivning,
    // så Postgres-lagret lyder exakt samma regler. Se den funktionen.
    const skickas = await normaliseraFörSkrivning(review);
    const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COLLECTION_ID,
        dataItem: {
          id,
          dataCollectionId: COLLECTION_ID,
          data: { _id: id, ...skickas },
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

  /** Wix egen aggregering, grupperad på productId. Uppmätt 388 grupper /
   *  1 695 omdömen i ETT svar (butiken 2026-08-17). */
  async aggregateByProduct(): Promise<ProduktBetyg[]> {
    const res = await fetch(`${WIX_BASE}/data/v2/items/aggregate`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COLLECTION_ID,
        initialFilter: { status: { $in: VISIBLE_STATUSES } },
        aggregation: {
          groupingFields: ["productId"],
          operations: [
            { resultFieldName: "antal", itemCount: {} },
            { resultFieldName: "snitt", average: { itemFieldName: "rating" } },
          ],
        },
        // Katalogen har ~390 produkter med omdömen. Taket är satt med marginal
        // så svaret ryms i en sida.
        paging: { limit: 1000 },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ReviewStore.aggregateByProduct (${res.status}): ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as {
      results?: { productId?: string; antal?: number; snitt?: number }[];
    };
    return (body.results ?? [])
      .filter((r) => r.productId && Number(r.antal) > 0)
      .map((r) => ({
        productId: String(r.productId),
        antal: Number(r.antal),
        snitt: Math.round(Number(r.snitt) * 10) / 10,
      }));
  }

  async listAll(limit = MAX_LIST_ALL): Promise<StoredReview[]> {
    return this.query({}, limit);
  }

  /**
   * Bara en status — vad /admin/reviews behöver för att hitta det som väntar.
   *
   * Filtret körs hos Wix, inte hos oss. Skillnaden är hela poängen: en
   * väntande rad kan ha vilket AE-datum som helst (recensionerna är ofta
   * månader gamla), så den kan ligga var som helst i den datumsorterade
   * listan. Att hämta "de nyaste N" och filtrera efteråt hittar den inte.
   */
  async listByStatus(status: ReviewStatus, limit = MAX_LIST_ALL): Promise<StoredReview[]> {
    return this.query({ status }, limit);
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

  /**
   * Hämtar ALLA rader som matchar filtret, sida för sida.
   *
   * Wix Data tar max 1000 per fråga, och kollektionen passerade det för länge
   * sedan (1932 rader 2026-08-19). Utan paginering var frågan tyst kapad: man
   * fick de 1000 nyaste och fick aldrig veta att resten fanns. Det spelade
   * mindre roll när importerade recensioner auto-godkändes och aldrig behövde
   * öppnas — men sedan 2026-08-19 är /admin/reviews enda vägen från `pending`
   * till publicerad, och en rad som inte syns där kan aldrig bli svensk.
   *
   * Dubbletter dedupas på dokument-id: sorteringen sker på `date`, som både
   * kan sakna värde och ha dubbletter, så en rad kan i teorin dyka upp i två
   * sidor när gränsen går mitt i en grupp lika värden.
   */
  private async query(filter: Record<string, unknown>, limit: number): Promise<StoredReview[]> {
    const ut: StoredReview[] = [];
    const sedda = new Set<string>();
    for (let offset = 0; ut.length < limit; offset += QUERY_PAGE_SIZE) {
      const sida = await this.queryPage(filter, Math.min(QUERY_PAGE_SIZE, limit - ut.length), offset);
      for (const r of sida) {
        const id = reviewDocId(r.productId, r.reviewIdAE);
        if (sedda.has(id)) continue;
        sedda.add(id);
        ut.push(r);
      }
      // Kortare sida än vi bad om = sista sidan.
      if (sida.length < QUERY_PAGE_SIZE) break;
    }
    return ut;
  }

  private async queryPage(
    filter: Record<string, unknown>,
    limit: number,
    offset: number,
  ): Promise<StoredReview[]> {
    const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COLLECTION_ID,
        query: { filter, sort: [{ fieldName: "date", order: "DESC" }], paging: { limit, offset } },
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

let singleton: ReviewStoreLike | null = null;

/**
 * Väljer recensionslager på `REVIEWS_BACKEND` — EGEN switch, inte `STORE_BACKEND`.
 *
 * ☠️ Skälet står i `reviewsBackend()`: produktionen står redan på postgres, så
 * en delad variabel hade växlat lagret i samma sekund koden deployades — in i
 * en TOM tabell, utan att något kastade. Default är `"wix-data"` tills kopian
 * är verifierad.
 *
 * ☠️ VIA `backend.ts`, ALDRIG genom att läsa env här. Den filen är enda
 * läsaren av backend-variablerna, och ett källkodstest fäller om någon annan
 * fil nämner dem.
 *
 * `"memory"` ger Wix-lagret, precis som förut. Det ser inkonsekvent ut men är
 * med flit: recensionerna har aldrig haft något minneslager, och att införa
 * ett här hade ändrat vad dev och tester kör mot i samma ändring som flyttar
 * produktionsdatan. En sak i taget.
 */
export function getReviewStore(): ReviewStoreLike {
  singleton ??= skapaReviewStore();
  return singleton;
}

// Egen funktion i stället för tilldelningar i en switch: då blir switchen
// UTTÖMMANDE mot `StoreBackend`, och ett nytt backend-värde blir ett
// kompileringsfel här i stället för ett tyst fel i drift. Samma mönster som
// `skapaStore` i factory.ts.
function skapaReviewStore(): ReviewStoreLike {
  switch (reviewsBackend()) {
    case "postgres":
      return new PostgresReviewStore();
    case "memory":
    case "wix-data":
      return new ReviewStore();
  }
}

/** Endast för tester: tvingar fram ett nytt val vid nästa getReviewStore(). */
export function __resetReviewStoreForTests(): void {
  singleton = null;
}
