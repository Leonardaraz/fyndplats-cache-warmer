// lib/orders/price-check.ts
//
// Prisvakten för orderläggningen — REN logik (inga sidoeffekter, enhetstestbar).
//
// Bakgrund (garderobs-incidenten 2026-08-06): orderkön lade en DS-API-order på
// $84.40 medan konsumentkassan, med sommarkampanj + butikskupong, landade på
// 683 kr (~$71). DS-API:t kan ALDRIG få kampanjpriser/kuponger (det finns inga
// fält för det i aliexpress.ds.order.create — verifierat i buildPlaceOrderDto),
// så skyddet består av två delar:
//
//   1. Denna vakt: jämför DS-priset VID ORDERLÄGGNING med DS-priset VID IMPORT
//      (costUsd i mappningen, hålls färskt av dagliga synken). Fångar plötsliga
//      prishöjningar i DS-kanalen.
//   2. Prisjämförelsen i admin (checkDsPriceAction): visar dagens DS-pris +
//      länk till produktsidan så Leonard ser konsumentpriset (kampanjer/kuponger
//      är session-bundna och kan inte läsas av servern).
//
// Vakten är RÅDGIVANDE med bekräfta-väg — den stoppar första klicket men
// Leonard kan alltid lägga ordern ändå ("Lägg ändå"). Fail-open: kan priset
// inte hämtas/saknas baslinje läggs ordern som vanligt (en API-hicka får
// aldrig blockera en kundleverans).

/** Procent över importpriset som utlöser stopp. */
export const PRICE_GUARD_PCT = 10;
/** …och minst så här många dollar dyrare (små diffar bråkar vi inte om). */
export const PRICE_GUARD_MIN_USD = 2;

export interface PriceAssessment {
  verdict: "ok" | "expensive" | "unknown";
  dsPriceUsd?: number;
  importCostUsd?: number;
  /** Heltalsprocent över importpriset (12 = 12 % dyrare). Bara vid känd baslinje. */
  diffPct?: number;
}

/**
 * Bedömer dagens DS-pris mot importbaslinjen. `unknown` när endera saknas
 * eller är ogiltig (≤0/NaN) — anroparen ska då INTE stoppa något.
 */
export function assessDsPrice(
  importCostUsd: number | undefined,
  dsPriceUsd: number | undefined,
): PriceAssessment {
  const base = Number(importCostUsd);
  const now = Number(dsPriceUsd);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(now) || now <= 0) {
    return { verdict: "unknown" };
  }
  const diffPct = Math.round(((now - base) / base) * 100);
  const expensive = now > base * (1 + PRICE_GUARD_PCT / 100) && now - base > PRICE_GUARD_MIN_USD;
  return {
    verdict: expensive ? "expensive" : "ok",
    dsPriceUsd: now,
    importCostUsd: base,
    diffPct,
  };
}

/**
 * Normaliserar ett inklistrat AliExpress-ordernummer (från orderlistans
 * "Ref. Number", t.ex. "3075422919233058", ev. med mellanslag från kopiering).
 * Returnerar null om det inte ser ut som ett ordernummer — hellre vägra än att
 * koppla fel id och låta spårningspollningen jaga en order som inte finns.
 */
export function normalizeAeOrderId(input: string): string | null {
  const s = String(input || "").replace(/[\s ]/g, "");
  return /^\d{8,24}$/.test(s) ? s : null;
}
