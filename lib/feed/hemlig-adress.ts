// lib/feed/hemlig-adress.ts
//
// PriceRunner- och GoWish-flödets hemliga adresser (Leonard 2026-11-26):
// /feed/pricerunner-<kod>.xml och /feed/gowish-<kod>.xml, serverade av
// app/feed/[fil]/route.ts. Samma mönster som Prisjakts hemliga adress
// (lib/feed/prisjakt-adress.ts).
//
// Varför: flödena bär hela katalogen med pris, lager och EAN på de varor som
// har en kod. På en öppen adress med ett standardnamn hämtar vem som helst
// allt i en fil (mätt 2026-11-25: /feed/pricerunner.xml, 10 415 varor och
// 3 655 EAN på 0,7 s, utan kod). Repot är publikt, så adressens form står att
// läsa för alla. Det som skyddar flödet är koden, och den står inte här.
//
// ☠️ KODERNA STÅR BARA I VERCEL, i PRICERUNNER_FLODE_KOD och GOWISH_FLODE_KOD.
// Aldrig i repot, i en PR, i CLAUDE.md eller i en loggrad. Leonard får
// adresserna i chatten och lägger in dem hos PriceRunner och GoWish.
//
// Saknas en variabel, eller är koden kortare än 32 tecken, finns ingen hemlig
// adress för det flödet: filnamnet svarar 404 som alla andra.
//
// De öppna adresserna (/feed/pricerunner.xml och /feed/gowish.xml) står kvar
// tills läsarna har bytt. Hur de stängs står i CLAUDE.md, "Flödenas hemliga
// adresser".
//
// LÖVMODUL med flit: bara node:crypto, så att `node --test` kan ladda den.

import { createHash, timingSafeEqual } from "node:crypto";

/** Kortare än så går att gissa sig till. Samma gräns som Prisjakts kod. */
export const MIN_KODLANGD = 32;

/**
 * Flödena med en hemlig adress, nycklade på namnet de sparas under
 * (lib/feed/flodeslager.ts): namnet i adressen, miljövariabeln med koden och
 * namnet som står i loggen. Loggen bär namnet, aldrig adressen.
 */
export const HEMLIGA_FLODEN = {
  "pricerunner.xml": { prefix: "pricerunner", variabel: "PRICERUNNER_FLODE_KOD", namn: "det hemliga PriceRunner-flödet" },
  "gowish.xml": { prefix: "gowish", variabel: "GOWISH_FLODE_KOD", namn: "det hemliga GoWish-flödet" },
} as const;

export type HemligtFlode = keyof typeof HEMLIGA_FLODEN;

/** Koden ur miljön, eller null när den saknas, är för kort eller bär annat än bokstäver och siffror. */
export function flodeskod(varde: string | undefined): string | null {
  const kod = (varde ?? "").trim();
  return kod.length >= MIN_KODLANGD && /^[A-Za-z0-9]+$/.test(kod) ? kod : null;
}

/**
 * Är filnamnet exakt <prefix>-<kod>.xml? Båda sidor hashas före jämförelsen, så
 * den tar lika lång tid oavsett hur långt ett felaktigt filnamn stämmer.
 */
export function arHemligFil(fil: string, prefix: string, kod: string | null): boolean {
  if (!kod) return false;
  const summa = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(summa(fil), summa(`${prefix}-${kod}.xml`));
}

/**
 * Flödet som filnamnet är den hemliga adressen till, eller null. Varje flöde
 * prövas, också efter en träff, så att svarstiden inte säger vilket som stämde.
 */
export function hemligtFlode(
  fil: string,
  miljo: Readonly<Record<string, string | undefined>> = process.env,
): HemligtFlode | null {
  let traff: HemligtFlode | null = null;
  for (const flode of Object.keys(HEMLIGA_FLODEN) as HemligtFlode[]) {
    const { prefix, variabel } = HEMLIGA_FLODEN[flode];
    if (arHemligFil(fil, prefix, flodeskod(miljo[variabel]))) traff = flode;
  }
  return traff;
}
