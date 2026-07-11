// lib/auction/engine.ts
//
// Fyndauktionen — ren prislogik (inga sidoeffekter, fullt enhetstestbar).
//
// Modellen är en DAGLIG holländsk auktion ("priset sjunker tills någon köper"):
//
//   07:00 svensk tid  →  start på ORDINARIE pris (marknadsföringslagen: start-
//                        priset måste vara det verkliga ordinarie priset)
//   varje hel timme   →  priset kliver nedåt ett steg i PRISSTEGEN (ladder)
//   18:00             →  golvet nås (max −7 % marginal, se buildFloor)
//   18:00–19:00       →  sista timmen ligger på golvet — "först till kvarn"
//   19:00             →  dagen är slut, priset återställs och nästa produkt
//                        i kön schemaläggs för nästa 07:00
//
// Golvet räknas ur VERKLIG landad kostnad (FyndplatsMappings.landedCostSek,
// exkl. moms): Leonard accepterar max −7 % marginal på nettot, dvs.
// brutto ≥ kostnad × 1,25 / 1,07. Klarna-avgift (~2–3 %) tillkommer utanpå.
//
// Tick-cronen (app/api/cron/auction-tick) läser stegen och PATCH:ar Wix-priset
// när målsteget ändras; storefronten visar Wix-priset (källan till sanning)
// och räknar bara ut NÄSTA sänkning ur samma stege.

export type AuctionStatus = "queued" | "live" | "sold" | "expired";

export interface AuctionDoc {
  /** Wix Data _id (auto). */
  _id?: string;
  productId: string;
  slug: string;
  name: string;
  /** Ordinarie pris (inkl. moms) när auktionen skapades. Återställs vid slut. */
  listPrice: number;
  /** Lägsta tillåtna pris (inkl. moms) — max −7 % marginal, visas ALDRIG för kund. */
  floorPrice: number;
  /**
   * Timindexerad prisstege: ladder[i] gäller timmen startAt + i·stepMinutes.
   * [0] = listPrice (07:00) … sista = floorPrice (18:00). Icke-stigande;
   * dubbletter betyder "ingen sänkning den timmen" (9-slutsavrundningen).
   */
  ladder: number[];
  /** Minuter mellan prissteg (60 = en sänkning i timmen). */
  stepMinutes: number;
  /** 1–5 för live-auktioner, 0 för kö. */
  slot: number;
  status: AuctionStatus;
  /** Kösortering (lägst främjas först). */
  queueOrder: number;
  /** ISO — auktionsdagens 07:00. Kan ligga i framtiden (schemalagd i förväg). */
  startAt?: string;
  /** ISO — sätts vid sold/expired. */
  endedAt?: string;
  /** Priset affären gick på (sold). */
  soldPrice?: number;
  /** Senast PATCH:at pris i Wix — undviker onödiga PATCH-anrop. */
  lastPatchedPrice?: number;
}

/** Auktionsdagens längd i timmar: 07:00 → 19:00. */
export const AUCTION_DAY_HOURS = 12;

/** Antal sänksteg: en per timme 08:00–18:00; sista timmen ligger på golvet. */
export const LADDER_STEPS = AUCTION_DAY_HOURS - 1;

/** Svensk väggklockstimme då auktionsdagen börjar. */
export const AUCTION_START_HOUR = 7;

/** Avrunda UPPÅT till närmaste heltal som slutar på 9 (butikens prisregel). */
export function up9(n: number): number {
  let v = Math.ceil(n);
  while (v % 10 !== 9) v++;
  return v;
}

/**
 * Golv ur verklig landad kostnad (exkl. moms) vid max −7 % marginal:
 * nettointäkt (pris/1,25) får understiga kostnaden med högst 7 %
 * ⇒ pris ≥ kostnad × 1,25 / 1,07 (≈ × 1,168). Avrundas upp till 9-slut
 * (så verklig förlust blir strax UNDER 7 %) och klampas till högst listpriset.
 * OBS: Klarna-avgiften (~2–3 %) ligger utanför — värsta fallet ≈ −9–10 % allt-i-allt.
 */
export function buildFloor(listPrice: number, landedCostSek: number): number {
  const minAllowed = up9((landedCostSek * 1.25) / 1.07);
  return Math.min(minAllowed, listPrice);
}

