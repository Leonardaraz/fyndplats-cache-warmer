"use client";

import { useState, useTransition } from "react";
import { createMappingAction, searchAliExpressAction } from "./actions";
import type { AliExpressSearchResult } from "@/lib/aliexpress/client";
import type { WixV3ProductSummary } from "@/lib/wix/v3-products";

interface Props {
  product: WixV3ProductSummary;
  onMapped: (wixProductId: string) => void;
}

export function MappingCard({ product, onMapped }: Props) {
  const [pending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(product.name);
  const [urlInput, setUrlInput] = useState("");
  const [results, setResults] = useState<AliExpressSearchResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  async function runSearch() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await searchAliExpressAction(searchInput);
      if (res.ok) {
        setResults(res.results);
        if (res.results.length === 0) setMessage("Inga träffar — prova andra sökord eller klistra in URL.");
      } else {
        setError(res.error);
        setResults([]);
      }
    });
  }

  async function mapTo(aliexpressInput: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await createMappingAction(product.id, aliexpressInput);
      if (res.ok) {
        setMessage(res.message);
        onMapped(product.id);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <li style={{
      padding: 12,
      border: "1px solid #eee",
      borderRadius: 8,
      marginBottom: 8,
      background: "#fafafa",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" width={64} height={64}
            style={{ objectFit: "cover", borderRadius: 4 }} />
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</div>
          <div style={{ fontSize: 12, color: "#666" }}>
            {product.variantCount} varianter · <code>{product.id.slice(0, 8)}</code>
          </div>
        </div>
        {!showSearch ? (
          <button onClick={() => setShowSearch(true)} disabled={pending}
            style={btnPrimary}>
            Mappa
          </button>
        ) : null}
      </div>

      {showSearch ? (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Sök */}
          <div style={{ display: "flex", gap: 6 }}>
            <input type="text" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Sökord (titel eller nyckelord)"
              style={input} disabled={pending} />
            <button onClick={runSearch} disabled={pending} style={btn}>
              {pending ? "..." : "Sök AE"}
            </button>
          </div>
          {/* Paste URL */}
          <div style={{ display: "flex", gap: 6 }}>
            <input type="text" value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Eller klistra in AliExpress-URL eller produkt-ID"
              style={input} disabled={pending} />
            <button onClick={() => mapTo(urlInput)} disabled={pending || !urlInput}
              style={btnPrimary}>
              Mappa
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div style={{ marginTop: 8, padding: 6, background: "#fde7e7",
          borderRadius: 4, fontSize: 13, color: "#a00" }}>{error}</div>
      ) : null}
      {message ? (
        <div style={{ marginTop: 8, padding: 6, background: "#e7fde7",
          borderRadius: 4, fontSize: 13, color: "#070" }}>{message}</div>
      ) : null}

      {results.length > 0 ? (
        <ul style={{ marginTop: 8, listStyle: "none", padding: 0, display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 6 }}>
          {results.map((r) => (
            <li key={r.productId} style={{
              border: "1px solid #ddd", borderRadius: 4, padding: 6, background: "#fff",
            }}>
              {r.imageUrl ? (
                <img src={r.imageUrl} alt="" width="100%" height={100}
                  style={{ objectFit: "cover", borderRadius: 4 }} />
              ) : null}
              <div style={{ fontSize: 12, marginTop: 4 }}>{r.title.slice(0, 60)}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                {r.priceUsd ? `$${r.priceUsd.toFixed(2)}` : ""} ·{" "}
                <code>{r.productId.slice(0, 10)}</code>
              </div>
              <button onClick={() => mapTo(r.productId)} disabled={pending}
                style={{ ...btnPrimary, width: "100%", marginTop: 4, fontSize: 12 }}>
                Mappa till denna
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

const input: React.CSSProperties = {
  flex: 1, padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4, fontSize: 13,
};
const btn: React.CSSProperties = {
  padding: "6px 12px", border: "1px solid #ccc", borderRadius: 4, background: "#fff",
  cursor: "pointer", fontSize: 13,
};
const btnPrimary: React.CSSProperties = {
  padding: "6px 12px", border: "none", borderRadius: 4, background: "#F47A35", color: "#fff",
  cursor: "pointer", fontSize: 13, fontWeight: 600,
};
