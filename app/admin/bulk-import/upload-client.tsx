"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { previewCsvAction, startBulkImportAction, type PreviewResult } from "./actions";

const MAX_SIZE_MB = 5;

export function UploadClient(): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState<string>("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isDragging, setDragging] = useState(false);

  const readFile = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Filen är ${(file.size / 1024 / 1024).toFixed(1)} MB — max är ${MAX_SIZE_MB} MB.`);
      return;
    }
    const text = await file.text();
    setCsvText(text);
    setError(null);
    startTransition(async () => {
      const result = await previewCsvAction(text);
      if (result.ok) {
        setPreview(result);
      } else {
        setError(result.error);
        setPreview(null);
      }
    });
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) void readFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void readFile(file);
  };

  const onStart = (): void => {
    if (!csvText.trim() || !preview?.ok || preview.validCount === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await startBulkImportAction(csvText, notes.trim() || undefined);
      if (res.ok) {
        // Navigera till job-detaljvyn på samma sida via query.
        window.location.search = `?job=${encodeURIComponent(res.jobId)}`;
      } else {
        const detail = res.code ? ` [${res.code}]` : "";
        setError(`${res.error}${detail}`);
      }
    });
  };

  const reset = (): void => {
    setCsvText("");
    setPreview(null);
    setError(null);
    setNotes("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section style={{ marginTop: 16 }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? "#0891b2" : "#cbd5e1"}`,
          borderRadius: 8,
          padding: "32px 24px",
          textAlign: "center",
          background: isDragging ? "#ecfeff" : "#f8fafc",
          cursor: "pointer",
        }}
      >
        <p style={{ margin: 0, fontSize: 15 }}>
          {csvText
            ? <span>📄 <b>CSV laddad</b> · {preview ? `${preview.validCount} giltiga / ${preview.invalidCount} ogiltiga rader` : "läser…"}</span>
            : <span>Dra in en CSV-fil här eller klicka för att välja</span>
          }
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
          Förväntade kolumner: <code>aliexpress_url</code> (krävs), <code>wix_collection_slug</code>, <code>target_price_sek</code>, <code>notes</code>. Max 500 rader, 5 MB.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
      </div>

      {error ? (
        <div style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "#fee2e2",
          border: "1px solid #fecaca",
          borderRadius: 6,
          color: "#991b1b",
          fontSize: 13,
        }}>
          <b>Fel:</b> {error}
        </div>
      ) : null}

      {preview?.ok ? (
        <div style={{ marginTop: 16 }}>
          {preview.preview.errors.length > 0 ? (
            <div style={{
              padding: "8px 12px",
              background: "#fef3c7",
              border: "1px solid #fde68a",
              borderRadius: 6,
              color: "#92400e",
              fontSize: 13,
              marginBottom: 10,
            }}>
              <b>CSV-fel:</b>
              <ul style={{ margin: "4px 0 0 18px" }}>
                {preview.preview.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          ) : null}

          <h3 style={{ fontSize: 15, marginBottom: 6 }}>Förhandsvisning ({preview.preview.rows.length} rader)</h3>
          <div style={{ maxHeight: 360, overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 6 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead style={{ background: "#f1f5f9", position: "sticky", top: 0 }}>
                <tr>
                  <th style={th()}>#</th>
                  <th style={th()}>Status</th>
                  <th style={th()}>AliExpress-URL</th>
                  <th style={th()}>Kollektion</th>
                  <th style={th()}>Målpris (SEK)</th>
                  <th style={th()}>Notiser</th>
                </tr>
              </thead>
              <tbody>
                {preview.preview.rows.map((r) => (
                  <tr key={r.rowIndex} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={td()}>{r.rowIndex}</td>
                    <td style={td()}>
                      {r.errors.length === 0 ? (
                        <span style={{ color: "#16a34a" }}>OK</span>
                      ) : (
                        <span style={{ color: "#dc2626" }} title={r.errors.join("; ")}>
                          ✗ {r.errors[0]}
                        </span>
                      )}
                    </td>
                    <td style={{ ...td(), maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <code>{r.aliexpressUrl || "—"}</code>
                    </td>
                    <td style={td()}>{r.collectionSlug || "—"}</td>
                    <td style={td()}>{r.targetPriceSek ?? "—"}</td>
                    <td style={td()}>{r.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
              Notiser för jobbet (frivilligt):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="t.ex. Höstkollektion 2026"
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 4, fontSize: 13 }}
            />
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onStart}
              disabled={isPending || preview.validCount === 0}
              style={{
                background: preview.validCount > 0 ? "#16a34a" : "#94a3b8",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: preview.validCount > 0 ? "pointer" : "not-allowed",
              }}
            >
              {isPending ? "Skapar jobb…" : `Starta bulk-import (${preview.validCount} rader)`}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              style={{
                background: "#fff",
                color: "#475569",
                border: "1px solid #cbd5e1",
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Rensa
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function th(): React.CSSProperties {
  return { textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 };
}
function td(): React.CSSProperties {
  return { padding: "5px 10px", verticalAlign: "top" };
}
