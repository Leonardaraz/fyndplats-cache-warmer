import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Om oss",
  description: "Fyndplats är en svensk webbutik i Södertälje med noga utvalda produkter till bra priser. Trygg svensk e-handel sedan 2021.",
  alternates: { canonical: "https://www.fyndplats.se/omoss" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/omoss", title: "Om oss", description: "Fyndplats är en svensk webbutik i Södertälje med noga utvalda produkter till bra priser. Trygg svensk e-handel sedan 2021.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg"] },
};

export default function OmOss() {
  return (
    <ContentPage
      eyebrow="Om oss"
      title="Svensk webbutik med noga utvalda fynd"
      lead="Fyndplats drivs från Södertälje. Sedan 2021 gör vi det enkelt för kunder i hela Sverige att hitta riktiga fynd – produkter som håller måttet, utan att kosta mer än de behöver."
    >
      <h2>Vårt sortiment</h2>
      <p>Vi erbjuder ett noga utvalt sortiment inom flera kategorier:</p>
      <ul>
        <li><strong>Elektronik</strong> – mobiltillbehör, ljud &amp; hörlurar och annan smart teknik</li>
        <li><strong>Hem &amp; Inredning</strong> – produkter som gör hemmet mer praktiskt och trivsamt</li>
        <li><strong>Kök &amp; Matlagning</strong> – köksredskap, förvaring och hjälpmedel</li>
        <li><strong>Skönhet &amp; Hälsa</strong> – produkter för kropp och välmående</li>
        <li><strong>Sport &amp; Fritid</strong> – träning, utomhusliv och aktiviteter</li>
        <li><strong>Barn &amp; Familj</strong> – produkter för de yngsta i familjen</li>
        <li><strong>Husdjur</strong> – tillbehör för hund, katt och andra fyrbenta</li>
        <li><strong>Mode &amp; Accessoarer</strong> – inklusive smycken</li>
      </ul>
      <p>Hela utbudet hittar du i <a href="/butik">vår butik</a>.</p>

      <h2>Så fungerar det</h2>
      <p><strong>Trygga betalningar med Klarna.</strong> Du betalar med Klarna och kan välja mellan att betala direkt, betala senare eller dela upp köpet. Återbetalningar går alltid tillbaka till samma betalsätt du använde.</p>
      <p><strong>30 dagars öppet köp.</strong> Som svensk e-handlare följer vi distansavtalslagen som ger dig 14 dagars ångerrätt – men vi förlänger frivilligt till 30 dagars öppet köp på alla produkter. Returfrakten betalas av dig som kund – du väljer själv leveranstjänst. Läs mer på sidan <a href="/returer">Returer</a>.</p>
      <p><strong>Frakt och leverans.</strong> Standardfrakt är 19 kr inom Sverige, och fri frakt över 499 kr. Leveranstiden är normalt 3–8 vardagar – när din beställning skickas får du en spårningskod via mejl.</p>
      <p><strong>Kundservice på svenska och engelska.</strong> Vi finns här när du behöver oss. Hör av dig på <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> eller <a href="tel:+46736630990">073-663 09 90</a>.</p>

      <h2>Vad du kan förvänta dig</h2>
      <p>Vi tror på enkelhet och tydlighet. Inga dolda avgifter, ingen krånglig retur­process och tydlig information om både produkter och leverans. Om något inte stämmer med din beställning hör du av dig – vi löser det.</p>

      <h2>Hitta hit</h2>
      <div className="cards3">
        <div className="cc">
          <h4>Adress</h4>
          <p>Fyndplats</p>
          <p>Bergviksgatan 10</p>
          <p>152 44 Södertälje</p>
        </div>
        <div className="cc">
          <h4>Kontakt</h4>
          <p><a href="mailto:info@fyndplats.com">info@fyndplats.com</a></p>
          <p><a href="tel:+46736630990">073-663 09 90</a></p>
        </div>
      </div>
      <p>Tack för att du handlar hos Fyndplats – välkommen tillbaka när du behöver ditt nästa fynd.</p>
    </ContentPage>
  );
}
