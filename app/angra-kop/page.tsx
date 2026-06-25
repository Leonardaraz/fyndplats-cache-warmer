import type { Metadata } from "next";
import { ContentPage } from "../../components/content";
import AngraForm from "../../components/angra-form";

export const metadata: Metadata = {
  title: "Ångra köp",
  description:
    "Ångra ditt köp hos Fyndplats direkt på sajten. Du har 14 dagars ångerrätt enligt lag — välj order och artiklar, så skickar vi ett mottagningskvitto med returadress och nästa steg.",
  alternates: { canonical: "https://www.fyndplats.se/angra-kop" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Fyndplats",
    url: "https://www.fyndplats.se/angra-kop",
    title: "Ångra köp",
    description:
      "Ångra ditt köp hos Fyndplats direkt på sajten. 14 dagars ångerrätt enligt lag — enkelt och tydligt.",
    images: [
      "https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg",
    ],
  },
};

export default function AngraKop() {
  return (
    <ContentPage
      eyebrow="Ångerrätt"
      title="Ångra ditt köp"
      lead="Ändrat dig? Du har rätt att ångra ditt köp – och det ska vara lika enkelt som att handla. Fyll i din order nedan, välj vad du vill ångra, så får du direkt ett mottagningskvitto med returadress och nästa steg."
    >
      <AngraForm />

      <h2>Så fungerar ångerrätten</h2>
      <ul>
        <li>
          <strong>14 dagars ångerrätt enligt lag.</strong> Fristen räknas från den dag du
          (eller någon du utsett) tog emot varan. Utöver detta har du{" "}
          <strong>30 dagars öppet köp</strong> hos oss.
        </li>
        <li>
          <strong>Gäller även innan paketet kommit fram.</strong> Du kan ångra dig så snart du
          lagt din order – även medan paketet är på väg. Ångerfristen börjar faktiskt löpa
          först när du fått varan.
        </li>
        <li>
          <strong>Returfrakten betalas av dig som kund</strong> vid ångrat köp. Välj valfri
          spårbar leveranstjänst. (Är varan trasig eller fel är det en reklamation – då står{" "}
          <strong>Fyndplats för returfrakten</strong>, se nedan.)
        </li>
        <li>
          <strong>Varan ska vara oanvänd</strong> och i originalförpackning med alla tillbehör.
        </li>
        <li>
          <strong>Återbetalning inom 5–10 bankdagar</strong> efter att vi tagit emot och
          kontrollerat returen, till ditt ursprungliga betalmedel. Har du betalat frakt
          återbetalas även standardfrakten.
        </li>
        <li>
          <strong>Vissa varor är undantagna</strong> ångerrätt enligt lag, t.ex. förseglade
          hygienartiklar där förseglingen brutits eller specialtillverkade produkter.
        </li>
      </ul>

      <h2>Trasig eller felaktig vara?</h2>
      <p>
        Då är det en <strong>reklamation</strong>, inte en ångran. Vid fel på varan eller skada
        vid leverans står <strong>Fyndplats för returkostnaden</strong> – mejla{" "}
        <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> med ditt ordernummer och{" "}
        <strong>foton</strong> på felet, så löser vi det. Läs mer på{" "}
        <a href="/returer">Returer &amp; ångerrätt</a>.
      </p>

      <h2>Mottagningskvitto</h2>
      <p>
        När du skickar din ångeranmälan får du automatiskt ett mottagningskvitto via e-post med
        ett ärendenummer. Kvittot är ditt bevis på att du ångrat köpet i tid – men är inte ett
        godkännande av returen i sig; vi behandlar ärendet och återkommer.
      </p>

      <p style={{ fontSize: 14, color: "var(--soft)", marginTop: 24 }}>
        Se även våra fullständiga <a href="/kopvillkor">köpvillkor</a> och{" "}
        <a href="/returer">returvillkor</a>.
      </p>
    </ContentPage>
  );
}
