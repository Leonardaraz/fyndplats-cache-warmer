"use client";

// Snabbåtgärder + uppdatera-knapp för dashboarden. Länkknapparna går till befintliga
// admin-sidor; trigger-knapparna POST:ar till /api/admin/run-job (samma origin →
// fp_admin-cookien följer med) och visar Resend-id / resultat.

import { useState } from "react";
import { useRouter } from "next/navigation";

const LINKS: { label: string; href: string; note?: string }[] = [
  { label: "Granska imports (berika produkter)", href: "/admin/enrich-products" },
  { label: "Bildproblem", href: "/admin/image-issues" },
  { label: "E-posttest", href: "/admin/email-test" },
  { label: "SEO-hälsa", href: "/admin/seo-health" },
];

const JOBS: { label: string; job: string; busyLabel: string }[] = [
  { label: "Skicka morgonmail nu", job: "morning-email", busyLabel: "Skickar morgonmail…" },
  { label: "Kör SEO-veckorapport nu", job: "seo-weekly", busyLabel: "Kör SEO-rapport…" },
];

const btn: React.CSSProperties = {
  background: "#fff",
  color: "#C2410C",
  border: "1px solid #C2410C",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

export function QuickActions() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function runJob(job: string) {
    setBusy(job);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/run-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });
      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (res.ok && data.ok) {
        setMsg({ ok: true, text: `✓ Klart${data.id ? ` — Resend-id: ${data.id}` : ""}` });
      } else {
        setMsg({ ok: false, text: `✗ ${data.error ?? `HTTP ${res.status}`}` });
      }
    } catch (e) {
      setMsg({ ok: false, text: `✗ ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <button
          onClick={() => router.refresh()}
          style={{ ...btn, background: "#1c1c1c", color: "#fff", border: 0 }}
        >
          ↻ Uppdatera (färska siffror)
        </button>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} style={btn}>
            {l.label} →
          </a>
        ))}
        {JOBS.map((j) => (
          <button key={j.job} onClick={() => runJob(j.job)} disabled={busy !== null} style={btn}>
            {busy === j.job ? j.busyLabel : j.label}
          </button>
        ))}
      </div>
      {msg && (
        <p style={{ fontSize: 13, color: msg.ok ? "#16804a" : "#b42318", margin: "4px 0 0" }}>{msg.text}</p>
      )}
    </div>
  );
}
