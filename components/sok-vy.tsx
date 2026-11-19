"use client";
// Söksidans innehåll: rubriken, kategorierna som matchar, beskedet, träffarna
// och det tomma läget. Delas av de två vägar sidan har (app/sok/page.tsx):
// servern när katalogen redan ligger i minnet, och webbläsaren när den inte
// gör det (components/sok-kall.tsx).
import { useState } from "react";
import { ShopBrowser } from "./shopbrowser";
import { ProductCard } from "./productcard";
import type { ListProduct } from "../lib/products";
import { productCountLabel } from "../lib/rating";
import { rentNamn, type SokKategori } from "../lib/sok-kategorier";
import { inomPris, lagstaPris, prisText } from "../lib/sok-pris";

export type SokData = {
  traffar: ListProduct[];
  /** Sökord som ströks för att få någon träff (lib/search.ts, rankaMedInfo). */
  strukna: string[];
  /** Färg eller mått som inte står i alla träffars namn, och hur många som har dem. */
  utan?: string[];
  hela?: number;
  /** Kategorier vars namn matchar sökningen. */
  kategorier: SokKategori[];
  /** Priset ur sökningen ("under 2000"), när det fanns ett (lib/sok-pris.ts). */
  pris?: { max?: number; min?: number };
  /** Det tomma läget: varor som säljer just nu, och butikens största kategorier. */
  populart: ListProduct[];
  popularaKategorier: SokKategori[];
  /** Ordet träffarna gäller när sökningen var två bokstäver (lib/search.ts, rankaMedForslag). */
  visar?: string;
};

const citat = (ord: string[]) => ord.map((o) => `“${o}”`).join(" och ");

function Kategorier({ lista, etikett }: { lista: SokKategori[]; etikett: string }) {
  if (lista.length === 0) return null;
  return (
    <nav className="sok-kategorier" aria-label="Kategorier som matchar sökningen">
      <span className="sok-kategorier-etikett">{etikett}</span>
      {lista.map((k) => (
        <a key={k.slug} href={`/kategori/${k.slug}`}>{rentNamn(k.name)} <span aria-hidden="true">→</span></a>
      ))}
    </nav>
  );
}

