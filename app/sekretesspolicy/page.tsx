import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Sekretesspolicy",
  description: "Så samlar Fyndplats in, använder och skyddar dina personuppgifter enligt GDPR. Dina rättigheter och hur du utövar dem.",
  alternates: { canonical: "https://www.fyndplats.se/sekretesspolicy" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/sekretesspolicy", title: "Sekretesspolicy", description: "Så samlar Fyndplats in, använder och skyddar dina personuppgifter enligt GDPR. Dina rättigheter och hur du utövar dem.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
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

      <h2 id="medlemskonto">Medlemskonto</h2>
      <p>Du kan skapa ett konto hos oss för att se din medlemsnivå, dina köp och dina ordrar. Du loggar in med en kod eller länk som vi mejlar till dig; vi har inga lösenord.</p>
      <h3>Vad vi sparar</h3>
      <ul>
        <li>Din e-postadress, när kontot skapades och när du senast loggade in.</li>
        <li>Dina köp hos oss: ordernummer, datum, vad du betalade för varorna och vad du har fått tillbaka. Vi räknar köp med samma e-postadress, också köp du gjorde innan du skapade kontot.</li>
        <li>Din medlemsnivå och när den har ändrats.</li>
        <li>För inloggningen: när du bad om en kod, och en kontrollsumma av koden och av din IP-adress. Koden och IP-adressen sparas inte i klartext.</li>
      </ul>
      <h3>Varför</h3>
      <ul>
        <li>För att ge dig kontot och räkna din medlemsnivå. Det är en del av avtalet om medlemskapet (GDPR artikel 6.1 b).</li>
        <li>För att skydda kontot mot intrång och missbruk, till exempel att någon försöker gissa koder. Det är vårt berättigade intresse (artikel 6.1 f).</li>
      </ul>
      <h3>Mejl</h3>
      <p>Vi mejlar dig när kontot skapas, när du når en ny nivå och två veckor innan din nivå sjunker. Mejlen om nivån kan du sluta få när du vill, med länken i mejlet eller på Mina sidor. Mejlet med inloggningskoden och välkomstmejlet hör till kontot.</p>
      <h3>Kakor</h3>
      <p>När du är inloggad sparar vi kakan <code>fp_medlem</code> i din webbläsare i högst 90 dagar. Den behövs för att du ska förbli inloggad och kräver inget samtycke. Kakan <code>fp_medlem_lank</code> finns i högst 15 minuter, medan du loggar in med länken.</p>
      <h3>Hur länge</h3>
      <ul>
        <li>Kontot sparas tills du ber oss ta bort det.</li>
        <li>Köpen räknas i nivån i 365 dagar. Uppgifterna om köpen sparas så länge bokföringslagen kräver för ordern.</li>
        <li>Inloggningsförsök sparas i 30 dagar.</li>
      </ul>
      <h3>Ta bort kontot</h3>
      <p>Mejla <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> så tar vi bort kontot. Dina ordrar finns kvar, som bokföringslagen kräver.</p>

      <h2>Vem delar vi uppgifter med?</h2>
      <ul>
        <li><strong>Betalleverantör:</strong> Klarna hanterar betalningar.</li>
        <li><strong>Frakt- och logistikpartners</strong> för att leverera dina varor.</li>
        <li><strong>IT- och plattformsleverantörer</strong> som driftar webbplatsen.</li>
        <li><strong>Marknadsförings- och analysverktyg</strong> (Meta, TikTok, Google) – aktiveras endast vid samtycke.</li>
        <li><strong>Google Customer Reviews</strong> – om du samtyckt till marknadsföringscookies delar vi efter ditt köp din <strong>e-postadress</strong>, <strong>ordernummer</strong>, <strong>leveransland</strong> och <strong>beräknat leveransdatum</strong> med Google. Google visar då en egen ruta där du själv väljer om du vill få en enkät om ditt köp. Tackar du nej skickas ingen enkät. Har du valt bara nödvändiga cookies delas ingenting alls.</li>
        <li><strong>Trustpilot</strong> – om du samtyckt till marknadsföringscookies visar omdömessidan Trustpilots egen knapp för att lämna ett omdöme. Knappen hämtas från Trustpilot, som då får teknisk information om ditt besök, till exempel IP-adress och webbläsare. Har du valt bara nödvändiga cookies är knappen en vanlig länk, och ingenting hämtas från Trustpilot förrän du klickar på den.</li>
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
