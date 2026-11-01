// lib/tidigare-pris.ts
//
// ORDEN BREDVID ETT ÖVERSTRUKET PRIS.
//
// 7 a § prisinformationslagen kräver att det tidigare priset anges när ett pris
// har sänkts, och att det är det lägsta pris vi har tagit de 30 dagarna före
// sänkningen. Talet räknar motorn (lib/pricing/rea.ts på main) och skriver som
// Wix jämförpris; den här modulen äger bara orden som förklarar det.
//
// Konsumentverkets förslag till föreskrifter om prisinformation (remiss
// 2026-06-09, dnr 2026/816, 11 §) säger att ett av fem uttryck ska användas, och
// att ett överstruket pris får visas bara om det förklaras med ett av dem i
// direkt anslutning till priset:
//
//   – Tidigare lägsta pris
//   – Lägsta pris de senaste 30 dagarna före prissänkningen
//   – Lägsta pris de senaste 30 dagarna
//   – Lägsta 30-dagarspris
//   – 30-dagarspris
//
// Vi använder två av dem: det långa på produktsidan, där det finns plats, och
// det korta på korten, där förslaget uttryckligen öppnar för ett kortare uttryck
// när utrymmet är begränsat. Listan är sluten: "Lägsta pris 30 dagar" eller
// "Ordinarie pris" duger inte, och testet fäller dem.
//
// INGEN IMPORT HÄR, MED FLIT. Node-testköraren laddar modulen direkt, samma
// mönster som lib/rea.ts.

/** Konsumentverkets uttryck, ordagrant ur förslaget (11 § andra stycket). */
export const KONSUMENTVERKETS_UTTRYCK = [
  "Tidigare lägsta pris",
  "Lägsta pris de senaste 30 dagarna före prissänkningen",
  "Lägsta pris de senaste 30 dagarna",
  "Lägsta 30-dagarspris",
  "30-dagarspris",
] as const;

/** Produktsidan: gott om plats. */
export const UTTRYCK_LANG: (typeof KONSUMENTVERKETS_UTTRYCK)[number] = "Lägsta pris de senaste 30 dagarna";

/** Korten, hjältebrickorna och auktionen: lite plats. */
export const UTTRYCK_KORT: (typeof KONSUMENTVERKETS_UTTRYCK)[number] = "30-dagarspris";
