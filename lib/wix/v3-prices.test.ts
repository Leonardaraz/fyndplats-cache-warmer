import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { updateV3VariantPrices } from "./v3-products";

const FORRA = process.env.WIX_API_TOKEN;

beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
});

afterEach(() => {
  if (FORRA === undefined) delete process.env.WIX_API_TOKEN;
  else process.env.WIX_API_TOKEN = FORRA;
  vi.unstubAllGlobals();
});

/** Fångar PATCH-kroppen så testet kan läsa exakt vad som skickades till Wix. */
function stubba(produkt: Record<string, unknown>) {
  const patchar: { body: Record<string, unknown> }[] = [];
  vi.stubGlobal("fetch", (async (_u: RequestInfo | URL, init?: RequestInit) => {
    if (!init || init.method !== "PATCH") {
      return new Response(JSON.stringify({ product: produkt }), { status: 200 });
    }
    patchar.push({ body: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify({ product: { revision: "2" } }), { status: 200 });
  }) as unknown as typeof fetch);
  return patchar;
}

const produkt = (visible: boolean | undefined) => ({
  id: "p1",
  revision: "1",
  ...(visible === undefined ? {} : { visible }),
  variantsInfo: { variants: [{ id: "v1", sku: "SKU-1", price: { actualPrice: { amount: "100" } } }] },
});

describe("updateV3VariantPrices — synligheten", () => {
  it("☠️ skickar tillbaka visible:false så ett UTKAST inte publiceras", async () => {
    // Uppmätt mot skarpa V3 2026-08-28: en variantsInfo-PATCH utan `visible` tog
    // ett osynligt Aosom-utkast från visible:false till visible:true. Fältmasken
    // skyddar INTE synligheten. Katalogen bär 2 700+ opolerade tyska utkast, så
    // en prisskrivning som publicerar dem är en riktig incident, inte en detalj.
    const patchar = stubba(produkt(false));
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);

    expect(patchar).toHaveLength(1);
    const body = patchar[0].body as { product: Record<string, unknown>; fieldMask: { paths: string[] } };
    expect(body.product.visible).toBe(false);
    expect(body.fieldMask.paths).toContain("visible");
  });

  it("håller en publicerad produkt publicerad", async () => {
    const patchar = stubba(produkt(true));
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);
    const body = patchar[0].body as { product: Record<string, unknown> };
    expect(body.product.visible).toBe(true);
  });

  it("saknas visible i svaret utelämnas fältet — gissas aldrig", async () => {
    // En gissning här publicerar eller döljer en produkt åt fel håll. Hellre
    // oförändrat beteende än ett påhittat värde.
    const patchar = stubba(produkt(undefined));
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 149 }]);
    const body = patchar[0].body as { product: Record<string, unknown>; fieldMask: { paths: string[] } };
    expect("visible" in body.product).toBe(false);
    expect(body.fieldMask.paths).toEqual(["variantsInfo"]);
  });

  it("skriver priset som STRÄNG — ett tal avrundas tyst av V3", async () => {
    const patchar = stubba(produkt(false));
    await updateV3VariantPrices("p1", [{ sku: "SKU-1", actualPrice: 1499 }]);
    const body = patchar[0].body as {
      product: { variantsInfo: { variants: { price: { actualPrice: { amount: unknown } } }[] } };
    };
    expect(body.product.variantsInfo.variants[0].price.actualPrice.amount).toBe("1499");
  });

  it("omatchad variant rapporteras i stället för att tyst hoppas över", async () => {
    stubba(produkt(false));
    const res = await updateV3VariantPrices("p1", [{ sku: "FINNS-INTE", actualPrice: 149 }]);
    expect(res.updated).toBe(0);
    expect(res.missing).toEqual(["FINNS-INTE"]);
  });
});
