// Produktsidornas cachetid och cachetaggar. LÖVMODUL med flit: inga importer,
// så `node --test` kan ladda den.
//
// VARFÖR SEX TIMMAR, OCH VARFÖR TAGGAR PER PRODUKT (2026-10-01).
//
// Mätt i Vercel Observability 2026-09-30, 12 h utan deploy: /produkt/[slug]
// byggdes om ~12 000 gånger (24K ISR-skrivningar, 126K av sajtens 163K
// skrivenheter, 1 h Active CPU). Sidan sade `revalidate = 3600`, men
// V3-hämtningen i lib/products.ts hade `revalidate: 300`, och Next sänker HELA
// rutten till den lägsta fetch-tiden (node_modules/next/dist/docs/01-app/
// 02-guides/caching-without-cache-components.md, "Revalidation frequency").
// Sidorna byggdes alltså om var femte minut så fort någon (kund, sökmotor,
// länkförladdning) tittade.
//
// Nu: sidan och ALLA hämtningar på produktsidans väg har minst sex timmar, och
// en ändring på en produkt tömmer just den produktens poster direkt:
//   · Wix-sidan av ändringen (pris, lager, synlighet, text, bilder — synken,
//     fyndauktionen, Leonards egna ändringar) fångas av /api/cron/uppdatera-andrade
//     via V3-fältet updatedDate, var femte minut.
//   · Köp: samma cron läser nya ordrar och tömmer de köpta produkterna (lagret).
//   · Motorns sida (recensioner) fångas av samma cron via motorns
//     /api/review-andringar.
//   · Motorn kan dessutom säga till direkt (fyndauktionens prissteg) via
//     /api/admin/uppdatera-produkter.
// Sex timmar är ett SÄKERHETSNÄT, inte färskheten. Leonard 2026-09-30: sex, inte
// tolv, tills det har fungerat en vecka.
//
// ⚠️ EN PRODUKT SOM RADERAS I WIX UTAN ATT DÖLJAS FÖRST syns inte i updatedDate
// (den finns inte kvar att fråga på). Dess sida ligger kvar tills säkerhetsnätet
// går ut. Dölj först och radera sedan — det gör motorn själv.
//
// ☠️ EN GLOBAL TAGG TÖMMER ALLT. "reviews" sitter på varje produktsidas
// recensionshämtning, så revalidateTag("reviews") gör alla ~3 700 sidor inaktuella
// på en gång — en massombyggnad. Uppdatera därför med taggarna nedan, per produkt.

/** Produktsidans säkerhetsnät i sekunder. Måste vara samma tal som `revalidate`
 *  i app/produkt/[slug]/page.tsx (den måste vara en literal) — lib/produkt-cache.test.ts
 *  håller ihop dem. */
export const PRODUKTSIDA_SEKUNDER = 21600;

/** Wix V3-produkten (pris per variant, bilder per färg, alt-texter). */
export const produktTagg = (wixId: string) => `produkt-${wixId}`;
/** Motorns recensioner för produkten. */
export const recensionsTagg = (wixId: string) => `recensioner-${wixId}`;
/** Motorns produktsäkerhetsuppgifter (GPSR). */
export const gpsrTagg = (wixId: string) => `gpsr-${wixId}`;

/** Alla taggar en produktsida bär per produkt — för en tömning för hand
 *  (/api/admin/revalidate?tag=…). Den automatiska tömningen tar bara den tagg
 *  som hör till det som ändrats, se `planeraUppdatering`. */
export function produktensTaggar(wixId: string): string[] {
  return [produktTagg(wixId), recensionsTagg(wixId), gpsrTagg(wixId)];
}

// ─── Vad som ska tömmas när produkter ändrats ───────────────────────────────
// Ren planering. Själva tömningen och uppslagen mot Wix ligger i
// lib/produktsidor-uppdatera.ts (som inte kan laddas av node --test).

/** Vad som ändrats. Styr vilken tagg som töms: en prisändring behöver inte
 *  hämta om recensionerna, och tvärtom. GPSR töms aldrig automatiskt — uppgifterna
 *  ändras bara när leverantören skriver om en text, och motorns svar ligger ändå
 *  i dess CDN i en timme. */
export type Andring = "produkt" | "recensioner";

export interface AndradProdukt {
  /** Wix-produktens id. */
  id: string;
  /** Nuvarande slug, om avsändaren vet den. Annars slås den upp i Wix. */
  slug?: string;
  /** Tidigare slugar (en omdöpt produkt): deras sidor töms också. */
  gamlaSlugs?: string[];
  /** Vad som ändrats. Saknas det räknas det som produkten (pris, lager, text, bilder). */
  vad?: Andring;
}

