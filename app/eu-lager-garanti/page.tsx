import type { Metadata } from "next";
import { jsonLdString } from "../../lib/seo";
import { ContentPage } from "../../components/content";
import { EU_STOCK_NOTE } from "../../lib/shipping";

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
    a: "Fri frakt gäller vid köp över 499 kr. Vid mindre köp tillkommer en fraktavgift som alltid visas tydligt i kassan innan du betalar. EU-lager-garantin handlar om tull och förtullning, inte om frakt.",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "EU-lager-garanti – inga nya tullavgifter på din beställning",
      description: DESC,
      datePublished: "2026-06-30",
      dateModified: "2026-06-30",
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
  ],
};

export default function EuLagerGaranti() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <ContentPage
        eyebrow="Trygghet"
        title="EU-lager-garanti"
        lead="Alla produkter hos Fyndplats kommer garanterat från lager inom EU. Därför påverkas din beställning inte av EU:s nya importtull och förtullningsavgift för paket som skickas in i EU utifrån (från 1 juli 2026)."
      >
        <div className="callout">
          <p>
            <strong>🇪🇺 Vårt löfte:</strong> Vi skickar enbart varor som redan finns i lager
            inom EU – aldrig direkt från länder utanför EU. {EU_STOCK_NOTE}
          </p>
        </div>

        <h2>Vad ändras den 1 juli 2026?</h2>
        <p>EU tar bort den så kallade <strong>&quot;de minimis&quot;-regeln</strong> – tullfriheten som hittills låtit billiga paket (under 150 euro) komma in i EU helt utan tull. I stället införs en <strong>fast tull på 3 euro per vara</strong> för paket som skickas <strong>in i EU utifrån</strong> (övergångsregel enligt rådets förordning (EU) 2026/382), och senare under 2026 en planerad <strong>hanteringsavgift</strong>. Därtill lägger transportörer ofta på en egen <strong>förtullningsavgift</strong> för paket utifrån EU.</p>
        <p>De nya avgifterna gäller alltså bara varor som skickas <strong>in i EU utifrån</strong>. Varor som redan finns i lager <strong>inom EU</strong> berörs inte.</p>

        <h2>Därför påverkas din beställning inte</h2>
        <p>Eftersom hela vårt sortiment skickas från lager inom EU innebär de nya reglerna ingen skillnad för dig som handlar hos oss:</p>
        <ul>
          <li><strong>Ingen ny importtull</strong> på din beställning.</li>
          <li><strong>Ingen förtullningsavgift</strong> från transportören för paket utifrån EU.</li>
          <li><strong>Ingen extra väntan i tull</strong> – paketet är redan i Europa.</li>
        </ul>

        <h2>Vad garantin omfattar – och vad den inte gör</h2>
        <p>Vi vill vara raka med exakt vad löftet betyder, så att inget känns som finstilt:</p>
        <ul>
          <li><strong>Garantin omfattar</strong> EU:s nya importtull och transportörens förtullningsavgift för paket utifrån EU. De tillkommer inte, eftersom dina varor skickas inom EU.</li>
          <li><strong>Momsen (25 %) ingår alltid</strong> i priset du ser och påverkas inte av garantin. Den tas ut på all försäljning till konsument i Sverige, oavsett varifrån varan skickas – den &quot;pratas&quot; aldrig bort.</li>
          <li><strong>Frakt</strong> är fri vid köp över 499 kr. Vid mindre köp tillkommer en fraktavgift som alltid visas tydligt i kassan. Garantin gäller tull och förtullning, inte frakt.</li>
          <li><strong>Returfrakt</strong> vid ångrat köp betalas av kunden enligt våra <a href="/kopvillkor">köpvillkor</a>. Vid felaktig eller skadad vara står vi för returkostnaden.</li>
        </ul>

        <h2>Vanliga frågor</h2>
        <div className="faq">
          {faqs.map((f, i) => (
            <details key={i} {...(i === 0 ? { open: true } : {})}>
              <summary>{f.q}</summary>
              <div className="ans">{f.a}</div>
            </details>
          ))}
        </div>

        <h2>Läs mer</h2>
        <ul>
          <li><a href="/blogg/nya-tullreglerna-2026-eu-lager">Nya tullreglerna 2026 – så slipper du extra avgifter</a></li>
          <li><a href="/kopvillkor">Köpvillkor</a></li>
          <li><a href="/vanliga-fragor">Vanliga frågor</a></li>
          <li><a href="/butik">Se hela sortimentet</a></li>
        </ul>

        <p style={{ fontSize: 14, color: "var(--soft)", marginTop: 24 }}>Källa: Europeiska kommissionen, Taxation and Customs Union. Den här sidan är allmän information, inte juridisk rådgivning – kontrollera med Tullverket eller din transportör för detaljer i ditt enskilda fall. Senast uppdaterad: 30 juni 2026.</p>
      </ContentPage>
    </>
  );
}
