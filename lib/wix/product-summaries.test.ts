import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { searchProductSummaries } from "./client";

const FORRA = { token: process.env.WIX_API_TOKEN, site: process.env.WIX_SITE_ID };

beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
  process.env.WIX_SITE_ID = "s";
});

afterEach(() => {
  if (FORRA.token === undefined) delete process.env.WIX_API_TOKEN;
  else process.env.WIX_API_TOKEN = FORRA.token;
  if (FORRA.site === undefined) delete process.env.WIX_SITE_ID;
  else process.env.WIX_SITE_ID = FORRA.site;
  vi.unstubAllGlobals();
});

function stubba(svar: (kropp: { search: { filter: { id: { $in: string[] } } } }) => unknown) {
  const kroppar: Array<Record<string, unknown>> = [];
  vi.stubGlobal("fetch", (async (_u: RequestInfo | URL, init?: RequestInit) => {
    const kropp = JSON.parse(String(init?.body));
    kroppar.push(kropp);
    return new Response(JSON.stringify(svar(kropp)), { status: 200 });
  }) as unknown as typeof fetch);
  return kroppar;
}

describe("searchProductSummaries", () => {
  // ☠️ På products/search hör filtret INUTI `search`. På toppnivån är det en
  // no-op som svarar 200 med ofiltrerade produkter (uppmätt 2026-09-16).
  it("lägger id-filtret inuti search", async () => {
    const kroppar = stubba(() => ({ products: [] }));
    await searchProductSummaries(["a", "b"]);
    expect(kroppar[0]).toEqual({
      search: { filter: { id: { $in: ["a", "b"] } }, cursorPaging: { limit: 100 } },
    });
  });

  // Sida två med filter och markör svarar 400; en tugga om högst 100 behöver ingen.
  it("delar i tuggor om 100 och frågar aldrig om samma id två gånger", async () => {
    const ids = Array.from({ length: 150 }, (_, i) => `id-${i}`);
    const kroppar = stubba(() => ({ products: [] }));
    await searchProductSummaries([...ids, "id-0", ""]);
    expect(kroppar).toHaveLength(2);
    const tugga = (k: Record<string, unknown>) =>
      (k as { search: { filter: { id: { $in: string[] } } } }).search.filter.id.$in;
    expect(tugga(kroppar[0])).toHaveLength(100);
    expect(tugga(kroppar[1])).toHaveLength(50);
  });

  it("läser namn, slug, synlighet och butikens lagerstatus", async () => {
    stubba(() => ({
      products: [
        {
          id: "a",
          name: "Rymdfärja i trä",
          slug: "rymdfarja",
          visible: true,
          inventory: { availabilityStatus: "OUT_OF_STOCK" },
        },
        { id: "b", name: "Kattlåda" },
      ],
    }));
    const svar = await searchProductSummaries(["a", "b"]);
    expect(svar.get("a")).toEqual({
      id: "a",
      name: "Rymdfärja i trä",
      slug: "rymdfarja",
      visible: true,
      availabilityStatus: "OUT_OF_STOCK",
    });
    expect(svar.get("b")?.availabilityStatus).toBeUndefined();
  });
});
