import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findRedirectConflicts, SAMTIDIGA_SLUGFRAGOR, upsertRedirect, validateRedirect } from "./redirects";
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
//
// ☠️ Och sedan 2026-09-30 frågas katalogen per ADRESS, inte i sin helhet. Att
// läsa alla 6 311 produkter för att kontrollera en rad tog ~63 s mot ruttens
// tak på 60, och POST /api/admin/redirects dog med 504 innan den hann skriva.
// Den falska Wix:en nedan svarar som den skarpa gjorde samma dag.

interface FalskProdukt {
  slug: string;
  visible?: boolean;
}

interface Fraga {
  filter?: { slug?: string; visible?: boolean };
  cursorPaging?: { limit?: number; cursor?: string };
}

function wixSvar(products: FalskProdukt[]): Response {
  return new Response(
    JSON.stringify({ products, pagingMetadata: { count: products.length, cursors: {}, hasNext: false } }),
    { status: 200 },
  );
}

/**
 * En falsk `products/query` med de uppmätta egenskaperna: exakt slug-filter,
 * skiftlägeskänsligt, noll eller en träff; `visible:true` ger en synlig
 * produkt; en ofiltrerad fråga ger katalogen, precis som den skarpa. Varje
 * fråga sparas, så att testerna ser vad grinden faktiskt frågade.
 */
function falskWix(
  katalog: FalskProdukt[],
  opts: { trasigSlug?: string; trasigKontroll?: boolean; fordrojningMs?: number } = {},
) {
  const urls: string[] = [];
  const fragor: Fraga[] = [];
  let iLuften = 0;
  let mestILuften = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
    urls.push(String(url));
    const fraga = (JSON.parse(String(init?.body)) as { query: Fraga }).query;
    fragor.push(fraga);
    iLuften++;
    mestILuften = Math.max(mestILuften, iLuften);
    try {
      if (opts.fordrojningMs) await new Promise((r) => setTimeout(r, opts.fordrojningMs));
      const slug = fraga.filter?.slug;
      if (typeof slug === "string") {
        if (slug === opts.trasigSlug) return new Response("upstream request timeout", { status: 504 });
        return wixSvar(katalog.filter((p) => p.slug === slug));
      }
      if (fraga.filter?.visible === true) {
        if (opts.trasigKontroll) return new Response("<html>429 Too Many Requests</html>", { status: 429 });
        return wixSvar(katalog.filter((p) => p.visible !== false).slice(0, 1));
      }
      return wixSvar(katalog.slice(0, fraga.cursorPaging?.limit ?? 100));
    } finally {
      iLuften--;
    }
  });
  return {
    urls,
    fragor,
    slugFragor: () => fragor.flatMap((f) => (typeof f.filter?.slug === "string" ? [f.filter.slug] : [])),
    mestILuften: () => mestILuften,
  };
}

