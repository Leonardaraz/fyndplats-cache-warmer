"use client";

// Utskriftsvänlig EAA-tillgänglighetsrapport — den betalda leveransen.
// /grade/rapport?url=dinbutik.se  -> kör scan + visar full rapport med åtgärder.
// "Skriv ut / spara som PDF" ger ett dokument du kan skicka till kunden.

import { useEffect, useState } from "react";
import { REMEDIATION, remediationFor, type Effort } from "@/lib/accessibility/remediation";

interface Issue {
  id: string;
  title: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  wcag: string;
  count: number;
  examples: string[];
}
interface GradeResponse {
  url: string;
  score: number;
  grade: string;
  issues: Issue[];
  checksRun: number;
  summary: string | null;
  scannedAt: string;
  error?: string;
}

const SEV: Record<Issue["severity"], { text: string; color: string }> = {
  critical: { text: "Kritiskt", color: "#b91c1c" },
  serious: { text: "Allvarligt", color: "#c2410c" },
  moderate: { text: "Måttligt", color: "#a16207" },
  minor: { text: "Mindre", color: "#4b5563" },
};
const EFFORT_LABEL: Record<Effort, string> = { låg: "Låg insats", medel: "Medel insats", hög: "Hög insats" };

export default function ReportPage() {
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("url") ?? "";
    setUrl(q);
    if (!q) {
      setError("Ingen URL angiven. Lägg till ?url=dinbutik.se i adressen.");
      return;
    }
    fetch("/api/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: q }),
    })
      .then(async (res) => {
        const data: GradeResponse = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Kunde inte skapa rapporten.");
        setResult(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <main style={S.main}><p style={S.error}>{error}</p></main>;
  if (!result) return <main style={S.main}><p style={S.muted}>Skapar rapport för {url}…</p></main>;

  const date = new Date(result.scannedAt).toLocaleDateString("sv-SE");

  return (
    <main style={S.main}>
      <div style={S.toolbar} className="no-print">
        <button type="button" onClick={() => window.print()} style={S.printBtn}>
          Skriv ut / spara som PDF
        </button>
      </div>

      <header style={S.header}>
        <p style={S.eyebrow}>EAA-tillgänglighetsrapport · WCAG 2.1 AA</p>
        <h1 style={S.h1}>{result.url}</h1>
        <p style={S.muted}>Granskad {date} · {result.checksRun} kontroller</p>
        <div style={S.scoreBox}>
          <span style={{ ...S.grade, color: gradeColor(result.grade) }}>{result.grade}</span>
          <span style={S.score}>{result.score}/100</span>
        </div>
      </header>

      <section style={S.intro}>
        <p>
          Den här rapporten sammanfattar tillgänglighetsbrister på sidan i förhållande
          till WCAG 2.1 AA — den standard som ligger till grund för EU:s tillgänglighets-
          direktiv (European Accessibility Act, skarpt sedan 28 juni 2025). Varje punkt
          beskriver varför felet drabbar riktiga användare och hur det åtgärdas.
        </p>
        {result.summary && <p style={S.summary}>{result.summary}</p>}
        <p style={S.disclaimer}>
          Rapporten är vägledande och bygger på automatiserade kontroller av sidans HTML.
          Den ersätter inte en fullständig manuell granskning och utgör inte juridisk rådgivning.
        </p>
      </section>

      {result.issues.length === 0 ? (
        <p style={S.clean}>Inga av kontrollerna slog larm. En full manuell granskning
          (kontrast, fokusordning m.m.) rekommenderas ändå för full trygghet.</p>
      ) : (
        <section>
          <h2 style={S.h2}>Åtgärdslista ({result.issues.length} punkter)</h2>
          <ol style={S.list}>
            {result.issues.map((i, n) => {
              const rem = REMEDIATION[i.id] ?? remediationFor(i.id);
              return (
                <li key={i.id} style={S.item}>
                  <div style={S.itemHead}>
                    <span style={{ ...S.sev, background: SEV[i.severity].color }}>
                      {SEV[i.severity].text}
                    </span>
                    <strong style={S.itemTitle}>{n + 1}. {i.title}</strong>
                  </div>
                  <p style={S.meta}>
                    {i.count} förekomst(er) · WCAG {i.wcag} · {EFFORT_LABEL[rem.effort]}
                  </p>
                  <p><strong>Varför:</strong> {rem.why}</p>
                  <p><strong>Åtgärd:</strong> {rem.fix}</p>
                  {i.examples.length > 0 && (
                    <details style={S.examples}>
                      <summary>Exempel från sidan</summary>
                      {i.examples.map((ex, k) => (
                        <pre key={k} style={S.code}>{ex}</pre>
                      ))}
                    </details>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <footer style={S.footer}>
        Fyndplats · Tillgänglighetsrapport genererad {date}.
      </footer>

      <style>{`@media print {
        .no-print { display: none !important; }
        details { display: none; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }`}</style>
    </main>
  );
}

function gradeColor(g: string): string {
  if (g === "A" || g === "B") return "#15803d";
  if (g === "C" || g === "D") return "#a16207";
  return "#b91c1c";
}

const S: Record<string, React.CSSProperties> = {
  main: { fontFamily: "system-ui, sans-serif", maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px", color: "#111827", lineHeight: 1.5 },
  toolbar: { textAlign: "right", marginBottom: 16 },
  printBtn: { padding: "10px 18px", fontSize: 15, fontWeight: 600, color: "#fff", background: "#2563eb", border: "none", borderRadius: 8, cursor: "pointer" },
  header: { borderBottom: "2px solid #f3f4f6", paddingBottom: 20, marginBottom: 24 },
  eyebrow: { textTransform: "uppercase", letterSpacing: 1, fontSize: 12, fontWeight: 600, color: "#2563eb", margin: 0 },
  h1: { fontSize: 26, margin: "6px 0 4px", wordBreak: "break-all" },
  scoreBox: { display: "flex", alignItems: "baseline", gap: 12, marginTop: 12 },
  grade: { fontSize: 40, fontWeight: 800 },
  score: { fontSize: 20, color: "#374151" },
  intro: { marginBottom: 24 },
  summary: { background: "#f9fafb", padding: "12px 14px", borderRadius: 8 },
  disclaimer: { fontSize: 13, color: "#6b7280" },
  clean: { color: "#15803d" },
  h2: { fontSize: 20, margin: "24px 0 12px" },
  list: { paddingLeft: 0, listStyle: "none", margin: 0 },
  item: { borderTop: "1px solid #e5e7eb", padding: "16px 0" },
  itemHead: { display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" },
  sev: { color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 },
  itemTitle: { fontSize: 16 },
  meta: { fontSize: 13, color: "#6b7280", margin: "4px 0 8px" },
  examples: { marginTop: 8, fontSize: 13 },
  code: { background: "#f3f4f6", padding: "8px 10px", borderRadius: 6, overflowX: "auto", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-all" },
  footer: { marginTop: 40, fontSize: 12, color: "#9ca3af", borderTop: "1px solid #f3f4f6", paddingTop: 16 },
  error: { background: "#fef2f2", color: "#b91c1c", padding: "12px 16px", borderRadius: 8 },
  muted: { color: "#6b7280" },
};
