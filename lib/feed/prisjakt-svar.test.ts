import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { FLODE_CACHE, FLODE_VARNING_BYTE_GZIP, flodessvar, prisjaktRakning, strommatXml, tarEmotGzip } from "./prisjakt-svar.ts";

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

describe("tarEmotGzip", () => {
  it("sant för varje vanlig rubrik som nämner gzip", () => {
    for (const rubrik of ["gzip", "gzip, deflate", "gzip, deflate, br", "br, gzip, deflate, zstd", "deflate,gzip", "GZIP", "x-gzip", "gzip;q=0.8, identity;q=0.5", "br;q=1.0, gzip ; q=0.5"]) {
      assert.equal(tarEmotGzip(rubrik), true, rubrik);
    }
  });

  it("falskt utan gzip, med q=0 och utan rubrik", () => {
    for (const rubrik of [null, undefined, "", "identity", "br", "deflate, br", "*", "gzip;q=0", "gzip;q=0.0, br", "notgzip", "gzipped"]) {
      assert.equal(tarEmotGzip(rubrik), false, String(rubrik));
    }
  });
});

describe("flodessvar", () => {
  const xml = `<?xml version="1.0"?><rss>${"<item>Sängbord å ä ö – 499 kr</item>\n".repeat(5000)}</rss>`;
  const med = (acceptEncoding?: string) =>
    new Request("https://www.fyndplats.se/feed/google.xml", acceptEncoding === undefined ? {} : { headers: { "accept-encoding": acceptEncoding } });

  it("den som tar emot gzip får flödet komprimerat, med längd, och samma XML när det packas upp", async () => {
    const res = flodessvar(xml, med("gzip, deflate, br"));
    assert.equal(res.headers.get("content-encoding"), "gzip");
    const kropp = Buffer.from(await res.arrayBuffer());
    assert.equal(res.headers.get("content-length"), String(kropp.byteLength));
    assert.equal(gunzipSync(kropp).toString("utf8"), xml);
    assert.ok(kropp.byteLength < Buffer.byteLength(xml) / 5, "svaret ska vara mycket mindre än XML:en");
  });

  it("utan anrop kommer flödet okomprimerat och strömmat: så läser rutterna varandra", async () => {
    const res = flodessvar(xml);
    assert.equal(res.headers.get("content-encoding"), null);
    assert.equal(res.headers.get("content-length"), null);
    assert.equal(await res.text(), xml);
  });

  it("en läsare som inte tar emot gzip får samma XML okomprimerad", async () => {
    for (const rubrik of [undefined, "identity", "br", "gzip;q=0"]) {
      const res = flodessvar(xml, med(rubrik));
      assert.equal(res.headers.get("content-encoding"), null, String(rubrik));
      assert.equal(await res.text(), xml);
    }
  });

  it("båda svaren säger att de beror på Accept-Encoding, annars ger CDN:en gzip till den som inte kan läsa det", () => {
    assert.equal(flodessvar(xml, med("gzip")).headers.get("vary"), "Accept-Encoding");
    assert.equal(flodessvar(xml, med("identity")).headers.get("vary"), "Accept-Encoding");
    assert.equal(flodessvar(xml).headers.get("vary"), "Accept-Encoding");
  });

  it("XML med rätt teckenkodning och CDN-tiden, lika i båda svaren", () => {
    for (const res of [flodessvar(xml, med("gzip")), flodessvar(xml)]) {
      assert.equal(res.headers.get("content-type"), "application/xml; charset=utf-8");
      assert.equal(res.headers.get("cache-control"), FLODE_CACHE);
    }
  });

  it("CDN:en håller svaret en timme och ger det gamla i högst två till: aldrig ett dygn", () => {
    assert.equal(FLODE_CACHE, "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200");
    const swr = Number(/stale-while-revalidate=(\d+)/.exec(FLODE_CACHE)?.[1]);
    assert.ok(swr <= 3 * 3600, "en läsare som hämtar en gång om dygnet ska aldrig få gårdagens fil");
  });

  it("egna rubriker och en egen CDN-tid går att skicka med, men inte skriva över typen", () => {
    const res = flodessvar(xml, med("gzip"), {
      cacheControl: "public, s-maxage=60",
      rubriker: { "X-Robots-Tag": "noindex", "Content-Type": "text/plain" },
    });
    assert.equal(res.headers.get("x-robots-tag"), "noindex");
    assert.equal(res.headers.get("cache-control"), "public, s-maxage=60");
    assert.equal(res.headers.get("content-type"), "application/xml; charset=utf-8");
  });

  it("varnar när det komprimerade svaret närmar sig CDN:ens gräns, och bara då", () => {
    assert.ok(FLODE_VARNING_BYTE_GZIP < 10_000_000, "varningen ska komma före gränsen på 10 MB");
    const varningar: string[] = [];
    const forr = console.warn;
    console.warn = (...a: unknown[]) => void varningar.push(a.join(" "));
    try {
      flodessvar(xml, med("gzip"));
      assert.equal(varningar.length, 0);
      // Brus går inte att komprimera: 9 miljoner slumpade tecken blir över 8 MB också som gzip.
      const brus = Buffer.alloc(9_000_000);
      let tal = 1;
      for (let i = 0; i < brus.length; i++) {
        tal = (Math.imul(tal, 1103515245) + 12345) >>> 0;
        brus[i] = (tal >>> 16) & 0xff;
      }
      flodessvar(brus.toString("latin1"), med("gzip"));
      assert.equal(varningar.length, 1);
      assert.match(varningar[0], /^\[flode\] det komprimerade svaret är \d+\.\d MB\./);
    } finally {
      console.warn = forr;
    }
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
