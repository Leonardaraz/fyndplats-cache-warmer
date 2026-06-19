"use client";

import { useState, useTransition } from "react";
import {
  enrichAllV3Action,
  migrateDescriptionsAction,
  migrateInfoSectionsAction,
  pingAllIndexNowAction,
  type EnrichActionResult,
  type MigrateDescriptionsResult,
  type MigrateInfoSectionsResult,
  type PingIndexNowResult,
} from "./actions";

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
  const [descPending, startDescTransition] = useTransition();
  const [descResult, setDescResult] = useState<MigrateDescriptionsResult | null>(null);
  const [infoPending, startInfoTransition] = useTransition();
  const [infoResult, setInfoResult] = useState<MigrateInfoSectionsResult | null>(null);
  const [indexNowPending, startIndexNowTransition] = useTransition();
  const [indexNowResult, setIndexNowResult] = useState<PingIndexNowResult | null>(null);

  function runEnrich(dryRun: boolean) {
    setEnrichResult(null);
    startTransition(async () => {
      const res = await enrichAllV3Action(dryRun, baseUrl, prefix);
      setEnrichResult(res);
    });
  }

  function runMigrateDesc(dryRun: boolean) {
    setDescResult(null);
    startDescTransition(async () => {
      const res = await migrateDescriptionsAction(dryRun);
      setDescResult(res);
    });
  }

  function runMigrateInfo(dryRun: boolean) {
    setInfoResult(null);
    startInfoTransition(async () => {
      const res = await migrateInfoSectionsAction(dryRun);
      setInfoResult(res);
    });
  }

  function runIndexNow(dryRun: boolean) {
    setIndexNowResult(null);
    startIndexNowTransition(async () => {
      const res = await pingAllIndexNowAction(dryRun);
      setIndexNowResult(res);
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
        <a href="/api/seo/feed" target="_blank" rel="noreferrer"
          style={btnSecondary}>🛒 Produktfeed (Shopping/Prisjakt)</a>
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
        <button
          onClick={() => {
            if (!confirm("Detta PATCH:ar alla V3-produkter med saknade SEO-taggar. Fortsätt?")) {
              return;
            }
            runEnrich(false);
          }}
          disabled={pending}
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
                <b>{enrichResult.dryRun ? "DRY-RUN" : "PATCHED"}{enrichResult.isDone ? " ✅" : "..."}:</b>{" "}
                {enrichResult.stats.processedSoFar}/{enrichResult.stats.total} processade ·{" "}
                {enrichResult.stats.patched} patchade ·{" "}
                {enrichResult.stats.skipped} hoppade ·{" "}
                {enrichResult.stats.failed} fel
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

      <h3 style={{ marginTop: 24, fontSize: 16 }}>Migrera produktbeskrivningar V1 → V3</h3>
      <p style={{ fontSize: 13, color: "#666" }}>
        Kopierar den rika HTML-brödtexten (rubriker, listor, bilder) från gamla
        Wix-sajten till nya V3-katalogen. Matchar på produktnamn, sätter
        <code> plainDescription</code> — Wix genererar Ricos automatiskt för
        storefronten. Idempotent: produkter som redan har beskrivning hoppas över.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => runMigrateDesc(true)} disabled={descPending}
          style={btnSecondary}>
          {descPending ? "Kör..." : "🧪 Dry-run (förhandsgranska)"}
        </button>
        <button
          onClick={() => {
            if (!confirm("Detta migrerar produktbeskrivningar från V1 → V3. Fortsätt?")) {
              return;
            }
            runMigrateDesc(false);
          }}
          disabled={descPending}
          style={btn}>
          {descPending ? "Migrerar..." : "📝 Migrera alla beskrivningar"}
        </button>
        {descResult ? (
          <div style={{
            fontSize: 13, padding: "8px 12px", borderRadius: 4, flexBasis: "100%",
            background: descResult.ok ? "#e7fde7" : "#fde7e7",
            color: descResult.ok ? "#070" : "#a00",
          }}>
            {descResult.ok && descResult.stats ? (
              <>
                <b>{descResult.dryRun ? "DRY-RUN" : "MIGRERAT ✅"}:</b>{" "}
                {descResult.dryRun ? descResult.stats.toMigrate : descResult.stats.migrated} av{" "}
                {descResult.stats.v3Total} produkter ·{" "}
                {descResult.stats.alreadyHad} hade redan ·{" "}
                {descResult.stats.noV1Source} saknar V1-källa ·{" "}
                {descResult.stats.unmatched} omatchade ·{" "}
                {descResult.stats.failed} fel
                {descResult.firstErrors && descResult.firstErrors.length > 0 ? (
                  <ul style={{ marginTop: 6, fontSize: 12 }}>
                    {descResult.firstErrors.map((e, i) => (<li key={i}>{e}</li>))}
                  </ul>
                ) : null}
              </>
            ) : (
              <>Fel: {descResult.error}</>
            )}
          </div>
        ) : null}
      </div>

      <h3 style={{ marginTop: 24, fontSize: 16 }}>Migrera V1-flikar (Specs/FAQ/Användning) till V3</h3>
      <p style={{ fontSize: 13, color: "#666" }}>
        Gamla Wix-sajten hade fyra flikar under produktbeskrivningen: Tekniska
        specifikationer, Användning och skötsel, Vanliga frågor, Kontakta oss.
        V3 har ett tak på 400 sektioner per site → 207 produkter × 4 sektioner
        passar inte. Lägger istället till dem som <code>&lt;h2&gt;</code>-block
        i slutet av <code>plainDescription</code>. Idempotent (skippar
        produkter där H2-sektionerna redan finns).
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => runMigrateInfo(true)} disabled={infoPending}
          style={btnSecondary}>
          {infoPending ? "Kör..." : "🧪 Dry-run (förhandsgranska)"}
        </button>
        <button
          onClick={() => {
            if (!confirm("Lägger till V1-flikar (specs/FAQ/användning/kontakt) i V3-beskrivningar. Fortsätt?")) {
              return;
            }
            runMigrateInfo(false);
          }}
          disabled={infoPending}
          style={btn}>
          {infoPending ? "Migrerar..." : "📑 Migrera flikar"}
        </button>
        {infoResult ? (
          <div style={{
            fontSize: 13, padding: "8px 12px", borderRadius: 4, flexBasis: "100%",
            background: infoResult.ok ? "#e7fde7" : "#fde7e7",
            color: infoResult.ok ? "#070" : "#a00",
          }}>
            {infoResult.ok && infoResult.stats ? (
              <>
                <b>{infoResult.dryRun ? "DRY-RUN" : "MIGRERAT ✅"}:</b>{" "}
                {infoResult.dryRun ? infoResult.stats.toMigrate : infoResult.stats.migrated} av{" "}
                {infoResult.stats.v3Total} produkter ·{" "}
                {infoResult.stats.alreadyHad} hade redan flikar ·{" "}
                {infoResult.stats.noV1Sections} saknar V1-flikar ·{" "}
                {infoResult.stats.unmatched} omatchade ·{" "}
                {infoResult.stats.failed} fel
                {infoResult.firstErrors && infoResult.firstErrors.length > 0 ? (
                  <ul style={{ marginTop: 6, fontSize: 12 }}>
                    {infoResult.firstErrors.map((e, i) => (<li key={i}>{e}</li>))}
                  </ul>
                ) : null}
              </>
            ) : (
              <>Fel: {infoResult.error}</>
            )}
          </div>
        ) : null}
      </div>

      <h3 style={{ marginTop: 24, fontSize: 16 }}>IndexNow — be sökmotorer crawla katalogen nu</h3>
      <p style={{ fontSize: 13, color: "#666" }}>
        Pingar IndexNow (Bing/Yandex m.fl.) för <b>alla synliga</b> produkter så
        de köas för snabb (om)crawl. Ren uppsida — kan bara begära crawl, aldrig
        sänka ranking. Nya/ändrade produkter pingas automatiskt vid publicering +
        dagligen via cron; den här knappen är för en engångs-backfill av hela
        katalogen. Kräver <code>INDEXNOW_KEY</code> i env och nyckelfilen{" "}
        <code>{`{key}.txt`}</code> på storefront-roten. Dry-run visar URL-listan först.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => runIndexNow(true)} disabled={indexNowPending}
          style={btnSecondary}>
          {indexNowPending ? "Kör..." : "🧪 Dry-run (förhandsgranska)"}
        </button>
        <button
          onClick={() => {
            if (!confirm("Pingar IndexNow för alla synliga produkter. Fortsätt?")) {
              return;
            }
            runIndexNow(false);
          }}
          disabled={indexNowPending}
          style={btn}>
          {indexNowPending ? "Pingar..." : "📡 Pinga alla nu"}
        </button>
        {indexNowResult ? (
          <div style={{
            fontSize: 13, padding: "8px 12px", borderRadius: 4, flexBasis: "100%",
            background: indexNowResult.ok ? "#e7fde7" : "#fde7e7",
            color: indexNowResult.ok ? "#070" : "#a00",
          }}>
            {indexNowResult.ok ? (
              <>
                <b>{indexNowResult.dryRun ? "DRY-RUN" : "PINGAT ✅"}:</b>{" "}
                {indexNowResult.dryRun ? indexNowResult.toPing : indexNowResult.pinged} av{" "}
                {indexNowResult.total} synliga produkter
                {indexNowResult.dryRun ? " skulle pingas" : " pingade"}
                {!indexNowResult.configured ? " · ⚠️ INDEXNOW_KEY saknas" : ""}
                {indexNowResult.sampleUrls && indexNowResult.sampleUrls.length > 0 ? (
                  <ul style={{ marginTop: 6, fontSize: 12 }}>
                    {indexNowResult.sampleUrls.map((u, i) => (<li key={i}>{u}</li>))}
                  </ul>
                ) : null}
              </>
            ) : (
              <>Fel: {indexNowResult.error}</>
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
