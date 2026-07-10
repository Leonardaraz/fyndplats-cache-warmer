// lib/auction/engine.ts
//
// Fyndauktionen — ren prislogik (inga sidoeffekter, fullt enhetstestbar).
//
// Modellen är en holländsk auktion ("priset sjunker tills någon köper"):
// varje auktion har en PRISSTEGE (ladder) från listpris ner till ett golv,
// och priset kliver nedåt ett steg var `stepMinutes`:e minut från `startAt`.
// Golvet räknas ur VERKLIG landad kostnad (FyndplatsMappings.landedCostSek)
// så varje försäljning är vinstskyddad — se buildFloor().
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
  /** Lägsta tillåtna pris (inkl. moms) — vinstskyddat, visas ALDRIG för kund. */
  floorPrice: number;
  /** Fallande prisstege, [0] = listPrice … sista = floorPrice. Alla slutar på 9. */
  ladder: number[];
  /** Minuter mellan prissteg. */
  stepMinutes: number;
  /** 1–5 för live-auktioner, 0 för kö. */
  slot: number;
  status: AuctionStatus;
  /** Kösortering (lägst främjas först). */
  queueOrder: number;
  /** ISO — sätts när auktionen blir live. */
  startAt?: string;
  /** ISO — sätts vid sold/expired. */
  endedAt?: string;
  /** Priset affären gick på (sold). */
  soldPrice?: number;
  /** Senast PATCH:at pris i Wix — undviker onödiga PATCH-anrop. */
  lastPatchedPrice?: number;
}

/** Avrunda UPPÅT till närmaste heltal som slutar på 9 (butikens prisregel). */
export function up9(n: number): number {
  let v = Math.ceil(n);
  while (v % 10 !== 9) v++;
  return v;
}

/**
 * Vinstskyddat golv ur verklig landad kostnad (exkl. moms).
 * Krav: nettointäkt (pris/1,25) minus ~3 % avgiftsbuffert (Klarna m.m.) ska
 * fortfarande täcka kostnaden ⇒ pris ≥ landedCost × 1,25 / 0,97 ≈ × 1,29.
 * Avrundas upp till 9-slut och klampas till högst listpriset.
 */
export function buildFloor(listPrice: number, landedCostSek: number): number {
  const minProfitable = up9(landedCostSek * 1.29);
  return Math.min(minProfitable, listPrice);
}

/**
 * Fallande prisstege list → floor med `steps` steg, alla 9-slut, strikt
 * fallande (dubbletter från avrundningen slås ihop). Alltid minst [list].
 */
export function buildLadder(listPrice: number, floorPrice: number, steps = 16): number[] {
  const list = up9(listPrice - 1 + 1) === listPrice ? listPrice : up9(listPrice);
  const floor = Math.min(up9(floorPrice), list);
  const out: number[] = [list];
  for (let i = 1; i <= steps; i++) {
    const raw = list - ((list - floor) * i) / steps;
    const p = up9(raw);
    if (p < out[out.length - 1] && p >= floor) out.push(p);
  }
  if (out[out.length - 1] !== floor && floor < out[out.length - 1]) out.push(floor);
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

/** ISO-tid för NÄSTA prissänkning, eller null om golvet är nått. */
export function nextDropAt(doc: Pick<AuctionDoc, "startAt" | "stepMinutes" | "ladder">, nowMs: number): string | null {
  if (!doc.startAt) return null;
  const idx = stepIndexAt(doc, nowMs);
  if (idx >= doc.ladder.length - 1) return null;
  return new Date(Date.parse(doc.startAt) + (idx + 1) * doc.stepMinutes * 60_000).toISOString();
}

/**
 * Har auktionen legat på golvet längre än fristen (⇒ ska förfalla + roteras)?
 * Fristen räknas från när sista steget nåddes.
 */
export function isExpired(
  doc: Pick<AuctionDoc, "startAt" | "stepMinutes" | "ladder">,
  nowMs: number,
  graceHours = 24,
): boolean {
  if (!doc.startAt) return false;
  const floorReachedMs = Date.parse(doc.startAt) + (doc.ladder.length - 1) * doc.stepMinutes * 60_000;
  return nowMs > floorReachedMs + graceHours * 3_600_000;
}
