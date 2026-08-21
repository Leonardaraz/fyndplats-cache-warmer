"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "./productcard";
import { currentDayMs, orderRecommended, orderPopular } from "../lib/sort-products";
import { colorLabel, colorOf, sortColorKeys } from "../lib/variant-color-image";
import { universalCollectionIds } from "../lib/related-pick";
import {
  formatPrice,
  parsePriceSlug,
  priceBounds,
  priceRangeLabel,
  priceSlug,
  upperLimit,
  type PriceBounds,
} from "../lib/price-range";
import type { Product } from "../lib/products";

// Hur många kort vi renderar initialt + per "Visa fler"-klick. Re-audit
// (2026-05-31): /alla-produkter renderade alla 207 produkter (≈411 <img>) på en
// gång → layout-arbete för hundratals kort frös scrollen. Vi paginerar till en
// hanterbar batch och håller DOM:en liten tills användaren ber om mer.
const PAGE_SIZE = 24;

/**
 * Handtagens startläge, ur URL:ens ?pris. Skalan (lib/price-range) räknas ur de
 * produkter som visas, så en delad länk kan peka på ett spann som inte längre
 * finns på banan — t.ex. det gamla ?pris=under-100 när billigaste produkten
 * kostar 199 kr. Överlappar intervallet inte skalan alls behandlas det som
 * inget filter: produkterna det syftade på finns inte, och ett reglage som
 * står och klämmer ihop sig i ena änden förklarar ingenting för kunden.
 */
function handlesFromSlug(bounds: PriceBounds | null, slug: string | null): [number, number] {
  if (!bounds) return [0, 0];
  const r = parsePriceSlug(slug);
  if (!r || r.max <= bounds.min || r.min >= bounds.max) return [bounds.min, bounds.max];
  const snap = (v: number) => Math.min(Math.max(Math.round(v / bounds.step) * bounds.step, bounds.min), bounds.max);
  const lo = snap(r.min);
  const hi = Number.isFinite(r.max) ? snap(r.max) : bounds.max;
  return lo < hi ? [lo, hi] : [bounds.min, bounds.max];
}

const SORTS = [
  // "img" heter "Rekommenderat" utåt och är butikens egen mix (bästsäljare +
  // färskhets-skjuts + REA-knuff — se lib/sort-products). URL-värdet "img" är
  // kvar av bakåtkompatibilitet med delade länkar; bildpoängen den en gång
  // sorterade på var 60 för samtliga produkter → tre val gav samma ordning
  // (Leonard 2026-08-08).
  { v: "img", label: "Rekommenderat" },
  // "new" = nyast importerade först (createdAt desc). Var standard på
  // /alla-produkter 2026-06-14 → 2026-08-21; numera valbart, inte förvalt.
  // Hela katalogen är importerad juni–augusti 2026, så ordningen särskilde
  // knappt något — Rekommenderat är standard överallt nu.
  { v: "new", label: "Nyast" },
  { v: "pop", label: "Populärast" },
  { v: "price-asc", label: "Pris: lågt → högt" },
  { v: "price-desc", label: "Pris: högt → lågt" },
  { v: "name", label: "Namn: A–Ö" },
];
const SORT_VALUES = new Set(SORTS.map((s) => s.v));

/** Underkategori till den kategori sidan visar — chips i filterpanelen. */
export type SubCategory = { name: string; slug: string; count: number };

export function ShopBrowser({ products, defaultSort = "img", subs = [] }: { products: Product[]; defaultSort?: string; subs?: SubCategory[] }) {
  // useSearchParams() kräver en Suspense-gräns för att statiska sidor
  // (/kategori/[slug] med generateStaticParams) inte ska falla tillbaka till
  // helsides-CSR. Vi wrappar den inre komponenten i Suspense och visar produkt-
  // rutnätet som fallback så inget hoppar.
  return (
    <Suspense fallback={<div className="prodgrid">{products.slice(0, PAGE_SIZE).map((p) => <ProductCard p={p} key={p.slug} />)}</div>}>
      <ShopBrowserInner products={products} defaultSort={defaultSort} subs={subs} />
    </Suspense>
  );
}

