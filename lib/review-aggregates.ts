// lib/review-aggregates.ts
//
// Betygssammandrag för HELA katalogen i ett enda anrop.
//
// Bakgrund (2026-08-17): omdömena syntes bara på produktsidan. I kategori- och
// listningsvyerna såg varje kort omdömeslöst ut, så det sociala beviset nådde
// kunden först efter att hen redan klickat in på en produkt.
//
// Den naiva vägen — getProductReviews() per kort — hade blivit 24+ Wix-anrop
// per listningssida (och ~800 på /alla-produkter innan pagineringen slår till).
// I stället gör vi EN aggregering grupperad på productId som ger antal + snitt
// för alla produkter samtidigt: uppmätt 388 grupper / 1 695 omdömen i ett svar.
//
// Cachas 1 h med samma "reviews"-tagg som getProductReviews, så den befintliga
// revalideringen (`?tag=reviews`) tömmer produktsidan och korten på en gång.
//
// Den rena logiken (mapAggregateRows/applyRatings/ownReviewsHidden) ligger i
// lib/rating.ts — se kommentaren där om varför den behöver vara en löv-modul.

import { mapAggregateRows, applyRatings, ownReviewsHidden, type AggregateRow, type RatingMap } from "./rating";
import type { Product } from "./products";

const WIX_BASE = "https://www.wixapis.com";
const COL = process.env.WIX_DATA_COL_REVIEWS || "FyndplatsImportedReviews";

/** Samma statusar som getProductReviews visar publikt. */
const VISIBLE = ["approved", "edited"];

function wixDataHeaders(): Record<string, string> | null {
  const token = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) return null;
  return { "Content-Type": "application/json", Authorization: token, "wix-site-id": siteId };
}

/**
 * Antal + snitt per produkt för hela katalogen.
 *
 * Returnerar tom karta om nyckel saknas, Trustpilot är påslaget eller anropet
 * failar — korten ser då exakt ut som innan (inga stjärnor), aldrig trasiga.
 */
export async function getReviewAggregates(): Promise<RatingMap> {
  if (ownReviewsHidden()) return {};
  const h = wixDataHeaders();
  if (!h) return {};
  try {
    const res = await fetch(`${WIX_BASE}/data/v2/items/aggregate`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        dataCollectionId: COL,
        initialFilter: { status: { $in: VISIBLE } },
        aggregation: {
          groupingFields: ["productId"],
          operations: [
            { resultFieldName: "antal", itemCount: {} },
            { resultFieldName: "snitt", average: { itemFieldName: "rating" } },
          ],
        },
        // Katalogen har ~390 produkter med omdömen. Taket är satt med marginal
        // så att svaret ryms i en sida — hasNext hanteras inte här med flit.
        paging: { limit: 1000 },
      }),
      next: { revalidate: 3600, tags: ["reviews"] },
    });
    if (!res.ok) return {};
    const body = (await res.json()) as { results?: AggregateRow[] };
    return mapAggregateRows(body.results || []);
  } catch {
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
