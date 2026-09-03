// Fritextsökning i Aosoms feed — utan att adressen lämnar servern.
//
// VARFÖR DEN FINNS. Order 10027 (2026-09-03) kunde inte skickas till Sverige
// från AliExpress, och frågan blev omedelbart: finns samma vara hos Aosom, så
// att vi kan köpa den där i stället? Den frågan gick inte att besvara. Det enda
// sökbara var KATALOGEN, som bara innehåller den importerade delen — ~4 500 av
// feedens 5 566 skeppningsbara rader. En femtedel av sortimentet var alltså
// osynligt för frågan, och svaret "jag hittar ingen" betydde i praktiken "jag
// har inte kunnat titta överallt".
//
// ☠️ OCH DET GICK INTE ATT LÖSA I CHATTEN. Feed-adressen bär våra inköpspriser
// (`resolveAosomFeedUrl`), så att läsa den för att söka hade dragit in
// hemligheten i ett transkript. Därför bor sökningen HÄR, bakom en rutt:
// produktionen har adressen, anroparen får bara träffarna.
//
// Sökningen är AND över termer och matchar mot artikelnummer + namn. Två
// designval som inte ska tas bort:
//
//  1. **Termerna matchas var för sig, inte som fras.** Aosoms namn är långa och
//     ordföljden godtycklig ("Freigehege Freilaufgehege mit 12 Paneel Laufstall
//     für Kleintiere"). En frassökning på "24 paneel" hade missat "mit 24
//     Paneelen". Varje term ska finnas någonstans i raden — ordningen spelar
//     ingen roll.
//  2. **Siffror matchas som hela ord.** Utan det träffar "24" också "124" och
//     "240", och en sökning på panelantal drunknar i måttangivelser. Ren text
//     matchas som delsträng, eftersom tyska sammansättningar annars aldrig
//     träffar ("gehege" måste hitta "Freilaufgehege").

import { type AosomRow, freightShare, isShippableToSe } from "./feed";
// ☠️ INKLUSIVE MOMS, och definitionen ÄRVS i stället för att klonas.
// `landedCostSek` i feed.ts är NETTO; huset lagrar och läser landat pris
// BRUTTO (auktionens golvbud delar med 1,25 innan det räknar). Ett nettotal
// rapporterat som landat pris är 20 % för lågt — samma fälla som Business
// Purpose-köpen. En egen formel här hade drivit isär från remap.ts.
import { landadInklMoms } from "./remap";

/** Fler träffar än så är en för bred fråga, inte ett svar. */
export const MAX_TRAFFAR = 50;

export type FeedTraff = {
  sku: string;
  namn: string;
  grossistEur: number | null;
  seFraktEur: number | null;
  landatSek: number;
  fraktandel: number;
  saldo: number;
  skeppbarTillSe: boolean;
  viktKg: number | null;
  url: string;
};

export type FeedSokResultat = {
  fraga: string;
  raderILista: number;
  traffar: number;
  visade: FeedTraff[];
  kapad: boolean;
};

/** En term matchar antingen som helt ord (siffror) eller delsträng (text). */
function termMatchar(term: string, hay: string): boolean {
  if (/^\d+$/.test(term)) {
    return new RegExp(`(?<![\\d])${term}(?![\\d])`).test(hay);
  }
  return hay.includes(term);
}

export function delaFraga(fraga: string): string[] {
  return fraga
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function tillTraff(rad: AosomRow, eurToSek: number): FeedTraff {
  return {
    sku: rad.sku,
    namn: rad.name,
    grossistEur: rad.wholesaleEur,
    seFraktEur: rad.seFreightEur,
    landatSek: Math.round(landadInklMoms(rad, eurToSek) * 100) / 100,
    fraktandel: freightShare(rad),
    saldo: rad.qty,
    skeppbarTillSe: isShippableToSe(rad),
    viktKg: rad.weightKg,
    url: rad.url,
  };
}

/**
 * Söker i feedens rader. `endastSkeppbara` är default PÅ: en rad som inte går
 * att skicka till Sverige är inget svar på frågan "vad kan vi köpa i stället?".
 */
export function sokFeed(
  rader: AosomRow[],
  fraga: string,
  eurToSek: number,
  opt: { endastSkeppbara?: boolean; max?: number } = {},
): FeedSokResultat {
  const termer = delaFraga(fraga);
  const max = opt.max ?? MAX_TRAFFAR;
  const endastSkeppbara = opt.endastSkeppbara !== false;

  if (termer.length === 0) {
    return { fraga, raderILista: rader.length, traffar: 0, visade: [], kapad: false };
  }

  const traffade = rader.filter((rad) => {
    if (endastSkeppbara && !isShippableToSe(rad)) return false;
    const hay = `${rad.sku} ${rad.name}`.toLowerCase();
    return termer.every((t) => termMatchar(t, hay));
  });

  // Billigast landat först — frågan ställs alltid för att hitta något att köpa.
  traffade.sort((a, b) => landadInklMoms(a, eurToSek) - landadInklMoms(b, eurToSek));

  return {
    fraga,
    raderILista: rader.length,
    traffar: traffade.length,
    visade: traffade.slice(0, max).map((r) => tillTraff(r, eurToSek)),
    kapad: traffade.length > max,
  };
}
