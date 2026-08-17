"use client";

import { useState } from "react";
import type { ProductReview } from "../lib/reviews";
import { ratingSummary } from "../lib/rating";
import { Stars } from "./stars";

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
  const summary = ratingSummary(count, average);

  return (
    <section className="sec revsec" id="recensioner">
      <div className="container">
        <div className="sechead">
          <div className="eyebrow">Vad kunderna säger</div>
          <h2>Kundrecensioner</h2>
        </div>

        {summary && (
          <div className="rev-summary">
            <Stars rating={summary.stars} />
            <strong>{summary.value}</strong> av 5
            <span className="rev-count"> · {summary.label}</span>
          </div>
        )}

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
