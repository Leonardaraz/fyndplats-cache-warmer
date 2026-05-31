"use client";
import { useState } from "react";

// Knapp för att dölja/visa en produkt i Veckans fynd (skriver hidden → Wix Data).
// Optimistisk UI: togglar direkt, rullar tillbaka vid fel.
export function AdminHideToggle({ productId, initialHidden }: { productId: string; initialHidden: boolean }) {
  const [hidden, setHidden] = useState(initialHidden);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function toggle() {
    const next = !hidden;
    setBusy(true);
    setErr("");
    setHidden(next);
    try {
      const res = await fetch("/api/admin/toggle-hidden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, hidden: next }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
    } catch (e) {
      setHidden(!next); // rollback
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        style={{
          cursor: busy ? "wait" : "pointer",
          border: "1px solid",
          borderColor: hidden ? "#b91c1c" : "#16804a",
          background: hidden ? "#fef2f2" : "#f0fdf4",
          color: hidden ? "#b91c1c" : "#16804a",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {hidden ? "🚫 Gömd från Veckans fynd" : "✓ Visas i Veckans fynd"}
      </button>
      {err && <span style={{ color: "#b91c1c", fontSize: 11 }}>{err}</span>}
    </span>
  );
}
