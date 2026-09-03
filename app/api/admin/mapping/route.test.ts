// Poleringens skrivväg. Testerna låser de två fällor som hittades i drift
// 2026-09-02, båda i samma block.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { ProductMappingRecord } from "@/lib/store";

let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));
vi.mock("@/lib/auth", () => ({ isAuthorized: () => true }));
vi.mock("@/lib/store/pricing-config", () => ({
  getPricingRules: async () => ({ defaultMultiplier: 1.2, rounding: "charm9" }),
}));

let produktFinns: boolean | null = false;
vi.mock("@/lib/wix/v3-products", () => ({ v3ProduktFinns: async () => produktFinns }));

import { GET, POST } from "./route";

function rad(över: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    wixProductId: "p1",
    supplierProductId: "aosom:845-030CG",
    supplier: "aosom",
    needsAiPolish: true,
    draftStatus: "draft",
    variants: [
      {
        supplierVariantId: "sv1",
        sku: "gammal-sku",
        wixVariantId: "wv1",
        choices: {},
        costUsd: 100,
        landedCostSek: 2869.76,
        grossSek: 3449,
      },
    ],
    ...över,
  } as ProductMappingRecord;
}

function req(kropp: unknown) {
  return { json: async () => kropp, headers: new Headers() } as unknown as Parameters<typeof POST>[0];
}

beforeEach(async () => {
  store = new MemoryStore();
  produktFinns = false;
  await store.saveMapping(rad());
});

describe("☠️ okänt wixVariantId avvisas FÖRE skrivningen", () => {
  it("skriver ingenting alls — inte ens de fält som gick att applicera", async () => {
    const res = await POST(
      req({
        wixProductId: "p1",
        patch: { needsAiPolish: false, draftStatus: "published", variantSkus: { finns_inte: "FP-x" } },
      }),
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.okändaVariantIds).toEqual(["finns_inte"]);
    // Felet ska NAMNGE id:t och radens riktiga id — annars går det inte att rätta.
    expect(body.error).toContain("finns_inte");
    expect(body.error).toContain("wv1");

    // ☠️ Kärnan: produkten får INTE ha publicerats på vägen.
    const efter = (await store.getMappingByWixProductId("p1"))!;
    expect(efter.draftStatus).toBe("draft");
    expect(efter.needsAiPolish).toBe(true);
    expect(efter.variants[0].sku).toBe("gammal-sku");
  });

  it("ett känt och ett okänt id i samma patch skriver fortfarande ingenting", async () => {
    const res = await POST(
      req({ wixProductId: "p1", patch: { variantSkus: { wv1: "FP-ny", finns_inte: "FP-x" } } }),
    );
    expect(res.status).toBe(422);
    expect((await store.getMappingByWixProductId("p1"))!.variants[0].sku).toBe("gammal-sku");
  });
});

describe("en patch med bara kända id skrivs som vanligt", () => {
  it("sätter SKU utan att röra något annat", async () => {
    const res = await POST(req({ wixProductId: "p1", patch: { variantSkus: { wv1: "FP-ny" } } }));
    expect(res.status).toBe(200);
    const efter = (await store.getMappingByWixProductId("p1"))!;
    expect(efter.variants[0].sku).toBe("FP-ny");
    // Inget annat fält namngavs → inget annat ändras. Särskilt inte publicering.
    expect(efter.draftStatus).toBe("draft");
    expect(efter.needsAiPolish).toBe(true);
    expect(efter.variants[0].landedCostSek).toBe(2869.76);
  });

  it("stämplar färdigpolerat när anroparen ber om det", async () => {
    const res = await POST(
      req({ wixProductId: "p1", patch: { needsAiPolish: false, draftStatus: "published" } }),
    );
    expect(res.status).toBe(200);
    const efter = (await store.getMappingByWixProductId("p1"))!;
    expect(efter.needsAiPolish).toBe(false);
    expect(efter.draftStatus).toBe("published");
  });

  it("☠️ en saknad mappning SKAPAS aldrig", async () => {
    const res = await POST(req({ wixProductId: "finns-inte", patch: { needsAiPolish: false } }));
    expect(res.status).toBe(404);
    expect(await store.getMappingByWixProductId("finns-inte")).toBeNull();
  });
});

describe("☠️ en saknad mappning förklaras med RÄTT orsak", () => {
  // Meddelandet påstod förr alltid "kan vara föräldralös". Uppmätt 2026-09-02
  // på 3b64881e var det fel: id:t fanns inte i butiken alls, och mottagaren
  // skickades att leta efter en föräldralös produkt som aldrig existerat.
  // Två lägen, två åtgärder — samma klass som "läste inte tillbaka som
  // förväntat", ett felmeddelande som pekar åt fel håll.

  it("produkten FINNS i Wix → föräldralös, rör den inte", async () => {
    produktFinns = true;
    const res = await GET(
      { nextUrl: { searchParams: new URLSearchParams({ wixProductId: "saknas" }) }, headers: new Headers() } as never,
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("FINNS i butiken");
    expect(body.error).toContain("föräldralös");
  });

  it("produkten finns INTE → felaktig referens, inte en föräldralös produkt", async () => {
    produktFinns = false;
    const res = await GET(
      { nextUrl: { searchParams: new URLSearchParams({ wixProductId: "saknas" }) }, headers: new Headers() } as never,
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("felaktig referens");
    // Får INTE påstå att den är föräldralös — det är hela buggen.
    expect(body.error).not.toContain("är föräldralös");
  });

  it("☠️ butiken svarar inte → gissa inte, behåll den försiktiga varningen", async () => {
    produktFinns = null;
    const res = await GET(
      { nextUrl: { searchParams: new URLSearchParams({ wixProductId: "saknas" }) }, headers: new Headers() } as never,
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("svarade inte");
    expect(body.error).toContain("Polera den INTE");
  });
});
