"use client";

// Klient-komponenten för /admin/profitability.
// Hanterar sortering, filter, sökning, CSV-export och period-byte.
// Period-byte navigerar med ?period=30d|90d|all så att server-komponenten
// (med 5-min cache) sköter omberäkningen.

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProfitabilityReport, ProfitabilityRow } from "@/lib/analytics/profitability";

const HEADLESS_SITE_ID = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";

interface Props {
  report: ProfitabilityReport;
}

type SortKey =
  | "name"
  | "costSek"
  | "sellingPriceSek"
  | "marginPerUnitSek"
  | "marginPercent"
  | "unitsSold"
  | "totalProfitSek";

interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

export function ProfitabilityDashboard({ report }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "totalProfitSek", dir: "desc" });
  const [hideZeroSales, setHideZeroSales] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = report.rows;
    if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.productId.includes(q));
    if (hideZeroSales) rows = rows.filter((r) => r.unitsSold > 0);
    return sortRows(rows, sort);
  }, [report.rows, query, sort, hideZeroSales]);

  const period = (search.get("period") ?? "90d") as "30d" | "90d" | "all";

  function setPeriod(p: "30d" | "90d" | "all") {
    const params = new URLSearchParams(search.toString());
    params.set("period", p);
    startTransition(() => router.push(`/admin/profitability?${params.toString()}`));
  }

  function toggleSort(key: SortKey) {
    setSort((cur) => {
      if (cur.key === key) return { key, dir: cur.dir === "asc" ? "desc" : "asc" };
      // För namn-kolumnen — default A→Z; numeriska kolumner — default högst först.
      return { key, dir: key === "name" ? "asc" : "desc" };
    });
  }

  function exportCsv() {
    const headers = [
      "productId",
      "namn",
      "inköp_sek",
      "kostnad_källa",
      "sälj_pris_sek",
      "marginal_kr",
      "marginal_pct",
      "antal_sålda",
      "total_vinst_sek",
      "total_intäkt_sek",
      "lager_status",
      "senast_såld",
    ];
    const rows = filtered.map((r) => [
      r.productId,
      csvEscape(r.name),
      String(r.costSek),
      r.costSource,
      String(r.sellingPriceSek),
      String(r.marginPerUnitSek),
      String(r.marginPercent),
      String(r.unitsSold),
      String(r.totalProfitSek),
      String(r.totalRevenueSek),
      r.inStock ? "i_lager" : "slut_i_lager",
      r.lastSoldAt ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fyndplats-lönsamhet-${period}-${todayStamp()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* SUMMARY CARDS */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Card label="Intäkt totalt" value={fmtKr(report.summary.totalRevenueSek)} color="#1e1e1e" />
        <Card label="Inköpskostnad" value={fmtKr(report.summary.totalCostSek)} color="#1e1e1e" />
        <Card label="Vinst totalt" value={fmtKr(report.summary.totalProfitSek)} color="#16a34a" />
        <Card label="Snittmarginal" value={`${report.summary.averageMarginPercent}%`} color="#1e1e1e" />
        <Card label="Sålda produkter" value={String(report.summary.productsSoldCount)} />
        <Card
          label="Utan försäljning"
          value={String(report.summary.productsWithoutSalesCount)}
          color={report.summary.productsWithoutSalesCount > 0 ? "#F47A35" : "#070"}
        />
      </div>

      {/* TREND CHART */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 16, marginBottom: 6 }}>Vinst-trend</h2>
        <ProfitTrendChart trend={report.trend} />
      </div>

      {/* PERIOD + FILTER + SÖK + EXPORT */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
          padding: "10px 12px",
          background: "#f8f8f8",
          borderRadius: 8,
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {(["30d", "90d", "all"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              disabled={isPending}
              style={{
                background: period === p ? "#F47A35" : "#fff",
                color: period === p ? "#fff" : "#444",
                border: "1px solid #ddd",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {p === "30d" ? "Senaste 30 dagar" : p === "90d" ? "Senaste 90 dagar" : "Hela tiden"}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Sök produktnamn…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: "1 1 200px",
            padding: "6px 10px",
            border: "1px solid #ddd",
            borderRadius: 6,
            fontSize: 13,
          }}
        />

        <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={hideZeroSales}
            onChange={(e) => setHideZeroSales(e.target.checked)}
          />
          Dölj 0-säljare
        </label>

        <button
          type="button"
          onClick={exportCsv}
          style={{
            background: "#16a34a",
            color: "#fff",
            border: "none",
            padding: "6px 14px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Exportera CSV ({filtered.length})
        </button>
      </div>

      {isPending ? (
        <p style={{ color: "#888", fontSize: 13 }}>Laddar period…</p>
      ) : null}

      {/* TABELL */}
      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 8 }}>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "#fafafa", zIndex: 1 }}>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <th style={th}>Bild</th>
              <SortHeader label="Namn" k="name" sort={sort} onClick={toggleSort} align="left" />
              <SortHeader label="Inköp" k="costSek" sort={sort} onClick={toggleSort} />
              <SortHeader label="Sälj-pris" k="sellingPriceSek" sort={sort} onClick={toggleSort} />
              <SortHeader label="Marginal kr" k="marginPerUnitSek" sort={sort} onClick={toggleSort} />
              <SortHeader label="Marginal %" k="marginPercent" sort={sort} onClick={toggleSort} />
              <SortHeader label="Antal sålda" k="unitsSold" sort={sort} onClick={toggleSort} />
              <SortHeader label="Total vinst" k="totalProfitSek" sort={sort} onClick={toggleSort} />
              <th style={th}>Lager</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 18, textAlign: "center", color: "#888" }}>
                  Inga produkter matchar filtren.
                </td>
              </tr>
            ) : (
              filtered.map((r) => <Row key={r.productId} row={r} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ row }: { row: ProfitabilityRow }) {
  const editorUrl = `https://manage.wix.com/dashboard/${HEADLESS_SITE_ID}/store/products/${row.productId}`;
  const missing = row.costSource === "missing";
  const fallback = row.costSource === "fallback-pct";
  return (
    <tr style={{ borderBottom: "1px solid #f1f1f1", background: row.totalProfitSek < 0 ? "#fff5f5" : undefined }}>
      <td style={td}>
        {row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.imageUrl}
            alt=""
            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, background: "#f0f0f0" }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: 40, height: 40, background: "#f0f0f0", borderRadius: 4 }} />
        )}
      </td>
      <td style={{ ...td, maxWidth: 320 }}>
        <a
          href={editorUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1e1e1e", textDecoration: "none", fontWeight: 500 }}
          title="Öppna i Wix-redigeraren"
        >
          {row.name || row.productId}
        </a>
        <div style={{ fontSize: 11, color: "#888" }}>
          <code>{row.productId.slice(0, 8)}…</code>
        </div>
      </td>
      <td style={{ ...td, textAlign: "right" }}>
        {missing ? (
          <span style={{ color: "#a00", fontSize: 12 }}>— Saknas (fyll i manuellt)</span>
        ) : (
          <span title={fallback ? "Antagen (30% av netto)" : "Faktisk inköp från import"}>
            {fmtKr(row.costSek)}
            {fallback ? <sup style={{ color: "#F47A35", marginLeft: 2 }}>~</sup> : null}
          </span>
        )}
      </td>
      <td style={{ ...td, textAlign: "right" }}>{fmtKr(row.sellingPriceSek)}</td>
      <td style={{ ...td, textAlign: "right", color: row.marginPerUnitSek < 0 ? "#a00" : "#1e1e1e" }}>
        {fmtKr(row.marginPerUnitSek)}
      </td>
      <td style={{ ...td, textAlign: "right", color: row.marginPercent < 10 ? "#F47A35" : "#16a34a" }}>
        {row.marginPercent}%
      </td>
      <td style={{ ...td, textAlign: "right" }}>{row.unitsSold}</td>
      <td
        style={{
          ...td,
          textAlign: "right",
          fontWeight: 600,
          color: row.totalProfitSek > 0 ? "#16a34a" : row.totalProfitSek < 0 ? "#a00" : "#888",
        }}
      >
        {fmtKr(row.totalProfitSek)}
      </td>
      <td style={td}>
        {row.inStock ? (
          <span style={{ fontSize: 11, color: "#070" }}>I lager</span>
        ) : (
          <span style={{ fontSize: 11, color: "#a00" }}>Slut</span>
        )}
      </td>
    </tr>
  );
}

