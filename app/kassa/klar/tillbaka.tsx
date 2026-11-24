"use client";

// Kunden kommer tillbaka till oss efter betalningen.
//
//   • Från Klarna via Stripe: /api/kassa/stripe/retur lägger betalningens id i
//     en kort kaka (aldrig i adressen, som GA4 och Meta sparar) och skickar
//     hit. Servern gör ordern (/api/kassa/stripe/klar), och kunden går till
//     tacksidan. Blev det ingen order går kunden till kassan, som säger varför
//     (?stripe=<kod>).
//   • Från Wix (betalsidan eller dess logga): den väntande betalningen ligger i
//     sessionStorage (app/kassa/kassa.tsx). Är den betald går kunden till
//     tacksidan, väntar den till kassan (som visar "Din betalning väntar"). Utan
//     väntande betalning, till exempel en kund i Wix egen kassa som tryckte på
//     loggan, går kunden till startsidan.

import { useEffect, useState } from "react";
import Link from "next/link";
import { AVSIKT_KAKA, AVSIKT_KAKA_SOKVAG, STRIPE_NYCKEL, avsiktUrKakor, oppenText, tillbakaKod, vantaPaOrder } from "../../../lib/kassa/stripe-klient";
import { KassaFot, KassaHuvud, Las } from "../kassa-ram";
import s from "../kassa.module.css";

const VANTAR_NYCKEL = "fp_kassa_vantar";

const glom = (nyckel: string, lagring: "local" | "session") => {
  try {
    (lagring === "local" ? localStorage : sessionStorage).removeItem(nyckel);
  } catch {
    /* tacksidan fungerar ändå */
  }
};

/** Betalningens id ur kakan från returen. Kakan tas bort direkt: den gäller en retur. */
function tagAvsikt(): string | null {
  try {
    const avsikt = avsiktUrKakor(document.cookie);
    document.cookie = `${AVSIKT_KAKA}=; Path=${AVSIKT_KAKA_SOKVAG}; Max-Age=0; SameSite=Lax`;
    return avsikt;
  } catch {
    return null;
  }
}

const oppenRuta = (hosKlarna: boolean) => oppenText({ hosKlarna, kanFortsatta: true, plats: "retur" });

export function Tillbaka() {
  const [stripeLage, setStripeLage] = useState<"nej" | "slutfor" | "vantar_mejl" | "oppen">("nej");
  // Betalningen står öppen hos Klarna: adressen där kunden fortsätter den, och om det är Klarna.
  const [oppen, setOppen] = useState<{ adress: string; hosKlarna: boolean } | null>(null);

  useEffect(() => {
    const avsikt = tagAvsikt();
    if (avsikt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- betalningens id finns bara i webbläsarens kaka
      setStripeLage("slutfor");
      let lamnad = false;
      // Rutan för en öppen betalning visas: bara då frågas servern igen när sidan blir synlig.
      let oppnad = false;
      const fraga = () => vantaPaOrder(avsikt).then((b) => {
        if (lamnad) return;
        if (b.gor === "fortsatt") {
          // Inte godkänd, men öppen hos Klarna (kunden kom hit innan betalningen
          // blev klar): ☠️ aldrig "Betalningen är mottagen" här. Kunden fortsätter
          // samma betalning härifrån, i vilken webbläsare returen än öppnades.
          if (b.adress) {
            oppnad = true;
            setOppen({ adress: b.adress, hosKlarna: b.hosKlarna });
            setStripeLage("oppen");
          } else {
            window.location.replace("/kassa?stripe=avbruten");
          }
          return;
        }
        if (b.gor === "tack") {
          glom(STRIPE_NYCKEL, "local");
          // Var det en medlemskorg tas de köpta varorna bort ur besökarens korg
          // (kakan är httpOnly; utan den gör rutten ingenting).
          void fetch("/api/kassa/lastkorg", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ steg: "kopt", orderId: b.orderId }),
            keepalive: true,
          }).catch(() => {});
          window.location.replace(`/tack?orderId=${encodeURIComponent(b.orderId)}`);
        } else if (b.gor === "fel") {
          window.location.replace(`/kassa?stripe=${tillbakaKod(b.kod, b.orsak)}`);
        } else {
          setStripeLage("vantar_mejl");
        }
      });
      void fraga();
      // Kunden kan godkänna betalningen i Klarnas app medan rutan visas: när
      // sidan blir synlig igen frågas servern på nytt.
      const synlig = () => {
        if (!oppnad || document.visibilityState !== "visible") return;
        oppnad = false;
        void fraga();
      };
      document.addEventListener("visibilitychange", synlig);
      return () => {
        lamnad = true;
        document.removeEventListener("visibilitychange", synlig);
      };
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

  // Kassans eget sidhuvud och sidfot (kassa-ram.tsx): kunden är mitt i köpet.
  // Ingen <main> här: layouten har redan en (två är fel HTML och förvirrar skärmläsare).
  if (stripeLage === "nej") {
    return (
      <div className={s.sida} data-kassa-sida="">
        <KassaHuvud />
        <div className={s.klarYta}>
          <p style={{ margin: 0, color: "var(--soft)" }}>Ett ögonblick …</p>
        </div>
        <KassaFot />
      </div>
    );
  }

  return (
    <div className={s.sida} data-kassa-sida="">
      <KassaHuvud />
      <div className={s.klarYta}>
        <div className={`${s.vantanKort} ${s.klarKort}`} role="status" aria-live="polite" aria-busy={stripeLage === "slutfor"}>
          {stripeLage === "slutfor" ? (
            <>
              <div className={s.vantanRing} aria-hidden="true">
                <Las storlek={26} />
              </div>
              <p className={s.vantanRubrik}>Vi slutför din beställning</p>
              <p className={s.vantanUnder}>Betalningen kontrolleras och ordern skapas. Stäng inte sidan.</p>
            </>
          ) : stripeLage === "oppen" && oppen ? (
            <>
              <p className={s.vantanRubrik}>{oppenRuta(oppen.hosKlarna).rubrik}</p>
              <p className={s.vantanUnder}>{oppenRuta(oppen.hosKlarna).text}</p>
              <p className={s.vantanUnder} style={{ marginTop: 16 }}>
                <a className={s.vantarKnapp} href={oppen.adress} data-kassa-oppen="">
                  {oppenRuta(oppen.hosKlarna).knapp} <span aria-hidden="true">→</span>
                </a>
              </p>
              <p className={s.vantanUnder} style={{ marginTop: 14 }}>
                <Link href="/kassa">Tillbaka till kassan</Link>
              </p>
            </>
          ) : (
            <>
              <span className={`${s.klarBock} ${s.klarBockStor}`} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              </span>
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
      </div>
      <KassaFot />
    </div>
  );
}
