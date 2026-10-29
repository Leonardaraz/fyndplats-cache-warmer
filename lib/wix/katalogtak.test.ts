// Katalogtaken efter VEVOR-importen (2026-10-29).
//
// ☠️ VARFÖR TESTET FINNS. Fem svep över hela katalogen hade egna sidtak på 200
// eller 300 sidor, "långt över nuvarande katalog". VEVOR-importen tar katalogen
// från ~6 300 till ~22 000 produkter. Prislistan som Aosom- och VEVOR-synken
// läser, svepet bakom Prisjakt-flödet och städningen av val hade kastat vid
// 20 000 produkter, ungefär ett dygn efter att importen slagits på.
//
// Varje svep får här en katalog på 250 sidor, alltså 25 000 produkter, och ska
// komma igenom den. Taket ska kasta först när markören aldrig tar slut.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KATALOG_SIDTAK, WIX_MAX_PRODUKTER } from "./limits";

/** 25 000 produkter: VEVOR-katalogen ovanpå dagens, med marginal. */
const SIDOR = 250;

const origToken = process.env.WIX_API_TOKEN;
const origSite = process.env.WIX_SITE_ID;

function svar(kropp: unknown): Response {
  return { ok: true, status: 200, json: async () => kropp, text: async () => "" } as unknown as Response;
}

/** Sidans nummer ur markören i kroppen ("c<sida>"), oavsett om svepet frågar med query eller search. */
function sidaUrKropp(init?: RequestInit): number {
  const kropp = JSON.parse(String(init?.body ?? "{}")) as {
    query?: { cursorPaging?: { cursor?: string } };
    search?: { cursorPaging?: { cursor?: string } };
  };
  const markor = kropp.query?.cursorPaging?.cursor ?? kropp.search?.cursorPaging?.cursor;
  return markor ? Number(markor.slice(1)) : 0;
}

/** En sida om hundra produkter. Sista sidan har ingen markör. */
function sida(nr: number, sidor: number) {
  const sista = nr + 1 >= sidor;
  return {
    products: Array.from({ length: 100 }, (_, i) => ({
      id: `p${nr * 100 + i}`,
      name: "Produkt",
      slug: `produkt-${nr * 100 + i}`,
      visible: true,
      actualPriceRange: { minValue: { amount: "100" }, maxValue: { amount: "100" } },
      variantSummary: { variantCount: 1 },
    })),
    pagingMetadata: sista ? { hasNext: false } : { cursors: { next: `c${nr + 1}` }, hasNext: true },
  };
}

/** En butik med `sidor` sidor produkter. Kategorierna är tomma. */
function katalog(sidor: number) {
  return vi.fn(async (url: string | URL, init?: RequestInit) => {
    if (String(url).includes("/categories/")) return svar({ categories: [], pagingMetadata: { hasNext: false } });
    return svar(sida(sidaUrKropp(init), sidor));
  });
}

/** En butik vars markör aldrig tar slut. */
function oandlig() {
  return vi.fn(async (url: string | URL, init?: RequestInit) => {
    if (String(url).includes("/categories/")) return svar({ categories: [], pagingMetadata: { hasNext: false } });
    return svar(sida(sidaUrKropp(init), Number.POSITIVE_INFINITY));
  });
}

/** Kör ett svep med falska timers. Pauserna mellan sidorna hade annars tagit en halv minut. */
async function medFalskaTimers<T>(f: () => Promise<T>): Promise<T> {
  vi.useFakeTimers();
  try {
    const utfall = f().then(
      (v) => ({ ok: true as const, v }),
      (e: unknown) => ({ ok: false as const, e }),
    );
    await vi.runAllTimersAsync();
    const u = await utfall;
    if (!u.ok) throw u.e;
    return u.v;
  } finally {
    vi.useRealTimers();
  }
}

beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
  process.env.WIX_SITE_ID = "s";
  vi.resetModules();
});

afterEach(() => {
  if (origToken === undefined) delete process.env.WIX_API_TOKEN;
  else process.env.WIX_API_TOKEN = origToken;
  if (origSite === undefined) delete process.env.WIX_SITE_ID;
  else process.env.WIX_SITE_ID = origSite;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("katalogtaket", () => {
  it("rymmer Wix tak på 50 000 produkter", () => {
    expect(WIX_MAX_PRODUKTER).toBe(50_000);
    expect(KATALOG_SIDTAK * 100).toBeGreaterThanOrEqual(WIX_MAX_PRODUKTER);
  });

  it("☠️ prislistan (Aosom- och VEVOR-synken) läser 25 000 produkter", async () => {
    const f = katalog(SIDOR);
    vi.stubGlobal("fetch", f);
    const { listV3ProductPrices } = await import("./v3-products");
    const priser = await medFalskaTimers(() => listV3ProductPrices());
    expect(priser.size).toBe(SIDOR * 100);
    expect(f).toHaveBeenCalledTimes(SIDOR);
  });

  it("☠️ flödessvepet bakom Prisjakt läser 25 000 produkter", async () => {
    vi.stubGlobal("fetch", katalog(SIDOR));
    const { listV3ProductsForFeed } = await import("./v3-products");
    const produkter = await medFalskaTimers(() => listV3ProductsForFeed());
    expect(produkter).toHaveLength(SIDOR * 100);
  });

  it("de synliga produkterna läses till 25 000", async () => {
    vi.stubGlobal("fetch", katalog(SIDOR));
    const { listVisibleV3ProductIds } = await import("./v3-products");
    expect((await listVisibleV3ProductIds()).size).toBe(SIDOR * 100);
  });

  it("katalogsvepet för bilderna blir klart på 25 000 utan tidsbudget", async () => {
    vi.stubGlobal("fetch", katalog(SIDOR));
    const { listCatalogProductMedia } = await import("./media-audit");
    const svep = await medFalskaTimers(() => listCatalogProductMedia("s"));
    expect(svep.complete).toBe(true);
    expect(svep.produkter).toHaveLength(SIDOR * 100);
  });

  it("☠️ städningen av val läser 25 000 produkter", async () => {
    const f = katalog(SIDOR);
    vi.stubGlobal("fetch", f);
    const { queryProductChoiceUsage } = await import("./prune-customizations");
    await expect(queryProductChoiceUsage()).resolves.toBeInstanceOf(Map);
    expect(f).toHaveBeenCalledTimes(SIDOR);
  });

  it("variantbildskollens katalogsvep läser 25 000 produkter", async () => {
    const { listaKatalogen } = await import("./variantbild-koll");
    const wix = vi.fn(async (_metod: string, _vag: string, kropp?: unknown) => {
      const markor = (kropp as { query?: { cursorPaging?: { cursor?: string } } })?.query?.cursorPaging?.cursor;
      return sida(markor ? Number(markor.slice(1)) : 0, SIDOR);
    });
    const rader = await listaKatalogen(wix as never, async () => {});
    expect(rader).toHaveLength(SIDOR * 100);
  });

  it("☠️ en markör som aldrig tar slut kastar fortfarande, vid Wix tak", async () => {
    const f = oandlig();
    vi.stubGlobal("fetch", f);
    const { listV3ProductPrices } = await import("./v3-products");
    await expect(medFalskaTimers(() => listV3ProductPrices())).rejects.toThrow(/sidtaket/);
    expect(f).toHaveBeenCalledTimes(KATALOG_SIDTAK);
  });
});
