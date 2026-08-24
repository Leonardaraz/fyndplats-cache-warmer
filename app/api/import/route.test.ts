import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";

// Delad store mellan route och test. getStore() mockas att returnera den.
let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn() }));

// importProduct är det enda som får köras EFTER spärren. Vi mockar den så att
// testet kan skilja "blockerad" från "släppt igenom" utan att röra Wix.
//
// OBS: mocken returnerar undefined, så routen felar längre ner i genomsläpps-
// fallen (500). Det är avsiktligt och irrelevant här — det testet mäter är om
// spärren stoppade anropet, alltså `importProduct`-anropet och 409:an. Statusen
// assertas därför bara som "inte 409".
//
// vi.hoisted krävs: vi.mock-fabriken hissas ovanför vanliga toppnivåvariabler.
const { importProduct } = vi.hoisted(() => ({ importProduct: vi.fn() }));
vi.mock("@/lib/import/pipeline", () => ({ importProduct }));
vi.mock("@/lib/store/pricing-config", () => ({ getPricingRules: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/aliexpress/client", () => ({
  getInventory: vi.fn().mockResolvedValue({ variants: [], listingAvailability: "unknown" }),
}));

import { POST } from "./route";

const TOKEN = "test-token";

function body(patch: Record<string, unknown> = {}) {
  return {
    supplierProductId: "1005012621231106",
    sourceUrl: "https://www.aliexpress.com/item/1005012621231106.html",
    rawTitle: "Homcom Folding Massage Table with Headrest",
    rawDescription: "Aluminium frame, nine height settings, carry bag included.",
    imageUrls: ["https://ae01.alicdn.com/kf/abc.jpg"],
    variants: [
      { supplierVariantId: "sv-1", options: { Färg: "Rosa" }, costUsd: 90, included: true },
    ],
    ...patch,
  };
}

function req(b: unknown) {
  return new Request("http://localhost/api/import", {
    method: "POST",
    headers: { "x-fyndplats-token": TOKEN, "content-type": "application/json" },
    body: JSON.stringify(b),
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  store = new MemoryStore();
  importProduct.mockReset();
  process.env.EXTENSION_API_TOKEN = TOKEN;
});

describe("/api/import — dubblett-spärr på supplierProductId", () => {
  it("blockerar en listning som redan finns, med 409 och den befintliga produktens id", async () => {
    await store.saveMapping({
      supplierProductId: "1005012621231106",
      wixProductId: "08fa637b-a1e5-4328-93d7-ea700af48973",
      variants: [],
    });

    const res = await POST(req(body()));

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.reason).toBe("duplicate");
    expect(json.wixProductId).toBe("08fa637b-a1e5-4328-93d7-ea700af48973");
    // Avgörande: importen får INTE ha körts.
    expect(importProduct).not.toHaveBeenCalled();
  });

  it("släpper igenom en listning som inte finns sedan tidigare", async () => {
    await store.saveMapping({
      supplierProductId: "9999999999999",
      wixProductId: "annan-produkt",
      variants: [],
    });

    const res = await POST(req(body()));

    expect(res.status).not.toBe(409);
    expect(importProduct).toHaveBeenCalled();
  });

  it("allowDuplicate: true kringgår spärren medvetet", async () => {
    await store.saveMapping({
      supplierProductId: "1005012621231106",
      wixProductId: "08fa637b-a1e5-4328-93d7-ea700af48973",
      variants: [],
    });

    const res = await POST(req(body({ allowDuplicate: true })));

    expect(res.status).not.toBe(409);
    expect(importProduct).toHaveBeenCalled();
  });

  it("fail-open: ett trasigt mappnings-uppslag blockerar inte importen", async () => {
    vi.spyOn(store, "listMappings").mockRejectedValueOnce(new Error("Wix Data nere"));

    const res = await POST(req(body()));

    expect(res.status).not.toBe(409);
    expect(importProduct).toHaveBeenCalled();
  });
});

// ── Nedtagen listning importeras aldrig (audit 2026-08-24) ──────────────────
//
// En nedtagen listning svarar 200 med saldot fruset på sista kända värdet, så
// ingenting nedströms kunde se skillnaden — produkten hamnade köpbar i butiken
// från dag ett. Rutten hämtar redan DS-lagret här; den läste bara aldrig
// hyllstatusen som följde med i samma svar.

describe("/api/import — spärr mot nedtagen AliExpress-listning", () => {
  it("avvisar med 422 och importerar INTE när listningen är nedtagen", async () => {
    const client = await import("@/lib/aliexpress/client");
    vi.mocked(client.getInventory).mockResolvedValueOnce({
      listingAvailability: "offline",
      offlineReason: "offline / expire_offline",
      // Saldot finns kvar i svaret — det är just därför spärren behövs.
      variants: [{ skuId: "sv-1", price: 90, stock: 12, skuProps: {} }],
    });

    const res = await POST(req(body()));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.code).toBe("listing_offline");
    expect(json.error).toContain("expire_offline");
    expect(importProduct).not.toHaveBeenCalled();
  });

  it("'unknown' hyllstatus släpps igenom precis som före fältet fanns", async () => {
    const client = await import("@/lib/aliexpress/client");
    vi.mocked(client.getInventory).mockResolvedValueOnce({
      listingAvailability: "unknown",
      variants: [{ skuId: "sv-1", price: 90, stock: 12, skuProps: {} }],
    });

    const res = await POST(req(body()));
    expect(res.status).not.toBe(422);
    expect(importProduct).toHaveBeenCalled();
  });

  it("levande listning importeras som vanligt", async () => {
    const client = await import("@/lib/aliexpress/client");
    vi.mocked(client.getInventory).mockResolvedValueOnce({
      listingAvailability: "on_selling",
      variants: [{ skuId: "sv-1", price: 90, stock: 12, skuProps: {} }],
    });

    const res = await POST(req(body()));
    expect(res.status).not.toBe(422);
    expect(importProduct).toHaveBeenCalled();
  });
});
