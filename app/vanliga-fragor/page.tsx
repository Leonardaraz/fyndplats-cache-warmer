import type { Metadata } from "next";
import { TOTAL_SUMMARY, TOTAL_SHORT, COMPLAINT, AVGIFT_SENTENCE } from "../../lib/retur-policy";
import { SKRYMMANDE_RETURKOSTNAD } from "../../lib/retur-frakt";
import { DELIVERY_TIME, DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS, STANDARD_SHIPPING_KR, FREE_SHIPPING_OVER_KR } from "../../lib/shipping";
import { jsonLdString } from "../../lib/seo";
import s from "./vanliga-fragor.module.css";

// Vanliga frågor (2026-09-30). Samma frågor och svar som förut, ordagrant, men
// uppdelade i ämnen med en ämnesrad överst och Om oss-sidans formspråk (om-*
// i app/globals.css). FAQPage-schemat byggs ur exakt samma lista, i samma
// ordning som sidan visar den, så synligt och schema kan inte glida isär.

export const metadata: Metadata = {
  title: "Vanliga frågor",
  description: "Svar på vanliga frågor om beställning, betalning, frakt och returer hos Fyndplats. Hitta hjälpen du behöver snabbt.",
  alternates: { canonical: "https://www.fyndplats.se/vanliga-fragor" },
  openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", url: "https://www.fyndplats.se/vanliga-fragor", title: "Vanliga frågor", description: "Svar på vanliga frågor om beställning, betalning, frakt och returer hos Fyndplats. Hitta hjälpen du behöver snabbt.", images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg"] },
};

const Ikon = {
  betalning: <path d="M3 6.5h18v11H3z M3 10h18 M7 14.5h4" />,
  frakt: <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7z M7 18.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z M17.5 18.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z" />,
  eu: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M3.5 9h17 M3.5 15h17 M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9 M12 3c-2.5 2.6-3.7 5.6-3.7 9s1.2 6.4 3.7 9" />,
  retur: <path d="M9 14L4 9l5-5 M4 9h11a5 5 0 0 1 5 5v1" />,
  service: <path d="M4 13v-1a8 8 0 0 1 16 0v1 M4 13h3v6H5a1 1 0 0 1-1-1v-5Z M20 13h-3v6h2a1 1 0 0 0 1-1v-5Z M17 19c0 1.5-2 2.5-5 2.5" />,
};