function SortHeader({
  label,
  k,
  sort,
  onClick,
  align = "right",
}: {
  label: string;
  k: SortKey;
  sort: SortState;
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  return (
    <th
      style={{ ...th, textAlign: align, cursor: "pointer", userSelect: "none" }}
      onClick={() => onClick(k)}
      title="Klicka för att sortera"
    >
      {label} {active ? (sort.dir === "asc" ? "▲" : "▼") : <span style={{ color: "#ccc" }}>↕</span>}
    </th>
  );
}

function ProfitTrendChart({ trend }: { trend: { date: string; profitSek: number; revenueSek: number }[] }) {
  if (trend.length === 0) {
    return (
      <div
        style={{
          height: 120,
          border: "1px dashed #ddd",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#888",
          fontSize: 13,
        }}
      >
        Ingen försäljningsdata för perioden.
      </div>
    );
  }

  const w = 880;
  const h = 140;
  const padX = 28;
  const padY = 16;

  const maxRevenue = Math.max(1, ...trend.map((p) => p.revenueSek));
  const maxProfit = Math.max(1, ...trend.map((p) => Math.abs(p.profitSek)));
  const stepX = trend.length > 1 ? (w - padX * 2) / (trend.length - 1) : 0;

  const revPath = trend
    .map((p, i) => {
      const x = padX + i * stepX;
      const y = h - padY - (p.revenueSek / maxRevenue) * (h - padY * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const profPath = trend
    .map((p, i) => {
      const x = padX + i * stepX;
      const y = h - padY - (Math.max(0, p.profitSek) / maxProfit) * (h - padY * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const firstDate = trend[0]?.date ?? "";
  const lastDate = trend[trend.length - 1]?.date ?? "";

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 8, background: "#fff" }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 140 }}>
        <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="#eee" />
        <path d={revPath} fill="none" stroke="#cbd5e1" strokeWidth={1.5} />
        <path d={profPath} fill="none" stroke="#16a34a" strokeWidth={2} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888" }}>
        <span>{firstDate}</span>
        <span>
          <span style={{ color: "#cbd5e1" }}>━</span> Brutto-intäkt &nbsp;
          <span style={{ color: "#16a34a" }}>━</span> Beräknad vinst
        </span>
        <span>{lastDate}</span>
      </div>
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        padding: 10,
        border: "1px solid #ddd",
        borderRadius: 6,
        flex: "1 1 160px",
        minWidth: 150,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color ?? "#222" }}>{value}</div>
    </div>
  );
}

function sortRows(rows: ProfitabilityRow[], { key, dir }: SortState): ProfitabilityRow[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[key];
    const bv = (b as unknown as Record<string, unknown>)[key];
    if (typeof av === "string" && typeof bv === "string") return sign * av.localeCompare(bv, "sv");
    const an = typeof av === "number" ? av : 0;
    const bn = typeof bv === "number" ? bv : 0;
    return sign * (an - bn);
  });
}

const th: React.CSSProperties = { padding: "8px 10px", textAlign: "right", fontSize: 12, fontWeight: 600 };
const td: React.CSSProperties = { padding: "8px 10px" };

function fmtKr(n: number): string {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(Math.round(n)) + " kr";
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function todayStamp(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}
