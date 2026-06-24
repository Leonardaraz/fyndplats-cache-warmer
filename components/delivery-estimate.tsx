"use client";
import { useEffect, useState } from "react";
import { DELIVERY_TIME, DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS } from "../lib/shipping";

// "Beräknad leverans 30 juni – 4 juli" på produktsidan — det proffsiga konkreta
// datumintervallet som de stora butikerna visar, i stället för bara "3–7
// arbetsdagar".
//
// VIKTIGT: datumen räknas ut i WEBBLÄSAREN (useEffect), inte på servern. PDP:n är
// statiskt ISR-cachad (revalidate 3600) och long-tail-produkter värms inte längre
// (kostnadsfix), så ett serverberäknat datum skulle frysa i cachen och visa fel
// datum dagar senare. Klientberäkning = alltid dagens faktiska datum.
//
// Hydrering: före mount (server + första klient-render) visas fallback-texten
// "Leverans 3–7 arbetsdagar" (DELIVERY_TIME) → identisk på båda sidor, ingen
// hydration-mismatch. Efter mount byts den mot datumintervallet. Det betyder också
// att crawlers/utan-JS ser den ärliga "3–7 arbetsdagar" (röd tråd + SEO bevaras).

// Lägg n arbetsdagar (mån–fre) till ett datum. Helger hoppas över; helgdagar
// hanteras inte (medvetet enkelt — intervallet är ett estimat, inte ett löfte).
function addBusinessDays(from: Date, n: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) added++; // 0 = söndag, 6 = lördag
  }
  return d;
}

function formatRange(a: Date, b: Date): string {
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    // "3–7 juli"
    const month = b.toLocaleDateString("sv-SE", { month: "long" });
    return `${a.getDate()}–${b.getDate()} ${month}`;
  }
  // "30 juni – 4 juli"
  const f = (d: Date) => d.toLocaleDateString("sv-SE", { day: "numeric", month: "long" });
  return `${f(a)} – ${f(b)}`;
}

export function DeliveryEstimate() {
  const [range, setRange] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    setRange(formatRange(addBusinessDays(now, DELIVERY_MIN_DAYS), addBusinessDays(now, DELIVERY_MAX_DAYS)));
  }, []);
  return (
    <span>
      📦{" "}
      {range ? (
        <>Beräknad leverans <b>{range}</b></>
      ) : (
        <>Leverans {DELIVERY_TIME}</>
      )}
    </span>
  );
}
