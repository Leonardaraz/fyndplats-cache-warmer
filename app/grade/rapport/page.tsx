"use client";

// Utskriftsvänlig EAA-tillgänglighetsrapport — den betalda leveransen.
// /grade/rapport?url=dinbutik.se  -> kör scan + visar full rapport med åtgärder.
// "Skriv ut / spara som PDF" ger ett dokument du kan skicka till kunden.

import { useEffect, useState } from "react";
import { REMEDIATION, remediationFor, type Effort } from "@/lib/accessibility/remediation";

type Severity = "critical" | "serious" | "moderate" | "minor";
interface Finding {
  id: string;
  title: string;
  severity: Severity;
  ref?: string;
  count: number;
  examples: string[];
  pages?: string[];
}
interface QuickWin {
  finding: { id: string; title: string };
  categoryLabel: string;
}
interface CategoryResult {
  category: string;
  label: string;
  score: number;
  grade: string;
  findings: Finding[];
  checksRun: number;
}
interface GradeResponse {
  url: string;
  overall: number;
  categories: CategoryResult[];
  summary: string | null;
  scannedAt: string;
  pagesScanned?: number;
  eaaRisk?: "Låg" | "Medel" | "Hög";
  quickWins?: QuickWin[];
  error?: string;
}

function riskColor(risk?: string): string {
  if (risk === "Låg") return "#15803d";
  if (risk === "Medel") return "#a16207";
  return "#b91c1c";
}

const SEV: Record<Severity, { text: string; color: string }> = {
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
      body: JSON.stringify({ url: q, deep: true }),
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
  const checksTotal = result.categories.reduce((s, c) => s + c.checksRun, 0);
  const findingsTotal = result.categories.reduce((s, c) => s + c.findings.length, 0);

  return (
    <main style={S.main}>
      <div style={S.toolbar} className="no-print">
        <button type="button" onClick={() => window.print()} style={S.printBtn}>
          Skriv ut / spara som PDF
        </button>
      </div>

      <header style={S.header}>
        <p style={S.eyebrow}>Webbgranskning · EAA · SEO · AI-synlighet</p>
        <h1 style={S.h1}>{result.url}</h1>
        <p style={S.muted}>
          Granskad {date} · {checksTotal} kontroller
          {result.pagesScanned && result.pagesScanned > 1 ? ` · ${result.pagesScanned} sidor` : ""}
        </p>
        <div style={S.scoreBox}>
          <span style={{ ...S.grade, color: gradeColor(overallGrade(result.overall)) }}>
            {overallGrade(result.overall)}
          </span>
          <span style={S.score}>{result.overall}/100 totalt</span>
        </div>
      </header>

      <section style={S.intro}>
        <p>
          Den här rapporten granskar sidan ur tre perspektiv: <strong>tillgänglighet</strong>
          {" "}(WCAG 2.1 AA, grunden för EU:s tillgänglighetsdirektiv EAA, skarpt sedan
          28 juni 2025), <strong>SEO & teknik</strong> och <strong>AI-synlighet</strong>.
          Varje punkt beskriver varför det spelar roll och hur det åtgärdas.
        </p>
        {result.eaaRisk && (
          <p style={{ ...S.risk, color: riskColor(result.eaaRisk) }}>
            Bedömd EAA-risk: <strong>{result.eaaRisk}</strong>
          </p>
        )}
        {result.summary && <p style={S.summary}>{result.summary}</p>}
        <p style={S.disclaimer}>
          Rapporten är vägledande och bygger på automatiserade kontroller av sidans HTML.
          Den ersätter inte en fullständig manuell granskning och utgör inte juridisk rådgivning.
        </p>
      </section>

      {result.quickWins && result.quickWins.length > 0 && (
        <section style={S.winsBox}>
          <h2 style={S.h2}>Börja här – snabba vinster</h2>
          <ol style={S.winList}>
            {result.quickWins.map((w) => (
              <li key={w.finding.id}>
                {w.finding.title} <span style={S.muted}>({w.categoryLabel})</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {findingsTotal === 0 ? (
        <p style={S.clean}>Inga av kontrollerna slog larm. En full manuell granskning
          (kontrast, fokusordning m.m.) rekommenderas ändå för full trygghet.</p>
      ) : (
        result.categories.map((cat) => (
          <section key={cat.category}>
            <h2 style={S.h2}>
              <span style={{ color: gradeColor(cat.grade) }}>{cat.grade}</span> {cat.label}
              {" "}<span style={S.catScore}>({cat.score}/100 · {cat.findings.length} punkter)</span>
            </h2>
            {cat.findings.length === 0 ? (
              <p style={S.clean}>Inga fel hittade i denna kategori.</p>
            ) : (
              <ol style={S.list}>
                {cat.findings.map((f, n) => {
                  const rem = REMEDIATION[f.id] ?? remediationFor(f.id);
                  return (
                    <li key={f.id} style={S.item}>
                      <div style={S.itemHead}>
                        <span style={{ ...S.sev, background: SEV[f.severity].color }}>
                          {SEV[f.severity].text}
                        </span>
                        <strong style={S.itemTitle}>{n + 1}. {f.title}</strong>
                      </div>
                      <p style={S.meta}>
                        {f.count} förekomst(er){f.ref ? ` · ${f.ref}` : ""} · {EFFORT_LABEL[rem.effort]}
                      </p>
                      <p><strong>Varför:</strong> {rem.why}</p>
                      <p><strong>Åtgärd:</strong> {rem.fix}</p>
                      {f.pages && f.pages.length > 0 && (
                        <p style={S.pages}>
                          Förekommer på: {f.pages.map((p) => relPath(p)).join(", ")}
                        </p>
                      )}
                      {f.examples.length > 0 && (
                        <details style={S.examples}>
                          <summary>Exempel från sidan</summary>
                          {f.examples.map((ex, k) => (
                            <pre key={k} style={S.code}>{ex}</pre>
                          ))}
                        </details>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ))
      )}

      <footer style={S.footer}>
        Fyndplats · Webbgranskning genererad {date}.
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

/** Kortar ner en absolut URL till sökväg (för läsbar sidlista i rapporten). */
function relPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname === "/" || u.pathname === "" ? "startsidan" : u.pathname;
  } catch {
    return url;
  }
}

function overallGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
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
  h2: { fontSize: 20, margin: "28px 0 12px" },
  catScore: { fontSize: 14, fontWeight: 400, color: "#6b7280" },
  risk: { fontSize: 16, margin: "4px 0" },
  winsBox: { background: "#eff6ff", borderRadius: 8, padding: "12px 16px", margin: "8px 0 8px" },
  winList: { margin: "8px 0 0", paddingLeft: 20 },
  pages: { fontSize: 13, color: "#6b7280", margin: "4px 0 0" },
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