describe("findRedirectConflicts", () => {
  beforeEach(() => vi.stubEnv("WIX_API_TOKEN", "token-abc"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("☠️ en rad kostar en kontrollfråga och två exakta slug-frågor — aldrig hela katalogen", async () => {
    // Exakt raden som dog på 60 sekunder två gånger 2026-09-30.
    const skanning = vi.spyOn(v3, "listAllV3Products");
    const wix = falskWix([{ slug: "skrivbord-hogglans-100x50-cm", visible: true }]);
    const out = await findRedirectConflicts([
      { fromSlug: "skrivbord-hogglans-vit-100x50cm", toPath: "/produkt/skrivbord-hogglans-100x50-cm" },
    ]);
    expect(out).toEqual([]);
    expect(skanning).not.toHaveBeenCalled();
    expect(wix.fragor).toHaveLength(3);
    expect(wix.slugFragor().sort()).toEqual(["skrivbord-hogglans-100x50-cm", "skrivbord-hogglans-vit-100x50cm"]);
    // Ingen ofiltrerad fråga och ingen katalogsida om hundra.
    expect(wix.fragor.every((f) => f.filter && (f.cursorPaging?.limit ?? 100) <= 10)).toBe(true);
    expect(new Set(wix.urls)).toEqual(new Set(["https://www.wixapis.com/stores/v3/products/query"]));
  });

  it("släpper igenom en död källa mot en levande kategori", async () => {
    const wix = falskWix([{ slug: "levande-produkt", visible: true }]);
    const out = await findRedirectConflicts([
      { fromSlug: "raderad-produkt", toPath: "/kategori/leksaker-spel" },
    ]);
    expect(out).toEqual([]);
    // Kategorin är ingen produkt, så den frågas aldrig.
    expect(wix.slugFragor()).toEqual(["raderad-produkt"]);
  });

  it("stoppar redirect FRÅN en synlig produkt (det som gick fel skarpt)", async () => {
    falskWix([
      { slug: "verktygsbank-barn-leksaksset-181-delar", visible: true },
      { slug: "leksaksmotor-barn", visible: true },
    ]);
    const out = await findRedirectConflicts([
      { fromSlug: "verktygsbank-barn-leksaksset-181-delar", toPath: "/produkt/leksaksmotor-barn" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].problem).toMatch(/fortfarande en synlig produkt/);
  });

  it("stoppar redirect TILL en produkt som inte finns (404 → 404)", async () => {
    falskWix([{ slug: "levande-produkt", visible: true }]);
    const out = await findRedirectConflicts([
      { fromSlug: "raderad", toPath: "/produkt/finns-inte" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].problem).toMatch(/ingen synlig produkt/);
  });

  // ☠️ SYNLIGHETEN BARS INTE — och felet gick at bada hall.
  // `products/query` lagger inte pa nagot implicit `visible:true` (uppmatt,
  // CLAUDE.md), sa varje UTKAST rakandes som en levande sida sa lange
  // synligheten inte lastes. Uppmatt skarpt 2026-09-16 pa trappkarran `59c3b5d6`.
  it("släpper igenom en redirect FRÅN ett avpublicerat utkast", async () => {
    falskWix([
      { slug: "pensionerad-dubblett", visible: false },
      { slug: "sidan-vi-behaller", visible: true },
    ]);
    const out = await findRedirectConflicts([
      { fromSlug: "pensionerad-dubblett", toPath: "/produkt/sidan-vi-behaller" },
    ]);
    expect(out).toEqual([]);
  });

  // Den dyra halvan: malkontrollen finns for att stoppa en 301 som leder till
  // en 404. En kontroll som inte KAN falla raknas anda som gjord.
  it("stoppar redirect TILL ett utkast — målet är en 404 för kunden", async () => {
    falskWix([
      { slug: "nagot-levande", visible: true },
      { slug: "opolerat-utkast", visible: false },
    ]);
    const out = await findRedirectConflicts([
      { fromSlug: "raderad", toPath: "/produkt/opolerat-utkast" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].problem).toMatch(/ingen synlig produkt/);
  });

  // Riktningen ar vald: ett saknat falt far aldrig tyst doda en sida.
  it("saknat visible-fält räknas som SYNLIGT, aldrig som dött", async () => {
    falskWix([{ slug: "utan-visible-falt" }]);
    const out = await findRedirectConflicts([
      { fromSlug: "utan-visible-falt", toPath: "/butik" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].problem).toMatch(/fortfarande en synlig produkt/);
  });

  it("☠️ ett läsfel skriver inget — VARJE rad får en konflikt", async () => {
    falskWix([{ slug: "levande-produkt", visible: true }], { trasigSlug: "raderad" });
    const out = await findRedirectConflicts([
      { fromSlug: "raderad", toPath: "/produkt/levande-produkt" },
      { fromSlug: "annan-raderad", toPath: "/kategori/leksaker-spel" },
    ]);
    expect(out.map((c) => c.fromSlug)).toEqual(["raderad", "annan-raderad"]);
    for (const c of out) expect(c.problem).toMatch(/kunde inte verifiera.*504/);
  });

  it("☠️ en fallen kontrollfråga skriver inget heller — och då ställs inga slug-frågor", async () => {
    const wix = falskWix([{ slug: "levande-produkt", visible: true }], { trasigKontroll: true });
    const out = await findRedirectConflicts([
      { fromSlug: "raderad", toPath: "/kategori/leksaker-spel" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].problem).toMatch(/kunde inte verifiera.*429/);
    expect(wix.slugFragor()).toEqual([]);
  });

  it("☠️ fail-closed när katalogen saknar synliga produkter — en tom katalog är inget godkännande", async () => {
    // Med en fråga per adress ÄR "ingen träff" beskedet att källan är ledig. En
    // tom eller felkopplad katalog (fel site-id) hade alltså godkänt varje källa.
    falskWix([{ slug: "bara-ett-utkast", visible: false }]);
    const out = await findRedirectConflicts([
      { fromSlug: "raderad", toPath: "/butik" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].problem).toMatch(/tom/);
  });

  it("☠️ en batch där EN rad faller ger en konflikt för just den raden", async () => {
    // Att rutten då inte skriver NÅGON av raderna låses i
    // app/api/admin/redirects/route.test.ts — allt-eller-inget är dess sak.
    falskWix([
      { slug: "levande-a", visible: true },
      { slug: "levande-b", visible: true },
      { slug: "fortfarande-till-salu", visible: true },
    ]);
    const out = await findRedirectConflicts([
      { fromSlug: "raderad-1", toPath: "/produkt/levande-a" },
      { fromSlug: "fortfarande-till-salu", toPath: "/produkt/levande-b" },
      { fromSlug: "raderad-2", toPath: "/kategori/leksaker-spel" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].fromSlug).toBe("fortfarande-till-salu");
    expect(out[0].problem).toMatch(/fortfarande en synlig produkt/);
  });

  it("en adress som förekommer flera gånger frågas en gång", async () => {
    const wix = falskWix([{ slug: "samlingssidan", visible: true }]);
    const out = await findRedirectConflicts([
      { fromSlug: "raderad-1", toPath: "/produkt/samlingssidan" },
      { fromSlug: "raderad-2", toPath: "/produkt/samlingssidan" },
      { fromSlug: "RADERAD-1", toPath: "/produkt/samlingssidan" },
    ]);
    expect(out).toEqual([]);
    expect(wix.slugFragor().sort()).toEqual(["raderad-1", "raderad-2", "samlingssidan"]);
  });

  it("☠️ begränsad samtidighet — en stor batch avfyrar aldrig alla frågor på en gång", async () => {
    const wix = falskWix([{ slug: "levande-produkt", visible: true }], { fordrojningMs: 5 });
    const rader = Array.from({ length: 30 }, (_, i) => ({
      fromSlug: `raderad-${i}`,
      toPath: `/produkt/mal-${i}`,
    }));
    await findRedirectConflicts(rader);
    expect(wix.slugFragor()).toHaveLength(60);
    expect(wix.mestILuften()).toBeLessThanOrEqual(SAMTIDIGA_SLUGFRAGOR);
    // Men parallellt: en batch ska inte ta sextio rundresor i rad.
    expect(wix.mestILuften()).toBeGreaterThan(1);
  });

  it("jämför skiftlägesokänsligt och rör inte nätet för en tom lista", async () => {
    // Wix slug-filter är skiftlägeskänsligt och katalogens slugs är gemena
    // (0 av 6 311 bar en versal, 2026-09-30) — därför gemenas indata.
    const wix = falskWix([{ slug: "levande-produkt", visible: true }]);
    expect(await findRedirectConflicts([])).toEqual([]);
    expect(wix.fragor).toHaveLength(0);

    const out = await findRedirectConflicts([{ fromSlug: "LEVANDE-produkt", toPath: "/butik" }]);
    expect(out).toHaveLength(1);
    expect(wix.slugFragor()).toEqual(["levande-produkt"]);
  });
});
