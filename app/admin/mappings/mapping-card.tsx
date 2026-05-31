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
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [mapped, setMapped] = useState(false);

  function clearMessages() {
    setError(null);
    setInfo(null);
    setSuccess(null);
  }

  function runSearch() {
    clearMessages();
    startTransition(async () => {
      const res = await searchAliExpressAction(searchInput);
      if (res.ok) {
        setResults(res.results);
        if (res.results.length === 0) {
          setInfo(`Inga träffar för "${res.query}". Försök paste-URL-fältet istället.`);
        }
      } else {
        setError(res.error);
        setResults([]);
      }
    });
  }

  function mapTo(aliexpressInput: string) {
    clearMessages();
    startTransition(async () => {
      const res = await createMappingAction(product.id, aliexpressInput);
      if (res.ok) {
        setSuccess(res.message);
        setMapped(true);
        setResults([]);
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
      background: mapped ? "#f1faf1" : "#fafafa",
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
        {mapped ? (
          <span style={badgeSuccess}>Mappad ✓</span>
        ) : !showSearch ? (
          <button onClick={() => setShowSearch(true)} disabled={pending}
            style={btnPrimary}>
            Mappa
          </button>
        ) : null}
      </div>

      {showSearch && !mapped ? (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Sök */}
          <div style={{ display: "flex", gap: 6 }}>
            <input type="text" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !pending && searchInput.trim()) {
                  e.preventDefault();
                  runSearch();
                }
              }}
              placeholder="Sökord (titel eller nyckelord)"
              style={input} disabled={pending} />
            <button onClick={runSearch} disabled={pending || !searchInput.trim()} style={btn}>
              {pending ? "Söker…" : "Sök AE"}
            </button>
          </div>
          {/* Paste URL */}
          <div style={{ display: "flex", gap: 6 }}>
            <input type="text" value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !pending && urlInput.trim()) {
                  e.preventDefault();
                  mapTo(urlInput);
                }
              }}
              placeholder="Eller klistra in AliExpress-URL eller produkt-ID"
              style={input} disabled={pending} />
            <button onClick={() => mapTo(urlInput)} disabled={pending || !urlInput.trim()}
              style={btnPrimary}>
              Mappa
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div style={boxError}>{error}</div>
      ) : null}
      {info ? (
        <div style={boxInfo}>{info}</div>
      ) : null}
      {success ? (
        <div style={boxSuccess}>{success}</div>
      ) : null}

      {results.length > 0 ? (
        <ul style={{ marginTop: 10, listStyle: "none", padding: 0, display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
          {results.slice(0, 10).map((r) => {
            const hasDiscount =
              typeof r.originalPriceUsd === "number"
              && typeof r.priceUsd === "number"
              && r.originalPriceUsd > r.priceUsd;
            const discountPct = hasDiscount
              ? Math.round((1 - (r.priceUsd! / r.originalPriceUsd!)) * 100)
              : r.discountPct;
            const shortTitle = r.title.length > 80 ? r.title.slice(0, 77) + "…" : r.title;
            return (
              <li key={r.productId} title={r.title} style={{
                border: "1px solid #ddd", borderRadius: 4, padding: 8, background: "#fff",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt="" width="100%" height={120}
                    style={{ objectFit: "cover", borderRadius: 4 }} />
                ) : (
                  <div style={{
                    width: "100%", height: 120, background: "#f5f5f5",
                    borderRadius: 4, display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#aaa", fontSize: 11,
                  }}>(ingen bild)</div>
                )}
                <div style={{ fontSize: 12, lineHeight: 1.3 }}>{shortTitle}</div>
                <div style={{ fontSize: 12, color: "#333" }}>
                  {typeof r.priceUsd === "number" ? (
                    <>
                      <b>${r.priceUsd.toFixed(2)}</b>
                      {hasDiscount ? (
                        <>
                          {" "}
                          <span style={{ textDecoration: "line-through", color: "#888", marginLeft: 4 }}>
                            ${r.originalPriceUsd!.toFixed(2)}
                          </span>
                        </>
                      ) : null}
                      {typeof discountPct === "number" && discountPct > 0 ? (
                        <span style={{ color: "#c00", marginLeft: 4, fontWeight: 600 }}>
                          −{discountPct}%
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span style={{ color: "#888" }}>pris okänt</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "#999" }}>
                  <code>{r.productId.slice(0, 12)}</code>
                </div>
                <button onClick={() => mapTo(r.productId)} disabled={pending}
                  style={{ ...btnPrimary, width: "100%", marginTop: 4, fontSize: 12 }}>
                  Välj denna
                </button>
              </li>
            );
          })}
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
const boxError: React.CSSProperties = {
  marginTop: 8, padding: 8, background: "#fde7e7",
  borderRadius: 4, fontSize: 13, color: "#a00",
};
const boxInfo: React.CSSProperties = {
  marginTop: 8, padding: 8, background: "#f0f0f0",
  borderRadius: 4, fontSize: 13, color: "#555",
};
const boxSuccess: React.CSSProperties = {
  marginTop: 8, padding: 8, background: "#e7fde7",
  borderRadius: 4, fontSize: 13, color: "#070",
};
const badgeSuccess: React.CSSProperties = {
  padding: "4px 10px", background: "#e7fde7", color: "#070",
  borderRadius: 4, fontSize: 13, fontWeight: 600,
};
