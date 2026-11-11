import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { raknaWixLankar, rattaProduktlankar } from "./interna-lankar.ts";

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
