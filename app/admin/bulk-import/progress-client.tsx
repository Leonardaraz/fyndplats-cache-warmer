"use client";

import { useEffect, useState, useTransition } from "react";
import { stopJobAction } from "./actions";

interface BulkItem {
  id: string;
  rowIndex: number;
  aliexpressUrl: string;
  collectionSlug?: string;
  targetPriceSek?: number;
  status: "pending" | "importing" | "done" | "failed" | "skipped";
  attempts: number;
  wixProductId?: string;
  error?: string;
  attemptedAt?: string;
  completedAt?: string;
}

interface BulkJob {
  id: string;
  createdAt: string;
  status: "pending" | "running" | "completed" | "failed" | "stopped";
  totalRows: number;
  succeeded: number;
  failed: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  notes?: string;
}

interface Snapshot {
  job: BulkJob;
  items: BulkItem[];
  avgSecondsPerItem: number | null;
  etaSeconds: number | null;
}

interface Props {
  jobId: string;
  token: string;
  initial: Snapshot;
}

const STATUS_LABEL: Record<BulkItem["status"], string> = {
  pending: "I kö",
  importing: "Importeras",
  done: "Klar",
  failed: "Misslyckad",
  skipped: "Hoppad",
};

const STATUS_COLOR: Record<BulkItem["status"], string> = {
  pending: "#64748b",
  importing: "#0891b2",
  done: "#16a34a",
  failed: "#dc2626",
  skipped: "#9ca3af",
};

export function ProgressClient({ jobId, token, initial }: Props): React.JSX.Element {
  const [snap, setSnap] = useState<Snapshot>(initial);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (snap.job.status === "completed" || snap.job.status === "failed" || snap.job.status === "stopped") {
      return;
    }
    const url = `/api/admin/bulk-import/${encodeURIComponent(jobId)}/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    es.addEventListener("snapshot", (e) => setSnap(JSON.parse((e as MessageEvent).data)));
    es.addEventListener("update", (e) => setSnap(JSON.parse((e as MessageEvent).data)));
    es.addEventListener("done", () => es.close());
    es.addEventListener("error", () => {
      // EventSource emiterar `error` både på network-fel och normal close.
      // Vi loggar bara om streamen inte är CLOSED — annars är det förväntat.
      if (es.readyState === EventSource.CLOSED) return;
      setStreamError("Anslutning till live-uppdateringen bröts — ladda om sidan för senaste status.");
    });
    return () => es.close();
  }, [jobId, token, snap.job.status]);

  const completed = snap.job.succeeded + snap.job.failed;
  const pct = snap.job.totalRows > 0 ? Math.round((completed / snap.job.totalRows) * 100) : 0;
  const isActive = snap.job.status === "pending" || snap.job.status === "running";

  const onStop = (): void => {
    if (!confirm("Stoppa pågående bulk-import? Items som redan körts behåller sin status.")) return;
    startTransition(async () => {
      const res = await stopJobAction(jobId);
      if (!res.ok) alert(`Kunde inte stoppa: ${res.error}`);
    });
  };

  const exportUrl = `/api/admin/bulk-import/${encodeURIComponent(jobId)}/export?token=${encodeURIComponent(token)}`;

  return (
    <section style={{ marginTop: 20 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            Jobb <code>{snap.job.id}</code> — {jobStatusLabel(snap.job.status)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            Skapat {new Date(snap.job.createdAt).toLocaleString("sv-SE")}
            {snap.job.notes ? ` · "${snap.job.notes}"` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isActive ? (
            <button
              type="button"
              onClick={onStop}
              disabled={isPending}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isPending ? "Stoppar…" : "Stoppa"}
            </button>
          ) : null}
          <a
            href={exportUrl}
            style={{
              background: "#fff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Exportera resultat som CSV
          </a>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#475569" }}>
          <span>Totalt: <b>{snap.job.totalRows}</b></span>
          <span>Klara: <b style={{ color: "#16a34a" }}>{snap.job.succeeded}</b></span>
          <span>Misslyckade: <b style={{ color: "#dc2626" }}>{snap.job.failed}</b></span>
          <span>I kö: <b>{snap.items.filter((i) => i.status === "pending").length}</b></span>
          <span>Pågående: <b>{snap.items.filter((i) => i.status === "importing").length}</b></span>
          {snap.etaSeconds !== null && snap.etaSeconds > 0 ? (
            <span>ETA: <b>{formatEta(snap.etaSeconds)}</b></span>
          ) : null}
        </div>
        <div style={{
          marginTop: 6,
          height: 10,
          background: "#e2e8f0",
          borderRadius: 5,
          overflow: "hidden",
        }}>
          <div style={{
            width: `${pct}%`,
            height: "100%",
            background: snap.job.status === "failed" ? "#dc2626" : "#16a34a",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {streamError ? (
        <p style={{ fontSize: 12, color: "#b45309", marginTop: 8 }}>{streamError}</p>
      ) : null}

      <h3 style={{ fontSize: 15, marginTop: 20, marginBottom: 6 }}>Rad-status</h3>
      <div style={{ maxHeight: 460, overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 6 }}>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead style={{ background: "#f1f5f9", position: "sticky", top: 0 }}>
            <tr>
              <th style={th()}>#</th>
              <th style={th()}>Status</th>
              <th style={th()}>URL</th>
              <th style={th()}>Försök</th>
              <th style={th()}>Wix-produkt</th>
              <th style={th()}>Fel</th>
            </tr>
          </thead>
          <tbody>
            {snap.items.map((it) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={td()}>{it.rowIndex}</td>
                <td style={{ ...td(), color: STATUS_COLOR[it.status], fontWeight: 600 }}>
                  {STATUS_LABEL[it.status]}
                </td>
                <td style={{ ...td(), maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <code title={it.aliexpressUrl}>{it.aliexpressUrl}</code>
                </td>
                <td style={td()}>{it.attempts}</td>
                <td style={td()}>
                  {it.wixProductId ? (
                    <a href={`/admin/queue#${it.wixProductId}`} target="_blank" rel="noreferrer">
                      {it.wixProductId.slice(0, 8)}…
                    </a>
                  ) : "—"}
                </td>
                <td style={{ ...td(), color: "#991b1b", maxWidth: 320 }} title={it.error}>
                  {it.error?.slice(0, 80) ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function jobStatusLabel(s: BulkJob["status"]): string {
  switch (s) {
    case "pending": return "Väntar på worker";
    case "running": return "Pågår";
    case "completed": return "✓ Klart";
    case "failed": return "✗ Misslyckat";
    case "stopped": return "■ Stoppat";
  }
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m} min ${s} s` : `${m} min`;
}

function th(): React.CSSProperties {
  return { textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 };
}
function td(): React.CSSProperties {
  return { padding: "5px 10px", verticalAlign: "top" };
}
