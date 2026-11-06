// lib/kassa/lage.ts
//
// Växeln för vår egen kassa: en rad i Wix (`FyndplatsButikInstallningar/kassa`,
// fältet `lage`), så att påslaget inte kostar ett bygge. Saknas raden är det av,
// och varukorgen skickar kunden till Wix kassa som förut.
//
//   av:   Wix kassa för alla (som före 2026-11-06).
//   prov: vår kassa bara för den som har kakan PROV_KAKA (sätts av /kassa?prova=1).
//   pa:   vår kassa för alla.
//
// Läget cachas en minut per instans, som medlemskapets växel.

import { hamta, K } from "@/lib/wix-lager";

export type KassaLage = "av" | "prov" | "pa";
export const KASSA_LAGE_ID = "kassa";
export const PROV_KAKA = "fp_kassa_prov";

let cache: { lage: KassaLage; at: number } | null = null;

export async function kassaLage(nuMs = Date.now()): Promise<KassaLage> {
  if (cache && nuMs - cache.at < 60_000) return cache.lage;
  try {
    const rad = await hamta(K.installningar, KASSA_LAGE_ID);
    const v = rad?.lage;
    const lage: KassaLage = v === "pa" || v === "prov" ? v : "av";
    cache = { lage, at: nuMs };
    return lage;
  } catch (e) {
    console.error("[kassa] kunde inte läsa växeln:", e instanceof Error ? e.message.slice(0, 120) : e);
    const forra = cache?.lage ?? "av";
    cache = { lage: forra, at: nuMs - 50_000 };
    return forra;
  }
}

/** Ska den här besökaren få vår kassa? */
export function egenKassa(lage: KassaLage, provkaka: string | undefined): boolean {
  return lage === "pa" || (lage === "prov" && provkaka === "1");
}
