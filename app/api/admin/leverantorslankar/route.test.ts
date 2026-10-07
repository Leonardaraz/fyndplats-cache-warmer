// POST /api/admin/leverantorslankar — rutten runt lib/import/leverantorslankar.ts.
//
// Logiken är testad för sig. Här låses det rutten själv avgör: nyckeln,
// listans gränser, att slugs slås upp och okända listas, och att Aosoms flöde
// bara hämtas när en rad behöver det, utan att dess fel följer med i svaret.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import type { ProductMappingRecord } from "@/lib/store";

const lage = vi.hoisted(() => ({
  inloggad: true,
  mappningar: [] as ProductMappingRecord[],
  slugs: new Map<string, { id: string; visible: boolean }>(),
  flodet: vi.fn(),
  slugfragor: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ isAuthorized: () => lage.inloggad }));
vi.mock("@/lib/store/factory", () => ({
  getStore: () => ({ listMappings: async () => lage.mappningar }),
}));
vi.mock("@/lib/wix/v3-products", () => ({
  getV3ProductIdsBySlugs: async (slugs: string[]) => {
    lage.slugfragor(slugs);
    return lage.slugs;
  },
}));
vi.mock("@/lib/aosom/feed", () => ({ fetchAosomFeed: () => lage.flodet() }));

import { POST } from "./route";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

function rad(over: Partial<ProductMappingRecord> & { wixProductId: string }): ProductMappingRecord {
  return {
    supplierProductId: "aosom:art-huvud",
    supplier: "aosom",
    sourceUrl: "https://www.aosom.de/item/stuhl~art-huvud.html",
    variants: [
      { supplierVariantId: "art-huvud", sku: "FP-stol", wixVariantId: "wv-1", choices: {}, costUsd: 1, landedCostSek: 1, grossSek: 1 },
    ],
    ...over,
  } as ProductMappingRecord;
}

function post(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new Request("https://motor.example/api/admin/leverantorslankar", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  }) as unknown as NextRequest;
}

const origSecret = process.env.CRON_SECRET;

beforeEach(() => {
  lage.inloggad = true;
  lage.mappningar = [rad({ wixProductId: ID_A })];
  lage.slugs = new Map([["kontorsstol-svart", { id: ID_A, visible: true }]]);
  lage.flodet.mockReset();
  lage.slugfragor.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  if (origSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = origSecret;
});

describe("POST /api/admin/leverantorslankar", () => {
  it("utan nyckel: 401, och ingenting läses", async () => {
    lage.inloggad = false;
    delete process.env.CRON_SECRET;
    const res = await POST(post({ produkter: [ID_A] }));
    expect(res.status).toBe(401);
    expect(lage.slugfragor).not.toHaveBeenCalled();
  });

  it("CRON_SECRET som Bearer släpps in — det är så workflowen anropar", async () => {
    lage.inloggad = false;
    process.env.CRON_SECRET = "hemlig";
    const res = await POST(post({ produkter: [ID_A] }, { authorization: "Bearer hemlig" }));
    expect(res.status).toBe(200);
  });

  it("en tom lista, en lista utan produkter och en för lång lista är 400", async () => {
    expect((await POST(post({ produkter: [] }))).status).toBe(400);
    expect((await POST(post({ produkter: "10056 FP-stol" }))).status).toBe(400);
    expect((await POST(post({ produkter: [1, 2] }))).status).toBe(400);
    expect((await POST(post("inte json"))).status).toBe(400);
    const lang = Array.from({ length: 1001 }, (_, i) => `sida-${i}`);
    expect((await POST(post({ produkter: lang }))).status).toBe(400);
  });

  it("slugs slås upp, okända och ogiltiga listas, och flödet hämtas inte när ingen rad behöver det", async () => {
    const res = await POST(post({ produkter: ["kontorsstol-svart", "finns-inte", "10056", ID_B] }));
    expect(res.status).toBe(200);
    const svar = await res.json();
    expect(lage.slugfragor).toHaveBeenCalledWith(["kontorsstol-svart", "finns-inte"]);
    expect(svar).toMatchObject({
      ok: true,
      antal: 3,
      hittade: 1,
      aosom: 1,
      aliexpress: 0,
      sammanslagna: 0,
      utanLank: 0,
      flodetHamtat: false,
      flodetFel: false,
      utanMappning: [ID_B],
      utanProdukt: ["finns-inte"],
      ogiltiga: ["10056"],
    });
    expect(svar.lankar).toEqual([
      {
        wixProductId: ID_A,
        fran: "kontorsstol-svart",
        leverantor: "aosom",
        artikelnummer: "art-huvud",
        url: "https://www.aosom.de/item/stuhl~art-huvud.html",
      },
    ]);
    expect(lage.flodet).not.toHaveBeenCalled();
  });

  it("en sammanslagen sida hämtar flödet och får en länk per färg", async () => {
    lage.mappningar = [
      rad({
        wixProductId: ID_A,
        variants: [
          { supplierVariantId: "art-huvud", sku: "FP-a", wixVariantId: "wv-1", choices: { Färg: "Svart" }, costUsd: 1, landedCostSek: 1, grossSek: 1 },
          { supplierVariantId: "art-gra", sku: "FP-b", wixVariantId: "wv-2", choices: { Färg: "Grå" }, costUsd: 1, landedCostSek: 1, grossSek: 1 },
        ],
      }),
    ];
    lage.flodet.mockResolvedValue([
      { sku: "art-gra", url: "https://www.aosom.de/item/stuhl~art-gra.html" },
    ]);
    const svar = await (await POST(post({ produkter: [ID_A] }))).json();
    expect(lage.flodet).toHaveBeenCalledTimes(1);
    expect(svar.flodetHamtat).toBe(true);
    expect(svar.sammanslagna).toBe(1);
    expect(svar.lankar[0].varianter).toEqual([
      { artikelnummer: "art-huvud", url: "https://www.aosom.de/item/stuhl~art-huvud.html", val: { Färg: "Svart" } },
      { artikelnummer: "art-gra", url: "https://www.aosom.de/item/stuhl~art-gra.html", val: { Färg: "Grå" } },
    ]);
  });

  it("☠️ ett fel i flödet är en flagga — felmeddelandet följer aldrig med, adressen är hemlig", async () => {
    lage.mappningar = [rad({ wixProductId: ID_A, sourceUrl: undefined })];
    lage.flodet.mockRejectedValue(new Error("https://hemlig.example/feed.csv svarade 500"));
    const res = await POST(post({ produkter: [ID_A] }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain("hemlig.example");
    const svar = JSON.parse(text);
    expect(svar).toMatchObject({ flodetHamtat: false, flodetFel: true, utanLank: 1 });
    expect(svar.lankar[0].url).toBeNull();
  });
});
