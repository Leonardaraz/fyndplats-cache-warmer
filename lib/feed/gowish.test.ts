// GoWish-flödet: Google-flödet med EAN, frakt och utan kampanjetiketter.
// Kör: node --test --experimental-strip-types lib/feed/gowish.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gowishItem, gowishRakning, tillGowish, type GowishShipping } from "./gowish.ts";

const S: GowishShipping = {
  standardKr: 19,
  freeFromKr: 499,
  service: "Spårbar frakt",
  minTransitDays: 3,
  maxTransitDays: 6,
};

function item(o: { id: string; price?: string; sale?: string; stock?: string; labels?: boolean }): string {
  return `<item>
      <g:id>${o.id}</g:id>
      <g:item_group_id>grupp-${o.id}</g:item_group_id>
      <g:title>Vara ${o.id}</g:title>
      <g:link>https://www.fyndplats.se/produkt/vara-${o.id}</g:link>
      <g:availability>${o.stock ?? "in_stock"}</g:availability>${o.price === "" ? "" : `\n      <g:price>${o.price ?? "299.00"} SEK</g:price>`}${o.sale ? `\n      <g:sale_price>${o.sale} SEK</g:sale_price>` : ""}
      <g:brand>Fyndplats</g:brand>
      <g:condition>new</g:condition>${o.labels ? `\n      <g:custom_label_0>200_500</g:custom_label_0>\n      <g:custom_label_1>kampanj</g:custom_label_1>` : ""}
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
${items.map((i) => `    ${i}`).join("\n")}
  </channel>
</rss>`;
}

describe("gowishItem", () => {
  it("behåller ordinarie pris och reapris som Google har dem", () => {
    const ut = gowishItem(item({ id: "a", price: "1719.00", sale: "1539.00" }), S)!;
    assert.match(ut, /<g:price>1719\.00 SEK<\/g:price>/);
    assert.match(ut, /<g:sale_price>1539\.00 SEK<\/g:sale_price>/);
  });

  it("behåller en slutsåld vara med sin lagerstatus", () => {
    const ut = gowishItem(item({ id: "a", stock: "out_of_stock" }), S)!;
    assert.match(ut, /<g:availability>out_of_stock<\/g:availability>/);
  });

  it("frakten räknas på priset kunden betalar: reapriset när det finns", () => {
    const fraktI = (x: string) => x.match(/<g:shipping>[\s\S]*?<g:price>([\d.]+) SEK/)![1];
    assert.equal(fraktI(gowishItem(item({ id: "a", price: "299.00" }), S)!), "19.00");
    assert.equal(fraktI(gowishItem(item({ id: "a", price: "499.00" }), S)!), "0.00");
    assert.equal(fraktI(gowishItem(item({ id: "a", price: "549.00", sale: "449.00" }), S)!), "19.00");
    const ut = gowishItem(item({ id: "a" }), S)!;
    assert.match(ut, /<g:country>SE<\/g:country>\s*<g:service>Spårbar frakt<\/g:service>/);
    assert.match(ut, /<g:min_transit_time>3<\/g:min_transit_time>\s*<g:max_transit_time>6<\/g:max_transit_time>/);
  });

  it("Googles kampanjetiketter tas bort", () => {
    const ut = gowishItem(item({ id: "a", labels: true }), S)!;
    assert.doesNotMatch(ut, /custom_label/);
  });

  it("en kod skrivs som g:gtin, och identifier_exists=no tas bort", () => {
    const ut = gowishItem(item({ id: "a" }), S, "4011394259708")!;
    assert.match(ut, /<g:gtin>4011394259708<\/g:gtin>/);
    assert.doesNotMatch(ut, /identifier_exists/);
  });

  it("utan kod står identifier_exists=no kvar, och ingen g:gtin skrivs", () => {
    const ut = gowishItem(item({ id: "a" }), S)!;
    assert.match(ut, /<g:identifier_exists>no<\/g:identifier_exists>/);
    assert.doesNotMatch(ut, /<g:gtin>/);
  });

  it("något annat än 13 siffror skrivs aldrig som kod", () => {
    for (const fel of ["", "123", "401139425970", "40113942597081", "40113942597O8", "4011394259708 "]) {
      const ut = gowishItem(item({ id: "a" }), S, fel)!;
      assert.doesNotMatch(ut, /<g:gtin>/, fel);
      assert.match(ut, /identifier_exists/, fel);
    }
  });

  it("en rad utan pris, eller med priset noll, faller bort", () => {
    assert.equal(gowishItem(item({ id: "a", price: "" }), S), null);
    assert.equal(gowishItem(item({ id: "a", price: "0.00" }), S), null);
  });

  it("raden slutar med </item> på egen rad och är i övrigt orörd", () => {
    const in_ = item({ id: "a" });
    const ut = gowishItem(in_, S)!;
    assert.match(ut, /<\/g:shipping>\n    <\/item>$/);
    assert.ok(ut.startsWith(in_.slice(0, in_.indexOf("<g:identifier_exists>"))));
    assert.match(ut, /<g:link>https:\/\/www\.fyndplats\.se\/produkt\/vara-a<\/g:link>/);
    assert.match(ut, /<g:brand>Fyndplats<\/g:brand>/);
  });
});

