"use client";

import { useState } from "react";
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

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="greview-stars" aria-label={`${full} av 5 stjärnor`} title={`${full} av 5`}>
      {"★".repeat(full)}
      <span className="greview-stars-empty">{"★".repeat(5 - full)}</span>
    </span>
  );
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "G";
}

// Deterministisk, behaglig avatarfärg per namn (samma namn → samma färg).
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

function ReviewCard({ r, index }: { r: GoogleReview; index: number }) {
  const d = formatDate(r.date);
  // CSS-keyframe-entré (greviewIn) körs vid mount → kaskad både vid sidladdning
  // och när "Visa alla" fäller ut resten. Stagger per position (återställs per rad).
  return (
    <li className="greview-card" style={{ animationDelay: `${(index % 6) * 75}ms` }}>
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
    </li>
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
  if (reviews.length === 0) return null;

  const INITIAL = 6;
  const shown = showAll ? reviews : reviews.slice(0, INITIAL);
  const avg = (average ?? 0).toFixed(1).replace(".", ",");

  return (
    <section className="greviews" aria-labelledby="google-omdomen">
      <div className="greviews-summary">
        <span className="greviews-badge">
          <GoogleG size={18} /> Google
        </span>
        <Stars rating={average ?? 5} />
        <strong className="greviews-avg">{avg}</strong>
        <span className="greviews-count">· {count} omdömen</span>
        <span className="greviews-verified">Verifierade</span>
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
