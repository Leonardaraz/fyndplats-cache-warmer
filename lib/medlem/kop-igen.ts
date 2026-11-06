// lib/medlem/kop-igen.ts
//
// "Köp igen" på Mina sidor (medlemskapet E3; specen: "sparade varukorgar och
// Köp igen", och konkurrentgenomgången: "fakturaarkiv och köp igen är kärnan").
// Knappen lägger en tidigare orders varor i besökarens varukorg i ett anrop,
// med samma antal som i ordern. Priset är dagens: varukorgen prissätter som
// vanligt, och medlemspriset räknas i kassan som för alla andra köp.
//
// Vad som läggs i: varje vara i ordern (orderliggarens rader med en produkt
// och `raknas`, alltså fysiska varor) som finns i katalogen och går att köpa
// nu. En variant måste finnas kvar och vara i lager. En vara som är slut
// räknas i `slut`, en som inte längre säljs (eller vars variant är borta) i
// `borta`, och kunden får veta båda.
//
// Ren modul: katalogen skickas in, så att filen går att pröva med
// `node --test` utan lokala imports.

import type { Product } from "@/lib/products";

export type Katalogvara = Pick<Product, "id" | "inStock" | "variants" | "options" | "variantTable">;

export interface Orderrad {
  produktId?: string;
  variantId?: string;
  antal: number;
  /** Fysisk vara (orderliggaren); ett presentkort eller en tjänst köps inte igen här. */
  raknas: boolean;
}

/** En rad till varukorgen. `variantId` bara när produkten har flera varianter. */
export interface KopIgenRad {
  produktId: string;
  variantId?: string;
  antal: number;
}

export interface KopIgen {
  rader: KopIgenRad[];
  /** Rader i ordern som är slut just nu. */
  slut: number;
  /** Rader vars produkt eller variant inte längre säljs. */
  borta: number;
}

/** Högsta antal av en vara som läggs i på en gång. */
export const MAX_ANTAL = 99;

type Lage = { lage: "ok"; variantId?: string } | { lage: "slut" } | { lage: "borta" };

function harFleraVarianter(p: Katalogvara): boolean {
  return (p.variants?.length ?? 0) > 1 || Boolean(p.options?.choices?.length) || Boolean(p.variantTable?.length);
}

function lageFor(p: Katalogvara, variantId: string | undefined): Lage {
  if (!harFleraVarianter(p)) return p.inStock ? { lage: "ok" } : { lage: "slut" };
  // Med flera varianter avgör ordern vilken; utan den går det inte att veta.
  if (!variantId) return { lage: "borta" };
  const iTabell = p.variantTable?.find((v) => v.variantId === variantId);
  const iVal = p.options?.choices?.find((c) => c.variantId === variantId);
  const finns = Boolean(iTabell || iVal || p.variants?.some((v) => v.id === variantId));
  if (!finns) return { lage: "borta" };
  const iLager = p.inStock && (iTabell ? iTabell.inStock : iVal ? iVal.inStock !== false : true);
  return iLager ? { lage: "ok", variantId } : { lage: "slut" };
}

/** Orderns varor som går att lägga i varukorgen nu, och vad som inte gjorde det. */
export function kopIgen(rader: readonly Orderrad[], katalog: ReadonlyMap<string, Katalogvara>): KopIgen {
  const ut = new Map<string, KopIgenRad>();
  let slut = 0;
  let borta = 0;
  for (const r of rader) {
    if (!r.raknas || !r.produktId) continue;
    const p = katalog.get(r.produktId);
    const l: Lage = p ? lageFor(p, r.variantId) : { lage: "borta" };
    if (l.lage === "slut") slut++;
    else if (l.lage === "borta") borta++;
    else {
      const nyckel = `${r.produktId}|${l.variantId ?? ""}`;
      const antal = Math.max(1, Math.floor(Number.isFinite(r.antal) ? r.antal : 1));
      const fanns = ut.get(nyckel);
      if (fanns) fanns.antal = Math.min(MAX_ANTAL, fanns.antal + antal);
      else ut.set(nyckel, { produktId: r.produktId, ...(l.variantId ? { variantId: l.variantId } : {}), antal: Math.min(MAX_ANTAL, antal) });
    }
  }
  return { rader: [...ut.values()], slut, borta };
}

const varor = (n: number) => (n === 1 ? "1 vara" : `${n} varor`);

/**
 * Beskedet under knappen, eller null när allt kom med (lådan som öppnas är
 * beskedet då). `lagda` är antalet rader som lades i varukorgen; `vad` är
 * "ordern" (Köp igen) eller "korgen" (en sparad varukorg, lib/medlem/sparade.ts).
 */
export function kopIgenBesked(lagda: number, slut: number, borta: number, vad: "ordern" | "korgen" = "ordern"): string | null {
  const Vad = vad === "ordern" ? "Ordern" : "Korgen";
  if (slut === 0 && borta === 0) return lagda > 0 ? null : `${Vad} har inga varor som går att köpa igen här.`;
  if (lagda === 0) {
    if (borta === 0) return `Varorna i ${vad} är slut just nu.`;
    if (slut === 0) return `Varorna i ${vad} säljs inte längre.`;
    return `Varorna i ${vad} är slut eller säljs inte längre.`;
  }
  const delar = [
    slut > 0 ? `${varor(slut)} är slut just nu` : "",
    borta > 0 ? `${varor(borta)} säljs inte längre` : "",
  ].filter(Boolean);
  return `${delar.join(" och ")}. Resten ligger i varukorgen.`;
}
