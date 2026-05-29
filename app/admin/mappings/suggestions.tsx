"use client";

import { useState } from "react";
import type { MappingSuggestion } from "@/lib/store";
import { confirmSuggestionAction, dismissSuggestionAction } from "./actions";

const CONF_COLOR: Record<MappingSuggestion["confidence"], string> = {
  high: "#070",
  medium: "#b8860b",
  low: "#a00",
};

export function SuggestionsList({ suggestions }: { suggestions: MappingSuggestion[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
      {suggestions.map((s) => (
        <SuggestionCard key={s.wixProductId} suggestion={s} />
      ))}
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: MappingSuggestion }) {
  const [selected, setSelected] = useState(suggestion.candidates[0]?.productId ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function confirm() {
    if (!selected) return;
    setBusy(true);
    setMsg(null);
    const res = await confirmSuggestionAction(suggestion.wixProductId, selected);
    setBusy(false);
    if (res.ok) {
      setMsg(res.message);
      setDone(true);
    } else {
      setMsg(`Fel: ${res.error}`);
    }
  }

  async function dismiss() {
    setBusy(true);
    setMsg(null);
    const res = await dismissSuggestionAction(suggestion.wixProductId);
    setBusy(false);
    if (res.ok) setDone(true);
    else setMsg(`Fel: ${res.error}`);
  }

  if (done) {
    return (
      <div style={{ padding: 10, border: "1px solid #cde", borderRadius: 6, background: "#f6fff6", fontSize: 13 }}>
        <b>{suggestion.wixProductName}</b> — {msg ?? "klart"} {" "}
        <span style={{ color: "#666" }}>(ladda om för att uppdatera listan)</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <b style={{ fontSize: 14 }}>{suggestion.wixProductName}</b>
        <span style={{ fontSize: 12, color: CONF_COLOR[suggestion.confidence], fontWeight: 700 }}>
          {suggestion.confidence.toUpperCase()} confidence
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
        Sökord: <code>{suggestion.searchQuery}</code>
      </div>

      {suggestion.candidates.length === 0 ? (
        <div style={{ fontSize: 13, color: "#a00" }}>
          Inga AliExpress-träffar. Avfärda och mappa manuellt nedan.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {suggestion.candidates.map((c) => (
            <label
              key={c.productId}
              style={{
                display: "flex", gap: 8, alignItems: "center", padding: 6,
                border: selected === c.productId ? "2px solid #0a58ca" : "1px solid #eee",
                borderRadius: 6, cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name={`sugg-${suggestion.wixProductId}`}
                checked={selected === c.productId}
                onChange={() => setSelected(c.productId)}
              />
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" width={48} height={48} style={{ objectFit: "cover", borderRadius: 4 }} />
              ) : null}
              <span style={{ flex: 1, fontSize: 13 }}>
                {c.title}
                <span style={{ color: "#888" }}>
                  {" "}— {c.priceUsd ? `$${c.priceUsd}` : "?"} · match {Math.round(c.score * 100)}%
                </span>
                {c.productUrl ? (
                  <>
                    {" "}
                    <a href={c.productUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                      öppna
                    </a>
                  </>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        <button
          onClick={confirm}
          disabled={busy || !selected}
          style={{
            padding: "6px 12px", borderRadius: 6, border: "none",
            background: "#070", color: "#fff", fontWeight: 600,
            cursor: busy || !selected ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "…" : "Bekräfta mappning"}
        </button>
        <button
          onClick={dismiss}
          disabled={busy}
          style={{
            padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc",
            background: "#fff", cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Avfärda
        </button>
        {msg ? <span style={{ fontSize: 13, color: msg.startsWith("Fel") ? "#a00" : "#070" }}>{msg}</span> : null}
      </div>
    </div>
  );
}
