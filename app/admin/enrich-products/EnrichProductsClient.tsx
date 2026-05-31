"use client";
import { useMemo, useState } from "react";

type TabStatus = {
  beskrivning: boolean;
  specifikationer: boolean;
  vanligaFragor: boolean;
  anvandningSkotsel: boolean;
  kontakt: boolean;
};
type Row = {
  id: string;
  name: string;
  slug: string;
  categoryName: string | null;
  careApplicable: boolean;
  status: TabStatus;
  missingCount: number;
};

const TITLE_TO_KEY: Record<string, keyof TabStatus> = {
  "Tekniska specifikationer": "specifikationer",
  "Vanliga frågor": "vanligaFragor",
  "Användning och skötsel": "anvandningSkotsel",
};

function recomputeMissing(status: TabStatus, careApplicable: boolean): number {
  return (
    (status.specifikationer ? 0 : 1) +
    (status.vanligaFragor ? 0 : 1) +
    (careApplicable && !status.anvandningSkotsel ? 1 : 0)
  );
}

function Cell({ done, na }: { done: boolean; na?: boolean }) {
  if (na) return <span title="Ej relevant för kategorin" style={{ color: "#9ca3af" }}>–</span>;
  return done ? <span title="Klar">✅</span> : <span title="Saknas">⚠️</span>;
}

export function EnrichProductsClient({ rows: initialRows }: { rows: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulk, setBulk] = useState<{ running: boolean; done: number; total: number; stopped?: string } | null>(null);
  const [spent, setSpent] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ name: string; html: string } | null>(null);

  const incomplete = useMemo(() => rows.filter((r) => r.missingCount > 0), [rows]);
  const estCost = (incomplete.length * 0.01).toFixed(2);

  function applyGenerated(id: string, generated: string[]) {
    if (!generated.length) return;
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const status = { ...r.status };
        for (const t of generated) {
          const key = TITLE_TO_KEY[t];
          if (key) status[key] = true;
        }
        return { ...r, status, missingCount: recomputeMissing(status, r.careApplicable) };
      }),
    );
  }

  // Returnerar { ok, budget } så bulk-loopen kan stanna vid budgettak (HTTP 429).
  async function callEnrich(row: Row, dryRun: boolean): Promise<{ ok: boolean; budget?: boolean }> {
    const res = await fetch("/api/admin/enrich-tabs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: row.id, categoryName: row.categoryName, dryRun }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error || `HTTP ${res.status}`;
      setLog((l) => [`❌ ${row.name}: ${msg}`, ...l]);
      return { ok: false, budget: res.status === 429 };
    }
    if (typeof data.budget?.spentUsd === "number") setSpent(data.budget.spentUsd);
    if (dryRun) {
      setPreview({ name: row.name, html: data.previewHtml || "" });
      setLog((l) => [`👁️ ${row.name}: ${data.message || "förhandsvisning"}`, ...l]);
    } else {
      applyGenerated(row.id, data.generated || []);
      setLog((l) => [`✅ ${row.name}: ${data.message}`, ...l]);
    }
    return { ok: true };
  }

  async function onGenerate(row: Row) {
    setBusy(row.id);
    try {
      await callEnrich(row, false);
    } finally {
      setBusy(null);
    }
  }

  async function onPreview(row: Row) {
    setBusy(row.id);
    try {
      await callEnrich(row, true);
    } finally {
      setBusy(null);
    }
  }

  async function onBulk() {
    const targets = rows.filter((r) => r.missingCount > 0);
    if (!targets.length || bulk?.running) return;
    setBulk({ running: true, done: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      const r = targets[i];
      setBusy(r.id);
      const res = await callEnrich(r, false);
      setBulk({ running: true, done: i + 1, total: targets.length });
      if (res.budget) {
        setBulk({ running: false, done: i + 1, total: targets.length, stopped: "Daglig budget nådd" });
        setLog((l) => ["⏹️ Stoppade: daglig AI-budget nådd. Fortsätt imorgon.", ...l]);
        setBusy(null);
        return;
      }
    }
    setBusy(null);
    setBulk((b) => (b ? { ...b, running: false } : null));
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1>Berika produkter med tabbar</h1>
      <p style={{ color: "#6b7280" }}>
        Genererar de tabbade PDP-sektionerna (Tekniska specifikationer, Vanliga frågor,
        Användning och skötsel) med Claude och sparar i Wix. <strong>Kontakta oss</strong> läggs
        till automatiskt av sajten. Sorterat med flest saknade flikar först.
      </p>
      <p style={{ color: "#6b7280" }}>
        {incomplete.length} av {rows.length} produkter saknar flikar. Uppskattad kostnad att köra
        alla: ~{estCost} USD (Claude Haiku).
        {spent != null && <> Spenderat idag: <strong>{spent.toFixed(3)} USD</strong>.</>}{" "}
        Daglig budget ~2 USD – massjobbet stoppar automatiskt vid taket.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0" }}>
        <button onClick={onBulk} disabled={bulk?.running || incomplete.length === 0}>
          {bulk?.running
            ? `Genererar… ${bulk.done}/${bulk.total}`
            : `Generera för alla produkter utan tabbar (${incomplete.length})`}
        </button>
        {bulk && !bulk.running && (
          <span style={{ color: "#6b7280" }}>
            Klart: {bulk.done}/{bulk.total}
            {bulk.stopped ? ` — ${bulk.stopped}` : ""}
          </span>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ padding: "8px 6px" }}>Produkt</th>
            <th>Kategori</th>
            <th>Beskr.</th>
            <th>Tekn. spec.</th>
            <th>Vanliga frågor</th>
            <th>Användn. &amp; skötsel</th>
            <th>Kontakta oss</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6", opacity: r.missingCount === 0 ? 0.55 : 1 }}>
              <td style={{ padding: "8px 6px" }}>
                <a href={`/produkt/${r.slug}`} target="_blank" rel="noreferrer">
                  {r.name}
                </a>
              </td>
              <td style={{ color: "#6b7280" }}>{r.categoryName || "–"}</td>
              <td><Cell done={r.status.beskrivning} /></td>
              <td><Cell done={r.status.specifikationer} /></td>
              <td><Cell done={r.status.vanligaFragor} /></td>
              <td><Cell done={r.status.anvandningSkotsel} na={!r.careApplicable} /></td>
              <td><Cell done={r.status.kontakt} /></td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button onClick={() => onGenerate(r)} disabled={busy === r.id || r.missingCount === 0}>
                  {busy === r.id ? "…" : "Generera tabbar med Claude"}
                </button>{" "}
                <button onClick={() => onPreview(r)} disabled={busy === r.id} title="Generera utan att spara">
                  Granska &amp; redigera
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {log.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Logg</h3>
          <ul style={{ maxHeight: 200, overflow: "auto", color: "#374151" }}>
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", maxWidth: 720, width: "90%", maxHeight: "80vh", overflow: "auto", padding: 24, borderRadius: 8 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Förhandsvisning: {preview.name}</h2>
              <button onClick={() => setPreview(null)}>Stäng</button>
            </div>
            <p style={{ color: "#6b7280" }}>Så här blir beskrivningen + flikar (inget har sparats än).</p>
            <div style={{ border: "1px solid #e5e7eb", padding: 16, borderRadius: 6 }} dangerouslySetInnerHTML={{ __html: preview.html }} />
          </div>
        </div>
      )}
    </div>
  );
}
