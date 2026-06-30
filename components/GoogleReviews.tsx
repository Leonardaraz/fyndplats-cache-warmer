"use client";

import { useState } from "react";
import type { GoogleReview } from "../lib/google-reviews";

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="rev-stars" aria-label={`${full} av 5 stjärnor`} title={`${full} av 5`}>
      {"★".repeat(full)}
      <span className="rev-stars-empty">{"★".repeat(5 - full)}</span>
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

export function GoogleReviews({
  reviews,
  count,
  average,
  profileUrl,
}: {
  reviews: GoogleReview[];
  count: number;
  average: number | null;
  /** Publik länk till Google-profilen (se alla / skriv omdöme). Valfri. */
  profileUrl?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  if (reviews.length === 0) return null;

  const INITIAL = 6;
  const shown = showAll ? reviews : reviews.slice(0, INITIAL);

  return (
    <section aria-labelledby="google-omdomen" style={{ marginTop: 32 }}>
      <h2 id="google-omdomen">Vad våra kunder säger på Google</h2>

      <div className="rev-summary">
        <Stars rating={average ?? 5} />
        <strong>{(average ?? 0).toFixed(1).replace(".", ",")}</strong> av 5
        <span className="rev-count">
          {" "}
          · {count} {count === 1 ? "omdöme" : "omdömen"} på Google
        </span>
      </div>

      <ul className="rev-list">
        {shown.map((r) => {
          const d = formatDate(r.date);
          return (
            <li key={r.id} className="rev-item">
              <div className="rev-item-head">
                <Stars rating={r.rating} />
                <span className="rev-author">{r.author}</span>
                {d ? <span className="rev-date">{d}</span> : null}
              </div>
              <p className="rev-text">{r.text}</p>
            </li>
          );
        })}
      </ul>

      {reviews.length > INITIAL && !showAll ? (
        <button type="button" className="rev-more" onClick={() => setShowAll(true)}>
          Visa alla {reviews.length} omdömen
        </button>
      ) : null}

      <p className="rev-disclaimer">
        Omdömena hämtas direkt från vår verifierade Google-företagsprofil och visas oredigerade
        med kundens publika namn.{" "}
        {profileUrl ? (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer">
            Se alla omdömen på Google
          </a>
        ) : null}
      </p>
    </section>
  );
}
