// lib/fyndfilm.ts
//
// Reklamfilmen för fyndauktionen. Sedan 2026-11-28 årsfilmen
// "fyndplats-fyndauktionen.mp4" i Media Managers mapp Reklamfilmer (Leonard:
// "anpassad för året runt"): 25 sekunder med ljud, stående 9:16 (1080 × 1920),
// svart och guld, byggd med tools/film-fyndauktionen på main (#943). Den visar
// hur auktionen går till (startpris kl 07, ett steg ner varje timme, varje fynd
// finns en gång, nya fynd varje dag kl 07–19) och tryggheten (fri frakt över
// 499 kr, 30 dagars öppet köp). Dess sista bildrutor tonar över i den första,
// så den loopar utan skarv när den spelar utan ljud.
//
// Filmen står på två ställen (components/fyndfilm.tsx):
// - i startsidans auktionsband, som en skärm som spelar utan ljud och leder
//   till auktionen (det är där filmen gör reklam),
// - i auktionssidans studio, där ett tryck spelar den med ljud.
// Båda skärmarna är stående, så det är 9:16-filmen som spelar.
// "fyndplats-fyndauktionen-4x5.mp4" (b379ce_15d5786804cb46c8b4d6918904f3836a)
// är samma film beskuren till 4:5, för en yta som är bred snarare än hög.
//
// Årsfilmen nämner inget datum och inget antal fynd, och har därför inget slut
// (`slutarMs: null`). ☠️ En film som nämner ett datum eller ett antal ska ha
// ett slut: efter `slutarMs` visas den ingenstans, varken från servern eller i
// en sida som legat kvar i en cache (klienten släcker den själv). Så gick
// Black Friday-filmen (b379ce_131b1c66dcb64ff9a14c95ae49807131, "fredag 27
// november", "100 fynd"), som slutade fredag 27 november kl 19. Butikens egna
// texter runt filmen nämner aldrig antalet fynd (Leonards regel 2026-11-21,
// lib/auction-beskrivning.ts).
//
// ☠️ Stillbilden är filmens omslag, en egen bild
// ("fyndplats-fyndauktionen-omslag.jpg", 1080 × 1920), aldrig en av Wix
// automatiska bildrutor (f000–f003): en ruta mitt i en film kan visa en
// prisskylt eller ett räkneverk mitt i ett byte.
//
// LÖVMODUL med flit: bara typimporter, så att `node --test` kan ladda den.

import type { VideoKalla } from "./produkt-video";

export interface Fyndfilm {
  /** Fil-id i Wix Media Manager. */
  id: string;
  /** Längd i hela sekunder. */
  langdSek: number;
  /** Omslaget, en stående bild i Wix Media Manager (id med filändelse). Visas innan filmen spelar. */
  omslag: string;
  /** När filmen slutar visas, ms sedan epoken (UTC). null: filmen gäller året runt. */
  slutarMs: number | null;
  /** Vad filmen är. Knappens och spelarens namn för skärmläsare. */
  namn: string;
}

export const FYNDFILM: Fyndfilm = {
  id: "b379ce_8b8f49a744af4c1f97c59a11866af4dd",
  langdSek: 25,
  omslag: "b379ce_1d95b733fe224497876b412cf4d679ea~mv2.jpg",
  slutarMs: null,
  namn: "Filmen om Fyndauktionen",
};

/**
 * Wix filer för en stående film. Wix räknar "720p" på höjden: filen är
 * 406×720, inte 720×1280. Mätt för årsfilmen 2026-11-28: 360p 1,5 MB,
 * 480p 2,0 MB, 720p 3,5 MB, 1080p 19 MB (Black Friday-filmen var lika stor).
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
 * Stillbilden (filmens omslag) i den storlek skärmen behöver (Wix skalar den,
 * och enc_auto ger avif eller webp när webbläsaren tar emot det).
 */
export function filmStillbild(film: Fyndfilm, bredd: number): string {
  const b = Math.max(1, Math.round(bredd));
  const h = Math.round((b * 16) / 9);
  return `https://static.wixstatic.com/media/${film.omslag}/v1/fill/w_${b},h_${h},al_c,q_80,enc_auto/fyndfilm.jpg`;
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

/** Filmen om den ska visas nu, annars null. En film utan slut visas alltid. */
export function aktivFilm(nuMs: number, film: Fyndfilm | null = FYNDFILM): Fyndfilm | null {
  if (!film) return null;
  if (film.slutarMs === null) return film;
  return Number.isFinite(nuMs) && nuMs < film.slutarMs ? film : null;
}
