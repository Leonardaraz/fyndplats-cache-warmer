"use client";

import { useState } from "react";

interface Props {
  defaultPrefix: string;
  defaultBaseUrl: string;
  nextRedirectsSample: string;
  nextRedirectsCount: number;
}

export function SeoTools({
  defaultPrefix,
  defaultBaseUrl,
  nextRedirectsSample,
  nextRedirectsCount,
}: Props) {
  const [prefix, setPrefix] = useState(defaultPrefix);
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);

  const csvUrl = `/api/seo/redirects-csv?newPrefix=${encodeURIComponent(prefix)}`;
  const sitemapUrl = `/api/seo/sitemap?baseUrl=${encodeURIComponent(baseUrl)}&newPrefix=${encodeURIComponent(prefix)}`;
  const fullConfigUrl = `/api/seo/migration-map?newPrefix=${encodeURIComponent(prefix)}`;

  return (
    <section style={{
      marginTop: 16, padding: 16, background: "#f9f9f9", borderRadius: 8,
    }}>
      <h2 style={{ marginTop: 0 }}>Artefakt-generator</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 13 }}>
          <div style={{ marginBottom: 4 }}>Nytt URL-prefix på headless</div>
          <input value={prefix} onChange={(e) => setPrefix(e.target.value)}
            style={input} placeholder="/products/" />
          <div style={hint}>Anpassa om headless-Next.js använder /p/, /store-products/ etc.</div>
        </label>
        <label style={{ fontSize: 13 }}>
          <div style={{ marginBottom: 4 }}>Bas-URL för sitemap</div>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
            style={input} placeholder="https://www.fyndplats.se" />
          <div style={hint}>Headless-sajtens publika domän efter cutover.</div>
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={csvUrl} download
          style={btn}>📥 Ladda ner 301-redirects CSV</a>
        <a href={sitemapUrl} download
          style={btn}>📥 Ladda ner sitemap.xml</a>
        <a href={fullConfigUrl} target="_blank" rel="noreferrer"
          style={btnSecondary}>🔍 Full rapport (JSON)</a>
      </div>

      <h3 style={{ marginTop: 20, fontSize: 16 }}>För headless-repots <code>next.config.js</code></h3>
      <p style={{ fontSize: 13, color: "#666" }}>
        Klistra in följande mönster — full lista har <b>{nextRedirectsCount}</b> redirects.
        Komplett array hämtas från JSON-rapporten ovan.
      </p>
      <pre style={{
        background: "#1e1e1e", color: "#eee", padding: 12, borderRadius: 6,
        fontSize: 12, overflow: "auto",
      }}>{`// next.config.js
module.exports = {
  async redirects() {
    return ${nextRedirectsSample.replace(/\n/g, "\n      ")}
      // ... ytterligare ${Math.max(0, nextRedirectsCount - 3)} redirects, hämta från
      // GET /api/seo/migration-map?newPrefix=${prefix}
      // och plocka report.pairs.map(p => ({ source: p.oldUrl, destination: p.newUrl, permanent: true }))
    ;
  },
};`}</pre>

      <h3 style={{ marginTop: 20, fontSize: 16 }}>robots.txt för headless</h3>
      <pre style={{
        background: "#1e1e1e", color: "#eee", padding: 12, borderRadius: 6,
        fontSize: 12,
      }}>{`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml`}</pre>
    </section>
  );
}

const input: React.CSSProperties = {
  width: "100%", padding: "6px 8px", border: "1px solid #ccc",
  borderRadius: 4, fontSize: 13,
};
const hint: React.CSSProperties = { fontSize: 11, color: "#888", marginTop: 2 };
const btn: React.CSSProperties = {
  padding: "8px 14px", background: "#F47A35", color: "#fff",
  borderRadius: 4, textDecoration: "none", fontSize: 13, fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 14px", background: "#fff", color: "#333",
  border: "1px solid #ccc", borderRadius: 4, textDecoration: "none", fontSize: 13,
};
