import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

// FutDaddyH — officiell merch.
//
// STATUS: designskiss. Sidan är avsiktligt utan köpbara produkter ännu.
// Printful-artiklarna finns inte, fraktreglerna per land är inte satta och
// momsregistreringarna utanför Sverige saknas (mätt 2026-09-04: en tysk adress
// ger MISSING_DELIVERY_METHOD och 0 % moms i kassan). Att lägga ut kort med
// priser innan dess vore att erbjuda något som inte går att köpa.
//
// Rutnätet nedan är därför byggt för riktiga produkter men visar ärliga
// platshållare: plagget, inte ett påhittat pris.
//
// INGEN EGEN SÄLJARRAD. Fyndplats är säljare, men det behöver inte stå en
// extra gång: sidan ligger på fyndplats.se, ärver sajtens header med loggan
// och sajtens footer med kundtjänst och villkor. Vem kunden handlar av är
// alltså synligt hela vägen ner — en rad till hade bara upprepat headern.
//
// Sidan ärver sajtens header och footer från app/layout.tsx. Hans värld tar
// hela innehållsytan under dem.

export const revalidate = 3600;

// Adresserna kommer från Leonard (Instagram, YouTube, Twitch) — spårnings-
// parametrarna i hans länkar är bortstädade. TikTok och X står på hans banner
// med handtaget FUTDADDYH men kom aldrig som adresser, så de är HÄRLEDDA ur
// handtaget. De två bör klickas en gång innan sidan går live: en död länk i
// en officiell butik är värre än en länk som saknas.
const SOCIALS = [
  { namn: "Instagram", url: "https://www.instagram.com/futdaddyh" },
  { namn: "YouTube", url: "https://youtube.com/@futdaddyh" },
  { namn: "Twitch", url: "https://www.twitch.tv/futdaddyh" },
  { namn: "TikTok", url: "https://www.tiktok.com/@futdaddyh" },
  { namn: "X", url: "https://x.com/futdaddyh" },
];

// Beskuren ur hans egen banner: han, FD-bollen och strålkastarna. Ordmärket
// och taggen lämnades kvar i originalet — de är riktig HTML här nedanför, för
// inbränd text går inte att läsa upp, översätta eller skala ner på en telefon.
const HJALTE =
  "https://static.wixstatic.com/media/b379ce_188b521ca5144bf2a11be627959aa92d~mv2.jpg/v1/fill/w_900,h_747,al_c,q_85/file.jpg";

// Plaggen i det första droppet. Ingen prissättning här: den hör hemma i Wix
// när Printful-artiklarna är valda, och tills dess ska sidan inte påstå något.
const PLAGG = [
  { namn: "T-shirt", om: "Tung bomull, tryck fram." },
  { namn: "Hoodie", om: "Borstad insida, broderad krona." },
  { namn: "Keps", om: "Justerbar, broderad front." },
  { namn: "Träningströja", om: "Funktionsmaterial för planen." },
  { namn: "Strumpor", om: "Ribbade, logga på vaden." },
];

export const metadata: Metadata = {
  title: "FutDaddyH – officiell merch",
  description:
    "Officiell FutDaddyH-merch. T-shirt, hoodie, keps, träningströja och strumpor – tryckta på beställning och skickade direkt till dig. Säljs av Fyndplats.",
  alternates: { canonical: "https://www.fyndplats.se/futdaddyh" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Fyndplats",
    url: "https://www.fyndplats.se/futdaddyh",
    title: "FutDaddyH – officiell merch",
    description:
      "Officiell FutDaddyH-merch, tryckt på beställning och skickad direkt till dig.",
  },
};

/** Kronan ur hans märke, ritad som SVG tills vektorloggan kommer. */
function Krona() {
  return (
    <svg className="fd-crown" viewBox="0 0 120 74" role="img" aria-label="FutDaddyH-krona">
      <defs>
        <linearGradient id="fd-krona" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0CE7A" />
          <stop offset="100%" stopColor="#C08F2E" />
        </linearGradient>
      </defs>
      <path
        fill="url(#fd-krona)"
        d="M6 22l20 16L46 8l14 30L74 8l20 30 20-16-12 44H18L6 22z"
      />
      <circle cx="6" cy="18" r="6" fill="url(#fd-krona)" />
      <circle cx="60" cy="5" r="6" fill="url(#fd-krona)" />
      <circle cx="114" cy="18" r="6" fill="url(#fd-krona)" />
    </svg>
  );
}

/** Plaggsilhuett i kortet tills produktbilderna finns. */
function Plagg() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Plagg på väg" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 8l10 6 10-6 12 7-6 10-4-2v33H20V23l-4 2-6-10 12-7z" />
    </svg>
  );
}

export default function FutDaddyh() {
  return (
    <div className="fd">
      {/* Hjälten är en KOMPOSITION, inte en bakgrundsbild. Han ligger bredvid
          ordmärket precis som på hans banner — inte bakom texten. Skälet är
          konkret: text ovanpå ett foto kräver en mörk hinna för att bli
          läsbar, och då får man både ett urtvättat foto och svagare text. Här
          behåller båda sin kraft, och på telefon staplas de i stället för att
          krocka. */}
      <header className="fd-hero">
        <div className="fd-hero-inner container">
          <div className="fd-hero-text">
            <Krona />
            <h1 className="fd-wordmark">FutDaddyH</h1>
            <p className="fd-tagline">
              Football is more than a game
              <b>It&rsquo;s a mindset.</b>
            </p>
            <nav className="fd-social" aria-label="FutDaddyH på sociala medier">
              {SOCIALS.map((s) => (
                <a key={s.namn} href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.namn}
                </a>
              ))}
            </nav>
          </div>
          <div className="fd-hero-img">
            <Image
              src={HJALTE}
              alt="FutDaddyH framför en upplyst arena, med en guldfärgad fotboll märkt FD"
              width={900}
              height={747}
              priority
              sizes="(max-width: 860px) 100vw, 46vw"
            />
          </div>
        </div>
      </header>

      <section className="fd-sec">
        <div className="container">
          <h2 className="fd-h2">Första droppet</h2>
          <p className="fd-lead">
            Fem plagg att börja med. Varje del trycks när du beställer den — inget
            lager, inget överblivet.
          </p>
          <ul className="fd-grid">
            {PLAGG.map((p) => (
              <li key={p.namn} className="fd-item">
                <div className="fd-shot">
                  <Plagg />
                </div>
                <div className="fd-item-body">
                  <h3>{p.namn}</h3>
                  <p>{p.om}</p>
                  <span className="fd-soon">Släpps snart</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="fd-back">
        <Link href="/">← Tillbaka till Fyndplats</Link>
      </div>
    </div>
  );
}
