import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseSkuAttr, parseTrackingResponse, resolveAccessToken, createOrder, OrderValidationError, buildPlaceOrderDto, toAsciiLatin, sanitizeZip, phoneDialCode, normalizeMobile } from "./client";
import { MemoryStore } from "../store/memory";

describe("parseSkuAttr — sista datakällan för visningsnamn + lagerland", () => {
  it("VATOS-fallet 2026-08-09: värden och Ships From ur sku_attr", () => {
    const r = parseSkuAttr("14:29#Blue;200007763:201336103#Germany");
    expect(r.segments).toEqual([
      { propId: "14", display: "Blue" },
      { propId: "200007763", display: "Germany" },
    ]);
    expect(r.shipFromText).toBe("Germany");
  });
  it("segment utan #display och tom input hanteras", () => {
    const r = parseSkuAttr("14:29;200007763:201336100#China");
    expect(r.segments[0]).toEqual({ propId: "14", display: "" });
    expect(r.shipFromText).toBe("China");
    expect(parseSkuAttr("")).toEqual({ segments: [], shipFromText: "" });
    expect(parseSkuAttr(undefined)).toEqual({ segments: [], shipFromText: "" });
  });
  it("display med '#' i texten kapas inte fel (allt efter FÖRSTA #)", () => {
    const r = parseSkuAttr("14:29#Bla #2");
    expect(r.segments[0].display).toBe("Bla #2");
  });
});

describe("sanitizeZip — AliExpress postnummer: bara siffror/-//", () => {
  it("tar bort mellanslag i svenska postnummer", () => {
    expect(sanitizeZip("184 36")).toBe("18436");
    expect(sanitizeZip("11122")).toBe("11122");
    expect(sanitizeZip("SE-184 36")).toBe("-18436");
  });
});

