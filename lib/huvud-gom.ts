// lib/huvud-gom.ts
//
// Mobilens sidhuvud följer fingret (Leonard 2026-11-24): scrollar man ner
// följer det med sidan upp ur bild, och så fort man scrollar upp följer det med
// tillbaka. Sidhuvudet med sökraden är 133 px av en telefonskärm.
//
// ☠️ Första försöket bytte läge vid en gräns och lät en animation göra resten.
// På Leonards iPhone såg det ut som ett hopp: en animation har sin egen fart,
// och den är aldrig fingrets. Nu gör webbläsarens egen scrollning rörelsen.
// Sidhuvudet (position:sticky) ligger i ett omslag, .huvudspar, och ett fäst
// element kan aldrig lämna sitt omslag: när omslagets nederkant når
// sidhuvudets nederkant följer sidhuvudet med sidan uppåt, pixel för pixel.
// Det enda som räknas här är omslagets höjd, och den ändras bara när
// rörelsen vänder:
//   • sidhuvudet står helt framme och sidan börjar gå ner → nederkanten läggs
//     vid sidhuvudets nederkant, så att det följer med härifrån;
//   • sidhuvudet är helt borta och sidan börjar gå upp → nederkanten läggs vid
//     skärmens överkant, så att det följer med in härifrån.
// Däremellan skrivs ingenting, och ingen kod körs i takt med fingret.
// Står sidan still läggs nederkanten där sidhuvudet står (sparRast), så att
// inte ens vändningen behöver en skrivning nästa gång.
//
// När rörelsen stannat med sidhuvudet till hälften framme glider det sista
// biten åt det håll rörelsen gick (sparVila). Här står bara räkningen, utan
// webbläsare (huvud-gom.test.ts); components/huvud-gom.tsx mäter och skriver.

/** Så nära sidans topp står sidhuvudet alltid helt framme (som förut: fäst överst). */
export const ALLTID_OVAN_PX = 140;
/** Rörelsen stannade på väg upp: med minst så här mycket framme glider sidhuvudet fram helt. En darrning visar inget. */
export const VISA_MINST_PX = 16;
/** Rörelsen stannade på väg ner: med minst så här mycket borta glider det undan helt. Ett ryck med tummen gömmer inget. */
export const GOM_MINST_PX = 28;
/** Ett gömt sidhuvud står så här långt ovanför skärmens kant. Vid kanten syntes linjen i dess nederkant som en hårfin rand på skärmar som avrundar halva pixlar. */
export const UR_BILD_PX = 2;

export interface SparMatt {
  /** window.scrollY. Negativ när iOS drar sidan förbi toppen. */
  y: number;
  /** Fönstrets höjd och hela sidans höjd, för att känna igen studsen i sidans botten. */
  hojd: number;
  sidhojd: number;
  /** Sidhuvudets höjd. */
  h: number;
  /** Omslagets överkant i sidan (under kampanjremsan). */
  topp: number;
}

export interface SparLage {
  /** Omslagets höjd: nederkanten ligger på topp + hb i sidan. */
  hb: number;
  /** Sidans läge vid förra steget. */
  y: number;
  /** Rörelsens riktning: 1 ner, -1 upp, 0 innan något hänt. */
  rikt: -1 | 0 | 1;
}

/**
 * Läget hålls inom sidan: iOS låter sidan dras förbi toppen och botten och
 * studsa tillbaka. Utan det hade studsen i botten räknats som att kunden
 * scrollade upp.
 */
function inomSidan(m: SparMatt): number {
  const langst = Math.max(0, m.sidhojd - m.hojd);
  return Math.min(Math.max(0, m.y), langst);
}

/** Omslagets lägsta höjd: sidhuvudet ryms, och står framme i hela zonen närmast sidans topp. */
function minst(m: SparMatt): number {
  return Math.max(m.h, ALLTID_OVAN_PX + m.h - m.topp);
}

/** Omslagets höjd när sidhuvudet står helt framme, respektive helt borta, vid läget y. */
const framme = (m: SparMatt, y: number) => Math.max(minst(m), y + m.h - m.topp);
const borta = (m: SparMatt, y: number) => Math.max(minst(m), y - m.topp - UR_BILD_PX);

