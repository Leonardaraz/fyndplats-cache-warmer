// Varukorgens rader medan Wix bekräftar ett tillägg (components/cart.tsx).
//
// Leonard 2026-11-07: miniatyren "skuttade till" och raden hoppade när en vara
// lades i. Mätt i produktionen: den väntande raden var en annan rad än den
// bekräftade (annan nyckel, 112 px hög mot 140 px, bilden laddades om), och
// med fler varor i lådan for raderna 132 px. Här avgörs vilken rad en väntande
// vara hör till, så att React behåller SAMMA element från tryck till svar.

/** Det som behövs av en rad ur kundvagnen (lib/cart-shape.ts). */
export type Kundvagnsrad = {
  _id?: string;
  quantity?: number;
  catalogReference?: { catalogItemId?: string; options?: unknown };
};

/** En vara som väntar på Wix svar. */
export type VantandeVara = { id: string; variantId?: string; nyckel: number; antal: number };

function variantPaRad(rad: Kundvagnsrad): string | undefined {
  const o = rad.catalogReference?.options;
  if (!o || typeof o !== "object") return undefined;
  const v = (o as { variantId?: unknown }).variantId;
  return typeof v === "string" && v ? v : undefined;
}

/**
 * Sant när raden är samma vara och variant som tillägget. En vara utan valt
 * alternativ skickas utan variant; Wix kan ändå lägga standardvarianten på
 * raden, så en saknad variant på någon sida räknas som samma.
 */
export function arSammaVara(rad: Kundvagnsrad, id: string, variantId?: string): boolean {
  if (!id || rad.catalogReference?.catalogItemId !== id) return false;
  const paRad = variantPaRad(rad);
  return !variantId || !paRad || paRad === variantId;
}

/**
 * Raden som tillägget blev: en rad som inte fanns före anropet och är samma
 * vara. Wix lägger en ny rad sist. Fanns varan redan ökar Wix antalet på den
 * befintliga raden, och då finns ingen ny rad (undefined).
 */
export function nyRadEfterTillagg(
  fore: ReadonlySet<string>,
  efter: readonly Kundvagnsrad[],
  id: string,
  variantId?: string,
): string | undefined {
  for (let i = efter.length - 1; i >= 0; i--) {
    const r = efter[i];
    if (r._id && !fore.has(r._id) && arSammaVara(r, id, variantId)) return r._id;
  }
  return undefined;
}

/**
 * Fördelar de väntande varorna på lådans rader.
 * - `paRad`: väntande antal per befintlig rad (varan fanns redan; raden visas
 *   som väntande med det nya antalet i stället för att få en rad till).
 * - `egna`: väntande varor som inte finns i lådan, en rad per vara och variant
 *   i den ordning de lades i. Två tryck på samma vara blir en rad.
 */
export function fordelaVantande<V extends VantandeVara>(
  rader: readonly Kundvagnsrad[],
  vantande: readonly V[],
): { paRad: Map<string, number>; egna: (V & { totalt: number })[] } {
  const paRad = new Map<string, number>();
  const egna: (V & { totalt: number })[] = [];
  for (const v of vantande) {
    const rad = rader.find((r) => r._id && arSammaVara(r, v.id, v.variantId));
    if (rad?._id) {
      paRad.set(rad._id, (paRad.get(rad._id) ?? 0) + v.antal);
      continue;
    }
    const samma = egna.find((e) => e.id === v.id && (e.variantId ?? "") === (v.variantId ?? ""));
    if (samma) samma.totalt += v.antal;
    else egna.push({ ...v, totalt: v.antal });
  }
  return { paRad, egna };
}

/** React-nyckeln för en väntande rad. Raden Wix skapar får samma nyckel. */
export function vantandeNyckel(nyckel: number): string {
  return `v${nyckel}`;
}