function Svg({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

type Fraga = { q: string; a: string };
type Amne = {
  id: string;
  kort: string;
  rubrik: string;
  ikon: React.ReactNode;
  intro: string;
  lankar: { href: string; text: string }[];
  fragor: Fraga[];
};

// Frågorna och svaren är desamma som före ämnesindelningen, ord för ord. Bara
// ordningen har ändrats, så att frågor om samma sak står tillsammans.
const AMNEN: Amne[] = [
  {
    id: "bestallning-betalning",
    kort: "Betalning",
    rubrik: "Beställning & betalning",
    ikon: Ikon.betalning,
    intro: "Alla betalningar går via Klarna: direkt, mot faktura eller uppdelat.",
    lankar: [{ href: "/kopvillkor", text: "Köpvillkor" }],
    fragor: [
      { q: "Vilka betalningsmetoder accepterar ni?", a: "Vi använder Klarna för alla betalningar. Du väljer mellan faktura (14 eller 30 dagar), delbetalning, kort (Visa, Mastercard, American Express), direktbetalning via bank samt Apple Pay och Google Pay." },
      { q: "Erbjuder ni faktura?", a: "Ja, via Klarna kan du välja faktura med 14 eller 30 dagars betalningstid. Du får först varan och betalar sedan – ingen extra avgift för faktura." },
    ],
  },
  {
    id: "frakt-leverans",
    kort: "Leverans",
    rubrik: "Frakt & leverans",
    ikon: Ikon.frakt,
    intro: `Frakt ${STANDARD_SHIPPING_KR} kr, fri frakt över ${FREE_SHIPPING_OVER_KR} kr. Normal leveranstid är ${DELIVERY_TIME}.`,
    lankar: [{ href: "/sparning", text: "Spåra paket" }],
    fragor: [
      { q: "Vad kostar frakten?", a: "Standardfrakt är 19 kr inom Sverige. Vid köp över 499 kr är frakten helt fri. Vi skickar med spårbar leverans hela vägen hem." },
      { q: "Hur lång är leveranstiden?", a: "Vanlig leveranstid är 3–6 arbetsdagar från beställning. Du får en spårningskod via mejl så snart paketet lämnar lagret. Under storhelger kan det ta något längre." },
      { q: "Hur spårar jag min beställning?", a: "När ditt paket lämnar lagret skickar vi en mejlbekräftelse med en spårningskod. Klicka på länken i mejlet, eller ange spårningskoden på fyndplats.se/sparning så ser du var paketet är." },
      { q: "Vad händer om jag inte hämtar mitt paket?", a: "Paket som inte hämtas inom utlämningstiden returneras till oss. Vi kan då ta ut en administrativ avgift på upp till 160 kr för leverantörens hanterings- och fraktkostnad. Avgiften gäller dock inte om du har ångrat köpet – då är det en retur enligt din ångerrätt. Hör av dig direkt om du fått förhinder." },
      { q: "Skickar ni utanför Sverige?", a: "För närvarande skickar vi bara inom Sverige. Vi tittar på att utöka till resten av Norden – håll utkik på vår Facebook- och Instagramsida." },
    ],
  },
  {
    id: "eu-lager-tull",
    kort: "Tull",
    rubrik: "EU-lager & tull",
    ikon: Ikon.eu,
    intro: "Alla varor skickas från lager inom EU, aldrig direkt från länder utanför EU.",
    lankar: [{ href: "/eu-lager-garanti", text: "EU-lager & tull" }],
    fragor: [
      { q: "Måste jag betala tull eller importavgift på min beställning?", a: "Nej. Alla våra produkter skickas från lager inom EU, så EU:s nya importtull och förtullningsavgift för paket som skickas in i EU utifrån (från 1 juli 2026) tillkommer inte på din beställning. Moms (25 %) ingår alltid i priset du ser, och frakten är fri över 499 kr – under det visas fraktavgiften tydligt i kassan. Mer om detta finns på sidan EU-lager & tull (fyndplats.se/eu-lager-garanti)." },
      { q: "Varifrån skickas varorna – skickas något från ett land utanför EU?", a: "Alla våra produkter kommer garanterat från lager inom EU. Vi skickar aldrig direkt från länder utanför EU, så du slipper ny importtull, förtullningsavgift och extra väntan i tull." },
    ],
  },
  {
    id: "returer-reklamation",
    kort: "Returer",
    rubrik: "Returer & reklamation",
    ikon: Ikon.retur,
    intro: TOTAL_SHORT,
    lankar: [
      { href: "/angra-kop", text: "Ångra köp" },
      { href: "/returer", text: "Returer & ångerrätt" },
    ],
    fragor: [
      { q: "Kan jag ångra mitt köp / returnera?", a: `${TOTAL_SUMMARY} Under de första 14 dagarna har du rätt att undersöka produkten som du skulle ha gjort i en butik; har den hanterats mer än så kan ett skäligt värdeminskningsavdrag göras. För det frivilliga öppna köpet dag 15–30 ska produkten vara oanvänd, komplett och i säljbart skick, anmälas skriftligt med ordernummer innan den skickas och skickas spårbart. Meddela oss spårningsnumret och posta returen inom 7 dagar från anmälan – den lagstadgade fristen på 14 dagar under ångerrätten påverkas inte. Under dag 15–30 återbetalas produktens pris, men inte vad du betalat för frakten till dig — det gör vi bara under den lagstadgade ångerfristen. Det är dagen du anmäler returen som avgör vilken period som gäller, inte dagen paketet är tillbaka hos oss. Enklast ångrar du direkt på sidan Ångra köp (fyndplats.se/angra-kop): ange din e-postadress och ditt ordernummer, välj vilka artiklar du vill ångra och skicka, så får du ett automatiskt mottagningskvitto med returadressen. Ångerrätten gäller även innan paketet hunnit fram. Returfrakten betalas av kunden — du bokar själv hos valfri transportör som tar emot varans storlek och vikt, gärna spårbart. ${SKRYMMANDE_RETURKOSTNAD} ${AVGIFT_SENTENCE} Vi betalar tillbaka inom 2–3 arbetsdagar efter mottagen och kontrollerad retur; hur snabbt pengarna syns på kontot beror sedan på din bank. Är varan trasig eller fel är det istället en reklamation – en egen rättighet som inte har med 30-dagarsfristen att göra; då står Fyndplats för returfrakten.` },
      { q: "Vad gör jag om produkten är skadad vid leverans?", a: "Kontakta oss gärna inom 7 dagar på info@fyndplats.com med ditt ordernummer och en bild på skadan. Vi löser det snabbt – antingen genom ny produkt eller återbetalning via Klarna. Din reklamationsrätt enligt konsumentköplagen gäller oavsett." },
      { q: "Produkten gick sönder efter ett tag – är jag för sen?", a: `${COMPLAINT.lead} ${COMPLAINT.points.join(" ")}` },
    ],
  },
  {
    id: "om-fyndplats",
    kort: "Kontakt",
    rubrik: "Om Fyndplats & kontakt",
    ikon: Ikon.service,
    intro: "Kundservice vardagar 09–17. Vi svarar normalt inom 24 timmar.",
    lankar: [
      { href: "/kontaktaoss", text: "Kontakta oss" },
      { href: "/omoss", text: "Om oss" },
    ],
    fragor: [
      { q: "Hur kontaktar jag kundtjänst?", a: "Snabbast når du oss via mejl: info@fyndplats.com. Du kan också ringa +46 73 663 09 90 vardagar 09–17, eller använda kontaktformuläret på sidan Kontakta oss. Vi svarar normalt inom 24 timmar." },
      { q: "Har ni en fysisk butik?", a: "Fyndplats är en renodlad webbutik – allt sker online via fyndplats.se. Vår företagsadress är Bergviksgatan 10 i Södertälje; det är inget lager och vi erbjuder för närvarande inte besök eller upphämtning där. Produkterna skickas från våra leverantörers och logistikpartners lager inom EU. Det gör att vi kan erbjuda ett stort sortiment utan att allt behöver mellanlagras hos oss i Sverige." },
      { q: "Hur skyddar ni mina personuppgifter?", a: "Vi följer GDPR och svensk dataskyddslag. Vi behandlar personuppgifter för att kunna genomföra köp, betalningar, leveranser, kundservice och driva vår webbplats. Personuppgifter kan behandlas av betrodda tjänsteleverantörer som hjälper oss med exempelvis betalning, leverans, utskick av mejl och teknisk drift. Analys och marknadsföring sker enligt tillämplig rättslig grund och dina cookieval. Läs hela vår sekretesspolicy på fyndplats.se/sekretesspolicy." },
    ],
  },
];

/** Alla frågor i den ordning sidan visar dem. Driver FAQPage-schemat. */
const faqs: Fraga[] = AMNEN.flatMap((a) => a.fragor);

// Gör "fyndplats.se/x"-omnämnanden i de SYNLIGA svaren till riktiga länkar
// (crawlbara + klickbara). FAQPage-schemat nedan använder fortsatt f.a som ren
// text — Googles FAQ-regler tillåter inte HTML i acceptedAnswer, och paritet
// synligt ↔ schema bevaras (texten är densamma, bara ankartaggen tillkommer).
function linkifyAnswer(a: string): React.ReactNode {
  const parts = a.split(/(fyndplats\.se\/[a-z0-9-]+)/g);
  if (parts.length === 1) return a;
  return parts.map((part, i) =>
    /^fyndplats\.se\/[a-z0-9-]+$/.test(part) ? (
      <a key={i} href={part.replace("fyndplats.se", "")}>{part}</a>
    ) : (
      part
    ),
  );
}

/**
 * Delar ett långt svar i stycken vid meningsgränser, så att returfrågan inte
 * blir en enda vägg av text. Texten ändras inte: bara var raden bryts.
 */
function stycken(a: string, minLangd = 260): string[] {
  const meningar = a.split(/(?<=[.?])\s+(?=[A-ZÅÄÖ])/);
  const ut: string[] = [];
  let nu = "";
  for (const m of meningar) {
    nu = nu ? `${nu} ${m}` : m;
    if (nu.length >= minLangd) {
      ut.push(nu);
      nu = "";
    }
  }
  if (nu) {
    // En kort svans hänger hellre med föregående stycke än står ensam.
    if (ut.length > 0 && nu.length < 120) ut[ut.length - 1] += ` ${nu}`;
    else ut.push(nu);
  }
  return ut;
}

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
    { "@type": "ListItem", position: 2, name: "Vanliga frågor", item: "https://www.fyndplats.se/vanliga-fragor" },
  ],
};

