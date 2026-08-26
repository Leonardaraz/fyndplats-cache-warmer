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
//
// Ändras ordningen där MÅSTE den ändras här. lib/product-neighbours.test.ts har
// ett fall som fångar just steg 2, eftersom det är det icke-uppenbara ledet.
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
  return [...topp3, ...iKategorin.filter((p) => !toppIds.has(p.id))];
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

/** Bekvämlighet: bygger ordningen och plockar grannarna i ett svep. */
export function produktGrannar(
  alla: Product[],
  katIds: Set<string>,
  slug: string,
): Grannar<Product> {
  return grannar(kategoriOrdning(alla, katIds), slug);
}
