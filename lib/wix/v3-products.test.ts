import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ☠️ VARFÖR DET HÄR TESTET FINNS (2026-09-14).
//
// `listVisibleV3ProductIds` hade ett tak på 50 sidor — 5 000 produkter — mot en
// katalog på ~5 500. Taket var alltså redan passerat, och funktionen svarade med
// en TYST avkortad mängd: inget fel, ingen räknare, ingenting som skiljer "slut
// på produkter" från "slut på sidor".
//
// Riktningen är det som gör felet dyrt. En produkt som saknas i mängden
// behandlas som OSYNLIG, alltså ser en publicerad produkt ut som ett utkast.
// Recensionssvepet hoppar över den, och prisjämförelsen mot dealproffsen lägger
// den i listan "polera dessa först". Båda tysta, båda åt fel håll.
//
// Samma klass som `Promise.allSettled` i `media.ts` och som `queryAll`:s eget
// tak: en konstant som var rätt när den sattes och blev fel när volymen växte
// under den. Skillnaden mot de andra är att den här ska SKRIKA.

const origToken = process.env.WIX_API_TOKEN;
const origSite = process.env.WIX_SITE_ID;

/** En sida med `antal` produkter och en markör som alltid pekar vidare. */
function sida(antal: number, forstaId: number) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      products: Array.from({ length: antal }, (_, i) => ({
        id: `p${forstaId + i}`,
        visible: true,
      })),
      pagingMetadata: { cursors: { next: `c${forstaId + antal}` }, hasNext: true },
    }),
    text: async () => "",
  } as unknown as Response;
}

describe("listVisibleV3ProductIds", () => {
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
    vi.restoreAllMocks();
  });

  it("☠️ KASTAR när sidtaket nås — den kapar aldrig tyst", async () => {
    // En butik som svarar `hasNext: true` i all evighet. Den gamla koden hade
    // returnerat de första 5 000 id:na och sett ut att lyckas.
    vi.stubGlobal("fetch", vi.fn(async () => sida(100, 0)));
    const { listVisibleV3ProductIds } = await import("./v3-products");
    await expect(listVisibleV3ProductIds()).rejects.toThrow(/passerade .* sidor/);
  });

  it("taket ligger över katalogens storlek med marginal — ~5 500 produkter går igenom", async () => {
    // 60 sidor är 6 000 produkter, alltså över den gamla gränsen på 50 och över
    // dagens katalog. Går den igenom är taket inte i vägen för normal drift.
    let n = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        n++;
        if (n < 60) return sida(100, n * 100);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            products: [{ id: "sista", visible: true }],
            pagingMetadata: { hasNext: false },
          }),
          text: async () => "",
        } as unknown as Response;
      }),
    );
    const { listVisibleV3ProductIds } = await import("./v3-products");
    const ut = await listVisibleV3ProductIds();
    expect(ut.size).toBe(59 * 100 + 1);
    expect(ut.has("sista")).toBe(true);
  });

  it("en produkt utan `visible` räknas som synlig — tyst uteslutning är fel håll", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          products: [{ id: "utan-falt" }, { id: "dold", visible: false }],
          pagingMetadata: { hasNext: false },
        }),
        text: async () => "",
      }) as unknown as Response),
    );
    const { listVisibleV3ProductIds } = await import("./v3-products");
    const ut = await listVisibleV3ProductIds();
    expect(ut.has("utan-falt")).toBe(true);
    expect(ut.has("dold")).toBe(false);
  });
});

// ☠️ VARFÖR DE HÄR TESTERNA FINNS (2026-09-15).
//
// Leonard: *"namnet som står är deras, länken som står är deras och vi har
// inget mot oss."* Prisjämförelsen mot dealproffsen kunde bara peka på
// konkurrentens sida. `listV3ProductInfo` är uppslaget som ger vår egen.
//
// Uppmätt samma dag mot skarpa V3: butikens URL är `/produkt/<slug>` och
// Wix-id:t svarar **404** — utan slugen finns ingen länk att bygga.

