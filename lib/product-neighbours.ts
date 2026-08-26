// lib/product-neighbours.ts
//
// "Föregående / Nästa produkt" på produktsidan, så besökaren kan bläddra vidare
// i avdelningen utan att backa till kategorisidan varje gång.
//
// ORDNINGEN ÄR INTE FRI. Pilarna måste peka på de produkter som faktiskt stod
// bredvid varandra på kategorisidan besökaren kom ifrån — annars känns "nästa"
// slumpmässig. Därför speglar kategoriOrdning() exakt vad
// app/kategori/[slug]/page.tsx gör när den bygger sin lista:
//
//   1. filtrera på kategori + underkategorier (collectionIds-membership)
//   2. de tre högsta bild-poängen först (bästa bilderna möter besökaren)
//   3. resten i katalogordning
//   4. dedupeProducts() — släpper produkter som delar bild med en tidigare
//
// Steg 4 kommer in som en funktion utifrån (`efterbehandla`) i stället för att
// importeras: dedupeProducts bor i lib/products.ts, som drar in JSON och IO och
// därför inte kan laddas av node --test. Att skriva av den här hade gett två
// kopior som glider isär. Anroparen skickar in originalet.
//
// Utan steg 4 kunde "nästa" peka på en produkt som ALDRIG syntes på
// kategorisidan — den hade filtrerats bort där som dubblett-bild — och
// räknaren ("12 av 48") hade räknat produkter besökaren inte kan nå därifrån.
//
// Ändras ordningen på kategorisidan MÅSTE den ändras här. Testfilen har fall
// för steg 2 och steg 4, eftersom det är de två icke-uppenbara leden.
//
// EN AVVIKELSE FRÅN KATEGORISIDAN, med flit: slutsålda produkter hoppas över
// (se utanSlutsalda längst ned). Kategorisidan visar dem med en bricka —
// bläddringen ska inte leda in i en återvändsgränd.
//
// VAD VI MEDVETET INTE GÖR:
//
// • Ingen rundgång. Första produkten har ingen föregående, sista ingen nästa.
//   Ett varv tillbaka till början ser ut som en bugg för den som bläddrat långt.
// • Vi följer inte besökarens faktiska väg in. Kom hen via sök, startsidan eller
//   en kampanjlänk finns ingen lista att gå vidare i — huvudavdelningen är den
//   enda ordning som alltid finns och alltid är densamma. Att i stället skicka
//   listan via query-parametrar hade gett delade länkar olika innehåll och
//   spätt ut ISR-cachen per inkommande väg.
// • REA och Populära hanteras inte särskilt. De är merchandising-sidor som
//   byggs av produktflaggor, inte kategorier, och en produkt kan ligga i båda.
//   Huvudavdelningen är entydig.
//
// Ren funktion, inga sidoeffekter, bara typ-import av Product (raderas vid
// kompilering) — därför enhetstestbar i node --test.

import type { Product } from "./products";

/** Minsta form funktionerna behöver. Listsidorna skickar en smalare produkt. */
type Bladdringsbar = {
  id: string;
  slug: string;
  name: string;
  imageScore?: number;
  collectionIds?: string[];
  inStock?: boolean;
};

export type Grannar<T> = {
  forra: T | null;
  nasta: T | null;
  /** 1-baserat läge i avdelningen, för "12 av 48". Null om produkten saknas. */
  position: number | null;
  antal: number;
};

/**
 * Kategorisidans ordning, återskapad.
 *
 * `katIds` ska innehålla avdelningens id OCH dess underkategoriers — samma
 * mängd som kategorisidan bygger. Skickas en tom mängd blir listan tom.
 */
export function kategoriOrdning<T extends Bladdringsbar>(
  alla: T[],
  katIds: Set<string>,
  /** Kategorisidans dedupeProducts. Utelämnad → ingen efterbehandling. */
  efterbehandla?: (lista: T[]) => T[],
): T[] {
  if (!katIds.size) return [];
  const iKategorin = alla.filter((p) =>
    (p.collectionIds || []).some((cid) => katIds.has(cid)),
  );
  // Steg 2: samma "tre bästa bilderna först" som kategorisidan. Sorteringen
  // görs på en kopia — alla får aldrig muteras, den delas med anroparen.
  const topp3 = [...iKategorin]
    .sort((a, b) => (b.imageScore ?? 60) - (a.imageScore ?? 60))
    .slice(0, 3);
  const toppIds = new Set(topp3.map((p) => p.id));
  const ordnad = [...topp3, ...iKategorin.filter((p) => !toppIds.has(p.id))];
  return efterbehandla ? efterbehandla(ordnad) : ordnad;
}

/**
 * Produkterna före och efter `slug` i avdelningens ordning.
 *
 * Returnerar null i båda ändarna av listan, och för en produkt som inte finns i
 * ordningen alls (kan hända om katalogen ändrats mellan två ISR-renderingar).
 */
export function grannar<T extends Bladdringsbar>(
  ordning: T[],
  slug: string,
): Grannar<T> {
  const i = ordning.findIndex((p) => p.slug === slug);
  if (i < 0) return { forra: null, nasta: null, position: null, antal: ordning.length };
  return {
    forra: i > 0 ? ordning[i - 1] : null,
    nasta: i < ordning.length - 1 ? ordning[i + 1] : null,
    position: i + 1,
    antal: ordning.length,
  };
}

/**
 * Släpper slutsålda produkter ur en bläddringslista — utom den man tittar på.
 *
 * HÄR SKILJER SIG BLÄDDRINGEN FRÅN KATEGORISIDAN, med flit. Kategorisidan visar
 * slutsålda med en "Slutsåld"-bricka och dämpad bild: kunden ser dem, kan
 * bevaka dem, och de bär fortfarande SEO-värde. Men att BLÄDDRA in i en produkt
 * man inte kan köpa är en återvändsgränd — man klickade "Nästa" för att se
 * nästa sak att handla, inte nästa sak att inte kunna handla.
 *
 * Konsekvensen är att räknaren ("12 av 48") räknar KÖPBARA produkter, och alltså
 * kan visa ett lägre antal än kategorisidan listar. Det är rätt: den beskriver
 * hur många steg bläddringen har, inte hur många kort som finns.
 *
 * Undantaget för `slug` är nödvändigt. Landar man på en slutsåld produkt (från
 * kategorisidan, sök eller en gammal länk) och den filtrerats bort finns den
 * inte i ordningen, och då hade grannar() svarat null i båda ändarna — man
 * hade blivit strandsatt utan bläddring alls, på precis den sida där man mest
 * vill vidare.
 */
function utanSlutsalda<T extends Bladdringsbar>(alla: T[], slug: string): T[] {
  // inStock === false är det enda som räknas som slutsåld. Saknas fältet
  // (smalare produkttyper på vissa ytor) behåller vi produkten hellre än att
  // gissa bort den.
  return alla.filter((p) => p.inStock !== false || p.slug === slug);
}

/** Bekvämlighet: bygger ordningen och plockar grannarna i ett svep. */
export function produktGrannar(
  alla: Product[],
  katIds: Set<string>,
  slug: string,
  efterbehandla?: (lista: Product[]) => Product[],
): Grannar<Product> {
  return grannar(
    kategoriOrdning(utanSlutsalda(alla, slug), katIds, efterbehandla),
    slug,
  );
}

export { utanSlutsalda };
