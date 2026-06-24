import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

const DESC =
  "Användarvillkor för Fyndplats-appen – tjänsten, beställning och betalning via Klarna, frakt, returer, ansvar och tillämplig lag.";

export const metadata: Metadata = {
  title: "Användarvillkor för appen",
  description: DESC,
  alternates: { canonical: "https://www.fyndplats.se/anvandarvillkor-app" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/anvandarvillkor-app", title: "Användarvillkor för appen", description: DESC, images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg"] },
};

export default function AnvandarvillkorApp() {
  return (
    <ContentPage
      eyebrow="Information · App"
      title="Användarvillkor för Fyndplats-appen"
      lead="Dessa villkor reglerar din användning av Fyndplats-appen för iOS och Android. Genom att ladda ned, installera eller använda appen godkänner du villkoren. För köp gäller dessutom våra allmänna köpvillkor."
    >
      <p>Genom att använda appen accepterar du dessa villkor. Har du frågor är du alltid välkommen att <a href="/kontaktaoss">kontakta oss</a>.</p>

      <h2>1. Acceptans av villkor</h2>
      <p>Genom att använda Fyndplats-appen accepterar du dessa villkor i sin helhet. Accepterar du inte villkoren ska du inte använda appen. Du ska vara minst 18 år, alternativt ha målsmans godkännande, för att genomföra köp.</p>

      <h2>2. Beskrivning av tjänsten</h2>
      <p>Fyndplats är en svensk e-handel som via appen erbjuder ett urval av noga utvalda produkter till smarta priser. Appen låter dig bläddra bland produkter, lägga varor i kundvagn, genomföra köp och följa dina beställningar. Vi förbehåller oss rätten att när som helst ändra, pausa eller avsluta hela eller delar av tjänsten.</p>

      <h2>3. Beställningar och betalning</h2>
      <p>Avtal ingås när vi bekräftat din beställning via e-post. Alla priser anges i svenska kronor (SEK) inklusive moms (25 %).</p>
      <p>Betalning sker via <strong>Klarna</strong> (faktura, delbetalning, kort, direktbetalning, Apple Pay och Google Pay). Klarnas egna villkor gäller för betalningen och eventuell återbetalning hanteras av Klarna – se <a href="https://www.klarna.com/se/" target="_blank" rel="noopener noreferrer">klarna.com/se</a>. Betalningssteget genomförs i en Wix-hostad kassa.</p>

      <h2>4. Frakt och leverans</h2>
      <p>Normal leveranstid är <strong>3–7 arbetsdagar</strong> från bekräftad beställning. Fri frakt vid köp över <strong>499 kr</strong>; vid mindre köp tillkommer en fraktavgift som visas i kassan. Vid förseningar över 30 dagar har du rätt att häva köpet och få full återbetalning.</p>

      <h2>5. Returer och ångerrätt</h2>
      <p>Du har <strong>14 dagars lagstadgad ångerrätt</strong> enligt lagen om distansavtal (2005:59), räknat från den dag du tog emot varan. Utöver detta erbjuder Fyndplats frivilligt <strong>30 dagars öppet köp</strong> på alla produkter. Returfrakten betalas av kunden, utom vid felaktig eller skadad vara. Fullständiga villkor finns på sidan <a href="/returer">Returer &amp; ångerrätt</a>.</p>

      <h2>6. Användarens skyldigheter</h2>
      <ul>
        <li>Lämna korrekta och fullständiga uppgifter vid beställning och kontoregistrering.</li>
        <li>Hålla dina inloggningsuppgifter hemliga och ansvara för aktivitet under ditt konto.</li>
        <li>Inte använda appen för olagliga ändamål, bedrägeri eller försök att kringgå tekniska skydd.</li>
        <li>Inte störa, överbelasta eller försöka få obehörig åtkomst till appen eller dess bakomliggande system.</li>
      </ul>
      <p>Vi förbehåller oss rätten att stänga av konton som bryter mot dessa villkor.</p>

      <h2>7. Immateriella rättigheter</h2>
      <p>Namnet <strong>Fyndplats</strong>, logotypen, appens design, text, grafik och övrigt innehåll tillhör Fyndplats eller våra licensgivare och skyddas av upphovsrätt och varumärkesrätt. Du får inte kopiera, distribuera, modifiera eller på annat sätt utnyttja innehållet utan vårt skriftliga medgivande, utöver vad som krävs för normal användning av appen.</p>

      <h2>8. Användargenererat innehåll (recensioner)</h2>
      <p>Om appen tillåter att du lämnar recensioner eller annat innehåll ansvarar du för att innehållet är korrekt, lagligt och inte kränker tredje parts rättigheter. Genom att publicera innehåll ger du Fyndplats en icke-exklusiv, royaltyfri rätt att använda, visa och distribuera innehållet i samband med tjänsten. Vi förbehåller oss rätten att ta bort innehåll som strider mot dessa villkor eller gällande lag.</p>

      <h2>9. Ansvarsbegränsning</h2>
      <p>Appen tillhandahålls "i befintligt skick". Fyndplats ansvarar inte för indirekta skador, utebliven vinst eller förluster till följd av avbrott, fel eller otillgänglighet i appen, i den utsträckning lagen tillåter. Inget i dessa villkor inskränker dina tvingande rättigheter som konsument enligt svensk lag. Fyndplats är befriat från ansvar vid force majeure (omständigheter utanför vår rimliga kontroll).</p>

      <h2>10. Tillämplig lag och tvistelösning</h2>
      <p>Svensk lag tillämpas på dessa villkor. Tvist ska i första hand lösas i samförstånd; vi följer <strong>Allmänna reklamationsnämndens (ARN)</strong> rekommendationer. Kan tvisten inte lösas avgörs den av svensk allmän domstol med <strong>Stockholms tingsrätt</strong> som första instans. Du kan även använda EU:s onlineplattform för tvistelösning: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.</p>

      <h2>11. Ändring av villkor</h2>
      <p>Fyndplats förbehåller sig rätten att uppdatera dessa villkor. Den senaste versionen finns alltid publicerad på denna sida. Vid väsentliga ändringar informerar vi i appen.</p>

      <h2>12. Kontakt</h2>
      <div className="callout">
        <p>
          <strong>Fyndplats</strong><br />
          Bergviksgatan 10<br />
          152 44 Södertälje, Sverige<br />
          Organisationsnummer: 199509144037<br />
          E-post: <a href="mailto:info@fyndplats.com">info@fyndplats.com</a><br />
          Telefon: +46 (0) 73 663 09 90
        </p>
      </div>

      <h2>Relaterade sidor</h2>
      <ul>
        <li><a href="/integritetspolicy-app">Integritetspolicy för appen</a></li>
        <li><a href="/kopvillkor">Köpvillkor</a></li>
        <li><a href="/returer">Returer &amp; ångerrätt</a></li>
        <li><a href="/kontaktaoss">Kontakta oss</a></li>
      </ul>

      <p style={{ fontSize: 14, color: "var(--soft)", marginTop: 24 }}>Senast uppdaterad: 2 juni 2026</p>
    </ContentPage>
  );
}
