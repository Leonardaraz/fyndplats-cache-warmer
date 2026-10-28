import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  begransaFarger,
  fraktFor,
  giltigtGtin13,
  giltigtMarke,
  giltigtMpn,
  giltigtPrisjaktId,
  prisjaktItem,
  prisjaktTider,
  tillPrisjakt,
  type PrisjaktArtiklar,
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
  group?: string;
  price: string;
  sale?: string;
  stock?: string;
  labels?: boolean;
  size?: string;
  description?: string;
  color?: string;
}): string {
  return `    <item>
      <g:id>${opts.id ?? ID}</g:id>
      <g:item_group_id>${opts.group ?? "51611305-d9e4-431f-8322-74cccc086cf7"}</g:item_group_id>
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
      <g:color>${opts.color ?? "Ekdekor"}</g:color>${opts.size ? `\n      <g:size>${opts.size}</g:size>` : ""}
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
    assert.match(out, /<g:shipping><g:country>SE<\/g:country><g:service>Spårbar frakt<\/g:service><g:price>19\.00 SEK<\/g:price>/);
    assert.match(out, /<g:min_handling_time>1<\/g:min_handling_time>/);
    assert.match(out, /<g:max_handling_time>2<\/g:max_handling_time>/);
    assert.match(out, /<g:min_transit_time>2<\/g:min_transit_time>/);
    assert.match(out, /<g:max_transit_time>4<\/g:max_transit_time>/);
    assert.match(out, /<\/g:shipping><\/item>$/);
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
    assert.match(out, /<g:availability>in_stock<\/g:availability><g:price>449\.00 SEK<\/g:price>/);
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
    for (const tag of ["id", "item_group_id", "title", "description", "link", "image_link", "brand", "condition", "color", "product_type", "google_product_category"]) {
      assert.match(out, new RegExp(`<g:${tag}>`), tag);
    }
    assert.match(out, /<g:product_type>Möbler &gt; Sovrum<\/g:product_type>/);
  });

  it("extrabilderna tas bort, huvudbilden står kvar", () => {
    const out = prisjaktItem(item({ price: "249.00" }).trim(), S)!;
    assert.doesNotMatch(out, /additional_image_link/);
    assert.match(out, /<g:image_link>https:\/\/static\.wixstatic\.com\/media\/a\.jpg<\/g:image_link>/);
  });

  it("varan skrivs på en rad utan indrag, men texten i fälten rörs inte", () => {
    const out = prisjaktItem(item({ price: "249.00", description: "Mått  40 &gt; 30 cm , två  mellanslag " }).trim(), S)!;
    assert.doesNotMatch(out, /\n/);
    assert.doesNotMatch(out, />\s+</);
    assert.match(out, /<g:description>Mått  40 &gt; 30 cm , två  mellanslag <\/g:description>/);
    assert.match(out, /^<item><g:id>/);
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
    assert.ok(out.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:pj="https://schema.prisjakt.nu/ns/1.0">\n  <channel>'));
    assert.match(out, /<title>Fyndplats<\/title>/);
    assert.match(out, /<description>[^<]*Prisjakt[^<]*<\/description>/);
    assert.doesNotMatch(out, /Merchant Center/);
    assert.equal(out.match(/<item>/g)?.length, 2);
    assert.match(out, /<g:id>a1<\/g:id>/);
    assert.doesNotMatch(out, /<g:id>b2<\/g:id>/);
    assert.match(out, /<g:price>699\.00 SEK<\/g:price>/);
    assert.equal(out.match(/<g:shipping>/g)?.length, 2);
    assert.ok(out.endsWith("</item>\n  </channel>\n</rss>"));
  });

  it("Prisjakts namnrymd läggs till en gång", () => {
    const en = tillPrisjakt(feed([item({ price: "249.00" })]), S);
    assert.equal(en.match(/xmlns:pj=/g)?.length, 1);
    assert.equal(tillPrisjakt(en, S).match(/xmlns:pj=/g)?.length, 1);
  });

  it("en vara per rad, så att flödet håller sig under CDN:ens 10 MB", () => {
    const out = tillPrisjakt(feed([item({ id: "a1", price: "249.00" }), item({ id: "c3", price: "899.00" })]), S);
    const rader = out.split("\n").filter((r) => r.includes("<item>"));
    assert.equal(rader.length, 2);
    assert.ok(rader.every((r) => r.startsWith("<item>") && r.endsWith("</item>")));
  });

  it("tom Google-feed ger en giltig tom feed", () => {
    const out = tillPrisjakt(feed([]), S);
    assert.match(out, /<channel>[\s\S]*<\/channel>\n<\/rss>$/);
    assert.equal(out.match(/<item>/g), null);
  });
});

describe("giltigtGtin13", () => {
  it("godtar en kod med rätt kontrollsiffra", () => {
    assert.equal(giltigtGtin13("4006381333931"), true);
  });

  it("nekar fel kontrollsiffra, fel längd och allt som inte är siffror", () => {
    assert.equal(giltigtGtin13("4006381333932"), false); // sista siffran fel
    assert.equal(giltigtGtin13("400638133393"), false); // tolv siffror
    assert.equal(giltigtGtin13("40063813339311"), false); // fjorton siffror
    assert.equal(giltigtGtin13("40063813339a1"), false);
    assert.equal(giltigtGtin13(" 4006381333931"), false);
    assert.equal(giltigtGtin13(""), false);
  });
});

describe("prisjaktItem med GTIN", () => {
  it("lägger g:gtin precis före frakten när koden är giltig", () => {
    const out = prisjaktItem(item({ price: "249.00" }).trim(), S, "4006381333931")!;
    assert.match(out, /<g:gtin>4006381333931<\/g:gtin><g:shipping>/);
    assert.equal(out.match(/<g:gtin>/g)?.length, 1);
  });

  it("utelämnar koden när kontrollsiffran är fel", () => {
    const out = prisjaktItem(item({ price: "249.00" }).trim(), S, "4006381333932")!;
    assert.doesNotMatch(out, /gtin/);
  });
});

describe("tillPrisjakt med GTIN-karta", () => {
  const GRUPP_A = "11111111-1111-4111-8111-111111111111";
  const GRUPP_B = "22222222-2222-4222-8222-222222222222";
  const KOD = "4006381333931";
  const A = item({ id: "a1", group: GRUPP_A, price: "249.00" });
  const B = item({ id: "b2", group: GRUPP_B, price: "399.00" });
  const radFor = (xml: string, id: string) => xml.split("\n").find((r) => r.includes(`<g:id>${id}</g:id>`)) ?? "";

  it("koden hamnar på varan som är ensam i sin produktgrupp, och bara på den", () => {
    const out = tillPrisjakt(feed([A, B]), S, { a1: KOD });
    assert.match(radFor(out, "a1"), new RegExp(`<g:gtin>${KOD}</g:gtin>`));
    assert.doesNotMatch(radFor(out, "b2"), /gtin/);
  });

  it("ingen kod om produkten har fler varianter, även när syskonet är slutsåld och inte syns i flödet", () => {
    const syskon = item({ id: "a2", group: GRUPP_A, price: "249.00", stock: "out_of_stock" });
    const out = tillPrisjakt(feed([A, syskon]), S, { a1: KOD });
    assert.match(out, /<g:id>a1<\/g:id>/);
    assert.doesNotMatch(out, /gtin/);
  });

  it("ingen kod om samma kod står på två varor i kartan", () => {
    const out = tillPrisjakt(feed([A, B]), S, { a1: KOD, b2: KOD });
    assert.doesNotMatch(out, /gtin/);
  });

  it("en kod med fel kontrollsiffra kommer aldrig med", () => {
    const out = tillPrisjakt(feed([A]), S, { a1: "4006381333932" });
    assert.doesNotMatch(out, /gtin/);
  });

  it("ett id i kartan som inte finns i flödet ändrar ingenting", () => {
    assert.equal(tillPrisjakt(feed([A, B]), S, { "finns-inte": KOD }), tillPrisjakt(feed([A, B]), S));
  });

  it("utan karta är flödet som förut, utan en enda g:gtin", () => {
    assert.doesNotMatch(tillPrisjakt(feed([A, B]), S), /gtin/);
    assert.equal(tillPrisjakt(feed([A, B]), S, {}), tillPrisjakt(feed([A, B]), S));
  });
});

describe("begransaFarger", () => {
  it("behåller de tre första färgerna", () => {
    assert.equal(begransaFarger("Rosa/gul/grön/lila"), "Rosa/gul/grön");
    assert.equal(begransaFarger("Svart / Vit / Grå / Röd"), "Svart/Vit/Grå");
  });

  it("lämnar tre färger eller färre tecken för tecken", () => {
    for (const f of ["Ekdekor", "Svart och vit", "Röd/gul/blå", "Svart / Vit", ""]) assert.equal(begransaFarger(f), f);
  });
});

describe("prisjaktItem: färgen", () => {
  it("g:color får högst tre färger", () => {
    const out = prisjaktItem(item({ price: "249.00", color: "Röd/grön/blå/gul" }).trim(), S)!;
    assert.match(out, /<g:color>Röd\/grön\/blå<\/g:color>/);
  });

  it("en färg rörs inte", () => {
    const out = prisjaktItem(item({ price: "249.00" }).trim(), S)!;
    assert.match(out, /<g:color>Ekdekor<\/g:color>/);
  });
});

// Påhittade artikelnummer (TEST-…). Riktiga får aldrig stå i repot.
describe("giltigtMpn och giltigtMarke", () => {
  it("ett artikelnummer är bokstäver, siffror och bindestreck", () => {
    assert.equal(giltigtMpn("TEST-0001"), true);
    for (const f of ["", "A", "-TEST", "TEST 1", "TEST<1>", "TEST&1", "x".repeat(41)]) assert.equal(giltigtMpn(f), false, f);
  });

  it("ett märke är kort text utan XML-tecken", () => {
    assert.equal(giltigtMarke("HOMCOM"), true);
    assert.equal(giltigtMarke("kleankin"), true);
    for (const f of [null, undefined, "", " HOMCOM", "A<B", "A&B", "a".repeat(71)]) assert.equal(giltigtMarke(f), false, String(f));
  });
});

describe("prisjaktItem med artikel (bara den hemliga adressen)", () => {
  it("g:mpn före koden och frakten, och varans märke i stället för Fyndplats", () => {
    const out = prisjaktItem(item({ price: "249.00" }).trim(), S, "4006381333931", { mpn: "TEST-0001", marke: "HOMCOM" })!;
    assert.match(out, /<g:mpn>TEST-0001<\/g:mpn><g:gtin>4006381333931<\/g:gtin><g:shipping>/);
    assert.match(out, /<g:brand>HOMCOM<\/g:brand>/);
    assert.doesNotMatch(out, /Fyndplats<\/g:brand>/);
    assert.equal(out.match(/<g:brand>/g)?.length, 1);
  });

  it("utan säkert märke står Fyndplats kvar, men numret följer med", () => {
    const out = prisjaktItem(item({ price: "249.00" }).trim(), S, undefined, { mpn: "TEST-0001", marke: null })!;
    assert.match(out, /<g:mpn>TEST-0001<\/g:mpn>/);
    assert.match(out, /<g:brand>Fyndplats<\/g:brand>/);
  });

  it("ett ogiltigt nummer skrivs inte, och då byts inte märket heller", () => {
    const out = prisjaktItem(item({ price: "249.00" }).trim(), S, undefined, { mpn: "TEST<1>", marke: "HOMCOM" })!;
    assert.doesNotMatch(out, /mpn/);
    assert.match(out, /<g:brand>Fyndplats<\/g:brand>/);
  });

  it("ett ogiltigt märke skrivs inte", () => {
    const out = prisjaktItem(item({ price: "249.00" }).trim(), S, undefined, { mpn: "TEST-0001", marke: "<script>" })!;
    assert.match(out, /<g:brand>Fyndplats<\/g:brand>/);
  });
});

describe("tillPrisjakt med artiklar", () => {
  const GRUPP_A = "11111111-1111-4111-8111-111111111111";
  const GRUPP_B = "22222222-2222-4222-8222-222222222222";
  const A = item({ id: "a1", group: GRUPP_A, price: "249.00" });
  const B = item({ id: "b2", group: GRUPP_B, price: "399.00" });
  const radFor = (xml: string, id: string) => xml.split("\n").find((r) => r.includes(`<g:id>${id}</g:id>`)) ?? "";
  const tomma: PrisjaktArtiklar = { varianter: {}, produkter: {} };

  it("variantens nyckel ger numret och märket, och bara på den varianten", () => {
    const out = tillPrisjakt(feed([A, B]), S, {}, { varianter: { a1: { mpn: "TEST-0001", marke: "Outsunny" } }, produkter: {} });
    assert.match(radFor(out, "a1"), /<g:mpn>TEST-0001<\/g:mpn>/);
    assert.match(radFor(out, "a1"), /<g:brand>Outsunny<\/g:brand>/);
    assert.doesNotMatch(radFor(out, "b2"), /mpn/);
    assert.match(radFor(out, "b2"), /<g:brand>Fyndplats<\/g:brand>/);
  });

  it("produktens nyckel gäller bara en produkt med exakt en variant, slutsålda medräknade", () => {
    const art: PrisjaktArtiklar = { varianter: {}, produkter: { [GRUPP_A]: { mpn: "TEST-0002", marke: "PawHut" } } };
    assert.match(radFor(tillPrisjakt(feed([A, B]), S, {}, art), "a1"), /<g:mpn>TEST-0002<\/g:mpn>/);
    const syskon = item({ id: "a2", group: GRUPP_A, price: "249.00", stock: "out_of_stock" });
    assert.doesNotMatch(tillPrisjakt(feed([A, syskon]), S, {}, art), /mpn/);
  });

  it("variantens nyckel går före produktens", () => {
    const art: PrisjaktArtiklar = {
      varianter: { a1: { mpn: "TEST-0003", marke: null } },
      produkter: { [GRUPP_A]: { mpn: "TEST-0004", marke: null } },
    };
    assert.match(radFor(tillPrisjakt(feed([A]), S, {}, art), "a1"), /<g:mpn>TEST-0003<\/g:mpn>/);
  });

  it("utan artiklar, eller med tomma, är flödet exakt som förut", () => {
    assert.equal(tillPrisjakt(feed([A, B]), S, {}, tomma), tillPrisjakt(feed([A, B]), S));
    assert.doesNotMatch(tillPrisjakt(feed([A, B]), S), /mpn/);
  });
});
