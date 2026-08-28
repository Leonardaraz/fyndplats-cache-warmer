import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aliExpressIdFromListing } from "./product-id";

// Tester för getProduct() — fokuserar på respons-parsing. AliExpress DS-API:n
// returnerar payload under `aliexpress_ds_product_get_response.result`, med
// SKU-listan antingen som platt array (simplify=true) eller inslagen i
// { ae_item_sku_info_d_t_o: [...] } (icke-förenklat). Parsern ska klara båda.

describe("getProduct — response parser", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("STORE_BACKEND", "memory");
    vi.stubEnv("ALIEXPRESS_APP_KEY", "test-app-key");
    vi.stubEnv("ALIEXPRESS_APP_SECRET", "test-secret");
    vi.stubEnv("ALIEXPRESS_ACCESS_TOKEN", "test-access-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("parsar non-simplified DS-svar (wrapper-keys ae_item_sku_info_d_t_o + ae_sku_property_d_t_o)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        aliexpress_ds_product_get_response: {
          rsp_code: 200,
          rsp_msg: "Call succeeds",
          result: {
            ae_item_base_info_dto: {
              product_id: 1005004282015600,
              subject: "Sample product title",
              detail: "<p>full HTML description</p>",
            },
            ae_multimedia_info_dto: { image_urls: "https://img/a.jpg,https://img/b.jpg" },
            ae_item_sku_info_dtos: {
              ae_item_sku_info_d_t_o: [
                {
                  id: "sku-1",
                  sku_stock: true,
                  sku_available_stock: 50,
                  offer_sale_price: "9.99",
                  sku_price: "12.99",
                  ae_sku_property_dtos: {
                    ae_sku_property_d_t_o: [
                      { sku_property_name: "Color", property_value_definition_name: "Red", sku_image: "https://img/red.jpg" },
                    ],
                  },
                },
              ],
            },
          },
        },
      }),
    }));

    const { getProduct } = await import("./client");
    const p = await getProduct(aliExpressIdFromListing("1005004282015600"));

    expect(p.productId).toBe("1005004282015600");
    expect(p.title).toBe("Sample product title");
    expect(p.description).toContain("full HTML description");
    expect(p.images).toEqual(["https://img/a.jpg", "https://img/b.jpg"]);
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0].skuId).toBe("sku-1");
    expect(p.variants[0].price).toBe(9.99);
    expect(p.variants[0].stock).toBe(50);
    expect(p.variants[0].skuProps).toEqual({ Color: "Red" });
    expect(p.variants[0].imageUrl).toBe("https://img/red.jpg");
  });

  it("parsar ae_store_info → storeId/storeName (supplier-watchens säljarfilter)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        aliexpress_ds_product_get_response: {
          result: {
            ae_item_base_info_dto: { product_id: 1005008079900702, subject: "Cat tree", detail: "x" },
            ae_store_info: { store_id: 1104096404, store_name: "Aosom ES (EU) Store" },
            ae_item_sku_info_dtos: [
              { id: "s1", sku_available_stock: 3, offer_sale_price: "40.00", ship_from_code: "ES" },
            ],
          },
        },
      }),
    }));
    const { getProduct } = await import("./client");
    const p = await getProduct(aliExpressIdFromListing("1005008079900702"));
    // store_id kommer som number från AE → normaliseras till string (matchar mappnings supplierId).
    expect(p.storeId).toBe("1104096404");
    expect(p.storeName).toBe("Aosom ES (EU) Store");
  });

  it("saknad ae_store_info → storeId undefined (fälls som wrong_seller nedströms)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        aliexpress_ds_product_get_response: {
          result: {
            ae_item_base_info_dto: { product_id: 42, subject: "No store", detail: "x" },
            ae_item_sku_info_dtos: [{ id: "s", sku_available_stock: 1, offer_sale_price: "5" }],
          },
        },
      }),
    }));
    const { getProduct } = await import("./client");
    const p = await getProduct(aliExpressIdFromListing("42"));
    expect(p.storeId).toBeUndefined();
  });

  it("parsar simplified DS-svar (platt array under ae_item_sku_info_dtos)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        aliexpress_ds_product_get_response: {
          rsp_code: 200,
          result: {
            ae_item_base_info_dto: { product_id: 42, subject: "Other", detail: "x" },
            ae_multimedia_info_dto: { image_urls: "" },
            ae_item_sku_info_dtos: [
              {
                id: "sku-x",
                sku_available_stock: 7,
                offer_sale_price: "1.50",
                aeop_s_k_u_propertys: [
                  { sku_property_name: "Size", property_value_definition_name: "L" },
                ],
              },
            ],
          },
        },
      }),
    }));

    const { getProduct } = await import("./client");
    const p = await getProduct(aliExpressIdFromListing("42"));
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0].skuId).toBe("sku-x");
    expect(p.variants[0].stock).toBe(7);
    expect(p.variants[0].skuProps).toEqual({ Size: "L" });
  });

  it("kastar tydligt fel när result-fältet saknas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ aliexpress_ds_product_get_response: { rsp_code: 200 } }),
    }));

    const { getProduct } = await import("./client");
    await expect(getProduct(aliExpressIdFromListing("1"))).rejects.toThrow(/saknar result-fält/);
  });

  it("propagar AliExpress error-koder (rsp_code != 200)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        aliexpress_ds_product_get_response: {
          rsp_code: 1001,
          rsp_msg: "product not found",
        },
      }),
    }));

    const { getProduct } = await import("./client");
    await expect(getProduct(aliExpressIdFromListing("1"))).rejects.toThrow(/AliExpress API-fel 1001/);
  });
});

