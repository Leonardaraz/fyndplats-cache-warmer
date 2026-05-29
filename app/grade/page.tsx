"use client";

// Publik tillgänglighets-grader — lead-magneten i validerings-spjutet.
// Klistra in URL -> WCAG-scan -> betyg + topp-fel + e-postfångst för full rapport.

import { useState } from "react";

interface Issue {
  id: string;
  title: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  wcag: string;
  count: number;
}

interface GradeResponse {
  url: string;
  score: number;
  grade: string;
  issues: Issue[];
  summary: string | null;
  error?: string;
}

const SEVERITY_LABEL: Record<Issue["severity"], { text: string; color: string }> = {
  critical: { text: "Kritiskt", color: "#b91c1c" },
  serious: { text: "Allvarligt", color: "#c2410c" },
  moderate: { text: "Måttligt", color: "#a16207" },
  minor: { text: "Mindre", color: "#4b5563" },
};

function gradeColor(grade: string): string {
  if (grade === "A" || grade === "B") return "#15803d";
  if (grade === "C" || grade === "D") return "#a16207";
  return "#b91c1c";
}

export default function GradePage() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<"audit" | "monitoring" | null>(null);
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Visa kvitto/avbrutet-meddelande när Stripe skickar tillbaka kunden.
  const payback =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("betalning")
      : null;

  async function startCheckout(plan: "audit" | "monitoring") {
    setCheckoutLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: email || undefined, url: result?.url }),
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Kunde inte starta betalningen.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCheckoutLoading(null);
    }
  }

  async function runScan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email: email || undefined }),
      });
      const data: GradeResponse = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Något gick fel.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.main}>
      <section style={S.hero}>
        <p style={S.eyebrow}>EAA-koll · WCAG 2.1 AA</p>
        <h1 style={S.h1}>Är din webbutik tillgänglig enligt EU:s nya lag?</h1>
        <p style={S.lede}>
          European Accessibility Act gäller sedan 28 juni 2025. Kör en gratis koll på
          din sida och se de vanligaste tillgänglighetsfelen på sekunder.
        </p>

        <form onSubmit={runScan} style={S.form}>
          <input
            type="text"
            inputMode="url"
            placeholder="dinbutik.se"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={S.input}
            aria-label="Webbadress att granska"
          />
          <button type="submit" disabled={loading} style={S.button}>
            {loading ? "Granskar…" : "Granska gratis"}
          </button>
        </form>
        <p style={S.fineprint}>
          Ingen overlay-widget, ingen falsk ”100 % compliant”-stämpel — bara en ärlig
          koll på riktiga WCAG-fel.
        </p>
        <div style={S.trust}>
          <span>✓ WCAG 2.1 AA</span>
          <span>✓ Resultat på sekunder</span>
          <span>✓ Gratis & utan konto</span>
        </div>
      </section>

      {payback === "klar" && (
        <p style={S.success}>Tack! Din beställning är mottagen — vi hör av oss med
          rapporten.</p>
      )}
      {payback === "avbruten" && (
        <p style={S.notice}>Betalningen avbröts. Du kan starta om när du vill.</p>
      )}

      {error && <p style={S.error}>{error}</p>}

      {result && (
        <section style={S.card}>
          <div style={S.scoreRow}>
            <div style={{ ...S.gradeBadge, background: gradeColor(result.grade) }}>
              {result.grade}
            </div>
            <div>
              <div style={S.scoreNum}>{result.score}/100</div>
              <div style={S.scoreUrl}>{result.url}</div>
            </div>
          </div>

          {result.summary && <p style={S.summary}>{result.summary}</p>}

          {result.issues.length === 0 ? (
            <p style={S.clean}>Inga av våra snabbkontroller slog larm. Snyggt! En full
              audit täcker fler kriterier (kontrast, fokusordning m.m.).</p>
          ) : (
            <ul style={S.issueList}>
              {result.issues.map((i) => (
                <li key={i.id} style={S.issueItem}>
                  <span style={{ ...S.sevTag, color: SEVERITY_LABEL[i.severity].color }}>
                    {SEVERITY_LABEL[i.severity].text}
                  </span>
                  <span style={S.issueTitle}>{i.title}</span>
                  <span style={S.issueMeta}>
                    {i.count} st · WCAG {i.wcag}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div style={S.cta}>
            <h2 style={S.ctaH2}>Vill du ha hela bilden + en åtgärdsplan?</h2>
            <p style={S.ctaText}>
              Den fullständiga EAA-rapporten täcker alla WCAG 2.1 AA-kriterier med en
              prioriterad fixlista för just din butik — levererad inom 5 dagar.
            </p>

            <input
              type="email"
              placeholder="din@epost.se (för rapporten)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...S.input, width: "100%", marginBottom: 12, boxSizing: "border-box" }}
              aria-label="Din e-postadress"
            />

            <div style={S.planRow}>
              <button
                type="button"
                onClick={() => startCheckout("audit")}
                disabled={checkoutLoading !== null}
                style={S.buttonPrimary}
              >
                {checkoutLoading === "audit" ? "Öppnar betalning…" : "Beställ EAA-audit – 1 495 kr"}
              </button>
              <button
                type="button"
                onClick={() => startCheckout("monitoring")}
                disabled={checkoutLoading !== null}
                style={S.buttonSecondary}
              >
                {checkoutLoading === "monitoring" ? "Öppnar…" : "Löpande bevakning – 299 kr/mån"}
              </button>
            </div>
            <p style={S.fineprint}>Säker betalning via Stripe. Engångs-audit eller
              månadsvis bevakning — du väljer.</p>
          </div>
        </section>
      )}

      <section style={S.steps}>
        <h2 style={S.sectionH2}>Så funkar det</h2>
        <div style={S.stepRow}>
          {[
            { n: "1", t: "Klistra in din URL", d: "Vi hämtar din sida och granskar den mot WCAG 2.1 AA." },
            { n: "2", t: "Se betyg & fel direkt", d: "Du får ett betyg och de vanligaste tillgänglighetsfelen på sekunder." },
            { n: "3", t: "Få en åtgärdsplan", d: "Beställ den fullständiga rapporten med prioriterad fixlista för din butik." },
          ].map((s) => (
            <div key={s.n} style={S.step}>
              <div style={S.stepNum}>{s.n}</div>
              <strong>{s.t}</strong>
              <p style={S.stepText}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={S.faq}>
        <h2 style={S.sectionH2}>Vanliga frågor om EAA</h2>
        {[
          {
            q: "Vad är European Accessibility Act?",
            a: "Ett EU-direktiv som ställer krav på att bl.a. e-handel ska vara tillgänglig för personer med funktionsnedsättning. Det gäller för nya tjänster sedan 28 juni 2025, med en övergångsperiod för befintliga tjänster fram till 2030.",
          },
          {
            q: "Gäller det min webbutik?",
            a: "E-handel pekas särskilt ut. Mycket små företag (under 10 anställda och under 2 M€ omsättning) kan vara undantagna från tjänstekraven — men många butiker ligger över tröskeln, och tillgänglighet är ändå bra för försäljning och kundnöjdhet.",
          },
          {
            q: "Vad kan det kosta att inte följa lagen?",
            a: "Sanktionerna sätts per EU-land och kan vara kännbara — i vissa länder upp till 100 000 € per överträdelse. Tillsyn pågår. Vi ger en åtgärdsplan, inte juridisk rådgivning.",
          },
          {
            q: "Är det här en sådan där overlay-widget?",
            a: "Nej. Overlay-widgets har både kritiserats hårt och lett till stämningar. Vi gör en ärlig granskning av riktiga WCAG-fel och ger dig konkreta åtgärder — ingen kod som låtsas lösa allt.",
          },
        ].map((f) => (
          <details key={f.q} style={S.faqItem}>
            <summary style={S.faqQ}>{f.q}</summary>
            <p style={S.faqA}>{f.a}</p>
          </details>
        ))}
      </section>

      <footer style={S.footer}>
        Fyndplats · Tillgänglighetskoll. Resultatet är vägledande och utgör inte
        juridisk rådgivning.
      </footer>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: {
    fontFamily: "system-ui, sans-serif",
    maxWidth: 720,
    margin: "0 auto",
    padding: "48px 20px 80px",
    color: "#111827",
  },
  hero: { textAlign: "center" },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 13,
    fontWeight: 600,
    color: "#2563eb",
    margin: "0 0 8px",
  },
  h1: { fontSize: 34, lineHeight: 1.15, margin: "0 0 12px" },
  lede: { fontSize: 17, color: "#374151", margin: "0 auto 24px", maxWidth: 560 },
  form: { display: "flex", gap: 8, maxWidth: 480, margin: "0 auto" },
  input: {
    flex: 1,
    padding: "12px 14px",
    fontSize: 16,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    minWidth: 0,
  },
  button: {
    padding: "12px 20px",
    fontSize: 16,
    fontWeight: 600,
    color: "#fff",
    background: "#2563eb",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  fineprint: { fontSize: 13, color: "#6b7280", marginTop: 12 },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "12px 16px",
    borderRadius: 8,
    marginTop: 24,
  },
  success: {
    background: "#f0fdf4",
    color: "#15803d",
    padding: "12px 16px",
    borderRadius: 8,
    marginTop: 24,
  },
  notice: {
    background: "#fffbeb",
    color: "#a16207",
    padding: "12px 16px",
    borderRadius: 8,
    marginTop: 24,
  },
  planRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  buttonPrimary: {
    flex: "1 1 240px",
    padding: "14px 20px",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    background: "#15803d",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  buttonSecondary: {
    flex: "1 1 200px",
    padding: "14px 20px",
    fontSize: 15,
    fontWeight: 600,
    color: "#15803d",
    background: "#fff",
    border: "1.5px solid #15803d",
    borderRadius: 8,
    cursor: "pointer",
  },
  card: {
    marginTop: 32,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  scoreRow: { display: "flex", alignItems: "center", gap: 16 },
  gradeBadge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    color: "#fff",
    fontSize: 28,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: { fontSize: 24, fontWeight: 700 },
  scoreUrl: { fontSize: 14, color: "#6b7280", wordBreak: "break-all" },
  summary: {
    marginTop: 16,
    fontSize: 15,
    color: "#374151",
    background: "#f9fafb",
    padding: "12px 14px",
    borderRadius: 8,
  },
  clean: { marginTop: 16, color: "#15803d" },
  issueList: { listStyle: "none", padding: 0, margin: "20px 0 0" },
  issueItem: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    padding: "10px 0",
    borderTop: "1px solid #f3f4f6",
    flexWrap: "wrap",
  },
  sevTag: { fontSize: 12, fontWeight: 700, minWidth: 72 },
  issueTitle: { flex: 1, fontSize: 15, minWidth: 200 },
  issueMeta: { fontSize: 13, color: "#6b7280" },
  cta: {
    marginTop: 28,
    paddingTop: 24,
    borderTop: "2px solid #f3f4f6",
  },
  ctaH2: { fontSize: 20, margin: "0 0 8px" },
  ctaText: { fontSize: 15, color: "#374151", margin: "0 0 16px" },
  emailForm: { display: "flex", gap: 8 },
  footer: { marginTop: 48, fontSize: 12, color: "#9ca3af", textAlign: "center" },
  trust: {
    display: "flex",
    gap: 16,
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 16,
    fontSize: 13,
    color: "#15803d",
    fontWeight: 600,
  },
  steps: { marginTop: 56 },
  sectionH2: { fontSize: 22, textAlign: "center", margin: "0 0 24px" },
  stepRow: { display: "flex", gap: 16, flexWrap: "wrap" },
  step: { flex: "1 1 180px", textAlign: "center" },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 10px",
  },
  stepText: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  faq: { marginTop: 56 },
  faqItem: { borderTop: "1px solid #e5e7eb", padding: "12px 0" },
  faqQ: { fontSize: 16, fontWeight: 600, cursor: "pointer" },
  faqA: { fontSize: 15, color: "#374151", margin: "8px 0 0" },
};
