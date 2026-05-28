import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAccessToken } from "./client";
import { MemoryStore } from "../store/memory";

// resolveAccessToken-precedens: store-hit > env-fallback > throw.
// Notera: factory.ts singleton-cachar Store-instansen. För att få färska
// MemoryStore-instanser per test resetar vi modulen mellan testfall.

describe("resolveAccessToken — precedens", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returnerar persisterad access_token från store (ignorerar env)", async () => {
    vi.stubEnv("ALIEXPRESS_ACCESS_TOKEN", "env-token-should-be-ignored");
    vi.stubEnv("STORE_BACKEND", "memory");

    const { getStore } = await import("../store/factory");
    const { resolveAccessToken: freshResolve } = await import("./client");

    const store = getStore() as MemoryStore;
    await store.saveAliExpressTokens({
      accessToken: "store-token",
      refreshToken: "store-refresh",
      expiresAt: new Date("2026-06-01T00:00:00Z"),
    });

    expect(await freshResolve()).toBe("store-token");
  });

  it("faller tillbaka till env-var när store är tom", async () => {
    vi.stubEnv("ALIEXPRESS_ACCESS_TOKEN", "env-fallback-token");
    vi.stubEnv("STORE_BACKEND", "memory");

    const { resolveAccessToken: freshResolve } = await import("./client");
    expect(await freshResolve()).toBe("env-fallback-token");
  });

  it("kastar tydligt fel när varken store eller env har tokens", async () => {
    vi.stubEnv("STORE_BACKEND", "memory");
    // Använd unstubAllEnvs + manuell delete för att säkra att env är tom.
    delete process.env.ALIEXPRESS_ACCESS_TOKEN;

    const { resolveAccessToken: freshResolve } = await import("./client");
    await expect(freshResolve()).rejects.toThrow(/access_token saknas/);
  });
});
