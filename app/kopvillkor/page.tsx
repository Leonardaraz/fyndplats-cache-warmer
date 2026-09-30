import type { Metadata } from "next";
import { TOTAL_SUMMARY, TOTAL_SHORT } from "../../lib/retur-policy";
import { SKRYMMANDE_RETURKOSTNAD } from "../../lib/retur-frakt";
import { jsonLdString } from "../../lib/seo";
import { Ikon, Svg } from "../../components/villkor-ikoner";
import s from "./kopvillkor.module.css";

// Köpvillkor (2026-09-30). Samma designspråk som /omoss: hero, faktarad och
// det viktigaste i korthet överst, sedan villkoren med en innehållsförteckning.
// VILLKORSTEXTEN ÄR ORDAGRANN: punkterna 1–12 är oförändrade, de har bara fått
// ankare. Sammanfattningen överst säger inget som inte står i punkterna.

export const metadata: Metadata = {
  title: "Köpvillkor",
  description: "Fyndplats allmänna köpvillkor – priser, betalning, leverans, reklamation, ångerrätt, garanti och tvistelösning enligt svensk konsumentlagstiftning.",
  alternates: { canonical: "https://www.fyndplats.se/kopvillkor" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/kopvillkor", title: "Köpvillkor", description: "Fyndplats allmänna köpvillkor – priser, betalning, leverans, reklamation, ångerrätt, garanti och tvistelösning enligt svensk konsumentlagstiftning.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
    { "@type": "ListItem", position: 2, name: "Köpvillkor", item: "https://www.fyndplats.se/kopvillkor" },
  ],
};

/** Innehållsförteckningen. Ankarna sitter på rubrikerna i villkorstexten. */
const INNEHALL: { id: string; rubrik: string }[] = [
  { id: "saljare", rubrik: "1. Säljare" },
  { id: "priser", rubrik: "2. Priser och moms" },
  { id: "bestallning", rubrik: "3. Beställning och avtal" },
  { id: "betalning", rubrik: "4. Betalning" },
  { id: "leverans", rubrik: "5. Leverans och leveranstid" },
  { id: "ej-uthamtade", rubrik: "6. Ej uthämtade paket" },
  { id: "angerratt", rubrik: "7. Ångerrätt och öppet köp" },
  { id: "reklamation", rubrik: "8. Reklamation och garanti" },
  { id: "force-majeure", rubrik: "9. Force majeure" },
  { id: "personuppgifter", rubrik: "10. Personuppgifter" },
  { id: "tvistelosning", rubrik: "11. Tvistelösning" },
  { id: "andring", rubrik: "12. Ändring av villkor" },
];

/** Det viktigaste i korthet. Varje punkt återger vad som står i villkoren. */
const KORTHET: { rubrik: string; text: React.ReactNode; punkt: string }[] = [
  {
    rubrik: "Avtalet",
    text: "Avtal ingås när vi bekräftat din beställning via e-post. Du ska vara minst 18 år, alternativt ha målsmans godkännande.",
    punkt: "bestallning",
  },
  {
    rubrik: "Priser",
    text: "Alla priser anges i svenska kronor inklusive moms (25 %). Fraktkostnader redovisas i kassan innan du slutför ditt köp.",
    punkt: "priser",
  },
  {
    rubrik: "Betalning via Klarna",
    text: "Faktura, delbetalning, kort, direktbetalning via bank, Apple Pay och Google Pay.",
    punkt: "betalning",
  },
  {
    rubrik: "Leverans",
    text: "Normal leveranstid är 3–6 arbetsdagar. Frakten är 19 kr, och fri vid köp över 499 kr. Samtliga produkter skickas från lager inom EU.",
    punkt: "leverans",
  },
  {
    rubrik: "Ångerrätt och öppet köp",
    text: TOTAL_SHORT,
    punkt: "angerratt",
  },
  {
    rubrik: "Retur",
    text: "Returfrakten betalas av kunden. Vid felaktig eller skadad produkt vid leverans står Fyndplats för returkostnaden.",
    punkt: "angerratt",
  },
  {
    rubrik: "Reklamation",
    text: "Tre års reklamationsrätt enligt konsumentköplagen (2022:260). Ett meddelande inom två månader räknas alltid som i rätt tid.",
    punkt: "reklamation",
  },
  {
    rubrik: "Ej uthämtade paket",
    text: "En administrativ avgift på upp till 160 kr kan tas ut, men inte om du har meddelat att du ångrar köpet.",
    punkt: "ej-uthamtade",
  },
];

