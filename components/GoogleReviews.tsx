"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { GoogleReview, ReviewPhoto } from "../lib/google-reviews";
import { wixFitUrl } from "../lib/wix-media-key";

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

function ReviewCard({ r, index }: { r: GoogleReview; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const [reveal, setReveal] = useState<"init" | "armed" | "show">("init");
  // Andra lagret under adresserna i curated-reviews.ts. En bild som ändå
  // faller — filen borttagen ur Media Manager, CDN nere — ska försvinna, inte
  // bli en tom ruta med brusten-bild-ikon. Det var precis den symptombilden
  // som gjorde produktrecensionernas trasiga bilder svåra att upptäcka
  // (2026-08-22): de renderades, de bara visade ingenting.
  const [trasiga, setTrasiga] = useState<ReadonlySet<string>>(() => new Set());
  const photos = (r.photos ?? []).slice(0, 3).filter((p) => !trasiga.has(p.src));
  // Förstorad kundbild. null = stängd. Samma mönster som produktrecensionernas
  // lightbox (components/ProductReviews.tsx): portal, Escape stänger,
  // bakgrundsscroll låses, klick utanför bilden stänger.
  //
  // Tillståndet bor i KORTET och inte i listan. Bara ett kort kan vara öppet
  // åt gången ändå — det krävs ett klick för att öppna — och alternativet vore
  // att skicka en öppna-funktion genom varje kort utan att vinna något.
  const [stor, setStor] = useState<ReviewPhoto | null>(null);
  const stang = useCallback(() => setStor(null), []);

  useEffect(() => {
    if (!stor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stang();
    };
    window.addEventListener("keydown", onKey);
    const forra = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = forra;
    };
  }, [stor, stang]);

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
        <span className="greview-avatar" style={{ background: avatarColor(r.author) }} aria-hidden="true">
          {initialOf(r.author)}
        </span>
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
      {/* Kundens egna bilder från omdömet. Bevis, inte galleri — en lugn remsa
          som visar att någon faktiskt fått hem varan och tyckt om den.
          Max tre: fler gör kortet till en bildvägg och drar blicken från texten,
          som är det som faktiskt övertygar.
          <Image> går genom projektets egen loader (lib/image-loader): Wix-bilder
          får en skalad transform med srcset, lokala /public-sökvägar serveras
          orörda. object-fit:cover i CSS gör rutan kvadratisk oavsett källformat. */}
      {photos.length > 0 ? (
        <figure className="greview-photos">
          <div className="greview-photostrip">
            {photos.map((p, i) => (
              <button
                key={p.src}
                type="button"
                className="greview-photo-btn"
                onClick={() => setStor(p)}
                aria-label={
                  photos.length > 1
                    ? `${p.alt} – bild ${i + 1} av ${photos.length}, visa större`
                    : `${p.alt} – visa större`
                }
              >
                <Image
                  className="greview-photo"
                  src={p.src}
                  alt={p.alt}
                  width={84}
                  height={84}
                  loading="lazy"
                  onError={() =>
                    setTrasiga((f) => (f.has(p.src) ? f : new Set(f).add(p.src)))
                  }
                />
              </button>
            ))}
          </div>
          <figcaption className="greview-photonote">
            {photos.length === 1 ? "Kundens egen bild" : "Kundens egna bilder"}
          </figcaption>
        </figure>
      ) : null}

      {/* Portal: kortet har transform (3D-tilten) och bildar därmed ett eget
          stacking- och containing-block. En position:fixed-overlay här inne
          hade ramats in av kortet i stället för att täcka sidan. */}
      {stor && typeof document !== "undefined"
        ? createPortal(
            <div
              className="lightbox rev-lightbox"
              onClick={stang}
              role="dialog"
              aria-modal="true"
              aria-label={stor.alt}
            >
              <button type="button" className="rev-lb-close" onClick={stang} aria-label="Stäng">
                ×
              </button>
              {/* Rå <img> och inte <Image>: adressen är redan exakt den vi vill
                  ha (wixFitUrl bygger den oskurna storversionen), och den visas
                  en i taget på klick — det finns ingen srcset att vinna.
                  Produktrecensionernas lightbox gör likadant. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="rev-lb-img"
                src={wixFitUrl(stor.src)}
                alt={stor.alt}
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
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
            <span className="greviews-chipav" style={{ background: avatarColor(r.author) }}>
              {initialOf(r.author)}
            </span>
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
  average,
  profileUrl,
}: {
  reviews: GoogleReview[];
  average: number | null;
  profileUrl?: string;
}) {
  const [showAll, setShowAll] = useState(false);
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
            <span className="greviews-stackav" key={r.id} style={{ background: avatarColor(r.author) }}>
              {initialOf(r.author)}
            </span>
          ))}
        </span>
        <div className="greviews-summary">
          <span className="greviews-badge">
            <GoogleG size={18} /> Google
          </span>
          {/* Saknas snittet ritas noll fyllda stjärnor, inte fem. Den gamla
              `average ?? 5` hittade på toppbetyg när datan uteblev — samma
              fälla som ratingSummary() redan stängt på produktsidan. */}
          <Stars rating={average ?? 0} />
          <strong className="greviews-avg">{avg}</strong>
          <span className="greviews-verified">Publika på Google</span>
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
