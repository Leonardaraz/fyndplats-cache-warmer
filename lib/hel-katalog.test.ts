import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EJ_HEL_KATALOG, KatalogenEjHel, kravHel, LISTSIDOR, TOM_KATEGORILISTA } from "./hel-katalog.ts";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");
/** Källtexten utan radkommentarer, så att ett namn i en kommentar inte räknas. */
const kod = (fil: string) =>
  las(...fil.split("/"))
    .split("\n")
    .filter((rad) => !/^\s*(\/\/|\*|\/\*)/.test(rad))
    .join("\n");

describe("kravHel", () => {
  it("en hel lista kommer tillbaka orörd, samma objekt", () => {
    const lista = [{ slug: "a" }];
    assert.equal(kravHel(lista, false, "En listsida"), lista);
  });

  it("☠️ en degraderad lista kastar i stället för att byggas på", () => {
    assert.throws(
      () => kravHel([{ slug: "reserv" }], true, "En listsida"),
      (e: unknown) => e instanceof KatalogenEjHel && e.name === "KatalogenEjHel",
    );
  });

  it("felet säger vad som inte byggdes och att den förra versionen ligger kvar", () => {
    const e = new KatalogenEjHel("Flöden, sitemap och sökindex");
    assert.match(e.message, /^\[katalog\] Flöden, sitemap och sökindex byggs inte på reservkatalogen/);
    assert.match(e.message, /Den förra versionen ligger kvar/);
  });

  it("också en tom lista är hel när hämtningen inte var degraderad", () => {
    // Tomheten avgörs inte här: getProducts ger aldrig en tom hel lista
    // (fetchProducts faller då tillbaka på reservkatalogen, som är degraderad).
    assert.deepEqual(kravHel([], false, "x"), []);
  });

  it("felet säger vilket underlag som inte höll: en tom kategorilista är inte reservkatalogen", () => {
    assert.throws(
      () => kravHel([], true, "En kategorisida", TOM_KATEGORILISTA),
      (e: unknown) =>
        e instanceof KatalogenEjHel
        && /^\[katalog\] En kategorisida byggs inte på en tom kategorilista\. Den förra versionen ligger kvar/.test(e.message),
    );
    assert.equal(EJ_HEL_KATALOG, "reservkatalogen eller en kapad hämtning");
    assert.match(new KatalogenEjHel("En listsida").message, /byggs inte på reservkatalogen eller en kapad hämtning\./);
  });
});