// Babygungan 2026-08-17: Aosom/Outsunny-listningarna bär färgnamnet i
// `sku_property_value` och lämnar de två fält vi läste tomma. Följden blev
// tomma färgnamn → importen kunde inte para våra varianter mot rätt SKU, och
// grön i butiken pekade på AliExpress orange (fel färg i kundens paket).
describe("getProduct — sku_property_value", () => {
  it("läser färgnamnet när DS bara skickar sku_property_value", async () => {
    vi.stubEnv("ALIEXPRESS_APP_KEY", "k");
    vi.stubEnv("ALIEXPRESS_APP_SECRET", "s");
    vi.stubEnv("ALIEXPRESS_ACCESS_TOKEN", "t");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        aliexpress_ds_product_get_response: {
          rsp_code: 200,
          result: {
            ae_item_base_info_dto: { product_id: 1005007907990730, subject: "Swing" },
            ae_multimedia_info_dto: { image_urls: "https://img/a.jpg" },
            ae_item_sku_info_dtos: {
              ae_item_sku_info_d_t_o: [
                {
                  sku_id: "12000056381686078",
                  sku_attr: "14:350852;200007763:201336104",
                  sku_available_stock: 63,
                  offer_sale_price: "82.83",
                  ae_sku_property_dtos: {
                    ae_sku_property_d_t_o: [
                      { sku_property_name: "Color", sku_property_value: "Orange", property_value_id: 350852 },
                      { sku_property_name: "Ships From", sku_property_value: "spain", property_value_id: 201336104 },
                    ],
                  },
                },
                {
                  sku_id: "12000042950047843",
                  sku_attr: "14:-1;200007763:201336104",
                  sku_available_stock: 0,
                  offer_sale_price: "76.15",
                  ae_sku_property_dtos: {
                    ae_sku_property_d_t_o: [
                      { sku_property_name: "Color", sku_property_value: "Green", property_value_id: -1 },
                      { sku_property_name: "Ships From", sku_property_value: "spain", property_value_id: 201336104 },
                    ],
                  },
                },
              ],
            },
          },
        },
      }),
    }));

    const { getProduct } = await import("./client");
    const p = await getProduct(aliExpressIdFromListing("1005007907990730"));
    expect(p.variants.map((v) => v.skuProps.Color)).toEqual(["Orange", "Green"]);
    // Och lagret hänger ihop med rätt färg — det var precis det som var korsat.
    expect(p.variants.find((v) => v.skuProps.Color === "Orange")?.stock).toBe(63);
    expect(p.variants.find((v) => v.skuProps.Color === "Green")?.stock).toBe(0);
  });
});

// ── Hyllstatus: nedtagen listning som ändå svarar 200 ────────────────────────
//
// Leonards rapport 2026-08-24 (Homcom-borden): konsumentsidan sa "Sorry, this
// item is no longer available!" medan vår butik visade lagersaldo. DS-API:t
// felade aldrig — det svarade 200 med full kropp och SKU-rader vars saldo stod
// kvar fruset. Statusen låg i basinfon; ingen läste den.

