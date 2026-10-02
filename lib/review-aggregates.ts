// lib/review-aggregates.ts
//
// Betygssammandrag för HELA katalogen i ett enda anrop.
//
// Bakgrund (2026-08-17): omdömena syntes bara på produktsidan. I kategori- och
// listningsvyerna såg varje kort omdömeslöst ut, så det sociala beviset nådde
// kunden först efter att hen redan klickat in på en produkt.
//
// Den naiva vägen — getProductReviews() per kort — hade blivit 24+ anrop per
// listningssida (och ~800 på /alla-produkter innan pagineringen slår till).
// I stället gör vi ETT anrop som ger antal + snitt för alla produkter
// samtidigt: uppmätt 388 grupper / 1 695 omdömen i ett svar.
//
// ☠️ LÄSES VIA CACHE-WARMERNS API SEDAN 2026-09-02, inte ur Wix Data direkt.
// Recensionerna flyttar till Postgres (Wix har ett globalt tak på 4 000 rader
// och recensionerna är 2 514 av de ~3 355 som är kvar). Den gamla vägen hade
// inte gått sönder när Wix-raderna raderas — korten hade bara tappat sina
// stjärnor, tyst. Se lib/reviews.ts för samma resonemang och för fallet som
// gjorde huset försiktigt: /api/tracking-events 2026-09-01.
//
// Cachas lika länge som produktsidan (sex timmar sedan 2026-10-01) med samma
// "reviews"-tagg som getProductReviews, så den befintliga revalideringen
// (`?tag=reviews`) tömmer produktsidan och korten på en gång — men se
// lib/produkt-cache.ts om vad en global tömning kostar.
//
// ⚠️ POSTEN DELAS AV ALLA SIDOR. Next nycklar en fetch på adressen, inte på
// sidan, så även listsidorna (som byggs om varje timme) läser samma sextimmarspost:
// stjärnorna på korten kan alltså vara upp till sex timmar gamla. Produktsidans
// egna recensioner töms däremot per produkt inom minuter (/api/cron/uppdatera-andrade).
//
// Den rena logiken (mapAggregateRows/applyRatings/ownReviewsHidden) ligger i
// lib/rating.ts — se kommentaren där om varför den behöver vara en löv-modul.

import { mapAggregateRows, applyRatings, ownReviewsHidden, type AggregateRow, type RatingMap } from "./rating";
import type { Product } from "./products";
import { PRODUKTSIDA_SEKUNDER } from "./produkt-cache";
import { kortLivslangd } from "./kort-livslangd";

/** Cache-warmern äger recensionslagret. Samma mönster som lib/reviews.ts.
 *
 *  ☠️ EGET SEGMENT, inte /api/reviews/aggregates. Den adressen fångas av
 *  motorns dynamiska `[productId]`-rutt och svarar **200** med
 *  `{productId:"aggregates", count:0, reviews:[]}` — alltså rätt statuskod,
 *  fel form. `res.ok` hade passerat, `betyg` saknats, och korten tappat sina
 *  stjärnor utan ett enda fel någonstans. */
const API =
  process.env.CACHE_WARMER_AGGREGATES_URL
  ?? "https://fyndplats-cache-warmer.vercel.app/api/review-aggregates";

/**
 * Antal + snitt per produkt för hela katalogen.
 *
 * Returnerar tom karta om nyckel saknas, Trustpilot är påslaget eller anropet
 * failar — korten ser då exakt ut som innan (inga stjärnor), aldrig trasiga.
 */
export async function getReviewAggregates(): Promise<RatingMap> {
  if (ownReviewsHidden()) return {};
  try {
    // Samma livslängd som produktsidan (lib/produkt-cache.ts). Siffrorna är
    // stjärnorna på "Liknande produkter"-korten; en timme här hade sänkt varje
    // produktsida till en timme. Se ⚠️ ovan om vad det betyder för listsidorna.
    // Faller hämtningen blir korten stjärnlösa — och sidan lever då bara fem
    // minuter (kortLivslangd), inte sex timmar. Ett felsvar cachas aldrig.
    const res = await fetch(API, { next: { revalidate: PRODUKTSIDA_SEKUNDER, tags: ["reviews"] } });
    if (!res.ok) {
      await kortLivslangd();
      return {};
    }
    // Svaret är en KARTA productId → {antal, snitt}. mapAggregateRows tar en
    // lista, så den formen behålls här i stället för att skriva om den rena
    // logiken i lib/rating.ts — den är testad och delas med korten.
    const body = (await res.json()) as {
      betyg?: Record<string, { antal?: number; snitt?: number }>;
    };
    // ☠️ SAKNAT `betyg`-FÄLT ÄR ETT FEL, INTE EN TOM KATALOG. Ett 200-svar utan
    // det betyder att vi pratar med fel rutt — och en tyst tom karta hade sett
    // exakt ut som "ingen produkt har omdömen". Loggas hellre än gissas.
    if (!body || typeof body.betyg !== "object" || body.betyg === null) {
      console.warn("[review-aggregates] svar utan betyg-fält — fel rutt?", API);
      await kortLivslangd();
      return {};
    }
    const rader: AggregateRow[] = Object.entries(body.betyg).map(([productId, v]) => ({
      productId,
      antal: v?.antal,
      snitt: v?.snitt,
    }));
    return mapAggregateRows(rader);
  } catch {
    await kortLivslangd();
    return {};
  }
}

/**
 * Hämtar betygen en gång och hänger på dem. Anropas i serverkomponenterna
 * INNAN listan skickas vidare till klientkomponenter (ShopBrowser m.fl.), som
 * bara bär datan vidare till korten.
 */
export async function attachRatings<T extends Product>(products: T[]): Promise<T[]> {
  if (!products.length) return products;
  return applyRatings(products, await getReviewAggregates());
}
