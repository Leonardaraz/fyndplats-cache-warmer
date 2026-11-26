import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import { AuctionCard } from "../../components/auction-card";
import { AuctionHeroCard } from "../../components/auction-hero-card";
import { AuctionStage } from "../../components/auction-stage";
import { AuctionFuse } from "../../components/auction-fuse";
import { AuctionClimax } from "../../components/auction-climax";
import { AuctionLiveBar } from "../../components/auction-live-bar";
import { AuctionEmpty } from "../../components/auction-empty";
import { AuctionSteps } from "../../components/auction-steps";
import { FyndFilm } from "../../components/fyndfilm";
import { nastaStartMs, startDagText, tomtLage } from "../../components/auction-next-start";
import { Newsletter } from "../../components/newsletter";
import { getLiveAuctions, getSoldAuctions, type SoldAuctionView } from "../../lib/auction-view";
import { fyndlage } from "../../lib/auction-day";
import { auktionsbeskrivning } from "../../lib/auction-beskrivning";
import { tightFillUrl } from "../../lib/wix-image";
import { aktivFilm } from "../../lib/fyndfilm";
import styles from "./fyndauktion.module.css";

// Auktionssidan behöver kort ISR-fönster: priserna stegar (cron på timmen) och
// nedräkningen på klienten triggar refresh vid steggränsen. 30 s: vid timslaget
// ska det nya priset nå en öppen flik inom någon minut (2026-09-28).
//
// Fönstret räcker inte ensamt. Sidan (30 s) och dess hämtning av raderna (15 s)
// serverar båda det gamla en gång till innan de byggs om, så "Priset
// uppdateras…" stod kvar i ~2,5 minuter efter timslaget. Sedan 2026-10-21 töms
// sidan i stället när motorn bytt priserna (runt HH:00:25, uppmätt): se
// app/api/admin/uppdatera-produkter.
export const revalidate = 30;

/**
 * Fynden sidan visar, hämtade EN gång per sidbygge. Både beskrivningen
 * (generateMetadata) och sidan läser dem, och utan `cache` hade varje bygge
 * frågat motorn och Wix två gånger (getFreshPrices frågar Wix om fyndens priser).
 */
const visadeFynd = cache(() => getLiveAuctions({ sida: "fyndauktion" }));

// ☠️ BESKRIVNINGEN NÄMNER DET ANTAL FYND SOM VISAS, ALDRIG ETT FAST TAL (Leonard
// 2026-11-21). Här stod "Fem fynd varje dag" medan sidan hade tio, och Black
// Week har 50 och 100. Talet räknas ur samma rader som korten ritas av
// (fyndlage i lib/auction-day.ts), och reglerna för orden står i
// lib/auction-beskrivning.ts. Därför generateMetadata och inte en konstant.
export async function generateMetadata(): Promise<Metadata> {
  // Faller läsningen får beskrivningen texten utan antal. Sidan själv läser
  // samma (sparade) svar och hanterar felet som förut.
  const live = await visadeFynd().catch(() => []);
  return {
    // Titeln får INTE innehålla "| Fyndplats" — layoutens mall lägger på det, och
    // summan måste rymmas under Googles ~60 tecken. Förra titeln var 59 tecken
    // och blev 72 med suffixet, alltså kapad i sökresultatet.
    title: "Fyndauktionen – priset sjunker varje timme",
    // Högst ~155 tecken: Google klipper snippeten runt 160 och en äldre text var
    // 198, så sista meningen syntes aldrig. Längden är låst i
    // lib/auction-beskrivning.test.ts för upp till 999 fynd.
    description: auktionsbeskrivning(fyndlage(live, live[0]?.serverNowMs ?? Date.now())),
    alternates: { canonical: "https://www.fyndplats.se/fyndauktion" },
    openGraph: {
      title: "Fyndauktionen – priset sjunker varje timme tills någon köper",
      // Utan antal med flit: chattappar och Facebook sparar delningstexten per
      // adress i veckor, så ett tal här hade varit fel långt efter dagen.
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
}

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

/** Reklamfilmen (lib/fyndfilm.ts), om den gäller vid renderingen, och tiden den prövades mot. */
function filmNu() {
  const nu = Date.now();
  return { nu, film: aktivFilm(nu) };
}

/** Det tomma läget och startdagen enligt serverns klocka vid renderingen. */
function tomtLageNu() {
  const nu = Date.now();
  return { lage: tomtLage(nu), dagText: startDagText(nastaStartMs(nu), nu) };
}

export default async function Fyndauktion() {
  const [live, sold] = await Promise.all([visadeFynd(), getSoldAuctions(6)]);

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

  // Reklamfilmen står i studion tills den slutar gälla.
  const { nu, film } = filmNu();

  return (
    <>
      <AuctionStage startAt={startAt}>
        {/* STUDION (Leonard 2026-11-26): rubriken, filmen, stubinen och dagens
            hetaste fynd står i en fotostudio med ljuskägla och golv
            (fyndauktion.module.css, "Studion"). Rutnätet, stegen och de sålda
            står under den, i scenens egna färger. */}
        <section
          className={`sec auction-hero ${styles.hero} ${styles.studio}${film ? " " + styles.medFilm : ""}${hero ? "" : " " + styles.isEmpty}`}
        >
          <div className={styles.ljus} aria-hidden="true" />
          <div className={styles.golv} aria-hidden="true" />
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
            {film && <FyndFilm film={film} lage="studio" nuMs={nu} />}

            <AuctionClimax startAt={startAt} />
            <AuctionFuse startAt={startAt} />

            {hero ? (
              <AuctionHeroCard a={hero} />
            ) : (
              <AuctionEmpty lage={lage} dagText={dagText}>
                {sold.length > 0 && <SenastSalda sold={sold} />}
              </AuctionEmpty>
            )}
          </div>
        </section>

        <section className={`sec ${styles.utbud}`}>
          <div className="container">
            {/* Pillen är fast placerad på mobilen och ligger utanför studion:
                studions innehåll är en egen staplingsordning, och pillen hade
                hamnat under rutnätet. */}
            {hero && <AuctionLiveBar a={hero} />}
            {rest.length > 0 && (
              <div className="grid auction-grid a-grid">
                {rest.map((a) => (
                  <AuctionCard a={a} key={a.slug} />
                ))}
              </div>
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
