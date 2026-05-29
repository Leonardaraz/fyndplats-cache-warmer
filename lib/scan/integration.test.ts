// Integrationstest: hela djup-skanningen mot en RIKTIG lokal HTTP-server.
// Detta bevisar fetch-vägen, content-type-koll, fler-sids-crawl och robots-
// hämtning — det som inte går att verifiera mot externa sajter i sandlådan
// (utgående trafik blockeras; loopback fungerar).

import http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { evaluateHtml, fetchPageHtml } from "../accessibility/scanner";
import { analyzeSeo } from "../seo/analyzer";
import { analyzeAeo } from "../aeo/analyzer";
import { analyzePerformance } from "../perf/analyzer";
import { extractInternalLinks } from "./crawl";
import { mergeCategoryPages } from "./aggregate";
import { fetchSiteFiles } from "./site-files";
import { analyzeRobotsAndFiles } from "../aeo/robots";
import { buildCategory, type CategoryResult, type Finding } from "./types";

// En liten, medvetet bristfällig e-handelssida (saknar alt, lang, meta m.m.).
const HOME = `<!doctype html><html><head><title>Min butik</title>
<script src="/app.js"></script></head><body>
<h1>Välkommen</h1><h3>Nyheter</h3>
<img src="/p1.jpg"><img src="/p2.jpg">
<a href="/produkt/troja">Tröja</a>
<a href="/kassa">Till kassan</a>
<a href="/om-oss">Om oss</a>
<a href="https://extern.example/x">Extern</a>
<button></button>
</body></html>`;
const SUB = `<!doctype html><html><head><title>Produkt</title></head><body>
<h1>Tröja</h1><img src="/p.jpg"></body></html>`;
const ROBOTS = `User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /`;

function analyzePage(url: string, html: string): CategoryResult[] {
  const r = evaluateHtml(url, html);
  const findings: Finding[] = r.issues.map((i) => ({
    id: i.id, title: i.title, severity: i.severity, ref: `WCAG ${i.wcag}`,
    count: i.count, examples: i.examples,
  }));
  return [
    buildCategory("accessibility", "Tillgänglighet (EAA)", findings, r.checksRun),
    analyzeSeo(html, url),
    analyzeAeo(html),
    analyzePerformance(html),
  ];
}

let server: http.Server;
let base: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0];
    if (path === "/robots.txt") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end(ROBOTS);
    }
    if (path === "/llms.txt") {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(path === "/" ? HOME : SUB);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address();
  base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/`;
});

afterAll(() => server.close());

describe("deep scan över riktig HTTP (loopback)", () => {
  it("hämtar startsidan och hittar tillgänglighetsfel", async () => {
    const { url, html } = await fetchPageHtml(base);
    expect(url).toBe(base);
    const ids = evaluateHtml(url, html).issues.map((i) => i.id);
    expect(ids).toContain("img-alt");
    expect(ids).toContain("html-lang");
    expect(ids).toContain("button-name");
  });

  it("upptäcker och hämtar undersidor, slår ihop resultatet", async () => {
    const { url, html } = await fetchPageHtml(base);
    const links = extractInternalLinks(html, url, 3);
    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(links.every((l) => l.startsWith("http://127.0.0.1"))).toBe(true); // inga externa

    const settled = await Promise.allSettled(links.map((l) => fetchPageHtml(l)));
    const pages = [{ url, html }, ...settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []))];
    expect(pages.length).toBeGreaterThanOrEqual(3);

    const merged = mergeCategoryPages(pages.map((p) => analyzePage(p.url, p.html)));
    const a11y = merged.find((c) => c.category === "accessibility")!;
    const imgAlt = a11y.findings.find((f) => f.id === "img-alt")!;
    // startsidan har 2 saknade alt + minst 1 per undersida → summerat > 2
    expect(imgAlt.count).toBeGreaterThan(2);
  });

  it("hämtar robots.txt och upptäcker blockerad AI-crawler", async () => {
    const files = await fetchSiteFiles(base);
    expect(files.robotsTxt).toContain("GPTBot");
    expect(files.llmsTxt).toBeNull(); // 404 → null
    const ids = analyzeRobotsAndFiles(files).map((f) => f.id);
    expect(ids).toContain("blocks-ai-crawlers");
    expect(ids).toContain("no-llms-txt");
  });

  it("avvisar icke-HTML svar", async () => {
    // robots.txt är text/plain → scannern ska vägra analysera den som sida
    await expect(fetchPageHtml(`${base}robots.txt`)).rejects.toThrow(/HTML/i);
  });
});
