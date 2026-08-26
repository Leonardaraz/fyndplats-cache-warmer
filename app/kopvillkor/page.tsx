import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Köpvillkor",
  description: "Fyndplats allmänna köpvillkor – priser, betalning, leverans, reklamation, ångerrätt, garanti och tvistelösning enligt svensk konsumentlagstiftning.",
  alternates: { canonical: "https://www.fyndplats.se/kopvillkor" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/kopvillkor", title: "Köpvillkor", description: "Fyndplats allmänna köpvillkor – priser, betalning, leverans, reklamation, ångerrätt, garanti och tvistelösning enligt svensk konsumentlagstiftning.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
};

export default function Kopvillkor() {
  return (
    <ContentPage
      eyebrow="Information"
      title="Köpvillkor"
      lead="Dessa allmänna villkor gäller när du som konsument handlar hos Fyndplats. Villkoren följer svensk konsumentlagstiftning, däribland konsumentköplagen (2022:260), lagen om distansavtal och avtal utanför affärslokaler (2005:59) samt e-handelslagen (2002:562)."
    >
      <p>Genom att slutföra ett köp hos Fyndplats godkänner du dessa villkor. Vi rekommenderar att du läser igenom dem innan beställning. Har du frågor är du alltid välkommen att <a href="/kontaktaoss">kontakta oss</a>.</p>

      <h2>1. Säljare</h2>
      <div className="callout">
        <p>
          <strong>Fyndplats</strong><br />
          Bergviksgatan 10<br />
          152 44 Södertälje, Sverige<br />
          Organisationsnummer: 199509144037<br />
          Momsregistreringsnummer: SE950914403701<br />
          E-post: <a href="mailto:info@fyndplats.com">info@fyndplats.com</a><br />
          Telefon: +46 (0) 73 663 09 90
        </p>
      </div>

      <h2>2. Priser och moms</h2>
      <p>Alla priser anges i svenska kronor (SEK) inklusive moms (25 %). Eventuella fraktkostnader tillkommer och redovisas alltid tydligt i kassan innan du slutför ditt köp.</p>
      <p>Vi reserverar oss för uppenbara prisfel, slutförsäljning och tekniska fel som kan medföra att produkten inte kan levereras eller att priset blivit felaktigt angivet. I sådana fall kontaktar vi dig och du har rätt att avbryta ditt köp utan kostnad.</p>

      <h2>3. Beställning och avtal</h2>
      <p>Avtal mellan dig och Fyndplats ingås när vi bekräftat din beställning via e-post. För att handla hos oss ska du vara minst 18 år, alternativt ha målsmans godkännande.</p>
      <p>Du ansvarar för att de uppgifter du lämnar vid beställning är korrekta. Felaktig adress eller kontaktinformation kan medföra att paketet inte når fram – se även punkt 6 om ej uthämtade paket.</p>

      <h2>4. Betalning</h2>
      <p>Vi erbjuder betalning via <strong>Klarna</strong>, som tillhandahåller följande betalsätt:</p>
      <ul>
        <li>Faktura (betala inom 14 eller 30 dagar)</li>
        <li>Delbetalning (Klarna Konto)</li>
        <li>Kortbetalning (Visa, Mastercard, American Express)</li>
        <li>Direktbetalning via bank</li>
        <li>Apple Pay och Google Pay</li>
      </ul>
      <p>Klarnas fullständiga villkor hittar du på <a href="https://www.klarna.com/se/" target="_blank" rel="noopener noreferrer">klarna.com/se</a>. När du betalar med Klarna sker betalningen direkt till Klarna, och eventuell återbetalning hanteras också av Klarna.</p>

      <h2>5. Leverans och leveranstid</h2>
      <p>Normal leveranstid är <strong>3–7 arbetsdagar</strong> från det att beställningen bekräftats. Leveranstiden kan variera beroende på produkt, lager och säsong. Aktuell leveranstid visas i kassan och uppdaterad status skickas via e-post.</p>
      <p>Fri frakt erbjuds vid köp över <strong>499 kr</strong>. Vid mindre köp tillkommer en fraktavgift som visas tydligt i kassan.</p>
      <p><strong>EU-lager:</strong> samtliga produkter vi säljer skickas från lager <strong>inom EU</strong>. Din beställning omfattas därför inte av EU:s nya importtull eller förtullningsavgift för paket som skickas in i EU utifrån (gäller från och med 1 juli 2026). Detta avser import-/förtullningsavgifter – moms (25 %) ingår alltid i priset och frakt redovisas enligt ovan. Mer information finns på sidan <a href="/eu-lager-garanti">EU-lager-garanti</a>.</p>
      <p>Vid kraftiga förseningar (mer än 30 dagar) har du alltid rätt att häva köpet och få full återbetalning. Kontakta då <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>.</p>

      <h2>6. Ej uthämtade paket</h2>
      <p>Du ansvarar för att hämta ut ditt paket inom angiven tid (normalt 7–14 dagar hos ombud). Om paketet inte hämtas ut och returneras till oss förbehåller vi oss rätten att ta ut en administrativ avgift på upp till <strong>160 kr</strong> för att täcka leverantörens kostnader för hantering och returfrakt. Avgiften gäller dock <strong>inte</strong> om du har meddelat att du ångrar köpet (se punkt 7) – då hanteras paketet som en retur enligt din ångerrätt.</p>

      <h2>7. Ångerrätt och öppet köp</h2>
      <p>Du har <strong>14 dagars ångerrätt</strong> enligt lag om distansavtal (2005:59), räknat från den dag du tog emot produkten. Vill du ångra ditt köp meddelar du oss inom 14 dagar och returnerar varan inom ytterligare 14 dagar. Ångerrätten gäller <strong>även innan varan hunnit levereras</strong> – du kan ångra dig så snart beställningen lagts.</p>
      <p>Du utövar enklast din ångerrätt via vår <strong>ångerfunktion</strong> på sidan <a href="/angra-kop">Ångra köp</a> – fyll i din order, välj vilka artiklar du vill ångra och skicka. Du får då direkt ett <strong>automatiskt mottagningskvitto</strong> med ärendenummer och returadress. Du kan även meddela oss via e-post till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> eller använda den standardångerblankett som Konsumentverket tillhandahåller.</p>
      <p>Utöver den lagstadgade ångerrätten erbjuder Fyndplats frivilligt <strong>30 dagars öppet köp</strong> på alla produkter, räknat från den dag du tog emot leveransen. Det innebär att du har 30 dagar på dig att meddela oss att du vill returnera varan – samma villkor och undantag som för ångerrätten gäller (se sidan Returer).</p>
      <p><strong>Returfrakten betalas av kunden.</strong> Du anmäler returen via vår <a href="/angra-kop">ångerfunktion</a> eller via mejl till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> och får då returadressen samt instruktioner i bekräftelsemejlet. Du väljer själv leveranstjänst (vi rekommenderar spårbar leverans). Fyndplats ansvarar inte för returpaket som försvinner i transporten. Vid <strong>felaktig eller skadad produkt vid leverans</strong> står Fyndplats för returkostnaden – kontakta oss inom 14 dagar så löser vi det.</p>
      <p>Återbetalning sker till ursprungligt betalmedel inom 5–10 bankdagar efter att vi tagit emot och kontrollerat returen.</p>
      <p>Fullständig information om hur du genomför en retur, vilka villkor som gäller och eventuella undantag (till exempel hygienprodukter) hittar du på sidan <a href="/returer">Returer &amp; ångerrätt</a>.</p>

      <h2>8. Reklamation och garanti</h2>
      <p>Enligt <strong>konsumentköplagen (2022:260)</strong> har du tre (3) års reklamationsrätt på fel som fanns vid leverans. Fel som visar sig inom de första två åren antas ha funnits vid leverans, om inte annat kan bevisas.</p>
      <p>Reklamationen ska göras inom <strong>skälig tid</strong> efter att felet upptäckts – normalt anses två månader vara skälig tid. Vid godkänd reklamation åtgärdar vi felet i första hand genom reparation eller utbyte. Är det inte möjligt erbjuder vi prisavdrag eller hävning av köpet.</p>
      <p>Reklamera genom att skicka ett e-postmeddelande till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> med ordernummer, beskrivning av felet samt foton.</p>

      <h2>9. Force majeure</h2>
      <p>Fyndplats är befriat från ansvar vid omständigheter utanför vår kontroll som vi inte rimligen kunnat förutse, däribland krig, naturkatastrof, arbetskonflikt, myndighetsbeslut, störningar i kommunikation eller transport, samt liknande omständigheter som väsentligt försvårar fullgörandet av avtalet.</p>

      <h2>10. Personuppgifter</h2>
      <p>Vi hanterar dina personuppgifter i enlighet med GDPR. Mer information om vilka uppgifter vi samlar in, hur de används och dina rättigheter finns i vår <a href="/sekretesspolicy">Sekretesspolicy</a>.</p>

      <h2>11. Tvistelösning</h2>
      <p>Vi följer alltid <strong>Allmänna reklamationsnämndens (ARN)</strong> rekommendationer vid tvist. Om vi inte kommer överens i en reklamation kan du vända dig till ARN för opartisk prövning:</p>
      <div className="callout">
        <p>
          <strong>Allmänna reklamationsnämnden (ARN)</strong><br />
          Box 174, 101 23 Stockholm<br />
          Webbplats: <a href="https://www.arn.se" target="_blank" rel="noopener noreferrer">www.arn.se</a>
        </p>
      </div>
      <p>Du kan också använda EU-kommissionens onlineplattform för tvistelösning (ODR-plattformen) för köp gjorda online:</p>
      <p><a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a></p>
      <p>Vid eventuell domstolsprövning tillämpas svensk lag och tvisten avgörs av svensk allmän domstol.</p>

      <h2>12. Ändring av villkor</h2>
      <p>Fyndplats förbehåller sig rätten att uppdatera dessa villkor. Den senaste versionen finns alltid publicerad på denna sida. För redan lagda beställningar gäller de villkor som var i kraft vid köptillfället.</p>

      <h2>Relaterade sidor</h2>
      <ul>
        <li><a href="/returer">Returer &amp; ångerrätt</a></li>
        <li><a href="/sekretesspolicy">Sekretesspolicy</a></li>
        <li><a href="/vara-butikspolicyer">Våra butikspolicyer</a></li>
        <li><a href="/vanliga-fragor">Vanliga frågor</a></li>
        <li><a href="/kontaktaoss">Kontakta oss</a></li>
      </ul>

      <p style={{ fontSize: 14, color: "var(--soft)", marginTop: 24 }}>Senast uppdaterad: 30 maj 2026</p>
    </ContentPage>
  );
}