/**
 * Timindexerad prisstege list → floor med exakt `steps`+1 rungor:
 * [0] = listPrice (07:00, ordinarie — rundas ALDRIG upp), [steps] = floorPrice
 * (18:00). Mellansteg 9-slutsavrundas och klampas icke-stigande; dubbletter
 * (= ingen sänkning den timmen) är tillåtna och hoppas över av nextDropAt.
 */
export function buildLadder(listPrice: number, floorPrice: number, steps = LADDER_STEPS): number[] {
  const floor = Math.min(floorPrice, listPrice);
  const out: number[] = [listPrice];
  for (let i = 1; i <= steps; i++) {
    const raw = listPrice - ((listPrice - floor) * i) / steps;
    out.push(Math.max(Math.min(up9(raw), out[i - 1]), floor));
  }
  out[steps] = floor;
  return out;
}

/** Aktuellt stegindex för en live-auktion vid tidpunkten `nowMs`. */
export function stepIndexAt(doc: Pick<AuctionDoc, "startAt" | "stepMinutes" | "ladder">, nowMs: number): number {
  if (!doc.startAt) return 0;
  const elapsed = nowMs - Date.parse(doc.startAt);
  if (elapsed <= 0) return 0;
  const idx = Math.floor(elapsed / (doc.stepMinutes * 60_000));
  return Math.min(idx, doc.ladder.length - 1);
}

/** Aktuellt målpris för en live-auktion. */
export function priceAt(doc: Pick<AuctionDoc, "startAt" | "stepMinutes" | "ladder">, nowMs: number): number {
  return doc.ladder[stepIndexAt(doc, nowMs)];
}

/**
 * ISO-tid för NÄSTA faktiska prissänkning (dubblettrungor hoppas över),
 * eller null om inga lägre rungor återstår (golvet är nått).
 */
export function nextDropAt(doc: Pick<AuctionDoc, "startAt" | "stepMinutes" | "ladder">, nowMs: number): string | null {
  if (!doc.startAt) return null;
  const idx = stepIndexAt(doc, nowMs);
  const current = doc.ladder[idx];
  for (let j = idx + 1; j < doc.ladder.length; j++) {
    if (doc.ladder[j] < current) {
      return new Date(Date.parse(doc.startAt) + j * doc.stepMinutes * 60_000).toISOString();
    }
  }
  return null;
}

/**
 * Är auktionsdagen slut (19:00)? Varje runga får ett stepMinutes-intervall,
 * så dagens slut = startAt + ladder.length · stepMinutes (12 rungor × 60 min
 * = 12 h efter 07:00). Ett framtida startAt är per definition inte förfallet.
 */
export function isExpired(doc: Pick<AuctionDoc, "startAt" | "stepMinutes" | "ladder">, nowMs: number): boolean {
  if (!doc.startAt) return false;
  const dayEndMs = Date.parse(doc.startAt) + doc.ladder.length * doc.stepMinutes * 60_000;
  return nowMs >= dayEndMs;
}

/** Svensk väggklockstimme (0–23) för en given tidpunkt — DST-säkert via Intl. */
function stockholmHour(ms: number): number {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "numeric",
    hour12: false,
  }).format(new Date(ms));
  return Number.parseInt(formatted, 10);
}

/**
 * Nästa 07:00 svensk väggklocka som ISO — DST-säkert (Sverige ligger alltid på
 * heltimmesoffset, så 07:00 sammanfaller med en hel UTC-timme; vi vandrar
 * timgränserna framåt tills Stockholmsklockan visar 07). Om `nowMs` är EXAKT
 * 07:00 returneras den tidpunkten (dagen kan börja direkt).
 */
export function nextStartAt(nowMs: number): string {
  const HOUR = 3_600_000;
  let t = Math.ceil(nowMs / HOUR) * HOUR;
  for (let i = 0; i <= 49; i++, t += HOUR) {
    if (stockholmHour(t) === AUCTION_START_HOUR) return new Date(t).toISOString();
  }
  throw new Error("nextStartAt: ingen 07:00 hittades inom 49 timmar (borde vara omöjligt)");
}
