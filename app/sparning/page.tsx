import type { Metadata } from "next";
import { jsonLdString } from "../../lib/seo";
import { TrackingWidget } from "../../components/tracking";
import { DELIVERY_TIME } from "../../lib/shipping";
import s from "./sparning.module.css";

// Spåra paket (2026-09-30). Formuläret (components/tracking.tsx) är oförändrat
// och står i fokus i heron. Under det förklaras de fem stegen som widgeten
// visar (Beställd → Levererad), med samma ord som spårningen, Vanliga frågor
// och den tidigare rutan om skanningar.

export const metadata: Metadata = {
  title: "Spåra din beställning",
  description: "Följ ditt paket hela vägen hem. Ange ditt spårningsnummer så visar vi var det är.",
  alternates: { canonical: "https://www.fyndplats.se/sparning" },
  robots: { index: false, follow: true },
};

const STEG = [
  { namn: "Beställd", text: "Ordern är registrerad och packas på lager inom EU." },
  { namn: "Skickad", text: "När paketet lämnar lagret får du en spårningskod via mejl. Ibland tar det 1–2 dagar innan spårningen aktiveras." },
  { namn: "På väg", text: "Paketet rör sig hos fraktbolaget. Står spårningen still en stund är det helt normalt mellan skanningar." },
  { namn: "Nära dig", text: "Paketet är ute för leverans eller finns att hämta. Hämta det inom utlämningstiden." },
  { namn: "Levererad", text: `Vanlig leveranstid är ${DELIVERY_TIME} från beställning.` },
];

export default function Sparning() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Spåra paket", item: "https://www.fyndplats.se/sparning" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />

      <section className={`om-hero ${s.hero}`}>
        <div className="container">
          <div className={s.heroText}>
            <div className="eyebrow">Spårning</div>
            <h1>Var är ditt fynd?</h1>
            <p className="om-lede">Klistra in ditt spårningsnummer nedan, så visar vi precis var paketet är – hela vägen hem till din dörr.</p>
          </div>
          <div className={s.sok}>
            <TrackingWidget />
          </div>
        </div>
      </section>

      <section className="om-sektion">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Leveransen</div>
              <h2>Så går leveransen till</h2>
            </div>
          </div>
          <ol className={`om-tid ${s.steg}`}>
            {STEG.map((st, i) => (
              <li key={st.namn}>
                <span className="om-tid-nar">Steg {i + 1}</span>
                <h3>{st.namn}</h3>
                <p>{st.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`om-sektion ${s.hjalpSek}`}>
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Hjälp</div>
              <h2>Frågor om ditt paket</h2>
            </div>
          </div>
          <div className="om-kontakt-grid">
            <div className="om-kontakt">
              <h3>Ingen rörelse i spårningen?</h3>
              <p>Det är helt normalt mellan skanningar. Hör gärna av dig till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> om du undrar.</p>
            </div>
            <div className="om-kontakt">
              <h3>Vill du ångra köpet?</h3>
              <p>Ångerrätten gäller även innan paketet hunnit fram.</p>
              <p className="om-not"><a href="/angra-kop">Ångra köp</a> · <a href="/returer">Returer &amp; ångerrätt</a></p>
            </div>
            <div className="om-kontakt">
              <h3>Kundservice</h3>
              <p><a href="mailto:info@fyndplats.com">info@fyndplats.com</a><br /><a href="tel:+46736630990">073-663 09 90</a></p>
              <p className="om-not">Telefon vardagar 09–17. Vi svarar normalt inom 24 timmar.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
