// lib/price-range.ts — skalan för prisreglaget på listsidorna.
//
// Ersätter de hårdkodade pris-hinkarna (Under 100 / 100–250 / 250–500 / Över
// 500). Mätt mot katalogen 2026-08-21 filtrerade de ingenting: 0 produkter under
// 100 kr, 1 i 100–250, 67 i 250–500 och 768 — 91,9 % — över 500. Tre av fyra
// chips gav tom träfflista och det fjärde var hela butiken.
//
// Därför räknas skalan numera fram ur de produkter som FAKTISKT visas. Varje
// kategorisida får sitt eget spann, och siffrorna kan aldrig bli gamla när
// sortimentet ändras.
//
// TVÅ SAKER SOM STYR DESIGNEN:
//
// 1. Långa svansen. Katalogen går 199–19 459 kr men medianen är 1 054 och p95
//    ligger på 2 879. Ett reglage som sträcker sig till 19 459 lägger 85 % av
//    banan på 5 % av produkterna — då hamnar "under 1 000 kr" på de första
//    fyra procenten av dragsträckan och blir omöjligt att träffa. Skalan kapas
//    därför vid p95, och toppläget betyder "och uppåt" (`openTop`). Ingen
//    produkt blir onåbar: står handtaget i topp finns ingen övre gräns.
//
// 2. Hydrering. Etiketterna server-renderas på /alla-produkter och jämförs mot
//    klientens vid hydrering, så formateringen måste vara byte-identisk.
//    Ingen `Intl` här — Node och webbläsaren kan ha olika CLDR-version och
//    byta tusentalsavgränsare under fötterna på oss.
//
// Intervallen är halvöppna [min, max) — samma predikat som listan filtrerar
// med, så räknare och filter aldrig kan glida isär.

/** Minsta indataform, som SortableProduct i lib/sort-products.ts — så testerna
 *  slipper bygga hela Product-objekt. */
export interface PricedItem {
  priceNum: number;
}

export interface PriceBounds {
  /** Reglagets lägsta värde, avrundat nedåt till ett jämnt steg. */
  min: number;
  /** Reglagets högsta värde. Kan vara LÄGRE än katalogens dyraste pris — se
   *  `openTop`. */
  max: number;
  /** Stegets storlek i kronor (piltangenternas hopp). */
  step: number;
  /** true = det finns produkter dyrare än `max`, och toppläget betyder därför
   *  "och uppåt" utan övre gräns. */
  openTop: boolean;
}

/** Under så här många priser är ett reglage inte meningsfullt — då renderas
 *  inget prisfilter alls (t.ex. ett sökresultat med tre träffar). */
const MIN_ITEMS = 8;

/** Spridning under detta = alla kostar i praktiken lika mycket. */
const MIN_SPREAD = 1.5;

/** Andelen av katalogen som får ligga ovanför skalans topp. */
const TAIL_QUANTILE = 0.95;

/** Hur mycket dyrare den dyraste produkten måste vara än p95 för att det ska
 *  räknas som en svans värd att kapa. Under detta är fördelningen jämn nog att
 *  hela spannet ryms på banan, och då ska ingenting kapas — annars vore de
 *  dyraste fem procenten onåbara helt i onödan. */
const TAIL_FACTOR = 1.5;

/** Steget växer med spannet så reglaget alltid har 100–400 lägen: fint nog att
 *  träffa rätt, grovt nog att piltangenterna tar sig fram. */
function stepFor(span: number): number {
  if (span <= 300) return 10;
  if (span <= 1000) return 25;
  if (span <= 4000) return 50;
  if (span <= 20000) return 100;
  return 500;
}

const floorTo = (v: number, step: number) => Math.floor(v / step) * step;
const ceilTo = (v: number, step: number) => Math.ceil(v / step) * step;

/**
 * Reglagets skala, härledd ur listan i vyn.
 *
 * Ren funktion: inget `Date.now()`, ingen slump, och oberoende av indatans
 * ordning (priserna sorteras först) — så server och klient räknar fram exakt
 * samma skala och hydreringen håller.
 *
 * `null` = visa inget prisfilter.
 */
