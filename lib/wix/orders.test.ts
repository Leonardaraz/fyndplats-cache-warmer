import { describe, expect, it } from "vitest";
import { aggregateOrders, fetchOrderKundnamn, fetchOrders, isoDaysAgo } from "./orders";

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

  it("statusar ersätter standardfiltret med ett uttryckligt $in", async () => {
    const kroppar: unknown[] = [];
    const impl = (async (_url: string, init?: RequestInit) => {
      kroppar.push(JSON.parse(String(init?.body)));
      return { ok: true, json: async () => ({ orders: [{ id: "o1" }], metadata: {} }) } as unknown as Response;
    }) as unknown as typeof fetch;
    const res = await medFetch(impl, () => fetchOrders("2020-01-01T00:00:00.000Z", { statusar: ["PENDING", "REJECTED"] }));
    expect(res).toHaveLength(1);
    expect(kroppar[0]).toMatchObject({
      search: { filter: { _createdDate: { $gte: "2020-01-01T00:00:00.000Z" }, status: { $in: ["PENDING", "REJECTED"] } } },
    });
  });

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

describe("fetchOrderKundnamn", () => {
  const GUID = "11111111-2222-4333-8444-555555555555";
  const kontakt = { billingInfo: { contactDetails: { firstName: "Anna", lastName: "Andersson" } } };

  /** Fångar varje anrop och svarar med `svar` på alla. */
  function inspelning(svar: unknown, status = 200) {
    const anrop: Array<{ url: string; method?: string; body?: unknown }> = [];
    const impl = (async (url: string, init?: RequestInit) => {
      anrop.push({ url, method: init?.method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return { ok: status < 400, status, json: async () => svar, text: async () => "" } as unknown as Response;
    }) as unknown as typeof fetch;
    return { anrop, impl };
  }

  it("ett GUID slås upp direkt på orderns id", async () => {
    const { anrop, impl } = inspelning({ order: kontakt });
    const namn = await medFetch(impl, () => fetchOrderKundnamn(GUID));
    expect(namn).toBe("Anna Andersson");
    expect(anrop).toHaveLength(1);
    expect(anrop[0].method).toBe("GET");
    expect(anrop[0].url).toMatch(new RegExp(`/ecom/v1/orders/${GUID}$`));
  });

  it("☠️ ett läsbart ordernummer söks fram — GET svarar 404 på ett nummer", async () => {
    // Butikens omdömeslänk bär tracking_mapping.order_id, som är numret.
    // Uppmätt 2026-10-19: alla tre omdömen utan initialer bar ett nummer.
    const { anrop, impl } = inspelning({ orders: [{ number: "10083", ...kontakt }] });
    const namn = await medFetch(impl, () => fetchOrderKundnamn(" 10083 "));
    expect(namn).toBe("Anna Andersson");
    expect(anrop).toHaveLength(1);
    expect(anrop[0].method).toBe("POST");
    expect(anrop[0].url).toMatch(/\/ecom\/v1\/orders\/search$/);
    expect(anrop[0].body).toMatchObject({ search: { filter: { number: "10083" } } });
  });

  it("numret får komma tillbaka som tal", async () => {
    const { impl } = inspelning({ orders: [{ number: 10083, ...kontakt }] });
    expect(await medFetch(impl, () => fetchOrderKundnamn("10083"))).toBe("Anna Andersson");
  });

  it("ett nummer utan träff är en saknad order", async () => {
    const { impl } = inspelning({ orders: [] });
    expect(await medFetch(impl, () => fetchOrderKundnamn("10083"))).toBeNull();
  });

  it("☠️ en träff med ett annat nummer kastar — då bet inte filtret", async () => {
    // Annars hade butikens senaste order gett en annan kunds initialer.
    const { impl } = inspelning({
      orders: [{ number: "10099", billingInfo: { contactDetails: { firstName: "Bo", lastName: "Berg" } } }],
    });
    await expect(medFetch(impl, () => fetchOrderKundnamn("10083"))).rejects.toThrow("bet inte");
  });

  it("varken GUID eller nummer: inget anrop, ingen order", async () => {
    const { anrop, impl } = inspelning({ orders: [] });
    expect(await medFetch(impl, () => fetchOrderKundnamn("kund-10083"))).toBeNull();
    expect(anrop).toHaveLength(0);
  });

  it("ett fel från sökningen kastar i stället för att läsas som saknad order", async () => {
    const { impl } = inspelning({}, 500);
    await expect(medFetch(impl, () => fetchOrderKundnamn("10083"))).rejects.toThrow("500");
  });
});