/** Hur många px av sidhuvudet som syns med omslagshöjden hb. */
export function synligt(hb: number, m: SparMatt): number {
  return Math.min(m.h, Math.max(0, m.topp + Math.max(hb, minst(m)) - inomSidan(m)));
}

/** Från början står sidhuvudet helt framme, också mitt i en sida (bakåtknappen). */
export function sparStart(m: SparMatt): SparLage {
  const y = inomSidan(m);
  return { hb: framme(m, y), y, rikt: 0 };
}

/** Nästa läge efter att sidan rört sig. Ren funktion: samma läge och mått ger samma svar. */
export function sparSteg(f: SparLage, m: SparMatt): SparLage {
  const y = inomSidan(m);
  const rikt = y > f.y ? 1 : y < f.y ? -1 : f.rikt;
  let hb = Math.max(f.hb, minst(m));
  if (y !== f.y) {
    const syns = synligt(hb, m);
    if (rikt === 1 && syns >= m.h) hb = framme(m, y);
    // Aldrig längre bort än det redan ligger: ett sidhuvud som vilar strax ovanför kanten
    // ska in med nästa pixel, inte skjutas undan igen för varje bildruta av ett långsamt drag.
    else if (rikt === -1 && syns <= 0) hb = Math.max(hb, borta(m, y));
  }
  return hb === f.hb && y === f.y && rikt === f.rikt ? f : { hb, y, rikt };
}

export interface Vila {
  /** Sidhuvudet glider fram (true) eller undan (false). */
  visa: boolean;
  /** Så långt det glider, i px: positivt ner i bild, negativt upp ur bild. */
  flytt: number;
  /** Omslagets höjd när glidet är klart. */
  hb: number;
}

/**
 * Rörelsen har stannat. Står sidhuvudet till hälften framme glider det sista
 * biten: fram efter en rörelse uppåt, undan efter en rörelse nedåt. Null när
 * det redan står helt framme eller är helt borta.
 */
export function sparVila(l: SparLage, m: SparMatt): Vila | null {
  const y = inomSidan(m);
  const syns = synligt(l.hb, m);
  if (syns <= 0 || syns >= m.h) return null;
  // Närmast sidans topp går det inte att gömma sidhuvudet: där står det i sidan.
  const visa = y < ALLTID_OVAN_PX + m.h || (l.rikt === 1 ? m.h - syns < GOM_MINST_PX : syns >= VISA_MINST_PX);
  return visa ? { visa: true, flytt: m.h - syns, hb: framme(m, y) } : { visa: false, flytt: -(syns + UR_BILD_PX), hb: borta(m, y) };
}

/**
 * Glidets längd i ms: kortare för en kort bit, aldrig över en tredjedels sekund.
 * Kurvan står i components/huvud-gom.tsx och börjar stilla.
 */
export function glidMs(flytt: number): number {
  return Math.round(Math.min(340, 190 + Math.abs(flytt)));
}

/**
 * Sidan står still med sidhuvudet helt framme eller helt borta: omslagets
 * nederkant läggs där sidhuvudet står. Ingenting syns av det, men nästa
 * rörelse, åt vilket håll den än går, tar sidhuvudet med sig från första
 * pixeln utan att något behöver skrivas i farten.
 *
 * ☠️ Därför: på iPhone scrollar skärmen i en egen tråd, och sidans kod får veta
 * det en eller ett par bildrutor senare. En skrivning i samma stund som
 * rörelsen vänder (sparSteg) kommer alltså för sent med just de bildrutorna,
 * och sidhuvudet tar ikapp dem i ett steg. Efter en vila behövs ingen
 * skrivning alls. sparSteg är kvar för den som vänder utan att stanna.
 */
export function sparRast(l: SparLage, m: SparMatt): number {
  const y = inomSidan(m);
  const syns = synligt(l.hb, m);
  if (syns >= m.h) return framme(m, y);
  if (syns <= 0) return borta(m, y);
  return Math.max(l.hb, minst(m));
}

/**
 * Omslagets höjd för ett sidhuvud som syns med `syns` px vid läget i måtten:
 * används när ett glid avbryts mitt i, så att sidhuvudet står kvar där det var.
 */
export function sparFran(syns: number, m: SparMatt): number {
  const y = inomSidan(m);
  return Math.max(minst(m), y + Math.min(m.h, Math.max(-UR_BILD_PX, syns)) - m.topp);
}
