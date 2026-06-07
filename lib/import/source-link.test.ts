import { describe, it, expect } from "vitest";
import { parseLookupInput, aliexpressUrlFor } from "./source-link";

describe("parseLookupInput", () => {
  it("känner igen ett rent Wix-produkt-id (GUID)", () => {
    expect(parseLookupInput("1e1a3869-3b2c-4d5e-8f90-abcdef123456")).toEqual({
      kind: "id",
      id: "1e1a3869-3b2c-4d5e-8f90-abcdef123456",
    });
  });

  it("normaliserar GUID till gemener", () => {
    expect(parseLookupInput("1E1A3869-3B2C-4D5E-8F90-ABCDEF123456")).toEqual({
      kind: "id",
      id: "1e1a3869-3b2c-4d5e-8f90-abcdef123456",
    });
  });

  it("plockar slug ur en hel storefront-URL", () => {
    expect(parseLookupInput("https://www.fyndplats.se/produkt/pawhut-hopfallbar-hundvagn")).toEqual({
      kind: "slug",
      slug: "pawhut-hopfallbar-hundvagn",
    });
  });

  it("ignorerar query/hash i URL:en", () => {
    expect(parseLookupInput("https://www.fyndplats.se/produkt/min-slug?variant=2#galleri")).toEqual({
      kind: "slug",
      slug: "min-slug",
    });
  });

  it("URL-avkodar slug:en", () => {
    expect(parseLookupInput("https://www.fyndplats.se/produkt/sten%20i%20gr%C3%B6nt")).toEqual({
      kind: "slug",
      slug: "sten i grönt",
    });
  });

  it("behandlar en naken sträng som slug", () => {
    expect(parseLookupInput("1l-sportflaska-med-sugror-bpa-fri")).toEqual({
      kind: "slug",
      slug: "1l-sportflaska-med-sugror-bpa-fri",
    });
  });

  it("trimmar kringliggande snedstreck på en slug", () => {
    expect(parseLookupInput("/min-slug/")).toEqual({ kind: "slug", slug: "min-slug" });
  });

  it("returnerar null för tom/whitespace-input", () => {
    expect(parseLookupInput("")).toBeNull();
    expect(parseLookupInput("   ")).toBeNull();
    expect(parseLookupInput("/")).toBeNull();
  });
});

describe("aliexpressUrlFor", () => {
  it("föredrar en giltig sourceUrl", () => {
    expect(
      aliexpressUrlFor({
        sourceUrl: "https://sv.aliexpress.com/item/1005006123456789.html?spm=a2g0o",
        supplierProductId: "1005006123456789",
      }),
    ).toBe("https://sv.aliexpress.com/item/1005006123456789.html?spm=a2g0o");
  });

  it("bygger kanonisk item-URL från supplierProductId när sourceUrl saknas", () => {
    expect(aliexpressUrlFor({ supplierProductId: "1005006123456789" })).toBe(
      "https://www.aliexpress.com/item/1005006123456789.html",
    );
  });

  it("ignorerar en icke-http sourceUrl och faller tillbaka på id", () => {
    expect(
      aliexpressUrlFor({ sourceUrl: "javascript:void(0)", supplierProductId: "1005006123456789" }),
    ).toBe("https://www.aliexpress.com/item/1005006123456789.html");
  });

  it("returnerar null när varken sourceUrl eller id finns", () => {
    expect(aliexpressUrlFor({})).toBeNull();
    expect(aliexpressUrlFor({ sourceUrl: "", supplierProductId: "" })).toBeNull();
  });
});