describe("☠️ kategorisidan byggs aldrig på en tom kategorilista (provat 2026-11-11: sidan blev en sparad 307 till /butik)", () => {
  const sida = kod("app/kategori/[slug]/page.tsx");
  const produkter = kod("lib/products.ts");

  it("getHelaKategorier är getCollections som kastar på en tom lista", () => {
    assert.match(
      produkter,
      /export const getHelaKategorier = cache\(async \(\): Promise<Collection\[\]> => \{\s*const lista = await getCollections\(\);\s*return kravHel\(lista, lista\.length === 0, "En kategorisida", TOM_KATEGORILISTA\);\s*\}\);/,
    );
  });

  it("sidan och robots-taggen läser den spärrade kategorilistan", () => {
    assert.equal((sida.match(/\bgetHelaKategorier\(\)/g) || []).length, 2);
    assert.match(sida, /const \[cols, products\] = await Promise\.all\(\[getHelaKategorier\(\), getHelaKatalogen\(\)\]\);/);
    assert.match(sida, /const \[allProducts, collections\] = await Promise\.all\(\[getHelaKatalogen\(\), getHelaKategorier\(\)\]\);/);
  });

  it("bara generateStaticParams läser getCollections(): ett bygge utan kategorier ger inga förbyggda sidor, inget fel", () => {
    assert.equal((sida.match(/\bgetCollections\(\)/g) || []).length, 1);
    assert.match(sida, /export async function generateStaticParams\(\) \{\s*const cols = await getCollections\(\);/);
  });

  it("en känd men tom kategori leder fortfarande till /butik, och en okänd adress ger 404", () => {
    assert.match(sida, /if \(!active\) \{\s*const known = await getAllCategorySlugs\(\);\s*if \(known && !known\.has\(slug\)\) notFound\(\);\s*redirect\("\/butik"\);\s*\}/);
  });

  it("getCollections själv kastar inte: sidhuvudet och de andra listsidorna klarar sig utan kategorier", () => {
    const m = produkter.match(/export const getCollections = cache\(async \(\): Promise<Collection\[\]> => \{[\s\S]*?\n\}\);/);
    assert.ok(m, "hittar inte getCollections");
    assert.doesNotMatch(m[0], /kravHel/);
    assert.match(m[0], /if \(lista\.length === 0\) await kortLivslangd\(\);/);
    for (const fil of ["lib/sidhuvud-data.ts", "app/page.tsx", "app/butik/page.tsx", "app/alla-produkter/page.tsx", "app/produkt/[slug]/page.tsx"]) {
      assert.doesNotMatch(kod(fil), /getHelaKategorier/, fil);
    }
  });
});

describe("☠️ listsidorna läser katalogen genom spärren (mätt 2026-11-11: fem tomma kategorisidor med noindex)", () => {
  for (const fil of LISTSIDOR) {
    it(`${fil} läser getHelaKatalogen() och aldrig getProducts()`, () => {
      const k = kod(fil);
      assert.match(k, /\bgetHelaKatalogen\(\)/, "sidan läser inte den spärrade katalogen");
      assert.doesNotMatch(k, /\bgetProducts\(\)/, "sidan läser katalogen förbi spärren");
    });
  }

  it("kategorisidan läser den spärrade katalogen både för sidan och för robots-taggen", () => {
    const k = kod("app/kategori/[slug]/page.tsx");
    assert.equal((k.match(/\bgetHelaKatalogen\(\)/g) || []).length, 2);
    // noindex räknas ur samma lista: på reservkatalogen blev antalet noll.
    assert.match(k, /countPerCategoryPage\(forListings\(products\), cols\)/);
  });

  it("listan täcker varje sida med revalidate som bygger en produktlista ur katalogen", () => {
    for (const fil of ["app/page.tsx", "app/butik/page.tsx", "app/alla-produkter/page.tsx", "app/rea/page.tsx", "app/kategori/[slug]/page.tsx"]) {
      assert.ok((LISTSIDOR as readonly string[]).includes(fil), fil);
      assert.match(kod(fil), /export const revalidate = /, `${fil} är inte längre en ISR-sida`);
    }
  });
});

describe("spärren i lib/products.ts", () => {
  const k = kod("lib/products.ts");

  it("kravHelKatalog frågar samma mängd som kortLivslangd: reservlistan och en kapad hämtning", () => {
    assert.match(k, /export function kravHelKatalog\(lista: Product\[\], vad: string\): Product\[\] \{\s*return kravHel\(lista, DEGRADERADE\.has\(lista\), vad\);/);
    assert.match(k, /const DEGRADERADE = new WeakSet<Product\[\]>\(\[FALLBACK_PRODUCTS\]\)/);
    assert.match(k, /DEGRADERADE\.add\(unique\)/);
  });

  it("getHelaKatalogen är getProducts genom spärren", () => {
    assert.match(k, /export const getHelaKatalogen = cache\(async \(\): Promise<Product\[\]> =>\s*kravHelKatalog\(await getProducts\(\), "En listsida"\),\s*\);/);
  });

  it("☠️ getProductsFarska ger aldrig reservkatalogen till ett flöde eller sitemapen", () => {
    assert.match(
      k,
      /export async function getProductsFarska\(maxAlderMs: number = KATALOG_FARSK_MS\): Promise<Product\[\]> \{\s*return kravHelKatalog\(await farskEllerBehallen\(maxAlderMs\), "Flöden, sitemap och sökindex"\);/,
    );
  });

  it("getProducts själv kastar inte: produktsidan och sidhuvudet ska fungera på reservlistan", () => {
    const m = k.match(/export const getProducts = cache\(async \(\): Promise<Product\[\]> => \{[\s\S]*?\n\}\);/);
    assert.ok(m, "hittar inte getProducts");
    assert.doesNotMatch(m[0], /kravHel/);
    assert.match(m[0], /if \(DEGRADERADE\.has\(lista\)\) await kortLivslangd\(\);/);
  });
});

describe("det som INTE ska kasta", () => {
  it("produktsidan läser getProducts(): varan ska gå att köpa också när katalogen i minnet är reservlistan", () => {
    const k = kod("app/produkt/[slug]/page.tsx");
    assert.match(k, /\bgetProducts\(\)/);
    assert.doesNotMatch(k, /getHelaKatalogen/);
  });

  it("sidhuvudet läser getProducts() och bär själv att katalogen är degraderad", () => {
    const k = kod("lib/sidhuvud-data.ts");
    assert.match(k, /katalogenArDegraderad\(produkter\)/);
    assert.doesNotMatch(k, /getHelaKatalogen/);
  });
});

describe("flödena gör felet till ett 503 som inte sparas", () => {
  it("Google-flödet fångar felet och bygger då utan varor", () => {
    assert.match(kod("app/feed/google.xml/route.ts"), /try \{ products = await getProductsFarska\(\); \} catch \{ products = \[\]; \}/);
  });

  it("produktflödet fångar felet och bygger då utan varor", () => {
    assert.match(kod("app/feed/products.xml/route.ts"), /try \{\s*products = await getProductsFarska\(\);\s*\} catch \{\s*products = \[\];\s*\}/);
  });

  it("ett flöde utan varor skickas aldrig: 503, no-store", () => {
    const k = kod("lib/feed/prisjakt-svar.ts");
    assert.match(k, /if \(request && arTomtFlode\(xml\)\) return tomtFlodeSvar\(/);
    assert.match(k, /status: 503,\s*headers: \{ "Content-Type": "text\/plain; charset=utf-8", "Cache-Control": "no-store"/);
  });
});
