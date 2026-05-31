"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { SHIMMER_BLUR } from "../lib/lqip";

export function Gallery({
  images,
  alt,
  mainBlur,
  active: activeProp,
  onActiveChange,
}: {
  images: string[];
  alt: string;
  mainBlur?: string;
  active?: number;
  onActiveChange?: (i: number) => void;
}) {
  const imgs = images.filter(Boolean);
  const [activeInternal, setActiveInternal] = useState(0);
  const controlled = activeProp !== undefined;
  const active = controlled ? activeProp! : activeInternal;

  const setActive = useCallback(
    (v: number | ((a: number) => number)) => {
      const cur = controlled ? activeProp! : activeInternal;
      const next = typeof v === "function" ? (v as (a: number) => number)(cur) : v;
      if (onActiveChange) onActiveChange(next);
      if (!controlled) setActiveInternal(next);
    },
    [controlled, activeProp, activeInternal, onActiveChange]
  );

  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const main = imgs[active] || imgs[0] || "";

  const go = useCallback((dir: number) => {
    setZoom(false);
    setActive((a) => (a + dir + imgs.length) % imgs.length);
  }, [imgs.length, setActive]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [lightbox, go]);

  const onStageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
    setZoom((z) => !z);
  };

  return (
    <div className="gallery">
      <button type="button" className="gmain" onClick={() => { setZoom(false); setLightbox(true); }} aria-label="Förstora bilden">
        {main && <Image key={main} src={main} alt={alt} width={800} height={800} preload fetchPriority="high" placeholder="blur" blurDataURL={mainBlur || SHIMMER_BLUR} sizes="(max-width:760px) 100vw, 45vw" />}
        <span className="gmain-zoom" aria-hidden>⤢</span>
      </button>

      {imgs.length > 1 && (
        <div className="gthumbs" role="tablist" aria-label="Fler produktbilder">
          {imgs.slice(0, 8).map((g, i) => (
            <button
              type="button"
              key={g + i}
              className={`gthumb ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
              aria-label={`Visa bild ${i + 1} av ${Math.min(imgs.length, 8)}`}
            >
              <Image src={g} alt="" fill placeholder="blur" blurDataURL={SHIMMER_BLUR} sizes="76px" style={{ objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(false)} role="dialog" aria-modal="true" aria-label={alt}>
          <button className="lb-close" onClick={() => setLightbox(false)} aria-label="Stäng">✕</button>
          {imgs.length > 1 && (
            <button className="lb-nav lb-prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Föregående bild">‹</button>
          )}
          <div className={`lb-stage ${zoom ? "zoomed" : ""}`} onClick={onStageClick}>
            <div className="lb-imgwrap" style={{ transform: zoom ? "scale(2.2)" : "scale(1)", transformOrigin: origin }}>
              <Image key={main} src={main} alt={alt} fill sizes="92vw" style={{ objectFit: "contain" }} preload />
            </div>
          </div>
          {imgs.length > 1 && (
            <button className="lb-nav lb-next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Nästa bild">›</button>
          )}
          {imgs.length > 1 && <div className="lb-count">{active + 1} / {imgs.length}</div>}
        </div>
      )}
    </div>
  );
}
