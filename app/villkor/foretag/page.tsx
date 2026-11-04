// /villkor/foretag — villkoren för företagskonto (E3-12, J3).
//
// ☠️ UTKAST. Texten är docs/medlemskap-foretagsvillkor-utkast.md och ska
// granskas av en jurist och godkännas av Leonard innan företagskontot öppnas
// för alla (prisväxeln `pa`). Hakparenteserna är luckor som Leonard fyller i.
// Sidan indexeras inte och länkas bara från formuläret på Mina sidor, som
// syns först när prisväxeln släpper fram kontot.
//
// Versionen här ska vara densamma som VILLKOR_FORETAG_VERSION
// (lib/medlem/foretag.ts). Ändras texten i sak höjs versionen, och varje
// företag får godkänna den nya innan kontot prissätts som företag igen.

import type { Metadata } from "next";
import { ContentPage } from "../../../components/content";
import { VILLKOR_FORETAG_VERSION } from "@/lib/medlem/foretag";

export const metadata: Metadata = {
  title: "Villkor för företagskonto",
  description: "Villkoren som gäller när ett företag handlar med ett företagskonto hos Fyndplats.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.fyndplats.se/villkor/foretag" },
};

export default function ForetagsVillkor() {
  return (
    <ContentPage
      eyebrow="Företagskonto"
      title="Villkor för företagskonto"
      lead={`Version ${VILLKOR_FORETAG_VERSION}, utkast. Gäller från [datum].`}
    >
      <h2>1. Parter och tillämpning</h2>
      <p>1.1 Villkoren gäller när ett företag (köparen) handlar hos Fyndplats, [bolagsnamn], org.nr [nummer] (vi), med ett företagskonto på fyndplats.se.</p>
      <p>
        1.2 Ett företagskonto kan öppnas av ett svenskt aktiebolag, handelsbolag, kommanditbolag, ekonomisk förening eller
        en enskild näringsidkare. Den som öppnar kontot försäkrar att köpen görs i näringsverksamhet och att hen får företräda
        köparen.
      </p>
      <p>
        1.3 Köp med företagskontot görs i näringsverksamhet. Konsumentköplagen och lagen om distansavtal gäller därför inte,
        och ångerrätt enligt lag finns inte. Det öppna köp som står i punkt 7 gäller ändå, som en förmån från oss.
      </p>
      <p>
        1.4 Vid köp gäller de villkor som var gällande när beställningen lades. Ändrar vi villkoren meddelar vi det på kontot
        innan ändringen gäller, och nästa köp som företag kräver att den nya versionen godkänns.
      </p>

      <h2>2. Kontot och uppgifterna</h2>
      <p>
        2.1 Vi kontrollerar organisationsnumret och kan fråga Bolagsverket om bolagets namn och status. Vi får neka eller
        stänga ett företagskonto, till exempel om uppgifterna inte stämmer eller om bolaget har avregistrerats.
      </p>
      <p>
        2.2 För en enskild firma är organisationsnumret innehavarens personnummer. Vi behandlar det enligt vår{" "}
        <a href="/sekretesspolicy">sekretesspolicy</a> och visar det bara maskerat.
      </p>
      <p>2.3 Köparen ansvarar för att adresser och kontaktuppgifter är riktiga och hålls uppdaterade.</p>

      <h2>3. Priser</h2>
      <p>
        3.1 När kontot handlar som företaget visas priserna exklusive moms, märkta med &quot;exkl. moms&quot;. I kassan
        visas priserna inklusive moms (25 %), och det är det beloppet som betalas.
      </p>
      <p>3.2 Köparen får den högsta av två rabatter, aldrig båda:</p>
      <ul>
        <li>medlemsnivåns procent, som för privatpersoner, räknad på vad som handlats med kontots e-postadress de senaste 365 dagarna; eller</li>
        <li>ordertrappan, räknad på orderns rabattgrundande varuvärde exklusive moms.</li>
      </ul>
      <table>
        <thead>
          <tr>
            <th scope="col">Varuvärde exkl. moms</th>
            <th scope="col">Rabatt</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>under 5 000 kr</td><td>0 %</td></tr>
          <tr><td>från 5 000 kr</td><td>1 %</td></tr>
          <tr><td>från 10 000 kr</td><td>2 %</td></tr>
          <tr><td>från 20 000 kr</td><td>3 %</td></tr>
          <tr><td>från 30 000 kr</td><td>4 %</td></tr>
          <tr><td>från 50 000 kr</td><td>5 %</td></tr>
        </tbody>
      </table>
      <p>
        3.3 Rabatten är högst 5 %. Vissa varor ger lägre rabatt eller ingen alls, till exempel varor i Fyndauktionen och
        varor där rabatten skulle ta priset under vår lägsta nivå. Varukorgen visar vad som gäller innan köpet.
      </p>
      <p>3.4 Priset låses när köparen går till kassan och gäller i 24 timmar. Därefter räknas det om.</p>

      <h2>4. Offert</h2>
      <p>4.1 Från 6 exemplar av samma vara, eller från 20 000 kr exklusive moms, kan köparen begära en offert i varukorgen.</p>
      <p>
        4.2 En offert gäller i 14 dagar från att den skickats. Den betalas i vår vanliga kassa via länken i offerten.
        Offertens priser ersätter rabatterna i punkt 3 för de varor och antal som offerten gäller.
      </p>
      <p>4.3 En offert är bindande för oss först när den är betald, och så länge varorna finns i lager.</p>

      <h2>5. Betalning</h2>
      <p>
        5.1 Köparen betalar med kort, med Klarna på Klarnas villkor, eller mot förskottsfaktura. En förskottsfaktura betalas
        innan varorna skickas; ordern skickas när betalningen har kommit in.
      </p>
      <p>5.2 Kvitto och faktura med köparens namn, organisationsnummer och adress skickas med e-post.</p>

      <h2>6. Leverans</h2>
      <p>6.1 Leveranstid och frakt följer det som gäller för alla kunder på fyndplats.se och visas innan köpet.</p>
      <p>6.2 Köparen ska undersöka varorna vid mottagandet och anmäla transportskador till oss inom [7] dagar.</p>

      <h2>7. Öppet köp och retur</h2>
      <p>7.1 Köparen har samma öppna köp som privatpersoner: [30] dagar från mottagandet, enligt villkoren på fyndplats.se.</p>
      <p>7.2 Vid retur av en del av en order återbetalas det pris som betalades för de returnerade varorna. Ordertrappan räknas inte om.</p>

      <h2>8. Fel i vara</h2>
      <p>8.1 Fel ska anmälas inom skälig tid efter att det upptäcktes, och senast [två år] efter leveransen (köplagen 32 §).</p>
      <p>8.2 Vid fel avhjälper vi felet, levererar en ny vara eller ger prisavdrag eller återbetalning.</p>

      <h2>9. Ansvar</h2>
      <p>9.1 Vi ansvarar inte för indirekta skador, som utebliven vinst, produktionsbortfall eller följdskador, utom vid grov vårdslöshet eller uppsåt.</p>
      <p>9.2 Vårt ansvar för en order är begränsat till det belopp som köparen betalat för den.</p>

      <h2>10. Personuppgifter</h2>
      <p>
        Vi behandlar personuppgifter om kontaktpersonen och, för en enskild firma, om innehavaren, enligt vår{" "}
        <a href="/sekretesspolicy">sekretesspolicy</a>.
      </p>

      <h2>11. Tvist</h2>
      <p>Svensk lag gäller. En tvist avgörs av allmän domstol, med [ort] tingsrätt som första instans.</p>
    </ContentPage>
  );
}
