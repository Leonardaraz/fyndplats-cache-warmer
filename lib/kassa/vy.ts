// lib/kassa/vy.ts
//
// Vad kassasidan visar, utan webbläsare (app/kassa/kassa.tsx). Ren modul.

/**
 * "Varukorgen är tom" i stället för formuläret. Förut bara när besökaren
 * saknade varukorg: efter ett köp ger Wix besökaren en ny, tom korg med eget
 * id, och kassan ritade då hela formuläret med "Fri frakt" (en tom korg har
 * ingen frakt). Leonards skärmbild efter Klarna-provet 2026-11-06 14:21.
 * Medan korgen hämtas, betalningen pågår eller ordern väntas visas inget tomt.
 */
export function visaTomKorg(l: { rader: number; korgVantas: boolean; kollar: boolean; skickar: boolean; klarVantar: boolean }): boolean {
  return l.rader === 0 && !l.korgVantas && !l.kollar && !l.skickar && !l.klarVantar;
}
