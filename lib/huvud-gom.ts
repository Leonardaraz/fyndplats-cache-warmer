// lib/huvud-gom.ts
//
// Mobilens sidhuvud glider undan när man scrollar ner och kommer tillbaka så
// fort man scrollar upp (Leonard 2026-11-24): sidhuvudet med sökraden är 133 px
// av en telefonskärm, och i en lista vill kunden se varorna.
//
// Här står bara regeln, utan webbläsare (provad i huvud-gom.test.ts).
// components/huvud-gom.tsx lyssnar på sidans rörelse och sätter data-huvud på
// <html>; app/globals.css flyttar sidhuvudet.

/** Så nära sidans topp visas sidhuvudet alltid: där står det ändå på sin plats i sidan. */
export const ALLTID_OVAN_PX = 140;
/**
 * Så långt ner i ett svep innan sidhuvudet göms. Ett litet ryck med tummen
 * (eller sidan som rättar sig några pixlar när en bild laddats) gömmer inget.
 */
export const GOM_EFTER_PX = 28;
/** Så långt upp i ett svep innan det visas igen: nästan direkt, men inte för en darrning. */
export const VISA_EFTER_PX = 6;

export interface HuvudLage {
  gomt: boolean;
  /** Sidans läge vid förra steget. */
  y: number;
  /** Där det pågående svepet började: rörelsen mäts härifrån. */
  start: number;
  /** Svepets riktning: 1 ner, -1 upp, 0 innan något hänt. */
  rikt: -1 | 0 | 1;
}

export interface HuvudMatt {
  /** window.scrollY. Negativ när iOS drar sidan förbi toppen. */
  y: number;
  /** Fönstrets höjd och hela sidans höjd, för att känna igen studsen i sidans botten. */
  hojd: number;
  sidhojd: number;
}

/**
 * Läget hålls inom sidan: iOS låter sidan dras förbi toppen och botten och
 * studsa tillbaka. Utan det hade studsen i botten räknats som att kunden
 * scrollade upp, och sidhuvudet hade glidit fram av sig självt.
 */
function inomSidan(m: HuvudMatt): number {
  const langst = Math.max(0, m.sidhojd - m.hojd);
  return Math.min(Math.max(0, m.y), langst);
}

export function huvudStart(m: HuvudMatt): HuvudLage {
  const y = inomSidan(m);
  return { gomt: false, y, start: y, rikt: 0 };
}

/** Nästa läge efter att sidan rört sig. Ren funktion: samma läge och mått ger samma svar. */
export function huvudSteg(f: HuvudLage, m: HuvudMatt): HuvudLage {
  const y = inomSidan(m);
  if (y <= ALLTID_OVAN_PX) return { gomt: false, y, start: y, rikt: y < f.y ? -1 : y > f.y ? 1 : f.rikt };
  if (y === f.y) return f;
  const rikt = y > f.y ? 1 : -1;
  // Ett nytt svep börjar där det förra slutade.
  const start = rikt === f.rikt ? f.start : f.y;
  const strackt = Math.abs(y - start);
  const gomt = rikt === 1 ? f.gomt || strackt >= GOM_EFTER_PX : f.gomt && strackt < VISA_EFTER_PX;
  return { gomt, y, start, rikt };
}