function ShopBrowserInner({ products, defaultSort, subs }: { products: Product[]; defaultSort: string; subs: SubCategory[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Initialt filter-/sorterings-tillstånd läses EN gång ur URL:en (delbar länk).
  const [sort, setSort] = useState(() => {
    const s = sp.get("sortera");
    return s && SORT_VALUES.has(s) ? s : defaultSort;
  });
  // Prisreglagets skala härleds ur produkterna i vyn. null = spridningen är för
  // liten för att ett reglage ska hjälpa någon (t.ex. tre sökträffar) → inget
  // prisfilter renderas alls.
  const bounds = useMemo(() => priceBounds(products), [products]);
  // Handtagen är källan; slugen härleds ur dem. URL:en skrivs först när
  // handtaget släpps (commitPrice) — annars hade varje pixel i draget blivit
  // en router.replace.
  const [handles, setHandles] = useState<[number, number]>(() => handlesFromSlug(bounds, sp.get("pris")));
  const [urlPrice, setUrlPrice] = useState(() => {
    const h = handlesFromSlug(bounds, sp.get("pris"));
    return bounds ? priceSlug(h[0], h[1], bounds) : "";
  });
  // Vald färg. Skenan är till sin natur enkelval — man drar till EN färg — så
  // tillståndet är en nyckel, inte en mängd. URL:en skrivs när handtaget
  // släpps, precis som prisreglagets.
  const [color, setColor] = useState(() => sp.get("farg") ?? "");
  const [urlColor, setUrlColor] = useState(() => sp.get("farg") ?? "");
  const [onlyInStock, setOnlyInStock] = useState(() => sp.get("lager") === "1");
  const [onlyOnSale, setOnlyOnSale] = useState(() => sp.get("rea") === "1");
  const [open, setOpen] = useState(false); // mobile-collapsible filter panel

  // Sync state → URL. Bygger på window.location.search så befintliga params
  // (t.ex. ?kategori på /alla-produkter) bevaras. Kör vid mount men skriver bara
  // om URL:en faktiskt skiljer sig → ingen onödig history-replace eller loop.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (sort !== defaultSort) params.set("sortera", sort); else params.delete("sortera");
    if (urlPrice) params.set("pris", urlPrice); else params.delete("pris");
    if (urlColor) params.set("farg", urlColor); else params.delete("farg");
    if (onlyInStock) params.set("lager", "1"); else params.delete("lager");
    if (onlyOnSale) params.set("rea", "1"); else params.delete("rea");
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    const current = window.location.pathname + window.location.search;
    if (url !== current) router.replace(url, { scroll: false });
  }, [sort, urlPrice, urlColor, onlyInStock, onlyOnSale, pathname, router]);

  // Prisfiltrets gränser. Handtagen filtrerar direkt (räknaren följer med under
  // draget); URL:en hinner ikapp när man släpper.
  const priceLo = bounds ? handles[0] : 0;
  const priceHi = bounds ? upperLimit(handles[1], bounds) : Infinity;
  const priceActive = Boolean(bounds && priceSlug(handles[0], handles[1], bounds));

  // Färgfacetten. Nycklarna hängs på server-side (lib/product-colors) och
  // saknas helt när Wix-nyckeln inte är satt — då blir listan tom och gruppen
  // renderas inte alls.
  const colorKeys = useMemo(() => {
    const funna = new Set<string>();
    for (const p of products) for (const k of p.colors || []) funna.add(k);
    // Minst två distinkta färger, annars är det inget att välja mellan.
    return funna.size >= 2 ? sortColorKeys([...funna]) : [];
  }, [products]);
  // Antalet räknas ur listan filtrerad på de ANDRA facetterna.
  // Drar man i prisreglaget ändras färgernas antal; väljer man en färg gör de
  // det inte. Utan siffran hade kunden fått upptäcka efter klicket att bara en
  // bråkdel av sortimentet har en färg angiven alls.
  const colorCounts = useMemo(() => {
    const antal = new Map<string, number>();
    for (const p of products) {
      if (p.priceNum < priceLo || p.priceNum >= priceHi) continue;
      if (onlyInStock && !p.inStock) continue;
      if (onlyOnSale && !p.onSale) continue;
      for (const k of p.colors || []) antal.set(k, (antal.get(k) ?? 0) + 1);
    }
    return antal;
  }, [products, priceLo, priceHi, onlyInStock, onlyOnSale]);
  // Skenans läge: 0 = alla färger, 1..n = colorKeys[i-1]. Ett enda tal, så
  // native <input type="range"> gör hela jobbet — drag, tangentbord och touch.
  const colorIdx = Math.max(0, colorKeys.indexOf(color) + 1);
  const commitColor = () => setUrlColor(color);
  const dragColor = (i: number) => setColor(i <= 0 ? "" : colorKeys[i - 1] ?? "");
  // Bandad gradient: varje färg äger en lika stor bit av banan, med hårda stopp
  // så det blir distinkta fält att sikta på — inte en utsmetad övergång där man
  // inte ser var en färg slutar. Första bandet är "alla färger".
  const railGradient = useMemo(() => {
    if (!colorKeys.length) return "";
    const band = 100 / (colorKeys.length + 1);
    const stopp = ["#EFE7DE", ...colorKeys.map((k) => colorOf(k) || "#ddd")]
      .map((c, i) => `${c} ${i * band}%, ${c} ${(i + 1) * band}%`);
    return `linear-gradient(to right, ${stopp.join(", ")})`;
  }, [colorKeys]);

  const commitPrice = () => setUrlPrice(bounds ? priceSlug(handles[0], handles[1], bounds) : "");
  const dragLo = (v: number) => setHandles(([, hi]) => [Math.min(v, hi - (bounds?.step ?? 1)), hi]);
  const dragHi = (v: number) => setHandles(([lo]) => [lo, Math.max(v, lo + (bounds?.step ?? 1))]);

  const list = useMemo(() => {
    let out = products.filter((p) => p.priceNum >= priceLo && p.priceNum < priceHi);
    if (color) out = out.filter((p) => p.colors?.includes(color));
    if (onlyInStock) out = out.filter((p) => p.inStock);
    if (onlyOnSale) out = out.filter((p) => p.onSale);
    // Dag-upplösning på "nu" så server- och klientrendering ger samma ordning
    // (sekund-precision hade gett hydration-hopp i Rekommenderat-poängen).
    const dayMs = currentDayMs();
    // Rekommenderat blandar kategorier; Populärast rankar produkter med
    // signal (egna sälj + omdömen) rakt av och blandar bara svansen (Leonard
    // 2026-08-16 resp. 2026-08-18). Omdömessignalen läses ur p.rating, som
    // serverkomponenterna hängt på via attachRatings INNAN listan når hit —
    // saknas den är signalen 0 och ordningen faller tillbaka på kategori-
    // blandning + nyhet. Ordningarna är rena funktioner i lib/sort-products —
    // där ligger också mätningarna, vikterna och testerna.
    const universal = universalCollectionIds(products);
    if (sort === "img") out = orderRecommended(out, universal, dayMs);
    else if (sort === "pop") out = orderPopular(out, universal);
    else if (sort === "new") out = [...out].sort((a, z) => (z.createdAt || 0) - (a.createdAt || 0) || String(a.id ?? "").localeCompare(String(z.id ?? "")));
    else if (sort === "price-asc") out = [...out].sort((a, z) => a.priceNum - z.priceNum);
    else if (sort === "price-desc") out = [...out].sort((a, z) => z.priceNum - a.priceNum);
    else if (sort === "name") out = [...out].sort((a, z) => a.name.localeCompare(z.name, "sv"));
    return out;
  }, [products, sort, priceLo, priceHi, color, onlyInStock, onlyOnSale]);

  // Finns det något slutsålt alls i den här listan? Styr om "I lager"-reglaget
  // är meningsfullt (se markupen nedan). Räknas ur datan, inte ur env-flaggan,
  // så det stämmer per sida: kategori = nej, sökresultat = ofta ja.
  const hasOos = useMemo(() => products.some((p) => !p.inStock), [products]);
  // En dold reglage får inte spöka i filterräknaren ("1 aktivt filter" utan att
  // något syns) om en gammal delad länk bär ?lager=1.
  const activeFilters = (priceActive ? 1 : 0) + (color ? 1 : 0) + (onlyInStock && hasOos ? 1 : 0) + (onlyOnSale ? 1 : 0);
  const reset = () => {
    if (bounds) setHandles([bounds.min, bounds.max]);
    setUrlPrice("");
    setColor("");
    setUrlColor("");
    setOnlyInStock(false);
    setOnlyOnSale(false);
  };

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
  }, [sort, urlPrice, urlColor, onlyInStock, onlyOnSale, products]);
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
          {/* Underkategorier som LÄNKAR, inte klientfilter. Kategorisidorna
              länkade tidigare bara till syskonavdelningar, aldrig till sina egna
              barn — de sidorna låg i sitemapen utan en enda intern länk. Som
              chips här får kunden en genväg och crawlern en väg in, med samma
              antal som målsidan faktiskt visar. */}
          {subs.length > 0 && (
            <div className="filter-group">
              <span className="filter-label">Förfina</span>
              <div className="subchips">
                {subs.map((sub) => (
                  <a key={sub.slug} className="subchip" href={`/kategori/${sub.slug}`}>
                    {sub.name} <span className="subchip-n">{sub.count}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {bounds && (
            <div className="filter-group">
              <span className="filter-label">Pris</span>
              {/* Två range-inputs ovanpå varandra i stället för ett bibliotek:
                  piltangenter, skärmläsare och touch fungerar direkt, och det
                  väger noll extra kB. Spåret och den ifyllda delen är rena
                  div:ar; själva inputarna är genomskinliga och släpper igenom
                  klick överallt utom på handtagen (se .pr-input i globals.css). */}
              <div className="pricerange">
                <div className="pr-track">
                  <div
                    className="pr-fill"
                    style={{
                      left: `${((handles[0] - bounds.min) / (bounds.max - bounds.min)) * 100}%`,
                      right: `${100 - ((handles[1] - bounds.min) / (bounds.max - bounds.min)) * 100}%`,
                    }}
                  />
                </div>
                <input
                  type="range"
                  className="pr-input pr-lo"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={handles[0]}
                  onChange={(e) => dragLo(Number(e.target.value))}
                  onPointerUp={commitPrice}
                  onKeyUp={commitPrice}
                  onBlur={commitPrice}
                  aria-label="Lägsta pris"
                  aria-valuetext={formatPrice(handles[0])}
                />
                <input
                  type="range"
                  className="pr-input pr-hi"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={handles[1]}
                  onChange={(e) => dragHi(Number(e.target.value))}
                  onPointerUp={commitPrice}
                  onKeyUp={commitPrice}
                  onBlur={commitPrice}
                  aria-label="Högsta pris"
                  aria-valuetext={
                    handles[1] >= bounds.max && bounds.openTop
                      ? `${formatPrice(handles[1])} och uppåt`
                      : formatPrice(handles[1])
                  }
                />
              </div>
              <span className="pr-val">
                {priceActive
                  ? priceRangeLabel(handles[0] <= bounds.min ? 0 : handles[0], upperLimit(handles[1], bounds))
                  : "Alla priser"}
              </span>
            </div>
          )}

          {colorKeys.length > 0 && (
            <div className="filter-group">
              <span className="filter-label">Färg</span>
              {/* Färgskena: dra handtaget till färgen du vill ha. Ett native
                  range-element ovanpå en bandad gradient — varje färg äger ett
                  eget fält på banan, handtaget fylls med den valda färgen, och
                  piltangenter stegar färg för färg utan en rad extra kod.
                  Längst till vänster = alla färger. */}
              <div className="colorrail">
                <div className="cr-track" style={{ background: railGradient }} />
                <input
                  type="range"
                  className="cr-input"
                  min={0}
                  max={colorKeys.length}
                  step={1}
                  value={colorIdx}
                  onChange={(e) => dragColor(Number(e.target.value))}
                  onPointerUp={commitColor}
                  onKeyUp={commitColor}
                  onBlur={commitColor}
                  aria-label="Färg"
                  aria-valuetext={color ? `${colorLabel(color)}, ${colorCounts.get(color) ?? 0} produkter` : "Alla färger"}
                  style={{ ["--cr-thumb" as string]: color ? colorOf(color) || "#ddd" : "#fff" }}
                />
              </div>
              <span className="cr-val">
                {color ? (
                  <>
                    <span className="cr-dot" style={{ background: colorOf(color) || "#ddd" }} aria-hidden="true" />
                    {colorLabel(color)}
                    <span className="cr-n">{colorCounts.get(color) ?? 0}</span>
                  </>
                ) : "Alla färger"}
              </span>
            </div>
          )}

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
