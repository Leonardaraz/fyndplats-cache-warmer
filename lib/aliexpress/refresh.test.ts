import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Testar refreshAndPersist genom MemoryStore + mocked fetch mot
// AliExpress /auth/token/refresh.

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

describe("refreshAndPersist", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("ALIEXPRESS_APP_KEY", "test-app-key");
    vi.stubEnv("ALIEXPRESS_APP_SECRET", "test-app-secret");
    vi.stubEnv("STORE_BACKEND", "memory");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("kastar tydligt fel när store är tom (initial OAuth behövs)", async () => {
    const { refreshAndPersist } = await import("./client");
    await expect(refreshAndPersist()).rejects.toThrow(/Initial OAuth/);
  });

  it("byter tokens och persisterar i store", async () => {
    const { refreshAndPersist } = await import("./client");
    const { getStore } = await import("../store/factory");
    const store = getStore();
    await store.saveAliExpressTokens({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min kvar
    });

    mockFetch({
      json: {
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 172800, // 48h
      },
    });

    const result = await refreshAndPersist();
    expect(result.accessToken).toBe("new-access");
    expect(result.refreshToken).toBe("new-refresh");
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now() + 1000 * 60 * 60 * 47);

    const persisted = await store.getAliExpressTokens();
    expect(persisted?.accessToken).toBe("new-access");
  });

  it("behåller gammal refresh_token om svaret inte innehåller en ny", async () => {
    const { refreshAndPersist } = await import("./client");
    const { getStore } = await import("../store/factory");
    const store = getStore();
    await store.saveAliExpressTokens({
      accessToken: "old-access",
      refreshToken: "persistent-refresh",
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    mockFetch({
      json: { access_token: "new-access", expires_in: 172800 }, // ingen refresh_token
    });

    const result = await refreshAndPersist();
    expect(result.refreshToken).toBe("persistent-refresh");
  });

  it("kastar om AliExpress returnerar tom access_token", async () => {
    const { refreshAndPersist } = await import("./client");
    const { getStore } = await import("../store/factory");
    const store = getStore();
    await store.saveAliExpressTokens({
      accessToken: "old",
      refreshToken: "old-refresh",
      expiresAt: new Date(Date.now() + 1000),
    });
    mockFetch({ json: { access_token: "", expires_in: 172800 } });
    await expect(refreshAndPersist()).rejects.toThrow(/ofullständigt svar/);
  });

  it("kastar om AliExpress returnerar ogiltig expires_in", async () => {
    const { refreshAndPersist } = await import("./client");
    const { getStore } = await import("../store/factory");
    const store = getStore();
    await store.saveAliExpressTokens({
      accessToken: "old",
      refreshToken: "old-refresh",
      expiresAt: new Date(Date.now() + 1000),
    });
    mockFetch({ json: { access_token: "new", expires_in: "not-a-number" } });
    await expect(refreshAndPersist()).rejects.toThrow(/ofullständigt svar/);
  });
});

describe("exchangeCode/refreshAccessToken — AliExpress response unwrapping", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("ALIEXPRESS_APP_KEY", "test-app-key");
    vi.stubEnv("ALIEXPRESS_APP_SECRET", "test-app-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("exchangeCode unpackar wrapped *_response-shape", async () => {
    mockFetch({
      json: {
        aliexpress_auth_token_create_response: {
          access_token: "wrapped-access",
          refresh_token: "wrapped-refresh",
          expires_in: 172800,
        },
      },
    });
    const { exchangeCode } = await import("./client");
    const result = await exchangeCode("test-code", "https://example.com/cb");
    expect(result.access_token).toBe("wrapped-access");
  });

  it("exchangeCode hanterar flat shape", async () => {
    mockFetch({
      json: { access_token: "flat-access", refresh_token: "flat-refresh", expires_in: 172800 },
    });
    const { exchangeCode } = await import("./client");
    const result = await exchangeCode("test-code", "https://example.com/cb");
    expect(result.access_token).toBe("flat-access");
  });

  it("exchangeCode kastar med AliExpress-felmeddelandet om response har error-kod", async () => {
    mockFetch({
      json: { code: "27", message: "code already used" },
    });
    const { exchangeCode } = await import("./client");
    await expect(exchangeCode("burnt-code", "https://example.com/cb"))
      .rejects.toThrow(/code already used/);
  });

  it("refreshAccessToken unpackar wrapped *_response-shape", async () => {
    mockFetch({
      json: {
        aliexpress_auth_token_refresh_response: {
          access_token: "refreshed-access",
          refresh_token: "refreshed-refresh",
          expires_in: 172800,
        },
      },
    });
    const { refreshAccessToken } = await import("./client");
    const result = await refreshAccessToken("old-refresh-token");
    expect(result.access_token).toBe("refreshed-access");
  });
});
