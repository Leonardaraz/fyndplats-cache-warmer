// "Så fungerar Fyndauktionen": tre steg som en tidslinje (07 → varje timme →
// såld) plus villkoren som en kort lista. Serverkomponent, ingen klocka.
// Stegen är en förklaring, inte knappar: inga ramar som ser klickbara ut.
// Färgerna går via scenens --a-*-variabler, så panelen följer med i
// kvällens mörka ember-läge (components/auction-stage.tsx).

import styles from "../app/fyndauktion/fyndauktion.module.css";

const Ikon = ({ children }: { children: React.ReactNode }) => (
  <span className={styles.stepIcon} aria-hidden="true">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  </span>
);

const STEG = [
  {
    nar: "Kl 07",
    rubrik: "Start på ordinarie pris",
    text: "Dagens fynd läggs ut varje morgon, till samma pris som i butiken.",
    ikon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
  },
  {
    nar: "Varje timme",
    rubrik: "Priset sjunker",
    text: "Priset sänks varje hel timme fram till kl 19. Ju längre du väntar, desto billigare.",
    ikon: (
      <>
        <path d="m3 7 6 6 4-4 8 8" />
        <path d="M21 11v6h-6" />
      </>
    ),
  },
  {
    nar: "Först till kvarn",
    rubrik: "Köpt är borta",
    text: "Varje fynd finns bara en gång. När någon köper det försvinner det direkt.",
    ikon: (
      <>
        <path d="M5.5 8h13l-1 12h-11z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
        <path d="m9.5 14 2 2 3.5-3.5" />
      </>
    ),
  },
];

const VILLKOR = [
  "Startpriset är produktens ordinarie pris hos oss.",
  "Säljs inget före kl 19 återgår priset till ordinarie, och nya fynd startar nästa morgon.",
  "Varje fynd säljs bara en gång – köpt är borta direkt.",
  "Vanlig ångerrätt och 30 dagars öppet köp gäller, precis som på allt annat hos Fyndplats.",
];

export function AuctionSteps() {
  return (
    <section className={styles.how} aria-labelledby="sa-fungerar">
      <h2 id="sa-fungerar" className={styles.howTitle}>
        Så fungerar Fyndauktionen
      </h2>
      <ol className={styles.steps}>
        {STEG.map((s, i) => (
          <li className={styles.step} key={s.rubrik}>
            <Ikon>{s.ikon}</Ikon>
            <div className={styles.stepBody}>
              <div className={styles.stepWhen}>
                <span className={styles.stepNo}>{i + 1}</span>
                {s.nar}
              </div>
              <h3 className={styles.stepTitle}>{s.rubrik}</h3>
              <p className={styles.stepText}>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className={styles.terms}>
        <h3 className={styles.termsTitle}>Bra att veta</h3>
        <ul className={styles.termsList}>
          {VILLKOR.map((v) => (
            <li key={v}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {v}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
