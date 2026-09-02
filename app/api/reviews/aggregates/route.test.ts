// Betygsaggregatet som butikens listningssidor läser.
//
// ☠️ VARFÖR RUTTEN FINNS. Butiken frågade Wix Data DIREKT efter betygen till
// varje produktkort. När recensionerna flyttar hade den läsaren inte gått
// sönder — den hade blivit TOM, och korten tappat sina stjärnor utan ett enda
// fel i någon logg. Samma sak som hände spårningssidan 2026-09-01.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProduktBetyg } from "@/lib/store/reviews";

let svar: ProduktBetyg[] = [];
let kastar: Error | null = null;

vi.mock("@/lib/store/reviews", () => ({
  getReviewStore: () => ({
    aggregateByProduct: async () => {
      if (kastar) throw kastar;
      return svar;
    },
  }),
}));

import { GET } from "./route";

beforeEach(() => {
  svar = [];
  kastar = null;
});
afterEach(() => vi.restoreAllMocks());

describe("aggregatet", () => {
  it("ger en KARTA per produkt-id, inte en lista", async () => {
    // Butiken slår upp per kort. En karta gör det till en uppslagning i
    // stället för en genomsökning per kort.
    svar = [
      { productId: "p1", antal: 3, snitt: 4.7 },
      { productId: "p2", antal: 1, snitt: 5 },
    ];
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.betyg).toEqual({ p1: { antal: 3, snitt: 4.7 }, p2: { antal: 1, snitt: 5 } });
    expect(body.produkter).toBe(2);
  });

  it("☠️ svaret bär BARA id, antal och snitt", async () => {
    // Ingen text, inga namn, inga bilder — alltså ingenting som kan röja en
    // person eller en leverantör. Rutten är oautentiserad med flit.
    svar = [{ productId: "p1", antal: 2, snitt: 4.5 }];
    const body = await (await GET()).json();
    const serialiserat = JSON.stringify(body);
    for (const förbjudet of ["text", "initials", "customerName", "imageUrl", "aliexpress", "aosom"]) {
      expect(serialiserat.toLowerCase()).not.toContain(förbjudet.toLowerCase());
    }
    expect(Object.keys(body.betyg.p1).sort()).toEqual(["antal", "snitt"]);
  });

  it("en tom katalog är ett giltigt svar, inte ett fel", async () => {
    svar = [];
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, produkter: 0, betyg: {} });
  });

  it("☠️ ett LÄSFEL blir 502, inte 200 med tom karta", async () => {
    // Ett tomt aggregat är ett giltigt tillstånd. Svarade rutten 200 med tom
    // karta även vid fel gick de två inte att skilja åt — och då är ett trasigt
    // betygslager exakt lika tyst som en katalog utan omdömen.
    kastar = new Error("Neon svarade inte");
    const res = await GET();
    expect(res.status).toBe(502);
    expect((await res.json()).ok).toBe(false);
  });

  it("cachas en timme, som butiken förväntar sig", async () => {
    svar = [{ productId: "p1", antal: 1, snitt: 5 }];
    const res = await GET();
    expect(res.headers.get("cache-control")).toContain("s-maxage=3600");
  });
});
