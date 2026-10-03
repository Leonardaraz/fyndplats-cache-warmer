import type { Metadata } from "next";
import { jsonLdString } from "../../lib/seo";
import { TrackingWidget } from "../../components/tracking";
import { DELIVERY_TIME, FREE_SHIPPING_OVER_KR } from "../../lib/shipping";
import s from "./sparning.module.css";

// Spåra paket (2026-09-30). Formuläret (components/tracking.tsx) är oförändrat
// och står i fokus i heron. Under det förklaras de fem stegen som widgeten
// visar (Beställd → Levererad), med samma ord som spårningen, Vanliga frågor
// och den tidigare rutan om skanningar.
//
// INDEXERAD sedan 2026-10-02 (Leonard). Sidan hade noindex sedan första
// versionen, utan uttalat skäl. Kunder söker "fyndplats spåra paket"; den som
// hittar hit slipper mejla. Själva sidan visar inga orderuppgifter förrän
// kunden skriver in ett nummer, och svaret hämtas i webbläsaren. Frågorna nedan
// bär sidans innehåll; svaren följer villkoren i Vanliga frågor och
// lib/shipping.ts, så de två sidorna säger samma sak.

export const metadata: Metadata = {
  title: "Spåra paket",
  description: `Spåra ditt paket från Fyndplats. Ange spårningsnumret från leveransmejlet så ser du var paketet är. Leveranstid ${DELIVERY_TIME}, skickas från EU-lager.`,
  alternates: { canonical: "https://www.fyndplats.se/sparning" },
};

// Frågorna står både på sidan och i FAQPage-datan, från samma lista.
const FRAGOR: { q: string; a: string }[] = [
  {
    q: "När får jag mitt spårningsnummer?",
    a: "Vi mejlar spårningsnumret när paketet lämnar lagret. Ibland tar det 1–2 dagar innan fraktbolaget har registrerat paketet och spårningen visar något, så vänta gärna en dag om numret inte ger träff direkt.",
  },
  {
    q: "Var hittar jag spårningsnumret?",
    a: "I leveransmejlet som vi skickar när paketet lämnar lagret. Där finns också en länk direkt till spårningen. Har du inte fått mejlet, titta i skräpposten eller kontakta oss med ditt ordernummer.",
  },
  {
    q: "Varför kommer min beställning i flera paket?",
    a: "Beställer du flera varor kan de skickas från olika lager inom EU. Varje paket får då ett eget spårningsnummer. Alla numren står i samma leveransmejl, och paketen kan komma olika dagar.",
  },
  {
    q: "Vilket fraktbolag levererar mitt paket?",
    a: "Det beror på varan och på var du bor, till exempel DHL eller DPD. Spårningen visar vilket fraktbolag som har paketet och om det levereras hem till dig eller till ett utlämningsställe.",
  },
  {
    q: "Spårningen har inte ändrats på flera dagar. Är något fel?",
    a: "Oftast inte. Paketet skannas bara på vissa ställen på vägen, till exempel när det byter fraktbolag mellan länder, och däremellan står spårningen still. Är du orolig kan du mejla oss ditt ordernummer, så kontrollerar vi med fraktbolaget.",
  },
  {
    q: "Det står levererat, men jag har inget paket.",
    a: "Titta i brevlådan, hos grannar och efter en avisering om att paketet finns att hämta. Hittar du det inte, kontakta oss så snart du kan med ditt ordernummer, så utreder vi saken med fraktbolaget.",
  },
  {
    q: "Vad händer om jag inte hämtar ut paketet?",
    a: "Paket som inte hämtas inom utlämningstiden skickas tillbaka till oss. Vi kan då ta ut en administrativ avgift på upp till 160 kr för leverantörens hanterings- och fraktkostnad. Avgiften gäller inte om du har ångrat köpet. Hör av dig direkt om du har fått förhinder.",
  },
  {
    q: "Paketet kom fram skadat. Vad gör jag?",
    a: "Kontakta oss gärna inom 7 dagar på info@fyndplats.com med ditt ordernummer och en bild på skadan, så löser vi det med en ny produkt eller återbetalning. Din reklamationsrätt enligt konsumentköplagen gäller oavsett.",
  },
  {
    q: "Hur lång är leveranstiden, och tillkommer tull?",
    a: `Vanlig leveranstid är ${DELIVERY_TIME} från beställning, under storhelger ibland något längre. Allt skickas från lager inom EU, så ingen importtull eller förtullningsavgift tillkommer. Frakten är fri över ${FREE_SHIPPING_OVER_KR} kr.`,
  },
];

