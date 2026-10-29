import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { Takt } from "./hamtning";
import { MIN_KARTRADER, kartrader, lasKartan, produktkartor } from "./sitemap";

const takt = () => new Takt(() => 0, async () => undefined);
const id = (n: number) => String(n).padStart(12, "0");
const loc = (u: string) => `<url><loc>${u}</loc></url>`;

function karta(antal: number, extra = ""): string {
  const rader = Array.from({ length: antal }, (_, i) => loc(`https://eur.vevor.com/test-c_1/produkt-${i}-p_${id(i + 1)}`));
  return `<?xml version="1.0"?><urlset>${rader.join("")}${extra}</urlset>`;
}

const INDEX = `<?xml version="1.0"?><sitemapindex>
<sitemap><loc>https://eur.vevor.com/sitemap/sitemap_category.xml.gz</loc></sitemap>
<sitemap><loc>https://eur.vevor.com/sitemap/sitemap_product_manuals_1.xml.gz</loc></sitemap>
<sitemap><loc>https://eur.vevor.com/sitemap/sitemap_product_1.xml.gz</loc></sitemap>
<sitemap><loc>https://eur.vevor.com/sitemap/sitemap_product_image_1.xml.gz</loc></sitemap>
</sitemapindex>`;

describe("sajtkartan", () => {
  it("indexet: bara produktkartorna, inte manualer, bilder eller kategorier", () => {
    expect(produktkartor(INDEX)).toEqual(["/sitemap/sitemap_product_1.xml.gz"]);
  });

  it("raderna: sökväg och webb-id, dubbletter en gång, främmande adresser räknade", () => {
    const xml = karta(3, loc("https://www.example.test/x-p_000000000009") + loc(`https://eur.vevor.com/test-c_1/produkt-0-p_${id(1)}`) + loc("https://eur.vevor.com/pages/about-us"));
    const r = kartrader(xml);
    expect(r.rader).toHaveLength(3);
    expect(r.rader[0]).toEqual({ webbId: id(1), sokvag: `/test-c_1/produkt-0-p_${id(1)}` });
    expect(r.ogiltiga).toBe(2);
  });

  it("läser index och packad produktkarta, i takt", async () => {
    const hamtade: string[] = [];
    const r = await lasKartan({
      takt: takt(),
      hamtare: async (url) => {
        hamtade.push(url);
        if (url.endsWith("sitemap-index.xml")) return new Response(INDEX, { status: 200 });
        return new Response(gzipSync(karta(MIN_KARTRADER + 5)), { status: 200 });
      },
    });
    expect(r.ok && r.rader.length).toBe(MIN_KARTRADER + 5);
    expect(hamtade).toEqual([
      "https://eur.vevor.com/sitemap/sitemap-index.xml",
      "https://eur.vevor.com/sitemap/sitemap_product_1.xml.gz",
    ]);
  });

  it("☠️ en karta med för få produkter är trasig, aldrig ett krympt sortiment", async () => {
    const r = await lasKartan({
      takt: takt(),
      hamtare: async (url) =>
        url.endsWith("sitemap-index.xml")
          ? new Response(INDEX, { status: 200 })
          : new Response(gzipSync(karta(10)), { status: 200 }),
    });
    expect(r.ok).toBe(false);
  });

  it("☠️ en spärr på kartan kommer tillbaka som spärr", async () => {
    const r = await lasKartan({ takt: takt(), hamtare: async () => new Response("", { status: 429 }) });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.svar).toEqual({ typ: "blockerad", skal: "429" });
  });
});