export default function Kopvillkor() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />

      <section className="om-hero">
        <div className={`container ${s.hero}`}>
          <div className="eyebrow">Information</div>
          <h1>Köpvillkor</h1>
          <p className="om-lede">
            Dessa allmänna villkor gäller när du som konsument handlar hos Fyndplats. Villkoren följer svensk konsumentlagstiftning, däribland konsumentköplagen (2022:260), lagen om distansavtal och avtal utanför affärslokaler (2005:59) samt e-handelslagen (2002:562).
          </p>
          <div className="om-cta">
            <a className="btn btn-primary" href="#villkoren">Läs villkoren</a>
            <a className="btn btn-ghost" href="/kontaktaoss">Kontakta oss</a>
          </div>
        </div>
      </section>

      <section className="om-fakta" aria-label="Köpvillkoren i siffror">
        <div className="container om-fakta-grid">
          <a className="om-fakta-kort" href="#leverans">
            <b>3–6</b>
            <span>Arbetsdagar i normal leveranstid</span>
          </a>
          <a className="om-fakta-kort" href="#leverans">
            <b>0 kr</b>
            <span>Frakt vid köp över 499 kr</span>
          </a>
          <a className="om-fakta-kort" href="#angerratt">
            <b>30 dagar</b>
            <span>Totalt att ångra eller returnera</span>
          </a>
          <a className="om-fakta-kort" href="#reklamation">
            <b>3 år</b>
            <span>Reklamationsrätt på fel</span>
          </a>
        </div>
      </section>

      <section className="om-sektion">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Sammanfattning</div>
              <h2>Det viktigaste i korthet</h2>
            </div>
            <a className="btn-quiet" href="#villkoren">Hela villkoren</a>
          </div>
          <ul className={s.korthet}>
            {KORTHET.map((k) => (
              <li key={k.rubrik}>
                <span className={s.bock}><Svg d={Ikon.bock} /></span>
                <div>
                  <h3>{k.rubrik}</h3>
                  <p>{k.text} <a href={`#${k.punkt}`}>Se punkt {INNEHALL.findIndex((i) => i.id === k.punkt) + 1}</a></p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${s.villkorsek} ${s.anker}`} id="villkoren">
        <div className={`container ${s.layout}`}>
          <nav className={s.toc} aria-labelledby="innehall-rubrik">
            <h2 className={s.tocRubrik} id="innehall-rubrik">Innehåll</h2>
            <ol>
              {INNEHALL.map((i) => (
                <li key={i.id}><a href={`#${i.id}`}>{i.rubrik}</a></li>
              ))}
            </ol>
          </nav>

          <article className={`prose ${s.brodtext}`}>
            <p>Genom att slutföra ett köp hos Fyndplats godkänner du dessa villkor. Vi rekommenderar att du läser igenom dem innan beställning. Har du frågor är du alltid välkommen att <a href="/kontaktaoss">kontakta oss</a>.</p>

            <h2 id="saljare" className={s.anker}>1. Säljare</h2>
            <div className="callout">
              <p>
                <strong>Fyndplats</strong><br />
                Bergviksgatan 10<br />
                152 44 Södertälje, Sverige<br />
                Organisationsnummer: 950914-4037<br />
                Momsregistreringsnummer: SE950914403701<br />
                E-post: <a href="mailto:info@fyndplats.com">info@fyndplats.com</a><br />
                Telefon: +46 73 663 09 90
              </p>
            </div>

            <h2 id="priser" className={s.anker}>2. Priser och moms</h2>
            <p>Alla priser anges i svenska kronor (SEK) inklusive moms (25 %). Eventuella fraktkostnader tillkommer och redovisas alltid tydligt i kassan innan du slutför ditt köp.</p>
            <p>Vi reserverar oss för uppenbara prisfel. Har en vara fått ett pris som tydligt är fel kontaktar vi dig innan vi skickar den, och du väljer om du vill köpa till rätt pris eller avbryta utan kostnad.</p>
            <p>Skulle en vara visa sig vara slut efter att du fått orderbekräftelsen meddelar vi dig direkt. Du väljer då om du vill vänta på en ny leverans eller häva köpet och få tillbaka hela beloppet. Dina övriga rättigheter enligt konsumentköplagen, till exempel rätt till skadestånd, påverkas inte.</p>

            <h2 id="bestallning" className={s.anker}>3. Beställning och avtal</h2>
            <p>Avtal mellan dig och Fyndplats ingås när vi bekräftat din beställning via e-post. För att handla hos oss ska du vara minst 18 år, alternativt ha målsmans godkännande.</p>
            <p>Du ansvarar för att de uppgifter du lämnar vid beställning är korrekta. Felaktig adress eller kontaktinformation kan medföra att paketet inte når fram – se även punkt 6 om ej uthämtade paket.</p>

            <h2 id="betalning" className={s.anker}>4. Betalning</h2>
            <p>Vi erbjuder betalning via <strong>Klarna</strong>, som tillhandahåller följande betalsätt:</p>
            <ul>
              <li>Faktura (betala inom 14 eller 30 dagar)</li>
              <li>Delbetalning (Klarna Konto)</li>
              <li>Kortbetalning (Visa, Mastercard, American Express)</li>
              <li>Direktbetalning via bank</li>
              <li>Apple Pay och Google Pay</li>
            </ul>
            <p>Klarnas fullständiga villkor hittar du på <a href="https://www.klarna.com/se/" target="_blank" rel="noopener noreferrer">klarna.com/se</a>. När du betalar med Klarna sker betalningen direkt till Klarna, och eventuell återbetalning hanteras också av Klarna.</p>

            <h2 id="leverans" className={s.anker}>5. Leverans och leveranstid</h2>
            <p>Normal leveranstid är <strong>3–6 arbetsdagar</strong> från det att beställningen bekräftats. Leveranstiden kan variera beroende på produkt, lager och säsong. Aktuell leveranstid visas i kassan och uppdaterad status skickas via e-post.</p>
            <p>Fri frakt erbjuds vid köp över <strong>499 kr</strong>. Vid mindre köp är frakten <strong>19 kr</strong>, och den visas alltid i kassan innan du betalar.</p>
            <p><strong>EU-lager:</strong> samtliga produkter vi säljer skickas från lager <strong>inom EU</strong>. Din beställning omfattas därför inte av EU:s nya importtull eller förtullningsavgift för paket som skickas in i EU utifrån (gäller från och med 1 juli 2026). Detta avser import-/förtullningsavgifter – moms (25 %) ingår alltid i priset och frakt redovisas enligt ovan. Mer information finns på sidan <a href="/eu-lager-garanti">EU-lager &amp; tull</a>.</p>
            <p><strong>Om leveransen dröjer:</strong> levererar vi inte i tid kan du ge oss en skälig extra tid. Kommer varan inte inom den kan du häva köpet. Du kan häva direkt om vi meddelar att vi inte kan leverera, om du före köpet sagt till oss att leverans senast en viss dag var avgörande, eller om förseningen annars har väsentlig betydelse för dig. Har du inte fått varan inom <strong>30 dagar</strong> från beställningen kan du alltid häva utan att först ge oss extra tid. Vid hävning får du tillbaka hela beloppet, inklusive frakt. Du kan också använda ångerrätten redan innan varan levererats. Kontakta oss på <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>.</p>

            <h2 id="ej-uthamtade" className={s.anker}>6. Ej uthämtade paket</h2>
            <p>Du ansvarar för att hämta ut ditt paket inom angiven tid (normalt 7–14 dagar hos ombud). Om paketet inte hämtas ut och returneras till oss förbehåller vi oss rätten att ta ut en administrativ avgift på upp till <strong>160 kr</strong> för att täcka leverantörens kostnader för hantering och returfrakt. Avgiften gäller dock <strong>inte</strong> om du har meddelat att du ångrar köpet (se punkt 7) – då hanteras paketet som en retur enligt din ångerrätt.</p>

            <h2 id="angerratt" className={s.anker}>7. Ångerrätt och öppet köp</h2>
            <p>{TOTAL_SUMMARY}</p>
            <p>Du har <strong>14 dagars ångerrätt</strong> enligt lag om distansavtal (2005:59), räknat från den dag du tog emot produkten. Vill du ångra ditt köp meddelar du oss inom 14 dagar och returnerar varan inom ytterligare 14 dagar. Ångerrätten gäller <strong>även innan varan hunnit levereras</strong> – du kan ångra dig så snart beställningen lagts.</p>
            <p>Under ångerfristen har du rätt att undersöka produktens egenskaper och funktion på motsvarande sätt som du skulle kunna göra i en fysisk butik. Har produkten hanterats i större omfattning än vad som varit nödvändigt för att fastställa dess egenskaper och funktion kan ett skäligt <strong>värdeminskningsavdrag</strong> göras på återbetalningen. Vi rekommenderar att originalförpackningen sparas och används vid retur när det är möjligt.</p>
            <p>Du utövar enklast din ångerrätt via vår <strong>ångerfunktion</strong> på sidan <a href="/angra-kop">Ångra köp</a> – fyll i din order, välj vilka artiklar du vill ångra och skicka. Du får då direkt ett <strong>automatiskt mottagningskvitto</strong> med ärendenummer och returadress. Du kan även meddela oss via e-post till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> eller använda den standardångerblankett som Konsumentverket tillhandahåller.</p>
            <p>Utöver den lagstadgade ångerrätten erbjuder Fyndplats frivilligt <strong>30 dagars öppet köp</strong> på alla produkter, räknat från den dag du tog emot leveransen. Det innebär att du har 30 dagar på dig att meddela oss att du vill returnera varan. För öppet köp under <strong>dag 15–30</strong> ska produkten vara oanvänd, komplett och i säljbart skick, och originalförpackningen ska finnas kvar när den utgör en del av produkten eller behövs för säker retur. Returen ska anmälas skriftligt med ordernummer innan varan skickas tillbaka, och skickas spårbart med spårningsnummer meddelat till oss. Under dag 15–30 återbetalas produktens pris; vad kunden betalat för leveransen till sig återbetalas inte. Returen ska postas inom <strong>7 dagar</strong> från anmälan; den lagstadgade fristen på 14 dagar under ångerrätten påverkas inte. På returer under dag 15–30 dras en <strong>bearbetningsavgift på 10 %</strong> av vad kunden betalat för produkten — avgiften gäller aldrig under den lagstadgade ångerfristen dag 1–14. Är produkten ofullständig eller inte längre i säljbart skick kan avdrag göras på återbetalningen. Lagens undantag – till exempel förseglade hygienartiklar och specialtillverkade produkter – gäller även här (se sidan <a href="/returer">Returer</a>).</p>
            <p><strong>Returfrakten betalas av kunden.</strong> Du anmäler returen via vår <a href="/angra-kop">ångerfunktion</a> eller via mejl till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> och får då returadressen samt instruktioner i bekräftelsemejlet. Du bokar själv hos valfri transportör som tar emot varans storlek och vikt (vi rekommenderar spårbar leverans). {SKRYMMANDE_RETURKOSTNAD}</p>
            <p><strong>Om returpaketet försvinner:</strong> packa varan väl, skicka spårbart och spara inlämningskvittot. Kan du visa att du lämnat in paketet står Fyndplats för risken om det försvinner eller skadas på vägen, om det inte beror på bristfällig förpackning eller fel adress. Skickar du tillbaka en <strong>felaktig eller skadad vara</strong> (reklamation, se punkt 8) står Fyndplats för både returfrakten och risken. Har varan skadats på vägen till dig, kontakta oss gärna inom 7 dagar så löser vi det snabbt. Din reklamationsrätt enligt punkt 8 påverkas inte.</p>
            <p>Återbetalning sker till ursprungligt betalmedel inom <strong>2–3 arbetsdagar</strong> efter att vi tagit emot och kontrollerat returen. Hur snabbt beloppet syns på kontot beror därefter på kundens bank. Lagens yttersta frist enligt 2 kap. 14 § distansavtalslagen gäller oavsett.</p>
            <p>Vid användning av den lagstadgade ångerrätten sker återbetalningen utan onödigt dröjsmål och senast inom den tid som följer av lag. För varor får Fyndplats hålla inne återbetalningen tills vi har fått tillbaka varan eller kunden har visat att varan har skickats tillbaka, beroende på vilket som inträffar först. Ångrar du hela köpet återbetalas även vad du betalat för vår billigaste standardleverans; har du valt ett dyrare leveranssätt återbetalas inte merkostnaden jämfört med standardleveransen.</p>
            <p>Fullständig information om hur du genomför en retur, vilka villkor som gäller och eventuella undantag (till exempel hygienprodukter) hittar du på sidan <a href="/returer">Returer &amp; ångerrätt</a>.</p>

            <h2 id="reklamation" className={s.anker}>8. Reklamation och garanti</h2>
            <p>Enligt <strong>konsumentköplagen (2022:260)</strong> har du tre (3) års reklamationsrätt på fel som fanns vid leverans. Fel som visar sig inom de första två åren antas ha funnits vid leverans, om inte annat kan bevisas.</p>
            <p>Reklamationen ska göras inom <strong>skälig tid</strong> efter att felet upptäckts – ett meddelande inom <strong>två månader</strong> räknas alltid som i rätt tid. Reklamationsrätten är fristående från ångerrätten och det öppna köpet, och gäller långt efter att de 30 dagarna löpt ut. Vid godkänd reklamation åtgärdar vi felet i första hand genom reparation eller utbyte. Är det inte möjligt erbjuder vi prisavdrag eller hävning av köpet.</p>
            <p>Reklamera genom att skicka ett e-postmeddelande till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> med ordernummer, beskrivning av felet samt foton. <strong>Skicka inte tillbaka en felaktig eller skadad vara innan vi bett dig om det</strong> — vi återkommer med hur returen ska gå till, och du slipper lägga ut för en frakt i onödan. Vid godkänd reklamation står Fyndplats för returkostnaden.</p>

            <h2 id="force-majeure" className={s.anker}>9. Force majeure</h2>
            <p>Fyndplats är befriat från ansvar vid omständigheter utanför vår kontroll som vi inte rimligen kunnat förutse, däribland krig, naturkatastrof, arbetskonflikt, myndighetsbeslut, störningar i kommunikation eller transport, samt liknande omständigheter som väsentligt försvårar fullgörandet av avtalet.</p>

            <h2 id="personuppgifter" className={s.anker}>10. Personuppgifter</h2>
            <p>Vi hanterar dina personuppgifter i enlighet med GDPR. Mer information om vilka uppgifter vi samlar in, hur de används och dina rättigheter finns i vår <a href="/sekretesspolicy">Sekretesspolicy</a>.</p>

            <h2 id="tvistelosning" className={s.anker}>11. Tvistelösning</h2>
            <p>Vi följer alltid <strong>Allmänna reklamationsnämndens (ARN)</strong> rekommendationer vid tvist. Om vi inte kommer överens i en reklamation kan du vända dig till ARN för opartisk prövning:</p>
            <div className="callout">
              <p>
                <strong>Allmänna reklamationsnämnden (ARN)</strong><br />
                Box 174, 101 23 Stockholm<br />
                Webbplats: <a href="https://www.arn.se" target="_blank" rel="noopener noreferrer">www.arn.se</a>
              </p>
            </div>
            {/* EU:s ODR-plattform låg här till 2026-09-10. Den stängde 20 juli 2025
                (förordning (EU) 2024/3228 upphävde 524/2013), och ec.europa.eu/consumers/odr
                omdirigerar numera till kommissionens egen nedläggningsnotis — vi skickade
                alltså en kund med en tvist till en sida som säger att vägen inte finns.
                Skyldigheten att länka dit föll med samma förordning. ARN ligger kvar; den
                följer av 5 § lagen (2015:671) om alternativ tvistlösning i konsument-
                förhållanden och är oförändrad. För gränsöverskridande köp pekar vi nu på
                ECC-nätverkets svenska kontor i stället. */}
            <p>Har du handlat från ett annat EU-land, Norge eller Island kan du få kostnadsfri rådgivning och hjälp med medling av <strong>Konsument Europa (ECC Sverige)</strong>, som drivs av Konsumentverket:</p>
            <p><a href="https://www.konsumenteuropa.se" target="_blank" rel="noopener noreferrer">www.konsumenteuropa.se</a></p>
            <p>Vid eventuell domstolsprövning tillämpas svensk lag och tvisten avgörs av svensk allmän domstol.</p>

            <h2 id="andring" className={s.anker}>12. Ändring av villkor</h2>
            <p>Fyndplats förbehåller sig rätten att uppdatera dessa villkor. Den senaste versionen finns alltid publicerad på denna sida. För redan lagda beställningar gäller de villkor som var i kraft vid köptillfället.</p>

            <h2 id="relaterade" className={s.anker}>Relaterade sidor</h2>
            <ul>
              <li><a href="/returer">Returer &amp; ångerrätt</a></li>
              <li><a href="/sekretesspolicy">Sekretesspolicy</a></li>
              <li><a href="/vara-butikspolicyer">Våra butikspolicyer</a></li>
              <li><a href="/vanliga-fragor">Vanliga frågor</a></li>
              <li><a href="/kontaktaoss">Kontakta oss</a></li>
            </ul>

            <p style={{ fontSize: 14, color: "var(--soft)", marginTop: 24 }}>Senast uppdaterad: 30 september 2026</p>
          </article>
        </div>
      </section>

      <section className="om-slut">
        <div className={`container om-slut-inner ${s.slut}`}>
          <h2>Frågor om villkoren?</h2>
          <p>Har du frågor är du alltid välkommen att <a href="/kontaktaoss">kontakta oss</a>.</p>
          <div className="om-cta">
            <a className="btn btn-primary" href="/kontaktaoss">Kontakta oss</a>
            <a className="btn om-btn-ljus" href="/returer">Returer &amp; ångerrätt</a>
          </div>
        </div>
      </section>
    </>
  );
}