describe("classifyListingAvailability", () => {
  it("onSelling → on_selling", async () => {
    const { classifyListingAvailability } = await import("./client");
    expect(classifyListingAvailability({ product_status_type: "onSelling" }))
      .toEqual({ availability: "on_selling" });
  });

  it("annat statusvärde → offline, med AE:s egen orsakstext", async () => {
    const { classifyListingAvailability } = await import("./client");
    expect(classifyListingAvailability({
      product_status_type: "offline",
      ws_display: "expire_offline",
    })).toEqual({ availability: "offline", reason: "offline / expire_offline" });
  });

  it("saknad status men satt ws_offline_date → offline", async () => {
    const { classifyListingAvailability } = await import("./client");
    const out = classifyListingAvailability({ ws_offline_date: 1755993600000 });
    expect(out.availability).toBe("offline");
  });

  it("ws_offline_date 0 (AE:s 'ligger uppe') → unknown, inte offline", async () => {
    const { classifyListingAvailability } = await import("./client");
    expect(classifyListingAvailability({ ws_offline_date: 0 }))
      .toEqual({ availability: "unknown" });
    expect(classifyListingAvailability({ ws_offline_date: "0" }))
      .toEqual({ availability: "unknown" });
  });

  it("HELT tom basinfo → unknown (tomt fält är ingen bevisning; domen nollar lager)", async () => {
    const { classifyListingAvailability } = await import("./client");
    expect(classifyListingAvailability({})).toEqual({ availability: "unknown" });
    expect(classifyListingAvailability(undefined)).toEqual({ availability: "unknown" });
  });

  it("onSelling VINNER över ett gammalt ws_offline_date — en återupplagd vara får inte nollas", async () => {
    const { classifyListingAvailability } = await import("./client");
    expect(classifyListingAvailability({
      product_status_type: "onSelling",
      ws_offline_date: 1700000000000,
    })).toEqual({ availability: "on_selling" });
  });

  it("stavningsvarianter av onSelling läses som LEVANDE (får inte nolla lager)", async () => {
    const { classifyListingAvailability } = await import("./client");
    for (const v of ["onSelling", "ON_SELLING", "on-selling", " onselling "]) {
      expect(classifyListingAvailability({ product_status_type: v }).availability)
        .toBe("on_selling");
    }
  });

  it("'0000-00-00' som ws_offline_date är inget datum → unknown", async () => {
    const { classifyListingAvailability } = await import("./client");
    expect(classifyListingAvailability({ ws_offline_date: "0000-00-00" }))
      .toEqual({ availability: "unknown" });
  });
});

describe("getProduct — hyllstatus från DS-svaret", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("STORE_BACKEND", "memory");
    vi.stubEnv("ALIEXPRESS_APP_KEY", "test-app-key");
    vi.stubEnv("ALIEXPRESS_APP_SECRET", "test-secret");
    vi.stubEnv("ALIEXPRESS_ACCESS_TOKEN", "test-access-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const svar = (base: Record<string, unknown>) => ({
    ok: true,
    json: () => Promise.resolve({
      aliexpress_ds_product_get_response: {
        result: {
          ae_item_base_info_dto: { product_id: 42, subject: "Nesting tables", ...base },
          ae_item_sku_info_dtos: [
            // Saldot står kvar fruset — precis det som fick synken att spegla
            // lager för en död listning.
            { sku_id: "s1", sku_available_stock: 12, offer_sale_price: "80.00" },
          ],
        },
      },
    }),
  });

  it("nedtagen listning flaggas offline TROTS att svaret är 200 med lager kvar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      svar({ product_status_type: "offline", ws_display: "expire_offline" }),
    ));
    const { getProduct } = await import("./client");
    const p = await getProduct(aliExpressIdFromListing("42"));
    expect(p.listingAvailability).toBe("offline");
    expect(p.offlineReason).toContain("expire_offline");
    // Lagret finns kvar i svaret — det är just därför statusfältet behövs.
    expect(p.variants[0].stock).toBe(12);
  });

  it("levande listning → on_selling, inget offlineReason", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(svar({ product_status_type: "onSelling" })));
    const { getProduct } = await import("./client");
    const p = await getProduct(aliExpressIdFromListing("42"));
    expect(p.listingAvailability).toBe("on_selling");
    expect(p.offlineReason).toBeUndefined();
  });

  it("svar utan statusfält → unknown (oförändrat beteende för äldre svar)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(svar({})));
    const { getProduct } = await import("./client");
    const p = await getProduct(aliExpressIdFromListing("42"));
    expect(p.listingAvailability).toBe("unknown");
  });
});
