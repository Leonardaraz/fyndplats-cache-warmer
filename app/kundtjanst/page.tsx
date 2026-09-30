import type { Metadata } from "next";
import { jsonLdString } from "../../lib/seo";
import { DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS, DELIVERY_TIME, EU_STOCK_NOTE_SHORT, STANDARD_SHIPPING_KR, FREE_SHIPPING_OVER_KR } from "../../lib/shipping";
import { TOTAL_SHORT } from "../../lib/retur-policy";
import { Ikon, Svg } from "../../components/kundservice-ikoner";
import s from "./kundtjanst.module.css";

// Kundtjänst (2026-09-30). Tidigare tre kort, en punktlista och en länklista i
// ContentPage-mallen. Nu en servicehubb i samma form som /omoss: de vanligaste
// ärendena som kort med länk till sidan där de löses. Fakta är desamma som
// förut; frakt och leveranstid läses ur lib/shipping och ångerfristen ur
// lib/retur-policy, så de följer med om villkoren ändras.

const BESKRIVNING =
  "Fyndplats kundtjänst – hitta svar om frakt, returer och betalning, eller kontakta oss direkt. Vi svarar normalt inom 24 timmar.";

export const metadata: Metadata = {
  title: "Kundtjänst",
  description: BESKRIVNING,
  alternates: { canonical: "https://www.fyndplats.se/kundtjanst" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/kundtjanst", title: "Kundtjänst", description: BESKRIVNING, images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
};

type Arende = {
  ikon: React.ReactNode;
  rubrik: string;
  text: string;
  lankar: { href: string; text: string }[];
};

const ARENDEN: Arende[] = [
  {
    ikon: Ikon.paket,
    rubrik: "Spåra paket",
    text: "När paketet skickas får du en spårningskod via mejl. Ange den så ser du var paketet är.",
    lankar: [{ href: "/sparning", text: "Spåra ditt paket" }],
  },
  {
    ikon: Ikon.retur,
    rubrik: "Returer & ångerrätt",
    text: `${TOTAL_SHORT} Så anmäler du returen, packar och skickar tillbaka.`,
    lankar: [{ href: "/returer", text: "Läs om returer" }],
  },
  {
    ikon: Ikon.angra,
    rubrik: "Ångra köp",
    text: "Fyll i din order och välj vad du vill ångra, så får du direkt ett mottagningskvitto med returadress och nästa steg.",
    lankar: [{ href: "/angra-kop", text: "Ångra ett köp" }],
  },
  {
    ikon: Ikon.frakt,
    rubrik: "Frakt & leverans",
    text: `Frakt ${STANDARD_SHIPPING_KR} kr inom Sverige, fri frakt över ${FREE_SHIPPING_OVER_KR} kr. Leveranstid normalt ${DELIVERY_TIME}, med spårning via mejl. ${EU_STOCK_NOTE_SHORT}`,
    lankar: [
      { href: "/vanliga-fragor", text: "Vanliga frågor" },
      { href: "/eu-lager-garanti", text: "EU-lager & tull" },
    ],
  },
  {
    ikon: Ikon.betalning,
    rubrik: "Betalning med Klarna",
    text: "Betala tryggt med Klarna: direkt, mot faktura eller med delbetalning.",
    lankar: [{ href: "/kopvillkor", text: "Betalning i köpvillkoren" }],
  },
  {
    ikon: Ikon.service,
    rubrik: "Kontakta oss",
    text: "Mejl, telefon och formulär. Telefon vardagar 09–17, och vi svarar normalt inom 24 timmar.",
    lankar: [{ href: "/kontaktaoss", text: "Hör av dig" }],
  },
];

const MER = [
  { rubrik: "Villkor", href: "/kopvillkor", text: "Köpvillkor", not: "Fullständiga villkor för köp hos Fyndplats." },
  { rubrik: "Personuppgifter", href: "/sekretesspolicy", text: "Sekretesspolicy", not: "Så hanterar vi dina personuppgifter." },
  { rubrik: "Företaget", href: "/vara-butikspolicyer", text: "Våra butikspolicyer", not: "Företagsuppgifter och impressum." },
];

export default function Kundtjanst() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Kundtjänst", item: "https://www.fyndplats.se/kundtjanst" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />

      <section className="om-hero">
        <div className={`container ${s.heroGrid}`}>
          <div>
            <div className="eyebrow">Kundtjänst</div>
            <h1>Vad kan vi hjälpa dig med?</h1>
            <p className="om-lede">
              Här hittar du snabba svar om spårning, returer, frakt och betalning. Hittar du inte det du
              söker kan du kontakta oss direkt, vi svarar normalt inom 24 timmar.
            </p>
            <div className="om-cta">
              <a className="btn btn-primary" href="/sparning">Spåra paket</a>
              <a className="btn btn-ghost" href="/kontaktaoss">Kontakta oss</a>
            </div>
          </div>
          <aside className={s.heroKort} aria-label="Kundservice">
            <span className="om-ikon"><Svg d={Ikon.service} /></span>
            <h2>Kundservice</h2>
            <p>
              <a href="mailto:info@fyndplats.com">info@fyndplats.com</a>
              <br />
              <a href="tel:+46736630990">073-663 09 90</a>
            </p>
            <p className={s.heroNot}>Telefon vardagar 09–17. Vi svarar normalt inom 24 timmar.</p>
          </aside>
        </div>
      </section>

      <section className="om-fakta" aria-label="Snabba fakta">
        <div className="container om-fakta-grid">
          <div className="om-fakta-kort">
            <b>{STANDARD_SHIPPING_KR} kr</b>
            <span>Frakt, fri över {FREE_SHIPPING_OVER_KR} kr</span>
          </div>
          <div className="om-fakta-kort">
            <b>{DELIVERY_MIN_DAYS}–{DELIVERY_MAX_DAYS}<small> arbetsdagar</small></b>
            <span>Normal leveranstid</span>
          </div>
          <div className="om-fakta-kort">
            <b>30 dagar</b>
            <span>Att ångra eller returnera</span>
          </div>
          <div className="om-fakta-kort">
            <b>24<small> timmar</small></b>
            <span>Normal svarstid</span>
          </div>
        </div>
      </section>

      <section className="om-sektion">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Vanliga ärenden</div>
              <h2>Välj vad du behöver hjälp med</h2>
            </div>
            <a className="btn-quiet" href="/vanliga-fragor">Alla vanliga frågor</a>
          </div>
          <div className={s.arendeGrid}>
            {ARENDEN.map((a) => (
              <div className="om-lofte" key={a.rubrik}>
                <span className="om-ikon"><Svg d={a.ikon} /></span>
                <h3>{a.rubrik}</h3>
                <p>{a.text}</p>
                <div className={s.lankar}>
                  {a.lankar.map((l) => (
                    <a className="btn-quiet" key={l.href} href={l.href}>{l.text}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`om-sektion ${s.merSek}`}>
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Mer information</div>
              <h2>Villkor och företagsuppgifter</h2>
            </div>
          </div>
          <div className="om-kontakt-grid">
            {MER.map((m) => (
              <div className="om-kontakt" key={m.href}>
                <h3>{m.rubrik}</h3>
                <p><a href={m.href}>{m.text}</a></p>
                <p className="om-not">{m.not}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="om-slut">
        <div className="container om-slut-inner">
          <h2>Hittar du inte svaret?</h2>
          <p>
            Mejla <a className={s.ljusLank} href="mailto:info@fyndplats.com">info@fyndplats.com</a> eller ring{" "}
            <a className={s.ljusLank} href="tel:+46736630990">073-663 09 90</a> (vardagar 09–17). Vi svarar normalt inom 24 timmar.
          </p>
          <div className="om-cta">
            <a className="btn btn-primary" href="/kontaktaoss">Kontakta oss</a>
            <a className="btn om-btn-ljus" href="/vanliga-fragor">Vanliga frågor</a>
          </div>
        </div>
      </section>
    </>
  );
}
