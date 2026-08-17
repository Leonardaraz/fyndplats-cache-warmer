"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  // Förstorad kundbild. null = stängd. Samma mönster som galleriets lightbox:
  // portal, Escape stänger, bakgrundsscroll låses.
  const [photo, setPhoto] = useState<{ url: string; alt: string } | null>(null);
  const close = useCallback(() => setPhoto(null), []);

  useEffect(() => {
    if (!photo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [photo, close]);

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
            <Stars rating={summary.exact} />
            <strong>{summary.value}</strong> av 5
            <span className="rev-count"> · {summary.label}</span>
          </div>
        )}

        <ul className="rev-list">
          {shown.map((r) => {
            const alt = `Kundbild från ${r.displayName || "kund"}`;
            return (
              <li key={r.reviewIdAE} className="rev-item">
                <div className="rev-item-head">
                  <Stars rating={r.rating} />
                  <span className="rev-author">{r.displayName}</span>
                  {r.date ? <span className="rev-date">{r.date.slice(0, 10)}</span> : null}
                </div>
                <p className="rev-text">{r.text}</p>
                {r.imageUrl ? (
                  // <button> och inte <img onClick>: tangentbord och skärmläsare
                  // behöver veta att bilden går att öppna.
                  <button
                    type="button"
                    className="rev-photo-btn"
                    onClick={() => setPhoto({ url: r.imageUrl as string, alt })}
                    aria-label={`${alt} – visa större`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="rev-photo" src={r.imageUrl} alt={alt} loading="lazy" />
                  </button>
                ) : null}
              </li>
            );
          })}
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

      {/* Portal: revsec ligger i ett stacking-context, och utan portal skulle
          overlayen fångas där i stället för att täcka sidan. */}
      {photo && typeof document !== "undefined"
        ? createPortal(
            <div
              className="lightbox rev-lightbox"
              onClick={close}
              role="dialog"
              aria-modal="true"
              aria-label={photo.alt}
            >
              <button type="button" className="rev-lb-close" onClick={close} aria-label="Stäng">
                ×
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="rev-lb-img"
                src={photo.url}
                alt={photo.alt}
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
