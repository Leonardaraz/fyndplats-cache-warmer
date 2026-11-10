// Sidan /konto/foretag som den ser ut: rubriken, stegen och högerspalten.
// Vem som får se den avgörs i app/konto/foretag/page.tsx.

import { ForetagStart } from "./foretag-start";
import { Foretagsformaner, Foretagskort, Trappa } from "./foretagsformaner";
import { Kontotyp } from "./kontotyp";
import s from "./konto.module.css";

/** `inne`: besökaren är redan inloggad och börjar på steg 2, utan växeln. */
export function Foretagssida({ inne, fel }: { inne: boolean; fel?: string | null }) {
  return (
    <section className="sec">
      <div className={`container ${s.ram}`}>
        <div className={`${s.inloggYta} ${s.foretagYta}`}>
          <div>
            {inne ? null : <Kontotyp aktiv="foretag" />}
            <p className={s.ogonbryn}>Fyndplats företag</p>
            <h1 className={`${s.rubrik} ${s.display}`}>Skapa företagskonto</h1>
            <p className={s.ingress}>
              Handla till företaget med priser exklusive moms och rabatt som växer med ordern. Det tar ett par minuter, och bolag
              som är aktiva hos Bolagsverket godkänns direkt.
            </p>
            <ForetagStart inloggad={inne} fel={fel} />
          </div>
          <aside className={s.formaner} aria-label="Det här får företaget">
            <Foretagskort />
            <Trappa />
            <Foretagsformaner />
          </aside>
        </div>
      </div>
    </section>
  );
}
