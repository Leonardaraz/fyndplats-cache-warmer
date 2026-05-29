"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Ctx = {
  ids: Set<string>;
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  open: boolean;
  setOpen: (b: boolean) => void;
};
const C = createContext<Ctx | null>(null);
const KEY = "fp_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(new Set(JSON.parse(raw) as string[]));
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify([...ids])); } catch {}
  }, [ids, hydrated]);

  const has = useCallback((s: string) => ids.has(s), [ids]);
  const toggle = useCallback((s: string) => {
    setIds((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s); else n.add(s);
      return n;
    });
  }, []);

  const value = useMemo(() => ({ ids, count: ids.size, has, toggle, open, setOpen }), [ids, has, toggle, open]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useWishlist() {
  const c = useContext(C);
  if (!c) throw new Error("useWishlist must be used within WishlistProvider");
  return c;
}

export function WishlistHeart({ slug }: { slug: string }) {
  const { has, toggle } = useWishlist();
  const on = has(slug);
  return (
    <button
      type="button"
      className={`wl-heart ${on ? "on" : ""}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); }}
      aria-label={on ? "Ta bort från favoriter" : "Lägg till i favoriter"}
      aria-pressed={on}
      title={on ? "Ta bort från favoriter" : "Lägg till i favoriter"}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

export function WishlistButton() {
  const { count, setOpen } = useWishlist();
  return (
    <button className="wl-btn" onClick={() => setOpen(true)} aria-label={`Öppna favoriter, ${count} produkter`}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {count > 0 && <span className="wl-count">{count}</span>}
    </button>
  );
}

export function WishlistDrawer() {
  const { ids, count, open, setOpen, toggle } = useWishlist();
  const list = [...ids];
  return (
    <>
      <div className={`drawer-ov ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`drawer wl-drawer ${open ? "show" : ""}`} aria-hidden={!open} inert={!open}>
        <div className="drawer-head">
          <strong>Mina favoriter ({count})</strong>
          <button className="drawer-x" onClick={() => setOpen(false)} aria-label="Stäng">✕</button>
        </div>
        <div className="drawer-body">
          {list.length === 0 ? (
            <p className="empty">Inga favoriter än. Klicka på hjärtat på produkter du gillar för att spara dem här.</p>
          ) : (
            list.map((slug) => (
              <div className="wl-item" key={slug}>
                <a href={`/produkt/${slug}`} onClick={() => setOpen(false)} className="wl-link">{slug.replace(/-/g, " ")}</a>
                <button className="li-x" onClick={() => toggle(slug)} aria-label="Ta bort">Ta bort</button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
