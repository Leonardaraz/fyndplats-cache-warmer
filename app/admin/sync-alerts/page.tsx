// /admin/sync-alerts — lista alla öppna sync-alerts som kräver Leonards beslut.
//
// Datakällor:
//   - SyncStore.listAlerts("open")  — det vi visar
//   - SyncStore.listRecentLog(50)   — för audit-trail-länken längst ner
//   - FyndplatsMappings              — för produkt-titel / bild-fallback
//
// Filter (query-param): ?filter=price | content | all (default all)
//
// All UI-text på svenska.

import Link from "next/link";
import { getSyncStore, type SyncAlert } from "@/lib/sync/sync-log";
import {
  approveNewPrice,
  bulkApprovePrices,
  dismissContentAlert,
  keepCurrentPrice,
  removeProduct,
} from "./actions";

export const dynamic = "force-dynamic";

type FilterMode = "all" | "price" | "content";

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

const SEVERITY_COLOR: Record<SyncAlert["severity"], string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#0891b2",
};

const SEVERITY_LABEL: Record<SyncAlert["severity"], string> = {
  high: "Hög",
  medium: "Medel",
  low: "Låg",
};

const SEVERITY_RANK: Record<SyncAlert["severity"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export default async function SyncAlertsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter: FilterMode =
    params.filter === "price" || params.filter === "content" ? params.filter : "all";

  const syncStore = getSyncStore();
  const [allAlerts, recentLog] = await Promise.all([
    syncStore.listAlerts("open", 500),
    syncStore.listRecentLog(30),
  ]);

  const filtered = allAlerts.filter((a) => {
    if (filter === "price") return a.alertType === "price_increase";
    if (filter === "content") return a.alertType === "content_change";
    return true;
  });

  filtered.sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sev !== 0) return sev;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });

  const priceAlerts = filtered.filter((a) => a.alertType === "price_increase");
  const contentAlerts = filtered.filter((a) => a.alertType === "content_change");

  return (
    <main style={{ maxWidth: 1080, margin: "40px auto", padding: "0 16px" }}>
      <p style={{ fontSize: 13 }}>
        <Link href="/admin">← Tillbaka till admin</Link>
      </p>
      <h1>Sync-alerts</h1>
      <p style={{ fontSize: 14, color: "#444" }}>
        Den dagliga AliExpress-syncen flaggar produkter där leverantören ändrat
        något som behöver ditt beslut: prishöjningar som hotar marginalen,
        eller ändringar av titel/bilder. Auto-actions (slut-i-lager, listning
        borttagen) sker tyst i bakgrunden — se händelseloggen längst ner.
      </p>

      <FilterBar current={filter} totals={{ all: allAlerts.length, price: allAlerts.filter((a) => a.alertType === "price_increase").length, content: allAlerts.filter((a) => a.alertType === "content_change").length }} />

      {filtered.length === 0 ? (
        <p style={{ color: "#888", marginTop: 16 }}>Inga öppna alerts att granska.</p>
      ) : null}

      {priceAlerts.length > 0 ? (
        <section style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h2 style={{ margin: 0 }}>Prishöjningar ({priceAlerts.length})</h2>
            {priceAlerts.length > 1 ? <BulkApproveForm alerts={priceAlerts} /> : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            {priceAlerts.map((a) => <PriceAlertCard key={a.id} alert={a} />)}
          </div>
        </section>
      ) : null}

      {contentAlerts.length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2>Innehållsändringar ({contentAlerts.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            {contentAlerts.map((a) => <ContentAlertCard key={a.id} alert={a} />)}
          </div>
        </section>
      ) : null}

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 16 }}>Senaste sync-händelser</h2>
        <p style={{ fontSize: 12, color: "#666" }}>
          De 30 senaste raderna ur sync-loggen. Auto-actions (hide, slut-i-lager,
          återställning) syns här även när de inte producerade en alert.
        </p>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginTop: 8 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#666" }}>
              <th style={{ padding: "4px 6px" }}>Tid</th>
              <th style={{ padding: "4px 6px" }}>Produkt</th>
              <th style={{ padding: "4px 6px" }}>Status</th>
              <th style={{ padding: "4px 6px" }}>Åtgärd</th>
              <th style={{ padding: "4px 6px" }}>Not</th>
            </tr>
          </thead>
          <tbody>
            {recentLog.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "4px 6px", fontFamily: "monospace" }}>
                  {row.checkedAt.slice(0, 16).replace("T", " ")}
                </td>
                <td style={{ padding: "4px 6px", fontFamily: "monospace" }}>
                  {row.productId.slice(0, 14)}…
                </td>
                <td style={{ padding: "4px 6px" }}>{row.listingStatus}</td>
                <td style={{ padding: "4px 6px" }}>{row.actionTaken}</td>
                <td style={{ padding: "4px 6px", color: "#555" }}>{row.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function FilterBar({
  current,
  totals,
}: {
  current: FilterMode;
  totals: { all: number; price: number; content: number };
}) {
  const links: { mode: FilterMode; label: string; count: number }[] = [
    { mode: "all", label: "Alla", count: totals.all },
    { mode: "price", label: "Endast prishöjningar", count: totals.price },
    { mode: "content", label: "Endast innehållsändringar", count: totals.content },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 16, fontSize: 13 }}>
      {links.map((l) => {
        const active = current === l.mode;
        return (
          <Link
            key={l.mode}
            href={l.mode === "all" ? "/admin/sync-alerts" : `/admin/sync-alerts?filter=${l.mode}`}
            style={{
              padding: "5px 11px",
              borderRadius: 6,
              background: active ? "#1f2937" : "#f1f5f9",
              color: active ? "#fff" : "#1f2937",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {l.label} ({l.count})
          </Link>
        );
      })}
    </div>
  );
}

function BulkApproveForm({ alerts }: { alerts: SyncAlert[] }) {
  const total = alerts.length;
  const totalMarginAfter =
    alerts.reduce((sum, a) => sum + (a.projectedMarginPct ?? 0), 0) / Math.max(1, total);
  // Använd HTML5 confirm via onClick i form-action (gick det? — i React server
  // components funkar bara form-attribut + JS-handler i klient). För server-
  // action: använd ett <details>-mönster där knappen syns när "Visa
  // bekräftelse" expanderas. Lättviktigt, inget JS.
  return (
    <details style={{ fontSize: 13 }}>
      <summary
        style={{
          cursor: "pointer",
          padding: "6px 12px",
          background: "#10b981",
          color: "#fff",
          borderRadius: 6,
          listStyle: "none",
          fontWeight: 600,
        }}
      >
        Godkänn alla {total} prishöjningar
      </summary>
      <div
        style={{
          marginTop: 8,
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: 13 }}>
          Du är på väg att godkänna <b>{total}</b> rekommenderade prishöjningar.
          Genomsnittlig projicerad marginal efter höjningen: <b>{totalMarginAfter.toFixed(1)}%</b>.
        </p>
        <form action={bulkApprovePrices} style={{ marginTop: 10 }}>
          {alerts.map((a) => (
            <input key={a.id} type="hidden" name="alertId" value={a.id} />
          ))}
          <button
            type="submit"
            style={{
              background: "#10b981",
              color: "#fff",
              border: "none",
              padding: "6px 14px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Bekräfta — godkänn alla {total}
          </button>
        </form>
      </div>
    </details>
  );
}

function PriceAlertCard({ alert }: { alert: SyncAlert }) {
  const sevColor = SEVERITY_COLOR[alert.severity];
  const margin = alert.projectedMarginPct ?? 0;
  const change = (alert.prevCostUsd ?? 0) > 0 && alert.newCostUsd != null
    ? ((alert.newCostUsd - alert.prevCostUsd!) / alert.prevCostUsd!) * 100
    : 0;

  return (
    <div
      style={{
        border: `1px solid ${sevColor}33`,
        borderLeft: `4px solid ${sevColor}`,
        borderRadius: 8,
        background: "#fff",
        padding: 14,
        display: "flex",
        gap: 14,
      }}
    >
      <Thumb url={alert.imageUrl} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {alert.productName ?? alert.wixProductId}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              <code>{alert.wixProductId.slice(0, 12)}…</code>
              {" · AliExpress: "}
              <code>{alert.aliexpressId}</code>
            </div>
          </div>
          <SeverityBadge severity={alert.severity} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            marginTop: 12,
            fontSize: 13,
          }}
        >
          <Metric
            label="Nuvarande pris"
            value={`${(alert.currentPriceSek ?? 0).toFixed(0)} kr`}
          />
          <Metric
            label="Ursprungs-kost. USD"
            value={(alert.prevCostUsd ?? 0).toFixed(2)}
          />
          <Metric
            label="Nytt inköp USD"
            value={(alert.newCostUsd ?? 0).toFixed(2)}
            sub={change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`}
            subColor={change > 0 ? "#dc2626" : "#16a34a"}
          />
          <Metric
            label="Marginal efter höjning"
            value={`${margin.toFixed(1)}%`}
            valueColor={margin < 0 ? "#dc2626" : margin < 20 ? "#d97706" : "#16a34a"}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "#f8fafc",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          Rekommenderat nytt pris:{" "}
          <b>{(alert.recommendedPriceSek ?? 0).toFixed(0)} kr</b>{" "}
          (kostnad × 2,5 markup + moms)
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <form action={approveNewPrice}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="wixProductId" value={alert.wixProductId} />
            <input type="hidden" name="newPriceSek" value={alert.recommendedPriceSek ?? ""} />
            <button type="submit" style={btn("#16a34a")}>
              Godkänn nytt pris
            </button>
          </form>
          <form action={keepCurrentPrice}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="wixProductId" value={alert.wixProductId} />
            <button type="submit" style={btn("#64748b")}>
              Behåll nuvarande pris
            </button>
          </form>
          <form action={removeProduct}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="wixProductId" value={alert.wixProductId} />
            <button type="submit" style={btn("#dc2626")}>
              Ta bort produkt
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ContentAlertCard({ alert }: { alert: SyncAlert }) {
  const bits: string[] = [];
  if (alert.titleChanged) bits.push("titel ändrad");
  if (alert.imageChanged) bits.push("bilder ändrade");
  const label = bits.join(" + ") || "innehåll ändrat";
  return (
    <div
      style={{
        border: "1px solid #fde68a",
        borderLeft: "4px solid #d97706",
        borderRadius: 8,
        background: "#fefce8",
        padding: 14,
        display: "flex",
        gap: 14,
      }}
    >
      <Thumb url={alert.imageUrl} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {alert.productName ?? alert.wixProductId}
        </div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
          Innehåll ändrat hos leverantör — {label}.
        </div>
        {alert.newTitle ? (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              padding: "8px 10px",
              background: "#fff",
              border: "1px solid #fde68a",
              borderRadius: 6,
            }}
          >
            <b>Ny titel hos AliExpress:</b> {alert.newTitle}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <form action={dismissContentAlert}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="wixProductId" value={alert.wixProductId} />
            <button type="submit" style={btn("#64748b")}>
              Ignorera (behåll vår version)
            </button>
          </form>
          <form action={removeProduct}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="wixProductId" value={alert.wixProductId} />
            <button type="submit" style={btn("#dc2626")}>
              Ta bort produkt
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Thumb({ url }: { url?: string }) {
  if (!url) {
    return (
      <div
        style={{
          width: 70,
          height: 70,
          background: "#f1f5f9",
          borderRadius: 6,
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
    />
  );
}

function SeverityBadge({ severity }: { severity: SyncAlert["severity"] }) {
  const color = SEVERITY_COLOR[severity];
  return (
    <span
      style={{
        background: color,
        color: "#fff",
        padding: "2px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        height: "fit-content",
      }}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

function Metric({
  label,
  value,
  sub,
  subColor,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: valueColor ?? "#1f2937" }}>
        {value}
      </div>
      {sub ? (
        <div style={{ fontSize: 11, color: subColor ?? "#666", fontWeight: 600 }}>{sub}</div>
      ) : null}
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    padding: "6px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  };
}
