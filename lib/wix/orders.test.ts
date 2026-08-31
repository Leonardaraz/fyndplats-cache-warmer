import { describe, expect, it } from "vitest";
import { aggregateOrders, fetchOrders, isoDaysAgo } from "./orders";

describe("aggregateOrders", () => {
  it("summerar enheter per productId och sku", () => {
    const result = aggregateOrders([
      {
        _createdDate: "2026-05-30T08:00:00Z",
        priceSummary: { total: { amount: "299" } },
        lineItems: [
          {
            quantity: 2,
            catalogReference: { catalogItemId: "wix-A" },
            physicalProperties: { sku: "AE-1-A" },
            totalPriceAfterTax: { amount: "199" },
          },
          {
            quantity: 1,
            catalogReference: { catalogItemId: "wix-B" },
            physicalProperties: { sku: "AE-2-B" },
            totalPriceAfterTax: { amount: "100" },
          },
        ],
      },
      {
        _createdDate: "2026-05-29T12:00:00Z",
        priceSummary: { total: { amount: "199" } },
        lineItems: [
          {
            quantity: 3,
            catalogReference: { catalogItemId: "wix-A" },
            physicalProperties: { sku: "AE-1-A" },
            totalPriceAfterTax: { amount: "199" },
          },
        ],
      },
    ]);

    expect(result.byProductId["wix-A"].units).toBe(5);
    expect(result.byProductId["wix-A"].grossSek).toBeCloseTo(398, 1);
    expect(result.byProductId["wix-B"].units).toBe(1);
    expect(result.bySku["AE-1-A"].units).toBe(5);
    expect(result.totalGrossSek).toBeCloseTo(498, 1);
    expect(result.orderCount).toBe(2);
    expect(result.dailyGrossSek["2026-05-30"]).toBeCloseTo(299, 1);
    expect(result.dailyGrossSek["2026-05-29"]).toBeCloseTo(199, 1);
  });

  it("hanterar tomma rader utan att kasta", () => {
    const result = aggregateOrders([{}]);
    expect(result.orderCount).toBe(1);
    expect(Object.keys(result.byProductId)).toHaveLength(0);
  });

  it("fallback till price × quantity när totalPriceAfterTax saknas", () => {
    const result = aggregateOrders([
      {
        _createdDate: "2026-05-30T00:00:00Z",
        priceSummary: { total: { amount: "200" } },
        lineItems: [
          {
            quantity: 2,
            catalogReference: { catalogItemId: "wix-X" },
            price: { amount: "100" },
          },
        ],
      },
    ]);
    expect(result.byProductId["wix-X"].grossSek).toBeCloseTo(200, 1);
  });
});

describe("isoDaysAgo", () => {
  it("returnerar ISO-string", () => {
    const s = isoDaysAgo(90);
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
  });
});

describe("fetchOrders — strict", () => {
  const svar = (status: number) =>
    ({ ok: false, status, text: async () => "nope" }) as unknown as Response;

  /**
   * Byter ut global fetch under ett anrop och återställer alltid.
   *
   * Sätter också WIX_API_TOKEN: `headers()` kastar utan den, och då hade
   * testet "passerat" på fel fel — det är hela poängen med att verifiera
   * VILKET fel som kastas, inte bara att något gör det.
   */
  async function medFetch<T>(impl: typeof fetch, fn: () => Promise<T>): Promise<T> {
    const originalFetch = globalThis.fetch;
    const originalToken = process.env.WIX_API_TOKEN;
    globalThis.fetch = impl;
    process.env.WIX_API_TOKEN = "test-token";
    try {
      return await fn();
    } finally {
      globalThis.fetch = originalFetch;
      if (originalToken === undefined) delete process.env.WIX_API_TOKEN;
      else process.env.WIX_API_TOKEN = originalToken;
    }
  }

  for (const status of [403, 404]) {
    it(`sväljer ${status} utan strict — panelen ska ändå ladda`, async () => {
      const res = await medFetch(
        (async () => svar(status)) as unknown as typeof fetch,
        () => fetchOrders("2026-08-01T00:00:00.000Z"),
      );
      expect(res).toEqual([]);
    });

    it(`☠️ KASTAR på ${status} med strict — tomt får inte läsas som "inga saknade ordrar"`, async () => {
      // Orderåterhämtningen jämför Wix-ordrar mot tasks. Får den noll ordrar
      // vid saknad scope drar den slutsatsen att inget saknas och gör
      // ingenting — ett tyst no-op som ser ut som en frisk körning.
      await expect(
        medFetch(
          (async () => svar(status)) as unknown as typeof fetch,
          () => fetchOrders("2026-08-01T00:00:00.000Z", { strict: true }),
        ),
      ).rejects.toThrow(String(status));
    });
  }
});