/** Högst så många gamla slugar per produkt. */
const MAX_GAMLA_SLUGS = 10;

export interface Uppdateringsplan {
  /** Unika, giltiga produkt-id:n. */
  ids: string[];
  /** Cachetaggar att tömma, per produkt (aldrig en global tagg). */
  taggar: string[];
  /** Sidor att tömma, /produkt/<slug>. */
  sokvagar: string[];
  /** Nuvarande slugar — de här sidorna värms efteråt. */
  slugs: string[];
  /** Id:n vi inte hittade någon slug för: bara taggarna töms. */
  utanSlug: string[];
  /** Poster som föll bort som ogiltiga. */
  ogiltiga: number;
}

// Wix-id:n är GUID. En slug blir en sökväg (/produkt/<slug>) som både töms och
// värms, så bara bokstäver, siffror, bindestreck och understreck släpps igenom:
// en punkt, ett bakåtsnedstreck eller ett kontrolltecken hade kunnat peka
// värmningen mot en annan rutt (URL-tolken gör `\..\` till `/../`). Alla 3 696
// produktslugar i sitemapen 2026-09-30 var a–z, 0–9 och bindestreck; bokstäver
// utöver a–z (ÅÄÖ) tillåts ändå, för säkerhets skull.
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[\p{L}\p{N}_-]{1,200}$/u;

export const giltigtId = (id: unknown): id is string => typeof id === "string" && ID.test(id.trim());
export const giltigSlug = (s: unknown): s is string => typeof s === "string" && SLUG.test(s.trim());

/**
 * Slår ihop posterna per id och räknar fram taggar och sökvägar.
 * `slugPerId` är Wix-uppslaget för id:n som saknade slug (och vinner inte över
 * en slug avsändaren skickat — den är färskare än ett uppslag som kan släpa).
 */
export function planeraUppdatering(
  poster: readonly AndradProdukt[],
  slugPerId: ReadonlyMap<string, string> = new Map(),
): Uppdateringsplan {
  const perId = new Map<string, { slug?: string; gamla: Set<string>; produkt: boolean; recensioner: boolean }>();
  let ogiltiga = 0;
  for (const p of poster) {
    if (!p || typeof p !== "object" || !giltigtId(p.id)) {
      ogiltiga++;
      continue;
    }
    const id = p.id.trim().toLowerCase();
    const rad = perId.get(id) ?? { gamla: new Set<string>(), produkt: false, recensioner: false };
    if (giltigSlug(p.slug)) rad.slug = p.slug.trim();
    const gamla = Array.isArray(p.gamlaSlugs) ? p.gamlaSlugs.slice(0, MAX_GAMLA_SLUGS) : [];
    for (const g of gamla) if (giltigSlug(g)) rad.gamla.add(g.trim());
    if (p.vad === "recensioner") rad.recensioner = true;
    else rad.produkt = true;
    perId.set(id, rad);
  }

  const ids = [...perId.keys()];
  const taggar: string[] = [];
  for (const [id, rad] of perId) {
    if (rad.produkt) taggar.push(produktTagg(id));
    if (rad.recensioner) taggar.push(recensionsTagg(id));
  }
  const sokvagar = new Set<string>();
  const slugs: string[] = [];
  const utanSlug: string[] = [];
  for (const [id, rad] of perId) {
    const slug = rad.slug ?? slugPerId.get(id);
    if (slug && giltigSlug(slug)) {
      sokvagar.add(`/produkt/${slug}`);
      slugs.push(slug);
    } else {
      utanSlug.push(id);
    }
    for (const g of rad.gamla) sokvagar.add(`/produkt/${g}`);
  }
  return { ids, taggar, sokvagar: [...sokvagar], slugs: [...new Set(slugs)], utanSlug, ogiltiga };
}

/** Id:n som behöver slås upp i Wix innan planen kan göras komplett. */
export function behoverSlug(poster: readonly AndradProdukt[]): string[] {
  const med = new Set<string>();
  const alla = new Set<string>();
  for (const p of poster) {
    if (!p || typeof p !== "object" || !giltigtId(p.id)) continue;
    const id = p.id.trim().toLowerCase();
    alla.add(id);
    if (giltigSlug(p.slug)) med.add(id);
  }
  return [...alla].filter((id) => !med.has(id));
}
