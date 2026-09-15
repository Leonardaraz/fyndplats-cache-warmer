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
