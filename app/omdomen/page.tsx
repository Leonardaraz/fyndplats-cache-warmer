import type { Metadata } from "next";
import { jsonLdString } from "../../lib/seo";
import { getSocialProof } from "../../lib/social-proof-live";
import { getGoogleReviews } from "../../lib/google-reviews";
import { CURATED_RESULT } from "../../lib/curated-reviews";
import { initialer } from "../../lib/initialer";
import { GoogleReviews } from "../../components/GoogleReviews";
import { AnimatedRating } from "../../components/AnimatedRating";
import s from "./omdomen.module.css";

// Omdömen (2026-09-30). Samma datakällor som förut, i Om oss-sidans formspråk
// (om-* i app/globals.css): hero med det animerade betyget, faktarad,
// omdömeskorten och en avslutande CTA.
//
// Betyget kommer bara från getSocialProof (samma som sidfoten och /omoss).
// Inget antal omdömen visas, av skälen i lib/social-proof.ts, och inget
// aggregateRating i JSON-LD: ett betyg om butiken själv är "self-serving".

// "Se alla på Google"-knappen → Fyndplats officiella Google-företagsprofil
// (delningslänken från profilen). Verifierbart: besökaren klickar och ser alla
// riktiga omdömen på Google — och hur många de är, där siffran faktiskt är sann.
// Kan överstyras via GOOGLE_REVIEW_URL.
const GOOGLE_PROFILE_FALLBACK = "https://share.google/vFyQAMJtWN51kboYA";

// generateMetadata (inte en statisk `metadata`): beskrivningen innehåller
// betyget, och det kommer från Google när API:t svarar. En statisk export hade
// frusit reservsiffran i sidans meta medan sidans egen text visade den riktiga.
export async function generateMetadata(): Promise<Metadata> {
  const proof = await getSocialProof();
  const ratingDesc = `Fyndplats har ${proof.rating} av 5 i betyg på Google. Trygg svensk e-handel som kunderna rekommenderar.`;
  return {
  title: "Omdömen",
  description: ratingDesc,
  alternates: { canonical: "https://www.fyndplats.se/omdomen" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/omdomen", title: "Omdömen", description: ratingDesc, images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
  };
}

const Ikon = {
  stjarna: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />,
  service: <path d="M4 13v-1a8 8 0 0 1 16 0v1 M4 13h3v6H5a1 1 0 0 1-1-1v-5Z M20 13h-3v6h2a1 1 0 0 0 1-1v-5Z M17 19c0 1.5-2 2.5-5 2.5" />,
  fraga: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7 M12 17h.01" />,
};

function Svg({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
    { "@type": "ListItem", position: 2, name: "Omdömen", item: "https://www.fyndplats.se/omdomen" },
  ],
};

export default async function Omdomen() {
  // Live Google-omdömen via API:t när det är aktiverat; annars de kurerade
  // (handinlagda, äkta) omdömena så sidan alltid har riktiga omdömen att läsa.
  const google = await getGoogleReviews();
  const data = google.reviews.length > 0 ? google : CURATED_RESULT;
  // Bara initialer och ett löpnummer går vidare till sidan, aldrig hela
  // namnet (lib/initialer.ts, Leonard 2026-10-07). GoogleReviews är en
  // klientkomponent, så allt den får hamnar i sidans React-data.
  const omdomen = data.reviews.map((r, i) => ({ ...r, id: `omdome-${i}`, author: initialer(r.author) }));
  const profileUrl = process.env.GOOGLE_REVIEW_URL || GOOGLE_PROFILE_FALLBACK;
  // Rubriken och korten ska visa SAMMA betyg. proof är den enda källan:
  // Googles eget när API:t svarar, annars det handavlästa.
  const proof = await getSocialProof();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      <div className={s.sida}>
        <section className="om-hero">
          <div className={`container ${s.heroGrid}`}>
            <div>
              <div className="eyebrow">Omdömen</div>
              <h1>Omdömen från våra kunder</h1>
              <p className="om-lede">
                Vi mäter oss i nöjda kunder. Här är vårt samlade betyg – och en inbjudan att dela din egen upplevelse.
              </p>
              <div className="om-cta">
                <a className="btn btn-primary" href="#google-omdomen">Läs omdömena</a>
                <a className="btn btn-ghost" href={profileUrl} target="_blank" rel="noopener noreferrer">Vår profil på Google</a>
              </div>
            </div>
            <div className={s.betygKort}>
              <div className="ratinghero">
                <AnimatedRating rating={proof.ratingValue || 5} />
                <div className="ratingsub">av 5 i genomsnittligt betyg på Google</div>
              </div>
            </div>
          </div>
        </section>

        <section className="om-fakta" aria-label="Fyndplats i korthet">
          <div className="container om-fakta-grid">
            <a className="om-fakta-kort" href={profileUrl} target="_blank" rel="noopener noreferrer">
              <b>{proof.rating}<small> av 5</small></b>
              <span>Betyg på Google <span className="star" aria-hidden="true">★★★★★</span></span>
            </a>
            <div className="om-fakta-kort">
              <b>2021</b>
              <span>Grundat i Södertälje</span>
            </div>
            <div className="om-fakta-kort">
              <b>30 dagar</b>
              <span>Att ångra eller returnera</span>
            </div>
            <div className="om-fakta-kort">
              <b>Klarna</b>
              <span>Trygg betalning</span>
            </div>
          </div>
        </section>

        <section className={`om-sektion ${s.omdomen}`}>
          <div className="container">
            <p className={s.tack}>
              Tack till alla som handlat hos oss och lämnat ett omdöme. Din feedback hjälper oss att bli bättre – och andra att handla tryggt.
            </p>
            <GoogleReviews
              reviews={omdomen}
              average={proof.ratingValue}
              profileUrl={profileUrl}
            />
          </div>
        </section>

        <section className="om-sektion">
          <div className="container">
            <div className="om-rubrikrad">
              <div>
                <div className="eyebrow">Din upplevelse</div>
                <h2>Har du handlat hos oss?</h2>
              </div>
            </div>
            <div className={`om-loften-grid ${s.tre}`}>
              <div className="om-lofte">
                <span className="om-ikon"><Svg d={Ikon.stjarna} /></span>
                <h3>Berätta om din upplevelse</h3>
                <p>Vi blir glada för varje omdöme. Berätta gärna om din upplevelse.</p>
                <a className="btn-quiet" href={profileUrl} target="_blank" rel="noopener noreferrer">Vår profil på Google</a>
              </div>
              <div className="om-lofte">
                <span className="om-ikon"><Svg d={Ikon.service} /></span>
                <h3>Blev något fel?</h3>
                <p>Hör av dig direkt om något inte blev som du förväntade dig – vi löser det.</p>
                <a className="btn-quiet" href="/kontaktaoss">Kontakta oss</a>
              </div>
              <div className="om-lofte">
                <span className="om-ikon"><Svg d={Ikon.fraga} /></span>
                <h3>Har du en fråga?</h3>
                <p>Svar om beställning, betalning, frakt och returer finns samlade på ett ställe.</p>
                <a className="btn-quiet" href="/vanliga-fragor">Vanliga frågor</a>
              </div>
            </div>
          </div>
        </section>

        <section className="om-slut">
          <div className="container om-slut-inner">
            <h2>Redo för nästa fynd?</h2>
            <p>Trygg betalning med Klarna, 30 dagars öppet köp och kundservice på svenska.</p>
            <div className="om-cta">
              <a className="btn btn-primary" href="/butik">Till butiken</a>
              <a className="btn om-btn-ljus" href="/omoss">Om Fyndplats</a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
