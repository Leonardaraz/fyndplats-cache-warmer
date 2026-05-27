import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Returer & ångerrätt",
  description: "14 dagars ångerrätt enligt distansavtalslagen. Så här gör du en retur hos Fyndplats – steg för steg.",
  alternates: { canonical: "https://www.fyndplats.se/returer" },
};

export default function Returer() {
  return (
    <ContentPage
      eyebrow="Kundservice"
      title="Returer & ångerrätt"
      lead="Enligt EU:s konsumentskyddslagstiftning har du rätt att ångra ditt köp inom 14 dagar från den dag produkten tagits emot. Vid vissa högtider och kampanjer kan ångerrätten förlängas – det visas då på hemsidan innan köp."
    >
      <h2>Så här gör du en retur</h2>
      <ol>
        <li>Kontakta vår kundtjänst på <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> eller via kontaktformuläret på <a href="/kontaktaoss">Kontakta oss</a>. Ange beställarens namn, ordernummer och beställningsdatum.</li>
        <li>Vår kundtjänst skickar dig en retursedel via mejl.</li>
        <li>Packa produkterna noggrant i sin originalförpackning så de inte skadas under leverans. Lägg med ett brev med ditt namn och ordernumret.</li>
        <li>Lämna in paketet till ditt närmaste ombud enligt instruktionerna på retursedeln.</li>
        <li>Spara returkvittot – det behövs om det skulle uppstå problem under leveransen. Kunden ansvarar själv för returen, men vi hjälper dig naturligtvis att hitta ett eventuellt borttappat paket.</li>
      </ol>

      <div className="callout">
        <p>Returer hanteras inom 1–2 veckor efter att de kommit fram. Under högsäsong kan det uppstå några dagars förseningar i hanteringen.</p>
      </div>

      <h2>Återbetalning</h2>
      <p>Har du returnerat skor eller kläder gratis återbetalas hela köpet via Klarna. Vid retur av andra produkter återbetalas köpet minus returavgiften via Klarna.</p>
      <p>Alla köp återbetalas via Klarna på samma betalningsmetod som köpet gjordes. Klarna kontaktar dig när återbetalningen är slutförd.</p>

      <h2>Villkor för retur</h2>
      <p><strong>Återlämnade produkter måste vara oanvända.</strong> Produkten måste returneras i oskadad originalförpackning, och alla etiketter och instruktioner som medföljde produkten ska inkluderas. Produkten får inte vara smutsig eller ha spår av användning, till exempel hår.</p>
      <p>Tryck, skriv eller limma inte något extra på originalförpackningen. Om produkten har tydliga märken av användning eller originalförpackningen är skadad accepteras inte returen. I sådana fall kan Fyndplats kräva ersättning för varans värdeminskning, eller skicka tillbaka varan.</p>
      <p>Om produkten levereras i ett paket du inte kan öppna utan att skada förpackningen har du rätt att öppna paketet och inspektera produkten utan att förlora ångerrätten. Detta gäller dock inte hygienprodukter (tyngdtäcke, påslakan och in-ear-hörlurar).</p>

      <h3>Byte</h3>
      <p>Vi erbjuder tyvärr inte byte på samma beställning. Vill du byta storlek eller produkt returnerar du din nuvarande beställning och lägger en ny order.</p>

      <h3>Om du inte hämtar ut ditt paket</h3>
      <p>Du ansvarar för att ta emot eller hämta din leverans enligt de instruktioner du får vid beställningen. Paket som inte hämtas inom angiven tid skickas tillbaka. I dessa fall har vi rätt att ta ut en administrativ kostnad på högst 160 kr, motsvarande leverantörens kostnader för hantering och frakt.</p>
    </ContentPage>
  );
}
