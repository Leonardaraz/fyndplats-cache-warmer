// lib/seo-health.ts
// Deterministic SEO health report — no paid APIs, no Claude. Powers both the
// /admin/seo-health dashboard and the weekly ops email (app/api/cron/seo-weekly-email).
//
// It answers: is the sitemap complete? are any indexable URLs returning errors?
// are key pages missing critical meta? were any blog posts published this week?
// Everything is derived from lib/site-urls (the sitemap source of truth) plus
// lightweight HTTP HEAD/GET crawls of the live site.
import { SITE, getSiteUrls, type SiteUrl, type SiteUrlType } from "./site-urls";
import { getPosts } from "./blog";

export type BrokenUrl = { url: string; status: number; type: SiteUrlType };
export type MetaIssue = { url: string; missing: string[] };

export type SeoHealthReport = {
  generatedAt: string; // ISO
  site: string;
  sitemap: {
    total: number;
    breakdown: Record<string, number>;
    sokExcluded: boolean; // true = /sok correctly NOT in sitemap
  };
  crawl: {
    checked: number;
    skipped: number; // not crawled because over the cap
    broken: BrokenUrl[];
  } | null;
  meta: {
    checked: number;
    issues: MetaIssue[]; // pages missing description and/or og:image
  } | null;
  blog: {
    total: number;
    newThisWeek: { slug: string; title: string; date: string }[];
  };
  ping: {
    indexNowKeyLocation: string;
    weeklyCron: string; // schedule string for the IndexNow sweep
    note: string;
  };
  issues: string[]; // human-readable action items
  healthy: boolean;
};

// ── small concurrency-limited map ────────────────────────────────────────────
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function statusOf(url: string): Promise<number> {
  try {
    // HEAD first (cheap); some hosts/CDNs reject HEAD → fall back to GET.
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow" });
    }
    return res.status;
  } catch {
    return 0; // network error / DNS / timeout
  }
}

