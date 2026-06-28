import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAccessToken, createOrder, OrderValidationError } from "./client";
import { MemoryStore } from "../store/memory";

// createOrder-backstoppen (FA/F50/FD): valideringsguarderna kastar OrderValidationError
// FÖRE något API-anrop, så de kan testas utan nätverk/token. Säkerhetskritiskt: detta
// är sista grinden innan en riktig betald AliExpress-order.
describe("createOrder — valideringsguards (backstop)", () => {
  const addr = { name: "A B", addressLine1: "Gata 1", city: "Sthlm", postalCode: "11122", countryCode: "SE" };
  const valid = { productId: "P", skuId: "S", quantity: 1, shippingAddress: addr };

  it("kastar OrderValidationError vid ogiltig landskod", async () => {
    await expect(createOrder({ ...valid, shippingAddress: { ...addr, countryCode: "SWE" } })).rejects.toBeInstanceOf(OrderValidationError);
  });
  it("kastar för delstatskrävande land (US) utan province", async () => {
    await expect(createOrder({ ...valid, shippingAddress: { ...addr, countryCode: "US" } })).rejects.toBeInstanceOf(OrderValidationError);
  });
  it("kastar vid whitespace-only gatuadress", async () => {
    await expect(createOrder({ ...valid, shippingAddress: { ...addr, addressLine1: "   " } })).rejects.toBeInstanceOf(OrderValidationError);
  });
  it("kastar vid saknad ort eller postnummer", async () => {
    await expect(createOrder({ ...valid, shippingAddress: { ...addr, city: "" } })).rejects.toBeInstanceOf(OrderValidationError);
    await expect(createOrder({ ...valid, shippingAddress: { ...addr, postalCode: "" } })).rejects.toBeInstanceOf(OrderValidationError);
  });
  it("kastar vid ogiltig kvantitet (0/negativ)", async () => {
    await expect(createOrder({ ...valid, quantity: 0 })).rejects.toBeInstanceOf(OrderValidationError);
    await expect(createOrder({ ...valid, quantity: -1 })).rejects.toBeInstanceOf(OrderValidationError);
  });
});

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
