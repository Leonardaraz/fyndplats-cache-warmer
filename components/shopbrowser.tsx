"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "./productcard";
import { orderRecommended, orderPopular } from "../lib/sort-products";
import { universalCollectionIds } from "../lib/related-pick";
import type { Product } from "../lib/products";

// Hur många kort vi renderar initialt + per "Visa fler"-klick. Re-audit
// (2026-05-31): /alla-produkter renderade alla 207 produkter (≈411 <img>) på en
// gång → layout-arbete för hundratals kort frös scrollen. Vi paginerar till en
// hanterbar batch och håller DOM:en liten tills användaren ber om mer.
const PAGE_SIZE = 24;

// Pris-brackets. `slug` är det som hamnar i URL:en (?pris=under-100) så delning
// och SEO funkar; index 0 ("Alla priser") utelämnas helt ur URL:en.
const BRACKETS = [
  { label: "Alla priser", min: 0, max: Infinity, slug: "" },
  { label: "Under 100 kr", min: 0, max: 100, slug: "under-100" },
  { label: "100–250 kr", min: 100, max: 250, slug: "100-250" },
  { label: "250–500 kr", min: 250, max: 500, slug: "250-500" },
  { label: "Över 500 kr", min: 500, max: Infinity, slug: "over-500" },
];

const SORTS = [
  // "img" heter "Rekommenderat" utåt och är butikens egen mix (bästsäljare +
  // färskhets-skjuts + REA-knuff — se lib/sort-products). URL-värdet "img" är
  // kvar av bakåtkompatibilitet med delade länkar; bildpoängen den en gång
  // sorterade på var 60 för samtliga produkter → tre val gav samma ordning
  // (Leonard 2026-08-08).
  { v: "img", label: "Rekommenderat" },
  // "new" = nyast importerade först (createdAt desc). Standard på /alla-produkter
  // via defaultSort-propen (Leonard 2026-06-14); valbart överallt.
  { v: "new", label: "Nyast" },
  { v: "pop", label: "Populärast" },
  { v: "price-asc", label: "Pris: lågt → högt" },
  { v: "price-desc", label: "Pris: högt → lågt" },
  { v: "name", label: "Namn: A–Ö" },
];
const SORT_VALUES = new Set(SORTS.map((s) => s.v));

export function ShopBrowser({ products, defaultSort = "img" }: { products: Product[]; defaultSort?: string }) {
  // useSearchParams() kräver en Suspense-gräns för att statiska sidor
  // (/kategori/[slug] med generateStaticParams) inte ska falla tillbaka till
  // helsides-CSR. Vi wrappar den inre komponenten i Suspense och visar produkt-
  // rutnätet som fallback så inget hoppar.
  return (
    <Suspense fallback={<div className="prodgrid">{products.slice(0, PAGE_SIZE).map((p) => <ProductCard p={p} key={p.slug} />)}</div>}>
      <ShopBrowserInner products={products} defaultSort={defaultSort} />
    </Suspense>
  );
}

