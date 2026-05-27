import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Våra butikspolicyer",
  description: "Information om Fyndplats – företagsuppgifter, impressum och våra policyer för en trygg shoppingupplevelse.",
  alternates: { canonical: "https://www.fyndplats.se/vara-butikspolicyer" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/vara-butikspolicyer", title: "Våra butikspolicyer", description: "Information om Fyndplats – företagsuppgifter, impressum och våra policyer för en trygg shoppingupplevelse.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg"] },
};

export default function Butikspolicyer() {
  return (
    <ContentPage
      eyebrow="Information"
      title="Våra butikspolicyer"
      lead="Vi grundade Fyndplats med en målsättning: att erbjuda en rättvis, fördelaktig och trivsam shoppingupplevelse. Bättre service ger lojala kunder – så jobbar vi varje dag."
    >
      <p>Nedan hittar du våra företagsuppgifter. Behöver du mer information är du alltid välkommen att <a href="/kontaktaoss">kontakta oss</a>.</p>

      <h2>Impressum</h2>
      <div className="callout">
        <p>
          <strong>Fyndplats</strong><br />
          Bergviksgatan 10<br />
          152 44 Södertälje, Sverige<br />
          Telefon: +46 (0) 73 663 09 90<br />
          E-post: <a href="mailto:info@fyndplats.com">info@fyndplats.com</a><br />
          Webbplats: www.fyndplats.se
        </p>
        <p style={{ marginTop: 12 }}>
          Ansvarig utgivare: A. Leonard<br />
          Organisationsnummer: 199509144037<br />
          Utfärdande myndighet: Skatteverket<br />
          Momsregistreringsnummer: SE199509144037 01
        </p>
      </div>

      <h2>Relaterade sidor</h2>
      <ul>
        <li><a href="/returer">Returer &amp; ångerrätt</a></li>
        <li><a href="/sekretesspolicy">Sekretesspolicy</a></li>
        <li><a href="/vanliga-fragor">Vanliga frågor</a></li>
      </ul>
    </ContentPage>
  );
}
