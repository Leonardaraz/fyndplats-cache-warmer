"use client";
import { useEffect, useState } from "react";
import { DELIVERY_TIME, DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS } from "../lib/shipping";
import { leveransIntervall } from "../lib/leveransdatum";

// "Beräknad leverans 30 juni – 4 juli" på produktsidan — det proffsiga konkreta
// datumintervallet som de stora butikerna visar, i stället för bara "3–6
// arbetsdagar".
//
// VIKTIGT: datumen räknas ut i WEBBLÄSAREN (useEffect), inte på servern. PDP:n är
// statiskt ISR-cachad (revalidate 3600) och long-tail-produkter värms inte längre
// (kostnadsfix), så ett serverberäknat datum skulle frysa i cachen och visa fel
// datum dagar senare. Klientberäkning = alltid dagens faktiska datum.
//
// Hydrering: före mount (server + första klient-render) visar callouten fallback
// "Beräknad leverans 3–6 arbetsdagar" (DELIVERY_TIME) → identisk på båda sidor,
// ingen hydration-mismatch. Efter mount byts duration:en mot datumintervallet. Det
// betyder också att crawlers/utan-JS ser den ärliga "3–6 arbetsdagar" (röd tråd +
// SEO bevaras). Rutan har stabil höjd → inget layout-hopp vid bytet.

// Datumen räknas i lib/leveransdatum.ts, som varukorgen (components/cart.tsx)
// också använder — samma intervall på båda ställena.

/**
 * `showStock`: prefixar etikettraden med "✓ I lager · " (grönt, fetstilt).
 * Lagerstatus + leveransestimat är samma sak för kunden (uppfyllnad) och bor
 * därför i SAMMA box — den fristående lager-pillen under priset såg övergiven
 * ut på egen rad (Leonards feedback 2026-08-04). Skickas variant-nivåns
 * buyable (inte produkt-nivåns inStock) så en slutsåld variant aldrig visar
 * "✓ I lager" bredvid en "Slut i denna variant"-banner.
 */
export function DeliveryEstimate({ showStock = false }: { showStock?: boolean }) {
  const [range, setRange] = useState<string | null>(null);
  useEffect(() => {
    setRange(leveransIntervall(new Date(), DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS));
  }, []);
  return (
    <div className="delivery-callout" role="status">
      <svg className="delivery-callout-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="7" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="17.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" />
      </svg>
      <span className="delivery-callout-text">
        <span>
          {showStock && <span className="delivery-callout-stock">✓ I lager · </span>}
          Beräknad leverans
        </span>
        <strong>{range || DELIVERY_TIME}</strong>
      </span>
    </div>
  );
}
