// lib/fyndfilm.ts
//
// Reklamfilmen för fyndauktionen (Leonard 2026-11-26). Ett klipp i butikens
// Wix Media, "fyndplats-black-friday-torsdag.mp4": 25 sekunder, stående 9:16,
// svart och guld. Det visar hur auktionen går till (startpris kl 07, ett steg
// ner varje timme, varje fynd finns en gång) och slutar med
// fyndplats.se/fyndauktion.
//
// Filmen står på två ställen (components/fyndfilm.tsx):
// - i startsidans auktionsband, som en skärm som spelar utan ljud och leder
//   till auktionen (det är där filmen gör reklam),
// - i auktionssidans studio, där ett tryck spelar den med ljud.
//
// ☠️ FILMEN NÄMNER ETT DATUM OCH ETT ANTAL ("fredag 27 november", "100 fynd").
// Därför har den ett slut: efter `slutarMs` visas den ingenstans, varken från
// servern eller i en sida som legat kvar i en cache (klienten släcker den
// själv). Butikens egna texter runt filmen nämner aldrig antalet fynd
// (Leonards regel 2026-11-21, lib/auction-beskrivning.ts).
//
// ☠️ Stillbilden är f000, filmens första bild: rubriken och trappan. f002
// visar räkneverket mitt i en siffra ("64 fynd"), och den bilden får aldrig
// stå som stillbild.
//
// LÖVMODUL med flit: bara typimporter, så att `node --test` kan ladda den.

import type { VideoKalla } from "./produkt-video";

export interface Fyndfilm {
  /** Fil-id i Wix Media Manager. */
  id: string;
  /** Längd i hela sekunder. */
  langdSek: number;
  /** Vilken av Wix fyra stillbilder (f000–f003) som visas innan filmen spelar. */
  stillbild: "f000" | "f001" | "f002" | "f003";
  /** När filmen slutar visas, ms sedan epoken (UTC). */
  slutarMs: number;
  /** Vad filmen är. Knappens och spelarens namn för skärmläsare. */
  namn: string;
}

export const FYNDFILM: Fyndfilm = {
  id: "b379ce_131b1c66dcb64ff9a14c95ae49807131",
  langdSek: 25,
  stillbild: "f000",
  // Fredag 27 november kl 19 svensk tid (18:00 UTC): Black Friday-auktionen
  // stänger, och filmens datum och antal gäller inte längre.
  slutarMs: Date.UTC(2026, 10, 27, 18, 0, 0),
  namn: "Filmen om Black Friday på Fyndauktionen",
};

/**
 * Wix filer för en stående film. Wix räknar "720p" på höjden: filen är
 * 406×720, inte 720×1280. Mätt för den här filmen 2026-11-26: 360p 1,5 MB,
 * 480p 2,0 MB, 720p 3,4 MB, 1080p 19 MB.
 */
const STORLEKAR = [
  { namn: "360p", bredd: 202, hojd: 360 },
  { namn: "480p", bredd: 270, hojd: 480 },
  { namn: "720p", bredd: 406, hojd: 720 },
  { namn: "1080p", bredd: 1080, hojd: 1920 },
] as const;

/** Största fil som spelas utan ljud i en skärm på sidan. 1080p är 19 MB. */
export const SKARM_MAX_BREDD = 406;

/** Filmens filer, stigande bredd. Bara mp4 på video.wixstatic.com. */
export function filmKallor(film: Fyndfilm): VideoKalla[] {
  return STORLEKAR.map((s) => ({
    url: `https://video.wixstatic.com/video/${film.id}/${s.namn}/mp4/file.mp4`,
    bredd: s.bredd,
    hojd: s.hojd,
  }));
}

/**
 * Stillbilden i den storlek skärmen behöver (Wix skalar den, och enc_auto ger
 * avif eller webp när webbläsaren tar emot det).
 */
export function filmStillbild(film: Fyndfilm, bredd: number): string {
  const b = Math.max(1, Math.round(bredd));
  const h = Math.round((b * 16) / 9);
  return `https://static.wixstatic.com/media/${film.id}${film.stillbild}.jpg/v1/fill/w_${b},h_${h},al_c,q_80,enc_auto/fyndfilm.jpg`;
}

/**
 * Filen för skärmen som spelar utan ljud: den minsta som räcker för
 * `behovPx` bildpunkter i bredd, men aldrig 1080p. Skärmen är 96–250 px bred,
 * och behovet räknas med högst dubbel pixeltäthet: en telefon får 360p
 * (1,5 MB), en dator med vanlig skärm 480p och en med tät skärm 720p.
 */
export function skarmKalla(kallor: readonly VideoKalla[], behovPx: number): VideoKalla | null {
  const inom = [...kallor].filter((k) => k.bredd <= SKARM_MAX_BREDD).sort((a, b) => a.bredd - b.bredd);
  if (!inom.length) return null;
  const mal = Number.isFinite(behovPx) ? behovPx : 0;
  return inom.find((k) => k.bredd >= mal) ?? inom[inom.length - 1];
}

/** Filmen om den ska visas nu, annars null. */
export function aktivFilm(nuMs: number, film: Fyndfilm | null = FYNDFILM): Fyndfilm | null {
  if (!film) return null;
  return Number.isFinite(nuMs) && nuMs < film.slutarMs ? film : null;
}
