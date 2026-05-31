"use client";

// Client-komponent: sök-formulär, resultatgrid och bevakningslista.
//
// API-token: /api/aliexpress/discover och /api/import kräver
// x-fyndplats-token-headern. Det här admin-UI:t kör server-actions istället
// för att slippa exponera token i klienten — server-actionsen läser
// EXTENSION_API_TOKEN från env och vidarebefordrar den.

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  importByUrlAction,
  runDiscoverSearchAction,
  addWatchlistTermAction,
  removeWatchlistTermAction,
  listWatchlistAction,
} from "./actions";
import type { DiscoverResult } from "./types";

type SortBy = "orders,desc" | "price,asc" | "price,desc" | "evaluate,desc";

const SORT_LABEL: Record<SortBy, string> = {
  "orders,desc": "Mest sålda först",
  "price,asc": "Lägsta pris först",
  "price,desc": "Högsta pris först",
  "evaluate,desc": "Bästa betyg först",
};

interface ImportState {
  pending: boolean;
  result?: { ok: boolean; message: string };
}

export default function DiscoverClient() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("orders,desc");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [euOnly, setEuOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<DiscoverResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [imports, setImports] = useState<Record<string, ImportState>>({});
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchInput, setWatchInput] = useState("");

  const runSearch = useCallback(
    (nextPage = 1) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSearchError("Skriv en sökterm.");
        return;
      }
      setSearchError(null);
      startSearch(async () => {
        const res = await runDiscoverSearchAction({
          query: trimmed,
          sortBy,
          page: nextPage,
          pageSize: 20,
          maxPriceUsd: maxPrice ? parseFloat(maxPrice) : undefined,
          categoryId: categoryId || undefined,
          euOnly,
        });
        if (!res.ok) {
          setSearchError(res.error);
          setResults([]);
        } else {
          setResults(res.results);
          setPage(nextPage);
        }
      });
    },
    [query, sortBy, maxPrice, categoryId, euOnly],
  );

  useEffect(() => {
    void (async () => {
      const list = await listWatchlistAction();
      setWatchlist(list);
    })();
  }, []);

  const onImport = useCallback((url: string, productId: string) => {
    setImports((s) => ({ ...s, [productId]: { pending: true } }));
    void (async () => {
      const res = await importByUrlAction(url);
      setImports((s) => ({
        ...s,
        [productId]: { pending: false, result: res },
      }));
    })();
  }, []);

  const onAddWatch = useCallback(() => {
    const term = watchInput.trim();
    if (!term) return;
    void (async () => {
      const next = await addWatchlistTermAction(term);
      setWatchlist(next);
      setWatchInput("");
    })();
  }, [watchInput]);

  const onRemoveWatch = useCallback((term: string) => {
    void (async () => {
      const next = await removeWatchlistTermAction(term);
      setWatchlist(next);
    })();
  }, []);

  return (
    <div style={{ marginTop: 16 }}>
      {/* Sökformulär */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(1);
        }}
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
          gap: 8,
          alignItems: "end",
          marginBottom: 12,
        }}
      >
        <Field label="Sökord">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="t.ex. led-lampa, yogamatta, dammsugarrobot"
            style={inputStyle}
          />
        </Field>
        <Field label="Sortering">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            style={inputStyle}
          >
            {Object.entries(SORT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Max-pris (USD)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="t.ex. 25"
            style={inputStyle}
          />
        </Field>
        <Field label="Kategori-ID (valfritt)">
          <input
            type="text"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="t.ex. 100003109"
            style={inputStyle}
          />
        </Field>
        <button
          type="submit"
          disabled={isSearching}
          style={{
            ...buttonStyle,
            background: "#2563eb",
            opacity: isSearching ? 0.7 : 1,
          }}
        >
          {isSearching ? "Söker…" : "Sök"}
        </button>
      </form>

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          padding: "4px 10px",
          background: euOnly ? "#d1fae5" : "#f3f4f6",
          border: euOnly ? "1px solid #6ee7b7" : "1px solid #d1d5db",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={euOnly}
          onChange={(e) => setEuOnly(e.target.checked)}
          style={{ margin: 0 }}
        />
        <span>🇪🇺 Endast EU-lager (rekommenderat)</span>
      </label>

      {searchError ? (
        <div
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            padding: "8px 12px",
            borderRadius: 6,
            marginTop: 12,
            fontSize: 13,
          }}
        >
          {searchError}
        </div>
      ) : null}

      {/* Resultatgrid */}
      {results.length > 0 ? (
        <>
          <h2 style={{ marginTop: 24 }}>Träffar ({results.length})</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {results.map((p) => (
              <ProductCard
                key={p.productId}
                product={p}
                onImport={onImport}
                state={imports[p.productId]}
              />
            ))}
          </div>

          <Pagination page={page} onChange={(n) => runSearch(n)} canNext={results.length >= 20} />
        </>
      ) : null}

      {/* Bevakningslista */}
      <h2 style={{ marginTop: 36 }}>Bevakningslista</h2>
      <p style={{ fontSize: 13, color: "#666" }}>
        Sökord som körs dagligen via cron-jobb (06:00 UTC). När nya
        EU-lager-träffar dyker upp får du ett mejl med direktlänk till
        importen.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={watchInput}
          onChange={(e) => setWatchInput(e.target.value)}
          placeholder="Lägg till sökord…"
          style={{ ...inputStyle, maxWidth: 360 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddWatch();
            }
          }}
        />
        <button type="button" onClick={onAddWatch} style={buttonStyle}>
          Lägg till
        </button>
      </div>
      {watchlist.length === 0 ? (
        <p style={{ color: "#888", fontSize: 13 }}>Inga bevakade sökord ännu.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, fontSize: 13 }}>
          {watchlist.map((term) => (
            <li
              key={term}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "4px 0",
              }}
            >
              <span style={{ flex: 1 }}>"{term}"</span>
              <button
                type="button"
                onClick={() => onRemoveWatch(term)}
                style={{
                  ...buttonStyle,
                  background: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  fontSize: 12,
                  padding: "4px 10px",
                }}
              >
                Ta bort
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  fontSize: 13,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
};

const buttonStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "none",
  borderRadius: 6,
  background: "#1f2937",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontSize: 12,
        color: "#374151",
      }}
    >
      {label}
      {children}
    </label>
  );
}

function Pagination({
  page,
  onChange,
  canNext,
}: {
  page: number;
  onChange: (n: number) => void;
  canNext: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        style={{ ...buttonStyle, opacity: page <= 1 ? 0.5 : 1 }}
      >
        ← Föregående
      </button>
      <span style={{ alignSelf: "center", fontSize: 13 }}>Sida {page}</span>
      <button
        type="button"
        disabled={!canNext}
        onClick={() => onChange(page + 1)}
        style={{ ...buttonStyle, opacity: canNext ? 1 : 0.5 }}
      >
        Nästa →
      </button>
    </div>
  );
}

function ProductCard({
  product,
  onImport,
  state,
}: {
  product: DiscoverResult;
  onImport: (url: string, productId: string) => void;
  state?: ImportState;
}) {
  const codes = product.shipsFromCountries ?? [];
  const cls = product.warehouseClass ?? "UNKNOWN";
  const url =
    product.productUrl
    ?? `https://www.aliexpress.com/item/${encodeURIComponent(product.productId)}.html`;

  let badgeBg = "#e5e7eb";
  let badgeColor = "#4b5563";
  let badgeText = "Lager okänt";
  if (cls === "EU") {
    badgeBg = "#d1fae5";
    badgeColor = "#065f46";
    badgeText = `🇪🇺 EU-lager (${codes.join(", ") || "?"})`;
  } else if (cls === "MIXED") {
    badgeBg = "#fef3c7";
    badgeColor = "#92400e";
    badgeText = `🇪🇺 Delvis EU (${codes.join(", ")})`;
  } else if (cls === "CN") {
    badgeBg = "#fee2e2";
    badgeColor = "#991b1b";
    badgeText = `🇨🇳 Kina (${codes.join(", ") || "?"})`;
  }

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl ?? ""}
          alt=""
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            display: "block",
            background: "#f3f4f6",
          }}
        />
      </a>
      <div style={{ padding: 10, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12, lineHeight: 1.3 }}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#111", textDecoration: "none" }}
          >
            {product.title.slice(0, 90)}
            {product.title.length > 90 ? "…" : ""}
          </a>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          {product.priceUsd !== undefined ? `$${product.priceUsd.toFixed(2)}` : "—"}
        </div>
        <div style={{ fontSize: 11, color: "#666" }}>
          {product.orders !== undefined ? `${product.orders}+ sålda` : ""}
          {product.orders !== undefined && product.rating !== undefined ? " · " : ""}
          {product.rating !== undefined ? `★ ${product.rating.toFixed(1)}` : ""}
        </div>
        <span
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 999,
            background: badgeBg,
            color: badgeColor,
            alignSelf: "flex-start",
          }}
        >
          {badgeText}
        </span>
        <button
          type="button"
          disabled={state?.pending || state?.result?.ok}
          onClick={() => onImport(url, product.productId)}
          style={{
            ...buttonStyle,
            marginTop: "auto",
            background: state?.result?.ok ? "#16a34a" : "#F47A35",
            opacity: state?.pending ? 0.7 : 1,
          }}
        >
          {state?.pending
            ? "Importerar…"
            : state?.result?.ok
              ? "Importerad ✓"
              : "Importera"}
        </button>
        {state?.result && !state.result.ok ? (
          <div style={{ fontSize: 11, color: "#991b1b" }}>{state.result.message}</div>
        ) : null}
      </div>
    </div>
  );
}