describe("listV3ProductInfo", () => {
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
    vi.restoreAllMocks();
  });

  // ⚠️ MARKÖREN MÅSTE MED när hasNext är sann. Loopen bryter på `!cursor`,
  // så en stubbe utan markör bryter direkt och taket kan aldrig nås — testet
  // hade då gått grönt utan att pröva något. Det fällde på just det.
  function svar(produkter: unknown[], hasNext = false) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        products: produkter,
        pagingMetadata: hasNext ? { cursors: { next: "c" }, hasNext: true } : { hasNext: false },
      }),
      text: async () => "",
    } as unknown as Response;
  }

  it("bär slug, namn och synlighet — alla tre behövs i rapporten", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => svar([
      { id: "a", slug: "baddsoffa-2-sits-gra", name: "Bäddsoffa 2-sits Grå", visible: true },
      { id: "b", slug: "tyskt-utkast", name: "Schlafsofa", visible: false },
    ])));
    const { listV3ProductInfo } = await import("./v3-products");
    const ut = await listV3ProductInfo();
    expect(ut.get("a")).toEqual({
      slug: "baddsoffa-2-sits-gra", namn: "Bäddsoffa 2-sits Grå", visible: true,
    });
    expect(ut.get("b")?.visible).toBe(false);
  });

  it("☠️ FRÅGAR UTAN SYNLIGHETSVILLKOR — utkasten är merparten av katalogen", async () => {
    // En fråga som tyst filtrerat bort utkast hade gett ett uppslag som saknar
    // just de rader rapporten mest handlar om (2 560 av 4 078).
    const anrop = vi.fn(
      async (_url: string, init?: RequestInit) =>
        svar([{ id: "u", slug: "s", name: "n", visible: false }]),
    );
    vi.stubGlobal("fetch", anrop);
    const { listV3ProductInfo } = await import("./v3-products");
    const ut = await listV3ProductInfo();
    expect(ut.size).toBe(1);
    expect(String(anrop.mock.calls[0]?.[1]?.body)).not.toMatch(/visible/);
  });

  it("☠️ KASTAR vid sidtaket — en avkortad lista gör produkter länklösa", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => svar(
      [{ id: "x", slug: "s", name: "n", visible: true }], true,
    )));
    const { listV3ProductInfo } = await import("./v3-products");
    await expect(listV3ProductInfo()).rejects.toThrow(/passerade .* sidor/);
  });

  it("saknat slug/namn blir tom sträng, inte undefined som kryper ut i en URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => svar([{ id: "a" }])));
    const { listV3ProductInfo } = await import("./v3-products");
    expect(await listV3ProductInfo().then((m) => m.get("a"))).toEqual({
      slug: "", namn: "", visible: true,
    });
  });
});

// ☠️ VARFÖR DE HÄR TESTERNA FINNS (2026-09-23).
//
// Samma tak som listVisibleV3ProductIds hade — 50 sidor, tyst avkortning — satt
// kvar i listAllV3Products när den rättades 2026-09-14. /admin/seo,
// lönsamhetsrapporten och /admin/mappings räknade alltså på de första 5 000
// produkterna av ~5 500. Och /admin/mappings laddade inte alls: den skickade
// varje produkts beskrivning och JSON-LD till webbläsaren.

