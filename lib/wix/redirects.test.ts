import { afterEach, describe, expect, it, vi } from "vitest";
import { findRedirectConflicts, upsertRedirect, validateRedirect } from "./redirects";
import * as v3 from "./v3-products";

// Valideringen är sista försvarslinjen innan en rad hamnar i den tabell som
// storefronten omdirigerar besökare med — en trasig rad kan i värsta fall peka
// kunder bort från sajten.
describe("validateRedirect", () => {
  it("godkänner en normal produkt→produkt-redirect", () => {
    expect(validateRedirect({ fromSlug: "gammal-produkt", toPath: "/produkt/ny-produkt" })).toBeNull();
  });

  it("godkänner produkt→kategori och svenska tecken i slug", () => {
    expect(validateRedirect({ fromSlug: "hopfallbart-babybadkar", toPath: "/kategori/baby-smabarn" })).toBeNull();
    expect(validateRedirect({ fromSlug: "vaxsmältare", toPath: "/kategori/hushallsapparater" })).toBeNull();
  });

  it("kräver fromSlug utan /produkt/-prefix", () => {
    expect(validateRedirect({ fromSlug: "", toPath: "/butik" })).toMatch(/saknas/);
    expect(validateRedirect({ fromSlug: "/produkt/x", toPath: "/butik" })).toMatch(/utan \/produkt\//);
  });

  it("stoppar externa och protokoll-relativa mål", () => {
    expect(validateRedirect({ fromSlug: "x", toPath: "https://evil.example" })).toMatch(/intern sökväg/);
    expect(validateRedirect({ fromSlug: "x", toPath: "//evil.example" })).toMatch(/intern sökväg/);
    expect(validateRedirect({ fromSlug: "x", toPath: "produkt/y" })).toMatch(/intern sökväg/);
  });

  it("stoppar radbrytningar/mellanslag i målet (header-smuggling)", () => {
    expect(validateRedirect({ fromSlug: "x", toPath: "/produkt/y\r\nSet-Cookie: a=b" })).toMatch(/radbrytningar/);
    expect(validateRedirect({ fromSlug: "x", toPath: "/produkt/y z" })).toMatch(/radbrytningar/);
  });

  it("stoppar self-redirect (skulle ge oändlig loop)", () => {
    expect(validateRedirect({ fromSlug: "samma", toPath: "/produkt/samma" })).toMatch(/samma sida/);
  });

  it("stoppar skräptecken i slug", () => {
    expect(validateRedirect({ fromSlug: "bad slug!", toPath: "/butik" })).toMatch(/ogiltig fromSlug/);
  });
});

// Regression: första versionen läste WIX_API_KEY + krävde WIX_SITE_ID. Ingetdera
// finns i motorns miljö (det är headless-appen som har WIX_API_KEY), så varje
// skrivning dog på "WIX_API_KEY och WIX_SITE_ID krävs" innan den ens nådde Wix.
// Auth-formen måste vara identisk med lib/sync/sync-log.ts och lib/wix/client.ts.
describe("upsertRedirect auth-headers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function mockFetchOk() {
    return vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
  }

  it("autentiserar med WIX_API_TOKEN", async () => {
    vi.stubEnv("WIX_API_TOKEN", "token-abc");
    const fetchSpy = mockFetchOk();

    await upsertRedirect({ fromSlug: "gammal", toPath: "/kategori/leksaker-spel" });

    const sent = new Headers(fetchSpy.mock.calls[0][1]?.headers as HeadersInit);
    expect(sent.get("authorization")).toBe("token-abc");
    expect(sent.get("content-type")).toBe("application/json");
  });

  it("skickar wix-site-id bara när det är satt", async () => {
    vi.stubEnv("WIX_API_TOKEN", "token-abc");
    delete process.env.WIX_SITE_ID;
    const withoutSite = mockFetchOk();
    await upsertRedirect({ fromSlug: "gammal", toPath: "/butik" });
    expect(new Headers(withoutSite.mock.calls[0][1]?.headers as HeadersInit).has("wix-site-id")).toBe(false);

    vi.restoreAllMocks();
    vi.stubEnv("WIX_SITE_ID", "site-123");
    const withSite = mockFetchOk();
    await upsertRedirect({ fromSlug: "gammal", toPath: "/butik" });
    expect(new Headers(withSite.mock.calls[0][1]?.headers as HeadersInit).get("wix-site-id")).toBe("site-123");
  });

  it("kastar när token saknas — utan att röra nätet", async () => {
    delete process.env.WIX_API_TOKEN;
    const fetchSpy = mockFetchOk();

    await expect(upsertRedirect({ fromSlug: "gammal", toPath: "/butik" })).rejects.toThrow(/WIX_API_TOKEN/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skriver id på både toppnivå och i data (Wix kräver att de matchar)", async () => {
    vi.stubEnv("WIX_API_TOKEN", "token-abc");
    const fetchSpy = mockFetchOk();

    await upsertRedirect({ fromSlug: "gammal", toPath: "/kategori/leksaker-spel", reason: "test" });

    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.dataItem.id).toBe("gammal");
    expect(body.dataItem.data._id).toBe("gammal");
    expect(body.dataItem.data.toPath).toBe("/kategori/leksaker-spel");
  });

  it("validerar innan skrivning — en trasig rad når aldrig Wix", async () => {
    vi.stubEnv("WIX_API_TOKEN", "token-abc");
    const fetchSpy = mockFetchOk();

    await expect(upsertRedirect({ fromSlug: "x", toPath: "https://evil.example" })).rejects.toThrow(/Ogiltig redirect/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// Regression för incidenten 2026-07-31: tre 301-rader skrevs mot slugs som
// "svarade 404" — men två av dem var levande, säljbara produkter vars ISR-cache
// bara var utgången. HTTP-status duger inte som bevis; katalogen är facit.
describe("findRedirectConflicts", () => {
  afterEach(() => vi.restoreAllMocks());

  function catalog(...slugs: string[]) {
    return vi
      .spyOn(v3, "listAllV3Products")
      .mockResolvedValue(slugs.map((slug, i) => ({
        id: `id-${i}`,
        name: slug,
        slug,
        variantCount: 1,
        hasSeoTitle: true,
        hasSeoDescription: true,
        hasJsonLd: true,
        hasOgTags: true,
        hasImage: true,
        hasDescription: true,
      })) as Awaited<ReturnType<typeof v3.listAllV3Products>>);
  }

  it("släpper igenom en död källa mot en levande kategori", async () => {
    catalog("levande-produkt");
    const out = await findRedirectConflicts([
      { fromSlug: "raderad-produkt", toPath: "/kategori/leksaker-spel" },
    ]);
    expect(out).toEqual([]);
  });

  it("stoppar redirect FRÅN en synlig produkt (det som gick fel skarpt)", async () => {
    catalog("verktygsbank-barn-leksaksset-181-delar");
    const out = await findRedirectConflicts([
      { fromSlug: "verktygsbank-barn-leksaksset-181-delar", toPath: "/produkt/leksaksmotor-barn" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].problem).toMatch(/fortfarande en synlig produkt/);
  });

  it("stoppar redirect TILL en produkt som inte finns (404 → 404)", async () => {
    catalog("levande-produkt");
    const out = await findRedirectConflicts([
      { fromSlug: "raderad", toPath: "/produkt/finns-inte" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].problem).toMatch(/ingen synlig produkt/);
  });

  it("bryr sig inte om att kategorimål inte står i produktkatalogen", async () => {
    catalog("levande-produkt");
    const out = await findRedirectConflicts([
      { fromSlug: "raderad", toPath: "/kategori/vad-som-helst" },
    ]);
    expect(out).toEqual([]);
  });

  it("fail-closed när katalogen inte går att läsa", async () => {
    vi.spyOn(v3, "listAllV3Products").mockRejectedValue(new Error("Wix nere"));
    const out = await findRedirectConflicts([{ fromSlug: "raderad", toPath: "/butik" }]);
    expect(out).toHaveLength(1);
    expect(out[0].problem).toMatch(/kunde inte verifiera/);
  });

  it("fail-closed när katalogen kommer tillbaka tom", async () => {
    catalog();
    const out = await findRedirectConflicts([{ fromSlug: "raderad", toPath: "/butik" }]);
    expect(out).toHaveLength(1);
    expect(out[0].problem).toMatch(/tom/);
  });

  it("jämför skiftlägesokänsligt och rör inte nätet för en tom lista", async () => {
    const spy = catalog("Levande-Produkt");
    expect(await findRedirectConflicts([])).toEqual([]);
    expect(spy).not.toHaveBeenCalled();

    const out = await findRedirectConflicts([{ fromSlug: "LEVANDE-produkt", toPath: "/butik" }]);
    expect(out).toHaveLength(1);
  });
});
