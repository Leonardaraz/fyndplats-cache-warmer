// ☠️ RECENSIONERNA HAR EN EGEN BACKEND-SWITCH, OCH DET ÄR INTE KOSMETIK.
//
// Produktionen står på `STORE_BACKEND=postgres` sedan drift-datan flyttade
// 2026-08-31. Ett första utkast av recensionsmigreringen lät
// `getReviewStore()` läsa den variabeln — vilket hade bytt lager i samma
// sekund koden deployades, in i en TOM tabell:
//
//   - /admin/reviews hade slutat se de 2 514 befintliga raderna
//   - nya recensioner hade skrivits dit ingen läser
//   - butiken hade fortsatt läsa Wix och alltså visat oförändrat innehåll
//   - INGENTING hade kastat
//
// Samma familj som `/api/tracking-events` 2026-09-01: en läsare som blir TOM
// syns varken i en kodaudit eller i en felräknare, för ett tomt svar från rätt
// API mot rätt tabell ser i källkoden ut precis som ett friskt anrop.
//
// Testet låser att default:en pekar åt det håll som INTE tappar data.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { reviewsBackend, storeBackend } from "./backend";

const SPARAT = { ...process.env };

beforeEach(() => {
  delete process.env.REVIEWS_BACKEND;
  delete process.env.STORE_BACKEND;
});
afterEach(() => {
  process.env = { ...SPARAT };
});

describe("☠️ reviewsBackend är FRIKOPPLAD från storeBackend", () => {
  it("osatt → wix-data, även när drift-datan står på postgres", () => {
    process.env.STORE_BACKEND = "postgres";
    expect(storeBackend()).toBe("postgres");
    // Kärnan: recensionerna ligger ETT STEG EFTER i sin egen migrering.
    expect(reviewsBackend()).toBe("wix-data");
  });

  it("blankt värde räknas som osatt — ett tomt fält i Vercels UI är inte ett val", () => {
    process.env.REVIEWS_BACKEND = "   ";
    expect(reviewsBackend()).toBe("wix-data");
  });

  it("växlingen är en MEDVETEN handling", () => {
    process.env.REVIEWS_BACKEND = "postgres";
    expect(reviewsBackend()).toBe("postgres");
  });

  it("☠️ en felstavning KASTAR, den gissar inte", () => {
    // Samma hållning som storeBackend: en tyst fallback gör en felstavad
    // variabel omöjlig att skilja från ett medvetet val, och priset betalas i
    // produktion. "postgress" är inte tomt och ska alltså fällas.
    process.env.REVIEWS_BACKEND = "postgress";
    expect(() => reviewsBackend()).toThrow(/REVIEWS_BACKEND/);
  });

  it("storeBackend påverkas inte av REVIEWS_BACKEND", () => {
    process.env.REVIEWS_BACKEND = "postgres";
    process.env.STORE_BACKEND = "wix-data";
    expect(storeBackend()).toBe("wix-data");
  });
});
