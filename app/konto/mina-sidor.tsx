// Mina sidor (E1-8): nivå, rabattprocent, K, kvar till nästa nivå, när nivån
// kan ändras, köpen som räknas och orderhistoriken. Inga priser ändras ännu,
// och det står uttryckligen (specen, "E1 lanseras tyst").

import { dagSomText, kronor, stockholmsDag, type Nivalage } from "@/lib/medlem/niva";
import { maskeradEpost } from "@/lib/medlem/inloggning";
import type { MinaSidor, OrderPaMinaSidor } from "@/lib/medlem/konto";
import s from "./konto.module.css";

const STATUS: Record<OrderPaMinaSidor["status"], string> = {
  betald: "Betald",
  "delvis-aterbetald": "Delvis återbetald",
  aterbetald: "Återbetald",
  avbruten: "Avbruten",
  obetald: "Inte betald",
};

/** Texten tills medlemspriset finns i kassan (E2). */
export const RABATT_INTE_AN = "Medlemsrabatten gäller ännu inte i kassan.";

function andel(l: Nivalage): number {
  if (!l.nasta) return 1;
  const fran = l.niva.franOre;
  const till = l.nasta.niva.franOre;
  return Math.min(1, Math.max(0, (l.kOre - fran) / Math.max(1, till - fran)));
}

export function MinaSidorVy({ data }: { data: MinaSidor }) {
  const { lage, regler, ordrar, medlem } = data;
  const nummer = new Map(lage.raknade.map((r) => [r.orderId, r.ordernummer ?? r.orderId]));
  return (
    <>
      {/* En div, inte <header>: globals.css gör varje header klistrad (sidhuvudet). */}
      <div className={s.huvud}>
        <div>
          <h1 className={s.rubrik}>Mina sidor</h1>
          <p className={s.vem}>Inloggad som {maskeradEpost(medlem.epost)}</p>
        </div>
        <form action="/api/konto/ut" method="post">
          <button type="submit" className={s.textknapp}>
            Logga ut
          </button>
        </form>
      </div>

      <section className={`${s.kort} ${s.nivakort}`} aria-labelledby="din-niva">
        <p className={s.liten_etikett} id="din-niva">
          Din nivå
        </p>
        <p className={s.niva}>{lage.niva.namn}</p>
        <p className={s.belopp}>
          Du har handlat för <strong>{kronor(lage.kOre)}</strong> de senaste 365 dagarna.
        </p>
        {lage.nasta ? (
          <>
            <div
              className={s.stapel}
              role="progressbar"
              aria-label={`Mot ${lage.nasta.niva.namn}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(andel(lage) * 100)}
            >
              <div className={s.stapelFyllning} style={{ width: `${Math.round(andel(lage) * 100)}%` }} />
            </div>
            <p className={s.kvar}>
              {kronor(lage.nasta.kvarOre)} kvar till {lage.nasta.niva.namn}.
            </p>
          </>
        ) : (
          <p className={s.kvar}>Du har den högsta nivån.</p>
        )}
        {lage.manuell ? (
          <p className={s.not}>
            Din nivå är satt av kundtjänst
            {lage.manuell.tillDag !== null ? ` till och med ${dagSomText(lage.manuell.tillDag)}` : ""}.
          </p>
        ) : null}
        <p className={s.not}>
          {lage.niva.rabattProcent > 0 ? `${lage.niva.namn} ger ${lage.niva.rabattProcent} % medlemsrabatt. ` : ""}
          {RABATT_INTE_AN}
        </p>
      </section>

      <section className={s.kort} aria-labelledby="nar-andras">
        <h2 className={s.underrubrik} id="nar-andras" style={{ marginTop: 0 }}>
          När ändras nivån?
        </h2>
        {lage.aldstaFallerUr !== null ? (
          <p className={s.text}>
            Ditt äldsta köp som räknas gjordes {dagSomText(lage.aldstaFallerUr - 365)} och räknas till och med{" "}
            {dagSomText(lage.aldstaFallerUr - 1)}.
          </p>
        ) : (
          <p className={s.text}>Du har inga betalda köp de senaste 365 dagarna. Ditt nästa köp räknas från dagen du betalar.</p>
        )}
        {lage.sankning ? (
          <p className={s.text}>
            Handlar du inget mer blir din nivå <strong>{lage.sankning.niva.namn}</strong> den {dagSomText(lage.sankning.dag)}.
            Handlar du för {kronor(Math.max(0, lage.niva.franOre - lage.sankning.kOre))} innan dess behåller du{" "}
            {lage.niva.namn}.
          </p>
        ) : null}
        <p className={s.not}>
          Så räknas beloppet: betalda varor med moms de senaste 365 dagarna, minus det du har fått tillbaka för returer.
          Frakt och avgifter räknas inte. Ett köp räknas från dagen du betalade och i 365 dagar, och en återbetalning
          dras av från dagen den görs.
        </p>
      </section>

      <h2 className={s.underrubrik}>Nivåerna</h2>
      <section className={s.kort}>
        <table className={s.tabell}>
          <thead>
            <tr>
              <th>Nivå</th>
              <th className={s.tal}>Från</th>
              <th className={s.tal}>Rabatt</th>
            </tr>
          </thead>
          <tbody>
            {regler.nivaer.map((n) => (
              <tr key={n.namn} className={n.namn === lage.niva.namn ? s.aktuell : undefined}>
                <td>{n.namn}</td>
                <td className={s.tal}>{n.franOre === 0 ? "–" : kronor(n.franOre)}</td>
                <td className={s.tal}>{n.rabattProcent} %</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={s.not}>{RABATT_INTE_AN}</p>
      </section>

      <h2 className={s.underrubrik}>Köp som räknas</h2>
      <section className={s.kort}>
        {lage.raknade.length ? (
          <ul className={s.lista}>
            {[...lage.raknade].reverse().map((r) => (
              <li key={r.orderId} className={s.post}>
                <span className={s.postTitel}>Order {nummer.get(r.orderId)}</span>
                <span className={s.postBelopp}>{kronor(r.bidragOre)}</span>
                <span className={s.postRad}>
                  Betald {dagSomText(r.betaldDag)} · räknas till och med {dagSomText(r.fallerUrDag - 1)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.tom}>Inga köp räknas just nu.</p>
        )}
      </section>

      <h2 className={s.underrubrik}>Dina ordrar</h2>
      <section className={s.kort}>
        {ordrar.length ? (
          <ul className={s.lista}>
            {ordrar.map((o) => (
              <li key={o.orderId} className={s.post}>
                <span className={s.postTitel}>
                  Order {o.ordernummer}
                  <span className={s.status}>{STATUS[o.status]}</span>
                </span>
                <span className={s.postBelopp}>{kronor(o.totaltOre)}</span>
                <span className={s.postMeta}>{dagSomText(stockholmsDag(o.bestalld))}</span>
                <span className={s.postRad}>
                  {o.sparning.length ? (
                    o.sparning.map((tn, i) => (
                      <span key={tn}>
                        {i > 0 ? " · " : ""}
                        <a href={`/sparning?tn=${encodeURIComponent(tn)}`}>Spåra paketet{o.sparning.length > 1 ? ` ${i + 1}` : ""}</a>
                      </span>
                    ))
                  ) : o.status === "avbruten" || o.status === "obetald" ? null : (
                    "Spårning kommer när paketet har skickats."
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.tom}>Vi hittar inga ordrar på din e-postadress.</p>
        )}
      </section>
    </>
  );
}
