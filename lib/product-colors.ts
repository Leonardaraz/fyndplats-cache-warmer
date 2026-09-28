// lib/product-colors.ts — färgvalen per produkt, för färgfiltret på listsidorna.
//
// VARFÖR EN SIDOVAGN. Katalogen är V3, och där ligger färgen strukturerad i
// `options[].choicesSettings.choices[]` med namn, hex-kod och lagerstatus per
// val. Men listsidornas hämtning går via V1-namnrymden (`queryProducts` i
// lib/products.ts, serverad genom kompatibilitetslagret), och den plattar ut
// varianterna till ihopklistrade strängar — "Svart / L" — där optionsnamnet är
// borta. Färgen tappas alltså på vägen in, inte i katalogen.
//
// Vi hämtar den därför direkt från V3 som en sidovagn: API-nyckel, en filtrerad
// och paginerad fråga, TTL-cache och fail-open. Ingen omskrivning av mapProduct
// och ingen ny risk för listningarna — saknas nyckeln eller svarar Wix inte,
// blir kartan tom och färgfacetten renderas helt enkelt inte.
//
// Själva tolkningen — vilka färgord ett optionsvärde bär — bor i
// lib/variant-color-image.ts hos ordlistan, och testas där. Urvalet och
// pagineringen bor i lib/product-colors-paging.ts, som förklarar varför
// facetten stod tom fram till 2026-09-24.

import { colorImagesFromOptions, colorKeysFromOptions } from "./variant-color-image";
import { hamtaFargval } from "./product-colors-paging";

const WIX_API_KEY = process.env.WIX_API_KEY || "";
const WIX_SITE_ID = process.env.WIX_SITE_ID || "";

/** Samma TTL som popularitetscachen — katalogens färger ändras sällan. */
const TTL_MS = 30 * 60 * 1000;

type Fargdata = { farger: Map<string, string[]>; bilder: Map<string, Record<string, string>> };

let cached: { at: number; promise: Promise<Fargdata> } | null = null;

async function fetchProductColorsRaw(): Promise<Fargdata> {
  const bilder = new Map<string, Record<string, string>>();
  if (!WIX_API_KEY) return { farger: new Map(), bilder };
  try {
    // `options` ingår i V3:s standardsvar — inget `fields` behövs. Valens
    // namn ger färgnycklarna och deras linkedMedia färgbilden på korten.
    const { farger, medOptioner } = await hamtaFargval(
      (kropp) =>
        fetch("https://www.wixapis.com/stores/v3/products/query", {
          method: "POST",
          headers: { Authorization: WIX_API_KEY, "wix-site-id": WIX_SITE_ID, "Content-Type": "application/json" },
          body: JSON.stringify(kropp),
        }),
      colorKeysFromOptions,
      undefined,
      (id, options) => {
        const b = colorImagesFromOptions(options);
        if (Object.keys(b).length) bilder.set(id, b);
      },
    );
    console.log(`[wix] färgval hämtade: ${farger.size} produkter har minst en färg (av ${medOptioner} med optioner), ${bilder.size} med färgbild`);
    return { farger, bilder };
  } catch (e) {
    console.error("[wix] fetchProductColors failed:", (e as Error).message);
    return { farger: new Map(), bilder: new Map() };
  }
}

function fargdata(): Promise<Fargdata> {
  const now = Date.now();
  if (!cached || now - cached.at > TTL_MS) {
    cached = { at: now, promise: fetchProductColorsRaw() };
  }
  return cached.promise;
}

/**
 * Färgnycklar per produkt-id, TTL-cachad per instans.
 *
 * Fail-open hela vägen: en tom karta betyder bara att färgfacetten inte visas.
 * Den får aldrig fälla produktlistningen.
 */
export async function getProductColors(): Promise<Map<string, string[]>> {
  return (await fargdata()).farger;
}

/** Bild per färgnyckel och produkt-id (samma hämtning som getProductColors). */
export async function getProductColorImages(): Promise<Map<string, Record<string, string>>> {
  return (await fargdata()).bilder;
}
