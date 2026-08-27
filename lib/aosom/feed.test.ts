import { describe, it, expect, afterEach, vi } from "vitest";
import {
  parseAosomFeed,
  isShippableToSe,
  landedCostEur,
  landedCostSek,
  freightShare,
  headroom,
  fetchAosomFeed,
  resolveAosomFeedUrl,
  NO_SHIP_SENTINEL_EUR,
  type AosomRow,
} from "./feed";

const HEADER =
  '"SKU","EAN","Name","URL","Image 1 Link","Image 2 Link","Image Additional Links",'
  + '"Weight (incl. Package) in kg","Size Package (LxWxH) in cm","Category","Color","Material",'
  + '"Description","Bullet Points","Qty","Size","Normal Price","Wholesale Price","SE Ship Fee"';

function rad(over: Partial<Record<string, string>> = {}): string {
  const f: Record<string, string> = {
    sku: "350-219V00PK",
    ean: "",
    name: "Schminktisch Kinder, 2 in 1",
    url: "https://www.aosom.de/item/x~350-219V00PK.html",
    img1: "https://img.aosomcdn.com/a.jpg",
    img2: "https://img.aosomcdn.com/b.jpg",
    imgN: "https://img.aosomcdn.com/b.jpg,https://img.aosomcdn.com/c.jpg",
    weight: "18.55 kg",
    pkg: "93.00x59.00x17.00 cm",
    category: "Baby & Kind > Spielzeug > Kinderrollenspiele",
    color: "Rosa",
    material: "Holzwerkstoff/Acryl",
    desc: "<p>Text</p>",
    bullets: "<ul><li>Punkt</li></ul>",
    qty: "168",
    size: "79,5L x 33B x 90,7H cm",
    normal: "103.9 EUR",
    wholesale: "57.18 EUR",
    freight: "31.28",
    ...over,
  };
  return [
    f.sku, f.ean, `"${f.name}"`, f.url, f.img1, f.img2, `"${f.imgN}"`,
    f.weight, f.pkg, `"${f.category}"`, f.color, f.material,
    `"${f.desc}"`, `"${f.bullets}"`, f.qty, `"${f.size}"`, f.normal, f.wholesale, f.freight,
  ].join(",");
}

function enRad(over: Partial<Record<string, string>> = {}): AosomRow {
  const rows = parseAosomFeed(`${HEADER}\n${rad(over)}`);
  expect(rows).toHaveLength(1);
  return rows[0];
}

describe("parseAosomFeed", () => {
  it("läser en rad med enheter efter talen", () => {
    const r = enRad();
    expect(r.sku).toBe("350-219V00PK");
    expect(r.wholesaleEur).toBe(57.18);
    expect(r.seFreightEur).toBe(31.28);
    expect(r.normalPriceEur).toBe(103.9);
    expect(r.weightKg).toBe(18.55);
    expect(r.qty).toBe(168);
    expect(r.size).toBe("79,5L x 33B x 90,7H cm");
  });

  it("avduplicerar bilder — feeden upprepar bild 2 i additional-kolumnen", () => {
    expect(enRad().imageUrls).toEqual([
      "https://img.aosomcdn.com/a.jpg",
      "https://img.aosomcdn.com/b.jpg",
      "https://img.aosomcdn.com/c.jpg",
    ]);
  });

  it("släpper igenom citerade fält med kommatecken och radbrytning", () => {
    const r = enRad({ desc: "<p>Ett, två</p>\n<p>tre</p>" });
    expect(r.descriptionHtml).toBe("<p>Ett, två</p>\n<p>tre</p>");
    expect(r.wholesaleEur).toBe(57.18);
  });

  it("hoppar över rader utan SKU och klarar tom fil", () => {
    expect(parseAosomFeed(`${HEADER}\n${rad({ sku: "" })}\n${rad()}`)).toHaveLength(1);
    expect(parseAosomFeed("")).toEqual([]);
    expect(parseAosomFeed(HEADER)).toEqual([]);
  });

  it("äter BOM i filens början", () => {
    expect(parseAosomFeed(`﻿${HEADER}\n${rad()}`)[0].sku).toBe("350-219V00PK");
  });

  it("tolkar komma som decimaltecken om Aosom skulle byta locale", () => {
    // Ett komma-decimaltal MÅSTE vara citerat i CSV:n, annars är det två fält.
    expect(enRad({ wholesale: '"57,18 EUR"' }).wholesaleEur).toBe(57.18);
  });

  it("ger null i stället för 0 när ett prisfält är tomt", () => {
    const r = enRad({ wholesale: "", normal: "" });
    expect(r.wholesaleEur).toBeNull();
    expect(r.normalPriceEur).toBeNull();
  });
});

