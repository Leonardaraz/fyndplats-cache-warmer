import { describe, it, expect } from "vitest";
import { parseLookupInput, aliexpressUrlFor, leverantorskallaFor } from "./source-link";

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

  // ☠️ DE HÄR TVÅ FORMERNA ÄR DE ENDA SOM STÅR PÅ WIX ORDERSIDA. Uppslaget
  // byggdes för ett Wix-produkt-id, och det syns inte där — så vägen från
  // "jag har en beställning" till "var köper jag in den" gick via en chatt.
  // Se kommentaren vid LookupTarget.
  it("rena siffror är ett ORDERNUMMER, inte en slug", () => {
    expect(parseLookupInput("10036")).toEqual({ kind: "order", number: "10036" });
    expect(parseLookupInput("  #10036 ")).toEqual({ kind: "order", number: "10036" });
  });

  it("FP-prefixet är en variant-SKU", () => {
    expect(parseLookupInput("FP-rollator-med-sits-bla")).toEqual({
      kind: "sku",
      sku: "FP-rollator-med-sits-bla",
    });
  });

  // ⚠️ Åt ANDRA hållet: de nya mönstren får inte äta slugs. En slug som börjar
  // med siffror eller innehåller "fp" ska fortsatt bli en slug — annars slutar
  // det gamla uppslaget fungera för att det nya lades till.
  it("tar inte över slugs som bara liknar de nya formerna", () => {
    expect(parseLookupInput("180-cm-julgran")).toEqual({ kind: "slug", slug: "180-cm-julgran" });
    expect(parseLookupInput("fp-bord")).toEqual({ kind: "sku", sku: "fp-bord" });
    expect(parseLookupInput("fpbord-ek")).toEqual({ kind: "slug", slug: "fpbord-ek" });
    expect(parseLookupInput("10")).toEqual({ kind: "slug", slug: "10" });
  });

  it("ett Wix-produkt-id är fortfarande ett id", () => {
    expect(parseLookupInput("08f67f7e-9902-48db-9665-07983c149b8d")).toEqual({
      kind: "id",
      id: "08f67f7e-9902-48db-9665-07983c149b8d",
    });
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

describe("leverantorskallaFor", () => {
  // ☠️ ARTIKELNUMRET ÄR PÅHITTAT, OCH SKA FÖRBLI DET. Repot är publikt, och
  // ett Aosom-artikelnummer är exakt den sträng dealproffsen.se publicerar
  // som sku/mpn — den joinar vår produktsida mot deras och därmed mot vårt
  // inköpsled. Ett riktigt nummer i en fixtur är lika publicerat som ett i
  // en produkttext. Byt inte till ett "verkligare" exempel.
  const AOSOM = {
    supplier: "aosom" as const,
    supplierProductId: "aosom:000-000V00XX",
    sourceUrl: "https://www.aosom.de/item/pawhut-hamsterkafig~22LO1SFHI6801.html",
  };

  it("ger Aosoms namn, nummer utan prefix och deras egen länk", () => {
    expect(leverantorskallaFor(AOSOM)).toEqual({
      leverantor: "aosom",
      namn: "Aosom",
      // ☠️ `aosom:` är vår interna diskriminator och betyder ingenting i Aosoms
      // bulkorderfil. Klistras prefixet in där avvisas raden.
      artikelnummer: "000-000V00XX",
      url: AOSOM.sourceUrl,
    });
  });

  it("klassar en rad UTAN supplier-fält på id-prefixet", () => {
    // Rader skrivna innan `supplier` fanns, eller som tappat det i en partiell
    // uppdatering, ska ändå inte märkas AliExpress.
    const utanFalt = { supplierProductId: "aosom:000-000V00XX" };
    expect(leverantorskallaFor(utanFalt).namn).toBe("Aosom");
    expect(leverantorskallaFor(utanFalt).artikelnummer).toBe("000-000V00XX");
  });

  it("bygger ALDRIG en aliexpress.com-länk av ett Aosom-artikelnummer", () => {
    // Det här är buggen: utan sourceUrl föll koden tillbaka på den kanoniska
    // AE-item-URL:en och gav `.../item/aosom:000-000V00XX.html` — en länk som
    // ser giltig ut och alltid är död. Hellre ingen länk än en falsk.
    const utanKalla = { supplier: "aosom" as const, supplierProductId: "aosom:000-000V00XX" };
    expect(leverantorskallaFor(utanKalla).url).toBeNull();
    expect(aliexpressUrlFor(utanKalla)).toBeNull();
  });

  it("lämnar AE-rader oförändrade", () => {
    const ae = { supplierProductId: "1005006123456789" };
    expect(leverantorskallaFor(ae)).toEqual({
      leverantor: "aliexpress",
      namn: "AliExpress",
      artikelnummer: "1005006123456789",
      url: "https://www.aliexpress.com/item/1005006123456789.html",
    });
  });
});
