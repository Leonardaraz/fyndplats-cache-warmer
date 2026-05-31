import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCreateProductBody, createProduct, type WixProductInput } from "./client";

const base: WixProductInput = {
  name: "Test",
  variants: [
    { sku: "s1", actualPrice: "199.00", choices: { Färg: "Röd", Storlek: "M" }, visible: true },
    { sku: "s2", actualPrice: "199.00", choices: { Färg: "Blå", Storlek: "M" }, visible: false },
  ],
};

function getOptions(body: Record<string, unknown>) {
  return (body.product as { options?: any[] }).options ?? [];
}
function getVariants(body: Record<string, unknown>) {
  return (body.product as { variantsInfo: { variants: any[] } }).variantsInfo.variants;
}

describe("buildCreateProductBody — swatches", () => {
  it("renders a colour option as SWATCH_CHOICES with ONE_COLOR + colorCode", () => {
    const body = buildCreateProductBody({
      ...base,
      options: [
        { name: "Färg", choices: [{ name: "Röd", colorCode: "#CC2222" }, { name: "Blå", colorCode: "#2233CC" }] },
        { name: "Storlek", choices: [{ name: "M" }] },
      ],
    });
    const opts = getOptions(body);
    const color = opts.find((o) => o.name === "Färg");
    const size = opts.find((o) => o.name === "Storlek");

    expect(color.optionRenderType).toBe("SWATCH_CHOICES");
    expect(color.choicesSettings.choices[0]).toEqual({ choiceType: "ONE_COLOR", name: "Röd", colorCode: "#CC2222" });
    expect(size.optionRenderType).toBe("TEXT_CHOICES");
    expect(size.choicesSettings.choices[0]).toEqual({ choiceType: "CHOICE_TEXT", name: "M" });
  });

  it("falls back to text when any colour choice lacks a code", () => {
    const body = buildCreateProductBody({
      ...base,
      options: [{ name: "Färg", choices: [{ name: "Röd", colorCode: "#CC2222" }, { name: "Blå" }] }],
    });
    expect(getOptions(body)[0].optionRenderType).toBe("TEXT_CHOICES");
  });

  it("stamps the option renderType onto each variant choice", () => {
    const body = buildCreateProductBody({
      ...base,
      options: [
        { name: "Färg", choices: [{ name: "Röd", colorCode: "#CC2222" }, { name: "Blå", colorCode: "#2233CC" }] },
        { name: "Storlek", choices: [{ name: "M" }] },
      ],
    });
    const v0 = getVariants(body)[0];
    const colorChoice = v0.choices.find((c: any) => c.optionChoiceNames.optionName === "Färg");
    expect(colorChoice.optionChoiceNames.renderType).toBe("SWATCH_CHOICES");
  });

  it("keeps the visible flag (hidden variants still created)", () => {
    const body = buildCreateProductBody(base);
    const variants = getVariants(body);
    expect(variants[0].visible).toBe(true);
    expect(variants[1].visible).toBe(false);
  });
});

describe("createProduct — DUPLICATE_SLUG_ERROR retry", () => {
  const ORIGINAL_FETCH = global.fetch;
  const ORIGINAL_WARN = console.warn;

  function duplicateSlugResponse(): Response {
    return {
      ok: false,
      status: 409,
      json: async () => ({
        message: "Duplicate product slugs. Each product must have a unique slug",
        details: { applicationError: { code: "DUPLICATE_SLUG_ERROR", description: "Duplicate" } },
      }),
      text: async () =>
        JSON.stringify({
          message: "Duplicate product slugs. Each product must have a unique slug",
          details: {
            applicationError: { code: "DUPLICATE_SLUG_ERROR", description: "Duplicate" },
          },
        }),
    } as unknown as Response;
  }

  function successResponse(body: Record<string, unknown>): Response {
    return {
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as unknown as Response;
  }

  const input: WixProductInput = {
    name: "Testprodukt",
    slug: "testprodukt-rod",
    variants: [{ sku: "AE-1-1", actualPrice: "199.00", choices: { Färg: "Röd" }, visible: true }],
  };

  beforeEach(() => {
    vi.stubEnv("WIX_API_TOKEN", "test-token");
    vi.stubEnv("WIX_SITE_ID", "test-site");
    vi.stubEnv("DRY_RUN", "");
    console.warn = vi.fn();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    console.warn = ORIGINAL_WARN;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("retries with -2 suffix when original slug is taken", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(duplicateSlugResponse())
      .mockResolvedValueOnce(
        successResponse({
          product: {
            id: "prod-123",
            slug: "testprodukt-rod-2",
            revision: "1",
            variantsInfo: { variants: [{ id: "var-a", sku: "AE-1-1" }] },
          },
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await createProduct(input);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.id).toBe("prod-123");
    expect(result.slug).toBe("testprodukt-rod-2");
    expect(result.slugSuffix).toBe("-2");

    // Second call's body should contain the suffixed slug
    const secondCall = fetchMock.mock.calls[1];
    const sentBody = JSON.parse(secondCall[1].body) as { product: { slug: string; name: string } };
    expect(sentBody.product.slug).toBe("testprodukt-rod-2");
    expect(sentBody.product.name).toBe("Testprodukt"); // namnet är oförändrat

    expect(console.warn).toHaveBeenCalled();
  });

  it("climbs from -2 up to -10 before falling back to random suffix", async () => {
    const fetchMock = vi.fn();
    // 1 original + 9 numeric retries (-2..-10) all collide
    for (let i = 0; i < 10; i++) fetchMock.mockResolvedValueOnce(duplicateSlugResponse());
    // Random suffix retry succeeds
    fetchMock.mockResolvedValueOnce(
      successResponse({
        product: {
          id: "prod-rand",
          slug: "testprodukt-rod-xxxx",
          revision: "1",
          variantsInfo: { variants: [{ id: "var-a", sku: "AE-1-1" }] },
        },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await createProduct(input);

    expect(fetchMock).toHaveBeenCalledTimes(11);
    expect(result.slugSuffix).toMatch(/^-[0-9a-z]{4}$/);
    expect(result.id).toBe("prod-rand");

    // Verify the suffix progression: -2, -3, ..., -10 in calls 2..10
    for (let i = 1; i <= 9; i++) {
      const body = JSON.parse(fetchMock.mock.calls[i][1].body) as { product: { slug: string } };
      expect(body.product.slug).toBe(`testprodukt-rod-${i + 1}`);
    }
  });

  it("does not retry when a non-409 error happens", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: "boom" }),
      text: async () => JSON.stringify({ message: "boom" }),
    } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(createProduct(input)).rejects.toThrow(/500/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry when 409 is not DUPLICATE_SLUG_ERROR", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        message: "Conflict",
        details: { applicationError: { code: "SOME_OTHER_CODE" } },
      }),
      text: async () =>
        JSON.stringify({
          message: "Conflict",
          details: { applicationError: { code: "SOME_OTHER_CODE" } },
        }),
    } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(createProduct(input)).rejects.toThrow(/409/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("succeeds on first call with no suffix when slug is unique", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      successResponse({
        product: {
          id: "prod-clean",
          slug: "testprodukt-rod",
          revision: "1",
          variantsInfo: { variants: [{ id: "var-a", sku: "AE-1-1" }] },
        },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await createProduct(input);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.slugSuffix).toBeUndefined();
    expect(result.slug).toBe("testprodukt-rod");
  });
});
