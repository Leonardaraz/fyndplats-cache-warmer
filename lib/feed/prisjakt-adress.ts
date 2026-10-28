// lib/feed/prisjakt-adress.ts
//
// Den hemliga adressen till Prisjakt-flödet med märke och artikelnummer:
// /feed/prisjakt-<kod>.xml (app/feed/[fil]/route.ts).
//
// ☠️ KODEN STÅR BARA I VERCEL, i miljövariabeln PRISJAKT_FLODE_KOD. Aldrig i
// repot, i en PR, i CLAUDE.md eller i en loggrad. Leonard får adressen i
// chatten och lägger in den i Prisjakts Business Center. Flödet på adressen bär
// Aosoms artikelnummer, och adressen är det enda som skyddar dem.
//
// Saknas variabeln, eller är koden kortare än 32 tecken, finns ingen hemlig
// adress alls: varje filnamn svarar 404. Hellre inget flöde än ett som går att
// gissa sig till.
//
// LÖVMODUL med flit: bara node:crypto, så att `node --test` kan ladda den.

import { createHash, timingSafeEqual } from "node:crypto";

/** Kortare än så går att gissa sig till (Leonard 2026-10-28: minst 32 tecken). */
export const MIN_KODLANGD = 32;

/** Koden ur miljön, eller null när den saknas, är för kort eller bär annat än bokstäver och siffror. */
export function prisjaktKod(varde: string | undefined = process.env.PRISJAKT_FLODE_KOD): string | null {
  const kod = (varde ?? "").trim();
  return kod.length >= MIN_KODLANGD && /^[A-Za-z0-9]+$/.test(kod) ? kod : null;
}

/**
 * Är filnamnet den hemliga adressen? Båda sidor hashas före jämförelsen, så den
 * tar lika lång tid oavsett hur långt ett felaktigt filnamn stämmer.
 */
export function arHemligPrisjaktFil(fil: string, kod: string | null): boolean {
  if (!kod) return false;
  const summa = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(summa(fil), summa(`prisjakt-${kod}.xml`));
}
