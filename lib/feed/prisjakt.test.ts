import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fraktFor,
  giltigtPrisjaktId,
  prisjaktItem,
  prisjaktTider,
  tillPrisjakt,
  type PrisjaktShipping,
} from "./prisjakt.ts";

const S: PrisjaktShipping = {
  standardKr: 19,
  freeFromKr: 500,
  service: "Spårbar frakt",
  minDays: 3,
  maxDays: 6,
};

const ID = "08aa3fa3-aca2-4193-aba9-39ea0642225a";

function item(opts: {
  id?: string;
  price: string;
  sale?: string;
  stock?: string;
  labels?: boolean;
  size?: string;
  description?: string;
}): string {
  return `    <item>
      <g:id>${opts.id ?? ID}</g:id>
      <g:item_group_id>51611305-d9e4-431f-8322-74cccc086cf7</g:item_group_id>
      <g:title>Sängbord - Ekdekor</g:title>
      <g:description>${opts.description ?? "Vägghängt sängbord med låda."}</g:description>
      <g:link>https://www.fyndplats.se/produkt/sangbord?variant=${opts.id ?? ID}</g:link>
      <g:image_link>https://static.wixstatic.com/media/a.jpg</g:image_link>
      <g:additional_image_link>https://static.wixstatic.com/media/b.jpg</g:additional_image_link>
      <g:availability>${opts.stock ?? "in_stock"}</g:availability>
      <g:price>${opts.price} SEK</g:price>${opts.sale ? `\n      <g:sale_price>${opts.sale} SEK</g:sale_price>` : ""}
      <g:brand>Fyndplats</g:brand>
      <g:condition>new</g:condition>${opts.labels ? `\n      <g:custom_label_0>500_1000</g:custom_label_0>\n      <g:custom_label_1>kampanj-2026-09</g:custom_label_1>` : ""}
      <g:identifier_exists>no</g:identifier_exists>
      <g:color>Ekdekor</g:color>${opts.size ? `\n      <g:size>${opts.size}</g:size>` : ""}
      <g:product_type>Möbler &gt; Sovrum</g:product_type>
      <g:google_product_category>6356</g:google_product_category>
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

describe("prisjaktTider", () => {
  it("delar 3–6 arbetsdagar i hantering 1–2 och transport 2–4", () => {
    assert.deepEqual(prisjaktTider(3, 6), { minHandling: 1, maxHandling: 2, minTransit: 2, maxTransit: 4 });
  });

  it("summan blir alltid sajtens löfte och min ≤ max", () => {
    for (const [a, b] of [[3, 6], [2, 5], [1, 3], [4, 4], [0, 2]]) {
      const t = prisjaktTider(a, b);
      assert.equal(t.minHandling + t.minTransit, a);
      assert.equal(t.maxHandling + t.maxTransit, b);
      assert.ok(t.minHandling <= t.maxHandling && t.minTransit <= t.maxTransit);
      assert.ok(Object.values(t).every((v) => Number.isInteger(v) && v >= 0));
    }
  });
});

describe("fraktFor", () => {
  it("19 kr under 500, fri frakt från och med 500", () => {
    assert.equal(fraktFor(499, S), 19);
    assert.equal(fraktFor(500, S), 0);
    assert.equal(fraktFor(1099, S), 0);
  });
});

describe("giltigtPrisjaktId", () => {
  it("godtar Wix variant-id", () => {
    assert.equal(giltigtPrisjaktId(ID), true);
  });

  it("nekar tomt, för långt, blanksteg, icke-ASCII och förbjudna tecken", () => {
    assert.equal(giltigtPrisjaktId(""), false);
    assert.equal(giltigtPrisjaktId("a".repeat(37)), false);
    assert.equal(giltigtPrisjaktId("a b"), false);
    assert.equal(giltigtPrisjaktId("sängbord"), false);
    for (const c of "!@#$%^&*<>;:") assert.equal(giltigtPrisjaktId(`a${c}b`), false, c);
  });
});

describe("prisjaktItem", () => {
  it("frakten bär alla fyra tiderna, annars stryker Prisjakt dem", () => {
    const out = prisjaktItem(item({ price: "249.00" }).trim(), S)!;
    assert.match(out, /<g:shipping>\n        <g:country>SE<\/g:country>\n        <g:service>Spårbar frakt<\/g:service>\n        <g:price>19\.00 SEK<\/g:price>/);
    assert.match(out, /<g:min_handling_time>1<\/g:min_handling_time>/);
    assert.match(out, /<g:max_handling_time>2<\/g:max_handling_time>/);
    assert.match(out, /<g:min_transit_time>2<\/g:min_transit_time>/);
    assert.match(out, /<g:max_transit_time>4<\/g:max_transit_time>/);
    assert.match(out, /<\/g:shipping>\n    <\/item>$/);
  });

  it("fri frakt från 500 kr", () => {
    const out = prisjaktItem(item({ price: "1099.00" }).trim(), S)!;
    assert.match(out, /<g:shipping>[\s\S]*<g:price>0\.00 SEK<\/g:price>/);
  });

  it("rea: g:price blir priset kunden betalar och frakten räknas på det", () => {
    // Ordinarie 599 men rea 449 → kunden betalar 449, alltså 19 kr frakt.
    const out = prisjaktItem(item({ price: "599.00", sale: "449.00" }).trim(), S)!;
    assert.doesNotMatch(out, /sale_price/);
    assert.doesNotMatch(out, /599/);
    assert.match(out, /<g:availability>in_stock<\/g:availability>\n      <g:price>449\.00 SEK<\/g:price>/);
    assert.match(out, /<g:shipping>[\s\S]*<g:price>19\.00 SEK<\/g:price>/);
  });

  it("tar bort Google-etiketterna, identifier_exists och size", () => {
    const out = prisjaktItem(item({ price: "249.00", labels: true, size: "120 cm" }).trim(), S)!;
    assert.doesNotMatch(out, /custom_label/);
    assert.doesNotMatch(out, /identifier_exists/);
    assert.doesNotMatch(out, /<g:size>/);
    assert.doesNotMatch(out, /gtin|mpn/i);
  });

  it("behåller katalogens fält: id, grupp, länk, bilder, märke, färg och kategorier", () => {
    const out = prisjaktItem(item({ price: "249.00" }).trim(), S)!;
    for (const tag of ["id", "item_group_id", "title", "description", "link", "image_link", "additional_image_link", "brand", "condition", "color", "product_type", "google_product_category"]) {
      assert.match(out, new RegExp(`<g:${tag}>`), tag);
    }
    assert.match(out, /<g:product_type>Möbler &gt; Sovrum<\/g:product_type>/);
  });

  it("en tom beskrivning tas bort, för Prisjakt kräver minst ett tecken", () => {
    const out = prisjaktItem(item({ price: "249.00", description: "" }).trim(), S)!;
    assert.doesNotMatch(out, /<g:description>/);
  });

  it("hoppar över varor som inte finns i lager", () => {
    assert.equal(prisjaktItem(item({ price: "99.00", stock: "out_of_stock" }).trim(), S), null);
  });

  it("hoppar över rader med ett id Prisjakt inte godtar", () => {
    assert.equal(prisjaktItem(item({ id: "a b", price: "99.00" }).trim(), S), null);
  });

  it("hoppar över rader utan giltigt pris", () => {
    assert.equal(prisjaktItem(item({ price: "0.00" }).trim(), S), null);
  });
});

describe("tillPrisjakt", () => {
  it("behåller kanalens rubrik, byter beskrivning och filtrerar varorna", () => {
    const out = tillPrisjakt(
      feed([
        item({ id: "a1", price: "249.00" }),
        item({ id: "b2", price: "99.00", stock: "out_of_stock" }),
        item({ id: "c3", price: "899.00", sale: "699.00", labels: true }),
      ]),
      S,
    );
    assert.ok(out.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>'));
    assert.match(out, /<title>Fyndplats<\/title>/);
    assert.match(out, /<description>[^<]*Prisjakt[^<]*<\/description>/);
    assert.doesNotMatch(out, /Merchant Center/);
    assert.equal(out.match(/<item>/g)?.length, 2);
    assert.match(out, /<g:id>a1<\/g:id>/);
    assert.doesNotMatch(out, /<g:id>b2<\/g:id>/);
    assert.match(out, /<g:price>699\.00 SEK<\/g:price>/);
    assert.equal(out.match(/<g:shipping>/g)?.length, 2);
    assert.ok(out.endsWith("    </item>\n  </channel>\n</rss>"));
  });

  it("tom Google-feed ger en giltig tom feed", () => {
    const out = tillPrisjakt(feed([]), S);
    assert.match(out, /<channel>[\s\S]*<\/channel>\n<\/rss>$/);
    assert.equal(out.match(/<item>/g), null);
  });
});