describe("listAllV3Products", () => {
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
    vi.restoreAllMocks();
  });

  /** En sida i listAllV3Products-formen (namn och slug krävs av mappningen). */
  function helSida(antal: number, forstaId: number, sista = false) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        products: Array.from({ length: antal }, (_, i) => ({
          id: `p${forstaId + i}`, name: `P${forstaId + i}`, slug: `p-${forstaId + i}`,
        })),
        pagingMetadata: sista
          ? { hasNext: false }
          : { cursors: { next: `c${forstaId + antal}` }, hasNext: true },
      }),
      text: async () => "",
    } as unknown as Response;
  }

  it("☠️ KASTAR när sidtaket nås — den kapar aldrig tyst", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => helSida(100, 0)));
    const { listAllV3Products } = await import("./v3-products");
    await expect(listAllV3Products()).rejects.toThrow(/passerade .* sidor/);
  });

  it("~5 500 produkter går igenom — den gamla gränsen på 5 000 är borta", async () => {
    let n = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      n++;
      return n < 56 ? helSida(100, n * 100) : helSida(1, 99_999, true);
    }));
    const { listAllV3Products } = await import("./v3-products");
    const ut = await listAllV3Products({ beskrivning: false });
    expect(ut).toHaveLength(55 * 100 + 1);
  });

  it("beskrivning: false ber inte om PLAIN_DESCRIPTION — det tyngsta fältet i svaret", async () => {
    const kroppar: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      kroppar.push(String(init?.body ?? ""));
      return helSida(1, 0, true);
    }));
    const { listAllV3Products } = await import("./v3-products");
    await listAllV3Products({ beskrivning: false });
    expect(kroppar[0]).not.toContain("PLAIN_DESCRIPTION");
  });

  it("utan val ber den om beskrivningen som förut — /admin/seo behöver den", async () => {
    const kroppar: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      kroppar.push(String(init?.body ?? ""));
      return helSida(1, 0, true);
    }));
    const { listAllV3Products } = await import("./v3-products");
    await listAllV3Products();
    expect(kroppar[0]).toContain("PLAIN_DESCRIPTION");
  });
});

describe("getV3ProductBySlug", () => {
  beforeEach(() => {
    process.env.WIX_API_TOKEN = "t";
  });
  afterEach(() => {
    process.env.WIX_API_TOKEN = origToken;
  });

  function svar(status: number, body: unknown) {
    return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => "" } as unknown as Response;
  }

  it("slår upp med ETT anrop mot slug-rutten", async () => {
    const { getV3ProductBySlug } = await import("./v3-products");
    const f = vi.fn(async () => svar(200, { product: { id: "p1", name: "Lövblås", slug: "lovblas-20v" } }));
    const r = await getV3ProductBySlug(" Lovblas-20V ", f as unknown as typeof fetch);
    expect(r).toEqual({ id: "p1", name: "Lövblås", slug: "lovblas-20v" });
    expect(f).toHaveBeenCalledTimes(1);
    expect((f.mock.calls[0] as unknown as [string])[0]).toBe("https://www.wixapis.com/stores/v3/products/slug/lovblas-20v");
  });

  it("404 ger null utan att skanna katalogen", async () => {
    const { getV3ProductBySlug } = await import("./v3-products");
    const f = vi.fn(async () => svar(404, {}));
    expect(await getV3ProductBySlug("finns-inte", f as unknown as typeof fetch)).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("godtar bara en produkt med exakt den sökta sluggen", async () => {
    const { getV3ProductBySlug } = await import("./v3-products");
    const f = vi.fn(async () => svar(200, { product: { id: "p9", name: "Annan", slug: "annan" } }));
    expect(await getV3ProductBySlug("lovblas-20v", f as unknown as typeof fetch)).toBeNull();
  });

  it("andra fel kastar i stället för att tolkas som ingen träff", async () => {
    const { getV3ProductBySlug } = await import("./v3-products");
    const f = vi.fn(async () => svar(500, {}));
    await expect(getV3ProductBySlug("lovblas-20v", f as unknown as typeof fetch)).rejects.toThrow(/500/);
  });
});

// ☠️ Omdirigeringsgrinden läste hela katalogen för att kontrollera en eller två
// adresser: 6 311 produkter på 64 sidor, ~1 s per sida, alltså ~63 s mot
// ruttens tak på 60 (mätt 2026-09-30). De här två frågorna är vad den ställer i
// stället. Svaren nedan är formade efter de skarpa svaren samma dag.
describe("slugArSynligProdukt", () => {
  beforeEach(() => {
    process.env.WIX_API_TOKEN = "t";
  });
  afterEach(() => {
    if (origToken === undefined) delete process.env.WIX_API_TOKEN;
    else process.env.WIX_API_TOKEN = origToken;
  });

  function wix(status: number, body: unknown) {
    return vi.fn(async (_url: string, _init?: RequestInit) => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => "",
    }) as unknown as Response);
  }

  const traff = (...products: unknown[]) => ({
    products,
    pagingMetadata: { count: products.length, cursors: {}, hasNext: false },
  });

  it("ETT anrop: exakt slug-filter mot products/query, i gemener", async () => {
    const { slugArSynligProdukt } = await import("./v3-products");
    const f = wix(200, traff({ slug: "lovblas-20v", visible: true }));
    expect(await slugArSynligProdukt(" Lovblas-20V ", f as unknown as typeof fetch)).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://www.wixapis.com/stores/v3/products/query");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      query: { filter: { slug: "lovblas-20v" }, cursorPaging: { limit: 10 } },
    });
  });

  it("ingen träff är false — det uppmätta nollsvaret bär en tom lista", async () => {
    const { slugArSynligProdukt } = await import("./v3-products");
    const f = wix(200, traff());
    expect(await slugArSynligProdukt("raderad-produkt", f as unknown as typeof fetch)).toBe(false);
  });

  it("ett UTKAST med sluggen är ingen synlig produkt", async () => {
    const { slugArSynligProdukt } = await import("./v3-products");
    const f = wix(200, traff({ slug: "opolerat-utkast", visible: false }));
    expect(await slugArSynligProdukt("opolerat-utkast", f as unknown as typeof fetch)).toBe(false);
  });

  it("saknat visible räknas som synligt, aldrig som dött", async () => {
    const { slugArSynligProdukt } = await import("./v3-products");
    const f = wix(200, traff({ slug: "utan-visible-falt" }));
    expect(await slugArSynligProdukt("utan-visible-falt", f as unknown as typeof fetch)).toBe(true);
  });

  it("☠️ en träff med en ANNAN slug kastar — då bet filtret inte", async () => {
    // Ett filter som inte tillämpats ger katalogens första produkter. Att läsa
    // det som "ingen träff" vore att godkänna en källa utan att ha frågat.
    const { slugArSynligProdukt } = await import("./v3-products");
    const f = wix(200, traff({ slug: "nagot-helt-annat", visible: true }));
    await expect(slugArSynligProdukt("raderad-produkt", f as unknown as typeof fetch)).rejects.toThrow(/annan slug/);
  });

  it("☠️ ett 200-svar utan products-lista kastar — en tom lista ÄR beskedet att sidan är ledig", async () => {
    const { slugArSynligProdukt } = await import("./v3-products");
    const f = wix(200, {});
    await expect(slugArSynligProdukt("raderad-produkt", f as unknown as typeof fetch)).rejects.toThrow(/products-lista/);
  });

  it("HTTP-fel kastar i stället för att tolkas som ingen träff", async () => {
    const { slugArSynligProdukt } = await import("./v3-products");
    const f = wix(429, {});
    await expect(slugArSynligProdukt("raderad-produkt", f as unknown as typeof fetch)).rejects.toThrow(/429/);
  });
});

