"use client";

import { useState, useTransition } from "react";
import { lookupSourceAction, type LookupResult } from "./actions";

export function LookupClient() {
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<LookupResult | null>(null);
  const [copied, setCopied] = useState(false);

  function run() {
    if (!input.trim() || pending) return;
    setResult(null);
    setCopied(false);
    startTransition(async () => {
      setResult(await lookupSourceAction(input));
    });
  }

  function copyLink(url: string) {
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run();
            }
          }}
          placeholder="Wix-produkt-id, slug eller produkt-URL"
          style={input_}
          disabled={pending}
          autoFocus
        />
        <button onClick={run} disabled={pending || !input.trim()} style={btnPrimary}>
          {pending ? "Söker…" : "Hitta källa"}
        </button>
      </div>

      {result && !result.ok ? <div style={boxError}>{result.error}</div> : null}

      {result && result.ok ? (
        <div style={card}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{result.title ?? "(namnlös produkt)"}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {result.variantCount} varianter · Wix: <code>{result.wixProductId}</code> · matchad via{" "}
            {result.matchedBy === "id" ? "produkt-id" : "slug"}
          </div>

          <div style={{ marginTop: 10, fontSize: 14 }}>
            <div>
              AliExpress-produkt-id: <code>{result.aeProductId}</code>
            </div>
            {result.supplierName ? (
              <div style={{ color: "#444", marginTop: 2 }}>Säljare: {result.supplierName}</div>
            ) : null}
          </div>

          {result.aeUrl ? (
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <a href={result.aeUrl} target="_blank" rel="noopener noreferrer" style={btnPrimary}>
                Öppna på AliExpress ↗
              </a>
              <button onClick={() => copyLink(result.aeUrl!)} style={btn}>
                {copied ? "Kopierad ✓" : "Kopiera länk"}
              </button>
              <span style={{ fontSize: 12, color: "#888", wordBreak: "break-all" }}>{result.aeUrl}</span>
            </div>
          ) : (
            <div style={boxError}>Mappningen saknar både sourceUrl och produkt-id — kan inte bygga länk.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

const input_: React.CSSProperties = {
  flex: 1,
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
};
const btn: React.CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  textDecoration: "none",
  color: "#222",
};
const btnPrimary: React.CSSProperties = {
  padding: "8px 14px",
  border: "none",
  borderRadius: 4,
  background: "#F47A35",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
};
const boxError: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  background: "#fde7e7",
  borderRadius: 6,
  fontSize: 13,
  color: "#a00",
};
const card: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
};
