import { describe, it, expect } from "vitest";
import {
  buildSearchQuery,
  parseSekPrice,
  extractJsonLdPrices,
  titleMatchConfidence,
  summarizeCompetition,
  type CompetitorPrice,
} from "./competitor-prices";

describe("buildSearchQuery", () => {
  it("släng filler, mått och färger; behåll brand + produkttyp", () => {
    const q = buildSearchQuery("USB-Laddbar LED Nattlampa med Rörelsesensor, Svart 500ml 3-pack");
    expect(q).toContain("led");
    expect(q).toContain("nattlampa");
    expect(q).toContain("rörelsesensor");
    expect(q).toContain("usb"); // meningsfullt nyckelord — behålls
    expect(q).not.toContain("laddbar"); // filler — tas bort
    expect(q).not.toContain("med");
    expect(q).not.toContain("svart");
    expect(q).not.toContain("500ml");
    expect(q).not.toContain("pack");
  });

  it("begränsar till maxWords ord", () => {
    const q = buildSearchQuery("ett två tre fyra fem sex sju åtta nio tio", 4);
    expect(q.split(" ")).toHaveLength(4);
  });

  it("tom titel → tom fråga", () => {
    expect(buildSearchQuery("")).toBe("");
  });
});

describe("parseSekPrice", () => {
  it("läser olika prisformat", () => {
    expect(parseSekPrice("1 299 kr")).toBe(1299);
    expect(parseSekPrice("299:-")).toBe(299);
    expect(parseSekPrice("kr 1 499")).toBe(1499);
    expect(parseSekPrice('"price":"349.00"')).toBe(349);
    expect(parseSekPrice("ingen siffra här")).toBeNull();
  });
});

describe("extractJsonLdPrices", () => {
  it("plockar name + price ur JSON-LD Product", () => {
    const html = `
      <html><head>
      <script type="application/ld+json">
      {"@type":"Product","name":"LED Nattlampa","offers":{"@type":"Offer","price":"249","priceCurrency":"SEK"}}
      </script>
      </head></html>`;
    const out = extractJsonLdPrices(html);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("LED Nattlampa");
    expect(out[0].priceSek).toBe(249);
  });

  it("hanterar @graph med flera produkter", () => {
    const html = `<script type="application/ld+json">
      {"@graph":[
        {"@type":"Product","name":"A","offers":{"price":"100"}},
        {"@type":"Product","name":"B","offers":[{"price":"200"},{"price":"250"}]}
      ]}</script>`;
    const out = extractJsonLdPrices(html);
    expect(out.map((o) => o.priceSek).sort((a, b) => a - b)).toEqual([100, 200, 250]);
  });

  it("ignorerar trasig JSON utan att kasta", () => {
    expect(extractJsonLdPrices(`<script type="application/ld+json">{trasig</script>`)).toEqual([]);
  });
});

describe("titleMatchConfidence", () => {
  it("hög när orden överlappar", () => {
    expect(titleMatchConfidence("led nattlampa", "LED Nattlampa Vit")).toBeCloseTo(1, 5);
  });
  it("låg när inget matchar", () => {
    expect(titleMatchConfidence("led nattlampa", "Rostfri Vattenflaska")).toBe(0);
  });
});

describe("summarizeCompetition", () => {
  const mk = (priceSek: number, source: CompetitorPrice["source"] = "Pricerunner"): CompetitorPrice => ({
    source,
    title: "x",
    priceSek,
    url: "u",
    matchConfidence: 0.5,
  });

  it("none när inga priser", () => {
    expect(summarizeCompetition([]).signal).toBe("none");
  });

  it("red när lägsta är under golvet (100 kr)", () => {
    const s = summarizeCompetition([mk(59), mk(75)]);
    expect(s.signal).toBe("red");
    expect(s.lowestSek).toBe(59);
  });

  it("yellow vid hög konkurrens (>= 4 träffar i ett band)", () => {
    const s = summarizeCompetition([mk(199), mk(219), mk(229), mk(249)]);
    expect(s.signal).toBe("yellow");
    expect(s.message).toContain("199");
    expect(s.message).toContain("249");
  });

  it("green med prisledare-förslag när vårt pris underbjuder", () => {
    const s = summarizeCompetition([mk(299)], 249);
    expect(s.signal).toBe("green");
    expect(s.message).toContain("249");
    expect(s.message).toContain("299");
  });

  it("green med härlett ledarpris när vårt pris saknas", () => {
    const s = summarizeCompetition([mk(299), mk(349)]);
    expect(s.signal).toBe("green");
    expect(s.lowestSek).toBe(299);
  });
});
