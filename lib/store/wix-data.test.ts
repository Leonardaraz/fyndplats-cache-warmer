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

  it("returnerar null OCH varnar när dataItem saknar något kritiskt fält", async () => {
    mockFetch({
      json: { dataItem: { data: { accessToken: "x", expiresAt: "2026-01-01T00:00:00Z" } } },
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = new WixDataStore();
    expect(await s.getAliExpressTokens()).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/partiell token-data/));
  });

  it("returnerar null OCH varnar när expiresAt är ogiltig", async () => {
    mockFetch({
      json: {
        dataItem: {
          data: { accessToken: "x", refreshToken: "y", expiresAt: "not-a-date" },
        },
      },
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = new WixDataStore();
    expect(await s.getAliExpressTokens()).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/ogiltig expiresAt/));
  });

  it("saveAliExpressTokens kastar om expiresAt är Invalid Date", async () => {
    mockFetch({ json: {} });
    const s = new WixDataStore();
    await expect(s.saveAliExpressTokens({
      accessToken: "x",
      refreshToken: "y",
      expiresAt: new Date("garbage"),
    })).rejects.toThrow(/ogiltig expiresAt/);
  });

  it("redactar response-body i error-meddelandet för token-collection", async () => {
    mockFetch({ status: 500, json: { details: "should-not-leak-token-payload-secret" } });
    const s = new WixDataStore();
    await expect(s.saveAliExpressTokens({
      accessToken: "real-token",
      refreshToken: "real-refresh",
      expiresAt: new Date("2026-06-01T00:00:00Z"),
    })).rejects.toThrow(/\[redacted\]/);
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

describe("WixDataStore — paginering (listMappings/listTasks)", () => {
  beforeEach(() => {
    vi.stubEnv("WIX_API_TOKEN", "test-wix-token");
    vi.stubEnv("WIX_SITE_ID", "test-site-id");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  // Mocka /query sida-för-sida: varje element = en sidas data-rader.
  function mockQueryPages(pages: Record<string, unknown>[][]) {
    const fn = vi.fn();
    for (const page of pages) {
      fn.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ dataItems: page.map((data) => ({ data })) }),
        text: async () => "",
      } as Response);
    }
    global.fetch = fn as unknown as typeof fetch;
    return fn;
  }

  it("listMappings paginerar förbi 100-taket (100 + 30 = 130)", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ _id: `m${i}`, wixProductId: `m${i}` }));
    const page2 = Array.from({ length: 30 }, (_, i) => ({ _id: `m${100 + i}`, wixProductId: `m${100 + i}` }));
    const fetchMock = mockQueryPages([page1, page2]);

    const all = await new WixDataStore().listMappings();

    expect(all).toHaveLength(130);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // andra anropet ska be om offset 100 (= fixen som förr saknades)
    const body2 = JSON.parse((fetchMock.mock.calls[1] as [string, RequestInit])[1].body as string);
    expect(body2.query.paging.offset).toBe(100);
    expect(body2.query.paging.limit).toBe(100);
  });

  it("listMappings gör bara ETT anrop när första sidan är ofullständig (<100)", async () => {
    const page1 = Array.from({ length: 12 }, (_, i) => ({ _id: `m${i}`, wixProductId: `m${i}` }));
    const fetchMock = mockQueryPages([page1]);

    const all = await new WixDataStore().listMappings();

    expect(all).toHaveLength(12);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // page-0-anropet utelämnar offset → exakt samma body som tidigare beteende
    const body0 = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body0.query.paging).toEqual({ limit: 100 });
  });

  it("listMappings tolererar 404 (saknad/tom collection) → []", async () => {
    const fn = vi.fn().mockResolvedValue({
      ok: false, status: 404, json: async () => ({}), text: async () => "{}",
    } as Response);
    global.fetch = fn as unknown as typeof fetch;

    expect(await new WixDataStore().listMappings()).toEqual([]);
  });

  it("listTasks dedupar på _id om sidor överlappar vid samtidig skrivning", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ _id: `t${i}`, taskId: `t${i}` }));
    // sida 2 inleds med en dubblett (t99) + 59 nya = 60 rader (<100 → stopp)
    const page2 = [
      { _id: "t99", taskId: "t99" },
      ...Array.from({ length: 59 }, (_, i) => ({ _id: `t${100 + i}`, taskId: `t${100 + i}` })),
    ];
    const fetchMock = mockQueryPages([page1, page2]);

    const all = await new WixDataStore().listTasks();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(all).toHaveLength(159); // 100 + 59 unika; dubbletten t99 borttagen
    expect(new Set(all.map((t) => (t as { taskId: string }).taskId)).size).toBe(159);
  });
});

// Låser PATCH-wire-formatet för det atomiska dubbel-order-låset. Bryts URL/body/
// condition tyst → CAS:en slutar matcha → varje claim "vinner" → dubbla betalda ordrar.
// Atomiciteten är empiriskt verifierad mot riktig Wix Data (3/3 + fält-löst + TOCTOU).
describe("WixDataStore — claimTask/releaseTask/updateTask (PATCH CAS wire-format)", () => {
  beforeEach(() => {
    vi.stubEnv("WIX_API_TOKEN", "test-wix-token");
    vi.stubEnv("WIX_SITE_ID", "test-site-id");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("claimTask → PATCH /data/v2/items/{id}, condition.filter $and + SET claimToken; 2xx→true", async () => {
    const fetchMock = mockFetch({ json: { dataItem: { data: {} } } });
    expect(await new WixDataStore().claimTask("o1:l1", "tok-123")).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(url).toContain("/data/v2/items/o1%3Al1");
    const body = JSON.parse(init.body as string);
    expect(body.patch.dataItemId).toBe("o1:l1");
    expect(body.patch.fieldModifications[0]).toMatchObject({
      action: "SET_FIELD", fieldPath: "claimToken", setFieldOptions: { value: "tok-123" },
    });
    expect(body.condition.filter.$and).toHaveLength(2); // ej beställd ∧ ej claimad
  });

  it("claimTask → 428 WDE0193 (förlorare) → false", async () => {
    mockFetch({ status: 428, json: { message: "WDE0193: Update condition not met." } });
    expect(await new WixDataStore().claimTask("x", "t")).toBe(false);
  });

  it("claimTask → 404 (task saknas) → false", async () => {
    mockFetch({ status: 404, json: {} });
    expect(await new WixDataStore().claimTask("x", "t")).toBe(false);
  });

  it("updateTask: värde → SET_FIELD, undefined → REMOVE_FIELD (override-clear)", async () => {
    const fetchMock = mockFetch({ json: { dataItem: { data: {} } } });
    await new WixDataStore().updateTask("o1:l1", { aliexpressOrderId: "T1", overriddenSupplierProductId: undefined });
    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.patch.fieldModifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "SET_FIELD", fieldPath: "aliexpressOrderId" }),
        expect.objectContaining({ action: "REMOVE_FIELD", fieldPath: "overriddenSupplierProductId" }),
      ]),
    );
  });

  it("releaseTask kastar ALDRIG (även 500) — fail-open", async () => {
    mockFetch({ status: 500, json: {} });
    await expect(new WixDataStore().releaseTask("x", "t")).resolves.toBeUndefined();
  });
});
