import type { Metadata } from "next";
import { AuctionCard } from "../../components/auction-card";
import { Newsletter } from "../../components/newsletter";
import { getLiveAuctions, getSoldAuctions } from "../../lib/auction-view";

// Auktionssidan behöver kort ISR-fönster: priserna stegar (cron på timmen) och
// nedräkningen på klienten triggar refresh vid steggränsen — 60 s tak räcker.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Fyndauktionen – priset sjunker tills någon köper",
  description:
    "Fem pågående auktioner där priset sjunker steg för steg tills någon slår till. Vänta för ett bättre pris – eller köp innan någon annan hinner före. Nya fynd fylls på löpande.",
  alternates: { canonical: "https://www.fyndplats.se/fyndauktion" },
};

export default async function Fyndauktion() {
  const [live, sold] = await Promise.all([getLiveAuctions(), getSoldAuctions(6)]);

  return (
    <>
      <section className="sec auction-hero">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Fyndauktionen</div>
            <h1>Priset sjunker – tills någon köper</h1>
            <p>
              Fem pågående auktioner. Varje pris sänks steg för steg tills någon slår till – sen tar
              nästa fynd platsen. Väntar du får du det billigare. Väntar du för länge hinner någon
              annan före.
            </p>
          </div>

          <div className="auction-how">
            <div><b>1.</b> Priset sänks automatiskt, steg för steg</div>
            <div><b>2.</b> Köp när priset känns rätt – först till kvarn</div>
            <div><b>3.</b> Sålt? Nästa fynd tar platsen direkt</div>
          </div>

          {live.length > 0 ? (
            <div className="grid auction-grid">
              {live.map((a) => (
                <AuctionCard a={a} key={a.slug} />
              ))}
            </div>
          ) : (
            <p className="auction-empty">
              Nästa auktionsomgång startar strax — titta tillbaka snart, eller prenumerera nedan så
              missar du inget.
            </p>
          )}

          <p className="auction-fineprint">
            Startpriset är produktens ordinarie pris hos oss. Auktionspriset gäller så länge
            produkten finns i lager – först till kvarn. Vanlig ångerrätt och 30 dagars öppet köp
            gäller precis som på allt annat hos Fyndplats.
          </p>
        </div>
      </section>

      {sold.length > 0 && (
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="sechead">
              <div className="eyebrow">Nyss avgjorda</div>
              <h2>Senast sålda fynd</h2>
            </div>
            <ul className="auction-sold-list">
              {sold.map((s) => (
                <li key={s.slug + s.endedAt}>
                  <a href={`/produkt/${s.slug}`}>{s.name}</a>
                  <span>
                    såld för <b>{s.soldPrice.toLocaleString("sv-SE")} kr</b>
                    {s.discountPercent > 0 && <em> (−{s.discountPercent}%)</em>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Newsletter />
    </>
  );
}
