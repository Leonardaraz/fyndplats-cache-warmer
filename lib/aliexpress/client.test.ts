import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAccessToken, createOrder, OrderValidationError, buildPlaceOrderDto, toAsciiLatin, sanitizeZip } from "./client";
import { MemoryStore } from "../store/memory";

describe("sanitizeZip — AliExpress postnummer: bara siffror/-//", () => {
  it("tar bort mellanslag i svenska postnummer", () => {
    expect(sanitizeZip("184 36")).toBe("18436");
    expect(sanitizeZip("11122")).toBe("11122");
    expect(sanitizeZip("SE-184 36")).toBe("-18436");
  });
});

describe("toAsciiLatin — AliExpress kräver engelska/ASCII", () => {
  it("translittererar svenska tecken (å/ä/ö) till ASCII", () => {
    expect(toAsciiLatin("Norrgårdsvägen 49")).toBe("Norrgardsvagen 49");
    expect(toAsciiLatin("Åkersberga")).toBe("Akersberga");
    expect(toAsciiLatin("Ann-Sofie Sjöström")).toBe("Ann-Sofie Sjostrom");
  });
  it("hanterar nordiska/europeiska diakriter + slänger kvarvarande icke-ASCII", () => {
    expect(toAsciiLatin("Malmö Øst æ ü é ñ ç")).toBe("Malmo Ost ae u e n c");
    expect(toAsciiLatin("北京 Beijing")).toBe("Beijing");
    expect(toAsciiLatin("ren ascii 123")).toBe("ren ascii 123");
  });
});

// Låser DTO-formen för aliexpress.ds.order.create. Fel form → AliExpress svarade
// "MissingParameter: param_place_order_request4_open_api_dto" och ordern lades ALDRIG.
describe("buildPlaceOrderDto — aliexpress.ds.order.create request-shape", () => {
  it("bygger logistics_address + product_items med rätt fältnamn", () => {
    const dto = buildPlaceOrderDto({
      productId: "1005012371572537",
      quantity: 1,
      skuId: "14:193;200007763:201336104",
      logisticsServiceName: "CAINIAO_ECONOMY_GLOBAL",
      address: "Norrgårdsvägen 49",
      city: "Åkersberga",
      province: "Stockholm",
      country: "SE",
      zip: "184 36",
      contactPerson: "Ann-Sofie Sjöström",
      phone: "0704806968",
    });
    // Fritextfälten translittereras till ASCII (AliExpress: "Please use English only").
    expect(dto.logistics_address).toMatchObject({
      address: "Norrgardsvagen 49",
      city: "Akersberga",
      province: "Stockholm",
      country: "SE",
      zip: "18436",
      contact_person: "Ann-Sofie Sjostrom",
      full_name: "Ann-Sofie Sjostrom",
      mobile_no: "0704806968",
    });
    expect(dto.product_items).toHaveLength(1);
    expect(dto.product_items[0]).toMatchObject({
      product_id: "1005012371572537",
      product_count: 1,
      sku_attr: "14:193;200007763:201336104",
      logistics_service_name: "CAINIAO_ECONOMY_GLOBAL",
    });
    // Måste vara JSON-serialiserbart (skickas som en enda string-param).
    expect(() => JSON.stringify(dto)).not.toThrow();
  });

  it("utelämnar mobile_no när telefon saknas", () => {
    const dto = buildPlaceOrderDto({
      productId: "P", quantity: 2, skuId: "S", logisticsServiceName: "X",
      address: "A", city: "C", province: "Stockholm", country: "SE", zip: "1", contactPerson: "N", phone: "",
    });
    expect(dto.logistics_address).not.toHaveProperty("mobile_no");
    expect(dto.logistics_address.province).toBe("Stockholm");
    expect(dto.product_items[0].product_count).toBe(2);
  });
});

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

// Affärsstatus-grinden: ett order-id ensamt räcker INTE — is_success:false → tomt
// tradeOrderId → place-order flaggar osäkert i stället för falsk "lagd".
describe("createOrder — affärsstatus (is_success) före order-id", () => {
  const addr = { name: "A B", addressLine1: "Gata 1", city: "Sthlm", postalCode: "11122", countryCode: "SE" };
  const params = { productId: "1005012371572537", skuId: "14:193;200007763:201336104", quantity: 1, shippingAddress: addr };
  const stubEnv = () => {
    vi.stubEnv("STORE_BACKEND", "memory");
    vi.stubEnv("ALIEXPRESS_APP_KEY", "k");
    vi.stubEnv("ALIEXPRESS_APP_SECRET", "s");
    vi.stubEnv("ALIEXPRESS_ACCESS_TOKEN", "t");
  };
  const mockAeResponse = (result: Record<string, unknown>) =>
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ aliexpress_ds_order_create_response: { result } }),
    })));

  beforeEach(() => { vi.resetModules(); vi.unstubAllEnvs(); });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it("is_success:false med ekat order_id → tomt tradeOrderId (ingen falsk lagd)", async () => {
    stubEnv();
    mockAeResponse({ is_success: false, error_code: "B_BLACKLIST", order_id: "ECHOED123" });
    const { createOrder: freshCreate } = await import("./client");
    const res = await freshCreate(params);
    expect(res.tradeOrderId).toBe("");
  });

  it("äkta framgång → returnerar order_id", async () => {
    stubEnv();
    mockAeResponse({ is_success: true, order_id: 8000123 });
    const { createOrder: freshCreate } = await import("./client");
    const res = await freshCreate(params);
    expect(res.tradeOrderId).toBe("8000123");
  });

  it("order_list.number[] batch-shape → returnerar första order_id", async () => {
    stubEnv();
    mockAeResponse({ is_success: true, order_list: { number: ["8000999"] } });
    const { createOrder: freshCreate } = await import("./client");
    const res = await freshCreate(params);
    expect(res.tradeOrderId).toBe("8000999");
  });
});
