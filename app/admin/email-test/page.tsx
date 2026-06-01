"use client";

// Admin: skicka testkopior av alla mailmallar till dig själv.
// Skyddad av proxy.ts (ADMIN_SECRET / fp_admin-cookie). noindex via robots-meta i layouten.
// Anropar POST /api/admin/email-test (samma origin → cookien följer med).

import { useState } from "react";

// Speglar nycklarna i app/api/admin/email-test/route.ts.
const TEMPLATES: { key: string; label: string; note?: string }[] = [
  { key: "order-confirmation", label: "Orderbekräftelse", note: "Wix order_created" },
  { key: "shipping-confirmation", label: "Fraktbekräftelse / på väg", note: "Wix order_shipped" },
  { key: "delivery-notification", label: "Leverans-/utlämnings-notis", note: "/api/sms-inbound" },
  { key: "refund-confirmation", label: "Återbetalning", note: "Wix refund" },
  { key: "return-confirmation", label: "Returbekräftelse", note: "manuell" },
  { key: "newsletter-welcome", label: "Nyhetsbrev-välkomst", note: "/api/newsletter-signup" },
  { key: "abandoned-cart-1", label: "Övergiven kundvagn – 1h", note: "poller+sender" },
  { key: "abandoned-cart-2", label: "Övergiven kundvagn – 24h", note: "poller+sender" },
  { key: "abandoned-cart-3", label: "Övergiven kundvagn – 72h (5% kod)", note: "poller+sender" },
];

type Result = { template: string; ok: boolean; resendId?: string; error?: string };

export default function EmailTestPage() {
  const [to, setTo] = useState("info@fyndplats.com");
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, Result>>({});

  async function send(template: string) {
    setBusy(template);
    try {
      const res = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, to }),
      });
      const data = (await res.json()) as { results?: Result[]; error?: string };
      const next: Record<string, Result> = {};
      for (const r of data.results ?? []) next[r.template] = r;
      if (!data.results && data.error) next[template] = { template, ok: false, error: data.error };
      setResults((prev) => ({ ...prev, ...next }));
    } catch (e) {
      setResults((prev) => ({ ...prev, [template]: { template, ok: false, error: (e as Error).message } }));
    } finally {
      setBusy(null);
    }
  }

  const cell: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: 14, verticalAlign: "middle" };

  return (
    <section style={{ maxWidth: 820, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui", color: "#1c1c1c" }}>
      <h1 style={{ marginBottom: 4 }}>E-posttest</h1>
      <p style={{ color: "#777", marginTop: 0, fontSize: 13 }}>
        Skicka en testkopia av valfri mailmall till dig själv. Mallarna renderas med exempeldata.
      </p>

      <label style={{ display: "block", margin: "20px 0 8px", fontSize: 13, fontWeight: 600 }}>Skicka till</label>
      <input
        type="email"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        style={{ width: "100%", maxWidth: 360, padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}
      />

      <div style={{ margin: "16px 0 24px" }}>
        <button
          onClick={() => send("all")}
          disabled={busy !== null}
          style={{ background: "#C2410C", color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          {busy === "all" ? "Skickar alla…" : "Skicka alla till mig"}
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#fafafa", textAlign: "left" }}>
            <th style={{ ...cell, fontWeight: 700 }}>Mall</th>
            <th style={{ ...cell, fontWeight: 700 }}>Trigger</th>
            <th style={{ ...cell, fontWeight: 700 }}>Åtgärd</th>
            <th style={{ ...cell, fontWeight: 700 }}>Resultat</th>
          </tr>
        </thead>
        <tbody>
          {TEMPLATES.map((t) => {
            const r = results[t.key];
            return (
              <tr key={t.key}>
                <td style={cell}>{t.label}</td>
                <td style={{ ...cell, color: "#777", fontSize: 12 }}>{t.note}</td>
                <td style={cell}>
                  <button
                    onClick={() => send(t.key)}
                    disabled={busy !== null}
                    style={{ background: "#fff", color: "#C2410C", border: "1px solid #C2410C", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    {busy === t.key ? "Skickar…" : "Skicka test"}
                  </button>
                </td>
                <td style={{ ...cell, fontSize: 12 }}>
                  {r ? (
                    r.ok ? (
                      <span style={{ color: "#16804a" }}>✓ {r.resendId}</span>
                    ) : (
                      <span style={{ color: "#b42318" }}>✗ {r.error}</span>
                    )
                  ) : (
                    <span style={{ color: "#bbb" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
