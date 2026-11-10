// Växeln Privatperson / Företag överst på inloggningen (Leonard 2026-11-10).
//
// Två länkar, inte två flikar: varje val är en egen sida (/konto och
// /konto/foretag), så växeln fungerar utan skript och går att länka till.
// Den visas bara när företagskontot är öppet för alla (visaForetagsvag).

import { FORETAGSVAG } from "@/lib/medlem/foretagsstart";
import s from "./konto.module.css";

function Person() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/** En portfölj: företaget, med samma linjevikt som personikonen. */
export function Portfolj({ storlek = 18 }: { storlek?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={storlek} height={storlek} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

export function Kontotyp({ aktiv }: { aktiv: "privat" | "foretag" }) {
  return (
    <nav className={s.kontotyp} aria-label="Typ av konto">
      <a href="/konto" className={s.kontotypVal} aria-current={aktiv === "privat" ? "page" : undefined}>
        <Person />
        Privatperson
      </a>
      <a href={FORETAGSVAG} className={s.kontotypVal} aria-current={aktiv === "foretag" ? "page" : undefined}>
        <Portfolj />
        Företag
      </a>
    </nav>
  );
}

/** Raden under inloggningen på /konto: den andra vägen in för den som missade växeln. */
export function Foretagsrad() {
  return (
    <a href={FORETAGSVAG} className={s.foretagsrad}>
      <span className={s.foretagsradIkon} aria-hidden="true">
        <Portfolj storlek={22} />
      </span>
      <span className={s.foretagsradText}>
        <strong>Handlar du till ett företag?</strong>
        <span>Priser exklusive moms och rabatt på större ordrar.</span>
        <span className={s.foretagsradPil}>
          Skapa företagskonto
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </span>
    </a>
  );
}