describe("isShippableToSe", () => {
  it("släpper igenom en normal rad", () => {
    expect(isShippableToSe(enRad())).toBe(true);
  });

  it("stoppar slutsålt", () => {
    expect(isShippableToSe(enRad({ qty: "0" }))).toBe(false);
  });

  it("stoppar 999,90-sentinellen — det är ett nej, inte ett fraktpris", () => {
    expect(isShippableToSe(enRad({ freight: "999.90" }))).toBe(false);
    expect(NO_SHIP_SENTINEL_EUR).toBeLessThan(999.9);
  });

  it("stoppar rader utan fraktpris eller utan inköpspris", () => {
    expect(isShippableToSe(enRad({ freight: "" }))).toBe(false);
    expect(isShippableToSe(enRad({ wholesale: "" }))).toBe(false);
  });

  it("tar INTE hänsyn till lönsamhet — det är ett separat beslut", () => {
    // Frakten kostar mer än varan (54 % av landad kostnad). Raden är fullt
    // importerbar; att den är svårsåld är något freightShare svarar på.
    expect(isShippableToSe(enRad({ wholesale: "20.37 EUR", freight: "23.96" }))).toBe(true);
  });
});

describe("kostnad och marginalutrymme", () => {
  it("landad kostnad är varan plus frakten hit", () => {
    const r = enRad();
    expect(landedCostEur(r)).toBeCloseTo(88.46, 2);
    expect(landedCostSek(r, 11.1)).toBeCloseTo(981.91, 2);
  });

  it("freightShare hittar raderna där frakten är dyrare än varan", () => {
    expect(freightShare(enRad({ wholesale: "20.37 EUR", freight: "23.96" }))).toBeGreaterThan(0.5);
    expect(freightShare(enRad({ wholesale: "123.01 EUR", freight: "84.02" }))).toBeCloseTo(0.41, 2);
  });

  it("headroom mäter Aosoms eget hyllpris mot vår landade kostnad", () => {
    expect(headroom(enRad())).toBeCloseTo(1.17, 2);
    expect(headroom(enRad({ normal: "" }))).toBeNull();
  });

  it("division med noll ger 0 respektive null, inte NaN", () => {
    const tom = { ...enRad(), wholesaleEur: null, seFreightEur: null };
    expect(freightShare(tom)).toBe(0);
    expect(headroom(tom)).toBeNull();
  });
});

describe("fetchAosomFeed", () => {
  it("kastar med statuskoden när feeden svarar fel", async () => {
    const f = (async () =>
      new Response("", { status: 503, statusText: "Service Unavailable" })) as unknown as typeof fetch;
    await expect(fetchAosomFeed("https://x/feed.csv", f)).rejects.toThrow(/503/);
  });

  it("tolkar svaret vid 200", async () => {
    const f = (async () => new Response(`${HEADER}\n${rad()}`, { status: 200 })) as unknown as typeof fetch;
    const rows = await fetchAosomFeed("https://x/feed.csv", f);
    expect(rows[0].sku).toBe("350-219V00PK");
  });
});

