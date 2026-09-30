import type { Metadata } from "next";
import Image from "next/image";
import { AuctionCard } from "../../components/auction-card";
import { AuctionHeroCard } from "../../components/auction-hero-card";
import { AuctionStage } from "../../components/auction-stage";
import { AuctionFuse } from "../../components/auction-fuse";
import { AuctionClimax } from "../../components/auction-climax";
import { AuctionLiveBar } from "../../components/auction-live-bar";
import { AuctionEmpty } from "../../components/auction-empty";
import { AuctionSteps } from "../../components/auction-steps";
import { nastaStartMs, startDagText, tomtLage } from "../../components/auction-next-start";
import { Newsletter } from "../../components/newsletter";
import { getLiveAuctions, getSoldAuctions, type SoldAuctionView } from "../../lib/auction-view";
import { tightFillUrl } from "../../lib/wix-image";
import styles from "./fyndauktion.module.css";

// Auktionssidan behöver kort ISR-fönster: priserna stegar (cron på timmen) och
// nedräkningen på klienten triggar refresh vid steggränsen. 30 s: vid timslaget
// ska det nya priset nå en öppen flik inom någon minut (2026-09-28).
export const revalidate = 30;

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

/** Foten i det tomma kortet: de tre senast sålda fynden, som bevis på att
 *  auktionen lever även när dagens lista är tom. Hela listan ligger längre ned. */
function SenastSalda({ sold }: { sold: SoldAuctionView[] }) {
  return (
    <div className={styles.soldRow}>
      <div className={styles.soldHead}>
        <h3 className={styles.soldTitle}>Senast sålda</h3>
        <a className={styles.soldAll} href="#salda">
          Alla sålda fynd <span aria-hidden="true">↓</span>
        </a>
      </div>
      <ul className={styles.soldItems}>
        {sold.slice(0, 3).map((s) => (
          <li key={s.slug + s.endedAt}>
            <a className={styles.soldItem} href={`/produkt/${s.slug}`}>
              <span className={styles.soldImg}>
                {s.img && (
                  <Image src={tightFillUrl(s.img, 120, 120)} alt="" fill sizes="56px" style={{ objectFit: "contain" }} />
                )}
              </span>
              <span className={styles.soldInfo}>
                <span className={styles.soldName}>{s.name}</span>
                <span className={styles.soldPrice}>
                  Såld för <b>{s.soldPrice.toLocaleString("sv-SE")} kr</b>
                  {s.discountPercent > 0 && <em> −{s.discountPercent}%</em>}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Det tomma läget och startdagen enligt serverns klocka vid renderingen. */
function tomtLageNu() {
  const nu = Date.now();
  return { lage: tomtLage(nu), dagText: startDagText(nastaStartMs(nu), nu) };
}

export default async function Fyndauktion() {
  const [live, sold] = await Promise.all([getLiveAuctions(), getSoldAuctions(6)]);

  // Flaggskeppet (störst rabatt just nu) blir hjältekort; resten i rutnätet.
  // Före första sänkningen (alla 0 %) leder första platsen (kurerad ordning).
  const sorted = [...live].sort((a, b) => b.discountPercent - a.discountPercent || a.slot - b.slot);
  const hero = sorted[0] ?? null;
  const rest = sorted.slice(1);
  // Dagsdramaturgins klocka: dagens startAt (alla live delar samma auktionsdag).
  const startAt = hero?.startAt ?? null;

  // Det tomma läget enligt serverns klocka. Kortet tar över med klientens
  // klocka efter mount (components/auction-empty.tsx).
  const { lage, dagText } = tomtLageNu();

  return (
    <>
      <AuctionStage startAt={startAt}>
        <section className={`sec auction-hero ${styles.hero}${hero ? "" : " " + styles.isEmpty}`}>
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
              timme fram till kl 19. Väntar du blir det billigare – väntar du för länge hinner
              någon annan före.
            </p>

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
              <AuctionEmpty lage={lage} dagText={dagText}>
                {sold.length > 0 && <SenastSalda sold={sold} />}
              </AuctionEmpty>
            )}

            <AuctionSteps />
          </div>
        </section>

        {sold.length > 0 && (
          <section id="salda" className={`sec ${styles.soldSec}`} style={{ paddingTop: 0 }}>
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

      {/* Ankaret för det tomma kortets "Prenumerera"-länk. */}
      <div id="nyhetsbrev" className={styles.nlAnchor}>
        <Newsletter />
      </div>
    </>
  );
}
