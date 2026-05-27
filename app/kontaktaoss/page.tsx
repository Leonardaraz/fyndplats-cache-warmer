import type { Metadata } from "next";
import { ContentPage } from "../../components/content";
import { ContactForm } from "../../components/contactform";

export const metadata: Metadata = {
  title: "Kontakta oss",
  description: "Hör av dig till Fyndplats kundtjänst – e-post, telefon eller kontaktformulär. Vi svarar normalt inom 24 timmar, vardagar 09–17.",
  alternates: { canonical: "https://www.fyndplats.se/kontaktaoss" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/kontaktaoss", title: "Kontakta oss", description: "Hör av dig till Fyndplats kundtjänst – e-post, telefon eller kontaktformulär. Vi svarar normalt inom 24 timmar, vardagar 09–17.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg"] },
};

export default function Kontakta() {
  return (
    <ContentPage
      eyebrow="Kundservice"
      title="Kontakta oss"
      lead="Vi finns här när du behöver oss. Hör av dig på det sätt som passar dig bäst – vi svarar normalt inom 24 timmar."
    >
      <div className="cards3">
        <div className="cc"><h4>E-post</h4><p><a href="mailto:info@fyndplats.com">info@fyndplats.com</a></p></div>
        <div className="cc"><h4>Telefon</h4><p><a href="tel:+46736630990">073-663 09 90</a></p></div>
        <div className="cc"><h4>Adress</h4><p>Bergviksgatan 10</p><p>152 44 Södertälje</p></div>
      </div>

      <div className="callout">
        <p><strong>Svarstider:</strong> Vi besvarar mejl och samtal måndag–fredag kl. 09:00–17:00. Mejl som kommer in efter 16:00 besvaras normalt nästa arbetsdag. Vi strävar efter att svara inom 24 timmar på alla förfrågningar.</p>
      </div>

      <h2>Skicka ett meddelande</h2>
      <p>Fyll i formuläret så återkommer vi så snart vi kan. Har du en pågående order? Ange gärna ditt ordernummer.</p>
      <ContactForm />
    </ContentPage>
  );
}
