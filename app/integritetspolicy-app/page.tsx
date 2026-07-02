import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

const DESC =
  "Så samlar Fyndplats-appen in, använder och skyddar dina personuppgifter – GDPR, App Tracking Transparency och dina rättigheter.";

export const metadata: Metadata = {
  title: "Integritetspolicy för appen",
  description: DESC,
  alternates: { canonical: "https://www.fyndplats.se/integritetspolicy-app" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/integritetspolicy-app", title: "Integritetspolicy för appen", description: DESC, images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
};

export default function IntegritetspolicyApp() {
  return (
    <ContentPage
      eyebrow="Integritet · App"
      title="Integritetspolicy för Fyndplats-appen"
      lead="Denna policy beskriver hur Fyndplats samlar in, använder och skyddar dina personuppgifter när du använder vår app för iOS och Android. Den kompletterar vår allmänna sekretesspolicy för webbplatsen och är anpassad efter kraven i Apple App Store och Google Play."
    >
      <p>Har du frågor är du alltid välkommen att kontakta oss på <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>. Vår allmänna policy för webbplatsen finns på <a href="/sekretesspolicy">Sekretesspolicy</a>.</p>

      <h2>Personuppgiftsansvarig</h2>
      <div className="callout">
        <p>
          <strong>Fyndplats</strong><br />
          Bergviksgatan 10<br />
          152 44 Södertälje, Sverige<br />
          Organisationsnummer: 199509144037<br />
          E-post: <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>
        </p>
      </div>
      <p>Fyndplats är personuppgiftsansvarig och ansvarar för att behandlingen sker enligt EU:s dataskyddsförordning (GDPR).</p>

      <h2>Vilka uppgifter samlar appen in?</h2>
      <ul>
        <li><strong>E-postadress</strong> – när du loggar in eller skapar konto, för att identifiera dig och koppla din orderhistorik.</li>
        <li><strong>Namn, leverans- och fakturaadress, telefonnummer</strong> – vid beställning, för att fullgöra och leverera din order.</li>
        <li><strong>Orderhistorik</strong> – dina köp lagras i Wix Data så att du kan se tidigare beställningar och orderstatus i appen.</li>
        <li><strong>Spårningsdata (Meta Pixel)</strong> – endast om du godkänner App Tracking Transparency-prompten (iOS) och cookie-/datasamtycke, för att mäta annonseffekt.</li>
        <li><strong>App-aktivitet</strong> – sid- och produktvisningar samt köp, för analys och förbättring av appen.</li>
        <li><strong>Krasch- och prestandadata</strong> – samlas automatiskt vid fel för stabilitet och felsökning, ej kopplat till din identitet.</li>
        <li><strong>Push-token</strong> – om du tillåter notiser, för att skicka order- och restock-notiser.</li>
      </ul>
      <p>Vi samlar <strong>inte</strong> in din exakta platsdata, dina kontakter eller ditt fotobibliotek.</p>

      <h2>Hur och var lagras uppgifterna?</h2>
      <ul>
        <li><strong>Wix Data</strong> – kund-, order- och produktdata hos vår backend-leverantör.</li>
        <li><strong>Vercel</strong> – appens API-anrop går via servrar hostade på Vercel.</li>
        <li><strong>Resend</strong> – transaktions- och marknadsföringsmejl.</li>
        <li><strong>Lokalt på din enhet</strong> – kundvagn lagras i <code>AsyncStorage</code>; inloggnings-token (JWT) lagras krypterat i <code>SecureStore</code> (iOS Keychain / Android Keystore).</li>
      </ul>
      <p>Vi strävar efter att behandla uppgifter inom EU/EES. Sker överföring utanför EU/EES säkerställer vi laglig grund, t.ex. via EU-kommissionens standardavtalsklausuler.</p>

      <h2>Tredjeparter vi delar uppgifter med</h2>
      <ul>
        <li><strong>Klarna</strong> – betalleverantör (egen personuppgiftsansvarig), hanterar betalnings- och orderuppgifter vid köp.</li>
        <li><strong>Wix</strong> – backend och datalagring (personuppgiftsbiträde).</li>
        <li><strong>Meta</strong> (Facebook/Instagram) – annonsering, <strong>endast vid samtycke</strong>; tar emot hashad e-post/telefon och händelsedata via Pixel och Conversions API.</li>
        <li><strong>Resend</strong> – e-postutskick (personuppgiftsbiträde).</li>
        <li><strong>Google Analytics (GA4)</strong> – pseudonymiserad trafikanalys för webbplatsen.</li>
      </ul>

      <h2>iOS App Tracking Transparency (ATT)</h2>
      <p>På iOS visar appen en App Tracking Transparency-prompt innan någon spårning sker. Meta Pixel och Conversions API aktiveras <strong>endast</strong> om du uttryckligen godkänner prompten. Avböjer du sker ingen annonsspårning – appen fungerar oförändrat i övrigt. Du kan när som helst ändra valet under <em>Inställningar → Integritet &amp; säkerhet → Spårning</em> på din iPhone.</p>

      <h2>Cookies och lokal lagring i appen</h2>
      <ul>
        <li><strong>AsyncStorage</strong> – sparar din kundvagn lokalt mellan sessioner.</li>
        <li><strong>SecureStore</strong> – lagrar din inloggnings-JWT krypterat på enheten.</li>
        <li><strong>Webview-cookies</strong> – den Wix-hostade kassan använder nödvändiga cookies för att genomföra betalning. Marknadsförings- och analyscookies aktiveras endast vid samtycke.</li>
      </ul>

      <h2>Barn</h2>
      <p>Fyndplats-appen är <strong>inte riktad till barn under 13 år</strong>. Vi samlar inte medvetet in personuppgifter från barn under 13. Tror du att ett barn lämnat uppgifter till oss, kontakta <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> så raderar vi dem.</p>

      <h2>Dina rättigheter</h2>
      <p>Du har rätt till tillgång (registerutdrag), rättelse, radering, begränsning, att invända mot behandling som sker med stöd av berättigat intresse samt mot direktmarknadsföring, och under vissa förutsättningar dataportabilitet. Grundar sig behandlingen på samtycke kan du återkalla det när som helst. Kontakta <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> för att utöva dina rättigheter. Du kan även radera ditt konto direkt i appen.</p>
      <p>Anser du att vi behandlar dina uppgifter felaktigt har du rätt att klaga till Integritetsskyddsmyndigheten (IMY), <a href="https://www.imy.se" rel="nofollow">www.imy.se</a>.</p>

      <h2>Ändringar &amp; kontakt</h2>
      <p>Vi kan komma att uppdatera denna policy. Den senaste versionen finns alltid här. Frågor? Kontakta oss på <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> eller Fyndplats, Bergviksgatan 10, 152 44 Södertälje.</p>

      <h2>Relaterade sidor</h2>
      <ul>
        <li><a href="/anvandarvillkor-app">Användarvillkor för appen</a></li>
        <li><a href="/sekretesspolicy">Sekretesspolicy (webb)</a></li>
        <li><a href="/kopvillkor">Köpvillkor</a></li>
      </ul>

      <p style={{ fontSize: 14, color: "var(--soft)", marginTop: 24 }}>Senast uppdaterad: 2 juni 2026</p>
    </ContentPage>
  );
}
