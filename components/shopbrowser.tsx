"use client";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "./productcard";
import type { Product } from "../lib/products";

// Hur många kort vi renderar initialt + per "Visa fler"-klick. Re-audit
// (2026-05-31): /alla-produkter renderade alla 207 produkter (≈411 <img>) på en
// gång → layout-arbete för hundratals kort frös scrollen. Vi paginerar till en
// hanterbar batch och håller DOM:en liten tills användaren ber om mer.
const PAGE_SIZE = 24;

const BRACKETS = [
  { label: "Alla priser", min: 0, max: Infinity },
  { label: "Under 100 kr", min: 0, max: 100 },
  { label: "100–250 kr", min: 100, max: 250 },
  { label: "250–500 kr", min: 250, max: 500 },
  { label: "Över 500 kr", min: 500, max: Infinity },
];

const SORTS = [
  // "img" sorterar på intern bildkvalitets-poäng men heter "Rekommenderat" utåt —
  // kunden ska inte exponeras för intern logik ("Bäst bilder" förvirrade). Default.
  { v: "img", label: "Rekommenderat" },
  { v: "pop", label: "Populärast" },
  { v: "price-asc", label: "Pris: lågt → högt" },
  { v: "price-desc", label: "Pris: högt → lågt" },
  { v: "name", label: "Namn: A–Ö" },
];

export function ShopBrowser({ products }: { products: Product[] }) {
  // "Bäst bilder" (bildkvalitets-poäng fallande) är default — visuellt starkast först.
  const [sort, setSort] = useState("img");
  const [bi, setBi] = useState(0);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [open, setOpen] = useState(false); // mobile-collapsible filter panel

  const list = useMemo(() => {
    const b = BRACKETS[bi];
    let out = products.filter((p) => p.priceNum >= b.min && p.priceNum < b.max);
    if (onlyInStock) out = out.filter((p) => p.inStock);
    if (onlyOnSale) out = out.filter((p) => p.onSale);
    if (sort === "img") out = [...out].sort((a, z) => (z.imageScore ?? 60) - (a.imageScore ?? 60));
    else if (sort === "price-asc") out = [...out].sort((a, z) => a.priceNum - z.priceNum);
    else if (sort === "price-desc") out = [...out].sort((a, z) => z.priceNum - a.priceNum);
    else if (sort === "name") out = [...out].sort((a, z) => a.name.localeCompare(z.name, "sv"));
    return out;
  }, [products, sort, bi, onlyInStock, onlyOnSale]);

  const activeFilters = (bi > 0 ? 1 : 0) + (onlyInStock ? 1 : 0) + (onlyOnSale ? 1 : 0);
  const reset = () => { setBi(0); setOnlyInStock(false); setOnlyOnSale(false); };

  // Paginering: visa PAGE_SIZE kort, "Visa fler" laddar nästa batch. Återställs
  // till första sidan när filter/sortering/produktlista ändras (annars skulle en
  // ny lista ärva ett stort "shown"-värde och rendera allt på en gång igen).
  const [shown, setShown] = useState(PAGE_SIZE);
  useEffect(() => { setShown(PAGE_SIZE); }, [sort, bi, onlyInStock, onlyOnSale, products]);
  const visible = list.slice(0, shown);
  const remaining = list.length - visible.length;

  return (
    <>
      {/* Top toolbar — filter vänster, count mitten/subtilt, sort höger */}
      <div className={`shopbar ${open ? "open" : ""}`}>
        <button type="button" className="shopbar-toggle" onClick={() => setOpen((b) => !b)} aria-expanded={open}>
          ⚙ Filter {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
        </button>

        <div className="shopcount-inline" aria-live="polite">
          {list.length} {list.length === 1 ? "produkt" : "produkter"}
          {activeFilters > 0 && <span className="shopcount-of"> av {products.length}</span>}
        </div>

        <label className="sortsel shopbar-sort">
          <span>Sortera</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sortera produkter">
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </label>

        <div className="shopbar-panel">
          <div className="filter-group">
            <span className="filter-label">Pris</span>
            <div className="pricebrackets" role="group" aria-label="Filtrera på pris">
              {BRACKETS.map((b, i) => (
                <button
                  key={b.label}
                  type="button"
                  className={`pchip ${i === bi ? "active" : ""}`}
                  aria-pressed={i === bi}
                  onClick={() => setBi(i)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Tillgänglighet</span>
            <div className="filter-toggles">
              <label className={`toggle ${onlyInStock ? "on" : ""}`}>
                <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} />
                <span>I lager</span>
              </label>
              <label className={`toggle ${onlyOnSale ? "on" : ""}`}>
                <input type="checkbox" checked={onlyOnSale} onChange={(e) => setOnlyOnSale(e.target.checked)} />
                <span>Rea</span>
              </label>
            </div>
          </div>

          {activeFilters > 0 && (
            <button type="button" className="filter-reset" onClick={reset}>✕ Rensa filter</button>
          )}
        </div>
      </div>

      {list.length ? (
        <>
          <div className="prodgrid">{visible.map((p) => <ProductCard p={p} key={p.slug} />)}</div>
          {remaining > 0 && (
            <div className="loadmore-wrap">
              <button type="button" className="loadmore" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                Visa fler <span className="loadmore-rem">({remaining} kvar)</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="empty" style={{ textAlign: "center", padding: "36px 0", color: "var(--soft)" }}>
          Inga produkter matchade dina filter. <button type="button" onClick={reset} style={{ background: "none", border: "none", color: "#C2410C", cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit" }}>Rensa filter</button>
        </p>
      )}
    </>
  );
}
