"use client";
import { useEffect, useState } from "react";

// "Senast tittade" — localStorage-spårning + widget.
//
// När en PDP laddas anropas <RecentlyViewedTracker/> som lägger produkten först
// i en FIFO-array (max 10) i localStorage["fp_recently_viewed"]. <RecentlyViewed/>
// läser samma array och visar en horisontell rad med kort. Widgeten döljs om
// färre än 2 produkter återstår (efter ev. exkludering av den aktuella PDP:n).

const STORAGE_KEY = "fp_recently_viewed";
const MAX_ITEMS = 10;
const CHANGE_EVENT = "fp-recently-viewed-change";

export type RecentItem = {
  productId: string;
  slug: string;
  thumbnailUrl: string;
  name: string;
  price: string;
  viewedAt: number;
};

function read(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as RecentItem[]).filter((x) => x && x.slug && x.productId) : [];
  } catch {
    return [];
  }
}

function write(items: RecentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {}
}

// Skala Wix-CDN-bilden till en liten center-cropped webp (samma mekanism som
// PDP:ns variant-thumbs) så widgeten inte drar ned full-res hjältebilder.
function thumb(url: string): string {
  const m = (url || "").match(/static\.wixstatic\.com\/media\/([^/]+)/);
  if (!m) return url || "";
  return `https://static.wixstatic.com/media/${m[1]}/v1/fill/w_200,h_200,al_c,q_80/file.webp`;
}

/** Spårnings-komponent: registrerar ett PDP-besök. Renderar inget. */
export function RecentlyViewedTracker(props: {
  productId: string;
  slug: string;
  name: string;
  price: string;
  image: string;
}) {
  const { productId, slug, name, price, image } = props;
  useEffect(() => {
    if (!productId || !slug) return;
    const next: RecentItem = {
      productId,
      slug,
      name,
      price,
      thumbnailUrl: thumb(image),
      viewedAt: Date.now(),
    };
    const existing = read().filter((x) => x.slug !== slug && x.productId !== productId);
    write([next, ...existing]);
  }, [productId, slug, name, price, image]);
  return null;
}

/**
 * Display-widget. `excludeSlug` döljer den aktuella PDP-produkten (så den inte
 * listar sig själv). Widgeten renderar inget förrän >= 2 produkter återstår.
 * `variant="drawer"` ger den kompakta layouten i varukorgs-drawern.
 */
export function RecentlyViewed({
  title = "Senast tittade",
  excludeSlug,
  variant = "section",
  onNavigate,
}: {
  title?: string;
  excludeSlug?: string;
  variant?: "section" | "drawer";
  onNavigate?: () => void;
}) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    const load = () => {
      const list = read().filter((x) => x.slug !== excludeSlug);
      setItems(list);
    };
    load();
    window.addEventListener(CHANGE_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(CHANGE_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, [excludeSlug]);

  // Hide om < 2 produkter (täcker även "aktuella PDP === senaste" via excludeSlug).
  if (items.length < 2) return null;

  if (variant === "drawer") {
    return (
      <div className="rv-drawer">
        <div className="rv-drawer-head">{title}</div>
        <div className="rv-drawer-list">
          {items.slice(0, 6).map((it) => (
            <a className="rv-drawer-item" key={it.slug} href={`/produkt/${it.slug}`} onClick={onNavigate}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.thumbnailUrl ? <img className="rv-drawer-img" src={it.thumbnailUrl} alt={it.name} loading="lazy" /> : <span className="rv-drawer-img" />}
              <span className="rv-drawer-info">
                <span className="rv-drawer-name">{it.name}</span>
                <span className="rv-drawer-price">{it.price}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="sec rv-sec">
      <div className="container">
        <div className="sechead">
          <div className="eyebrow">Du var nyss här</div>
          <h2>{title}</h2>
        </div>
        <div className="rv-row">
          {items.map((it) => (
            <a className="rv-card" key={it.slug} href={`/produkt/${it.slug}`} onClick={onNavigate}>
              <span className="rv-card-imgwrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {it.thumbnailUrl ? <img className="rv-card-img" src={it.thumbnailUrl} alt={it.name} loading="lazy" /> : <span className="rv-card-img" />}
              </span>
              <span className="rv-card-name">{it.name}</span>
              <span className="rv-card-price">{it.price}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