const STEG = [
  { namn: "Beställd", text: "Ordern är registrerad och packas på lager inom EU." },
  { namn: "Skickad", text: "När paketet lämnar lagret får du en spårningskod via mejl. Ibland tar det 1–2 dagar innan spårningen aktiveras." },
  { namn: "På väg", text: "Paketet rör sig hos fraktbolaget. Står spårningen still en stund är det helt normalt mellan skanningar." },
  { namn: "Nära dig", text: "Paketet är ute för leverans eller finns att hämta. Hämta det inom utlämningstiden." },
  { namn: "Levererad", text: `Vanlig leveranstid är ${DELIVERY_TIME} från beställning.` },
];

export default function Sparning() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Spåra paket", item: "https://www.fyndplats.se/sparning" },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FRAGOR.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqLd) }} />

      <section className={`om-hero ${s.hero}`}>
        <div className="container">
          <div className={s.heroText}>
            <div className="eyebrow">Spårning</div>
            <h1>Var är ditt fynd?</h1>
            <p className="om-lede">Klistra in ditt spårningsnummer nedan, så visar vi precis var paketet är – hela vägen hem till din dörr.</p>
          </div>
          <div className={s.sok}>
            <TrackingWidget />
          </div>
        </div>
      </section>

      <section className="om-sektion">
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Leveransen</div>
              <h2>Så går leveransen till</h2>
            </div>
          </div>
          <ol className={`om-tid ${s.steg}`}>
            {STEG.map((st, i) => (
              <li key={st.namn}>
                <span className="om-tid-nar">Steg {i + 1}</span>
                <h3>{st.namn}</h3>
                <p>{st.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`om-sektion ${s.faqSek}`}>
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Vanliga frågor</div>
              <h2>Frågor om spårning och leverans</h2>
            </div>
          </div>
          <div className={s.faq}>
            {FRAGOR.map((f) => (
              <details key={f.q} className={s.faqRad}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <p className={s.faqNot}>Fler svar om frakt, returer och betalning finns i <a href="/vanliga-fragor">Vanliga frågor</a>.</p>
        </div>
      </section>

      <section className={`om-sektion ${s.hjalpSek}`}>
        <div className="container">
          <div className="om-rubrikrad">
            <div>
              <div className="eyebrow">Hjälp</div>
              <h2>Frågor om ditt paket</h2>
            </div>
          </div>
          <div className={`om-kontakt-grid ${s.fragor}`}>
            <div className="om-kontakt">
              <h3>Ingen rörelse i spårningen?</h3>
              <p>Det är helt normalt mellan skanningar. Hör gärna av dig till <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> om du undrar.</p>
            </div>
            <div className="om-kontakt">
              <h3>Vill du ångra köpet?</h3>
              <p>Ångerrätten gäller även innan paketet hunnit fram.</p>
              <p className="om-not"><a href="/angra-kop">Ångra köp</a> · <a href="/returer">Returer &amp; ångerrätt</a></p>
            </div>
            <div className="om-kontakt">
              <h3>Kundservice</h3>
              <p><a href="mailto:info@fyndplats.com">info@fyndplats.com</a><br /><a href="tel:+46736630990" style={{ whiteSpace: "nowrap" }}>+46 73 663 09 90</a></p>
              <p className="om-not">Telefon vardagar 09–17. Vi svarar normalt inom 24 timmar.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
