"use client";

import { useState } from "react";
import { runAutoMapAction } from "./actions";
import type { AutoMapSummary } from "@/lib/aliexpress/auto-map-run";

/**
 * Panel för att starta AI-auto-mappningen. Begränsar default till 25 produkter
 * per körning så server-actionen håller sig under tidsgränsen — kör flera
 * gånger tills "Kvar att mappa" är 0.
 */
export function AutoMapPanel({ unmappedCount }: { unmappedCount: number }) {
  const [limit, setLimit] = useState(25);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<AutoMapSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    setSummary(null);
    try {
      const res = await runAutoMapAction(limit);
      if (res.ok) setSummary(res.summary);
      else setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ padding: 14, border: "1px solid #cfe2ff", background: "#f3f8ff", borderRadius: 8 }}>
      <b>AI-auto-mappning</b>
      <p style={{ fontSize: 13, color: "#555", margin: "6px 0 10px" }}>
        Claude översätter varje produktnamn till engelska sökord, söker AliExpress
        och poängsätter träffarna. <b>Hög säkerhet</b> mappas automatiskt; osäkra
        hamnar bland förslagen nedan för bekräftelse.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontSize: 13 }}>
          Antal per körning:{" "}
          <input
            type="number"
            min={1}
            max={207}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 70, padding: 4 }}
          />
        </label>
        <button
          onClick={run}
          disabled={running || unmappedCount === 0}
          style={{
            padding: "8px 14px", borderRadius: 6, border: "none",
            background: running ? "#9bc1ff" : "#0a58ca", color: "#fff",
            cursor: running || unmappedCount === 0 ? "not-allowed" : "pointer", fontWeight: 600,
          }}
        >
          {running ? "Kör…" : `Kör auto-mappning (${Math.min(limit, unmappedCount)} st)`}
        </button>
        {unmappedCount === 0 ? <span style={{ color: "#070", fontSize: 13 }}>Inget kvar att mappa ✓</span> : null}
      </div>

      {error ? (
        <div style={{ marginTop: 10, color: "#a00", fontSize: 13 }}>
          <b>Fel:</b> {error}
        </div>
      ) : null}

      {summary ? (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <div>✅ Auto-mappade: <b>{summary.autoMapped}</b></div>
          <div>📝 Nya förslag att bekräfta: <b>{summary.suggested}</b></div>
          <div>📊 Behandlade {summary.processed} av {summary.unmapped} omappade ({summary.alreadyMapped} redan mappade)</div>
          {summary.errors.length > 0 ? (
            <details style={{ marginTop: 6 }}>
              <summary style={{ color: "#a00" }}>{summary.errors.length} fel</summary>
              <ul style={{ fontSize: 12 }}>
                {summary.errors.slice(0, 10).map((e) => (
                  <li key={e.wixProductId}>{e.name}: {e.error}</li>
                ))}
              </ul>
            </details>
          ) : null}
          <p style={{ color: "#666", marginTop: 6 }}>
            Ladda om sidan för att se uppdaterade förslag. Kör igen för nästa batch.
          </p>
        </div>
      ) : null}
    </div>
  );
}
