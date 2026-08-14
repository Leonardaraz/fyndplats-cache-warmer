"use client";
// Fyndauktionens odometer: varje siffra är en rullande kolumn (som en
// avgångstavla). När `value` ändras (cron sänkte priset + router.refresh
// hämtade nytt) rullar siffrorna ner till det nya priset. Ledande kolumner
// kollapsar mjukt när priset tappar en siffra (1 029 → 999).
// prefers-reduced-motion ⇒ CSS stänger av rullningen (hopp direkt).

import { useEffect, useRef } from "react";

const GLYPHS = ["", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Delar upp `value` i kolumnvärden, vänsterutfyllt med "" till `width`. */
function toDigits(value: number, width: number): string[] {
  const s = String(Math.max(0, Math.round(value)));
  return Array(Math.max(0, width - s.length)).fill("").concat(s.split(""));
}

export function AuctionOdometer({ value, className }: { value: number; className?: string }) {
  // Kolumnbredden låstes förr till startvärdets sifferantal ("priser stiger
  // aldrig under en auktionsdag, så bredden kan bara krympa"). Stängt-läget
  // (audit 2026-08-14) bröt antagandet: värdet hoppar UPP från stale golvpris
  // till listpris — 999 → 1 019 gav fel tusentalsavskiljare ("101 9 kr").
  // Bredden får därför växa; blank-kollapsen hanterar fortfarande krympning.
  // `width` state minns historiskt max (för mjuk kollaps), render-bredden `w`
  // tar alltid med aktuellt värde så inte ens en mellanframe sätter sep fel.
  const len = String(Math.max(0, Math.round(value))).length;
  const maxWidth = useRef(len);
  useEffect(() => {
    if (len > maxWidth.current) maxWidth.current = len;
  }, [len]);
  const w = Math.max(maxWidth.current, len);
  const digits = toDigits(value, w);
  return (
    <span className={`a-odo ${className ?? ""}`} aria-label={`${Math.round(value)} kr`}>
      {digits.map((d, i) => {
        const sep = i > 0 && (w - i) % 3 === 0;
        const idx = GLYPHS.indexOf(d);
        return (
          // Nyckel = platsvärde (0 = ental), INTE arrayindex: när bredden
          // växer skulle index-nyckling flytta varje kolumns identitet ett steg
          // och rulla den till en orelaterad siffra (granskning 2026-08-14).
          <span key={w - i} style={{ display: "inline-flex" }}>
            {sep && <span className={`a-odo-sep${digits[i - 1] === "" ? " hide" : ""}`} />}
            <span className={`a-odo-col${d === "" ? " blank" : ""}`} aria-hidden="true">
              <span className="a-odo-stack" style={{ transform: `translateY(-${idx}em)` }}>
                {GLYPHS.map((g, gi) => (
                  <span key={gi}>{g}</span>
                ))}
              </span>
            </span>
          </span>
        );
      })}
      <span className="a-odo-unit">kr</span>
    </span>
  );
}
