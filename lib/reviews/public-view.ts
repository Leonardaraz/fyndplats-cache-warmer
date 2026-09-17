// lib/reviews/public-view.ts
//
// Den PUBLIKA formen av en recension — och den enda.
//
// ☠️ VARFÖR DEN FLYTTADE HIT. Formen bodde privat i
// `app/api/reviews/[productId]/route.ts`. När ögonblicksbilden
// (lib/reviews/snapshot.ts) började svara på samma fråga fanns plötsligt TVÅ
// vägar till samma JSON: bilden när den finns, rutten när den inte gör det. En
// tvilling där hade betytt att butiken får olika fält beroende på vilken väg
// svaret råkade ta — och skillnaden hade synts först som en saknad
// härkomst-etikett på en produktsida, aldrig som ett fel i en logg.
//
// Samma regel som `normaliseraFörSkrivning` i lib/store/reviews.ts: den delade
// formen delas, den kopieras inte. Se även `SHIP_AXIS_RE` och `EU_TULL_CODES`.

import { reviewImages } from "./images";
import { isCustomerReview } from "./queue";
import { reviewDisplayMode, reviewDisplayName } from "../import/review-display";
import type { StoredReview } from "../store/reviews";

export interface PublicReview {
  reviewIdAE: string;
  /**
   * True när raden är skriven av en av butikens EGNA kunder efter ett verifierat
   * köp, inte importerad från leverantören. Samma namn som headless-site:
   * lib/reviews.ts använder, så de två vyerna av samma data stämmer överens.
   */
  firstParty: boolean;
  rating: number;
  text: string;
  displayName: string;
  /**
   * Initialerna som de lagrats ("M.K.").
   *
   * ☠️ TOMSTRÄNG NÄR PANIKLÄGET ÄR PÅ. Butiken tillämpar sin EGEN
   * `REVIEW_DISPLAY_MODE` på det den får — men de två projekten har varsin
   * miljö, och en switch som bara är satt här hade annars kunnat kringgås av
   * att butiken läser `initials` i stället för `displayName`. Att redigera bort
   * dem HÄR gör att killswitchen biter oavsett vilket projekt den sitter i.
   * Rånamnet (`customerNameRaw`) lämnar aldrig lagret alls.
   */
  initials: string;
  /**
   * Radens ursprung: "customer" (vår egen kund), "aosom", eller utelämnat för
   * en AliExpress-import.
   *
   * ☠️ BUTIKEN MÅSTE KUNNA RENDERA HÄRKOMSTEN. Artikel 7.6 UCPD kräver
   * upplysning om huruvida recensionerna kommer från konsumenter som faktiskt
   * använt produkten, och bilaga I §23b förbjuder att presentera andras
   * omdömen som egna kunders. `firstParty` räcker inte — det säger bara "inte
   * vår kund", inte vems.
   */
  source?: string;
  date?: string;
  hasImage: boolean;
  imageUrl?: string;
  /** Alla bilder recensenten postade. Utelämnas helt när `hasImage` är falskt. */
  imageUrls?: string[];
}

/**
 * Lagerrad → publik rad. ENDA stället formen byggs.
 *
 * ☠️ Läser `reviewDisplayMode()` vid varje anrop, inte vid modulladdning.
 * Killswitchen ska bita på nästa svar, inte på nästa deploy.
 */
export function toPublicReview(r: StoredReview): PublicReview {
  return {
    reviewIdAE: r.reviewIdAE,
    firstParty: isCustomerReview(r),
    rating: r.rating,
    text: r.textSwedish || r.textOriginal,
    displayName: reviewDisplayName(r.initials),
    initials: reviewDisplayMode() === "verified_buyer" ? "" : r.initials,
    ...(r.source ? { source: r.source } : {}),
    date: r.date,
    hasImage: Boolean(r.hasImage),
    ...(r.hasImage && r.imageUrl ? { imageUrl: r.imageUrl } : {}),
    ...(r.hasImage ? { imageUrls: reviewImages(r) } : {}),
  };
}

/** Snitt med en decimal över en lista publika rader. null när listan är tom. */
export function snittBetyg(rader: Pick<PublicReview, "rating">[]): number | null {
  if (rader.length === 0) return null;
  return Math.round((rader.reduce((s, r) => s + r.rating, 0) / rader.length) * 10) / 10;
}
