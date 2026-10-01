"use client";
// Fyndauktionens tomma läge: ett kort i stället för en lös textrad. Säger vad
// som gäller (före 07, sålda, efter 19), när nästa auktion startar, räknar ned
// dit och visar vägen till nyhetsbrevet längre ned på sidan.
//
// HYDRERING: första render använder bara serverns props (läge + dagtext), så
// SSR-HTML och klientens första render är identiska. Klockan tar över efter
// mount. Nedräkningens rutor har sin plats reserverad redan i HTML:en (dolda
// tills klockan finns), så inget hoppar när siffrorna dyker upp.
//
// 07:00–07:15 (läget "snart") hämtar sidan om sig själv var 30:e sekund: då
// ska dagens fynd dyka upp utan att kunden laddar om. Sidan är ISR med 30 s.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../app/fyndauktion/fyndauktion.module.css";
import { nastaStartMs, nedrakning, startDagText, tomtLage, type TomtLage } from "./auction-next-start";

const TEXT: Record<TomtLage, { chip: string; rubrik: string; brod: string }> = {
  fore: {
    chip: "Öppnar kl 07",
    rubrik: "Dagens fynd startar kl 07",
    brod: "Då läggs dagens fynd ut på ordinarie pris. Sedan sjunker priset varje timme fram till kl 19 – tills någon slår till.",
  },
  snart: {
    chip: "Startar nu",
    rubrik: "Dagens fynd läggs ut just nu",
    brod: "Auktionen öppnar kl 07. Sidan uppdateras av sig själv, så om en liten stund syns dagens fynd här.",
  },
  salda: {
    chip: "Slutsålt för i dag",
    rubrik: "Dagens fynd är sålda",
    brod: "Alla dagens fynd har fått en köpare. I morgon kl 07 startar nya fynd på ordinarie pris, och priset sjunker varje timme tills någon köper.",
  },
  kvall: {
    chip: "Stängt för i dag",
    rubrik: "Nya fynd i morgon kl 07",
    brod: "Dagens auktion är avslutad. I morgon kl 07 startar nya fynd på ordinarie pris, och priset sjunker varje timme tills någon köper.",
  },
};

const pad = (n: number) => String(n).padStart(2, "0");

export function AuctionEmpty({
  lage: serverLage,
  dagText: serverDagText,
  children,
}: {
  /** Läget enligt serverns klocka — används tills klienten har mountat. */
  lage: TomtLage;
  /** "i morgon, torsdag 1 oktober" enligt serverns klocka. */
  dagText: string;
  /** Valfri fot (senast sålda), renderad på servern. */
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [nu, setNu] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNu(Date.now());
    const t0 = setTimeout(tick, 0); // första tick direkt efter mount
    const t = setInterval(tick, 1000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, []);

  const lage = nu === null ? serverLage : tomtLage(nu);
  const mal = nu === null ? null : nastaStartMs(nu);
  const dagText = nu === null || mal === null ? serverDagText : startDagText(mal, nu);
  const kvar = nu !== null && mal !== null ? nedrakning(mal - nu) : null;

  // Starten har passerat men listan är fortfarande tom: hämta om sidan tills
  // fynden syns (komponenten försvinner då) eller startfönstret är slut.
  useEffect(() => {
    if (lage !== "snart") return;
    router.refresh();
    const t = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(t);
  }, [lage, router]);

  const text = TEXT[lage];
  const pagar = lage === "snart";

  const tillNyhetsbrevet = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const ankare = document.getElementById("nyhetsbrev");
    if (!ankare) return; // ankarlänken får göra jobbet
    e.preventDefault();
    const lugn = matchMedia("(prefers-reduced-motion: reduce)").matches;
    ankare.scrollIntoView({ behavior: lugn ? "auto" : "smooth", block: "center" });
    history.replaceState(null, "", "#nyhetsbrev");
    const falt = ankare.querySelector<HTMLInputElement>('input[type="email"]');
    // Fokus efter scrollen: annars hoppar sidan direkt till fältet och den
    // mjuka scrollen syns aldrig.
    if (falt) setTimeout(() => falt.focus({ preventScroll: true }), lugn ? 0 : 450);
  };

  return (
    <div className={styles.empty}>
      <div className={styles.emptyMain}>
        <span className={styles.chip}>
          <span className={`${styles.chipDot}${pagar ? " " + styles.chipDotLive : ""}`} aria-hidden="true" />
          {text.chip}
        </span>
        <h2 className={styles.emptyTitle}>{text.rubrik}</h2>
        <p className={styles.emptyText}>{text.brod}</p>
        <div className={styles.actions}>
          <a className={styles.btnPrimary} href="#nyhetsbrev" onClick={tillNyhetsbrevet}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
            </svg>
            Prenumerera på nyhetsbrevet
          </a>
          <a className={styles.btnSecondary} href="/rea">
            <span className={styles.btnSecondaryText}>Fynda på rean</span>
            <span className={styles.btnSecondaryArrow} aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <div className={styles.clock}>
        <div className={styles.clockLabel}>{pagar ? "Dagens auktion" : "Nästa auktion startar"}</div>
        <div className={styles.clockTime}>07:00</div>
        <div className={styles.clockDay}>{pagar ? "startade i dag" : dagText}</div>
        {pagar ? (
          <div className={styles.clockNote}>Fynden visas här inom kort</div>
        ) : (
          <div
            className={styles.countdown}
            data-ready={kvar ? "" : undefined}
            role="timer"
            aria-label={kvar ? `Startar om ${kvar.h} timmar och ${kvar.m} minuter` : undefined}
            aria-hidden={kvar ? undefined : true}
          >
            {(
              [
                [kvar ? pad(kvar.h) : "00", "tim"],
                [kvar ? pad(kvar.m) : "00", "min"],
                [kvar ? pad(kvar.s) : "00", "sek"],
              ] as const
            ).map(([tal, enhet]) => (
              <span className={styles.cdCell} key={enhet} aria-hidden="true">
                <span className={styles.cdNum}>{tal}</span>
                <span className={styles.cdUnit}>{enhet}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
