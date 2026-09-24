import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fraktFor, pricerunnerItem, tillPricerunner, type PricerunnerShipping } from "./pricerunner.ts";

const S: PricerunnerShipping = {
  standardKr: 19,
  freeFromKr: 499,
  service: "Spårbar frakt",
  minTransitDays: 3,
  maxTransitDays: 6,
};

function item(opts: { id: string; price: string; sale?: string; stock?: string; labels?: boolean }): string {
  return `    <item>
      <g:id>${opts.id}</g:id>
      <g:title>Vara ${opts.id}</g:title>
      <g:link>https://www.fyndplats.se/produkt/vara-${opts.id}</g:link>
      <g:availability>${opts.stock ?? "in_stock"}</g:availability>
      <g:price>${opts.price} SEK</g:price>${opts.sale ? `\n      <g:sale_price>${opts.sale} SEK</g:sale_price>` : ""}
      <g:brand>Fyndplats</g:brand>
      <g:condition>new</g:condition>${opts.labels ? `\n      <g:custom_label_0>200-499</g:custom_label_0>\n      <g:custom_label_1>kampanj-2026-09</g:custom_label_1>` : ""}
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
}

function feed(items: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Fyndplats</title>
    <link>https://www.fyndplats.se</link>
    <description>Fyndplats produktkatalog för Google Merchant Center – noga utvalda fynd till smarta priser.</description>
${items.join("\n")}
  </channel>
</rss>`;
}

describe("fraktFor", () => {
  it("19 kr under 499, fri frakt från och med 499", () => {
    assert.equal(fraktFor(498.99, S), 19);
    assert.equal(fraktFor(499, S), 0);
    assert.equal(fraktFor(1299, S), 0);
  });
});

describe("pricerunnerItem", () => {
  it("lägger frakt och leveranstid 3–6 dagar på varje vara", () => {
    const out = pricerunnerItem(item({ id: "a", price: "249.00" }).trim(), S)!;
    assert.match(out, /<g:shipping>[\s\S]*<g:country>SE<\/g:country>/);
    assert.match(out, /<g:service>Spårbar frakt<\/g:service>/);
    assert.match(out, /<g:shipping>[\s\S]*<g:price>19\.00 SEK<\/g:price>[\s\S]*<\/g:shipping>/);
    assert.match(out, /<g:min_transit_time>3<\/g:min_transit_time>/);
    assert.match(out, /<g:max_transit_time>6<\/g:max_transit_time>/);
    assert.match(out, /<\/g:shipping>\n    <\/item>$/);
  });

  it("rea: g:price blir priset kunden betalar och fri frakt räknas på det", () => {
    // Ordinarie 599 men rea 449 → kunden betalar 449, alltså 19 kr frakt.
    const out = pricerunnerItem(item({ id: "b", price: "599.00", sale: "449.00" }).trim(), S)!;
    assert.doesNotMatch(out, /sale_price/);
    assert.doesNotMatch(out, /599/);
    assert.match(out, /<g:availability>in_stock<\/g:availability>\n      <g:price>449\.00 SEK<\/g:price>/);
    assert.match(out, /<g:shipping>[\s\S]*<g:price>19\.00 SEK<\/g:price>/);
  });

  it("fri frakt när priset är minst 499", () => {
    const out = pricerunnerItem(item({ id: "c", price: "499.00" }).trim(), S)!;
    assert.match(out, /<g:shipping>[\s\S]*<g:price>0\.00 SEK<\/g:price>/);
  });

  it("tar bort Google Ads-etiketterna men behåller identifier_exists=no", () => {
    const out = pricerunnerItem(item({ id: "d", price: "99.00", labels: true }).trim(), S)!;
    assert.doesNotMatch(out, /custom_label/);
    assert.match(out, /<g:condition>new<\/g:condition>\n      <g:identifier_exists>no<\/g:identifier_exists>/);
    assert.doesNotMatch(out, /gtin|ean/i);
  });

  it("hoppar över varor som inte finns i lager", () => {
    assert.equal(pricerunnerItem(item({ id: "e", price: "99.00", stock: "out_of_stock" }).trim(), S), null);
  });
});

describe("tillPricerunner", () => {
  it("behåller kanalens rubrik, byter beskrivning och filtrerar varorna", () => {
    const out = tillPricerunner(
      feed([
        item({ id: "a", price: "249.00" }),
        item({ id: "b", price: "99.00", stock: "out_of_stock" }),
        item({ id: "c", price: "899.00", sale: "699.00", labels: true }),
      ]),
      S,
    );
    assert.ok(out.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>'));
    assert.match(out, /<title>Fyndplats<\/title>/);
    assert.match(out, /<description>[^<]*PriceRunner[^<]*<\/description>/);
    assert.doesNotMatch(out, /Merchant Center/);
    assert.equal(out.match(/<item>/g)?.length, 2);
    assert.match(out, /<g:id>a<\/g:id>/);
    assert.doesNotMatch(out, /<g:id>b<\/g:id>/);
    assert.match(out, /<g:price>699\.00 SEK<\/g:price>/);
    assert.ok(out.endsWith("    </item>\n  </channel>\n</rss>"));
  });

  it("tom Google-feed ger en giltig tom feed", () => {
    const out = tillPricerunner(feed([]), S);
    assert.match(out, /<channel>[\s\S]*<\/channel>\n<\/rss>$/);
    assert.equal(out.match(/<item>/g), null);
  });
});
