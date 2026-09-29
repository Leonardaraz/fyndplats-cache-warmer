// Vad butiken får veta om en auktion, och vem som får fråga.
//
// Butiken (grenen headless-site) läste FyndplatsAuctions direkt ur Wix Data
// fram till 2026-09-29. Raderna flyttar till Postgres för att Wix-taket på
// 4 000 rader var fullt, och en butik som fortsatt läsa Wix hade efter
// raderingen visat en TOM fyndauktion — utan ett enda fel. Samma lärdom som
// /api/tracking-events 2026-09-01 och recensionerna 2026-09-02. Därför går
// butiken via motorns rutter och följer med i växlingen.
//
// ☠️ PROJEKTIONEN ÄR EN ALLOWLIST. `floorPrice` och `variantPrices` avslöjar
// golvet, och golvet visas ALDRIG för kund. Stegen (`ladder`) följer med bara
// för live-rader: butikens server räknar "nästa sänkning" ur den och skickar
// aldrig vidare den till klienten (lib/auction-view.ts på butiksgrenen). Det
// är samma förtroende som när butiken läste raden ur Wix med egen nyckel —
// och därför kräver rutterna en hemlighet, precis som Wix-nyckeln gjorde.

import type { AuctionDoc } from "./engine";

/** Fälten butiken läser. Allt annat stannar i motorn. */
export interface ButiksRad {
  productId: string;
  slug: string;
  name: string;
  listPrice: number;
  status: string;
  slot: number;
  startAt?: string;
  endedAt?: string;
  soldPrice?: number;
  /** Bara live: stegen butikens server räknar nästa sänkning ur. */
  ladder?: number[];
  stepMinutes?: number;
  lastPatchedStep?: number;
}

export function butiksrad(d: AuctionDoc): ButiksRad {
  const rad: ButiksRad = {
    productId: d.productId,
    slug: d.slug,
    name: d.name,
    listPrice: d.listPrice,
    status: d.status,
    slot: d.slot,
  };
  if (d.startAt) rad.startAt = d.startAt;
  if (d.endedAt) rad.endedAt = d.endedAt;
  if (typeof d.soldPrice === "number") rad.soldPrice = d.soldPrice;
  if (d.status === "live") {
    rad.ladder = d.ladder;
    rad.stepMinutes = d.stepMinutes;
    if (typeof d.lastPatchedStep === "number") rad.lastPatchedStep = d.lastPatchedStep;
  }
  return rad;
}

/**
 * Butiken bär `REVIEW_INGEST_SECRET` (samma värde i båda Vercel-projekten sedan
 * 2026-09-02) — den enda hemlighet de två redan delar. En ny hade behövt
 * skapas och föras in för hand i två projekt, och ingen hemlighet ska passera
 * en chatt. `CRON_SECRET` tas också emot, för felsökning från Actions.
 *
 * ☠️ Osatt hemlighet stänger rutten (503), den öppnar den aldrig.
 */
export function butikAuktoriserad(
  authorization: string | null,
  env: { REVIEW_INGEST_SECRET?: string; CRON_SECRET?: string } = process.env,
): "ok" | "nej" | "osatt" {
  const giltiga = [env.REVIEW_INGEST_SECRET, env.CRON_SECRET].filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );
  if (giltiga.length === 0) return "osatt";
  const h = authorization ?? "";
  if (giltiga.some((s) => h === `Bearer ${s}`)) return "ok";
  return env.REVIEW_INGEST_SECRET ? "nej" : "osatt";
}
