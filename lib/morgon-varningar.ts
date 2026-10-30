// lib/morgon-varningar.ts
// Vad ⚠️-rutan i morgonmejlet och på /admin/dashboard larmar om.
// Beroendefri, så node:test kan importera den.
//
// ☠️ BARA AVVIKELSER (Leonard 2026-10-29). Rutan larmade varje morgon för
// produkter som är slut i lager och för produkter med lågt lager. Med omkring
// 5 000 dropship-varor är båda alltid fler än noll (2026-10-29: 529 och 133),
// så mejlet sa "⚠️ 2 sak(er) att kolla" varje dag. Ett larm som alltid fyrar
// lär mottagaren att sluta läsa, och då missas det som faktiskt behöver
// honom. Lagersiffrorna står kvar i mejlets statusrad och på dashboarden.

export interface KundvagnsLage {
  /** Gick kundvagnarna att läsa? */
  available: boolean;
  /** Övergivna kundvagnar det senaste dygnet som inte blev en order. */
  notRecovered24h: number;
}

export function morgonVarningar(kundvagnar: KundvagnsLage): string[] {
  const ut: string[] = [];
  if (kundvagnar.available && kundvagnar.notRecovered24h > 0) {
    ut.push(`${kundvagnar.notRecovered24h} ej återhämtade kundvagnar (24h)`);
  }
  return ut;
}
