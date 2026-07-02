import type { Metadata } from "next";
import { ContentPage } from "../../components/content";
import { GOOGLE_RATING, GOOGLE_REVIEWS_LABEL } from "../../lib/social-proof";
import { getGoogleReviews } from "../../lib/google-reviews";
import { CURATED_RESULT } from "../../lib/curated-reviews";
import { GoogleReviews } from "../../components/GoogleReviews";
import { AnimatedRating } from "../../components/AnimatedRating";

// Publik fallback-länk till Google-profilen (för "Se alla på Google"-knappen)
// tills exakt profil-URL sätts via GOOGLE_REVIEW_URL.
const GOOGLE_PROFILE_FALLBACK =
  "https://www.google.com/search?q=Fyndplats%20S%C3%B6dert%C3%A4lje%20omd%C3%B6men";

const ratingDesc = `Fyndplats har ${GOOGLE_RATING} av 5 i betyg på Google, baserat på ${GOOGLE_REVIEWS_LABEL}. Trygg svensk e-handel som kunderna rekommenderar.`;

export const metadata: Metadata = {
  title: "Omdömen",
  description: ratingDesc,
  alternates: { canonical: "https://www.fyndplats.se/omdomen" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/omdomen", title: "Omdömen", description: ratingDesc, images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
};

export default async function Omdomen() {
  // Live Google-omdömen via API:t när det är aktiverat; annars de kurerade
  // (handinlagda, äkta) omdömena så sidan alltid har riktiga omdömen att läsa.
  const google = await getGoogleReviews();
  const data = google.reviews.length > 0 ? google : CURATED_RESULT;
  const profileUrl = process.env.GOOGLE_REVIEW_URL || GOOGLE_PROFILE_FALLBACK;

  return (
    <ContentPage
      eyebrow="Omdömen"
      title="Våra kunder vet bäst"
      lead="Vi mäter oss i nöjda kunder. Här är vårt samlade betyg – och en inbjudan att dela din egen upplevelse."
    >
      <div className="ratinghero">
        <AnimatedRating rating={Number(GOOGLE_RATING.replace(",", ".")) || 5} />
        <div className="ratingsub">Genomsnittligt betyg på Google · baserat på {GOOGLE_REVIEWS_LABEL}</div>
      </div>

      <div className="callout" style={{ textAlign: "center" }}>
        <p>Tack till alla som handlat hos oss och lämnat ett omdöme. Din feedback hjälper oss att bli bättre – och andra att handla tryggt.</p>
      </div>

      <GoogleReviews
        reviews={data.reviews}
        count={data.count}
        average={data.average}
        profileUrl={profileUrl}
      />

      <h2>Har du handlat hos oss?</h2>
      <p>Vi blir glada för varje omdöme. Berätta gärna om din upplevelse, eller hör av dig direkt om något inte blev som du förväntade dig – vi löser det.</p>
      <p><a href="/kontaktaoss">Kontakta oss</a> så hjälper vi dig, eller läs våra <a href="/vanliga-fragor">vanliga frågor</a>.</p>
    </ContentPage>
  );
}
