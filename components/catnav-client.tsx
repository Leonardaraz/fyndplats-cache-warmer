"use client";
import { useEffect, useRef, useState } from "react";

export type Chip = { id: string; name: string; slug: string; count: number };

// Klient-skalet runt kategori-raden:
//  • Svepbar rad med ‹ ›-pilar på desktop (mus kan inte svepa, scrollbaren är
//    dold). Pilarna göms vid kanterna och på mobil (touch räcker). På mobil
//    visas i stället en kant-fade som hintar att raden går att svepa.
//  • Auto-centrerar aktiv kategori vid laddning.
//  • Tvånivå: tryck på en kategori med relaterade kategorier → de fälls ut som
//    en andra rad (utan att navigera). "Alla i {namn}" leder till kategorisidan.
//    Aktiv kategori är utfälld från start.
export function CatNavClient({ chips, subMap, totalProducts, activeSlug }: {
  chips: Chip[];
  subMap: Record<string, Chip[]>;
  totalProducts: number;
  activeSlug?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const activeId = chips.find((c) => c.slug === activeSlug)?.id ?? null;
  const [openId, setOpenId] = useState<string | null>(activeId && subMap[activeId]?.length ? activeId : null);

  const sync = () => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>(".catchip.active");
    if (active) {
      const elRect = el.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      el.scrollLeft += aRect.left - elRect.left - (el.clientWidth - aRect.width) / 2;
    }
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const openChip = openId ? chips.find((c) => c.id === openId) : undefined;
  const subs = openId ? subMap[openId] || [] : [];

  return (
    <div className="catnav">
      <div className={`catnav-scroller ${!atStart ? "fl" : ""} ${!atEnd ? "fr" : ""}`}>
        <button
          type="button"
          className={`catnav-arrow left ${atStart ? "off" : ""}`}
          aria-label="Visa föregående kategorier"
          tabIndex={atStart ? -1 : 0}
          onClick={() => nudge(-1)}
        >
          ‹
        </button>
        <div className="catnav-main" ref={ref} role="navigation" aria-label="Kategorier">
          <a className={`catchip ${!activeSlug ? "active" : ""}`} href="/butik">
            Alla
            <span className="cc-count">{totalProducts}</span>
          </a>
          {chips.map((c) => {
            const hasSubs = Boolean(subMap[c.id]?.length);
            return (
              <a
                key={c.id}
                href={`/kategori/${c.slug}`}
                className={`catchip ${activeSlug === c.slug ? "active" : ""} ${openId === c.id ? "open" : ""}`}
                aria-expanded={hasSubs ? openId === c.id : undefined}
                onClick={(e) => {
                  if (hasSubs) {
                    e.preventDefault();
                    setOpenId((cur) => (cur === c.id ? null : c.id));
                  }
                }}
              >
                {c.name}
                <span className="cc-count">{c.count}</span>
                {hasSubs && <span className="cc-caret" aria-hidden="true">⌄</span>}
              </a>
            );
          })}
        </div>
        <button
          type="button"
          className={`catnav-arrow right ${atEnd ? "off" : ""}`}
          aria-label="Visa fler kategorier"
          tabIndex={atEnd ? -1 : 0}
          onClick={() => nudge(1)}
        >
          ›
        </button>
      </div>

      {openChip && subs.length > 0 && (
        <div className="catnav-sub" role="navigation" aria-label={`Relaterat i ${openChip.name}`}>
          <a className="catchip sub lead" href={`/kategori/${openChip.slug}`}>
            Alla i {openChip.name} →
          </a>
          {subs.map((s) => (
            <a key={s.id} className="catchip sub" href={`/kategori/${s.slug}`}>
              {s.name}
              <span className="cc-count">{s.count}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