async function metaOf(url: string): Promise<string[]> {
  const missing: string[] = [];
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    if (!res.ok) return ["page-not-200"];
    const html = await res.text();
    const head = html.slice(0, 60000); // meta lives in <head>; cap the read
    if (!/<meta[^>]+name=["']description["'][^>]*>/i.test(head)) missing.push("description");
    if (!/<meta[^>]+property=["']og:image["'][^>]*>/i.test(head)) missing.push("og:image");
  } catch {
    missing.push("fetch-failed");
  }
  return missing;
}

const DEFAULT_CRAWL_CAP = 60; // keep a cron/page invocation well under the timeout

export type ReportOptions = {
  crawl?: boolean; // crawl URLs for broken links (default true)
  crawlCap?: number; // max URLs to crawl (default 60)
  checkMeta?: boolean; // fetch key pages and check meta tags (default true)
};

export async function buildSeoHealthReport(opts: ReportOptions = {}): Promise<SeoHealthReport> {
  const { crawl = true, crawlCap = DEFAULT_CRAWL_CAP, checkMeta = true } = opts;

  const urls = await getSiteUrls();
  const posts = await getPosts();

  // ── sitemap breakdown ──
  const breakdown: Record<string, number> = {};
  for (const u of urls) breakdown[u.type] = (breakdown[u.type] || 0) + 1;
  const sokExcluded = !urls.some((u) => u.path === "/sok" || u.url.endsWith("/sok"));

  // ── crawl for broken URLs ──
  // Always crawl the high-value pages; sample the long product/blog tail up to the cap.
  let crawlReport: SeoHealthReport["crawl"] = null;
  if (crawl) {
    const priority = urls.filter((u) => u.type !== "produkt" && u.type !== "blogg");
    const tail = urls.filter((u) => u.type === "produkt" || u.type === "blogg");
    const toCheck = [...priority, ...tail].slice(0, crawlCap);
    const skipped = urls.length - toCheck.length;
    const statuses = await mapLimit(toCheck, 8, async (u) => ({ u, status: await statusOf(u.url) }));
    const broken: BrokenUrl[] = statuses
      .filter(({ status }) => status === 0 || status >= 400)
      .map(({ u, status }) => ({ url: u.url, status, type: u.type }));
    crawlReport = { checked: toCheck.length, skipped, broken };
  }

  // ── meta check on representative pages ──
  let metaReport: SeoHealthReport["meta"] = null;
  if (checkMeta) {
    const seenTypes = new Set<SiteUrlType>();
    const sample: SiteUrl[] = [];
    for (const u of urls) {
      // one representative page per type (home, butik, kategori, produkt, blogg, sida)
      if (!seenTypes.has(u.type)) {
        seenTypes.add(u.type);
        sample.push(u);
      }
    }
    const results = await mapLimit(sample, 6, async (u) => ({ u, missing: await metaOf(u.url) }));
    const issues: MetaIssue[] = results
      .filter(({ missing }) => missing.length > 0)
      .map(({ u, missing }) => ({ url: u.url, missing }));
    metaReport = { checked: sample.length, issues };
  }

  // ── blog: posts published in the last 7 days ──
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = posts
    .filter((p) => {
      const t = p.date ? new Date(p.date).getTime() : NaN;
      return !isNaN(t) && t >= weekAgo;
    })
    .map((p) => ({ slug: p.slug, title: p.title, date: p.date }));

  // ── action items ──
  const issues: string[] = [];
  if (urls.length === 0) issues.push("Sitemap är tom — inga URL:er genererades (Wix-hämtning misslyckad?).");
  if (!sokExcluded) issues.push("/sok ligger i sitemap — sökresultatsidor ska inte indexeras.");
  if (crawlReport && crawlReport.broken.length > 0) {
    issues.push(`${crawlReport.broken.length} URL:er svarar med fel (404/5xx/nätverksfel).`);
  }
  if (metaReport && metaReport.issues.length > 0) {
    issues.push(`${metaReport.issues.length} sidtyper saknar kritiska meta-taggar (description/og:image).`);
  }

  const healthy = issues.length === 0;

  return {
    generatedAt: new Date().toISOString(),
    site: SITE,
    sitemap: { total: urls.length, breakdown, sokExcluded },
    crawl: crawlReport,
    meta: metaReport,
    blog: { total: posts.length, newThisWeek },
    ping: {
      indexNowKeyLocation: `${SITE}/a3f9c2e7b6d8419fae20c5d731b8e4f6.txt`,
      weeklyCron: "0 3 * * 1 (måndagar 03:00 UTC)",
      note: "IndexNow pingar Bing/Yandex veckovis + vid produkt/bloggändring (Wix-webhook). Manuell submit: /api/admin/seo-ping.",
    },
    issues,
    healthy,
  };
}

// ── weekly email rendering (plain HTML, deterministic, no React-email needed) ──
const ORDER: SiteUrlType[] = ["home", "butik", "alla-produkter", "sida", "kategori", "produkt", "blogg"];
const LABEL: Record<string, string> = {
  home: "Startsida",
  butik: "/butik",
  "alla-produkter": "/alla-produkter",
  sida: "Informationssidor",
  kategori: "Kategorier (/kategori/*)",
  produkt: "Produkter (/produkt/*)",
  blogg: "Blogginlägg (/blogg/*)",
};

export function seoEmailSubject(report: SeoHealthReport): string {
  const n = report.issues.length;
  return n === 0
    ? "✅ Fyndplats SEO weekly — allt OK"
    : `⚠️ Fyndplats SEO weekly — ${n} ${n === 1 ? "problem" : "problem"}`;
}

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderSeoEmailHtml(report: SeoHealthReport): string {
  const rows = ORDER.filter((t) => report.sitemap.breakdown[t] != null)
    .map(
      (t) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#555">${esc(LABEL[t] || t)}</td><td style="padding:4px 0;font-weight:600;text-align:right">${report.sitemap.breakdown[t]}</td></tr>`,
    )
    .join("");

  const brokenHtml =
    report.crawl && report.crawl.broken.length > 0
      ? `<ul style="margin:8px 0;padding-left:18px">${report.crawl.broken
          .map((b) => `<li><code>${b.status || "nätverksfel"}</code> — <a href="${esc(b.url)}">${esc(b.url)}</a></li>`)
          .join("")}</ul>`
      : `<p style="color:#16804a;margin:8px 0">Inga trasiga URL:er bland ${report.crawl?.checked ?? 0} kontrollerade.</p>`;

  const metaHtml =
    report.meta && report.meta.issues.length > 0
      ? `<ul style="margin:8px 0;padding-left:18px">${report.meta.issues
          .map((m) => `<li><a href="${esc(m.url)}">${esc(m.url)}</a> — saknar ${esc(m.missing.join(", "))}</li>`)
          .join("")}</ul>`
      : `<p style="color:#16804a;margin:8px 0">Alla ${report.meta?.checked ?? 0} kontrollerade sidtyper har description + og:image.</p>`;

  const blogHtml =
    report.blog.newThisWeek.length > 0
      ? `<ul style="margin:8px 0;padding-left:18px">${report.blog.newThisWeek
          .map((p) => `<li><a href="${esc(report.site)}/blogg/${esc(p.slug)}">${esc(p.title)}</a> (${esc(p.date)})</li>`)
          .join("")}</ul>`
      : `<p style="color:#555;margin:8px 0">Inga nya blogginlägg senaste 7 dagarna.</p>`;

  const actionsHtml =
    report.issues.length > 0
      ? `<div style="background:#fff5f5;border:1px solid #f3c2c2;border-radius:8px;padding:12px 16px;margin:16px 0">
           <strong style="color:#b42318">Åtgärder</strong>
           <ul style="margin:8px 0 0;padding-left:18px">${report.issues.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
         </div>`
      : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin:16px 0;color:#166534">
           <strong>Allt ser bra ut.</strong> Inga åtgärder behövs den här veckan.
         </div>`;

  const sok = report.sitemap.sokExcluded
    ? `<span style="color:#16804a">korrekt exkluderad ✓</span>`
    : `<span style="color:#b42318">finns i sitemap ✗</span>`;

  return `<!doctype html><html lang="sv"><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1c1c">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <h1 style="font-size:18px;margin:0 0 4px">Fyndplats — SEO weekly</h1>
      <p style="color:#777;margin:0 0 16px;font-size:13px">${esc(report.generatedAt)} · <a href="${esc(report.site)}/sitemap.xml">sitemap.xml</a></p>
      ${actionsHtml}
      <h2 style="font-size:15px;margin:20px 0 4px">Sitemap (${report.sitemap.total} URL:er)</h2>
      <table style="border-collapse:collapse;font-size:14px">${rows}</table>
      <p style="font-size:13px;color:#555;margin:8px 0 0">/sok: ${sok}</p>
      <h2 style="font-size:15px;margin:20px 0 4px">Trasiga URL:er</h2>
      ${brokenHtml}
      <h2 style="font-size:15px;margin:20px 0 4px">Meta-taggar</h2>
      ${metaHtml}
      <h2 style="font-size:15px;margin:20px 0 4px">Nya blogginlägg (7 dagar)</h2>
      ${blogHtml}
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
      <p style="font-size:12px;color:#888;margin:0">IndexNow: pingas veckovis (${esc(report.ping.weeklyCron)}). Nyckel: <a href="${esc(report.ping.indexNowKeyLocation)}">${esc(report.ping.indexNowKeyLocation)}</a>.<br>Manuell submit: <code>/api/admin/seo-ping</code>.</p>
    </div>
  </div></body></html>`;
}
