import type { Metadata } from "next";
import { ContentPage } from "../../components/content";

export const metadata: Metadata = {
  title: "Returer & ångerrätt",
  description: "30 dagars öppet köp hos Fyndplats. Anmäl din retur via mejl, packa säkert och skicka tillbaka — så här går det till, steg för steg.",
  alternates: { canonical: "https://www.fyndplats.se/returer" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/returer", title: "Returer & ångerrätt", description: "30 dagars öppet köp hos Fyndplats. Anmäl din retur via mejl, packa säkert och skicka tillbaka — så här går det till, steg för steg.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
};

export default function Returer() {
  return (
    <ContentPage
      eyebrow="Kundservice"
      title="Så här gör du en retur"
      lead="Du har 30 dagars öppet köp på alla produkter (utöver de 14 dagars ångerrätt som svensk konsumentlag kräver)."
    >
      <div className="callout">
        <p><strong>Vill du ångra ditt köp?</strong> Enklast gör du det via vår <a href="/angra-kop">ångerfunktion</a> – fyll i din order, välj vilka artiklar du vill ångra och skicka. Du får direkt ett automatiskt mottagningskvitto med returadress och nästa steg. Ångerrätten gäller <strong>även innan paketet hunnit fram</strong>.</p>
      </div>

      <h2>1. Anmäl returen</h2>
      <p>Använd vår <a href="/angra-kop">ångerfunktion</a>, eller mejla <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> med ditt <strong>ordernummer</strong>, <strong>vilken produkt</strong> du vill returnera och <strong>anledning</strong> (frivilligt). Du får en automatisk bekräftelse med returadressen och nästa steg.</p>

      <h2>2. Packa produkten säkert</h2>
      <p>Använd helst originalförpackningen. Lägg med en lapp med ditt ordernummer och namn så vi kan koppla returen rätt.</p>

      <h2>3. Skicka tillbaka paketet</h2>
      <p>Skicka till returadressen du fick i bekräftelsemejlet. <strong>Returfrakten betalas av kunden</strong> — välj valfri leveranstjänst (PostNord, DHL, Schenker). Vi rekommenderar <strong>spårbar leverans</strong> så du har bevis på avsändning.</p>

      <h2>4. Skicka oss spårningsnumret</h2>
      <p>Svara på bekräftelsemejlet med ditt spårningsnummer så håller vi koll på returen.</p>

      <h2>5. Återbetalning</h2>
      <p>Vi återbetalar inom 5–10 bankdagar efter att vi tagit emot och kontrollerat produkten. Pengarna går till ursprungligt betalmedel (kort, Klarna, Swish).</p>

      <h2>Returvillkor</h2>
      <ul>
        <li><strong>30 dagars öppet köp</strong> från leveransdatum</li>
        <li>Produkten ska vara <strong>oanvänd och i originalförpackning</strong> med alla tillbehör</li>
        <li><strong>Returfrakten betalas av kunden</strong></li>
        <li>Spårbar leverans rekommenderas — Fyndplats ansvarar inte för förlorade returpaket</li>
        <li><strong>Vid felaktig produkt vid leverans:</strong> kontakta oss inom 14 dagar — vi löser det på annat sätt (du behöver inte returnera felaktiga produkter på egen bekostnad)</li>
      </ul>

      <p>Frågor? Mejla <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> — vi svarar inom 24 timmar.</p>
    </ContentPage>
  );
}
