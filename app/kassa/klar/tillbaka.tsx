"use client";

// Kunden kommer tillbaka till oss efter betalningen.
//
//   • Från Klarna via Stripe (/api/kassa/stripe/retur skickar hit med
//     ?avsikt=pi_…): servern gör ordern (/api/kassa/stripe/klar), och kunden
//     går till tacksidan. Blev det ingen order går kunden till kassan, som
//     säger varför (?stripe=<kod>).
//   • Från Wix (betalsidan eller dess logga): den väntande betalningen ligger i
//     sessionStorage (app/kassa/kassa.tsx). Är den betald går kunden till
//     tacksidan, väntar den till kassan (som visar "Din betalning väntar"). Utan
//     väntande betalning, till exempel en kund i Wix egen kassa som tryckte på
//     loggan, går kunden till startsidan.

import { useEffect, useState } from "react";
import Link from "next/link";
import { STRIPE_NYCKEL, klarBeslut, tillbakaKod } from "../../../lib/kassa/stripe-klient";
import s from "../kassa.module.css";

const VANTAR_NYCKEL = "fp_kassa_vantar";
const AVSIKT = /^pi_[A-Za-z0-9]+$/;
/** Så länge sidan frågar efter ordern innan den säger att mejlet kommer. */
const VANTA_MS = 60_000;

const glom = (nyckel: string, lagring: "local" | "session") => {
  try {
    (lagring === "local" ? localStorage : sessionStorage).removeItem(nyckel);
  } catch {
    /* tacksidan fungerar ändå */
  }
};

/** Klarnas retur: frågar servern tills ordern finns, eller tills det är klart att den inte blir någon. */
async function slutforStripe(avsiktId: string, nar: (lage: "vantar_mejl") => void) {
  const start = Date.now();
  for (let forsok = 0; ; forsok++) {
    let status = 0;
    let j: unknown = null;
    try {
      const r = await fetch("/api/kassa/stripe/klar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avsiktId }),
        cache: "no-store",
      });
      status = r.status;
      j = await r.json().catch(() => null);
    } catch {
      /* nätet: frågar igen */
    }
    const b = klarBeslut(status, j);
    if (b.gor === "tack") {
      glom(STRIPE_NYCKEL, "local");
      window.location.replace(`/tack?orderId=${encodeURIComponent(b.orderId)}`);
      return;
    }
    if (b.gor === "fel") {
      window.location.replace(`/kassa?stripe=${tillbakaKod(b.kod)}`);
      return;
    }
    if (Date.now() - start > VANTA_MS) {
      nar("vantar_mejl");
      return;
    }
    await new Promise((klar) => window.setTimeout(klar, Math.min(1000 + forsok * 500, 3000)));
  }
}

export function Tillbaka() {
  const [stripeLage, setStripeLage] = useState<"nej" | "slutfor" | "vantar_mejl">("nej");

  useEffect(() => {
    let avsikt: string | null = null;
    try {
      avsikt = new URLSearchParams(window.location.search).get("avsikt");
    } catch {
      avsikt = null;
    }
    if (avsikt && AVSIKT.test(avsikt)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- betalningens id finns bara i adressen
      setStripeLage("slutfor");
      void slutforStripe(avsikt, setStripeLage);
      return;
    }

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
          glom(VANTAR_NYCKEL, "session");
          window.location.replace(`/tack?orderId=${encodeURIComponent(orderId)}`);
        } else {
          window.location.replace("/kassa");
        }
      })
      .catch(() => window.location.replace("/kassa"));
  }, []);

  if (stripeLage === "nej") {
    return (
      <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <p style={{ margin: 0, color: "var(--soft)" }}>Ett ögonblick …</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "32px 16px" }}>
      <div className={s.vantanKort} role="status" aria-live="polite" aria-busy={stripeLage === "slutfor"}>
        {stripeLage === "slutfor" ? (
          <>
            <div className={s.vantanRing} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" /></svg>
            </div>
            <p className={s.vantanRubrik}>Vi slutför din beställning</p>
            <p className={s.vantanUnder}>Betalningen kontrolleras och ordern skapas. Stäng inte sidan.</p>
          </>
        ) : (
          <>
            <p className={s.vantanRubrik}>Betalningen är mottagen</p>
            <p className={s.vantanUnder}>
              Vi slutför din beställning. Orderbekräftelsen kommer till din e-post inom några minuter, och du behöver inte betala igen.
            </p>
            <p className={s.vantanUnder} style={{ marginTop: 14 }}>
              <Link href="/">Till startsidan</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
