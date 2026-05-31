import { buildSeoHealthReport, type SeoHealthReport } from "../../../lib/seo-health";

// Admin: SEO-hälsa. Skyddad av proxy.ts (ADMIN_SECRET-cookie). noindex.
// Visar sitemap-täckning, trasiga URL:er, meta-status och submit-läge.
export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LABEL: Record<string, string> = {
  home: "Startsida",
  butik: "/butik",
  "alla-produkter": "/alla-produkter",
  sida: "Informationssidor",
  kategori: "Kategorier (/kategori/*)",
  produkt: "Produkter (/produkt/*)",
  blogg: "Blogginlägg (/blogg/*)",
};

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "ok" | "warn" }) {
  const color = tone === "warn" ? "#b42318" : tone === "ok" ? "#16804a" : "#1c1c1c";
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: "14px 16px", minWidth: 160 }}>
      <div style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export default async function SeoHealthPage() {
  let report: SeoHealthReport | null = null;
  let error: string | null = null;
  try {
    report = await buildSeoHealthReport();
  } catch (e) {
    error = (e as Error).message;
  }

  if (!report) {
    return (
      <section style={{ maxWidth: 760, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui" }}>
        <h1>SEO-hälsa</h1>
        <p style={{ color: "#b42318" }}>Kunde inte bygga rapporten: {error}</p>
      </section>
    );
  }

  const brokenCount = report.crawl?.broken.length ?? 0;
  const metaCount = report.meta?.issues.length ?? 0;

  return (
    <section style={{ maxWidth: 860, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui", color: "#1c1c1c" }}>
      <h1 style={{ marginBottom: 4 }}>SEO-hälsa</h1>
      <p style={{ color: "#777", marginTop: 0, fontSize: 13 }}>
        Genererad {new Date(report.generatedAt).toLocaleString("sv-SE")} ·{" "}
        <a href={`${report.site}/sitemap.xml`}>sitemap.xml</a> · <a href={`${report.site}/robots.txt`}>robots.txt</a>
      </p>

      <div
        style={{
          background: report.healthy ? "#f0fdf4" : "#fff5f5",
          border: `1px solid ${report.healthy ? "#bbf7d0" : "#f3c2c2"}`,
          borderRadius: 10,
          padding: "12px 16px",
          margin: "12px 0 24px",
        }}
      >
        <strong style={{ color: report.healthy ? "#166534" : "#b42318" }}>
          {report.healthy ? "✅ Allt OK" : `⚠️ ${report.issues.length} problem`}
        </strong>
        {report.issues.length > 0 && (
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {report.issues.map((i, n) => (
              <li key={n}>{i}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <Stat label="URL:er i sitemap" value={report.sitemap.total} />
        <Stat label="Trasiga URL:er" value={brokenCount} tone={brokenCount ? "warn" : "ok"} />
        <Stat label="Sidtyper utan meta" value={metaCount} tone={metaCount ? "warn" : "ok"} />
        <Stat label="/sok exkluderad" value={report.sitemap.sokExcluded ? "Ja ✓" : "Nej ✗"} tone={report.sitemap.sokExcluded ? "ok" : "warn"} />
        <Stat label="Nya inlägg (7d)" value={report.blog.newThisWeek.length} />
      </div>

      <h2 style={{ fontSize: 16 }}>Sitemap-uppdelning</h2>
      <table style={{ borderCollapse: "collapse", fontSize: 14, marginBottom: 24 }}>
        <tbody>
          {Object.entries(report.sitemap.breakdown).map(([t, n]) => (
            <tr key={t}>
              <td style={{ padding: "4px 24px 4px 0", color: "#555" }}>{LABEL[t] || t}</td>
              <td style={{ padding: "4px 0", fontWeight: 600, textAlign: "right" }}>{n}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 16 }}>Trasiga URL:er {report.crawl ? `(${report.crawl.checked} kontrollerade, ${report.crawl.skipped} ej kontrollerade)` : ""}</h2>
      {brokenCount === 0 ? (
        <p style={{ color: "#16804a" }}>Inga trasiga URL:er.</p>
      ) : (
        <ul>
          {report.crawl!.broken.map((b) => (
            <li key={b.url}>
              <code>{b.status || "nätverksfel"}</code> — <a href={b.url}>{b.url}</a>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 16 }}>Meta-taggar {report.meta ? `(${report.meta.checked} sidtyper)` : ""}</h2>
      {metaCount === 0 ? (
        <p style={{ color: "#16804a" }}>Alla kontrollerade sidtyper har description + og:image.</p>
      ) : (
        <ul>
          {report.meta!.issues.map((m) => (
            <li key={m.url}>
              <a href={m.url}>{m.url}</a> — saknar {m.missing.join(", ")}
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 16 }}>Nya blogginlägg (senaste 7 dagarna)</h2>
      {report.blog.newThisWeek.length === 0 ? (
        <p style={{ color: "#555" }}>Inga nya inlägg.</p>
      ) : (
        <ul>
          {report.blog.newThisWeek.map((p) => (
            <li key={p.slug}>
              <a href={`${report.site}/blogg/${p.slug}`}>{p.title}</a> ({p.date})
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 16 }}>Submit-status</h2>
      <ul style={{ fontSize: 14 }}>
        <li>
          <strong>Bing / Yandex (IndexNow):</strong> nyckel publicerad på{" "}
          <a href={report.ping.indexNowKeyLocation}>{report.ping.indexNowKeyLocation}</a>. Veckovis ping{" "}
          {report.ping.weeklyCron}.
        </li>
        <li>
          <strong>Google:</strong> sitemap-ping varje måndag {report.ping.weeklyCron} (legacy-endpoint, best-effort —
          Google stödjer inte IndexNow; Search Console är den garanterade vägen).
        </li>
      </ul>

      <p style={{ marginTop: 20 }}>
        <a
          href="/api/admin/seo-ping"
          style={{
            display: "inline-block",
            background: "#1c1c1c",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Submit sitemap nu (IndexNow + Google) →
        </a>
      </p>
    </section>
  );
}