export default function VanligaFragor() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqLd) }} />

      <section className="om-hero">
        <div className={`container ${s.heroInner}`}>
          <div className="eyebrow">Kundservice</div>
          <h1>Vanliga frågor</h1>
          <p className="om-lede">
            Du frågar, vi svarar. Här hittar du snabbt svar om beställning, betalning, frakt och returer.
          </p>
          <nav className={s.amnen} aria-label="Ämnen">
            {AMNEN.map((a) => (
              <a key={a.id} href={`#${a.id}`}>
                <Svg d={a.ikon} />
                {a.rubrik}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="om-fakta" aria-label="Det viktigaste i korthet">
        <div className="container om-fakta-grid">
          <div className="om-fakta-kort">
            <b>{STANDARD_SHIPPING_KR} kr</b>
            <span>Frakt, fri över {FREE_SHIPPING_OVER_KR} kr</span>
          </div>
          <div className="om-fakta-kort">
            <b>{DELIVERY_MIN_DAYS}–{DELIVERY_MAX_DAYS}</b>
            <span>Arbetsdagars leveranstid</span>
          </div>
          <div className="om-fakta-kort">
            <b>30 dagar</b>
            <span>Att ångra eller returnera</span>
          </div>
          <div className="om-fakta-kort">
            <b>24 h</b>
            <span>Normal svarstid, vardagar</span>
          </div>
        </div>
      </section>

      {AMNEN.map((a, i) => (
        <section
          key={a.id}
          id={a.id}
          className={`om-sektion ${s.amne}${i % 2 === 1 ? " om-fragor-sek" : ""}`}
          aria-labelledby={`${a.id}-rubrik`}
        >
          <div className="container om-fragor-grid">
            <div className={s.amneHuvud}>
              <span className={`om-ikon ${s.ikon}`}><Svg d={a.ikon} /></span>
              <div className="eyebrow">{a.kort}</div>
              <h2 id={`${a.id}-rubrik`}>{a.rubrik}</h2>
              <p>{a.intro}</p>
              <div className={s.lankar}>
                {a.lankar.map((l) => (
                  <a key={l.href} className="btn-quiet" href={l.href}>{l.text}</a>
                ))}
              </div>
            </div>
            <div className="om-fragor">
              {a.fragor.map((f, j) => (
                <details key={f.q} {...(i === 0 && j === 0 ? { open: true } : {})}>
                  <summary>{f.q}</summary>
                  <div className={s.svar}>
                    {stycken(f.a).map((st, k) => (
                      <p key={k} className={s.stycke}>{linkifyAnswer(st)}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="om-slut">
        <div className="container om-slut-inner">
          <h2>Hittade du inte svaret?</h2>
          <p>Mejla, ring eller använd kontaktformuläret. Vi svarar normalt inom 24 timmar, vardagar 09–17.</p>
          <div className="om-cta">
            <a className="btn btn-primary" href="/kontaktaoss">Kontakta oss</a>
            <a className="btn om-btn-ljus" href="/sparning">Spåra paket</a>
          </div>
        </div>
      </section>
    </>
  );
}
