import { describe, expect, it } from "vitest";
import { isThinProductInput, stripMarketplaceSuffix } from "./guard";
import { buildFallbackSeo } from "./seo";
import type { AliExpressProduct } from "./types";

// Bakgrund (2026-08-19): råtiteln kommer från sidans document.title, som hos
// leverantören alltid ser ut som "<produktnamn> - AliExpress <säljar-id>". I
// RÅ-läget (AI_ENRICHMENT_ENABLED=false) blir råtiteln produktens namn i Wix
// rakt av. 67 mappningar bar suffixet i den sparade titeln — alla polerade i
// efterhand, men nästa opolerade import hade nått kunden med leverantörens
// namn i produktnamnet.

describe("stripMarketplaceSuffix", () => {
  it("kapar hela suffixet inklusive säljar-id", () => {
    expect(stripMarketplaceSuffix("Outsunny 2-Tier Round Garden Table - AliExpress 1503")).toBe(
      "Outsunny 2-Tier Round Garden Table",
    );
  });

  it("kapar även det avhuggna suffixet som 70-teckensgränsen lämnade", () => {
    // Så här ser de sparade titlarna faktiskt ut i FyndplatsMappings.
    expect(stripMarketplaceSuffix("Homcom Folding Sewing Table White - AliExpre")).toBe(
      "Homcom Folding Sewing Table White",
    );
    expect(stripMarketplaceSuffix("Outsunny Set 1 Garden Table + 2 Rattan Chairs - AliEx")).toBe(
      "Outsunny Set 1 Garden Table + 2 Rattan Chairs",
    );
  });

  it("klarar de skiljetecken sidan faktiskt använder", () => {
    for (const sep of ["-", "–", "—", "|", "--"]) {
      expect(stripMarketplaceSuffix(`Vikbart bord ${sep} AliExpress`)).toBe("Vikbart bord");
    }
  });

  it("kapar BARA i slutet — text efter marknadsplatsen överlever", () => {
    // Ett girigt .*$ åt upp svansen: "Powerbank 20000mAh - AliExpress Choice -
    // Snabbladdning" blev "Powerbank 20000mAh". Fel-läget ska vara "strök inte",
    // inte "strök för mycket".
    const mitten = "Powerbank 20000mAh - AliExpress Choice - Snabbladdning";
    expect(stripMarketplaceSuffix(mitten)).toBe(mitten);
    const alibaba = "Hörlurar - Alibaba Selection - Trådlösa";
    expect(stripMarketplaceSuffix(alibaba)).toBe(alibaba);
  });

  it("lämnar inga hängande skiljetecken efter kapningen", () => {
    expect(stripMarketplaceSuffix("Klocka, - AliExpress")).toBe("Klocka");
    expect(stripMarketplaceSuffix("Product - - AliExpress 1503")).toBe("Product");
  });

  it("en titel som ENBART är marknadsplatsen lämnas orörd — det är grindarnas jobb", () => {
    // Tidigare returnerades tom sträng här, i tron att isThinProductInput skulle
    // fånga den. Det gör ingen anropare i rå-läget, så resultatet blev en produkt
    // UTAN namn i Wix. En smutsig titel går att rätta i efterhand; en namnlös
    // kolliderar dessutom på slugen "produkt".
    expect(stripMarketplaceSuffix("AliExpress")).toBe("AliExpress");
    expect(stripMarketplaceSuffix("AliExpress 1503")).toBe("AliExpress 1503");
  });

  it("kort men äkta produktnamn förblir kort — och räknas inte som tunt", () => {
    // "Lampa - AliExpress 1503" tvättas till 5 tecken. Tunnhetskontrollen ska
    // ändå se RÅtiteln, annars hoppas SEO-genereringen över för en fullgod produkt.
    expect(stripMarketplaceSuffix("Lampa - AliExpress 1503")).toBe("Lampa");
    expect(isThinProductInput("Lampa - AliExpress 1503")).toBe(false);
  });

  it("rör inte en titel utan marknadsplatsnamn", () => {
    const ren = "Homcom Metal Double Bed Frame 135X190 cm - vit";
    expect(stripMarketplaceSuffix(ren)).toBe(ren);
  });

  it("tål tomt och saknat värde", () => {
    expect(stripMarketplaceSuffix("")).toBe("");
    expect(stripMarketplaceSuffix(undefined)).toBe("");
    expect(stripMarketplaceSuffix(null)).toBe("");
  });
});

function produkt(rawTitle: string): AliExpressProduct {
  return {
    supplierProductId: "1005007857803500",
    rawTitle,
    rawDescription: "",
    descriptionHtml: "",
    imageUrls: ["https://ae-pic-a1.aliexpress-media.com/kf/A1.jpg"],
    variants: [],
    specifications: {},
  } as unknown as AliExpressProduct;
}

describe("buildFallbackSeo: rå-läget släpper aldrig igenom marknadsplatsen", () => {
  it("produktnamn, alt-text och meta blir rena", () => {
    const seo = buildFallbackSeo(produkt("Outsunny Garden Gazebo 3X3.6 m - AliExpress 1503"));
    expect(seo.title).toBe("Outsunny Garden Gazebo 3X3.6 m");
    expect(seo.metaDescription).toBe("Outsunny Garden Gazebo 3X3.6 m");
    expect(seo.imageAltTexts[0]).toBe("Outsunny Garden Gazebo 3X3.6 m");
    expect(seo.slug).not.toMatch(/aliexpress/i);
  });

  it("de 70 tecknen går till produkten i stället för till suffixet", () => {
    // Utan tvätten åt " - AliExpress 1503" 18 av 70 tecken, och kapningen slog
    // sedan mitt i produktnamnet.
    const lang =
      "SucceBuy Inflatable Paint Booth Inflatable Spray Booth with Powerful Blower - AliExpress 1503";
    const seo = buildFallbackSeo(produkt(lang));
    expect(seo.title).toBe("SucceBuy Inflatable Paint Booth Inflatable Spray Booth with Powerful");
    expect(seo.title).not.toMatch(/ali/i);
  });
});
