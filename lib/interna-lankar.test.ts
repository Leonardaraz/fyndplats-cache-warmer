import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { flyttaProduktlankar, MAX_FLYTTADE_LANKAR, medLevandeLankar, produktlankarIText, raknaWixLankar, rattaProduktlankar } from "./interna-lankar.ts";

describe("rattaProduktlankar", () => {
  it("skriver om den absoluta Wix-formen till produktsidan", () => {
    const html = '<p><a href="https://www.fyndplats.se/product-page/varmeflakt-torn-vit-63-5-cm" target="_self">Vårt andra värmetorn</a></p>';
    assert.equal(
      rattaProduktlankar(html),
      '<p><a href="https://www.fyndplats.se/produkt/varmeflakt-torn-vit-63-5-cm" target="_self">Vårt andra värmetorn</a></p>',
    );
  });

  it("håller en relativ länk relativ", () => {
    assert.equal(rattaProduktlankar('<a href="/product-page/klostrad-200-cm">x</a>'), '<a href="/produkt/klostrad-200-cm">x</a>');
  });

  it("rättar värden på samma gång: utan www och med http", () => {
    assert.equal(
      rattaProduktlankar('<a href="http://fyndplats.se/product-page/hundbur-pa-hjul">x</a>'),
      '<a href="https://www.fyndplats.se/produkt/hundbur-pa-hjul">x</a>',
    );
  });

  it("tar varje länk i texten, också med enkla citattecken och snedstreck sist", () => {
    const html = "<a href='/product-page/a-1/'>a</a> och <a href=\"/product-page/b-2\">b</a>";
    assert.equal(rattaProduktlankar(html), "<a href='/produkt/a-1'>a</a> och <a href=\"/produkt/b-2\">b</a>");
    assert.equal(raknaWixLankar(rattaProduktlankar(html)), 0);
  });

  it("behåller fråga och ankare", () => {
    assert.equal(
      rattaProduktlankar('<a href="/product-page/tradgardsskap-77-cm?variant=abc#matt">x</a>'),
      '<a href="/produkt/tradgardsskap-77-cm?variant=abc#matt">x</a>',
    );
  });

  it("lämnar undantagen: en gammal Wix-slug har ett eget mål", () => {
    const html = '<a href="/product-page/gammal-vara">x</a> <a href="/product-page/ny-vara">y</a>';
    assert.equal(
      rattaProduktlankar(html, (slug) => slug === "gammal-vara"),
      '<a href="/product-page/gammal-vara">x</a> <a href="/produkt/ny-vara">y</a>',
    );
  });

  it("rör inte en slug med å, ä, ö eller procentkodning", () => {
    for (const html of [
      '<a href="/product-page/%C3%A4ppelskalare-3-i-1">x</a>',
      '<a href="/product-page/äppelskalare">x</a>',
      '<a href="/product-page/Stor-Bokstav">x</a>',
    ]) {
      assert.equal(rattaProduktlankar(html), html);
    }
  });

  it("rör inte en annan sajt, löpande text eller redan rätta länkar", () => {
    for (const html of [
      '<a href="https://exempel.se/product-page/hundbur-pa-hjul">x</a>',
      '<a href="https://www.fyndplats.se.exempel.se/product-page/hundbur">x</a>',
      "<p>Adressen /product-page/hundbur-pa-hjul nämns i texten.</p>",
      '<a href="/produkt/hundbur-pa-hjul">x</a>',
      "",
    ]) {
      assert.equal(rattaProduktlankar(html), html);
    }
  });

  it("gör ingenting två gånger: en rättad text är oförändrad", () => {
    const en = rattaProduktlankar('<a href="https://www.fyndplats.se/product-page/a">x</a>');
    assert.equal(rattaProduktlankar(en), en);
  });
});

describe("raknaWixLankar", () => {
  it("räknar länkarna som finns kvar", () => {
    assert.equal(raknaWixLankar('<a href="/product-page/a">x</a><a href="https://www.fyndplats.se/product-page/b">y</a>'), 2);
    assert.equal(raknaWixLankar('<a href="/produkt/a">x</a>'), 0);
  });
});

describe("produktsidan använder regeln", () => {
  const kalla = readFileSync(join(import.meta.dirname, "products.ts"), "utf8");

  it("produkttexten skrivs om där den läses ur Wix", () => {
    assert.match(kalla, /prod\.descriptionHtml = rattaProduktlankar\(item\.description \|\| "", \(slug\) => GAMLA_WIX_SLUGGAR\.has\(slug\)\);/);
  });

  it("undantagen är samma lista som next.config.ts omdirigerar", () => {
    assert.match(kalla, /import gamlaWixMal from "\.\.\/data\/legacy-wix-redirects\.json";/);
    assert.match(kalla, /const GAMLA_WIX_SLUGGAR = new Set\(Object\.keys\(gamlaWixMal\)\);/);
    const config = readFileSync(join(import.meta.dirname, "..", "next.config.ts"), "utf8");
    assert.match(config, /data\/legacy-wix-redirects\.json/);
  });
});

