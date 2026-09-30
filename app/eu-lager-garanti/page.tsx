import type { Metadata } from "next";
import Link from "next/link";
import { jsonLdString } from "../../lib/seo";
import { EU_STOCK_NOTE, FREE_SHIPPING_OVER_KR } from "../../lib/shipping";
import s from "./eu-lager-garanti.module.css";

// EU-lager & tull (2026-09-30). Samma innehåll som förut, i Om oss-sidans
// formspråk (om-* i app/globals.css): hero, faktarad, kort med ikoner och
// frågor. Texten om tullreglerna och om vad garantin omfattar står kvar ord
// för ord; bara uppställningen är ny. Flaggemojin i löftet är borttagen.

const TITLE = "EU-lager-garanti";
const DESC =
  "Alla produkter hos Fyndplats kommer garanterat från lager inom EU – därför tillkommer ingen ny importtull eller förtullningsavgift på din beställning.";
const URL = "https://www.fyndplats.se/eu-lager-garanti";
const OG_IMAGE =
  "https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/file.jpg";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: URL },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Fyndplats",
    url: URL,
    title: TITLE,
    description: DESC,
    images: [OG_IMAGE],
  },
};

const Ikon = {
  eu: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M3.5 9h17 M3.5 15h17 M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9 M12 3c-2.5 2.6-3.7 5.6-3.7 9s1.2 6.4 3.7 9" />,
  tull: <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z M9 12l2 2 4-4" />,
  avgift: <path d="M4 7h16v10H4z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M4 10.5h1.5 M18.5 13.5H20" />,
  klocka: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2" />,
  moms: <path d="M6 18L18 6 M7.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M16.5 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  frakt: <path d="M3 7h11v8H3z M14 10h4l3 3v2h-7z M7 18.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z M17.5 18.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z" />,
  retur: <path d="M9 14L4 9l5-5 M4 9h11a5 5 0 0 1 5 5v1" />,
};

