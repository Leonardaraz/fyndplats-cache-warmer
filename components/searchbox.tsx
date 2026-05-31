"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Hit = { n: string; s: string; i: string; p: string };

// Module-level cache so the header + mobile SearchBox share ONE fetch of the index.
let cache: Hit[] | null = null;
let inflight: Promise<Hit[]> | null = null;
function loadIndex(): Promise<Hit[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/search-index")
      .then((r) => r.json())
      .then((d: Hit[]) => { cache = d; return d; })
      .catch(() => [] as Hit[]);
  }
  return inflight;
}

export function SearchBox({ onNavigate }: { onNavigate?: () => void } = {}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onType = async (val: string) => {
    setQ(val);
    setActive(-1);
    const term = val.trim().toLowerCase();
    if (!term) { setHits([]); setOpen(false); return; }
    const idx = await loadIndex();
    setHits(idx.filter((h) => h.n.toLowerCase().includes(term)).slice(0, 6));
    setOpen(true);
  };

  // onNavigate stänger ev. förälder (mobilmenyn) när vi navigerar bort.
  const goProduct = (slug: string) => { setOpen(false); setQ(""); onNavigate?.(); router.push(`/produkt/${slug}`); };
  const goSearch = () => {
    const t = q.trim();
    if (!t) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/sok?q=${encodeURIComponent(t)}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (open && active >= 0 && hits[active]) goProduct(hits[active].s);
    else goSearch();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || hits.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  // Bold the matched substring in a suggestion's name.
  const highlight = (name: string) => {
    const term = q.trim();
    const i = term ? name.toLowerCase().indexOf(term.toLowerCase()) : -1;
    if (i < 0) return name;
    return (<>{name.slice(0, i)}<b>{name.slice(i, i + term.length)}</b>{name.slice(i + term.length)}</>);
  };

  return (
    <div className="searchwrap" ref={wrapRef}>
      {/* action+method+name ger progressiv förbättring: utan JS submittar Enter
          en GET till /sok?q=… (server-renderad sökresultatsida). Med JS kör
          onSubmit (preventDefault) client-side routing istället. */}
      <form className="search" onSubmit={onSubmit} role="search" action="/sok" method="get">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          name="q"
          value={q}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => { loadIndex(); if (hits.length) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder="Sök efter produkter…"
          aria-label="Sök efter produkter"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions"
        />
      </form>

      {open && (hits.length > 0 || q.trim()) && (
        <div className="sugg" id="search-suggestions" role="listbox">
          {hits.map((h, i) => (
            <a
              key={h.s}
              href={`/produkt/${h.s}`}
              className={`sugg-item ${i === active ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); goProduct(h.s); }}
              onMouseEnter={() => setActive(i)}
              role="option"
              aria-selected={i === active}
            >
              <span className="sugg-img">
                {h.i && <Image src={h.i} alt="" fill sizes="46px" style={{ objectFit: "cover" }} />}
              </span>
              <span className="sugg-name">{highlight(h.n)}</span>
              {h.p && <span className="sugg-price">{h.p}</span>}
            </a>
          ))}
          {hits.length > 0 ? (
            <button type="button" className="sugg-all" onClick={goSearch}>
              Visa alla resultat för “{q.trim()}” →
            </button>
          ) : (
            <div className="sugg-empty">Inga produkter matchade “{q.trim()}”.</div>
          )}
        </div>
      )}
    </div>
  );
}
