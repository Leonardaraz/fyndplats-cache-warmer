import { describe, expect, it } from "vitest";
import { tillatenSokvag } from "./hamtning";
import { SIDFRAGA } from "./sida";
import { passar, reglerFor, tillatenAvRobots, tolkaRobots } from "./robots";
import { VEVOR_ROBOTS } from "./testsida";

const vevor = reglerFor(tolkaRobots(VEVOR_ROBOTS));
const produkt = `/testkategori-c_100/test-produkt-p_000000000001${SIDFRAGA}`;

describe("VEVOR:s robots.txt som den stod 2026-10-29", () => {
  it("produktsidorna med språk och valuta, kartan och robots.txt är tillåtna", () => {
    expect(tillatenAvRobots(vevor, produkt)).toBe(true);
    expect(tillatenAvRobots(vevor, "/sitemap/sitemap-index.xml")).toBe(true);
    expect(tillatenAvRobots(vevor, "/sitemap/sitemap_product_1.xml.gz")).toBe(true);
    expect(tillatenAvRobots(vevor, "/robots.txt")).toBe(true);
  });

  it("☠️ det som `*` spärrar är spärrat", () => {
    expect(tillatenAvRobots(vevor, "/products/x-p_000000000001")).toBe(false);
    expect(tillatenAvRobots(vevor, "/collections/x")).toBe(false);
    expect(tillatenAvRobots(vevor, "/product/x")).toBe(false);
    expect(tillatenAvRobots(vevor, "/testkategori-c_100?sort_by=price")).toBe(false);
    expect(tillatenAvRobots(vevor, "/testkategori-c_100?sort=1")).toBe(false);
    expect(tillatenAvRobots(vevor, "/deals?categoryIdList=1")).toBe(false);
    expect(tillatenAvRobots(vevor, "/wp-admin/options.php")).toBe(false);
    expect(tillatenAvRobots(vevor, "/wp-admin/admin-ajax.php")).toBe(true);
  });

  it("Googlebots grupp gäller inte oss, men /api/* är spärrat ändå (Leonard)", () => {
    expect(tillatenAvRobots(vevor, "/api/goods/stock")).toBe(true);
    expect(tillatenSokvag("/api/goods/stock")).toBe(false);
  });

  it("ingen Crawl-delay i filen", () => {
    expect(vevor.crawlDelaySek).toBeNull();
  });
});

describe("grupperna (RFC 9309)", () => {
  it("☠️ vår egen grupp gäller före `*`, oavsett skiftläge och version", () => {
    const r = reglerFor(tolkaRobots("User-agent: *\nDisallow:\n\nUser-agent: fyndplatsbot/2.0\nDisallow: /\n"));
    expect(tillatenAvRobots(r, produkt)).toBe(false);
  });

  it("flera User-agent-rader i följd delar grupp, och samma agent i två grupper slås ihop", () => {
    const text = "User-agent: Annan\nUser-agent: FyndplatsBot\nDisallow: /a\n\nUser-agent: FyndplatsBot\nDisallow: /b\n";
    const r = reglerFor(tolkaRobots(text));
    expect(tillatenAvRobots(r, "/a/x")).toBe(false);
    expect(tillatenAvRobots(r, "/b/x")).toBe(false);
    expect(tillatenAvRobots(r, "/c/x")).toBe(true);
  });

  it("en annan agents grupp gäller inte oss", () => {
    const r = reglerFor(tolkaRobots("User-agent: FyndplatsBotten\nDisallow: /\n"));
    expect(tillatenAvRobots(r, produkt)).toBe(true);
  });

  it("regler före första User-agent hör inte till någon grupp", () => {
    const r = reglerFor(tolkaRobots("Disallow: /\nUser-agent: *\nDisallow: /x\n"));
    expect(tillatenAvRobots(r, produkt)).toBe(true);
  });

  it("utan grupper alls är allt tillåtet, och en tom Disallow spärrar ingenting", () => {
    expect(tillatenAvRobots(reglerFor(tolkaRobots("")), produkt)).toBe(true);
    expect(tillatenAvRobots(reglerFor(tolkaRobots("User-agent: *\nDisallow:\n")), produkt)).toBe(true);
  });

  it("Crawl-delay ur vår grupp, inte ur andras", () => {
    const text = "User-agent: *\nCrawl-delay: 2\n\nUser-agent: Googlebot\nCrawl-delay: 30\n";
    expect(reglerFor(tolkaRobots(text)).crawlDelaySek).toBe(2);
  });

  it("kommentarer och CRLF", () => {
    const r = reglerFor(tolkaRobots("User-agent: * # alla\r\nDisallow: /hemligt # inte här\r\n"));
    expect(tillatenAvRobots(r, "/hemligt/x")).toBe(false);
    expect(tillatenAvRobots(r, produkt)).toBe(true);
  });
});

describe("matchningen", () => {
  it("längsta regeln vinner, och vid lika längd vinner Allow", () => {
    const r = reglerFor(tolkaRobots("User-agent: *\nDisallow: /a\nAllow: /a/b\nDisallow: /a/b/c\nDisallow: /x\nAllow: /x\n"));
    expect(tillatenAvRobots(r, "/a/z")).toBe(false);
    expect(tillatenAvRobots(r, "/a/b/z")).toBe(true);
    expect(tillatenAvRobots(r, "/a/b/c/z")).toBe(false);
    // Disallow står först, men Allow är lika lång och vinner.
    expect(tillatenAvRobots(r, "/x/y")).toBe(true);
  });

  it("`*` är vad som helst och `$` sist är slutet", () => {
    expect(passar("/*?sort", "/kategori?sort_by=1")).toBe(true);
    expect(passar("/*?sort", produkt)).toBe(false);
    expect(passar("/*.mp4$", "/film/x.mp4")).toBe(true);
    expect(passar("/*.mp4$", "/film/x.mp4?y=1")).toBe(false);
    expect(passar("/a*b*c", "/aXbYc")).toBe(true);
    expect(passar("/a*b*c", "/aXcYb")).toBe(false);
    expect(passar("/", produkt)).toBe(true);
    expect(passar("/a$", "/a")).toBe(true);
    expect(passar("/a$", "/ab")).toBe(false);
  });

  it("ett mönster med många `*` skenar inte", () => {
    const monster = `/${"a*".repeat(200)}b`;
    const vag = `/${"a".repeat(5000)}`;
    const t0 = performance.now();
    expect(passar(monster, vag)).toBe(false);
    expect(performance.now() - t0).toBeLessThan(200);
  });
});
