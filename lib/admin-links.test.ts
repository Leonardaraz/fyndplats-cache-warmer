import { afterEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import {
  aliExpressItemUrl,
  headlessSiteId,
  storeProductUrl,
  wixProductEditBase,
  wixProductEditUrl,
} from "./admin-links";

const SPARAD = { ...process.env };
afterEach(() => {
  process.env = { ...SPARAD };
});

describe("storeProductUrl", () => {
  it("bygger butikslänken ur slugen", () => {
    process.env.STORE_PRODUCT_BASE_URL = "https://www.fyndplats.se/produkt";
    expect(storeProductUrl("elbil-barn-amg")).toBe("https://www.fyndplats.se/produkt/elbil-barn-amg");
  });

  it("tål avslutande snedstreck i basen", () => {
    process.env.STORE_PRODUCT_BASE_URL = "https://www.fyndplats.se/produkt/";
    expect(storeProductUrl("x")).toBe("https://www.fyndplats.se/produkt/x");
  });

  // Hellre ingen länk än en trasig: en <a> till ".../produkt/undefined" ser ut
  // att fungera tills någon klickar.
  it("saknad slug ger tom sträng, inte en trasig URL", () => {
    expect(storeProductUrl(undefined)).toBe("");
    expect(storeProductUrl("")).toBe("");
    expect(storeProductUrl("   ")).toBe("");
  });
});

describe("wixProductEditUrl", () => {
  it("pekar på HEADLESS-sajten, där produkterna faktiskt ligger", () => {
    delete process.env.HEADLESS_WIX_SITE_ID;
    // WIX_SITE_ID pekar på gamla Fyndplats (CMS-collectionerna). Bygger man
    // dashboard-länken på det id:t landar man på fel sajt — det var buggen i
    // duplicate-check.ts fram till 2026-08-21.
    process.env.WIX_SITE_ID = "fel-gammalt-id";
    expect(wixProductEditUrl("abc")).toContain("e6d27e90-4749-4720-9afe-0bbe91c1b3d3");
    expect(wixProductEditUrl("abc")).not.toContain("fel-gammalt-id");
  });

  // /store/products/{id} landar på produktLISTAN, inte på produkten. Det var
  // felet i lönsamhetsöversikten.
  it("har med /product/-segmentet", () => {
    expect(wixProductEditUrl("abc123")).toBe(
      `https://manage.wix.com/dashboard/${headlessSiteId()}/store/products/product/abc123`,
    );
  });

  it("går att styra om via env när Wix flyttar vyn", () => {
    process.env.WIX_DASHBOARD_PRODUCT_BASE = "https://manage.wix.com/dashboard/s/store/catalog/product/";
    expect(wixProductEditUrl("abc")).toBe(
      "https://manage.wix.com/dashboard/s/store/catalog/product/abc",
    );
  });

  it("saknat id ger tom sträng", () => {
    expect(wixProductEditUrl(undefined)).toBe("");
    expect(wixProductEditUrl("")).toBe("");
  });

  it("respekterar HEADLESS_WIX_SITE_ID", () => {
    process.env.HEADLESS_WIX_SITE_ID = "eget-id";
    expect(wixProductEditBase()).toContain("eget-id");
  });
});

describe("aliExpressItemUrl", () => {
  it("bygger listningslänken", () => {
    expect(aliExpressItemUrl("1005005972133031")).toBe(
      "https://www.aliexpress.com/item/1005005972133031.html",
    );
  });

  it("saknat id ger tom sträng", () => {
    expect(aliExpressItemUrl(null)).toBe("");
  });
});

// Länkarna fanns i fyra kopior varav två pekade fel. Den här spärren gör det
// dyrt att lägga tillbaka en femte — samma lärdom som SHIP_AXIS_RE och
// EU-listorna, som båda drev isär utan att någon märkte det.
describe("inga egna kopior av dashboard-URL:en", () => {
  it("manage.wix.com finns bara i admin-links och som redan kända undantag", () => {
    const träffar = execSync(
      "grep -rln 'manage\\.wix\\.com/dashboard' lib/ app/ --include=*.ts --include=*.tsx || true",
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean)
      .filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"));
    // Lönsamhetsöversikten är en klientkomponent och kan inte läsa env — den
    // bär därför site-id:t själv. Läggs en NY fil till här ska den använda
    // lib/admin-links.ts i stället.
    expect(träffar.sort()).toEqual(
      ["app/admin/profitability/dashboard-client.tsx", "lib/admin-links.ts"].sort(),
    );
  });
});
