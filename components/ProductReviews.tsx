"use client";

import { useState } from "react";
import type { ProductReview } from "../lib/reviews";

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="rev-stars" aria-label={`${full} av 5 stjärnor`} title={`${full} av 5`}>
      {"★".repeat(full)}
      <span className="rev-stars-empty">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export function ProductReviews({
  reviews,
  count,
  average,
}: {
  reviews: ProductReview[];
  count: number;
  average: number | null;
}) {
  const [showAll, setShowAll] = useState(false);
  if (count === 0) return null;

  const INITIAL = 5;
  const shown = showAll ? reviews : reviews.slice(0, INITIAL);

  return (
    <section className="sec revsec" id="recensioner">
      <div className="container">
        <div className="sechead">
          <div className="eyebrow">Vad kunderna säger</div>
          <h2>Kundrecensioner</h2>
        </div>

        <div className="rev-summary">
          <Stars rating={average ?? 5} />
          <strong>{(average ?? 0).toFixed(1)}</strong> av 5
          <span className="rev-count"> · {count} {count === 1 ? "recension" : "recensioner"}</span>
        </div>

        <ul className="rev-list">
          {shown.map((r) => (
            <li key={r.reviewIdAE} className="rev-item">
              <div className="rev-item-head">
                <Stars rating={r.rating} />
                <span className="rev-author">{r.displayName}</span>
                {r.date ? <span className="rev-date">{r.date.slice(0, 10)}</span> : null}
              </div>
              <p className="rev-text">{r.text}</p>
              {r.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="rev-photo" src={r.imageUrl} alt={`Kundbild från ${r.displayName || "kund"}`} loading="lazy" />
              ) : null}
            </li>
          ))}
        </ul>

        {count > INITIAL && !showAll ? (
          <button type="button" className="rev-more" onClick={() => setShowAll(true)}>
            Visa alla {count} recensioner
          </button>
        ) : null}

        <p className="rev-disclaimer">
          Omdömen om produkten, skrivna av verifierade köpare.
        </p>
      </div>
    </section>
  );
}
