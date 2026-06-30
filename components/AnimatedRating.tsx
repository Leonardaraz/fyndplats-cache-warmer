"use client";

import { useEffect, useState } from "react";

// Stort betyg på /omdomen som räknar upp (0 → 4,9) när sidan laddas (betyget är
// ovanför vikningen). Den parallella CSS-pop-in:en (opacity) maskerar starten.
// Tillgänglighetssäkert: prefers-reduced-motion ELLER ingen JS → slutvärdet visas
// direkt (val=null → renderar `rating`); CSS-animationen är också av under reduce.
export function AnimatedRating({ rating, max = 5 }: { rating: number; max?: number }) {
  const [val, setVal] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce =
      typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDone(true);
      return; // lämna null → visar slutvärdet
    }
    let raf = 0;
    const start = performance.now();
    const dur = 2400; // lugn, "premium-dramatisk" uppräkning
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart — dröjer fint på slutet
      setVal(Number((rating * eased).toFixed(2)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setVal(rating);
        setDone(true); // → stjärn-pop när siffran landar
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rating]);

  const shown = (val ?? rating).toFixed(1).replace(".", ",");

  return (
    <>
      <div className={`ratingbig${done ? " is-landed" : ""}`}>{shown}</div>
      <div className={`ratingstars${done ? " is-done" : ""}`} aria-hidden="true">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className="rstar" style={{ animationDelay: `${120 + i * 95}ms` }}>
            ★
          </span>
        ))}
      </div>
    </>
  );
}
