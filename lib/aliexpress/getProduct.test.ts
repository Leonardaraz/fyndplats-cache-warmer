import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    const p = await getProduct("1005004282015600");

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
    const p = await getProduct("42");
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
    await expect(getProduct("1")).rejects.toThrow(/saknar result-fält/);
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
    await expect(getProduct("1")).rejects.toThrow(/AliExpress API-fel 1001/);
  });
});