// ── Länkar till produkter som har flyttat ─────────────────────────────────────
//
// ☠️ VARFÖR (2026-11-11). Semrush fann 166 länkar mellan produktsidor som gick
// till en omdirigering: "Samma vagn i svart" pekade på en sida som slagits ihop
// med en annan. Tolv av tolv stickprov stod kvar i sidornas HTML samma dag.

const TEXT =
  '<h2>Passar inte den här?</h2><p><a href="https://www.fyndplats.se/produkt/vagn-svart" target="_self">Samma vagn i svart</a>. ' +
  '<a href="https://www.fyndplats.se/produkt/vagn-bla" target="_self">Samma vagn i blått</a>. ' +
  '<a href="/kategori/verktygsvagnar">Alla vagnar</a> och <a href="https://example.com/produkt/annan">en annan sajt</a>.</p>';

describe("produktlankarIText", () => {
  it("ger sluggarna för butikens egna produktlänkar, en gång var", () => {
    assert.deepEqual(produktlankarIText(TEXT + TEXT), ["vagn-svart", "vagn-bla"]);
  });

  it("tar relativa länkar, enkla citattecken, fråga och ankare", () => {
    assert.deepEqual(
      produktlankarIText("<a href='/produkt/a-1?variant=x'>a</a> <a href=\"/produkt/b-2/#recensioner\">b</a>"),
      ["a-1", "b-2"],
    );
  });

  it("en annan sajts /produkt/ är inte vår länk", () => {
    assert.deepEqual(produktlankarIText('<a href="https://example.com/produkt/annan">x</a>'), []);
  });

  it("tom text och text utan länkar ger inget", () => {
    assert.deepEqual(produktlankarIText(""), []);
    assert.deepEqual(produktlankarIText("<p>Inga länkar. Ordet /produkt/ i löptext räknas inte.</p>"), []);
  });
});

describe("flyttaProduktlankar", () => {
  it("byter adressen mot målet och låter resten av texten stå", () => {
    const ut = flyttaProduktlankar(TEXT, new Map([["vagn-svart", "/produkt/vagn-stal-fem-lador?variant=11111111-2222-4333-8444-555555555555"]]));
    assert.ok(ut.includes('<a href="https://www.fyndplats.se/produkt/vagn-stal-fem-lador?variant=11111111-2222-4333-8444-555555555555" target="_self">Samma vagn i svart</a>'));
    assert.ok(ut.includes('href="https://www.fyndplats.se/produkt/vagn-bla"'), "en länk utan mål står kvar");
    assert.ok(ut.includes('href="https://example.com/produkt/annan"'), "en annan sajt rörs aldrig");
    assert.equal(ut.length - TEXT.length, "/produkt/vagn-stal-fem-lador?variant=11111111-2222-4333-8444-555555555555".length - "/produkt/vagn-svart".length);
  });

  it("en relativ länk förblir relativ, och målet får vara en kategori", () => {
    assert.equal(
      flyttaProduktlankar('<a href="/produkt/borta">x</a>', new Map([["borta", "/kategori/verktygsvagnar"]])),
      '<a href="/kategori/verktygsvagnar">x</a>',
    );
  });

  it("den gamla länkens fråga och ankare följer inte med: målet bär sitt eget val", () => {
    assert.equal(
      flyttaProduktlankar('<a href="/produkt/gammal?variant=abc#x">x</a>', new Map([["gammal", "/produkt/ny?variant=def"]])),
      '<a href="/produkt/ny?variant=def">x</a>',
    );
  });

  it("☠️ ett mål som inte är en intern sökväg skrivs aldrig in", () => {
    const html = '<a href="/produkt/gammal">x</a>';
    for (const elakt of ["https://evil.example/x", "//evil.example/x", "produkt/ny", '/produkt/ny" onclick="x', "/produkt/ny onmouseover=x", ""]) {
      assert.equal(flyttaProduktlankar(html, new Map([["gammal", elakt]])), html, JSON.stringify(elakt));
    }
  });

  it("tom karta ändrar ingenting", () => {
    assert.equal(flyttaProduktlankar(TEXT, new Map()), TEXT);
  });
});

