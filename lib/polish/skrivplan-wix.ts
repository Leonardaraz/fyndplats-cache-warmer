// Wix-anropet som skrivplanens steg använder, mot butikens sajt.
//
// Återförsök bara på läsningar och bara på det övergående: 429, 5xx och
// nätverksfel, 1 s och 3 s. En läsning är en GET eller en POST som frågar eller
// söker (`/query`, `/search`, `/query-variants`, `/list-items`): den ändrar ingenting, så ett
// andra försök kan inte ge en dubbel skrivning. En skrivning försöks aldrig om.
// En PATCH bär revisionen, och ett andra försök efter en skrivning som faktiskt
// tog hade bara gett ett revisionsfel som ser ut som ett misslyckande. En
// skrivande POST (skapa, bulk) kan ha gått igenom fast svaret aldrig kom fram.

import { headlessWixHeaders } from "@/lib/wix/v3-products";
import type { WixAnrop } from "./skrivplan";

const WIX_BASE = "https://www.wixapis.com";

/**
 * POST som bara läser. Jämförs på sökvägen utan frågesträng och på dess SLUT:
 * en skrivning som har `/query` mitt i adressen eller i frågesträngen räknas
 * inte. Ett nytt läsande slutled läggs till här och i testet.
 */
const LASANDE_POST = /\/(?:query|search|query-variants|list-items)$/;

/** Går anropet att göra om utan risk: en GET, eller en POST som bara frågar eller söker. */
export function arLasning(metod: string, sokvag: string): boolean {
  if (metod === "GET") return true;
  return metod === "POST" && LASANDE_POST.test(sokvag.split("?")[0]);
}

/**
 * `rubriker` byts bara av den som redan pratar med Wix via en annan rubrik,
 * som `linkChoiceMedia` (`wixHeaders`), så att uppföljningen går mot samma sajt.
 */
export function skapaWixAnrop(
  vanta: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  rubrikerFor: () => Record<string, string> = headlessWixHeaders,
): WixAnrop {
  return async (metod, sokvag, kropp) => {
    // ☠️ Rubrikerna ligger UTANFÖR loopen: ett saknat token är inte övergående,
    // och inuti försöken hade det rapporterats som "nätverksfel" tre gånger.
    const rubriker = rubrikerFor();
    const pauser = arLasning(metod, sokvag) ? [0, 1000, 3000] : [0];
    let senaste = "";
    for (const paus of pauser) {
      if (paus) {
        // Ett återförsök som lyckas syns annars ingenstans. Raden gör övergående fel mätbara.
        console.warn(`[wix-anrop] försöker om ${metod} ${sokvag.split("?")[0]} (${senaste.slice(0, 60)})`);
        await vanta(paus);
      }
      let res: Response;
      try {
        res = await fetch(`${WIX_BASE}${sokvag}`, {
          method: metod,
          headers: rubriker,
          body: kropp === undefined ? undefined : JSON.stringify(kropp),
        });
      } catch (e) {
        senaste = `nätverksfel: ${String((e as Error)?.message ?? e).slice(0, 200)}`;
        continue;
      }
      const text = await res.text();
      if (res.ok) return text ? JSON.parse(text) : {};
      senaste = `Wix ${res.status}: ${text.slice(0, 240)}`;
      if (!(res.status === 429 || res.status >= 500)) break;
    }
    throw new Error(senaste);
  };
}
