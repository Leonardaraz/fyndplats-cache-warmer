// Admin: SEO-migrationsverktyg
//
// Visar V1↔V3-matchningsstatus, slug-diff och SEO-completeness för nya katalogen.
// Genererar nedladdningsbara artefakter (301-CSV, sitemap.xml, Next-redirects).

import { listAllV1Products, type WixV1ProductSummary } from "@/lib/wix/v1-products";
import { listAllV3Products, type WixV3ProductSummary } from "@/lib/wix/v3-products";
import { buildMigrationReport, toNextRedirectsConfig } from "@/lib/seo/migration";
import { SeoTools } from "./tools";

export const dynamic = "force-dynamic";

const DEFAULT_NEW_PREFIX = "/products/";
const DEFAULT_BASE_URL = "https://www.fyndplats.se";

export default async function SeoMigrationPage() {
  let v1: WixV1ProductSummary[];
  let v3: WixV3ProductSummary[];
  let loadError: string | null = null;
  try {
    [v1, v3] = await Promise.all([listAllV1Products(), listAllV3Products()]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "okänt laddningsfel";
    v1 = [];
    v3 = [];
  }

  const report = buildMigrationReport(v1, v3, DEFAULT_NEW_PREFIX);
  const nextConfig = toNextRedirectsConfig(report.pairs);

  const v3SeoMissing = v3.filter(
    (p) => !p.hasSeoTitle || !p.hasSeoDescription || !p.hasImage || !p.hasDescription,
  );

  return (
    <main style={{ maxWidth: 1100, margin: "20px auto", padding: "0 16px" }}>
      <h1>SEO-migration: Wix → Headless</h1>
      <p style={{ color: "#666" }}>
        Audit och artefaktgenerator inför DNS-cutover. Bygger 301-redirect-mapp
        från gamla <code>/product-page/[slug]</code> till nya headless-URL:er,
        sitemap.xml för Search Console, och flaggar V3-produkter som saknar
        SEO-fält.
      </p>

      {loadError ? (
        <div style={{
          padding: 12, background: "#fde7e7", borderRadius: 6,
          color: "#a00", marginBottom: 12,
        }}>
          <b>Laddningsfel:</b> {loadError}
        </div>
      ) : null}

      <h2>Matchning V1 ↔ V3</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Stat label="V1 (gammal katalog)" value={report.stats.v1Total} />
        <Stat label="V3 (ny katalog)" value={report.stats.v3Total} />
        <Stat label="Matchade par" value={report.stats.matched} color="#070" />
        <Stat label="Identiska slugs" value={report.stats.slugIdentical} color="#070" />
        <Stat label="Slug ändrade (kräver 301)" value={report.stats.slugDifferent}
          color={report.stats.slugDifferent > 0 ? "#F47A35" : "#070"} />
        <Stat label="V1 utan match (tappas)" value={report.v1Orphans.length}
          color={report.v1Orphans.length > 0 ? "#a00" : "#070"} />
        <Stat label="V3 utan match (nya)" value={report.v3Orphans.length} />
      </div>

      <h2>SEO-completeness i nya V3-katalogen</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Stat label="Saknar SEO-titel" value={v3.filter((p) => !p.hasSeoTitle).length}
          color={v3.filter((p) => !p.hasSeoTitle).length > 0 ? "#a00" : "#070"} />
        <Stat label="Saknar meta description" value={v3.filter((p) => !p.hasSeoDescription).length}
          color={v3.filter((p) => !p.hasSeoDescription).length > 0 ? "#a00" : "#070"} />
        <Stat label="Saknar JSON-LD" value={v3.filter((p) => !p.hasJsonLd).length}
          color={v3.filter((p) => !p.hasJsonLd).length > 0 ? "#F47A35" : "#070"} />
        <Stat label="Saknar OG-taggar" value={v3.filter((p) => !p.hasOgTags).length}
          color={v3.filter((p) => !p.hasOgTags).length > 0 ? "#F47A35" : "#070"} />
        <Stat label="Saknar bild" value={v3.filter((p) => !p.hasImage).length}
          color={v3.filter((p) => !p.hasImage).length > 0 ? "#a00" : "#070"} />
        <Stat label="Saknar beskrivning" value={v3.filter((p) => !p.hasDescription).length}
          color={v3.filter((p) => !p.hasDescription).length > 0 ? "#a00" : "#070"} />
      </div>

      <SeoTools defaultPrefix={DEFAULT_NEW_PREFIX} defaultBaseUrl={DEFAULT_BASE_URL}
        nextRedirectsSample={JSON.stringify(nextConfig.slice(0, 3), null, 2)}
        nextRedirectsCount={nextConfig.length} />

      {report.v1Orphans.length > 0 ? (
        <>
          <h2 style={{ marginTop: 24 }}>⚠️ V1-produkter utan V3-match (tappas vid cutover)</h2>
          <p style={{ color: "#666", fontSize: 13 }}>
            Dessa Google-indexerade URL:er får ingen destination — antingen
            återskapa produkten i V3 eller låt 404 levereras (då droppar Google
            URL:en från index).
          </p>
          <ul style={{ fontSize: 13 }}>
            {report.v1Orphans.slice(0, 30).map((p) => (
              <li key={p.id}>
                <code>{p.oldPath}</code> — {p.name}
              </li>
            ))}
            {report.v1Orphans.length > 30 ? (
              <li>... och {report.v1Orphans.length - 30} till</li>
            ) : null}
          </ul>
        </>
      ) : null}

      {v3SeoMissing.length > 0 ? (
        <>
          <h2 style={{ marginTop: 24 }}>🔧 V3-produkter som behöver SEO-fix innan go-live</h2>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f1f1" }}>
                <th style={th}>Produkt</th>
                <th style={th}>Title</th>
                <th style={th}>Desc</th>
                <th style={th}>Bild</th>
                <th style={th}>Brödtext</th>
                <th style={th}>JSON-LD</th>
                <th style={th}>OG</th>
              </tr>
            </thead>
            <tbody>
              {v3SeoMissing.slice(0, 50).map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={td}>{p.name.slice(0, 60)}</td>
                  <td style={td}>{p.hasSeoTitle ? "✓" : "✗"}</td>
                  <td style={td}>{p.hasSeoDescription ? "✓" : "✗"}</td>
                  <td style={td}>{p.hasImage ? "✓" : "✗"}</td>
                  <td style={td}>{p.hasDescription ? "✓" : "✗"}</td>
                  <td style={td}>{p.hasJsonLd ? "✓" : "✗"}</td>
                  <td style={td}>{p.hasOgTags ? "✓" : "✗"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {v3SeoMissing.length > 50 ? (
            <p style={{ fontSize: 12, color: "#666" }}>
              Visar 50 av {v3SeoMissing.length} produkter med SEO-luckor.
            </p>
          ) : null}
        </>
      ) : null}
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{
      padding: 10, border: "1px solid #ddd", borderRadius: 6,
      flex: "1 1 150px", minWidth: 140, background: "#fff",
    }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? "#222" }}>{value}</div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 8px", textAlign: "left", fontSize: 12 };
const td: React.CSSProperties = { padding: "6px 8px" };
