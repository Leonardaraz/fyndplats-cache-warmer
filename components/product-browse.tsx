// "Föregående / Nästa produkt" högst upp på produktsidan.
//
// Leonards ärende: man skulle slippa backa till kategorisidan varje gång man
// vill titta på nästa sak. Pilarna pekar på grannarna i avdelningens ordning —
// samma ordning kategorisidan visar, se lib/product-neighbours.ts.
//
// Ren serverkomponent: inga hooks, inget "use client". Länkarna är vanliga
// <a>, så de fungerar utan JS och Next hämtar dem i förväg som vanligt.
//
// TILLGÄNGLIGHET: <nav> med aria-label, eftersom det är en andra navigation på
// sidan vid sidan av brödsmulan. Pilarna är dekorativa (aria-hidden) — länkens
// egen text bär redan riktningen. Produktnamnet kortas visuellt med CSS
// (text-overflow), inte i strängen, så skärmläsaren får hela namnet.
//
// Renderas inte alls när det varken finns föregående eller nästa: en ensam
// produkt i en avdelning ska inte få en tom rad över sig.

import type { Grannar } from "../lib/product-neighbours";

type Granne = { slug: string; name: string } | null;

export function ProductBrowse({
  grannar,
  kategoriNamn,
}: {
  grannar: Grannar<{ slug: string; name: string }>;
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
    <a className={`pbrowse-lank pbrowse-${riktning}`} href={`/produkt/${granne.slug}`} rel={forra ? "prev" : "next"}>
      <span className="pbrowse-pil" aria-hidden="true">{forra ? "←" : "→"}</span>
      <span className="pbrowse-txt">
        <span className="pbrowse-etikett">{forra ? "Föregående" : "Nästa"}</span>
        <span className="pbrowse-namn">{granne.name}</span>
      </span>
    </a>
  );
}
