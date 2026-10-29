// Hur ofta en VEVOR-sida läses. Leonards ordning 2026-10-28:
//
//   varje timme     produkter med obeställda ordrar, lager ≤ 3 eller en
//                   levande auktion
//   var 4:e timme   publicerade produkter
//   en gång per dygn  utkasten, i rotation
//
// "Lager ≤ 3" gäller de publicerade: ett utkast går inte att köpa, och ett
// dygn gammal avläsning räcker för det. Den som aldrig lästs står först i kön
// (`katalog`), så hela katalogen hinns med innan rotationen tar över.
//
// Prioriteringen görs en gång i timmen och flyttar bara de sidor vars klass
// ändrats. Innan VEVOR-produkter importerats (steg 4) finns inga VEVOR-
// mappningar, och då är allt utkast.

import type { Sidklass, Sidrad } from "./lager";

const TIMME = 3_600_000;

/** Intervallet efter en lyckad läsning. */
export const INTERVALL_MS: Record<Sidklass, number> = {
  katalog: 24 * TIMME,
  utkast: 24 * TIMME,
  publicerad: 4 * TIMME,
  het: TIMME,
};

/** Lågt lager: läses varje timme när produkten är publicerad. */
export const LAGT_LAGER = 3;

export interface VevorProdukt {
  wixProductId: string;
  sku: string;
  publicerad: boolean;
}

export interface Prioritetsunderlag {
  produkter: VevorProdukt[];
  /** Wix-produkt-id med en order som inte är beställd hos VEVOR än. */
  obestallda: Set<string>;
  /** Wix-produkt-id med en levande auktion. */
  iAuktion: Set<string>;
}

/** Artikelnummer → klass, för de artiklar som ska läsas oftare än en gång per dygn. */
export function onskadeKlasser(
  u: Prioritetsunderlag,
  saldo: (sku: string) => number | null,
): Map<string, "het" | "publicerad"> {
  const ut = new Map<string, "het" | "publicerad">();
  for (const p of u.produkter) {
    const s = saldo(p.sku);
    const het =
      u.obestallda.has(p.wixProductId) ||
      u.iAuktion.has(p.wixProductId) ||
      (p.publicerad && s !== null && s <= LAGT_LAGER);
    if (het) ut.set(p.sku, "het");
    else if (p.publicerad && ut.get(p.sku) !== "het") ut.set(p.sku, "publicerad");
  }
  return ut;
}

/**
 * Raden med ny klass. Blir intervallet kortare flyttas nästa läsning fram,
 * räknat från förra lyckade läsningen. Blir det längre står tiden kvar: nästa
 * läsning sätter den nya takten.
 */
export function medKlass(r: Sidrad, klass: Sidklass, nu: number): Sidrad {
  if (r.klass === "katalog") return r; // aldrig läst: står redan först
  const bas = r.senastOkAt ? Date.parse(r.senastOkAt) : nu;
  const tidigast = new Date(Math.max(nu, bas + INTERVALL_MS[klass])).toISOString();
  return { ...r, klass, nastaLasning: tidigast < r.nastaLasning ? tidigast : r.nastaLasning };
}

/** Raderna som ska byta klass. `nuvarande` = sidorna som i dag är het eller publicerad. */
export function klassbyten(
  onskad: Map<string, "het" | "publicerad">,
  forOnskade: Sidrad[],
  nuvarande: Sidrad[],
  nu: number,
): Sidrad[] {
  const ut = new Map<string, Sidrad>();
  for (const r of forOnskade) {
    const k = r.sku ? onskad.get(r.sku) : undefined;
    if (k && r.klass !== k && !r.borta) ut.set(r.webbId, medKlass(r, k, nu));
  }
  for (const r of nuvarande) {
    if (ut.has(r.webbId)) continue;
    if (!r.sku || !onskad.has(r.sku)) ut.set(r.webbId, { ...r, klass: "utkast" });
  }
  return [...ut.values()];
}