describe("medLevandeLankar", () => {
  const levande = (...slugs: string[]) => (s: string) => slugs.includes(s);

  it("slår bara upp länkar vars produkt inte finns, i ETT anrop", async () => {
    const anrop: string[][] = [];
    const ut = await medLevandeLankar(TEXT, levande("vagn-bla", "vagn-stal"), async (slugs) => {
      anrop.push(slugs);
      return new Map([["vagn-svart", "/produkt/vagn-stal?variant=v1"]]);
    });
    assert.deepEqual(anrop, [["vagn-svart"]]);
    assert.ok(ut.includes('href="https://www.fyndplats.se/produkt/vagn-stal?variant=v1"'));
    assert.ok(ut.includes('href="https://www.fyndplats.se/produkt/vagn-bla"'));
  });

  it("gör inget uppslag alls när varje länk går till en levande produkt", async () => {
    let anrop = 0;
    const ut = await medLevandeLankar(TEXT, levande("vagn-svart", "vagn-bla"), async () => {
      anrop++;
      return new Map();
    });
    assert.equal(anrop, 0);
    assert.equal(ut, TEXT);
  });

  it("följer ett mål som självt har flyttat, och landar på den levande sidan", async () => {
    const anrop: string[][] = [];
    const ut = await medLevandeLankar('<a href="/produkt/a">x</a>', levande("c"), async (slugs) => {
      anrop.push(slugs);
      const svar = new Map<string, string>();
      if (slugs.includes("a")) svar.set("a", "/produkt/b?variant=v1");
      if (slugs.includes("b")) svar.set("b", "/produkt/c");
      return svar;
    });
    assert.deepEqual(anrop, [["a"], ["b"]]);
    assert.equal(ut, '<a href="/produkt/c">x</a>');
  });

  it("☠️ ett mål som pekar på en produkt som inte finns skrivs inte in: hellre en omdirigering än en död länk", async () => {
    const html = '<a href="/produkt/a">x</a>';
    assert.equal(await medLevandeLankar(html, levande(), async () => new Map([["a", "/produkt/finns-inte"]])), html);
  });

  it("en kedja som går runt tar slut och lämnar länken som den var", async () => {
    const html = '<a href="/produkt/a">x</a>';
    let anrop = 0;
    const ut = await medLevandeLankar(html, levande(), async (slugs) => {
      anrop++;
      return new Map(slugs.map((s) => [s, s === "a" ? "/produkt/b" : "/produkt/a"] as const));
    });
    assert.ok(anrop <= 3, `högst tre uppslag, blev ${anrop}`);
    assert.equal(ut, html);
  });

  it("en länk utan omdirigering står kvar", async () => {
    assert.equal(await medLevandeLankar(TEXT, levande("vagn-bla"), async () => new Map()), TEXT);
  });

  it("☠️ kastar uppslaget ritas texten som den står: en trasig tabell fäller ingen produktsida", async () => {
    const ut = await medLevandeLankar(TEXT, levande(), async () => {
      throw new Error("Wix 503");
    });
    assert.equal(ut, TEXT);
  });

  it("slår upp högst MAX_FLYTTADE_LANKAR sluggar per text", async () => {
    const html = Array.from({ length: MAX_FLYTTADE_LANKAR + 5 }, (_, i) => `<a href="/produkt/p-${i}">x</a>`).join("");
    let fragade = 0;
    await medLevandeLankar(html, levande(), async (slugs) => {
      fragade = slugs.length;
      return new Map();
    });
    assert.equal(fragade, MAX_FLYTTADE_LANKAR);
  });

  it("tom text ger tom text utan uppslag", async () => {
    assert.equal(await medLevandeLankar("", levande(), async () => { throw new Error("ska inte anropas"); }), "");
  });
});

describe("produktsidan använder uppslaget", () => {
  const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");

  it("texten som ritas är den med levande länkar, och uppslaget cachas som sidan", () => {
    const sida = las("app", "produkt", "[slug]", "page.tsx");
    assert.match(sida, /const descriptionHtml = await medLevandeLankar\(/);
    assert.match(sida, /getProductRedirects\(slugs, revalidate\)/);
    // Texten med levande länkar går vidare genom styckedelningen (lib/stycken.ts)
    // och det är den som ritas, aldrig den råa texten.
    assert.match(sida, /const beskrivningHtml = delaLangaStyckenIHtml\(descriptionHtml\);/);
    assert.match(sida, /descriptionHtml=\{beskrivningHtml\}/);
    assert.doesNotMatch(sida, /descriptionHtml=\{p\.descriptionHtml\}/);
    assert.doesNotMatch(sida, /descriptionHtml=\{descriptionHtml\}/);
  });

  it("☠️ uppslaget för flera sluggar tar sidans egen giltighetstid, inte 300 sekunder", () => {
    const lib = las("lib", "redirects.ts");
    const fn = lib.slice(lib.indexOf("export async function getProductRedirects"));
    assert.match(fn, /next: \{ revalidate: giltigSek \}/);
    assert.match(fn, /fromSlug: \{ \$in: fraga \}/);
    assert.match(fn, /sanitizeRedirectTarget\(rad\.data\?\.toPath\)/);
  });
});