describe("tillGowish", () => {
  const google = feed([
    item({ id: "a", price: "1719.00", sale: "1539.00", labels: true }),
    item({ id: "b", stock: "out_of_stock" }),
    item({ id: "c", price: "" }),
    item({ id: "d" }),
  ]);
  const ut = tillGowish(google, S, new Map([["a", "4011394259708"], ["d", "inte-en-kod"]]));

  it("alla varor med pris är med, också den slutsålda", () => {
    assert.deepEqual(gowishRakning(ut), { varor: 3, iLager: 2, gtin: 1, rea: 1 });
    assert.deepEqual([...ut.matchAll(/<g:id>([^<]+)<\/g:id>/g)].map((m) => m[1]), ["a", "b", "d"]);
  });

  it("koden hamnar på rätt vara", () => {
    const a = ut.match(/<item>[\s\S]*?<\/item>/g)!.find((i) => i.includes("<g:id>a</g:id>"))!;
    assert.match(a, /<g:gtin>4011394259708<\/g:gtin>/);
  });

  it("kanalens beskrivning säger GoWish, och resten av huvudet är Google-flödets", () => {
    assert.match(ut, /<description>Fyndplats produktkatalog för GoWish – /);
    assert.doesNotMatch(ut, /Merchant Center/);
    assert.ok(ut.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>'));
    assert.match(ut, /<title>Fyndplats<\/title>\s*<link>https:\/\/www\.fyndplats\.se<\/link>/);
    assert.ok(ut.endsWith("  </channel>\n</rss>"));
  });

  it("utan koder blir flödet Google-flödet med frakt och utan etiketter", () => {
    const utan = tillGowish(google, S);
    assert.equal(gowishRakning(utan).gtin, 0);
    assert.equal(utan.split("<g:identifier_exists>no</g:identifier_exists>").length - 1, 3);
    assert.equal(utan.split("<g:shipping>").length - 1, 3);
  });
});

// Byggaren går inte att ladda här (den importerar med @/), så provet läser källan.
describe("☠️ GoWish-flödet får EAN-kartan FLODE_GTIN och är inlagt överallt", () => {
  const ROT = join(import.meta.dirname, "..", "..");
  const kod = (rel: string) =>
    readFileSync(join(ROT, rel), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  it("byggaren väljer koderna ur FLODE_GTIN, samma urval som PriceRunner", () => {
    const t = kod("lib/feed/harledda.ts");
    assert.match(t, /import \{ gowishRakning, tillGowish \} from "@\/lib\/feed\/gowish";/);
    assert.match(t, /tillGowish\(\s*googleXml,[\s\S]*?\},\s*gtinUrval\(googleXml, FLODE_GTIN\),?\s*\)/);
  });

  it("rutten bygger med gowishXml ur Google-flödet och har en HEAD som aldrig bygger", () => {
    const t = kod("app/feed/gowish.xml/route.ts");
    assert.match(t, /const FIL = "gowish\.xml";/);
    assert.match(t, /gowishXml\(await \(await googleFeed\(\)\)\.text\(\)\)/);
    const head = t.slice(t.indexOf("export async function HEAD"));
    assert.match(head, /huvudsvar\(/);
    assert.doesNotMatch(head, /googleFeed\(|gowishXml\(/);
  });

  it("flödet står i alla listor: komprimerade, sparade, omskrivningen, värmningen, byggarna och jobbet", () => {
    assert.match(kod("lib/feed/prisjakt-svar.ts"), /KOMPRIMERADE_FLODEN = \[[^\]]*"gowish\.xml"[^\]]*\] as const/);
    assert.match(kod("lib/feed/flodeslager.ts"), /LAGRADE_FLODEN = \[[^\]]*"gowish\.xml"[^\]]*\] as const/);
    assert.match(kod("next.config.ts"), /komprimeradeFloden = \[[^\]]*"gowish\.xml"[^\]]*\]/);
    assert.match(kod("lib/flodesvarmning.ts"), /"\/feed\/gowish\.xml",/);
    assert.match(kod("lib/feed/byggare.ts"), /"gowish\.xml": \(\) => gowish\(\),/);
    assert.match(kod("app/api/cron/farska-floden/route.ts"), /"gowish\.xml": gowishXml,/);
  });

  it("Google-flödet läser fortfarande ingen EAN-karta", () => {
    assert.doesNotMatch(kod("app/feed/google.xml/route.ts"), /FLODE_GTIN|gtinUrval|tillGowish/);
  });
});
