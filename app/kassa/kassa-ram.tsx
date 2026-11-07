// Kassans sidhuvud och sidfot (/kassa och /kassa/klar). Butikens meny,
// sökruta, kampanjremsa och stora sidfot leder bort från köpet, så kassan
// visar bara loggan, var i köpet kunden är och att kassan är säker
// (app/globals.css döljer butikens delar när [data-kassa-sida] finns på
// sidan). Så ser kassorna ut hos de stora butikerna.
//
// Villkor och hjälp öppnas i en ny flik: det kunden skrivit i formuläret
// sparas inte förrän hen betalar, och ett klick bort hade tömt det.

import Link from "next/link";
import { Mark } from "../../components/mark";
import s from "./kassa.module.css";

export const Las = ({ storlek = 14 }: { storlek?: number }) => (
  <svg width={storlek} height={storlek} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" />
  </svg>
);

const Bock = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Sidhuvudet. `tillVarukorgen` öppnar varukorgen från steget "Varukorg"
 * (kassan); utan den visas stegen inte (sidan efter Klarna).
 */
export function KassaHuvud({ tillVarukorgen }: { tillVarukorgen?: () => void }) {
  return (
    <header className={s.huvud}>
      <div className={s.huvudRad}>
        {/* Ingen förhämtning: startsidan hämtades tre gånger medan kassan och
            Stripe laddade (mätt 2026-11-07), och sällan lämnar någon kassan här. */}
        <Link className={s.logga} href="/" prefetch={false} aria-label="Fyndplats, till startsidan">
          <Mark size={26} idPrefix="fpkassa" />
          <span>Fyndplats</span>
        </Link>
        {tillVarukorgen ? (
          <ol className={s.stegRad} aria-label="Steg i köpet">
            <li data-steg="klar">
              <button type="button" onClick={tillVarukorgen}>
                <span className={s.stegRadPrick}><Bock /></span>
                Varukorg
              </button>
            </li>
            <li data-steg="nu" aria-current="step">
              <span className={s.stegRadPrick}>2</span>
              Uppgifter och betalning
            </li>
            <li data-steg="sen">
              <span className={s.stegRadPrick}>3</span>
              Bekräftelse
            </li>
          </ol>
        ) : null}
        <span className={s.huvudSaker}>
          <Las />
          Säker kassa
        </span>
      </div>
    </header>
  );
}

const NY_FLIK = { target: "_blank", rel: "noopener" } as const;

export function KassaFot() {
  return (
    <footer className={s.fot}>
      <nav className={s.fotLankar} aria-label="Villkor och hjälp">
        <a href="/kopvillkor" {...NY_FLIK}>Köpvillkor</a>
        <a href="/sekretesspolicy" {...NY_FLIK}>Integritetspolicy</a>
        <a href="/returer" {...NY_FLIK}>Returer och ångerrätt</a>
        <a href="/vanliga-fragor" {...NY_FLIK}>Vanliga frågor</a>
      </nav>
      <p className={s.fotKontakt}>
        Frågor om ditt köp? <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> · <a href="tel:+46736630990">073-663 09 90</a>
      </p>
      <p className={s.fotRatt}>© 2021–2026 Fyndplats · Trygg svensk e-handel</p>
    </footer>
  );
}
