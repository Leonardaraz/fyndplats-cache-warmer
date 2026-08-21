// lib/product-colors.ts — färgvalen per produkt, för färgfiltret på listsidorna.
//
// VARFÖR EN SIDOVAGN. Katalogen är V3, och där ligger färgen strukturerad i
// `options[].choicesSettings.choices[]` med namn, hex-kod och lagerstatus per
// val. Men listsidornas hämtning går via V1-namnrymden (`queryProducts` i
// lib/products.ts, serverad genom kompatibilitetslagret), och den plattar ut
// varianterna till ihopklistrade strängar — "Svart / L" — där optionsnamnet är
// borta. Färgen tappas alltså på vägen in, inte i katalogen.
//
// Vi hämtar den därför direkt från V3 som en sidovagn, i exakt samma mönster som
// fetchFeedGalleries och fetchAllVariantsRaw redan använder: API-nyckel,
// cursor-paginering, TTL-cache, och fail-open. Ingen omskrivning av mapProduct
// och ingen ny risk för listningarna — saknas nyckeln eller svarar Wix inte,
// blir kartan tom och färgfacetten renderas helt enkelt inte.
//
// Själva tolkningen — vilka färgord ett optionsvärde bär — bor i
// lib/variant-color-image.ts hos ordlistan, och testas där.

import { colorKeysFromOptions } from "./variant-color-image";

const WIX_API_KEY = process.env.WIX_API_KEY || "";
const WIX_SITE_ID = process.env.WIX_SITE_ID || "";

/** Samma TTL som popularitetscachen — katalogens färger ändras sällan. */
const TTL_MS = 30 * 60 * 1000;

/** Hård gräns: 12 sidor × 100 = 1 200 produkter, som fetchFeedGalleries. */
const MAX_PAGES = 12;

let cached: { at: number; promise: Promise<Map<string, string[]>> } | null = null;

async function fetchProductColorsRaw(): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!WIX_API_KEY) return out;
  try {
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      // `options` ingår i V3:s standardsvar — inget `fields` behövs, och vi ber
      // medvetet inte om något extra: allt vi läser är valens namn.
      const res = await fetch("https://www.wixapis.com/stores/v3/products/query", {
        method: "POST",
        headers: { Authorization: WIX_API_KEY, "wix-site-id": WIX_SITE_ID, "Content-Type": "application/json" },
        body: JSON.stringify({
          query: { cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 } },
        }),
      });
      if (!res.ok) break;
      const data = await res.json();
      for (const p of data?.products || []) {
        if (!p?.id) continue;
        const keys = colorKeysFromOptions(p.options);
        if (keys.length) out.set(p.id, keys);
      }
      cursor = data?.pagingMetadata?.cursors?.next || undefined;
      if (!cursor || !data?.pagingMetadata?.hasNext) break;
    }
    console.log(`[wix] färgval hämtade: ${out.size} produkter har minst en färg`);
  } catch (e) {
    console.error("[wix] fetchProductColors failed:", (e as Error).message);
  }
  return out;
}

/**
 * Färgnycklar per produkt-id, TTL-cachad per instans.
 *
 * Fail-open hela vägen: en tom karta betyder bara att färgfacetten inte visas.
 * Den får aldrig fälla produktlistningen.
 */
export function getProductColors(): Promise<Map<string, string[]>> {
  const now = Date.now();
  if (!cached || now - cached.at > TTL_MS) {
    cached = { at: now, promise: fetchProductColorsRaw() };
  }
  return cached.promise;
}
