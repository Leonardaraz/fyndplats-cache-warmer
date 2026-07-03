"use client";

import { useEffect, useRef, useState } from "react";
import type { GoogleReview } from "../lib/google-reviews";

// Inlinad Google-G (kopplas inte till site.tsx för att hålla klient-bundlen ren).
function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden style={{ display: "block" }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function Stars({ rating, className = "greview-stars" }: { rating: number; className?: string }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={className} aria-label={`${full} av 5 stjärnor`} title={`${full} av 5`}>
      {"★".repeat(full)}
      <span className="greview-stars-empty">{"★".repeat(5 - full)}</span>
    </span>
  );
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "G";
}

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 50% 42%)`;
}

// Recensent-avatar: reviewerns riktiga Google-profilbild när den finns (max äkthet),
// annars en färgad initial-cirkel. Bryts bilden (borttagen/blockerad) → initial-fallback.
// Samma className som tidigare span → ärver storlek/rundning/stapel-överlapp från CSS.
function Avatar({ r, className }: { r: GoogleReview; className: string }) {
  const [broken, setBroken] = useState(false);
  if (r.photo && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={className}
        src={r.photo}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        style={{ objectFit: "cover" }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className={className} style={{ background: avatarColor(r.author) }} aria-hidden="true">
      {initialOf(r.author)}
    </span>
  );
}

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!t) return null;
  try {
    return new Date(t).toLocaleDateString("sv-SE", { year: "numeric", month: "long" });
  } catch {
    return iso.slice(0, 10);
  }
}

function shortQuote(t: string): string {
  const s = t.trim();
  return s.length > 60 ? `${s.slice(0, 58).trimEnd()}…` : s;
}

function reducedMotion(): boolean {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function fineHover(): boolean {
  return typeof matchMedia !== "undefined" && matchMedia("(hover: hover) and (pointer: fine)").matches;
}

// Räknar upp 0 → target när komponenten mountar (SSR/no-JS/reduced → target direkt).
function useCountUp(target: number, durationMs = 1500): number {
  const [v, setV] = useState<number | null>(null);
  useEffect(() => {
    if (reducedMotion()) {
      setV(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const e = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target * e));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return v ?? target;
}

function ReviewCard({ r, index }: { r: GoogleReview; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const [reveal, setReveal] = useState<"init" | "armed" | "show">("init");

  // Scroll-reveal: ovanför vikningen = synligt direkt; under = "armed" → tonar in
  // när det scrollas in. SSR/no-JS/reduced-motion → stannar synligt (init).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || typeof IntersectionObserver === "undefined") return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return; // redan i vy → init (synligt)
    setReveal("armed");
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setReveal("show");
            obs.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 3D-tilt mot muspekaren (bara på dator med riktig hover/pointer).
  useEffect(() => {
    const el = ref.current;
    if (!el || !fineHover() || reducedMotion()) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${(-py * 6).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(px * 7).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  const d = formatDate(r.date);
  const cls = `greview-card greview-tilt${reveal === "armed" ? " is-armed" : reveal === "show" ? " is-show" : ""}`;
  return (
    <li ref={ref} className={cls} style={{ animationDelay: `${(index % 3) * 70}ms` }}>
      <div className="greview-head">
        <Avatar r={r} className="greview-avatar" />
        <span className="greview-who">
          <span className="greview-name">{r.author}</span>
          <span className="greview-meta">
            <Stars rating={r.rating} />
            {d ? <span className="greview-date">· {d}</span> : null}
          </span>
        </span>
        <span className="greview-gicon" title="Omdöme från Google">
          <GoogleG size={17} />
        </span>
      </div>
      <p className="greview-text">{r.text}</p>
    </li>
  );
}

function Marquee({ reviews }: { reviews: GoogleReview[] }) {
  const items = reviews.filter((r) => r.text.length <= 120).slice(0, 12);
  if (items.length < 4) return null;
  const loop = [...items, ...items];
  return (
    <div className="greviews-marquee" aria-hidden="true">
      <div className="greviews-track">
        {loop.map((r, i) => (
          <span className="greviews-chip" key={i}>
            <Avatar r={r} className="greviews-chipav" />
            <span className="greviews-chipname">{r.author}</span>
            <span className="greviews-chipstars">{"★".repeat(Math.round(r.rating))}</span>
            <span className="greviews-chipquote">{shortQuote(r.text)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function GoogleReviews({
  reviews,
  count,
  average,
  profileUrl,
}: {
  reviews: GoogleReview[];
  count: number;
  average: number | null;
  profileUrl?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const shownCount = useCountUp(count);
  if (reviews.length === 0) return null;

  const INITIAL = 6;
  const shown = showAll ? reviews : reviews.slice(0, INITIAL);
  const avg = (average ?? 0).toFixed(1).replace(".", ",");
  const stack = reviews.slice(0, 6);

  return (
    <section className="greviews" aria-labelledby="google-omdomen">
      <span className="greviews-aurora" aria-hidden="true" />

      <Marquee reviews={reviews} />

      <div className="greviews-topproof">
        <span className="greviews-stack" aria-hidden="true">
          {stack.map((r) => (
            <Avatar key={r.id} r={r} className="greviews-stackav" />
          ))}
        </span>
        <div className="greviews-summary">
          <span className="greviews-badge">
            <GoogleG size={18} /> Google
          </span>
          <Stars rating={average ?? 5} />
          <strong className="greviews-avg">{avg}</strong>
          <span className="greviews-count">
            · <span className="greviews-count-num">{shownCount}</span> omdömen
          </span>
          <span className="greviews-verified">Verifierade</span>
        </div>
      </div>

      <h2 id="google-omdomen" className="greviews-title">
        Vad våra kunder säger
      </h2>

      <ul className="greviews-grid">
        {shown.map((r, i) => (
          <ReviewCard key={r.id} r={r} index={i} />
        ))}
      </ul>

      {reviews.length > INITIAL && !showAll ? (
        <div className="greviews-actions">
          <button type="button" className="greviews-more" onClick={() => setShowAll(true)}>
            Visa alla {reviews.length} omdömen
          </button>
        </div>
      ) : null}

      <p className="greviews-disclaimer">
        Omdömena hämtas direkt från vår verifierade Google-företagsprofil och visas oredigerade med
        kundens publika namn.{" "}
        {profileUrl ? (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer">
            Se alla omdömen på Google →
          </a>
        ) : null}
      </p>
    </section>
  );
}
