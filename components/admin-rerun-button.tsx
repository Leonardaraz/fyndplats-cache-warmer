"use client";
import { useState } from "react";

type Result = { ok: boolean; scored?: number; costUsd?: number; stoppedByBudget?: boolean; distribution?: { high: number; mid: number; low: number }; error?: string };

// Triggar POST /api/admin/rerun-image-scores. Stöd för "bara N" (snabbtest) och full körning.
export function RerunButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run(limit?: number) {
    setBusy(true);
    setResult(null);
    try {
      const qs = limit ? `?limit=${limit}` : "";
      const res = await fetch(`/api/admin/rerun-image-scores${qs}`, { method: "POST" });
      setResult(await res.json());
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" disabled={busy} onClick={() => run(10)}
          style={{ cursor: busy ? "wait" : "pointer", border: "1px solid #d1d5db", background: "#fff", borderRadius: 8, padding: "10px 16px", fontWeight: 600 }}>
          Testa (10 produkter)
        </button>
        <button type="button" disabled={busy} onClick={() => run()}
          style={{ cursor: busy ? "wait" : "pointer", border: "none", background: "#C2410C", color: "#fff", borderRadius: 8, padding: "10px 18px", fontWeight: 700 }}>
          {busy ? "Kör…" : "Kör om alla"}
        </button>
      </div>
      {busy && <p style={{ color: "#666", fontSize: 14 }}>Poängsätter bilder med Claude — detta kan ta upp till ett par minuter…</p>}
      {result && result.ok && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", fontSize: 14 }}>
          ✓ Klart: {result.scored} produkter poängsatta · topp {result.distribution?.high} / ok {result.distribution?.mid} / problem {result.distribution?.low} ·
          kostnad ${result.costUsd?.toFixed(4)}{result.stoppedByBudget ? " · ⚠ stoppad av budget-cap" : ""}
        </div>
      )}
      {result && !result.ok && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#b91c1c" }}>
          Fel: {result.error}
        </div>
      )}
    </div>
  );
}
