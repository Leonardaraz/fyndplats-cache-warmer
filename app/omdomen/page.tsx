import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Omdömen",
  description: "Fyndplats har 4,9 av 5 i betyg på Google, baserat på 20 omdömen. Trygg svensk e-handel som kunderna rekommenderar.",
  alternates: { canonical: "https://www.fyndplats.se/omdomen" },
};

export default function Omdomen() {
  return (
    <ContentPage
      eyebrow="Omdömen"
      title="Våra kunder vet bäst"
      lead="Vi mäter oss i nöjda kunder. Här är vårt samlade betyg – och en inbjudan att dela din egen upplevelse."
    >
      <div className="ratinghero">
        <div className="ratingbig">4,9</div>
        <div className="ratingstars">★★★★★</div>
        <div className="ratingsub">Genomsnittligt betyg på Google · baserat på 20 omdömen</div>
      </div>

      <div className="callout" style={{ textAlign: "center" }}>
        <p>Tack till alla som handlat hos oss och lämnat ett omdöme. Din feedback hjälper oss att bli bättre – och andra att handla tryggt.</p>
      </div>

      <h2>Har du handlat hos oss?</h2>
      <p>Vi blir glada för varje omdöme. Berätta gärna om din upplevelse, eller hör av dig direkt om något inte blev som du förväntade dig – vi löser det.</p>
      <p><a href="/kontaktaoss">Kontakta oss</a> så hjälper vi dig, eller läs våra <a href="/vanliga-fragor">vanliga frågor</a>.</p>
    </ContentPage>
  );
}
