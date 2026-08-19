import type { Metadata } from "next";
import { ContentPage } from "../../components/content";
import { getSocialProof } from "../../lib/social-proof-live";
import { getGoogleReviews } from "../../lib/google-reviews";
import { CURATED_RESULT } from "../../lib/curated-reviews";
import { GoogleReviews } from "../../components/GoogleReviews";
import { AnimatedRating } from "../../components/AnimatedRating";

// "Se alla på Google"-knappen → Fyndplats officiella Google-företagsprofil
// (delningslänken från profilen). Verifierbart: besökaren klickar och ser alla
// riktiga omdömen på Google (antalet: GOOGLE_REVIEW_COUNT i lib/social-proof).
// Kan överstyras via GOOGLE_REVIEW_URL.
const GOOGLE_PROFILE_FALLBACK = "https://share.google/vFyQAMJtWN51kboYA";

// generateMetadata (inte en statisk `metadata`): beskrivningen innehåller
// betyget och antalet, och de kommer från Google när API:t svarar. En statisk
// export hade frusit reservsiffrorna i sidans meta medan sidans egen text visade
// de riktiga.
export async function generateMetadata(): Promise<Metadata> {
  const proof = await getSocialProof();
  const ratingDesc = `Fyndplats har ${proof.rating} av 5 i betyg på Google, baserat på ${proof.label}. Trygg svensk e-handel som kunderna rekommenderar.`;
  return {
  title: "Omdömen",
  description: ratingDesc,
  alternates: { canonical: "https://www.fyndplats.se/omdomen" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/omdomen", title: "Omdömen", description: ratingDesc, images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
  };
}

export default async function Omdomen() {
  // Live Google-omdömen via API:t när det är aktiverat; annars de kurerade
  // (handinlagda, äkta) omdömena så sidan alltid har riktiga omdömen att läsa.
  const google = await getGoogleReviews();
  const data = google.reviews.length > 0 ? google : CURATED_RESULT;
  const profileUrl = process.env.GOOGLE_REVIEW_URL || GOOGLE_PROFILE_FALLBACK;
  // Rubriken och korten ska visa SAMMA siffror. proof är den enda källan:
  // Googles egna när API:t svarar, annars de handavlästa.
  const proof = await getSocialProof();

  return (
    <ContentPage
      eyebrow="Omdömen"
      title="Våra kunder vet bäst"
      lead="Vi mäter oss i nöjda kunder. Här är vårt samlade betyg – och en inbjudan att dela din egen upplevelse."
    >
      <div className="ratinghero">
        <AnimatedRating rating={proof.ratingValue || 5} />
        <div className="ratingsub">Genomsnittligt betyg på Google · baserat på {proof.label}</div>
      </div>

      <div className="callout" style={{ textAlign: "center" }}>
        <p>Tack till alla som handlat hos oss och lämnat ett omdöme. Din feedback hjälper oss att bli bättre – och andra att handla tryggt.</p>
      </div>

      <GoogleReviews
        reviews={data.reviews}
        count={proof.count}
        average={proof.ratingValue}
        profileUrl={profileUrl}
      />

      <h2>Har du handlat hos oss?</h2>
      <p>Vi blir glada för varje omdöme. Berätta gärna om din upplevelse, eller hör av dig direkt om något inte blev som du förväntade dig – vi löser det.</p>
      <p><a href="/kontaktaoss">Kontakta oss</a> så hjälper vi dig, eller läs våra <a href="/vanliga-fragor">vanliga frågor</a>.</p>
    </ContentPage>
  );
}
