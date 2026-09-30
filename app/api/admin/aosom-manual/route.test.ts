import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { ProductMappingRecord } from "@/lib/store";

// Syntetiska artikelnummer — riktiga får aldrig stå i en testfil, repot är publikt.

let store: MemoryStore;
let behorig = true;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));
vi.mock("@/lib/auth", () => ({ isAuthorized: () => behorig }));
vi.mock("@/lib/aosom/feed", () => ({ resolveAosomFeedUrl: async () => "https://feed.example/csv" }));

import { GET } from "./route";

const ID = "198ab3a2-0000-4000-8000-000000000001";
const FEED = "SKU,Name,pdf\nA-1,Trockner,https://cdn.example/manual-a1.pdf\n";

function mappning(over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    wixProductId: ID,
    supplierProductId: "aosom:A-1",
    supplier: "aosom",
    variants: [{ supplierVariantId: "A-1", wixVariantId: "v1", sku: "FP-tork", choices: {}, costUsd: 1, grossSek: 1 }],
    ...over,
  } as ProductMappingRecord;
}

function req(wix: string) {
  const url = new URL(`https://motor.example/api/admin/aosom-manual?wix=${wix}`);
  return { nextUrl: url, headers: new Headers() } as unknown as Parameters<typeof GET>[0];
}

beforeEach(async () => {
  store = new MemoryStore();
  behorig = true;
  await store.saveMapping(mappning());
  vi.stubGlobal("fetch", vi.fn(async () => new Response(FEED, { status: 200 })));
});

describe("GET /api/admin/aosom-manual", () => {
  it("utan behörighet: 401 och ingen feed läses", async () => {
    behorig = false;
    const res = await GET(req(ID));
    expect(res.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("ett id som inte är ett uuid avvisas", async () => {
    expect((await GET(req("198ab3a2"))).status).toBe(400);
  });

  it("en AliExpress-sida har ingen manual i Aosoms feed", async () => {
    await store.saveMapping(mappning({ supplier: "aliexpress", supplierProductId: "1005000000000001" }));
    expect((await GET(req(ID))).status).toBe(400);
  });

  it("svarar med manualen och räknar — artikelnumret står aldrig som eget fält", async () => {
    const res = await GET(req(ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      wix: ID,
      artiklar: 1,
      utanManual: 0,
      manualer: ["https://cdn.example/manual-a1.pdf"],
    });
  });
});
