import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Sekretesspolicy",
  description: "Så samlar Fyndplats in, använder och skyddar dina personuppgifter enligt GDPR. Dina rättigheter och hur du utövar dem.",
  alternates: { canonical: "https://www.fyndplats.se/sekretesspolicy" },
};

export default function Sekretesspolicy() {
  return (
    <ContentPage
      eyebrow="Integritet"
      title="Sekretesspolicy"
      lead="Vi värnar om din personliga integritet och eftersträvar alltid en hög nivå av dataskydd. Här förklarar vi hur vi samlar in, använder och skyddar dina personuppgifter när du handlar på fyndplats.se."
    >
      <p>Har du frågor är du alltid välkommen att kontakta oss på <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>.</p>

      <h2>Personuppgiftsansvarig</h2>
      <p>Fyndplats, org.nr 950914-4037, Bergviksgatan 10, 152 44 Södertälje, är personuppgiftsansvarig för behandlingen av dina personuppgifter och ansvarar för att behandlingen sker enligt gällande dataskyddslagstiftning (GDPR).</p>

      <h2>Vilka personuppgifter samlar vi in?</h2>
      <ul>
        <li><strong>Uppgifter du själv lämnar</strong> – t.ex. vid köp, kundkonto, nyhetsbrev eller kontakt med kundtjänst: namn, e-post, leverans- och fakturaadress, telefonnummer samt uppgifter om din beställning.</li>
        <li><strong>Uppgifter som samlas in automatiskt</strong> när du besöker webbplatsen – teknisk information om din enhet (IP-adress, webbläsare, operativsystem) och hur du använder webbplatsen, via cookies och liknande tekniker.</li>
        <li><strong>Uppgifter från vår betalleverantör</strong> – betalningsuppgifter behandlas av Klarna, som kan göra en kredit- eller identitetskontroll och då är självständigt personuppgiftsansvarig.</li>
      </ul>

      <h2>Varför behandlar vi dina personuppgifter?</h2>
      <p><strong>Hantera din beställning och fullgöra köpet.</strong> Laglig grund: fullgörande av avtal. Sparas så länge det behövs och därefter enligt bokföringslagen.</p>
      <p><strong>Hantera kundtjänstärenden.</strong> Laglig grund: berättigat intresse av att ge god service.</p>
      <p><strong>Skicka nyhetsbrev och erbjudanden.</strong> Laglig grund: ditt samtycke eller berättigat intresse gentemot befintliga kunder. Du kan när som helst tacka nej via länken i varje utskick.</p>
      <p><strong>Förbättra och utveckla webbutiken.</strong> I huvudsak på aggregerad eller pseudonymiserad nivå. Laglig grund: berättigat intresse samt samtycke för analyscookies.</p>
      <p><strong>Uppfylla rättsliga skyldigheter</strong> (t.ex. bokföringslagen – upp till sju år) och <strong>förebygga missbruk och bedrägeri.</strong></p>

      <h2>Vem delar vi uppgifter med?</h2>
      <ul>
        <li><strong>Betalleverantör:</strong> Klarna hanterar betalningar.</li>
        <li><strong>Frakt- och logistikpartners</strong> för att leverera dina varor.</li>
        <li><strong>IT- och plattformsleverantörer</strong> som driftar webbplatsen.</li>
        <li><strong>Marknadsförings- och analysverktyg</strong> (Meta, TikTok, Google) – aktiveras endast vid samtycke.</li>
        <li><strong>Myndigheter</strong> när vi enligt lag är skyldiga att lämna ut uppgifter.</li>
      </ul>
      <p>Leverantörer som behandlar uppgifter för vår räkning är personuppgiftsbiträden, med biträdesavtal som säkerställer säker behandling enligt våra instruktioner.</p>

      <h2>Var behandlar vi uppgifterna?</h2>
      <p>Vi strävar efter att behandla uppgifter inom EU/EES. Sker behandling utanför EU/EES säkerställer vi laglig överföring och skydd, t.ex. via EU-kommissionens standardavtalsklausuler.</p>

      <h2>Hur skyddar vi uppgifterna?</h2>
      <p>Vi vidtar lämpliga tekniska och organisatoriska säkerhetsåtgärder mot obehörig åtkomst, förlust och förstöring. Endast de som behöver uppgifterna för sina arbetsuppgifter har tillgång till dem.</p>

      <h2>Cookies</h2>
      <p>Vi använder nödvändiga cookies (för bl.a. kundvagn och kassa), analys- och prestandacookies samt marknadsföringscookies (Meta, TikTok, Google). Via vår cookiebanner väljer du vilka cookies du samtycker till, utöver de nödvändiga. Du kan när som helst ändra eller återkalla ditt samtycke.</p>

      <h2>Dina rättigheter</h2>
      <p>Du har rätt till tillgång (registerutdrag), rättelse, radering, begränsning, att invända mot behandling som sker med stöd av berättigat intresse samt mot direktmarknadsföring, och under vissa förutsättningar dataportabilitet. När behandlingen grundar sig på samtycke kan du återkalla det när som helst. Kontakta <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> för att utöva dina rättigheter.</p>

      <h2>Klagomål</h2>
      <p>Anser du att vi behandlar dina uppgifter felaktigt har du rätt att klaga till Integritetsskyddsmyndigheten (IMY), <a href="https://www.imy.se" rel="nofollow">www.imy.se</a>.</p>

      <h2>Ändringar &amp; kontakt</h2>
      <p>Vi kan komma att uppdatera denna policy. Senaste versionen finns alltid här. Frågor? Kontakta oss på <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> eller Fyndplats, Bergviksgatan 10, 152 44 Södertälje.</p>
    </ContentPage>
  );
}
