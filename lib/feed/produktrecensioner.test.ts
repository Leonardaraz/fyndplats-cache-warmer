import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { byggRecensionsflode, flodesId, produkterUrGoogleflodet, type EgetOmdome } from "./produktrecensioner.ts";

const GOOGLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <item>
      <g:id>v1</g:id>
      <g:item_group_id>p1</g:item_group_id>
      <g:title>Soffa &amp; fåtölj i beige</g:title>
      <g:link>https://www.fyndplats.se/produkt/soffa</g:link>
    </item>
    <item>
      <g:id>v2</g:id>
      <g:item_group_id>p1</g:item_group_id>
      <g:title>Soffa &amp; fåtölj i grått</g:title>
      <g:link>https://www.fyndplats.se/produkt/soffa</g:link>
    </item>
    <item>
      <g:id>v3</g:id>
      <g:item_group_id>p2</g:item_group_id>
      <g:title>Lampa</g:title>
      <g:link>https://www.fyndplats.se/produkt/lampa</g:link>
    </item>
  </channel>
</rss>`;

const OPTS = { butik: "Fyndplats", favicon: "https://www.fyndplats.se/favicon.ico", varumarke: "Fyndplats" };

function omdome(o: Partial<EgetOmdome> = {}): EgetOmdome {
  return { productId: "p1", reviewIdAE: "kund-o1-p1", rating: 5, text: "Snabb leverans, bra soffa.", initials: "M.K.", date: "2026-09-20T10:00:00.000Z", ...o };
}

describe("produkterUrGoogleflodet", () => {
  it("samlar varianternas id per produkt, första radens titel och länk", () => {
    const m = produkterUrGoogleflodet(GOOGLE);
    assert.deepEqual(m.get("p1"), { skus: ["v1", "v2"], name: "Soffa & fåtölj i beige", url: "https://www.fyndplats.se/produkt/soffa" });
    assert.deepEqual(m.get("p2")?.skus, ["v3"]);
  });
});

describe("byggRecensionsflode", () => {
  const produkter = produkterUrGoogleflodet(GOOGLE);

  it("ger ett giltigt 2.4-flöde med alla fält Google kräver", () => {
    const { xml, antal, bortfall } = byggRecensionsflode([omdome()], produkter, OPTS);
    assert.equal(antal, 1);
    assert.deepEqual(bortfall, []);
    assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<feed /);
    assert.match(xml, /product_reviews\.xsd/);
    assert.match(xml, /<version>2\.4<\/version>/);
    for (const falt of ["review_id", "reviewer", "review_timestamp", "content", "review_url", "ratings", "products", "collection_method"]) {
      assert.match(xml, new RegExp(`<${falt}[ >]`), falt);
    }
    assert.match(xml, /<review_timestamp>2026-09-20T10:00:00\.000Z<\/review_timestamp>/);
    assert.match(xml, /<overall min="1" max="5">5<\/overall>/);
    assert.match(xml, /<sku>v1<\/sku>\n\s*<sku>v2<\/sku>/);
    assert.match(xml, /<brand>Fyndplats<\/brand>/);
    assert.match(xml, /<collection_method>post_fulfillment<\/collection_method>/);
    assert.match(xml, /<product_name>Soffa &amp; fåtölj i beige<\/product_name>/);
  });

  it("☠️ alla betyg följer med — även de dåliga", () => {
    const { xml, antal } = byggRecensionsflode(
      [omdome({ reviewIdAE: "a", rating: 1 }), omdome({ reviewIdAE: "b", rating: 2 }), omdome({ reviewIdAE: "c", rating: 5 })],
      produkter,
      OPTS,
    );
    assert.equal(antal, 3);
    assert.match(xml, /max="5">1</);
    assert.match(xml, /max="5">2</);
  });

  it("en trasig rad fäller inte flödet — den redovisas och resten följer med", () => {
    const trasig = { productId: "p1", reviewIdAE: "t", rating: 4, date: "2026-09-20T10:00:00Z" } as unknown as EgetOmdome;
    const utanInitialer = { ...omdome({ reviewIdAE: "u" }), initials: undefined } as unknown as EgetOmdome;
    const { antal, bortfall, xml } = byggRecensionsflode([trasig, utanInitialer, omdome({ reviewIdAE: "ok" })], produkter, OPTS);
    assert.equal(antal, 2);
    assert.deepEqual(bortfall, [{ reviewIdAE: "t", skal: "saknar_text" }]);
    assert.match(xml, /is_anonymous="true"/);
  });

  it("utan initialer blir recensenten anonym, aldrig ett namn vi hittar på", () => {
    const { xml } = byggRecensionsflode([omdome({ initials: "" })], produkter, OPTS);
    assert.match(xml, /<name is_anonymous="true">Verifierad köpare<\/name>/);
  });

  it("escapar text och tar bort styrtecken som fäller XML", () => {
    const { xml } = byggRecensionsflode([omdome({ text: 'Bra <3 & "prisvärd"\u0007' })], produkter, OPTS);
    assert.match(xml, /<content>Bra &lt;3 &amp; &quot;prisvärd&quot;<\/content>/);
  });

  it("redovisar bortfall i stället för att tappa tyst", () => {
    const { antal, bortfall } = byggRecensionsflode(
      [omdome({ reviewIdAE: "x", productId: "finns-inte" }), omdome({ reviewIdAE: "y", date: undefined }), omdome({ reviewIdAE: "z", date: "igår" })],
      produkter,
      OPTS,
    );
    assert.equal(antal, 0);
    assert.deepEqual(bortfall, [
      { reviewIdAE: "x", skal: "okand_produkt" },
      { reviewIdAE: "y", skal: "saknar_datum" },
      { reviewIdAE: "z", skal: "saknar_datum" },
    ]);
  });

  it("☠️ ordernumret i motorns id följer inte med — stabil hash i stället", () => {
    const { xml } = byggRecensionsflode([omdome({ reviewIdAE: "kund-10025-p1" })], produkter, OPTS);
    assert.doesNotMatch(xml, /10025/);
    assert.match(xml, new RegExp(`<review_id>${flodesId("kund-10025-p1")}</review_id>`));
    assert.equal(flodesId("kund-10025-p1"), flodesId("kund-10025-p1"));
    assert.notEqual(flodesId("kund-10025-p1"), flodesId("kund-10026-p1"));
  });

  it("☠️ inga leverantörsnamn eller rånamn kan följa med — bara fälten vi skickar in", () => {
    const { xml } = byggRecensionsflode([omdome()], produkter, OPTS);
    assert.doesNotMatch(xml, /aosom|aliexpress/i);
  });
});
