import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Kundtjänst",
  description: "Fyndplats kundtjänst – hitta svar om frakt, returer och betalning, eller kontakta oss direkt. Vi svarar normalt inom 24 timmar.",
  alternates: { canonical: "https://www.fyndplats.se/kundtjanst" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/kundtjanst", title: "Kundtjänst", description: "Fyndplats kundtjänst – hitta svar om frakt, returer och betalning, eller kontakta oss direkt. Vi svarar normalt inom 24 timmar.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg"] },
};

export default function Kundtjanst() {
  return (
    <ContentPage
      eyebrow="Hjälp"
      title="Kundtjänst"
      lead="Vad kan vi hjälpa dig med? Hitta snabba svar nedan, eller kontakta oss direkt – vi svarar normalt inom 24 timmar."
    >
      <div className="cards3">
        <div className="cc"><h4>Vanliga frågor</h4><p>Svar om frakt, betalning och leverans.</p><p><a href="/vanliga-fragor">Till FAQ →</a></p></div>
        <div className="cc"><h4>Returer &amp; ångerrätt</h4><p>30 dagars öppet köp – så gör du.</p><p><a href="/returer">Läs om returer →</a></p></div>
        <div className="cc"><h4>Kontakta oss</h4><p>Mejl, telefon och formulär.</p><p><a href="/kontaktaoss">Hör av dig →</a></p></div>
      </div>

      <h2>Snabba fakta</h2>
      <ul>
        <li><strong>Frakt:</strong> 19 kr inom Sverige, fri frakt över 499 kr.</li>
        <li><strong>Leveranstid:</strong> normalt 3–7 arbetsdagar, med spårning via mejl.</li>
        <li><strong>Betalning:</strong> tryggt med Klarna – direkt, faktura eller delbetalning.</li>
        <li><strong>Öppet köp:</strong> 30 dagar (lagens 14 dagars ångerrätt förlängd av oss).</li>
      </ul>

      <h2>Mer information</h2>
      <ul>
        <li><a href="/kopvillkor">Köpvillkor</a> – fullständiga villkor för köp hos Fyndplats</li>
        <li><a href="/sekretesspolicy">Sekretesspolicy</a> – så hanterar vi dina personuppgifter</li>
        <li><a href="/vara-butikspolicyer">Våra butikspolicyer</a> – företagsuppgifter och impressum</li>
      </ul>

      <div className="callout">
        <p>Når du oss inte direkt? Mejla <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> eller ring <a href="tel:+46736630990">073-663 09 90</a> (vardagar 09–17).</p>
      </div>
    </ContentPage>
  );
}
