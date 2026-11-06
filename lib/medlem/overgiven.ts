// lib/medlem/overgiven.ts
//
// Mejlen om övergiven kassa och medlemmarnas låsta korgar (E2). En medlemskorg
// har låsta priser och låst kupong, och den tas bort efter ett dygn
// (korgstadning.ts). Ett mejl om den hade pekat på en kassa som snart inte
// finns, och mejlets rabattkod hade inte gått att använda i den. Därför hoppar
// både webhooken och pollaren över korgar som har ett prisbeslut.
//
// Går det inte att avgöra hoppas kassan över den här gången. Pollaren går var
// femtonde minut och ser samma kassa igen; ett mejl för sent är bättre än ett
// mejl om fel kassa.

import { harPrisbeslut } from "./lager";

export type Korgslag = "medlem" | "vanlig" | "okant";

export async function korgslag(cartId: string | undefined): Promise<Korgslag> {
  if (!cartId) return "vanlig";
  try {
    return (await harPrisbeslut(cartId)) ? "medlem" : "vanlig";
  } catch {
    return "okant";
  }
}
