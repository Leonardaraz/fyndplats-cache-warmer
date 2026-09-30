import type { Metadata } from "next";
import { jsonLdString } from "../../lib/seo";
import { ContactForm } from "../../components/contactform";
import { Ikon, Svg } from "../../components/kundservice-ikoner";
import s from "./kontaktaoss.module.css";

// Kontakta oss (2026-09-30). Samma uppgifter som förut (mejl, telefon, adress,
// svarstider, formuläret), men i /omoss-formen: kontaktvägarna som kort överst,
// formuläret bredvid svarstiderna och genvägar till ärenden som löses direkt
// på sajten. Svarstiderna står ordagrant som i den tidigare rutan.

const BESKRIVNING =
  "Hör av dig till Fyndplats kundtjänst – e-post, telefon eller kontaktformulär. Vi svarar normalt inom 24 timmar, vardagar 09–17.";

export const metadata: Metadata = {
  title: "Kontakta oss",
  description: BESKRIVNING,
  alternates: { canonical: "https://www.fyndplats.se/kontaktaoss" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/kontaktaoss", title: "Kontakta oss", description: BESKRIVNING, images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
};

const GENVAGAR = [
  { href: "/sparning", text: "Spåra paket" },
  { href: "/angra-kop", text: "Ångra köp" },
  { href: "/returer", text: "Returer & ångerrätt" },
  { href: "/vanliga-fragor", text: "Vanliga frågor" },
];

export default function Kontakta() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Kontakta oss", item: "https://www.fyndplats.se/kontaktaoss" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />

      <section className="om-hero">
        <div className="container">
          <div className={s.heroText}>
            <div className="eyebrow">Kundservice</div>
            <h1>Kontakta oss</h1>
            <p className="om-lede">
              Vi finns här när du behöver oss. Hör av dig på det sätt som passar dig bäst, vi svarar normalt
              inom 24 timmar.
            </p>
            <div className="om-cta">
              <a className="btn btn-primary" href="#meddelande">Skicka ett meddelande</a>
              <a className="btn btn-ghost" href="mailto:info@fyndplats.com">Mejla oss</a>
            </div>
          </div>
        </div>
      </section>

      <section className="om-sektion" aria-label="Kontaktvägar">
        <div className={`container ${s.kanalGrid}`}>
          <div className="om-lofte">
            <span className="om-ikon"><Svg d={Ikon.mejl} /></span>
            <h3>E-post</h3>
            <a className={s.kanal} href="mailto:info@fyndplats.com">info@fyndplats.com</a>
            <p>Snabbast når du oss via mejl. Har du en pågående order? Ange gärna ditt ordernummer.</p>
          </div>
          <div className="om-lofte">
            <span className="om-ikon"><Svg d={Ikon.telefon} /></span>
            <h3>Telefon</h3>
            <a className={s.kanal} href="tel:+46736630990">073-663 09 90</a>
            <p>Måndag–fredag kl. 09:00–17:00.</p>
          </div>
          <div className="om-lofte">
            <span className="om-ikon"><Svg d={Ikon.adress} /></span>
            <h3>Adress</h3>
            <span className={s.kanal}>Bergviksgatan 10<br />152 44 Södertälje</span>
            <p>Fyndplats är en ren webbutik. Adressen är inte ett lager, och vi har ingen butik eller upphämtning där.</p>
          </div>
        </div>
      </section>

      <section className={`om-sektion ${s.formSek}`} id="meddelande">
        <div className={`container ${s.formGrid}`}>
          <div>
            <div className="eyebrow">Formulär</div>
            <h2>Skicka ett meddelande</h2>
            <p className={s.ingress}>Fyll i formuläret så återkommer vi så snart vi kan. Har du en pågående order? Ange gärna ditt ordernummer.</p>
            <div className={s.formKort}>
              <ContactForm />
            </div>
          </div>
          <aside className={s.sida}>
            <div className="om-kontakt">
              <h3>Svarstider</h3>
              <ul className={s.tider}>
                <li>
                  <span className={s.tidIkon}><Svg d={Ikon.klocka} /></span>
                  <span>Vi besvarar mejl och samtal måndag–fredag kl. 09:00–17:00.</span>
                </li>
                <li>
                  <span className={s.tidIkon}><Svg d={Ikon.mejl} /></span>
                  <span>Mejl som kommer in efter 16:00 besvaras normalt nästa arbetsdag.</span>
                </li>
                <li>
                  <span className={s.tidIkon}><Svg d={Ikon.service} /></span>
                  <span>Vi strävar efter att svara inom 24 timmar på alla förfrågningar.</span>
                </li>
              </ul>
            </div>
            <div className="om-kontakt">
              <h3>Löses direkt på sajten</h3>
              <ul className="om-lankar">
                {GENVAGAR.map((g) => (
                  <li key={g.href}><a href={g.href}>{g.text}</a></li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
