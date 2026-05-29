import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Omdömen",
  description: "Fyndplats har 4,9 av 5 i betyg på Google, baserat på 21 omdömen. Trygg svensk e-handel som kunderna rekommenderar.",
  alternates: { canonical: "https://www.fyndplats.se/omdomen" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/omdomen", title: "Omdömen", description: "Fyndplats har 4,9 av 5 i betyg på Google, baserat på 21 omdömen. Trygg svensk e-handel som kunderna rekommenderar.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg"] },
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
        <div className="ratingsub">Genomsnittligt betyg på Google · baserat på 21 omdömen</div>
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
