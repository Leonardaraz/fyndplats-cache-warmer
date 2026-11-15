import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import {
  FLODE_CACHE,
  FLODE_VARNING_BYTE_GZIP,
  KOMPRIMERADE_FLODEN,
  arTomtFlode,
  flodessvar,
  flodessvarUrKopia,
  gzipFlode,
  huvudsvar,
  komprimeratFlodessvar,
  komprimeratSvar,
  komprimeratSvarUrKopia,
  kopiansCacheControl,
  lasare,
  prisjaktRakning,
  strommatXml,
  tarEmotGzip,
} from "./prisjakt-svar.ts";
import { FLODEN_ATT_HALLA_FARSKA } from "../flodesvarmning.ts";
import nextConfig from "../../next.config.ts";

/** Kör `f` med console.error och console.warn tystade, och ger tillbaka det som skrevs. */
function tyst<T>(f: () => T): { svar: T; fel: string[]; varningar: string[] } {
  const fel: string[] = [];
  const varningar: string[] = [];
  const [e, w] = [console.error, console.warn];
  console.error = (...a: unknown[]) => void fel.push(a.join(" "));
  console.warn = (...a: unknown[]) => void varningar.push(a.join(" "));
  try {
    return { svar: f(), fel, varningar };
  } finally {
    console.error = e;
    console.warn = w;
  }
}

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
      flodessvar("<item>" + brus.toString("latin1"), med("gzip"));
      assert.equal(varningar.length, 1);
      assert.match(varningar[0], /^\[flode\] det komprimerade svaret är \d+\.\d MB\./);
    } finally {
      console.warn = forr;
    }
  });
});

describe("ett tomt flöde skickas aldrig", () => {
  const tomt = `<?xml version="1.0"?><rss><channel><title>Fyndplats</title></channel></rss>`;
  const fullt = `<?xml version="1.0"?><rss><channel><item><g:id>a</g:id></item></channel></rss>`;
  const anrop = new Request("https://www.fyndplats.se/feed/google.xml", { headers: { "accept-encoding": "gzip" } });

  it("arTomtFlode: sant utan en enda vara", () => {
    assert.equal(arTomtFlode(tomt), true);
    assert.equal(arTomtFlode(""), true);
    assert.equal(arTomtFlode(fullt), false);
  });

  it("en läsare utifrån får 503 som inte sparas, och felet loggas med adressen", async () => {
    for (const bygg of [() => flodessvar(tomt, anrop), () => komprimeratFlodessvar(tomt, "/feed/google.xml")]) {
      const { svar, fel } = tyst(bygg);
      assert.equal(svar.status, 503);
      assert.equal(svar.headers.get("cache-control"), "no-store");
      assert.equal(svar.headers.get("retry-after"), "600");
      assert.equal(svar.headers.get("content-encoding"), null);
      assert.doesNotMatch(await svar.text(), /<rss/);
      assert.equal(fel.length, 1);
      assert.match(fel[0], /^\[flode\] \/feed\/google\.xml byggdes utan en enda vara/);
    }
  });

  it("rutterna som läser varandra utan anrop får XML:en som den är", async () => {
    const { svar, fel } = tyst(() => flodessvar(tomt));
    assert.equal(svar.status, 200);
    assert.equal(await svar.text(), tomt);
    assert.equal(fel.length, 0);
  });

  it("ett flöde med varor går igenom", () => {
    const { svar, fel } = tyst(() => [flodessvar(fullt, anrop), komprimeratFlodessvar(fullt, "/feed/google.xml")]);
    assert.deepEqual(svar.map((r) => r.status), [200, 200]);
    assert.equal(fel.length, 0);
  });
});

describe("komprimeratFlodessvar: adressen som alltid svarar med gzip", () => {
  const xml = `<?xml version="1.0"?><rss>${"<item>Sängbord å ä ö – 499 kr</item>\n".repeat(5000)}</rss>`;

  it("gzip med längd, och samma XML när det packas upp", async () => {
    const res = komprimeratFlodessvar(xml, "/feed/google.xml");
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-encoding"), "gzip");
    assert.equal(res.headers.get("content-type"), "application/xml; charset=utf-8");
    assert.equal(res.headers.get("cache-control"), FLODE_CACHE);
    const kropp = Buffer.from(await res.arrayBuffer());
    assert.equal(res.headers.get("content-length"), String(kropp.byteLength));
    assert.equal(gunzipSync(kropp).toString("utf8"), xml);
  });

  it("☠️ utan Vary: annars håller CDN:en en kopia per Accept-Encoding-sträng igen", () => {
    assert.equal(komprimeratFlodessvar(xml, "/feed/google.xml").headers.get("vary"), null);
  });
});

