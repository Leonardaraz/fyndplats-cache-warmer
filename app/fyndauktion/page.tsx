import type { Metadata } from "next";
import { AuctionCard } from "../../components/auction-card";
import { AuctionHeroCard } from "../../components/auction-hero-card";
import { AuctionStage } from "../../components/auction-stage";
import { AuctionFuse } from "../../components/auction-fuse";
import { AuctionClimax } from "../../components/auction-climax";
import { AuctionLiveBar } from "../../components/auction-live-bar";
import { Newsletter } from "../../components/newsletter";
import { getLiveAuctions, getSoldAuctions } from "../../lib/auction-view";

// Auktionssidan behöver kort ISR-fönster: priserna stegar (cron på timmen) och
// nedräkningen på klienten triggar refresh vid steggränsen — 60 s tak räcker.
export const revalidate = 60;

export const metadata: Metadata = {
  // Titeln får INTE innehålla "| Fyndplats" — layoutens mall lägger på det, och
  // summan måste rymmas under Googles ~60 tecken. Förra titeln var 59 tecken
  // och blev 72 med suffixet, alltså kapad i sökresultatet.
  title: "Fyndauktionen – priset sjunker varje timme",
  // ~155 tecken: Google klipper snippeten runt 160 och den gamla var 198, så
  // sista meningen syntes aldrig. Uppmaningen ligger nu tidigt i stället.
  description:
    "Fem fynd varje dag kl 07–19. Priset sjunker varje timme tills någon slår till – vänta för ett bättre pris, eller köp innan någon hinner före.",
  alternates: { canonical: "https://www.fyndplats.se/fyndauktion" },
  openGraph: {
    title: "Fyndauktionen – priset sjunker varje timme tills någon köper",
    description:
      "Nya fynd varje dag kl 07–19. Priset faller varje timme – vänta för ett bättre pris, eller köp innan någon annan hinner före.",
    url: "https://www.fyndplats.se/fyndauktion",
    // v2: allt innehåll i bildens mittkvadrat — chattappar (Snapchat/WhatsApp/
    // iMessage) visar og-bilden som LITEN KVADRAT, mittbeskuren, och v1:s
    // fullbredds-rubrik kapades. Nytt filnamn medvetet: delnings-scrapers
    // cachear per URL, gamla URL:en hade fortsatt servera den beskurna.
    images: [{ url: "https://www.fyndplats.se/og-fyndauktion2.jpg", width: 1200, height: 630, alt: "Fyndauktionen – priset sjunker varje timme" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.fyndplats.se/og-fyndauktion2.jpg"],
  },
};

export default async function Fyndauktion() {
  const [live, sold] = await Promise.all([getLiveAuctions(), getSoldAuctions(6)]);

  // Flaggskeppet (störst rabatt just nu) blir hjältekort; resten i rutnätet.
  // Före första sänkningen (alla 0 %) leder första platsen (kurerad ordning).
  const sorted = [...live].sort((a, b) => b.discountPercent - a.discountPercent || a.slot - b.slot);
  const hero = sorted[0] ?? null;
  const rest = sorted.slice(1);
  // Dagsdramaturgins klocka: dagens startAt (alla live delar samma auktionsdag).
  const startAt = hero?.startAt ?? null;

  return (
    <>
      <AuctionStage startAt={startAt}>
        <section className="sec auction-hero">
          <div className="container">
            {/* Lede-texten ligger som SYSKON till sechead så mobilen kan
                komponera om ordningen med flex-order (produkten först). */}
            <div className="sechead a-sechead">
              <div className="eyebrow a-eyebrow">Fyndauktionen</div>
              <h1 className="a-title">
                Priset sjunker <span className="a-hot">varje timme</span> – tills någon köper
              </h1>
            </div>
            <p className="a-lede">
              Varje dag kl 07 startar dagens fynd på ordinarie pris. Sedan sänks priset varje
              timme fram till kl 19 – tills någon slår till. Väntar du får du det billigare.
              Väntar du för länge hinner någon annan före.
            </p>

            <div className="auction-how a-how">
              <div><b>1.</b> Kl 07 – ordinarie pris</div>
              <div><b>2.</b> Sänks varje timme</div>
              <div><b>3.</b> Köpt = borta direkt</div>
            </div>

            <AuctionClimax startAt={startAt} />
            <AuctionFuse startAt={startAt} />

            {hero ? (
              <>
                <AuctionHeroCard a={hero} />
                <AuctionLiveBar a={hero} />
                {rest.length > 0 && (
                  <div className="grid auction-grid a-grid">
                    {rest.map((a) => (
                      <AuctionCard a={a} key={a.slug} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="auction-empty a-empty">
                Nästa auktionsdag startar kl 07 — titta tillbaka då, eller prenumerera nedan så
                missar du inget.
              </p>
            )}

            <p className="auction-fineprint a-fineprint">
              Startpriset är produktens ordinarie pris hos oss. Auktionsdagen pågår kl 07–19; säljs
              inget återgår priset till ordinarie och nya fynd startar nästa morgon. Varje fynd
              säljs bara en gång – i samma stund som någon köper det försvinner det från auktionen.
              Vanlig ångerrätt och 30 dagars öppet köp gäller precis som på allt annat hos
              Fyndplats.
            </p>
          </div>
        </section>

        {sold.length > 0 && (
          <section className="sec" style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="sechead">
                <div className="eyebrow a-eyebrow">Nyss avgjorda</div>
                <h2 className="a-title">Senast sålda fynd</h2>
              </div>
              <ul className="auction-sold-list a-sold">
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
      </AuctionStage>

      <Newsletter />
    </>
  );
}
