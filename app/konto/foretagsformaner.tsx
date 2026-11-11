// Högerspalten på /konto/foretag: företagskortet, ordertrappan och vad
// företagskontot ger. Samma uppställning som medlemssidans kort och förmåner.
//
// Trappans staplar ritas ur prismotorns egen tabell (ORDERTRAPPA), så att
// bilden aldrig lovar något annat än kassan räknar.

import type { CSSProperties } from "react";
import { ORDERTRAPPA, OFFERT_BAS_ORE_EX_MOMS, OFFERT_EXEMPLAR } from "@/lib/medlem/pris";
import { trappmening, trappspann, trappsteg } from "@/lib/medlem/foretagsstart";
import { kronor } from "@/lib/medlem/niva";
import { Medlemskort } from "./medlemskort";
import s from "./konto.module.css";

export function Foretagskort() {
  // Spannet kommer ur prismotorns tabell, som staplarna under kortet.
  const spann = trappspann(ORDERTRAPPA);
  return (
    <div className={s.foretagskort} aria-hidden="true">
      <Medlemskort
        niva="Företag"
        etikett="Företagskonto"
        nyckel="foretag"
        rad1="Priser exkl. moms"
        rad2={spann ? `Ordertrappa ${spann}` : undefined}
        id="mk-ft"
      />
    </div>
  );
}

export function Trappa() {
  const steg = trappsteg(ORDERTRAPPA);
  if (steg.length === 0) return null;
  return (
    <figure className={s.trappa}>
      <figcaption className={s.trappRubrik}>Rabatt som växer med ordern</figcaption>
      {/* Staplarna är en bild av meningen under; skärmläsaren får meningen. */}
      <ol className={s.trappsteg} aria-hidden="true">
        {steg.map((st) => (
          <li key={st.kr} style={{ "--hojd": st.hojd } as CSSProperties}>
            <span className={s.trappProcent}>{st.procent}&nbsp;%</span>
            <span className={s.trappStapel} />
            <span className={s.trappGrans}>
              {st.tal}
              <span className={s.trappKr}>&nbsp;kr</span>
            </span>
          </li>
        ))}
      </ol>
      <p className={s.trappNot}>
        <span className="sr-only">{trappmening(ORDERTRAPPA)} </span>
        Orderns värde i kronor exklusive moms. Du får den högsta av ordertrappan och din medlemsnivå, aldrig båda.
      </p>
    </figure>
  );
}

export function Foretagsformaner() {
  return (
    <ul className={s.formanLista}>
      <li>
        <strong>Priser exklusive moms</strong> i butiken och varukorgen. Momsen läggs på i kassan.
      </li>
      <li>
        <strong>Offert på större köp</strong>, från {OFFERT_EXEMPLAR} exemplar av samma vara eller {kronor(OFFERT_BAS_ORE_EX_MOMS)} exklusive moms.
      </li>
      <li>
        <strong>Kvitto och faktura med företagets namn</strong>, och för ett bolag också organisationsnumret.
      </li>
      <li>
        <strong>Kort, Klarna eller förskottsfaktura</strong>, och samma inloggning när du handlar privat.
      </li>
    </ul>
  );
}