describe("omskrivningen i next.config.ts", () => {
  type Regel = { source: string; destination: string; has?: { type: string; key: string; value?: string }[] };
  const regler = async (): Promise<{ beforeFiles: Regel[]; afterFiles: Regel[] }> =>
    (await nextConfig.rewrites!()) as unknown as { beforeFiles: Regel[]; afterFiles: Regel[] };

  it("en regel per komprimerat flöde, före filerna, till adressen som alltid svarar med gzip", async () => {
    const { beforeFiles } = await regler();
    assert.deepEqual(
      beforeFiles.map((r) => [r.source, r.destination]),
      KOMPRIMERADE_FLODEN.map((fil) => [`/feed/${fil}`, `/feed/gz/${fil}`]),
    );
    for (const r of beforeFiles) {
      assert.equal(r.has?.length, 1);
      assert.equal(r.has?.[0].type, "header");
      assert.equal(r.has?.[0].key, "accept-encoding");
    }
  });

  it("regeln träffar den som tar emot gzip och ingen annan", async () => {
    const { beforeFiles } = await regler();
    const re = new RegExp(`^${beforeFiles[0].has?.[0].value}$`);
    for (const ja of ["gzip", "gzip, deflate", "gzip, deflate, br", "gzip, deflate, br, zstd", "br, gzip", "deflate,gzip", "gzip;q=0.8, identity;q=0.5", "br;q=1.0, gzip;q=0.5"]) {
      assert.ok(re.test(ja), ja);
      assert.equal(tarEmotGzip(ja), true, ja);
    }
    for (const nej of ["", "identity", "br", "deflate, br", "*", "notgzip", "gzipped"]) {
      assert.ok(!re.test(nej), nej);
    }
  });

  it("Prisjakt-flödena och den gamla webhooken är orörda", async () => {
    const { beforeFiles, afterFiles } = await regler();
    assert.ok(!beforeFiles.some((r) => r.source.includes("prisjakt")));
    assert.deepEqual(afterFiles, [{ source: "/_functions/track_webhook", destination: "/api/track17-webhook" }]);
  });

  it("rutten bygger samma flöden, och jobbet håller samma flöden färska", () => {
    const byggare = readFileSync(join(import.meta.dirname, "byggare.ts"), "utf8");
    const nycklar = [...byggare.matchAll(/^  "([a-z.]+)": \(\) => \w+\(\),$/gm)].map((m) => m[1]);
    assert.deepEqual(nycklar, [...KOMPRIMERADE_FLODEN]);
    const rutt = readFileSync(join(import.meta.dirname, "..", "..", "app", "feed", "gz", "[fil]", "route.ts"), "utf8");
    assert.match(rutt, /if \(!arKomprimeratFlode\(fil\)\) return finnsInte\(\);/);
    assert.match(rutt, /const xml = await \(await BYGGARE\[fil\]\(\)\)\.text\(\);/);
    assert.match(rutt, /if \(arTomtFlode\(xml\)\) return tomtFlodeSvar\(`\/feed\/\$\{fil\}`\);/);
    assert.deepEqual(
      FLODEN_ATT_HALLA_FARSKA.filter((p) => p.startsWith("/feed/")),
      KOMPRIMERADE_FLODEN.map((fil) => `/feed/${fil}`),
    );
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

describe("svaren ur den sparade kopian", () => {
  const xml = `<?xml version="1.0"?><rss>${"<item>Sängbord å ä ö – 499 kr</item>\n".repeat(20000)}</rss>`;
  const gz = gzipFlode(xml);
  const nu = Date.parse("2026-11-15T10:00:00Z");
  const kopia = { gz, byggd: nu - 30 * 60_000, xmlByte: Buffer.byteLength(xml) };
  const med = (ae?: string) => new Request("https://www.fyndplats.se/feed/pinterest.xml", ae === undefined ? {} : { headers: { "accept-encoding": ae } });

  it("gz-adressen: exakt de sparade byten, med längd, tid och utan Vary", async () => {
    const res = komprimeratSvarUrKopia(kopia, nu);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-encoding"), "gzip");
    assert.equal(res.headers.get("content-type"), "application/xml; charset=utf-8");
    assert.equal(res.headers.get("content-length"), String(gz.byteLength));
    assert.equal(res.headers.get("last-modified"), new Date(kopia.byggd).toUTCString());
    assert.equal(res.headers.get("vary"), null);
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), gz);
  });

  it("den som inte tar emot gzip får XML:en uppackad och strömmad, samma tecken som byggdes", async () => {
    for (const ae of [undefined, "identity", "br", "gzip;q=0"]) {
      const res = flodessvarUrKopia(kopia, med(ae), nu);
      assert.equal(res.headers.get("content-encoding"), null, ae);
      assert.equal(res.headers.get("content-length"), null, "strömmat: ett svar över 4,5 MB får inte skickas i ett stycke");
      assert.equal(res.headers.get("vary"), "Accept-Encoding");
      const { text, bitar } = await lasAllt(res.body!);
      assert.equal(text, xml);
      assert.ok(bitar > 1);
    }
  });

  it("den som tar emot gzip på /feed/<fil> (utan omskrivningen) får de sparade byten", async () => {
    const res = flodessvarUrKopia(kopia, med("gzip, deflate"), nu);
    assert.equal(res.headers.get("content-encoding"), "gzip");
    assert.equal(res.headers.get("vary"), "Accept-Encoding");
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), gz);
  });

  it("CDN-tiden räknas från bygget: en timme räknat från då, minst en minut, och det gamla i högst två till", () => {
    assert.equal(kopiansCacheControl(0), "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200");
    assert.equal(kopiansCacheControl(1800), "public, max-age=1800, s-maxage=1800, stale-while-revalidate=7200");
    assert.equal(kopiansCacheControl(3590), "public, max-age=60, s-maxage=60, stale-while-revalidate=7200");
    assert.equal(kopiansCacheControl(7200), "public, max-age=60, s-maxage=60, stale-while-revalidate=7200");
    assert.equal(kopiansCacheControl(-50), "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200");
    assert.equal(komprimeratSvarUrKopia(kopia, nu).headers.get("cache-control"), kopiansCacheControl(1800));
    assert.equal(FLODE_CACHE, kopiansCacheControl(0), "en ny kopia får samma tid som ett nytt bygge");
  });

  it("ett nytt bygge skickas som förut: samma byte som sparas", async () => {
    const res = komprimeratSvar(gz);
    assert.equal(res.headers.get("cache-control"), FLODE_CACHE);
    assert.equal(res.headers.get("vary"), null);
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), gz);
  });
});

