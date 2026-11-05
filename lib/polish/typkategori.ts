// lib/polish/typkategori.ts
//
// POLERRUNDAN KAN INTE MISSA PRODUKTTYPENS KATEGORI (2026-11-04).
//
// Runbookens regel (docs/polish/runbook/05-skriv-texten.md) är att koppla
// föräldern, det smalaste lövet och sökordskategorin. Runda n328 kopplade en
// uppresningsfåtölj till Möbler, Fåtöljer och Massage & Återhämtning men inte
// till Uppresningsfåtöljer. Butikens brödsmula valde då Skönhet & Hälsa →
// Massage & Återhämtning, och ChatGPT:s audit 2026-11-03 hittade det. Två till
// stolar saknade samma koppling. En regel man måste komma ihåg glöms bort, så
// kategoristeget stoppar nu planen i stället.
//
// REGELN. Produktnamnets huvudfras är texten före den första prepositionen
// eller det första tankstrecket ("Elektrisk uppresningsfåtölj" i "Elektrisk
// uppresningsfåtölj med liggfunktion – chenille"). Är ett ord i den EXAKT en
// synlig underkategoris namn i plural eller singular, ska produkten ligga i
// kategorin. Ett ord som bara börjar likadant ("fåtöljskydd") kräver
// ingenting, och det som står efter "med" ("med pall") räknas inte.
//
// UNDANTAG. Planen kan undanta en kategori med ett skrivet skäl (`katUndantag`),
// till exempel en akvarielampa som inte hör hemma i Lampor. Skälet står kvar i
// rundans plan, så valet går att läsa i efterhand.

import type { KategoriNod } from "../wix/kategoritrad";

const GEMENER = (s: string) => s.toLocaleLowerCase("sv-SE");

/**
 * Ordformerna för ett kategorinamn i ett ord: pluralen som den står och de
 * troliga singularerna. Svensk plural är inte regelbunden, så formerna är
 * kandidater; en form som inte finns i något produktnamn kostar ingenting.
 * Namn med flera ord, "&" eller siffror ger inga former och kräver aldrig något.
 */
export function ordformer(kategorinamn: string): string[] {
  const n = GEMENER(kategorinamn.trim());
  if (!/^[a-zåäöéü]+$/.test(n)) return [];
  const ut = new Set([n]);
  if (n.length > 4 && n.endsWith("or")) ut.add(`${n.slice(0, -2)}a`); // soffor → soffa, lådor → låda
  if (n.length > 4 && n.endsWith("ar")) {
    ut.add(n.slice(0, -2)); // stolar → stol
    ut.add(`${n.slice(0, -2)}e`); // kuddar → kudde
  }
  if (n.length > 4 && n.endsWith("er")) ut.add(n.slice(0, -2)); // fåtöljer → fåtölj
  return [...ut];
}

/** Ord som avslutar huvudfrasen. */
const SLUT_PA_HUVUDFRAS = /\s(?:med|för|i|på|till|och|av|utan|från)\s|\s[–—-]\s|[,(:]/i;

/** Produktnamnets huvudfras, gemener: allt före den första prepositionen eller det första tankstrecket. */
export function huvudfras(namn: string): string {
  const s = ` ${namn.trim()} `;
  const m = SLUT_PA_HUVUDFRAS.exec(s);
  return GEMENER((m ? s.slice(0, m.index) : s).trim());
}

/** Huvudfrasens ord. Bindestreck inne i ett ord delar det ("uv-lampa" → "uv", "lampa"). */
export function huvudord(namn: string): Set<string> {
  return new Set(huvudfras(namn).split(/[^a-zåäöéü]+/).filter(Boolean));
}

export interface Typkrav {
  kategori: string;
  ord: string;
}

/** Underkategorierna produktnamnet kräver. Bara synliga underkategorier räknas. */
export function typkategorier(namn: string, trad: readonly KategoriNod[]): Typkrav[] {
  const ord = huvudord(namn);
  const ut: Typkrav[] = [];
  for (const k of trad) {
    if (!k.foralder || !k.synlig) continue;
    const traff = ordformer(k.namn).find((f) => ord.has(f));
    if (traff) ut.push({ kategori: k.namn, ord: traff });
  }
  return ut;
}

/** Krav som produkten i planen varken uppfyller eller undantar. */
export function saknadeTypkategorier(
  p: { namn: string; kat: readonly string[]; katUndantag?: ReadonlyArray<{ kat: string; skal?: string }> },
  trad: readonly KategoriNod[],
): Typkrav[] {
  const har = new Set(p.kat);
  const undantagna = new Set((p.katUndantag ?? []).map((u) => u.kat));
  return typkategorier(p.namn, trad).filter((k) => !har.has(k.kategori) && !undantagna.has(k.kategori));
}
