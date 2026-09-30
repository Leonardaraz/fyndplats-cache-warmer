// Färg- och storlekssyskon till en av våra sidor, ur feeden — rena funktioner.
//
// VARFÖR (Leonard 2026-09-30). "Det orange reservtaket är inte importerat.
// Varför?" Nattens import (`40 4 * * *`) kör med `skipFreightHeavy=1` och hoppar
// över rader där frakten kostar mer än varan. Ett lätt och billigt syskon, som
// ett reservtak, faller ofta där. Att hämta just den raden krävde hittills
// artikelnumret i en workflow-input, alltså i en publik logg. Här anges i
// stället SIDAN, och syskonen hittas med samma jämförelse som syskonsvepet
// (`jamfor` i familjer.ts): samma mått, paket och vikt i en annan färg, eller
// samma klunga och modell i ett annat mått.
//
// ☠️ SVARET BÄR ALDRIG ARTIKELNUMRET. En rad beskrivs med feedens färg, måtten
// och saldot, som syskonsvepet redan skriver ut, och med wix-id när sidan finns.
//
// ☠️ "SAMMA VARA" IMPORTERAS INTE. Samma mått och samma färg är en dubblett i
// feeden, och importen hade skapat exakt den interna dubbletten Google straffar.

import { freightShare, isShippableToSe, type AosomRow } from "./feed";
import { dragAv, jamfor } from "./familjer";

export type SyskonRelation = "farg" | "storlek";

export interface SyskonRad {
  rad: AosomRow;
  relation: SyskonRelation;
}

/**
 * Feedens färg- och storlekssyskon till sidans artiklar. `ankare` är hur många
 * av sidans artiklar som fanns i feeden: noll betyder att det inte gick att
 * jämföra alls (en rad med lågt saldo tas bort ur feeden tillfälligt), och det
 * är något annat än att sidan saknar syskon.
 */
export function hittaSyskonRader(
  feed: readonly AosomRow[],
  artiklar: readonly string[],
): { ankare: number; syskon: SyskonRad[]; dubbletter: number } {
  const egna = new Set(artiklar);
  const ankarDrag = feed.filter((r) => egna.has(r.sku)).map(dragAv);
  if (ankarDrag.length === 0) return { ankare: 0, syskon: [], dubbletter: 0 };

  const kandidater: Array<SyskonRad & { drag: ReturnType<typeof dragAv> }> = [];
  let dubbletter = 0;
  for (const rad of feed) {
    if (egna.has(rad.sku)) continue;
    const drag = dragAv(rad);
    let relation: SyskonRelation | null = null;
    let sammaSomEn = false;
    for (const a of ankarDrag) {
      const r = jamfor(a, drag).relation;
      // ☠️ Samma vara som EN av sidans artiklar är en dubblett, även om den
      // råkar vara ett färgsyskon till en annan. En sida i brunt och orange
      // får inte en brun rad till som "ny färg" bara för att den skiljer sig
      // från den orange.
      if (r === "samma") {
        sammaSomEn = true;
        break;
      }
      if (!relation && (r === "farg" || r === "storlek")) relation = r;
    }
    if (sammaSomEn) dubbletter++;
    else if (relation) kandidater.push({ rad, relation, drag });
  }

  // Två kandidater som är samma vara (samma färg och mått under två
  // artikelnummer) blir en: den med störst saldo.
  kandidater.sort((a, b) => b.rad.qty - a.rad.qty);
  const syskon: SyskonRad[] = [];
  const behallna: Array<ReturnType<typeof dragAv>> = [];
  for (const k of kandidater) {
    if (behallna.some((d) => jamfor(d, k.drag).relation === "samma")) {
      dubbletter++;
      continue;
    }
    behallna.push(k.drag);
    syskon.push({ rad: k.rad, relation: k.relation });
  }
  syskon.sort((a, b) => a.rad.sku.localeCompare(b.rad.sku));
  return { ankare: ankarDrag.length, syskon, dubbletter };
}

export type SyskonStatus = "fanns" | "ej_skeppbar" | "importeras" | "importerad" | "fel";

/** Ett syskon som det står i svaret — utan artikelnummer, pris eller kostnad. */
export interface SyskonSvar {
  relation: SyskonRelation;
  /** Feedens färg, på tyska, som i syskonsvepet. */
  farg: string;
  /** Yttermåtten som tal, t.ex. "298 × 298". */
  matt: string;
  /** Saldot kunden skulle se (feedens minus husets buffert). */
  saldo: number;
  status: SyskonStatus;
  /**
   * Nattens import hoppar över raden, eftersom frakten kostar mer än varan
   * (`skipFreightHeavy=1`). Det är svaret på "varför är den inte importerad?".
   */
  nattensImportHoppar: boolean;
  /** Sidan raden redan sitter på, eller utkastet den importerades som nu. */
  wixProductId?: string;
}

/** Tal med svenskt decimalkomma och × mellan, som syskonsvepet skriver dem. */
export function mattText(rad: AosomRow): string {
  return dragAv(rad).matt.map((t) => String(t).replace(".", ",")).join(" × ");
}

export function syskonSvar(
  s: SyskonRad,
  lage: { fanns: boolean; wixProductId?: string; synligtSaldo: (q: number) => number },
): SyskonSvar {
  const skeppbar = isShippableToSe(s.rad);
  const andel = skeppbar ? freightShare(s.rad) : 0;
  return {
    relation: s.relation,
    farg: s.rad.color.trim(),
    matt: mattText(s.rad),
    saldo: lage.synligtSaldo(s.rad.qty),
    status: lage.fanns ? "fanns" : skeppbar ? "importeras" : "ej_skeppbar",
    nattensImportHoppar: !lage.fanns && skeppbar && Number.isFinite(andel) && andel > 0.5,
    ...(lage.wixProductId ? { wixProductId: lage.wixProductId } : {}),
  };
}
