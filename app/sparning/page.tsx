import type { Metadata } from "next";
import { TrackingWidget } from "../../components/tracking";

export const metadata: Metadata = {
  title: "Spåra din beställning",
  description: "Följ ditt paket hela vägen hem. Ange ditt spårningsnummer så visar vi var det är.",
  alternates: { canonical: "https://www.fyndplats.se/sparning" },
  robots: { index: false, follow: true },
};

export default function Sparning() {
  return (
    <>
      <div className="pagehero">
        <div className="container">
          <div className="eyebrow">Spårning</div>
          <h1>Var är ditt fynd?</h1>
          <p className="pagelede">Klistra in ditt spårningsnummer nedan, så visar vi precis var paketet är – hela vägen hem till din dörr.</p>
        </div>
      </div>
      <section className="sec" style={{ paddingTop: 38 }}>
        <div className="container-narrow">
          <TrackingWidget />
          <div className="callout" style={{ marginTop: 30 }}>
            <p>Ingen rörelse i spårningen på ett tag? Det är helt normalt mellan skanningar. Hör gärna av dig till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> om du undrar.</p>
          </div>
        </div>
      </section>
    </>
  );
}