describe("phoneDialCode / normalizeMobile — AliExpress phone_country ('enter a country code')", () => {
  it("mappar land → dial-kod med plus", () => {
    expect(phoneDialCode("SE")).toBe("+46");
    expect(phoneDialCode("se")).toBe("+46"); // case-insensitiv
    expect(phoneDialCode(" DE ")).toBe("+49"); // trimmas
    expect(phoneDialCode("NO")).toBe("+47");
    expect(phoneDialCode("GB")).toBe("+44");
  });
  it("returnerar undefined för omappat land (→ telefon utelämnas, inte fälld order)", () => {
    expect(phoneDialCode("ZZ")).toBeUndefined();
    expect(phoneDialCode("")).toBeUndefined();
  });
  it("tar bort landskod-nolla + icke-siffror ur numret", () => {
    expect(normalizeMobile("0704806968")).toBe("704806968");
    expect(normalizeMobile("070-480 69 68")).toBe("704806968");
    expect(normalizeMobile("736630990")).toBe("736630990");
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
      // Telefon: landskod-nolla bort + dial-kod separat (AliExpress "enter a country code").
      mobile_no: "704806968",
      phone_country: "+46",
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

  it("utelämnar mobile_no + phone_country när telefon saknas", () => {
    const dto = buildPlaceOrderDto({
      productId: "P", quantity: 2, skuId: "S", logisticsServiceName: "X",
      address: "A", city: "C", province: "Stockholm", country: "SE", zip: "1", contactPerson: "N", phone: "",
    });
    expect(dto.logistics_address).not.toHaveProperty("mobile_no");
    expect(dto.logistics_address).not.toHaveProperty("phone_country");
    expect(dto.logistics_address.province).toBe("Stockholm");
    expect(dto.product_items[0].product_count).toBe(2);
  });

  it("utelämnar telefonen för omappat land (ingen phone_country att skicka)", () => {
    const dto = buildPlaceOrderDto({
      productId: "P", quantity: 1, skuId: "S", logisticsServiceName: "X",
      address: "A", city: "C", province: "P", country: "ZZ", zip: "1", contactPerson: "N", phone: "0701234567",
    });
    expect(dto.logistics_address).not.toHaveProperty("mobile_no");
    expect(dto.logistics_address).not.toHaveProperty("phone_country");
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

describe("parseTrackingResponse — nya API-svarsformen (revision ~12 juli 2026)", () => {
  it("parsar mail_no/carrier_name/detail_node ur result.data-formen", () => {
    // Verifierat mot rå-svar från prod 13 juli (order 3074780350563058).
    const t = parseTrackingResponse("3074780350563058", {
      result: {
        data: {
          tracking_detail_line_list: {
            tracking_detail: [
              {
                mail_no: "07084026870677",
                carrier_name: "Seller Shipping ES Local",
                eta_time_stamps: 1784559795150,
                detail_node_list: {
                  detail_node: [
                    { time_stamp: 1783942091000, tracking_name: "Shipping update" },
                    { time_stamp: 1783663200000, tracking_detail_desc: "Package collected by carrier.", tracking_name: "Collected by carrier" },
                  ],
                },
              },
            ],
          },
        },
      },
    });
    expect(t.trackingNumber).toBe("07084026870677");
    expect(t.shippingProvider).toBe("Seller Shipping ES Local");
    expect(t.events).toHaveLength(2);
    expect(t.events[1].description).toBe("Package collected by carrier.");
    expect(t.events[0].time).toBe(new Date(1783942091000).toISOString());
  });

  it("faller tillbaka på gamla logistics_order_list-formen", () => {
    const t = parseTrackingResponse("x", {
      result: {
        logistics_order_list: [{ tracking_number: "ABC123", logistics_company: "PostNord" }],
        order_status: "SHIPPED",
      },
    });
    expect(t.trackingNumber).toBe("ABC123");
    expect(t.shippingProvider).toBe("PostNord");
  });
});

// --- Produktegenskaper → specs (audit 2026-08-18) ---------------------------
//
// `specifications` fylldes tidigare BARA av tillägget, ur sidans DOM. Serverns
// väg (CSV-/bulk-import via fetchAliExpressProductFromUrl) har ingen webbläsare
// och byggde produkten utan ett enda spec-fält — tom spec-flik på varje produkt
// som kom in den vägen. DS-svaret bär egenskaperna; vi läste dem aldrig.
import { parseItemProperties } from "./client";

describe("parseItemProperties — specar ur DS-svaret", () => {
  const RADER = [
    { attr_name: "Material", attr_value: "Oxford Cloth" },
    { attr_name: "Brand Name", attr_value: "SucceBuy" },
  ];

  it("läser båda formerna AliExpress levererar (simplify på och av)", () => {
    const väntat = { Material: "Oxford Cloth", "Brand Name": "SucceBuy" };
    expect(parseItemProperties(RADER)).toEqual(väntat);
    expect(parseItemProperties({ ae_item_property: RADER })).toEqual(väntat);
  });

  it("saknat fält ger tom karta — importen ska bete sig precis som förut", () => {
    for (const x of [undefined, null, {}, [], "", 0, { fel: "form" }]) {
      expect(parseItemProperties(x)).toEqual({});
    }
  });

  it("städar blanksteg och hoppar över halva rader", () => {
    expect(
      parseItemProperties([
        { attr_name: "  Material \n ", attr_value: " Oxford   Cloth " },
        { attr_name: "Utan värde", attr_value: "" },
        { attr_name: "", attr_value: "Utan namn" },
        {},
      ]),
    ).toEqual({ Material: "Oxford Cloth" });
  });

  it("första förekomsten vinner när AE upprepar ett attribut", () => {
    expect(
      parseItemProperties([
        { attr_name: "Färg", attr_value: "Blå" },
        { attr_name: "Färg", attr_value: "Röd" },
      ]),
    ).toEqual({ Färg: "Blå" });
  });

  it("samma rimlighetsgränser som DOM-skrapan — en spec-rad ser likadan ut oavsett väg", () => {
    expect(parseItemProperties([{ attr_name: "x".repeat(61), attr_value: "v" }])).toEqual({});
    expect(parseItemProperties([{ attr_name: "n", attr_value: "v".repeat(301) }])).toEqual({});
    // Label identisk med värdet = mis-parsad rad.
    expect(parseItemProperties([{ attr_name: "Oxford", attr_value: "oxford" }])).toEqual({});
  });
});
