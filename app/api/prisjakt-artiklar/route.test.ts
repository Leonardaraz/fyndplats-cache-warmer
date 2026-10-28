// Butikens läsväg till artikelnumren för Prisjakt-flödet.
//
// Alla nummer här är påhittade (TEST-…).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { ProductMappingRecord } from "@/lib/store";

let mappningar: ProductMappingRecord[] = [];
let lagretKastar = false;
let flodet: Array<{ sku: string; url: string }> | Error = [];

vi.mock("@/lib/store/factory", () => ({
  getStore: () => ({
    listMappings: async () => {
      if (lagretKastar) throw new Error("neon nere");
      return mappningar;
    },
  }),
}));

vi.mock("@/lib/aosom/feed", () => ({
  fetchAosomFeed: async () => {
    if (flodet instanceof Error) throw flodet;
    return flodet;
  },
}));

vi.mock("@/lib/gpsr/data", () => ({ gpsrForSku: () => null }));

import { GET } from "./route";

const HEMLIGT = "butikens-hemlighet";
const anrop = (auth?: string) =>
  GET(new NextRequest("https://motor.test/api/prisjakt-artiklar", auth ? { headers: { authorization: auth } } : undefined));

const rad = (artikel: string, variantId: string, slug = "homcom-stuhl") =>
  ({
    wixProductId: `p-${variantId}`,
    supplier: "aosom",
    supplierProductId: `aosom:${artikel}`,
    sourceUrl: `https://www.aosom.de/item/${slug}~${artikel}.html`,
    variants: [{ supplierVariantId: artikel, wixVariantId: variantId, sku: "FP-test", choices: {} }],
  }) as unknown as ProductMappingRecord;

let loggat: string[] = [];

beforeEach(() => {
  mappningar = [rad("TEST-0001", "v1")];
  lagretKastar = false;
  flodet = [{ sku: "TEST-0001", url: "https://www.aosom.de/item/outsunny-x~TEST-0001.html" }];
  vi.stubEnv("REVIEW_INGEST_SECRET", HEMLIGT);
  vi.stubEnv("CRON_SECRET", "cron-hemlighet");
  loggat = [];
  for (const niva of ["info", "warn", "error", "log"] as const) {
    vi.spyOn(console, niva).mockImplementation((...a: unknown[]) => {
      loggat.push(a.map(String).join(" "));
    });
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/prisjakt-artiklar", () => {
  it("503 när hemligheten saknas — rutten är avstängd, inte öppen", async () => {
    vi.stubEnv("REVIEW_INGEST_SECRET", "");
    const res = await anrop(`Bearer ${HEMLIGT}`);
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain("TEST-");
  });

  it("401 utan nyckel, med fel nyckel och med CRON_SECRET", async () => {
    for (const auth of [undefined, "Bearer fel", "Bearer cron-hemlighet"]) {
      const res = await anrop(auth);
      expect(res.status).toBe(401);
      expect(JSON.stringify(await res.json())).not.toContain("TEST-");
    }
  });

  it("ger numret och märket per variant, och inget mellanled får spara svaret", async () => {
    const res = await anrop(`Bearer ${HEMLIGT}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.varianter).toEqual({ v1: { mpn: "TEST-0001", marke: "Outsunny" } });
    expect(body.rakning).toMatchObject({ aosomRader: 1, medMarke: 1, flodetFel: false });
  });

  it("loggen bär bara antal, aldrig ett nummer", async () => {
    await anrop(`Bearer ${HEMLIGT}`);
    expect(loggat.length).toBeGreaterThan(0);
    for (const rad of loggat) expect(rad).not.toContain("TEST-");
  });

  it("ett Aosom-flöde som faller ger märket ur mappningen, och felet syns bara som en flagga", async () => {
    flodet = new Error("fetch failed: https://hemlig.example/flode.csv");
    const res = await anrop(`Bearer ${HEMLIGT}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.varianter).toEqual({ v1: { mpn: "TEST-0001", marke: "HOMCOM" } });
    expect(body.rakning.flodetFel).toBe(true);
    for (const rad of loggat) {
      expect(rad).not.toContain("hemlig.example");
      expect(rad).not.toContain("TEST-");
    }
    expect(JSON.stringify(body)).not.toContain("hemlig.example");
  });

  it("502 när mappningarna inte går att läsa, i stället för ett tomt svar", async () => {
    lagretKastar = true;
    const res = await anrop(`Bearer ${HEMLIGT}`);
    expect(res.status).toBe(502);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