function Svg({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

// FAQ-paren visas på sidan OCH driver FAQPage-schemat (single source) — håll dem
// i synk genom att bara redigera här. Svaren är ärligt avgränsade: de pratar
// aldrig bort moms (25 %, ingår alltid) eller fraktavgift/returfrakt.
const faqs: { q: string; a: string }[] = [
  {
    q: "Måste jag betala tull när jag handlar hos Fyndplats?",
    a: "Nej. Alla våra produkter kommer garanterat från lager inom EU, så EU:s nya tull- och förtullningsregler för paket som skickas in i EU utifrån (från 1 juli 2026) gäller inte din beställning.",
  },
  {
    q: "Vad omfattar EU-lager-garantin?",
    a: "Garantin innebär att varje produkt vi säljer skickas från ett lager inom EU. Därför drabbas du inte av den nya importtullen (3 euro per vara) eller transportörens förtullningsavgift som tillkommer på paket utifrån EU.",
  },
  {
    q: "Ingår momsen i priset?",
    a: "Ja. Svensk moms (25 %) ingår alltid i det pris du ser och påverkas inte av tullreglerna – den tas ut på all försäljning till konsument i Sverige, oavsett varifrån varan skickas. Garantin gäller den nya importtullen och förtullningen, inte momsen.",
  },
  {
    q: "Tillkommer det någon fraktavgift?",
    a: "Fri frakt gäller vid köp över 499 kr. Vid mindre köp är frakten 19 kr, och den visas alltid i kassan innan du betalar. EU-lager-garantin handlar om tull och förtullning, inte om frakt.",
  },
  {
    q: "När börjar de nya tullreglerna gälla?",
    a: "Tullfriheten för billiga paket (under 150 euro) som skickas in i EU utifrån tas bort den 1 juli 2026, med en fast tull på 3 euro per vara som övergångslösning enligt rådets förordning (EU) 2026/382. En hanteringsavgift planeras senare under 2026.",
  },
  {
    q: "Hur vet jag att en vara skickas från EU?",
    a: "Du behöver inte kontrollera själv – det gäller hela vårt sortiment. Vi tar bara in produkter som redan finns i lager inom EU, aldrig direkt från länder utanför EU.",
  },
];

// "Därför påverkas din beställning inte": de tre punkterna från den tidigare
// listan, som kort. Förklaringen under varje rubrik upprepar bara vad sidan
// redan säger längre upp.
const PAVERKAS_INTE = [
  { ikon: Ikon.tull, rubrik: "Ingen ny importtull", text: "Tullen på 3 euro per vara gäller paket som skickas in i EU utifrån. Din beställning skickas inom EU." },
  { ikon: Ikon.avgift, rubrik: "Ingen förtullningsavgift", text: "Transportörens förtullningsavgift för paket utifrån EU tillkommer inte på din beställning." },
  { ikon: Ikon.klocka, rubrik: "Ingen extra väntan i tull", text: "Paketet är redan i Europa." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "EU-lager-garanti – inga nya tullavgifter på din beställning",
      description: DESC,
      datePublished: "2026-06-30",
      dateModified: "2026-09-30",
      author: { "@type": "Organization", name: "Fyndplats" },
      publisher: {
        "@type": "Organization",
        name: "Fyndplats",
        logo: {
          "@type": "ImageObject",
          url: "https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg",
        },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": URL },
      image: [OG_IMAGE],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
        { "@type": "ListItem", position: 2, name: TITLE, item: URL },
      ],
    },
  ],
};

export default function EuLagerGaranti() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <div className={s.sida}>
        <section className="om-hero">
          <div className={`container ${s.heroGrid}`}>
            <div>
              <div className="eyebrow">EU-lager &amp; tull</div>
              <h1>EU-lager-garanti</h1>
              <p className="om-lede">
                Alla produkter hos Fyndplats kommer garanterat från lager inom EU. Därför påverkas din beställning
                inte av EU:s nya importtull och förtullningsavgift för paket som skickas in i EU utifrån (från 1 juli 2026).
              </p>
              <div className="om-cta">
                <a className="btn btn-primary" href="/butik">Se hela sortimentet</a>
                <a className="btn btn-ghost" href="/vanliga-fragor">Vanliga frågor</a>
              </div>
            </div>
            <aside className={s.lofte} aria-label="Vårt löfte">
              <span className="om-ikon"><Svg d={Ikon.eu} /></span>
              <h2>Vårt löfte</h2>
              <p>
                Vi skickar enbart varor som redan finns i lager inom EU – aldrig direkt från länder utanför EU.{" "}
                {EU_STOCK_NOTE}
              </p>
            </aside>
          </div>
        </section>

        <section className="om-fakta" aria-label="Det viktigaste i korthet">
          <div className="container om-fakta-grid">
            <div className="om-fakta-kort">
              <b>EU</b>
              <span>Hela sortimentet skickas från lager inom EU</span>
            </div>
            <div className="om-fakta-kort">
              <b>Ingen</b>
              <span>Ny importtull eller förtullningsavgift</span>
            </div>
            <div className="om-fakta-kort">
              <b>25 %</b>
              <span>Moms ingår alltid i priset</span>
            </div>
            <div className="om-fakta-kort">
              <b>{FREE_SHIPPING_OVER_KR} kr</b>
              <span>Fri frakt vid köp över</span>
            </div>
          </div>
        </section>

        <section className="om-sektion">
          <div className="container om-ide">
            <div>
              <div className="eyebrow">Tullreglerna</div>
              <h2>Vad ändrades den 1 juli 2026?</h2>
            </div>
            <div className={s.text}>
              <p>Den 1 juli 2026 avskaffades EU:s <strong>&quot;de minimis&quot;-undantag</strong>, som tidigare gjorde paket värda under 150 euro tullfria vid import till EU. I stället gäller nu en <strong>fast tull på 3 euro per vara</strong> (för paket värda upp till 150 euro) som skickas <strong>in i EU utifrån</strong>, enligt övergångsregeln i rådets förordning (EU) 2026/382. Senare under 2026 planeras även en <strong>hanteringsavgift</strong>, och transportörer lägger ofta på en egen <strong>förtullningsavgift</strong> för paket utifrån EU.</p>
              <p>De nya avgifterna gäller alltså bara varor som skickas <strong>in i EU utifrån</strong>. Varor som redan finns i lager <strong>inom EU</strong> berörs inte.</p>
            </div>
          </div>
        </section>

        <section className="om-sektion om-fragor-sek">
          <div className="container">
            <div className="om-rubrikrad">
              <div>
                <div className="eyebrow">För dig som kund</div>
                <h2>Därför påverkas din beställning inte</h2>
                <p className={s.rubrikText}>Eftersom hela vårt sortiment skickas från lager inom EU innebär de nya reglerna ingen skillnad för dig som handlar hos oss:</p>
              </div>
            </div>
            <div className={`om-loften-grid ${s.tre}`}>
              {PAVERKAS_INTE.map((k) => (
                <div className="om-lofte" key={k.rubrik}>
                  <span className="om-ikon"><Svg d={k.ikon} /></span>
                  <h3>{k.rubrik}</h3>
                  <p>{k.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="om-sektion">
          <div className="container">
            <div className="om-rubrikrad">
              <div>
                <div className="eyebrow">Utan finstilt</div>
                <h2>Vad garantin omfattar – och vad den inte gör</h2>
                <p className={s.rubrikText}>Vi vill vara raka med exakt vad löftet betyder, så att inget känns som finstilt:</p>
              </div>
            </div>
            <div className="om-loften-grid">
              <div className="om-lofte">
                <span className="om-ikon"><Svg d={Ikon.tull} /></span>
                <h3>Tull och förtullning</h3>
                <p><strong>Garantin omfattar</strong> EU:s nya importtull och transportörens förtullningsavgift för paket utifrån EU. De tillkommer inte, eftersom dina varor skickas inom EU.</p>
              </div>
              <div className="om-lofte">
                <span className="om-ikon"><Svg d={Ikon.moms} /></span>
                <h3>Moms</h3>
                <p><strong>Momsen (25 %) ingår alltid</strong> i priset du ser och påverkas inte av garantin. Den tas ut på all försäljning till konsument i Sverige, oavsett varifrån varan skickas – den &quot;pratas&quot; aldrig bort.</p>
              </div>
              <div className="om-lofte">
                <span className="om-ikon"><Svg d={Ikon.frakt} /></span>
                <h3>Frakt</h3>
                <p><strong>Frakt</strong> är fri vid köp över 499 kr. Vid mindre köp tillkommer en fraktavgift som alltid visas tydligt i kassan. Garantin gäller tull och förtullning, inte frakt.</p>
              </div>
              <div className="om-lofte">
                <span className="om-ikon"><Svg d={Ikon.retur} /></span>
                <h3>Returfrakt</h3>
                <p><strong>Returfrakt</strong> vid ångrat köp betalas av kunden enligt våra <a href="/kopvillkor">köpvillkor</a>. Vid felaktig eller skadad vara står vi för returkostnaden.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="om-sektion om-fragor-sek">
          <div className="container om-fragor-grid">
            <div>
              <div className="eyebrow">Frågor</div>
              <h2>Vanliga frågor om tull och EU-lager</h2>
              <p>Läs mer:</p>
              <ul className={`om-lankar ${s.lasMer}`}>
                <li><Link href="/blogg/nya-tullreglerna-2026-eu-lager">Nya tullreglerna 2026 – så slipper du extra avgifter</Link></li>
                <li><a href="/kopvillkor">Köpvillkor</a></li>
                <li><a href="/vanliga-fragor">Vanliga frågor</a></li>
                <li><a href="/butik">Se hela sortimentet</a></li>
              </ul>
            </div>
            <div className="om-fragor">
              {faqs.map((f, i) => (
                <details key={f.q} {...(i === 0 ? { open: true } : {})}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={s.kalla}>
          <div className="container">
            <p className="om-not">Källa: Europeiska kommissionen, Taxation and Customs Union. Den här sidan är allmän information, inte juridisk rådgivning – kontrollera med Tullverket eller din transportör för detaljer i ditt enskilda fall. Publicerad 30 juni 2026, senast uppdaterad 30 september 2026.</p>
          </div>
        </section>

        <section className="om-slut">
          <div className="container om-slut-inner">
            <h2>Handla utan tullöverraskningar</h2>
            <p>Hela sortimentet skickas från lager inom EU. Momsen ingår alltid i priset du ser, och en eventuell fraktavgift visas tydligt i kassan innan du betalar.</p>
            <div className="om-cta">
              <a className="btn btn-primary" href="/butik">Till butiken</a>
              <a className="btn om-btn-ljus" href="/kontaktaoss">Kontakta oss</a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
