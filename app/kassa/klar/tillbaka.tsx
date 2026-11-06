"use client";

// Kunden kommer tillbaka från Wix (betalsidan eller dess logga). Den väntande
// betalningen ligger i sessionStorage (app/kassa/kassa.tsx): är den betald går
// kunden till tacksidan, väntar den till kassan (som visar "Din betalning
// väntar"). Utan väntande betalning, till exempel en kund i Wix egen kassa som
// tryckte på loggan, går kunden till startsidan.

import { useEffect } from "react";

const VANTAR_NYCKEL = "fp_kassa_vantar";

export function Tillbaka() {
  useEffect(() => {
    let v: { orderId?: string; betalningId?: string } | null = null;
    try {
      v = JSON.parse(sessionStorage.getItem(VANTAR_NYCKEL) || "null");
    } catch {
      v = null;
    }
    if (!v?.orderId) {
      window.location.replace("/");
      return;
    }
    const orderId = v.orderId;
    const fraga = `order=${encodeURIComponent(orderId)}${v.betalningId ? `&betalning=${encodeURIComponent(v.betalningId)}` : ""}`;
    fetch(`/api/kassa/status?${fraga}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.betald) {
          try {
            sessionStorage.removeItem(VANTAR_NYCKEL);
          } catch {
            /* tacksidan fungerar ändå */
          }
          window.location.replace(`/tack?orderId=${encodeURIComponent(orderId)}`);
        } else {
          window.location.replace("/kassa");
        }
      })
      .catch(() => window.location.replace("/kassa"));
  }, []);

  return (
    <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <p style={{ margin: 0, color: "var(--soft)" }}>Ett ögonblick …</p>
    </main>
  );
}