export function SokVy({ q, data }: { q: string; data: SokData | "laddar" | "fel" }) {
  const term = q.trim();
  const klar = typeof data === "object" ? data : null;
  // PRISET I SÖKNINGEN. Träffarna inom priset visas, och en knapp visar alla.
  // Finns ingen träff inom priset visas alla, med besked: hellre det än en tom
  // sida för den som skrev en för snål budget. Valet gäller sökningen det
  // gjordes för (vyn lever kvar när man söker igen).
  const [allaFor, setAllaFor] = useState<string | null>(null);
  const pris = klar?.pris;
  const inom = klar && pris ? klar.traffar.filter((p) => inomPris(pris, lagstaPris(p))) : null;
  const visaAlla = allaFor === q;
  const visade = klar ? (inom && inom.length > 0 && !visaAlla ? inom : klar.traffar) : [];
  const antal = visade.length;
  const tom = Boolean(term) && klar !== null && antal === 0;
  const rad = !term
    ? "Skriv i sökrutan ovan för att hitta produkter."
    : data === "laddar"
      ? "Söker…"
      : data === "fel"
        ? "Sökningen gick inte att göra just nu."
        : `${productCountLabel(antal)} hittades`;
  return (
    <>
      {/* Rubriken står i studiobandet (.sidtopp i globals.css), som på de andra listsidorna. */}
      <section className="sidtopp">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Sök</div>
            <h1>{term ? `Sökresultat för “${q}”` : "Sök i butiken"}</h1>
            <p aria-live="polite">{rad}</p>
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="container">
          {data === "laddar" && term && <div className="sok-vantar" aria-hidden="true">Söker i hela sortimentet…</div>}
          {data === "fel" && (
            <div className="sok-tom">
              <p className="sok-tom-text">Vi kunde inte hämta sortimentet just nu. Försök igen om en stund, eller bläddra i kategorierna.</p>
              <div className="nf-actions">
                {/* Laddar om samma adress: ingen ny intern länk med sökdel (lib/interna-lankar-fragestrang.test.ts). */}
                <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Försök igen</button>
                <a className="btn btn-ghost" href="/butik">Se alla kategorier</a>
              </div>
            </div>
          )}
          {klar && klar.traffar.length > 0 && (
            <>
              <Kategorier lista={klar.kategorier} etikett="Kategorier" />
              {klar.visar && (
                <p className="sok-besked">
                  Du skrev “{term}”. Här är träffarna för <b>“{klar.visar}”</b>.
                </p>
              )}
              {klar.strukna.length > 0 && (
                <p className="sok-besked">
                  Ingen vara har alla sökord i namnet. Här är träffarna utan <b>{citat(klar.strukna)}</b>.
                </p>
              )}
              {pris && inom && (
                <p className="sok-besked">
                  {inom.length === 0 ? (
                    <>Ingen träff kostar {prisText(pris)}. Här är alla <b>{klar.traffar.length}</b>.</>
                  ) : visaAlla ? (
                    <>Du ser alla <b>{klar.traffar.length}</b> träffar.{" "}
                      <button type="button" className="sok-besked-knapp" onClick={() => setAllaFor(null)}>Visa bara {prisText(pris)}</button></>
                  ) : (
                    <>Du ser <b>{inom.length === 1 ? "1 vara" : `${inom.length} varor`} {prisText(pris)}</b>.
                      {inom.length < klar.traffar.length && (
                        <>{" "}<button type="button" className="sok-besked-knapp" onClick={() => setAllaFor(q)}>Visa alla {klar.traffar.length}</button></>
                      )}</>
                  )}
                </p>
              )}
              {klar.utan && klar.utan.length > 0 && (
                <p className="sok-besked">
                  <b>{klar.hela === 1 ? "1 vara" : `${klar.hela} varor`}</b> har {citat(klar.utan)} i namnet. Vi visar också de övriga träffarna,
                  eftersom färg och mått ofta står bland varans val och inte i namnet.
                </p>
              )}
              {/* defaultSort "rel": behåll relevansordningen. Förr sorterades
                  träffarna om efter Rekommenderat (samma mix som kategorisidorna),
                  så "soffa" gav "Sidobord för soffan" på plats två och en
                  hängmatta i ett klösträd före riktiga mattor. */}
              {/* ☠️ NYCKELN. Listan håller prisreglagets läge som tillstånd, satt
                  efter varorna den först fick. Byts varorna (en ny sökning, eller
                  "Visa alla" efter ett pris i sökningen) stod reglaget kvar på de
                  gamla gränserna och blev ett filter ingen hade valt: sidan sa
                  137 träffar och listan visade 36. Med en nyckel per sökning och
                  läge börjar listan om. */}
              <ShopBrowser key={`${q}|${visaAlla ? "alla" : "inom"}`} products={visade} defaultSort="rel" />
            </>
          )}
          {tom && klar && (
            <div className="sok-tom">
              <p className="sok-tom-text">
                {klar.kategorier.length > 0
                  ? <>Ingen vara har “{q}” i namnet, men det finns en kategori som passar.</>
                  : <>Vi hittade inget på “{q}”. Prova ett kortare ord, en annan stavning eller varans typ, till exempel “fåtölj” i stället för ett märke.</>}
              </p>
              <Kategorier lista={klar.kategorier} etikett="Titta i" />
              <div className="nf-actions">
                <a className="btn btn-primary" href="/butik">Se alla kategorier</a>
                <a className="btn btn-ghost" href="/kontaktaoss">Fråga oss om varan</a>
              </div>
              {klar.kategorier.length === 0 && klar.popularaKategorier.length > 0 && (
                <div className="nf-cats">
                  <div className="nf-cats-label">Populära kategorier</div>
                  <div className="nf-cats-row">
                    {klar.popularaKategorier.map((c) => (
                      <a key={c.slug} href={`/kategori/${c.slug}`}>{rentNamn(c.name)}</a>
                    ))}
                  </div>
                </div>
              )}
              {klar.populart.length > 0 && (
                <div className="sok-tom-populart">
                  <h2>Populärt just nu</h2>
                  <div className="prodgrid listgrid">
                    {klar.populart.map((p) => <ProductCard p={p} key={p.slug} tvaKolumner />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
