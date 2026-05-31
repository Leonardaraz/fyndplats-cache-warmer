// Admin-vy: Lönsamhet per produkt.
//
// Server-component → hämtar aggregerad rapport direkt (utan HTTP/token),
// cachas 5 min via unstable_cache i route-handlern. Klient-komponenten sköter
// sortering, filter, sökning och CSV-export.

import Link from "next/link";
import { buildReport, type ProfitabilityPeriod } from "@/app/api/admin/profitability/route";
import { ProfitabilityDashboard } from "./dashboard-client";
import { refreshProfitability, uploadImportCostsCsv } from "./actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function ProfitabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const periodParam = (sp.period ?? "90d") as ProfitabilityPeriod;
  const period: ProfitabilityPeriod =
    periodParam === "30d" || periodParam === "90d" || periodParam === "all" ? periodParam : "90d";

  let report: Awaited<ReturnType<typeof buildReport>>;
  let loadError: string | null = null;
  try {
    report = await buildReport(period);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "okänt fel";
    report = {
      rows: [],
      summary: {
        totalRevenueSek: 0,
        totalCostSek: 0,
        totalProfitSek: 0,
        averageMarginPercent: 0,
        productsSoldCount: 0,
        productsWithoutSalesCount: 0,
        productsWithoutCostDataCount: 0,
        top5Profitable: [],
        bottom5ZeroSales: [],
      },
      trend: [],
      productsMissingCostData: 0,
      settings: {
        shippingCostSek: 15,
        paymentFeePercent: 3,
        paymentFeeFixedSek: 2,
        vatRatePercent: 25,
        fallbackCostFractionOfNet: 0.3,
      },
      generatedAt: new Date().toISOString(),
      periodDays: 90,
    };
  }

  const showEmptyState =
    !loadError &&
    report.rows.length === 0;
  const showImportBackfillBanner =
    !loadError &&
    report.rows.length > 0 &&
    report.productsMissingCostData / Math.max(1, report.rows.length) > 0.5;

  return (
    <main style={{ maxWidth: 1200, margin: "20px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
      </p>
      <h1>Lönsamhet per produkt</h1>
      <p style={{ fontSize: 14, color: "#444", marginTop: 4 }}>
        Sortera, filtrera och exportera. Vinst = sälj-pris exkl. moms − landad
        inköpskostnad − frakt-estimat ({fmtKr(report.settings.shippingCostSek)}) − Klarna-avgift
        ({report.settings.paymentFeePercent}% + {fmtKr(report.settings.paymentFeeFixedSek)}).
        Period: <b>{periodLabel(period)}</b>. Cache: 5 min.
      </p>

      {loadError ? (
        <div
          style={{
            padding: 12,
            background: "#fde7e7",
            borderRadius: 6,
            color: "#a00",
            marginBottom: 12,
          }}
        >
          <b>Laddningsfel:</b> {loadError}
        </div>
      ) : null}

      {showEmptyState ? (
        <EmptyState />
      ) : (
        <>
          {showImportBackfillBanner ? <BackfillBanner missing={report.productsMissingCostData} total={report.rows.length} /> : null}
          <ProfitabilityDashboard report={report} />
        </>
      )}

      <Tools onUpload={uploadImportCostsCsv} onRefresh={refreshProfitability} settings={report.settings} />

      <p style={{ fontSize: 11, color: "#888", marginTop: 24 }}>
        Senast beräknat: {report.generatedAt.slice(0, 19).replace("T", " ")} UTC ·
        Datakällor: Wix Stores V3 (produkter, pris, lager), FyndplatsMappings
        (inköpskostnad), FyndplatsImportCosts (manuella overrides), Wix eCom
        orders (sålda enheter).
      </p>
    </main>
  );
}

function periodLabel(p: ProfitabilityPeriod): string {
  if (p === "30d") return "senaste 30 dagar";
  if (p === "all") return "hela tiden";
  return "senaste 90 dagar";
}

function fmtKr(n: number): string {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(Math.round(n)) + " kr";
}

function EmptyState() {
  return (
    <div
      style={{
        marginTop: 18,
        padding: 24,
        background: "#fff8ed",
        border: "1px solid #F47A35",
        borderRadius: 8,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Inga produkter hittades</h3>
      <p style={{ marginBottom: 4 }}>
        Vi kunde inte hämta produkter från V3-katalogen (eller så är butiken tom).
        Kontrollera att <code>WIX_API_TOKEN</code> har Stores-Read och att
        <code> HEADLESS_WIX_SITE_ID</code> pekar på rätt site.
      </p>
      <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
        När produkter finns kommer denna sida att aggregera inköp + sälj + sålda
        enheter automatiskt.
      </p>
    </div>
  );
}

function BackfillBanner({ missing, total }: { missing: number; total: number }) {
  return (
    <div
      style={{
        margin: "8px 0 16px",
        padding: 12,
        background: "#FFF4ED",
        border: "1px solid #F47A35",
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      <b>{missing} av {total} produkter</b> saknar exakt inköpsdata och visas med
      antagen kostnad (30% av netto). Ladda upp en CSV nedan för att backfilla
      exakt inköp per produkt.
    </div>
  );
}

function Tools({
  onUpload,
  onRefresh,
  settings,
}: {
  onUpload: (formData: FormData) => Promise<{ saved: number; failed: number; errors: string[] }>;
  onRefresh: () => Promise<void>;
  settings: { shippingCostSek: number; fallbackCostFractionOfNet: number };
}) {
  return (
    <section style={{ marginTop: 28, padding: 16, background: "#f8f8f8", borderRadius: 8 }}>
      <h2 style={{ marginTop: 0, fontSize: 16 }}>Verktyg</h2>

      <h3 style={{ fontSize: 14, marginBottom: 4 }}>Fyll på inköpsdata (CSV)</h3>
      <p style={{ fontSize: 12, color: "#666", marginTop: 0 }}>
        Kolumner: <code>productId,costSek,currency,note</code> (header valfri).
        Skrivs till Wix Data-kollektionen <code>FyndplatsImportCosts</code> som
        manuell override för aggregeringen.
      </p>
      <form action={onUpload} encType="multipart/form-data" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18 }}>
        <input type="file" name="file" accept=".csv,text/csv" required style={{ fontSize: 13 }} />
        <button
          type="submit"
          style={{
            background: "#F47A35",
            color: "#fff",
            border: "none",
            padding: "6px 14px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Ladda upp
        </button>
      </form>

      <h3 style={{ fontSize: 14, marginBottom: 4 }}>Inställningar</h3>
      <ul style={{ fontSize: 12, color: "#666", marginTop: 0 }}>
        <li>Frakt-estimat per enhet: <b>{fmtKr(settings.shippingCostSek)}</b> — ändras via env <code>SHIPPING_COST_ESTIMATE_SEK</code></li>
        <li>Antagen inköp (fallback): <b>{Math.round(settings.fallbackCostFractionOfNet * 100)}% av netto-sälj</b> — ändras via env <code>FALLBACK_COST_FRACTION_OF_NET</code></li>
        <li>Frakt + fallback kan flyttas till Wix Data-collection FyndplatsSettings i nästa iteration.</li>
      </ul>

      <form action={onRefresh}>
        <button
          type="submit"
          style={{
            background: "#fff",
            color: "#1e1e1e",
            border: "1px solid #ddd",
            padding: "6px 14px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          ↻ Tvinga omberäkning (bryt 5-min-cache)
        </button>
      </form>
    </section>
  );
}
