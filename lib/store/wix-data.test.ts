import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WixDataStore } from "./wix-data";

// Etablerar fetch-mocking-convention för repot: mocka global.fetch via vi.fn(),
// stubba env-vars med vi.stubEnv för deterministisk auth-header, återställ
// båda efter varje test så vi inte läcker state mellan filer.

const ORIGINAL_FETCH = global.fetch;

function mockFetch(response: { status?: number; json: unknown }) {
  const fn = vi.fn().mockResolvedValue({
    ok: (response.status ?? 200) < 400,
    status: response.status ?? 200,
    json: async () => response.json,
    text: async () => JSON.stringify(response.json),
  } as Response);
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("WixDataStore — AliExpress-tokens", () => {
  beforeEach(() => {
    vi.stubEnv("WIX_API_TOKEN", "test-wix-token");
    vi.stubEnv("WIX_SITE_ID", "test-site-id");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("returnerar null när Wix Data svarar 404 (collection tom)", async () => {
    mockFetch({ status: 404, json: {} });
    const s = new WixDataStore();
    expect(await s.getAliExpressTokens()).toBeNull();
  });

  it("returnerar null när dataItem saknar något kritiskt fält", async () => {
    mockFetch({
      json: { dataItem: { data: { accessToken: "x", expiresAt: "2026-01-01T00:00:00Z" } } },
    });
    const s = new WixDataStore();
    expect(await s.getAliExpressTokens()).toBeNull();
  });

  it("parsar Wix Data-svaret korrekt (ISO → Date vid boundary)", async () => {
    mockFetch({
      json: {
        dataItem: {
          data: {
            accessToken: "test-access",
            refreshToken: "test-refresh",
            expiresAt: "2026-06-01T12:00:00.000Z",
          },
        },
      },
    });
    const s = new WixDataStore();
    const got = await s.getAliExpressTokens();
    expect(got?.accessToken).toBe("test-access");
    expect(got?.refreshToken).toBe("test-refresh");
    expect(got?.expiresAt).toBeInstanceOf(Date);
    expect(got?.expiresAt.toISOString()).toBe("2026-06-01T12:00:00.000Z");
  });

  it("saveAliExpressTokens skickar korrekt payload till Wix Data /save", async () => {
    const fetchMock = mockFetch({ json: { dataItem: { data: {} } } });
    const s = new WixDataStore();
    await s.saveAliExpressTokens({
      accessToken: "test-access",
      refreshToken: "test-refresh",
      expiresAt: new Date("2026-06-01T12:00:00.000Z"),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://www.wixapis.com/data/v2/items/save");
    expect(init.method).toBe("POST");

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("test-wix-token");
    expect(headers["wix-site-id"]).toBe("test-site-id");

    const body = JSON.parse(init.body as string);
    expect(body.dataCollectionId).toBe("FyndplatsAliExpressTokens");
    expect(body.dataItem.id).toBe("aliexpress-main");
    expect(body.dataItem.data.accessToken).toBe("test-access");
    expect(body.dataItem.data.refreshToken).toBe("test-refresh");
    // ISO-string vid Wix-boundary, inte Date-objekt.
    expect(body.dataItem.data.expiresAt).toBe("2026-06-01T12:00:00.000Z");
    expect(typeof body.dataItem.data.updatedAt).toBe("string");
  });

  it("respekterar WIX_DATA_COL_TOKENS env-override", async () => {
    vi.stubEnv("WIX_DATA_COL_TOKENS", "CustomTokensCollection");
    const fetchMock = mockFetch({ json: { dataItem: { data: {} } } });

    // OBS: WixDataStore läser COL-värdet vid modul-load. Vi måste re-importera
    // modulen efter stubEnv för att overriden ska gälla.
    vi.resetModules();
    const { WixDataStore: FreshStore } = await import("./wix-data");
    const s = new FreshStore();

    await s.saveAliExpressTokens({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.dataCollectionId).toBe("CustomTokensCollection");
  });
});
