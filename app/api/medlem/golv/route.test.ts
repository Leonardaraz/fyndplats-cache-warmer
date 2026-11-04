// Golvrutten: bara butikens hemlighet, ingen cache, kostnaden aldrig i loggen,
// och 503 när auktionerna inte kan läsas (hellre listpris än medlemspris på en
// auktionsvara).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";

let mappningar = new Map<string, ProductMappingRecord>();
let auktionerFel = false;
let levande: string[] = [];
vi.mock("@/lib/store/factory", () => ({
  getStore: () => ({ getMappingsByWixProductIds: async () => mappningar }),
}));
vi.mock("@/lib/auction/store", () => ({
  queryAuctions: async () => {
    if (auktionerFel) throw new Error("wix 500");
    return levande.map((productId) => ({ productId }));
  },
}));

import { POST } from "./route";

function req(kropp: unknown, auth: string | null = "Bearer hemlig") {
  return {
    json: async () => kropp,
    headers: new Headers(auth ? { authorization: auth } : {}),
  } as unknown as Parameters<typeof POST>[0];
}

const forut = process.env.REVIEW_INGEST_SECRET;
const loggar: string[] = [];

beforeEach(() => {
  process.env.REVIEW_INGEST_SECRET = "hemlig";
  mappningar = new Map([
    [
      "p1",
      {
        supplierProductId: "aosom:x",
        supplier: "aosom",
        wixProductId: "p1",
        variants: [{ supplierVariantId: "v", sku: "s", wixVariantId: "w1", choices: {}, costUsd: 0, landedCostSek: 123.45, grossSek: 0 }],
      } as ProductMappingRecord,
    ],
  ]);
  auktionerFel = false;
  levande = [];
  loggar.length = 0;
  vi.spyOn(console, "info").mockImplementation((...a) => void loggar.push(a.join(" ")));
  vi.spyOn(console, "error").mockImplementation((...a) => void loggar.push(a.join(" ")));
});

afterEach(() => {
  process.env.REVIEW_INGEST_SECRET = forut;
  vi.restoreAllMocks();
});

describe("POST /api/medlem/golv", () => {
  it("utan rätt hemlighet: 401, och 503 när hemligheten saknas i miljön", async () => {
    expect((await POST(req({ rader: [{ produktId: "p1" }] }, "Bearer fel"))).status).toBe(401);
    expect((await POST(req({ rader: [{ produktId: "p1" }] }, null))).status).toBe(401);
    delete process.env.REVIEW_INGEST_SECRET;
    expect((await POST(req({ rader: [{ produktId: "p1" }] }))).status).toBe(503);
  });

  it("svarar med golvet och kostnaden, utan cache, och loggar bara antal", async () => {
    const svar = await POST(req({ rader: [{ produktId: "p1", variantId: "w1" }, { produktId: "saknas" }] }));
    expect(svar.status).toBe(200);
    expect(svar.headers.get("cache-control")).toBe("no-store");
    const kropp = await svar.json();
    expect(kropp.rader[0]).toMatchObject({ produktId: "p1", kostnadOre: 12_345, golvOre: 17_000 });
    expect(kropp.rader[1]).toMatchObject({ produktId: "saknas", golvOre: null, utan: "saknar-mappning" });
    expect(loggar.join("\n")).toContain("2 rader, 1 med golv");
    expect(loggar.join("\n")).not.toMatch(/12345|123[.,]45|170\b|17000/);
  });

  it("fel form: 400 innan något läses", async () => {
    expect((await POST(req({ rader: "p1" }))).status).toBe(400);
    expect((await POST(req(null))).status).toBe(400);
  });

  it("☠️ auktionerna går inte att läsa: 503, inget golv alls", async () => {
    auktionerFel = true;
    // Förbi auktionscachen från de tidigare proven.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 60_000);
    const svar = await POST(req({ rader: [{ produktId: "p1" }] }));
    vi.useRealTimers();
    expect(svar.status).toBe(503);
  });
});
