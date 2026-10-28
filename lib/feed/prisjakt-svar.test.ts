import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisjaktRakning, strommatXml } from "./prisjakt-svar.ts";

async function lasAllt(strom: ReadableStream<Uint8Array>): Promise<{ text: string; bitar: number }> {
  const delar: Uint8Array[] = [];
  const r = strom.getReader();
  for (;;) {
    const { done, value } = await r.read();
    if (done) break;
    delar.push(value);
  }
  return { text: Buffer.concat(delar).toString("utf8"), bitar: delar.length };
}

describe("strommatXml", () => {
  it("ger exakt samma byte som strängen, i flera bitar", async () => {
    const xml = `<?xml version="1.0"?><rss>${"<item>Sängbord å ä ö – 499 kr</item>\n".repeat(5000)}</rss>`;
    const { text, bitar } = await lasAllt(strommatXml(xml));
    assert.equal(text, xml);
    assert.ok(bitar > 1, "svaret ska komma i flera bitar");
  });

  it("en tom sträng ger en tom ström", async () => {
    assert.equal((await lasAllt(strommatXml(""))).text, "");
  });

  it("ett svar med strömmen har ingen Content-Length", () => {
    const res = new Response(strommatXml("<rss/>"));
    assert.equal(res.headers.get("content-length"), null);
  });
});

describe("prisjaktRakning", () => {
  it("räknar varor, koder, nummer och nummer med varans märke", () => {
    const xml = [
      "<rss><channel>",
      "<item><g:id>a</g:id><g:brand>HOMCOM</g:brand><g:mpn>TEST-0001</g:mpn></item>",
      "<item><g:id>b</g:id><g:brand>Fyndplats</g:brand><g:mpn>TEST-0002</g:mpn><g:gtin>4006381333931</g:gtin></item>",
      "<item><g:id>c</g:id><g:brand>Fyndplats</g:brand></item>",
      "</channel></rss>",
    ].join("\n");
    const r = prisjaktRakning(xml);
    assert.deepEqual({ ...r, byte: 0 }, { varor: 3, gtin: 1, mpn: 2, mpnMedMarke: 1, byte: 0 });
    assert.equal(r.byte, Buffer.byteLength(xml));
  });
});
