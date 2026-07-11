"use client";
// Fyndauktionens odometer: varje siffra är en rullande kolumn (som en
// avgångstavla). När `value` ändras (cron sänkte priset + router.refresh
// hämtade nytt) rullar siffrorna ner till det nya priset. Ledande kolumner
// kollapsar mjukt när priset tappar en siffra (1 029 → 999).
// prefers-reduced-motion ⇒ CSS stänger av rullningen (hopp direkt).

import { useEffect, useRef, useState } from "react";

const GLYPHS = ["", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Delar upp `value` i kolumnvärden, vänsterutfyllt med "" till `width`. */
function toDigits(value: number, width: number): string[] {
  const s = String(Math.max(0, Math.round(value)));
  return Array(Math.max(0, width - s.length)).fill("").concat(s.split(""));
}

export function AuctionOdometer({ value, className }: { value: number; className?: string }) {
  // Kolumnbredden låses till startvärdets sifferantal (priser stiger aldrig
  // under en auktionsdag, så bredden kan bara krympa via blank-kollaps).
  const widthRef = useRef(String(Math.max(0, Math.round(value))).length);
  const [digits, setDigits] = useState(() => toDigits(value, widthRef.current));

  useEffect(() => {
    setDigits(toDigits(value, widthRef.current));
  }, [value]);

  // Tusentalsavskiljare (smalt mellanrum) efter var tredje siffra från slutet.
  const width = widthRef.current;
  return (
    <span className={`a-odo ${className ?? ""}`} aria-label={`${Math.round(value)} kr`}>
      {digits.map((d, i) => {
        const sep = i > 0 && (width - i) % 3 === 0;
        const idx = GLYPHS.indexOf(d);
        return (
          <span key={i} style={{ display: "inline-flex" }}>
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
