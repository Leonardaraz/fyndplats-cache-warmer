import { describe, expect, it } from "vitest";
import { ANVANDARAGENT, MIN_MELLANRUM_MS, Takt, hamta, klassaSvar, tillatenSokvag } from "./hamtning";
import { testSokvag, testsida } from "./testsida";

describe("klassaSvar", () => {
  it("☠️ 403 och 429 är spärrar", () => {
    expect(klassaSvar(403, "")).toEqual({ typ: "blockerad", skal: "403" });
    expect(klassaSvar(429, testsida())).toEqual({ typ: "blockerad", skal: "429" });
  });

  it("☠️ en tom eller kort sida är en spärr, inte en sida", () => {
    expect(klassaSvar(200, "")).toEqual({ typ: "blockerad", skal: "tom" });
    expect(klassaSvar(200, "<html><body>ok</body></html>")).toEqual({ typ: "blockerad", skal: "tom" });
    expect(klassaSvar(200, "x".repeat(5000))).toEqual({ typ: "blockerad", skal: "tom" });
  });

  it("☠️ en captcha-sida är en spärr, även med status 200 eller 503", () => {
    const captcha = `<html><head><title>Human verification</title></head><body>${"x".repeat(3000)}<div id="captcha-container"></div></body></html>`;
    expect(klassaSvar(200, captcha)).toEqual({ typ: "blockerad", skal: "captcha" });
    expect(klassaSvar(503, captcha)).toEqual({ typ: "blockerad", skal: "captcha" });
  });

  it("en produktsida som nämner ordet captcha i en recension är ingen spärr", () => {
    const sida = testsida().replace("</body>", "<p>En recension om captcha.</p></body>");
    expect(klassaSvar(200, sida).typ).toBe("sida");
  });

  it("404 och 410 betyder att sidan saknas", () => {
    expect(klassaSvar(404, testsida({ utanProdukt: true }))).toEqual({ typ: "saknas", status: 404 });
    expect(klassaSvar(410, "")).toEqual({ typ: "saknas", status: 410 });
  });

  it("en omdirigering bär sökvägen bara när den pekar på en annan produktsida på sajten", () => {
    expect(klassaSvar(301, "", testSokvag("000000000009"))).toEqual({ typ: "omdirigerad", till: testSokvag("000000000009") });
    expect(klassaSvar(302, "", `https://eur.vevor.com${testSokvag("000000000009")}?lang=sv`)).toEqual({
      typ: "omdirigerad",
      till: testSokvag("000000000009"),
    });
    expect(klassaSvar(301, "", "/")).toEqual({ typ: "omdirigerad", till: null });
    expect(klassaSvar(301, "", "https://annan.example.test/x-p_000000000009")).toEqual({ typ: "omdirigerad", till: null });
  });

  it("serverfel är tillfälliga", () => {
    expect(klassaSvar(500, "fel")).toEqual({ typ: "tillfalligt", skal: "http 500" });
    expect(klassaSvar(502, "")).toEqual({ typ: "tillfalligt", skal: "http 502" });
  });

  it("en riktig sida är en sida", () => {
    expect(klassaSvar(200, testsida()).typ).toBe("sida");
  });
});

describe("tillatenSokvag", () => {
  it("☠️ aldrig /api/* och aldrig det robots.txt spärrar", () => {
    expect(tillatenSokvag("/api/goods/stock")).toBe(false);
    expect(tillatenSokvag("/products/x-p_000000000001")).toBe(false);
    expect(tillatenSokvag("/collections/x")).toBe(false);
    expect(tillatenSokvag("/product/x-p_000000000001")).toBe(false);
    expect(tillatenSokvag("/pages/contact-us")).toBe(false);
  });

  it("produktsidor och sajtkartan går att läsa", () => {
    expect(tillatenSokvag(testSokvag())).toBe(true);
    expect(tillatenSokvag("/sitemap/sitemap-index.xml")).toBe(true);
    expect(tillatenSokvag("/sitemap/sitemap_product_1.xml.gz")).toBe(true);
  });
});

describe("Takt", () => {
  it("☠️ minst en sekund mellan två anrop, oavsett hur snabbt anropen kommer", async () => {
    let nu = 0;
    const vantat: number[] = [];
    const takt = new Takt(
      () => nu,
      async (ms) => {
        vantat.push(ms);
        nu += ms;
      },
    );
    const starter: number[] = [];
    for (let i = 0; i < 4; i++) {
      await takt.invanta();
      starter.push(nu);
      nu += 200; // anropet tar 0,2 s
    }
    for (let i = 1; i < starter.length; i++) expect(starter[i] - starter[i - 1]).toBeGreaterThanOrEqual(MIN_MELLANRUM_MS);
    expect(vantat).toEqual([800, 800, 800]);
  });
});

describe("hamta", () => {
  const takt = () => new Takt(() => 0, async () => undefined);

  it("☠️ ärlig User-Agent, svenska och kronor i frågan, och ingen omdirigering följs", async () => {
    const anrop: { url: string; init: RequestInit }[] = [];
    const svar = await hamta(testSokvag(), {
      takt: takt(),
      fraga: "?lang=sv&currency=SEK",
      hamtare: async (url, init) => {
        anrop.push({ url, init });
        return new Response(testsida(), { status: 200 });
      },
    });
    expect(svar.typ).toBe("sida");
    expect(anrop).toHaveLength(1);
    expect(anrop[0].url).toBe(`https://eur.vevor.com${testSokvag()}?lang=sv&currency=SEK`);
    expect((anrop[0].init.headers as Record<string, string>)["User-Agent"]).toBe(ANVANDARAGENT);
    expect(ANVANDARAGENT).toContain("info@fyndplats.com");
    expect(anrop[0].init.redirect).toBe("manual");
  });

  it("☠️ vägrar en spärrad sökväg innan något anrop görs", async () => {
    let anropade = false;
    await expect(
      hamta("/api/goods/stock", {
        takt: takt(),
        hamtare: async () => {
          anropade = true;
          return new Response("", { status: 200 });
        },
      }),
    ).rejects.toThrow();
    expect(anropade).toBe(false);
  });

  it("ett nätfel är tillfälligt", async () => {
    const svar = await hamta(testSokvag(), {
      takt: takt(),
      hamtare: async () => {
        throw new TypeError("fetch failed");
      },
    });
    expect(svar).toEqual({ typ: "tillfalligt", skal: "nätfel" });
  });
});
