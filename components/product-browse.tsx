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
// ── Tredje vändan (2026-08-26): inga hål, ingen dold förklaring ─────────────
// Leonard såg en produktsida med BARA "Föregående". Den var 19 av 19 i sin
// underkategori — alltså sist, och utan rundgång finns ingen nästa. Räknaren
// hade sagt det ("19 av 19 i Solskydd & Paviljonger"), men den var dold på
// mobil, som var precis där han såg det. Tre ändringar följde:
//
//   1. Räknaren visas ÄVEN på mobil, som en egen centrerad rad under länkarna
//      i stället för hoptryckt mellan dem. Den är förklaringen till varför en
//      pil saknas och får därför inte vara det första som stryks.
//   2. Räknaren är en LÄNK till kategorisidan. Vill man se hela listan i stället
//      för att bläddra ett steg i taget finns vägen dit på raden.
//   3. Tomrummet i kedjans ändar fylls av en UTGÅNG — "Se alla / Solskydd &
//      Paviljonger" med rutnätsikon i stället för chevron. Slutet blir ett
//      avsiktligt slut med någonstans att ta vägen, inte en halv rad som ser
//      ut som en laddning som misslyckats.
//
// Att kedjan numera löper genom hela huvudavdelningen (se lib-filen) gör
// ändarna sällsynta — men de finns fortfarande, i avdelningens första och sista
// produkt. `nastaFran`/`forraFran` gör hoppet över en avsnittsgräns synligt som
// en egen rad under produktnamnet: "i Grill & Utekök".
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

type Granne = { slug: string; name: string; img?: string };

export function ProductBrowse({
  grannar,
}: {
  grannar: Grannar<{ slug: string; name: string; img?: string }>;
}) {
  const { forra, nasta, forraFran, nastaFran, position, antal, raknasMed, avsnitt } = grannar;
  if (!forra && !nasta) return null;

  return (
    <nav
      className="pbrowse"
      aria-label={avsnitt ? `Bläddra i ${avsnitt.namn}` : "Bläddra bland produkter"}
    >
      {forra ? (
        <Lank granne={forra} riktning="forra" fran={forraFran} />
      ) : (
        <Utgang avsnitt={avsnitt} riktning="forra" />
      )}

      {avsnitt && antal > 0 && (
        // Räknaren gör pilarna begripliga: utan den vet man inte om "nästa" är
        // en av tre eller en av femtio — och framför allt inte att man står
        // sist, vilket är hela förklaringen till en saknad pil.
        //
        // På en SLUTSÅLD produkt utelämnas positionen. Man är inte "15 av 15" —
        // man står bredvid listan, och de 14 andra är de man kan bläddra bland.
        <a className="pbrowse-rakn" href={`/kategori/${avsnitt.slug}`}>
          {raknasMed && position !== null
            ? `${position} av ${antal} i ${avsnitt.namn}`
            : `${antal} produkter i ${avsnitt.namn}`}
        </a>
      )}

      {nasta ? (
        <Lank granne={nasta} riktning="nasta" fran={nastaFran} />
      ) : (
        <Utgang avsnitt={avsnitt} riktning="nasta" />
      )}
    </nav>
  );
}

function Lank({
  granne,
  riktning,
  fran,
}: {
  granne: Granne;
  riktning: "forra" | "nasta";
  fran: string | null;
}) {
  const forra = riktning === "forra";
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
        {/* Korsar länken en avsnittsgräns säger vi vart man går — annars ser
            hoppet från Solskydd till Grillar ut som att fel produkt råkat
            hamna där. EGEN RAD, inte inbakat i etiketten: på mobil radbröt
            "NÄSTA I GRILL & UTEKÖK" till två rader medan motsatta sidans
            "FÖREGÅENDE" tog en, och då hamnade de två produktnamnen på olika
            höjd. Under namnet kan raden inte knuffa något. */}
        {fran && <span className="pbrowse-avsnitt">i {fran}</span>}
      </span>
    </a>
  );
}

/**
 * Kedjans ände: ingen granne åt det hållet. I stället för tomrum — en väg till
 * hela listan. Rutnätsikon i stället för chevron, eftersom destinationen är en
 * annan SORT än en produkt och inte ska läsas som "ett steg till".
 *
 * Saknas avsnittet (produkten hittades inte i kedjan) blir det ändå en giltig
 * länk: /butik finns alltid.
 */
function Utgang({
  avsnitt,
  riktning,
}: {
  avsnitt: { namn: string; slug: string } | null;
  riktning: "forra" | "nasta";
}) {
  return (
    <a
      className={`pbrowse-utgang pbrowse-${riktning}`}
      href={avsnitt ? `/kategori/${avsnitt.slug}` : "/butik"}
    >
      <span className="pbrowse-pil" aria-hidden="true">
        <Rutnat />
      </span>
      <span className="pbrowse-txt">
        <span className="pbrowse-etikett">Se alla</span>
        <span className="pbrowse-namn">{avsnitt ? avsnitt.namn : "Butiken"}</span>
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

/** Fyra rutor = "hela listan". Skiljer utgången från ett bläddringssteg. */
function Rutnat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}