export function priceBounds(items: readonly PricedItem[]): PriceBounds | null {
  const prices = items
    .map((i) => i.priceNum)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  if (prices.length < MIN_ITEMS) return null;

  const lowest = prices[0];
  const highest = prices[prices.length - 1];
  if (highest <= lowest) return null;
  if (highest / lowest < MIN_SPREAD) return null;

  // Nearest-rank-kvantil: samma metod som en läsare skulle räkna för hand.
  const cap = prices[Math.min(prices.length - 1, Math.round(TAIL_QUANTILE * (prices.length - 1)))];

  // Kapa BARA när det finns en verklig svans. En jämn fördelning ska rymmas
  // hel på banan; annars skulle de dyraste fem procenten bli onåbara utan att
  // någon vinner något på det.
  const top = highest / cap >= TAIL_FACTOR ? cap : highest;

  const step = stepFor(top - lowest);
  const min = Math.max(0, floorTo(lowest, step));
  let max = ceilTo(top, step);

  // Kvantilen kan hamna så nära botten att skalan blir meningslös (t.ex. när
  // 95 % av produkterna kostar exakt samma). Då används hela spannet i stället.
  if (max - min < step * 2) max = ceilTo(highest, step);
  if (max - min < step * 2) return null;

  return { min, max, step, openTop: highest > max };
}

/**
 * Slug → rått intervall. Total funktion: `null` för tomt, skräp eller ologiskt.
 *
 * Grammatiken är oförändrad sedan hinkarna, så delade och bokmärkta länkar
 * fortsätter fungera: `?pris=under-100` sätter handtagen till 0–100 och visar
 * noll träffar — vilket är sanningen, det finns inga produkter under 100 kr.
 */
export function parsePriceSlug(slug?: string | null): { min: number; max: number } | null {
  if (!slug) return null;
  const num = (s: string) => (/^\d{1,7}$/.test(s) ? Number(s) : null);

  const under = /^under-(\d{1,7})$/.exec(slug);
  if (under) {
    const max = num(under[1]);
    return max && max > 0 ? { min: 0, max } : null;
  }

  const over = /^over-(\d{1,7})$/.exec(slug);
  if (over) {
    const min = num(over[1]);
    return min && min > 0 ? { min, max: Infinity } : null;
  }

  const span = /^(\d{1,7})-(\d{1,7})$/.exec(slug);
  if (span) {
    const min = num(span[1]);
    const max = num(span[2]);
    if (min == null || max == null || min >= max) return null;
    return { min, max };
  }

  return null;
}

/**
 * Handtagens läge → slug. Tom sträng när båda står i ytterlägena, alltså när
 * filtret är av — då försvinner `?pris` ur URL:en helt.
 */
export function priceSlug(lo: number, hi: number, bounds: PriceBounds): string {
  const atBottom = lo <= bounds.min;
  const atTop = hi >= bounds.max;
  if (atBottom && atTop) return "";
  if (atBottom) return `under-${hi}`;
  if (atTop) return `over-${lo}`;
  return `${lo}-${hi}`;
}

/**
 * Övre gränsen att filtrera på.
 *
 * Toppläget betyder ALLTID "ingen övre gräns" — även när skalan inte är kapad.
 * Annars hade `priceNum < max` sorterat bort den dyraste produkten så fort dess
 * pris råkade landa exakt på ett jämnt steg, med handtaget i neutralläge.
 */
export function upperLimit(hi: number, bounds: PriceBounds): number {
  return hi >= bounds.max ? Infinity : hi;
}

/** Deterministisk kronformatering. INTE Intl — se filhuvudet. */
export function formatPrice(n: number): string {
  const rounded = Math.round(n);
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} kr`;
}

/**
 * Läsbar text för det valda spannet, t.ex. "650–1 200 kr", "Under 900 kr",
 * "Från 1 500 kr". Används både i reglagets etikett och av skärmläsaren.
 */
export function priceRangeLabel(min: number, max: number): string {
  if (min <= 0 && !Number.isFinite(max)) return "Alla priser";
  if (min <= 0) return `Under ${formatPrice(max)}`;
  if (!Number.isFinite(max)) return `Från ${formatPrice(min)}`;
  const from = String(Math.round(min)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${from}–${formatPrice(max)}`;
}
