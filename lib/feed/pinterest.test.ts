import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  giltigtPinterestGtin,
  pinterestBild,
  pinterestRakning,
  pinterestTillganglighet,
  tillPinterest,
} from "./pinterest.ts";

const WIX = "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg";

const vara = (id: string, tillgang: string, extra: string[] = []) => `    <item>
      <g:id>${id}</g:id>
      <g:item_group_id>grupp-${id}</g:item_group_id>
      <g:title>Skobänk</g:title>
      <g:description>Text.</g:description>
      <g:link>https://www.fyndplats.se/produkt/skobank</g:link>
      <g:image_link>${WIX}</g:image_link>
${extra.map((u) => `      <g:additional_image_link>${u}</g:additional_image_link>`).join("\n")}
      <g:availability>${tillgang}</g:availability>
      <g:price>1639.00 SEK</g:price>
      <g:brand>Fyndplats</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;

const flode = (...varor: string[]) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Fyndplats</title>
    <link>https://www.fyndplats.se</link>
    <description>Fyndplats produktkatalog för Google Merchant Center – noga utvalda fynd till smarta priser.</description>
${varor.join("\n")}
  </channel>
</rss>
`;

describe("pinterestTillganglighet", () => {
  it("skriver Googles värden som Pinterest vill ha dem, med mellanslag", () => {
    assert.equal(pinterestTillganglighet("in_stock"), "in stock");
    assert.equal(pinterestTillganglighet("out_of_stock"), "out of stock");
    assert.equal(pinterestTillganglighet("preorder"), "preorder");
    assert.equal(pinterestTillganglighet("backorder"), "preorder");
    assert.equal(pinterestTillganglighet("in stock"), "in stock");
  });
});

describe("pinterestBild", () => {
  it("gör en Wix-adress med storlek till originalbilden, utan kommatecken", () => {
    assert.equal(pinterestBild(`${WIX}/v1/fit/w_2000,h_2000,q_90/file.jpg`), WIX);
    assert.equal(pinterestBild(WIX), WIX);
  });
  it("släpper en adress som ändå har kommatecken, eller inte är en webbadress", () => {
    assert.equal(pinterestBild("https://example.com/a,b.jpg"), null);
    assert.equal(pinterestBild(""), null);
    assert.equal(pinterestBild("bild.jpg"), null);
  });
});

describe("giltigtPinterestGtin", () => {
  it("godtar EAN-13 och UPC-A med rätt kontrollsiffra", () => {
    assert.equal(giltigtPinterestGtin("4006381333931"), true);
    assert.equal(giltigtPinterestGtin("036000291452"), true);
  });
  it("fäller fel kontrollsiffra, fel längd och annat än siffror", () => {
    assert.equal(giltigtPinterestGtin("4006381333932"), false);
    assert.equal(giltigtPinterestGtin("12345"), false);
    assert.equal(giltigtPinterestGtin("40063813339a1"), false);
  });
});

describe("tillPinterest", () => {
  it("rättar lagerstatus, extrabilder och identifier_exists, och lägger till g:gtin", () => {
    const xml = tillPinterest(
      flode(
        vara("a", "in_stock", [`${WIX}/v1/fit/w_2000,h_2000,q_90/file.jpg`, "https://static.wixstatic.com/media/b379ce_def~mv2.jpg/v1/fit/w_800,h_800,q_90/file.jpg"]),
        vara("b", "out_of_stock"),
      ),
      { a: "4006381333931", b: "4006381333932" },
    );
    assert.match(xml, /<g:availability>in stock<\/g:availability>/);
    assert.match(xml, /<g:availability>out of stock<\/g:availability>/);
    assert.doesNotMatch(xml, /in_stock|out_of_stock/);
    assert.doesNotMatch(xml, /identifier_exists/);
    assert.doesNotMatch(xml, /<g:additional_image_link>[^<]*,/);
    // Den första extrabilden är samma som huvudbilden och tas bort; den andra blir originalet.
    assert.deepEqual(
      [...xml.matchAll(/<g:additional_image_link>([^<]*)<\/g:additional_image_link>/g)].map((m) => m[1]),
      ["https://static.wixstatic.com/media/b379ce_def~mv2.jpg"],
    );
    // Rätt kod läggs till, en kod med fel kontrollsiffra aldrig.
    assert.match(xml, /<g:id>a<\/g:id>\n      <g:gtin>4006381333931<\/g:gtin>/);
    assert.equal((xml.match(/<g:gtin>/g) ?? []).length, 1);
    assert.match(xml, /produktkatalog för Pinterest – noga utvalda fynd/);
  });

  it("behåller varorna, ordningen och resten av raderna", () => {
    const google = flode(vara("a", "in_stock"), vara("b", "in_stock"), vara("c", "out_of_stock"));
    const xml = tillPinterest(google, {});
    assert.deepEqual([...xml.matchAll(/<g:id>([^<]*)<\/g:id>/g)].map((m) => m[1]), ["a", "b", "c"]);
    for (const rad of ["<g:price>1639.00 SEK</g:price>", "<g:brand>Fyndplats</g:brand>", "<g:condition>new</g:condition>"]) {
      assert.equal(xml.split(rad).length - 1, 3, rad);
    }
    assert.ok(xml.endsWith("</rss>\n"));
  });

  it("högst tio extrabilder", () => {
    const extra = Array.from({ length: 14 }, (_, i) => `https://static.wixstatic.com/media/b379ce_${i}~mv2.jpg`);
    const xml = tillPinterest(flode(vara("a", "in_stock", extra)), {});
    assert.equal(pinterestRakning(xml).extrabilder, 10);
  });

  it("ett tomt flöde förblir tomt, så att routen kan vägra skicka det", () => {
    const xml = tillPinterest(flode(), {});
    assert.equal(pinterestRakning(xml).varor, 0);
  });
});
