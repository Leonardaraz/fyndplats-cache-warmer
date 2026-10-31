// Morgonmejlets vakt över publiceringsspärren: synliga VEVOR-varor utan
// komplett GPSR, och vapenskåp och spritapparater (lib/publicering.ts).
//
// Spärren sitter i motorns egna vägar. En vara som någon publicerar för hand i
// Wix går förbi den, och den ser vi först här: varje morgon, med Wix-id.
//
// Synligheten läses bara för VEVOR-varorna, hundra id per anrop
// (searchProductSummaries), inte för hela katalogen: ett katalogsvep är ~65
// sidor och hade ätit halva ordervaktens tidsbudget.

import type { ProductMappingRecord } from "@/lib/store";
import { vevorSkuOf } from "@/lib/store/supplier";
import { publiceringshinderFor } from "@/lib/publicering";
import type { GpsrLager } from "./gpsr-lager";

export interface GpsrVaktDeps {
  mappningar: () => Promise<ProductMappingRecord[]>;
  /**
   * Vilka av de här Wix-id:na är synliga i butiken? En produkt som saknas i
   * svaret är inte synlig. En produkt utan `visible` räknas som synlig: hellre
   * ett larm för mycket.
   */
  synliga: (wixProductIds: string[]) => Promise<Set<string>>;
  lager: Pick<GpsrLager, "las">;
}

/**
 * Synliga VEVOR-varor som inte får vara publicerade, med Wix-id, sorterade.
 * `sparrade` är vapenskåp och spritapparater (lib/vevor/kategorier.ts): de får
 * aldrig säljas, vad GPSR än säger. `utanGpsr` är resten.
 */
export interface VevorVakt {
  utanGpsr: string[];
  sparrade: string[];
}

export async function vevorPubliceradeUtanGpsr(deps: GpsrVaktDeps): Promise<VevorVakt> {
  const vevor = (await deps.mappningar()).filter((m) => vevorSkuOf(m) !== null);
  if (vevor.length === 0) return { utanGpsr: [], sparrade: [] };
  const ids = new Set(vevor.map((m) => m.wixProductId));
  const synliga = await deps.synliga([...ids]);
  // ☠️ Ett id vi inte frågade efter betyder att filtret inte bet (Wix ignorerar
  // ett filter på fel plats tyst, se CLAUDE.md). Då svarade Wix om andra
  // produkter, och "inga träffar" vore en kontroll som inte kan fälla.
  const okanda = [...synliga].filter((id) => !ids.has(id)).length;
  if (okanda > 0) throw new Error(`synligheten svarade om ${okanda} produkter vi inte frågade efter`);
  const publicerade = vevor.filter((m) => synliga.has(m.wixProductId));
  if (publicerade.length === 0) return { utanGpsr: [], sparrade: [] };
  const hinder = await publiceringshinderFor(publicerade, "polering", deps.lager);
  const ut: VevorVakt = { utanGpsr: [], sparrade: [] };
  for (const [id, h] of hinder) {
    if (h.kod === "vapenskap" || h.kod === "spritapparat") ut.sparrade.push(id);
    else ut.utanGpsr.push(id);
  }
  ut.utanGpsr.sort();
  ut.sparrade.sort();
  return ut;
}
