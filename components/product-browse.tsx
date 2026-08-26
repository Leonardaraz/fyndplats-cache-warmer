// "Föregående / Nästa produkt" högst upp på produktsidan.
//
// Leonards ärende: man skulle slippa backa till kategorisidan varje gång man
// vill titta på nästa sak. Pilarna pekar på grannarna i avdelningens ordning —
// samma ordning kategorisidan visar, se lib/product-neighbours.ts.
//
// ── Utseendet (andra vändan, 2026-08-26) ────────────────────────────────────
// Första versionen var två textlänkar med tecknen ← och → framför. Den
// FUNGERADE, men såg ut som en fotnot: ett glyftecken i brödtext bär ingen
// tyngd, och namnet ensamt säger inte vad man är på väg till.
//
// Nu bär varje sida tre saker som läses som ETT objekt:
//
//   • en miniatyr av produkten — det enda som gör länken igenkännbar innan man
//     klickar, och det som lyfter raden från text till innehåll
//   • en chevron i en egen cirkel, ritad som SVG i stället för ett tecken, så
//     den har samma vikt oavsett typsnitt och kan färgas separat
//   • etikett + namn i två rader
//
// Hela objektet är ram- och bakgrundslöst i vila och får först vid hover en
// varm botten och ett litet lyft. Det är avsiktligt återhållet: raden sitter
// mellan brödsmulan och produktrubriken, och två inramade kort där hade
// konkurrerat med köpkolumnen i stället för att bära den.
//
// Ren serverkomponent: inga hooks, inget "use client". Länkarna är vanliga
// <a>, så de fungerar utan JS och Next hämtar dem i förväg som vanligt.
//
// TILLGÄNGLIGHET: <nav> med aria-label, eftersom det är en andra navigation på
// sidan vid sidan av brödsmulan. Chevronen och miniatyren är dekorativa
// (aria-hidden respektive alt="") — länkens egen text bär både riktningen och
// produktnamnet. Namnet kortas visuellt med CSS, inte i strängen, så
// skärmläsaren får hela.
//
// Renderas inte alls när det varken finns föregående eller nästa: en ensam
// produkt i en avdelning ska inte få en tom rad över sig.

import Image from "next/image";
import { tightFillUrl } from "../lib/wix-image";
import { SHIMMER_BLUR } from "../lib/lqip";
import type { Grannar } from "../lib/product-neighbours";

/** Miniatyrens ruta i CSS-pixlar. Bilden hämtas i dubbel storlek för skärpa. */
const THUMB = 52;

type Granne = { slug: string; name: string; img?: string } | null;

export function ProductBrowse({
  grannar,
  kategoriNamn,
}: {
  grannar: Grannar<{ slug: string; name: string; img?: string }>;
  kategoriNamn?: string;
}) {
  const { forra, nasta, position, antal } = grannar;
  if (!forra && !nasta) return null;

  return (
    <nav
      className="pbrowse"
      aria-label={kategoriNamn ? `Bläddra i ${kategoriNamn}` : "Bläddra bland produkter"}
    >
      <Lank granne={forra} riktning="forra" />
      {position !== null && antal > 1 && (
        // Räknaren gör pilarna begripliga: utan den vet man inte om "nästa" är
        // en av tre eller en av femtio. Döljs på små skärmar (se globals.css) —
        // där är utrymmet bättre använt till produktnamnen.
        <span className="pbrowse-rakn">
          {position} av {antal}
          {kategoriNamn ? ` i ${kategoriNamn}` : ""}
        </span>
      )}
      <Lank granne={nasta} riktning="nasta" />
    </nav>
  );
}

function Lank({ granne, riktning }: { granne: Granne; riktning: "forra" | "nasta" }) {
  const forra = riktning === "forra";
  // Tom platshållare i stället för utelämnad nod: håller kvar rutnätets tre
  // spalter så räknaren står mitt på raden även i listans ändar.
  if (!granne) return <span className={`pbrowse-tom pbrowse-${riktning}`} aria-hidden="true" />;

  return (
    <a
      className={`pbrowse-lank pbrowse-${riktning}`}
      href={`/produkt/${granne.slug}`}
      rel={forra ? "prev" : "next"}
    >
      <span className="pbrowse-pil" aria-hidden="true">
        <Chevron vand={!forra} />
      </span>
      {granne.img ? (
        <span className="pbrowse-thumb">
          {/* alt="" — länktexten bredvid bär redan produktnamnet, och en
              upprepning hade lästs två gånger av skärmläsaren. */}
          <Image
            src={tightFillUrl(granne.img, THUMB * 2, THUMB * 2)}
            alt=""
            width={THUMB}
            height={THUMB}
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR}
          />
        </span>
      ) : (
        // Produkter utan bild får ingen tom ruta — texten flyttar in i stället.
        null
      )}
      <span className="pbrowse-txt">
        <span className="pbrowse-etikett">{forra ? "Föregående" : "Nästa"}</span>
        <span className="pbrowse-namn">{granne.name}</span>
      </span>
    </a>
  );
}

/** Chevron som SVG i stället för tecknen ‹ ›: samma vikt i alla typsnitt. */
function Chevron({ vand }: { vand: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={vand ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
