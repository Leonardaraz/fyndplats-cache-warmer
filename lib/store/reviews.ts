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
import { aggregera, allaRader, fraga, hamta, spara, type Sortering } from "../db/wix-data-klient";

const COLLECTION_ID =
  process.env.WIX_DATA_COL_REVIEWS ?? "FyndplatsImportedReviews";

export type ReviewStatus = "pending" | "approved" | "rejected" | "edited";

/** Wix Data tar max 1000 rader per fråga — vi paginerar med den sidstorleken. */
/** Nyast först: listorna i /admin/reviews och produktsidan sorterar så. Index i Wix (lib/db/wix-kollektioner.ts). */
const NYAST_FORST: Sortering = [{ fieldName: "date", order: "DESC" }];

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
    return (await hamta(COLLECTION_ID, reviewDocId(productId, reviewIdAE))) !== null;
  }

  async upsert(review: StoredReview): Promise<void> {
    const id = reviewDocId(review.productId, review.reviewIdAE);
    // Statusfallbacken och hemflytten av bilden bor i normaliseraFörSkrivning,
    // så Postgres-lagret lyder exakt samma regler. Se den funktionen.
    const skickas = await normaliseraFörSkrivning(review);
    await spara(COLLECTION_ID, id, { ...skickas } as Record<string, unknown>);
  }

  async listByProduct(productId: string, limit = 100): Promise<StoredReview[]> {
    return this.lista({ productId }, limit);
  }

  /**
   * Wix egen aggregering, grupperad på productId, SIDA FÖR SIDA.
   *
   * ☠️ Den gamla vägen bad om en sida på 1 000 grupper. Uppmätt 388 grupper
   * 2026-08-17 — men när datan flyttade tillbaka till Wix 2026-10-29 fanns
   * 14 973 omdömen, och fler än 1 000 produkter med omdömen hade fått sina
   * stjärnor tyst bortkapade från korten. `aggregera` läser till sista sidan,
   * sorterat på productId: osorterade sidor överlappar, och samma natt saknade
   * ~1 000 produkter sina stjärnor fast antalet rader stämde.
   */
  async aggregateByProduct(): Promise<ProduktBetyg[]> {
    const rader = await aggregera<{ productId?: string; antal?: number; snitt?: number }>(COLLECTION_ID, {
      initialFilter: { status: { $in: VISIBLE_STATUSES } },
      aggregation: {
        groupingFields: ["productId"],
        operations: [
          { resultFieldName: "antal", itemCount: {} },
          { resultFieldName: "snitt", average: { itemFieldName: "rating" } },
        ],
      },
    });
    return rader
      .filter((r) => r.productId && Number(r.antal) > 0)
      .map((r) => ({
        productId: String(r.productId),
        antal: Number(r.antal),
        snitt: Math.round(Number(r.snitt) * 10) / 10,
      }));
  }

  async listAll(limit = MAX_LIST_ALL): Promise<StoredReview[]> {
    return this.lista({}, limit);
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
    return this.lista({ status }, limit);
  }

  private async get(productId: string, reviewIdAE: string): Promise<StoredReview | null> {
    return hamta<StoredReview>(COLLECTION_ID, reviewDocId(productId, reviewIdAE));
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
   * Raderna som matchar filtret, nyast först, högst `limit`.
   *
   * Upp till en sida (1 000) är det EN fråga. Över det läses allt med markör
   * och kapas här — kollektionen passerade 1 000 rader 2026-08-19, och utan
   * markör var frågan tyst kapad: man fick de nyaste och fick aldrig veta att
   * resten fanns.
   */
  private async lista(filter: Record<string, unknown>, limit: number): Promise<StoredReview[]> {
    const rader =
      limit <= 1000
        ? await fraga<StoredReview>(COLLECTION_ID, { filter, sort: NYAST_FORST, limit })
        : (await allaRader<StoredReview>(COLLECTION_ID, { filter, sort: NYAST_FORST })).slice(0, limit);
    return rader.filter((d) => Boolean(d?.productId && d?.reviewIdAE));
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
