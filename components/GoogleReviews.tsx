"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { GoogleReview, ReviewPhoto } from "../lib/google-reviews";
import { wixFitUrl } from "../lib/wix-media-key";

// Omdömeslistan på /omdomen. Rubriken och ingressen ligger i sidan
// (app/omdomen/page.tsx); här finns korten, knappen för fler och fotnoten.
//
// Visuell genomgång 2026-10-22: det rullande bandet med samma omdömen,
// avatarstapeln och betygsrutan är borta. Betyget står redan stort i sidans
// hero, och bandet visade samma texter som korten, avhuggna. Korten har en
// enhetlig avatar i stället för slumpade färger, och ingen 3D-lutning.

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

function reducedMotion(): boolean {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  const d = formatDate(r.date);
  const cls = `greview-card${reveal === "armed" ? " is-armed" : reveal === "show" ? " is-show" : ""}`;
  return (
    <li ref={ref} className={cls} style={{ animationDelay: `${(index % 3) * 70}ms` }}>
      <div className="greview-head">
        <span className="greview-avatar" aria-hidden="true">
          {initialOf(r.author)}
        </span>
        <span className="greview-who">
          <span className="greview-name">{r.author}</span>
          <Stars rating={r.rating} />
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
      {/* Källan och datumet längst ned, så att korten i en rad slutar i linje
          oavsett hur långa texterna är. */}
      <div className="greview-foot">
        <span className="greview-gicon" title="Omdöme från Google">
          <GoogleG size={14} />
        </span>
        <span>Google</span>
        {d ? <span className="greview-date">· {d}</span> : null}
      </div>

      {/* Portal: kortet har transform (inflygningen) och bildar därmed ett eget
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

export function GoogleReviews({
  reviews,
  profileUrl,
}: {
  reviews: GoogleReview[];
  profileUrl?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  if (reviews.length === 0) return null;

  const INITIAL = 6;
  const shown = showAll ? reviews : reviews.slice(0, INITIAL);
  const kanVisaFler = reviews.length > INITIAL && !showAll;

  return (
    <div className="greviews">
      <span className="greviews-aurora" aria-hidden="true" />

      <ul className="greviews-grid">
        {shown.map((r, i) => (
          <ReviewCard key={r.id} r={r} index={i} />
        ))}
      </ul>

      {kanVisaFler || profileUrl ? (
        <div className="greviews-actions">
          {/* "Visa alla N omdömen" stod här. Två fel i fem ord: N är antalet vi
              HÄMTAT, inte antalet på Googles profil, så "alla" var ett påstående
              om Google som vi inte kan belägga — och vid exakt ett hämtat omdöme
              stod det "1 omdömen". Knappen säger nu bara vad den gör; hela
              profilen nås via länken bredvid. */}
          {kanVisaFler ? (
            <button type="button" className="btn btn-ghost" onClick={() => setShowAll(true)}>
              Visa fler omdömen
            </button>
          ) : null}
          {profileUrl ? (
            <a className="btn-quiet" href={profileUrl} target="_blank" rel="noopener noreferrer">
              Alla omdömen på Google
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Fotnoten sa förut "hämtas direkt … och visas oredigerade med kundens
          publika namn". Kunderna visas med initialer (lib/initialer.ts), och
          en text som Google kortat av slutar vid sista hela meningen
          (lib/curated-reviews.ts). Fotnoten säger nu vad som faktiskt gäller. */}
      <p className="greviews-disclaimer">
        Kunderna visas med initialer. Har Google kortat av en text, slutar den här vid sista hela meningen.
      </p>
    </div>
  );
}