describe("katalogenHarSynligProdukt", () => {
  beforeEach(() => {
    process.env.WIX_API_TOKEN = "t";
  });
  afterEach(() => {
    if (origToken === undefined) delete process.env.WIX_API_TOKEN;
    else process.env.WIX_API_TOKEN = origToken;
  });

  function wix(status: number, body: unknown) {
    return vi.fn(async (_url: string, _init?: RequestInit) => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => "",
    }) as unknown as Response);
  }

  it("frågar efter EN synlig produkt", async () => {
    const { katalogenHarSynligProdukt } = await import("./v3-products");
    const f = wix(200, { products: [{ slug: "julgran", visible: true }] });
    expect(await katalogenHarSynligProdukt(f as unknown as typeof fetch)).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(f.mock.calls[0][1]?.body))).toEqual({
      query: { filter: { visible: true }, cursorPaging: { limit: 1 } },
    });
  });

  it("ingen synlig produkt är false", async () => {
    const { katalogenHarSynligProdukt } = await import("./v3-products");
    const f = wix(200, { products: [] });
    expect(await katalogenHarSynligProdukt(f as unknown as typeof fetch)).toBe(false);
  });

  it("☠️ ett UTKAST räknas inte — den ofiltrerade katalogen börjar med ett", async () => {
    // Uppmätt 2026-09-30: katalogens första produkt utan filter är ett tyskt
    // utkast. Ett filter som inte bet får alltså inte räcka som bevis.
    const { katalogenHarSynligProdukt } = await import("./v3-products");
    const f = wix(200, { products: [{ slug: "beleuchtetes-rentier", visible: false }] });
    expect(await katalogenHarSynligProdukt(f as unknown as typeof fetch)).toBe(false);
  });

  it("fel kastar", async () => {
    const { katalogenHarSynligProdukt } = await import("./v3-products");
    const f = wix(503, {});
    await expect(katalogenHarSynligProdukt(f as unknown as typeof fetch)).rejects.toThrow(/503/);
  });
});

