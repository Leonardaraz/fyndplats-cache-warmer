import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { behallNy, forGammal, KATALOG_FARSK_MS } from "./katalog-alder.ts";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");

describe("forGammal", () => {
  const nu = Date.UTC(2026, 10, 11, 12, 0, 0);

  it("en timme är gränsen", () => {
    assert.equal(KATALOG_FARSK_MS, 3_600_000);
    assert.equal(forGammal(nu - KATALOG_FARSK_MS, nu, KATALOG_FARSK_MS), false);
    assert.equal(forGammal(nu - KATALOG_FARSK_MS - 1, nu, KATALOG_FARSK_MS), true);
  });

  it("en nyss hämtad katalog är färsk", () => {
    assert.equal(forGammal(nu, nu, KATALOG_FARSK_MS), false);
    assert.equal(forGammal(nu - 60_000, nu, KATALOG_FARSK_MS), false);
  });

  it("ett dygn gammal katalog hämtas om", () => {
    assert.equal(forGammal(nu - 24 * 3_600_000, nu, KATALOG_FARSK_MS), true);
  });

  it("aldrig hämtad räknas som för gammal", () => {
    assert.equal(forGammal(0, nu, KATALOG_FARSK_MS), true);
    assert.equal(forGammal(Number.NaN, nu, KATALOG_FARSK_MS), true);
  });
});

describe("behallNy", () => {
  it("en hel ny lista ersätter den gamla, en kapad gör det aldrig", () => {
    assert.equal(behallNy(false), true);
    assert.equal(behallNy(true), false);
  });
});

describe("katalogen i minnet förnyas för flödena", () => {
  const produkter = las("lib", "products.ts");

  it("getProducts stämplar när katalogen hämtades", () => {
    assert.match(produkter, /if \(!productsPromise\) \{\s*productsPromise = fetchProducts\(\);\s*katalogHamtad = Date\.now\(\);\s*\}/);
  });

  it("förnyelsen behåller den gamla listan när den nya inte är hel", () => {
    const start = produkter.indexOf("export async function getProductsFarska");
    assert.ok(start > 0);
    const kropp = produkter.slice(start, produkter.indexOf("\n}\n", start));
    assert.match(kropp, /if \(!forGammal\(katalogHamtad, Date\.now\(\), maxAlderMs\)\) return nuvarande;/);
    assert.match(kropp, /if \(!behallNy\(DEGRADERADE\.has\(ny\)\)\) \{\s*productsPromise = gammal;/);
    assert.match(kropp, /catch \(e\) \{\s*productsPromise = gammal;/);
    assert.match(kropp, /finally \{\s*fornyelse = null;/);
    // Kategorierna räknas ur katalogen och byts bara mot en lista som inte är tom.
    assert.match(kropp, /collectionsPromise = nyaKategorier\.length > 0 \? Promise\.resolve\(nyaKategorier\) : gamlaKategorier;/);
  });

  it("sitemapen, sökindexet och timjobbet börjar med en färsk katalog", () => {
    assert.match(las("lib", "site-urls.ts"), /export async function getSiteUrls\(\)[^{]*\{[\s\S]{0,700}await getProductsFarska\(\);\s*const \[prodEntries/);
    assert.match(las("app", "api", "search-index", "route.ts"), /const products = await getProductsFarska\(\);/);
    assert.match(las("app", "api", "cron", "warm-and-ping", "route.ts"), /await getProductsFarska\(\);\s*const entries = await getProductSitemapEntries\(\);/);
  });

  it("ingen sida väntar på förnyelsen: den används bara i rutter och i sitemapens lista", () => {
    const hittade: string[] = [];
    const ga = (mapp: string) => {
      for (const namn of readdirSync(mapp)) {
        const full = join(mapp, namn);
        if (statSync(full).isDirectory()) ga(full);
        else if (/\.tsx?$/.test(namn) && !/\.test\./.test(namn) && readFileSync(full, "utf8").includes("getProductsFarska")) hittade.push(full.replace(join(import.meta.dirname, "..") + "/", ""));
      }
    };
    ga(join(import.meta.dirname, "..", "app"));
    ga(join(import.meta.dirname, "..", "components"));
    assert.deepEqual(hittade.sort(), [
      "app/api/cron/warm-and-ping/route.ts",
      "app/api/search-index/route.ts",
      "app/feed/google.xml/route.ts",
      "app/feed/products.xml/route.ts",
    ]);
  });
});

describe("de stora flödena byggs vid anrop och strömmas", () => {
  for (const fil of ["google.xml", "products.xml", "pricerunner.xml"]) {
    it(`/feed/${fil}`, () => {
      const kalla = las("app", "feed", fil, "route.ts");
      assert.match(kalla, /^export const dynamic = "force-dynamic";$/m);
      assert.match(kalla, /^export const maxDuration = 300;$/m);
      assert.doesNotMatch(kalla, /^export const revalidate\b/m, "route-ISR bygger aldrig om ett så stort svar");
      assert.match(kalla, /return new Response\(strommatXml\(xml\), \{/);
      assert.match(kalla, /"Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"/);
    });
  }

  it("Google- och produktflödet läser en färsk katalog", () => {
    assert.match(las("app", "feed", "google.xml", "route.ts"), /products = await getProductsFarska\(\);/);
    assert.match(las("app", "feed", "products.xml", "route.ts"), /products = await getProductsFarska\(\);/);
  });
});