describe("huvudsvar: HEAD bygger aldrig", () => {
  const huvud = { byggd: Date.parse("2026-11-15T09:00:00Z"), gzByte: 2_879_046, xmlByte: 19_600_000 };

  it("gz-adressen med kopia: längden och tiden ur kopian, ingen kropp", async () => {
    const res = huvudsvar({ komprimerat: true, kopia: huvud });
    assert.equal(res.status, 200);
    assert.equal(res.body, null);
    assert.equal(res.headers.get("content-encoding"), "gzip");
    assert.equal(res.headers.get("content-length"), "2879046");
    assert.equal(res.headers.get("last-modified"), "Sun, 15 Nov 2026 09:00:00 GMT");
    assert.equal(res.headers.get("content-type"), "application/xml; charset=utf-8");
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("vary"), null);
  });

  it("utan kopia: bara typen, ingen längd och ingen tid", () => {
    for (const komprimerat of [true, false]) {
      const res = huvudsvar({ komprimerat, kopia: null });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("content-length"), null);
      assert.equal(res.headers.get("last-modified"), null);
      assert.equal(res.headers.get("content-type"), "application/xml; charset=utf-8");
    }
  });

  it("/feed/<fil>: som GET, strömmat utan längd och med Vary", () => {
    const res = huvudsvar({ komprimerat: false, kopia: huvud });
    assert.equal(res.headers.get("content-encoding"), null);
    assert.equal(res.headers.get("content-length"), null);
    assert.equal(res.headers.get("vary"), "Accept-Encoding");
    assert.equal(res.headers.get("last-modified"), "Sun, 15 Nov 2026 09:00:00 GMT");
  });

  it("☠️ varje flödesrutt har en egen HEAD som aldrig bygger", () => {
    const rot = join(import.meta.dirname, "..", "..", "app", "feed");
    for (const fil of [...KOMPRIMERADE_FLODEN.map((f) => join(f, "route.ts")), join("gz", "[fil]", "route.ts")]) {
      const kalla = readFileSync(join(rot, fil), "utf8");
      const start = kalla.indexOf("export async function HEAD(");
      assert.ok(start >= 0, `${fil} saknar HEAD: då kör Next GET och bygger hela flödet`);
      const slut = kalla.indexOf("\n}\n", start);
      const kropp = kalla.slice(start, slut);
      assert.ok(slut > start);
      for (const forbjudet of ["GET(", "googleFeed(", "BYGGARE", "fetch", "tillPinterest", "lasKopia(", "flodessvar("]) {
        assert.ok(!kropp.includes(forbjudet), `${fil}: HEAD får inte röra ${forbjudet}`);
      }
      assert.match(kropp, /return huvudsvar\(/);
    }
  });
});

describe("lasare: vem som hämtar, för loggen", () => {
  const med = (h: Record<string, string>) => new Request("https://www.fyndplats.se/feed/pinterest.xml", { headers: h });

  it("rubriken och robotens namn, inget mer", () => {
    assert.equal(lasare(med({ "accept-encoding": "gzip, deflate", "user-agent": "Pinterestbot/1.0 (+http://www.pinterest.com/bot.html)" })), "gzip, deflate; Pinterestbot/1.0");
    assert.equal(
      lasare(med({ "accept-encoding": "gzip,deflate,br", "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" })),
      "gzip,deflate,br; Googlebot/2.1",
    );
    assert.equal(lasare(med({ "user-agent": "fyndplats-flodesvarmning/1.0" })), "utan accept-encoding; fyndplats-flodesvarmning/1.0");
    assert.equal(lasare(med({ "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/142.0" })), "utan accept-encoding; Mozilla/5.0");
    assert.equal(lasare(undefined), "utan accept-encoding; okänd");
  });

  it("korta fält även när rubrikerna är långa", () => {
    const r = lasare(med({ "accept-encoding": "x".repeat(500), "user-agent": "y".repeat(500) }));
    assert.ok(r.length <= 82, r);
  });
});
