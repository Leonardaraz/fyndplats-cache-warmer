import { describe, expect, it } from "vitest";
import {
  buildMigrationReport,
  buildSitemapXml,
  normalizeName,
  toNextRedirectsConfig,
  toRedirectsCsv,
} from "./migration";
import type { WixV1ProductSummary } from "../wix/v1-products";
import type { WixV3ProductSummary } from "../wix/v3-products";

function v1(name: string, slug: string, extra: Partial<WixV1ProductSummary> = {}): WixV1ProductSummary {
  return {
    id: `v1-${slug}`,
    name,
    slug,
    oldPath: `/product-page/${slug}`,
    visible: true,
    hasSeoTitle: true,
    hasSeoDescription: true,
    hasJsonLd: true,
    hasOgTags: true,
    ...extra,
  };
}

function v3(name: string, slug: string, extra: Partial<WixV3ProductSummary> = {}): WixV3ProductSummary {
  return {
    id: `v3-${slug}`,
    name,
    slug,
    variantCount: 1,
    hasSeoTitle: true,
    hasSeoDescription: true,
    hasJsonLd: true,
    hasOgTags: true,
    hasImage: true,
    hasDescription: true,
    ...extra,
  };
}

describe("normalizeName", () => {
  it("är case- och whitespace-insensitiv", () => {
    expect(normalizeName("Magnetiska Örhängen")).toBe(normalizeName("magnetiska  örhängen"));
  });
  it("ignorerar punktuation och bindestreck", () => {
    expect(normalizeName("Korshalsband – Guld eller Silver"))
      .toBe(normalizeName("Korshalsband Guld eller Silver"));
  });
  it("collapsar multiple separators", () => {
    expect(normalizeName("foo!! BAR??baz")).toBe("foo bar baz");
  });
});

describe("buildMigrationReport", () => {
  it("matchar par på normaliserat namn", () => {
    const v1List = [v1("Magnetiska Örhängen", "magnetiska-orhangen-old")];
    const v3List = [v3("MAGNETISKA ÖRHÄNGEN", "magnetiska-orhangen-new")];
    const report = buildMigrationReport(v1List, v3List);
    expect(report.stats.matched).toBe(1);
    expect(report.pairs[0].oldUrl).toBe("/product-page/magnetiska-orhangen-old");
    expect(report.pairs[0].newUrl).toBe("/products/magnetiska-orhangen-new");
    expect(report.pairs[0].slugChanged).toBe(true);
  });

  it("flaggar slugIdentical när V1 och V3 har samma slug", () => {
    const v1List = [v1("Produkt A", "same-slug")];
    const v3List = [v3("Produkt A", "same-slug")];
    const report = buildMigrationReport(v1List, v3List);
    expect(report.stats.slugIdentical).toBe(1);
    expect(report.stats.slugDifferent).toBe(0);
    expect(report.pairs[0].slugChanged).toBe(false);
  });

  it("samlar V1-orphans (utan V3-match)", () => {
    const v1List = [v1("Borttagen produkt", "borttagen"), v1("Kvar", "kvar")];
    const v3List = [v3("Kvar", "kvar")];
    const report = buildMigrationReport(v1List, v3List);
    expect(report.v1Orphans).toHaveLength(1);
    expect(report.v1Orphans[0].name).toBe("Borttagen produkt");
  });

  it("samlar V3-orphans (nya produkter utan V1)", () => {
    const v1List = [v1("Gammal", "gammal")];
    const v3List = [v3("Gammal", "gammal"), v3("Helt ny", "ny")];
    const report = buildMigrationReport(v1List, v3List);
    expect(report.v3Orphans).toHaveLength(1);
    expect(report.v3Orphans[0].name).toBe("Helt ny");
  });

  it("respekterar custom newPathPrefix", () => {
    const v1List = [v1("X", "x")];
    const v3List = [v3("X", "x")];
    const report = buildMigrationReport(v1List, v3List, "/p/");
    expect(report.pairs[0].newUrl).toBe("/p/x");
  });

  it("lägger till trailing slash i prefix om saknas", () => {
    const v1List = [v1("X", "x")];
    const v3List = [v3("X", "x")];
    const report = buildMigrationReport(v1List, v3List, "/store-products");
    expect(report.pairs[0].newUrl).toBe("/store-products/x");
  });
});

describe("toNextRedirectsConfig", () => {
  it("genererar Next.js redirects-array med permanent:true", () => {
    const pairs = buildMigrationReport(
      [v1("X", "x-old")],
      [v3("X", "x-new")],
    ).pairs;
    const cfg = toNextRedirectsConfig(pairs);
    expect(cfg).toEqual([
      { source: "/product-page/x-old", destination: "/products/x-new", permanent: true },
    ]);
  });
});

describe("toRedirectsCsv", () => {
  it("escape:ar dubbla citationstecken i produktnamn", () => {
    const pairs = buildMigrationReport(
      [v1('Bag "Premium" Edition', "bag")],
      [v3('Bag "Premium" Edition', "bag")],
    ).pairs;
    const csv = toRedirectsCsv(pairs);
    expect(csv).toContain('"Bag ""Premium"" Edition"');
  });

  it("inkluderar header + rad per par", () => {
    const pairs = buildMigrationReport([v1("A", "a")], [v3("A", "a")]).pairs;
    const csv = toRedirectsCsv(pairs);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("old_url,new_url,slug_changed,product_name");
    expect(lines).toHaveLength(2);
  });
});

describe("buildSitemapXml", () => {
  it("genererar urlset med home + produkter", () => {
    const xml = buildSitemapXml(
      [v3("A", "a"), v3("B", "b")],
      "https://www.fyndplats.se/",
    );
    expect(xml).toContain("<loc>https://www.fyndplats.se/</loc>");
    expect(xml).toContain("<loc>https://www.fyndplats.se/products/a</loc>");
    expect(xml).toContain("<loc>https://www.fyndplats.se/products/b</loc>");
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  });

  it("escape:ar specialtecken i slug", () => {
    const xml = buildSitemapXml(
      [v3("X", "with&ampersand")],
      "https://example.com",
    );
    expect(xml).toContain("with&amp;ampersand");
  });

  it("hoppar över produkter utan slug", () => {
    const xml = buildSitemapXml(
      [v3("Bra", "ok"), v3("Trasig", "")],
      "https://example.com",
    );
    expect(xml).toContain("/products/ok");
    expect(xml).not.toMatch(/<loc>https:\/\/example\.com\/products\/<\/loc>/);
  });

  it("trim:ar trailing slash från baseUrl", () => {
    const xml = buildSitemapXml(
      [v3("A", "a")],
      "https://example.com/",
    );
    expect(xml).toContain("<loc>https://example.com/products/a</loc>");
    expect(xml).not.toContain("//products/");
  });
});
