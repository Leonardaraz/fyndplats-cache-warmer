import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getAppConfig, saveAppConfig } from "./app-config";

const FORRA = { token: process.env.WIX_API_TOKEN, site: process.env.WIX_SITE_ID };

beforeEach(() => {
  process.env.WIX_API_TOKEN = "test-token";
  process.env.WIX_SITE_ID = "test-site";
});

afterEach(() => {
  if (FORRA.token === undefined) delete process.env.WIX_API_TOKEN;
  else process.env.WIX_API_TOKEN = FORRA.token;
  if (FORRA.site === undefined) delete process.env.WIX_SITE_ID;
  else process.env.WIX_SITE_ID = FORRA.site;
  vi.unstubAllGlobals();
});

/** Fångar varje anrop så testet kan påstå något om vad som faktiskt skickades. */
function stubba(svar: (url: string, init?: RequestInit) => Response) {
  const anrop: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal("fetch", (async (input: RequestInfo | URL, init?: RequestInit) => {
    anrop.push({ url: String(input), init });
    return svar(String(input), init);
  }) as unknown as typeof fetch);
  return anrop;
}

const ok = (data: Record<string, unknown>) =>
  new Response(JSON.stringify({ dataItem: { data } }), { status: 200 });

describe("getAppConfig", () => {
  it("läser fältet ur raden", async () => {
    stubba(() => ok({ _id: "default", aosomFeedUrl: "https://x.test/feed.csv" }));
    await expect(getAppConfig()).resolves.toEqual({ aosomFeedUrl: "https://x.test/feed.csv" });
  });

  it("trimmar, och tom sträng räknas som osatt", async () => {
    stubba(() => ok({ aosomFeedUrl: "  https://x.test/feed.csv  " }));
    expect((await getAppConfig()).aosomFeedUrl).toBe("https://x.test/feed.csv");

    stubba(() => ok({ aosomFeedUrl: "   " }));
    expect((await getAppConfig()).aosomFeedUrl).toBeUndefined();
  });

  it("saknad rad (404) är ett giltigt läge, inte ett fel", async () => {
    stubba(() => new Response("", { status: 404 }));
    await expect(getAppConfig()).resolves.toEqual({ aosomFeedUrl: undefined });
  });

  it("saknad kollektion behandlas som tom rad", async () => {
    stubba(() => new Response("Collection does not exist", { status: 400 }));
    await expect(getAppConfig()).resolves.toEqual({ aosomFeedUrl: undefined });
  });

  it("KASTAR vid riktigt läsfel — en Wix-nedgång får inte se ut som osatt", async () => {
    // Skillnaden mot getPricingRules, som faller tillbaka på defaults: här
    // finns inga defaults. Tystes felet hade felsökningen börjat på fel ställe.
    stubba(() => new Response("upstream borta", { status: 500 }));
    await expect(getAppConfig()).rejects.toThrow(/getAppConfig \(500\)/);
  });

  it("kastar utan WIX_API_TOKEN i stället för att anropa anonymt", async () => {
    delete process.env.WIX_API_TOKEN;
    stubba(() => ok({}));
    await expect(getAppConfig()).rejects.toThrow(/WIX_API_TOKEN saknas/);
  });

  it("skickar token och site-id", async () => {
    const anrop = stubba(() => ok({}));
    await getAppConfig();
    const h = anrop[0].init?.headers as Record<string, string>;
    expect(h.Authorization).toBe("test-token");
    expect(h["wix-site-id"]).toBe("test-site");
  });
});

describe("saveAppConfig", () => {
  it("läser först och skickar tillbaka det som inte ändras", async () => {
    // `save` byter ut hela data-objektet. En partiell skrivning hade raderat
    // resten — samma fälla som CLAUDE.md noterar för wix-data-PATCH.
    const anrop = stubba((url, init) =>
      init?.method === "POST"
        ? new Response("{}", { status: 200 })
        : ok({ aosomFeedUrl: "https://gammal.test/feed.csv", nagotAnnat: "bevaras" }),
    );

    await saveAppConfig({ aosomFeedUrl: "https://ny.test/feed.csv" });

    const skrivning = anrop.find((a) => a.init?.method === "POST");
    const body = JSON.parse(String(skrivning?.init?.body)) as {
      dataItem: { data: Record<string, unknown> };
    };
    expect(body.dataItem.data.aosomFeedUrl).toBe("https://ny.test/feed.csv");
    expect(body.dataItem.data._id).toBe("default");
    expect(body.dataItem.data.updatedAt).toEqual(expect.any(String));
  });

  it("tomt värde skriver inte över ett satt", async () => {
    const anrop = stubba((url, init) =>
      init?.method === "POST"
        ? new Response("{}", { status: 200 })
        : ok({ aosomFeedUrl: "https://gammal.test/feed.csv" }),
    );
    const kvar = await saveAppConfig({ aosomFeedUrl: "  " });
    expect(kvar.aosomFeedUrl).toBe("https://gammal.test/feed.csv");
    const skrivning = anrop.find((a) => a.init?.method === "POST");
    const body = JSON.parse(String(skrivning?.init?.body)) as {
      dataItem: { data: Record<string, unknown> };
    };
    expect(body.dataItem.data.aosomFeedUrl).toBe("https://gammal.test/feed.csv");
  });

  it("kastar när skrivningen misslyckas", async () => {
    stubba((url, init) =>
      init?.method === "POST" ? new Response("nej", { status: 403 }) : ok({}),
    );
    await expect(saveAppConfig({ aosomFeedUrl: "https://x.test/f.csv" }))
      .rejects.toThrow(/saveAppConfig \(403\)/);
  });
});
