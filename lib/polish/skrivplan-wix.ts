// Wix-anropet som skrivplanens steg använder, mot butikens sajt.
//
// Återförsök bara på läsningar (GET) och bara på det övergående: 429, 5xx och
// nätverksfel, 1 s och 3 s. En PATCH försöks aldrig om — den bär revisionen,
// och ett andra försök efter en skrivning som faktiskt tog hade bara gett ett
// revisionsfel som ser ut som ett misslyckande.

import { headlessWixHeaders } from "@/lib/wix/v3-products";
import type { WixAnrop } from "./skrivplan";

const WIX_BASE = "https://www.wixapis.com";

export function skapaWixAnrop(vanta: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))): WixAnrop {
  return async (metod, sokvag, kropp) => {
    // ☠️ Rubrikerna ligger UTANFÖR loopen: ett saknat token är inte övergående,
    // och inuti försöken hade det rapporterats som "nätverksfel" tre gånger.
    const rubriker = headlessWixHeaders();
    const pauser = metod === "GET" ? [0, 1000, 3000] : [0];
    let senaste = "";
    for (const paus of pauser) {
      if (paus) await vanta(paus);
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