function ShopBrowserInner({ products, defaultSort }: { products: Product[]; defaultSort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Initialt filter-/sorterings-tillstånd läses EN gång ur URL:en (delbar länk).
  const [sort, setSort] = useState(() => {
    const s = sp.get("sortera");
    return s && SORT_VALUES.has(s) ? s : defaultSort;
  });
  const [bi, setBi] = useState(() => {
    const p = sp.get("pris");
    const i = BRACKETS.findIndex((b) => b.slug && b.slug === p);
    return i > 0 ? i : 0;
  });
  const [onlyInStock, setOnlyInStock] = useState(() => sp.get("lager") === "1");
  const [onlyOnSale, setOnlyOnSale] = useState(() => sp.get("rea") === "1");
  const [open, setOpen] = useState(false); // mobile-collapsible filter panel

  // Sync state → URL. Bygger på window.location.search så befintliga params
  // (t.ex. ?kategori på /alla-produkter) bevaras. Kör vid mount men skriver bara
  // om URL:en faktiskt skiljer sig → ingen onödig history-replace eller loop.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (sort !== defaultSort) params.set("sortera", sort); else params.delete("sortera");
    const slug = BRACKETS[bi]?.slug;
    if (slug) params.set("pris", slug); else params.delete("pris");
    if (onlyInStock) params.set("lager", "1"); else params.delete("lager");
    if (onlyOnSale) params.set("rea", "1"); else params.delete("rea");
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    const current = window.location.pathname + window.location.search;
    if (url !== current) router.replace(url, { scroll: false });
  }, [sort, bi, onlyInStock, onlyOnSale, pathname, router]);

  const list = useMemo(() => {
    const b = BRACKETS[bi];
    let out = products.filter((p) => p.priceNum >= b.min && p.priceNum < b.max);
    if (onlyInStock) out = out.filter((p) => p.inStock);
    if (onlyOnSale) out = out.filter((p) => p.onSale);
    // Dag-upplösning på "nu" så server- och klientrendering ger samma ordning
    // (sekund-precision hade gett hydration-hopp i Rekommenderat-poängen).
    const dayMs = Math.floor(Date.now() / 86_400_000) * 86_400_000;
    // Rekommenderat och Populärast blandar kategorier (Leonard 2026-08-16).
    // Utan blandningen blev båda i praktiken "Nyast": popularity är 0 för 711
    // av 716 produkter och imageScore 60 för alla, så createdAt var enda
    // signalen med variation. Ordningarna är rena funktioner i
    // lib/sort-products — där ligger också mätningen och testerna.
    const universal = universalCollectionIds(products);
    if (sort === "img") out = orderRecommended(out, universal, dayMs);
    else if (sort === "pop") out = orderPopular(out, universal);
    else if (sort === "new") out = [...out].sort((a, z) => (z.createdAt || 0) - (a.createdAt || 0) || String(a.id ?? "").localeCompare(String(z.id ?? "")));
    else if (sort === "price-asc") out = [...out].sort((a, z) => a.priceNum - z.priceNum);
    else if (sort === "price-desc") out = [...out].sort((a, z) => z.priceNum - a.priceNum);
    else if (sort === "name") out = [...out].sort((a, z) => a.name.localeCompare(z.name, "sv"));
    return out;
  }, [products, sort, bi, onlyInStock, onlyOnSale]);

  // Finns det något slutsålt alls i den här listan? Styr om "I lager"-reglaget
  // är meningsfullt (se markupen nedan). Räknas ur datan, inte ur env-flaggan,
  // så det stämmer per sida: kategori = nej, sökresultat = ofta ja.
  const hasOos = useMemo(() => products.some((p) => !p.inStock), [products]);
  // En dold reglage får inte spöka i filterräknaren ("1 aktivt filter" utan att
  // något syns) om en gammal delad länk bär ?lager=1.
  const activeFilters = (bi > 0 ? 1 : 0) + (onlyInStock && hasOos ? 1 : 0) + (onlyOnSale ? 1 : 0);
  const reset = () => { setBi(0); setOnlyInStock(false); setOnlyOnSale(false); };

  // Paginering: visa PAGE_SIZE kort, "Visa fler" laddar nästa batch. Återställs
  // till första sidan när filter/sortering/produktlista ändras (annars skulle en
  // ny lista ärva ett stort "shown"-värde och rendera allt på en gång igen).
  const [shown, setShown] = useState(PAGE_SIZE);
  const firstRender = useRef(true);
  useEffect(() => {
    // Hoppa över första körningen så en delad länk inte nollställer en ev.
    // bevarad scroll-position direkt vid mount.
    if (firstRender.current) { firstRender.current = false; return; }
    setShown(PAGE_SIZE);
  }, [sort, bi, onlyInStock, onlyOnSale, products]);
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
              {/* "I lager" visas bara när listan FAKTISKT innehåller något
                  slutsålt att filtrera bort. På kategori-/butikssidorna göms
                  slutsålt redan bort, och en reglage som inte kan ändra något
                  är brus som får kunden att tvivla på det den ser. I sök (där
                  slutsålda träffar behålls) dyker den upp av sig själv igen. */}
              {hasOos && (
                <label className={`toggle ${onlyInStock ? "on" : ""}`}>
                  <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} />
                  <span>I lager</span>
                </label>
              )}
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
