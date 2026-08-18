import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { ProductMappingRecord } from "@/lib/store";

let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));
vi.mock("@/lib/aliexpress/reviews", () => ({ fetchAeReviews: vi.fn() }));
vi.mock("@/lib/reviews/queue", () => ({ queueReviewsForProduct: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn() }));

import { fetchAeReviews } from "@/lib/aliexpress/reviews";
import { queueReviewsForProduct } from "@/lib/reviews/queue";
import { GET } from "./route";

function mapping(patch: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    wixProductId: "w1",
    supplierProductId: "1005001",
    sourceUrl: "https://www.aliexpress.com/item/1005001.html",
    createdAt: "2026-01-01T00:00:00.000Z",
    draftStatus: "published",
    variants: [],
    ...patch,
  } as ProductMappingRecord;
}

function req(qs = "") {
  return new Request(`http://localhost/api/cron/review-queue${qs}`) as unknown as Parameters<typeof GET>[0];
}

beforeEach(() => {
  store = new MemoryStore();
  delete process.env.CRON_SECRET;
  vi.mocked(fetchAeReviews).mockReset().mockResolvedValue({
    reviews: [],
    throttled: false,
    totalNum: 0,
    requests: 1,
  });
  vi.mocked(queueReviewsForProduct).mockReset().mockResolvedValue({
    queued: 0,
    skippedExisting: 0,
    filtered: 0,
  });
});

// Bakgrund: dedupKey-buggen (#450) sorterade bort fullt vettiga recensioner som
// spam. Rättningen hjälper ingen förrän produkterna kontrolleras om — och
// `reviewsCheckedAt` gömmer dem i REVIEW_RECHECK_DAYS dygn. `checkedBefore`
// flyttar omkontroll-gränsen framåt så ett svep kan ta om katalogen direkt.
describe("review-queue: checkedBefore", () => {
  it("nyligen kontrollerad produkt hoppas över utan checkedBefore, tas med med", async () => {
    const igår = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    await store.saveMapping(mapping({ reviewsCheckedAt: igår }));

    const utan = (await (await GET(req())).json()) as { kandidater: number };
    expect(utan.kandidater).toBe(0);

    const nu = new Date().toISOString();
    const med = (await (await GET(req(`?checkedBefore=${encodeURIComponent(nu)}`))).json()) as {
      kandidater: number;
    };
    expect(med.kandidater).toBe(1);
  });

  it("checkedBefore längre bak än standardintervallet snävar INTE in svepet", async () => {
    // En produkt som inte kollats på ett år ska med i vilket fall. Ett
    // skrivfel i checkedBefore får aldrig tyst göra körningen mindre än den
    // normala — därför tar rutten det SENASTE av de två gränserna.
    const förEttÅrSedan = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
    await store.saveMapping(mapping({ reviewsCheckedAt: förEttÅrSedan }));

    const gammal = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString();
    const body = (await (await GET(req(`?checkedBefore=${encodeURIComponent(gammal)}`))).json()) as {
      kandidater: number;
    };
    expect(body.kandidater).toBe(1);
  });

  it("skräp i checkedBefore ignoreras och standardintervallet gäller", async () => {
    const igår = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    await store.saveMapping(mapping({ reviewsCheckedAt: igår }));

    const body = (await (await GET(req("?checkedBefore=inte-ett-datum"))).json()) as {
      kandidater: number;
    };
    expect(body.kandidater).toBe(0);
  });

  it("stämplar om produkten så rundorna konvergerar mot noll kandidater", async () => {
    const igår = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    await store.saveMapping(mapping({ reviewsCheckedAt: igår }));
    const start = new Date().toISOString();

    const runda1 = (await (await GET(req(`?checkedBefore=${encodeURIComponent(start)}`))).json()) as {
      kandidater: number;
      kontrollerade: number;
    };
    expect(runda1.kandidater).toBe(1);
    expect(runda1.kontrollerade).toBe(1);

    // Samma gräns i runda 2 → produkten är redan stämplad efter svepets start.
    const runda2 = (await (await GET(req(`?checkedBefore=${encodeURIComponent(start)}`))).json()) as {
      kandidater: number;
    };
    expect(runda2.kandidater).toBe(0);
  });
});