describe("feedens adress", () => {
  const forra = { env: process.env.AOSOM_FEED_URL, token: process.env.WIX_API_TOKEN };
  afterEach(() => {
    if (forra.env === undefined) delete process.env.AOSOM_FEED_URL;
    else process.env.AOSOM_FEED_URL = forra.env;
    if (forra.token === undefined) delete process.env.WIX_API_TOKEN;
    else process.env.WIX_API_TOKEN = forra.token;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  /** Wix-raden, som modulen läser den. `null` = kollektionen saknas (404). */
  function wixSvarar(data: Record<string, unknown> | null) {
    vi.stubGlobal("fetch", (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (!url.includes("FyndplatsAppConfig")) throw new Error(`oväntat anrop: ${url}`);
      if (data === null) return new Response("", { status: 404 });
      return new Response(JSON.stringify({ dataItem: { data } }), { status: 200 });
    }) as unknown as typeof fetch);
  }

  it("miljövariabeln vinner — en engångskörning ska kunna peka om", async () => {
    process.env.AOSOM_FEED_URL = "https://engangs.test/feed.csv";
    process.env.WIX_API_TOKEN = "x";
    wixSvarar({ aosomFeedUrl: "https://wix.test/feed.csv" });
    await expect(resolveAosomFeedUrl()).resolves.toBe("https://engangs.test/feed.csv");
  });

  it("faller tillbaka på Wix-raden — det normala fallet i drift", async () => {
    delete process.env.AOSOM_FEED_URL;
    process.env.WIX_API_TOKEN = "x";
    wixSvarar({ aosomFeedUrl: "https://wix.test/feed.csv" });
    await expect(resolveAosomFeedUrl()).resolves.toBe("https://wix.test/feed.csv");
  });

  it("blank miljövariabel räknas som osatt", async () => {
    process.env.AOSOM_FEED_URL = "   ";
    process.env.WIX_API_TOKEN = "x";
    wixSvarar({ aosomFeedUrl: "https://wix.test/feed.csv" });
    await expect(resolveAosomFeedUrl()).resolves.toBe("https://wix.test/feed.csv");
  });

  it("kastar när ingen källa har adressen — aldrig en inbakad fallback", async () => {
    delete process.env.AOSOM_FEED_URL;
    process.env.WIX_API_TOKEN = "x";
    wixSvarar(null);
    await expect(resolveAosomFeedUrl()).rejects.toThrow(/feed-adress saknas/i);
  });

  it("fetchAosomFeed slår bara upp adressen när ingen skickas med", async () => {
    process.env.AOSOM_FEED_URL = "https://engangs.test/feed.csv";
    let hamtad = "";
    const f = (async (input: RequestInfo | URL) => {
      hamtad = String(input);
      return new Response(`${HEADER}\n${rad()}`, { status: 200 });
    }) as unknown as typeof fetch;

    await fetchAosomFeed(undefined, f);
    expect(hamtad).toBe("https://engangs.test/feed.csv");

    await fetchAosomFeed("https://uttrycklig.test/feed.csv", f);
    expect(hamtad).toBe("https://uttrycklig.test/feed.csv");
  });

  it("står ingenstans i källan — repot är publikt och feeden bär inköpspriserna", async () => {
    // En GET mot adressen kräver ingen inloggning och returnerar kolumnen
    // "Wholesale Price" för 6 057 artiklar. Hårdkodas den igen publicerar vi
    // vad vi betalar för varje vara, för alla som läser repot.
    const { readFileSync } = await import("node:fs");
    for (const fil of [
      "lib/aosom/feed.ts",
      "lib/aosom/import-run.ts",
      "lib/store/app-config.ts",
      "app/api/cron/aosom-import/route.ts",
    ]) {
      expect(readFileSync(fil, "utf8")).not.toMatch(/feed\.aosomcdn\.com/);
    }
  });
});
