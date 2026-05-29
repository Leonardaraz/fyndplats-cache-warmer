"use client";

import { useState, useTransition } from "react";
import { enrichAllV3Action, type EnrichActionResult } from "./actions";

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
  const [pending, startTransition] = useTransition();
  const [enrichResult, setEnrichResult] = useState<EnrichActionResult | null>(null);

  function runEnrich(dryRun: boolean) {
    setEnrichResult(null);
    startTransition(async () => {
      const res = await enrichAllV3Action(dryRun, baseUrl, prefix);
      setEnrichResult(res);
    });
  }

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

      <h3 style={{ marginTop: 24, fontSize: 16 }}>Enricha V3-katalogen med saknade SEO-taggar</h3>
      <p style={{ fontSize: 13, color: "#666" }}>
        Genererar Product/BreadcrumbList JSON-LD, alla OG-taggar och canonical
        för varje V3-produkt — idempotent (kan köras flera gånger utan dubletter).
        Patchar produkterna direkt via Wix V3 API. Förhandsgranska först med dry-run.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => runEnrich(true)} disabled={pending}
          style={btnSecondary}>
          {pending ? "Kör..." : "🧪 Dry-run (förhandsgranska)"}
        </button>
        <button onClick={() => runEnrich(false)}
          disabled={pending}
          onMouseDown={(e) => {
            if (!confirm("Detta PATCH:ar alla V3-produkter med saknade SEO-taggar. Fortsätt?")) {
              e.preventDefault();
            }
          }}
          style={btn}>
          {pending ? "Patchar..." : "⚡ Enricha alla nu"}
        </button>
        {enrichResult ? (
          <div style={{
            fontSize: 13,
            padding: "8px 12px",
            borderRadius: 4,
            background: enrichResult.ok ? "#e7fde7" : "#fde7e7",
            color: enrichResult.ok ? "#070" : "#a00",
            flexBasis: "100%",
          }}>
            {enrichResult.ok && enrichResult.stats ? (
              <>
                <b>{enrichResult.dryRun ? "DRY-RUN" : "PATCHED"}:</b>{" "}
                {enrichResult.stats.patched} processade,{" "}
                {enrichResult.stats.skipped} hoppade (redan kompletta),{" "}
                {enrichResult.stats.failed} fel av {enrichResult.stats.total} totalt
                {enrichResult.firstErrors && enrichResult.firstErrors.length > 0 ? (
                  <ul style={{ marginTop: 6, fontSize: 12 }}>
                    {enrichResult.firstErrors.map((e, i) => (<li key={i}>{e}</li>))}
                  </ul>
                ) : null}
              </>
            ) : (
              <>Fel: {enrichResult.error}</>
            )}
          </div>
        ) : null}
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