// Leverantörslänkarna tar Leonards listor med butiksadresser (2026-10-07).
// `$in` på slug är mätt mot skarpa V3 samma dag: tre levande slugs och en
// påhittad gav tre träffar med id och visible.
describe("getV3ProductIdsBySlugs", () => {
  beforeEach(() => {
    process.env.WIX_API_TOKEN = "t";
  });
  afterEach(() => {
    if (origToken === undefined) delete process.env.WIX_API_TOKEN;
    else process.env.WIX_API_TOKEN = origToken;
  });

  /** Svarar på varje fråga med de produkter vars slug frågades efter. */
  function katalog(produkter: Array<{ id?: string; slug: string; visible?: boolean }>) {
    return vi.fn(async (_url: string, init?: RequestInit) => {
      const fragade: string[] = JSON.parse(String(init?.body)).query.filter.slug.$in;
      return {
        ok: true,
        status: 200,
        json: async () => ({ products: produkter.filter((p) => fragade.includes(p.slug)) }),
        text: async () => "",
      } as unknown as Response;
    });
  }

  it("hundra slugs per fråga, i gemener, och en okänd slug saknas i svaret", async () => {
    const { getV3ProductIdsBySlugs } = await import("./v3-products");
    const slugs = Array.from({ length: 150 }, (_, i) => `sida-${i}`);
    const f = katalog([
      { id: "p0", slug: "sida-0", visible: true },
      { id: "p149", slug: "sida-149", visible: false },
    ]);
    const svar = await getV3ProductIdsBySlugs([...slugs, " SIDA-0 ", "finns-inte"], f as unknown as typeof fetch);
    expect(f).toHaveBeenCalledTimes(2);
    const forsta = JSON.parse(String(f.mock.calls[0][1]?.body));
    expect(forsta.query.filter.slug.$in).toHaveLength(100);
    expect(forsta.query.cursorPaging).toEqual({ limit: 100 });
    expect([...svar.entries()]).toEqual([
      ["sida-0", { id: "p0", visible: true }],
      ["sida-149", { id: "p149", visible: false }],
    ]);
  });

  it("en tom lista frågar ingenting", async () => {
    const { getV3ProductIdsBySlugs } = await import("./v3-products");
    const f = katalog([]);
    expect((await getV3ProductIdsBySlugs(["", "  "], f as unknown as typeof fetch)).size).toBe(0);
    expect(f).not.toHaveBeenCalled();
  });

  it("☠️ en träff som inte frågades efter kastar — då bet filtret inte", async () => {
    const { getV3ProductIdsBySlugs } = await import("./v3-products");
    const f = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ products: [{ id: "x", slug: "katalogens-forsta", visible: true }] }),
      text: async () => "",
    }) as unknown as Response);
    await expect(getV3ProductIdsBySlugs(["en-annan"], f as unknown as typeof fetch)).rejects.toThrow(/bet inte/);
  });

  it("☠️ en träff utan id kastar i stället för att tappa produkten tyst", async () => {
    const { getV3ProductIdsBySlugs } = await import("./v3-products");
    const f = katalog([{ slug: "utan-id", visible: true }]);
    await expect(getV3ProductIdsBySlugs(["utan-id"], f as unknown as typeof fetch)).rejects.toThrow(/utan id/);
  });

  it("☠️ ett svar utan produktlista kastar — en tom lista betyder att ingen slug finns", async () => {
    const { getV3ProductIdsBySlugs } = await import("./v3-products");
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => "" }) as unknown as Response);
    await expect(getV3ProductIdsBySlugs(["en-sida"], f as unknown as typeof fetch)).rejects.toThrow(/products-lista/);
  });
});
