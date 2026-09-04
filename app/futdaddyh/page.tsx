import type { Metadata } from "next";
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
// VARFÖR FYNDPLATS SYNS ÖVERST. Fyndplats är säljare — kunden ingår avtalet
// med oss, kassan säger Fyndplats och paketet kommer från Printful. Står det
// inte på sidan blir det en överraskning i kassan, och en överraskning i
// kassan är en chargeback som väntar. Raden är liten, men den är aldrig dold.
//
// Sidan ärver sajtens header och footer från app/layout.tsx. Hans värld tar
// hela innehållsytan under dem.

export const revalidate = 3600;

const SOCIALS = [
  { namn: "YouTube", url: "https://www.youtube.com/@FutDaddyh" },
  { namn: "TikTok", url: "https://www.tiktok.com/@futdaddyh" },
  { namn: "Twitch", url: "https://www.twitch.tv/futdaddyh" },
  { namn: "X", url: "https://x.com/futdaddyh" },
];

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
      <div className="fd-attrib">
        Officiell FutDaddyH-merch · säljs och skickas av{" "}
        <Link href="/">Fyndplats</Link>
      </div>

      <header className="fd-hero">
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

      <section className="fd-sec">
        <div className="container">
          <h2 className="fd-h2">Så funkar det</h2>
          <p className="fd-lead">
            Ingenting ligger på hyllan. Din beställning trycks upp för din skull och
            skickas direkt till dörren.
          </p>
          <ul className="fd-facts">
            <li className="fd-fact">
              <b>Leverans</b>
              <span>
                10–14 arbetsdagar. Plagget trycks först och skickas sedan — vi hellre
                säger sanningen än en siffra vi inte håller.
              </span>
            </li>
            <li className="fd-fact">
              <b>Tryckt på beställning</b>
              <span>
                Varje del produceras när den beställs. Därför finns alla storlekar,
                och inget blir över.
              </span>
            </li>
            <li className="fd-fact">
              <b>Ångerrätt</b>
              <span>
                14 dagars lagstadgad ångerrätt. Returfrakten står du för, eftersom
                ett tryckt plagg inte kan säljas vidare.
              </span>
            </li>
            <li className="fd-fact">
              <b>Frågor</b>
              <span>
                Kundtjänsten är Fyndplats — samma som för allt annat i butiken.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <div className="fd-back">
        <Link href="/">← Tillbaka till Fyndplats</Link>
      </div>
    </div>
  );
}
