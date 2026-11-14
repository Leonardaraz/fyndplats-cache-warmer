"use client";
// Favoriternas rader: bild, namn, pris, lager och en knapp per vara. Samma
// rader i lådan (components/favoriter-lada.tsx) och på Mina sidor
// (app/konto/favoriter.tsx).
//
// Raden ritas direkt ur det sparade kortet (namn, bild och pris från när
// hjärtat trycktes) och fylls på med butikens svar: GET /api/favoriter, ETT
// anrop för hela listan. Svaret delas mellan lådan och Mina sidor och är
// färskt i en minut.

import { useEffect, useRef, useState } from "react";
import { RadBild, useCart } from "./cart";
import { TidigarePris } from "./tidigare-pris";
import { useWishlist } from "./wishlist";
import { trackAddToCart } from "../lib/analytics";
import { favoritFraga, favoritrader, handling, type FavoritProdukt, type Favoritrad, type Favoritsvar } from "../lib/favoriter";

const FARSK_MS = 60_000;
/** Så länge går en borttagning att ångra. */
const ANGRA_MS = 7000;

let senaste: { svar: Favoritsvar; tid: number } | null = null;
let pagaende: { adress: string; lofte: Promise<Favoritsvar | "fel"> } | null = null;

const tacker = (svar: Favoritsvar, lista: readonly string[]) => lista.every((s) => svar.produkter[s] || svar.saknas.includes(s));

function hamta(lista: readonly string[]): Promise<Favoritsvar | "fel"> {
  const adress = favoritFraga(lista);
  if (pagaende?.adress === adress) return pagaende.lofte;
  const lofte = fetch(adress, { signal: AbortSignal.timeout(15_000) })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { ok?: boolean; produkter?: Record<string, FavoritProdukt>; saknas?: string[] } | null): Favoritsvar | "fel" => {
      if (!j?.ok || !j.produkter || !Array.isArray(j.saknas)) return "fel";
      const svar = { produkter: j.produkter, saknas: j.saknas };
      senaste = { svar, tid: Date.now() };
      return svar;
    })
    .catch((): "fel" => "fel")
    .finally(() => {
      if (pagaende?.adress === adress) pagaende = null;
    });
  pagaende = { adress, lofte };
  return lofte;
}

/** Raderna, nyast först. `aktiv`: lådan är öppen eller sektionen visas; först då frågas butiken. */
export function useFavoritrader(aktiv: boolean): Favoritrad[] {
  const { lista, info, sparaInfo } = useWishlist();
  // Utfallet av den här komponentens senaste hämtning. Själva svaret delas i
  // `senaste`, så att lådan och Mina sidor visar samma sak.
  const [hamtat, setHamtat] = useState({ fel: false, varv: 0 });
  const nyckel = lista.join(",");

  useEffect(() => {
    if (!aktiv || lista.length === 0) return;
    if (senaste && tacker(senaste.svar, lista) && Date.now() - senaste.tid < FARSK_MS) return;
    let lever = true;
    hamta(lista).then((r) => {
      if (!lever) return;
      // Varvet räknas upp så att raderna ritas om också när utfallet är detsamma som sist.
      setHamtat((h) => ({ fel: r === "fel", varv: h.varv + 1 }));
      // Butikens svar blir det sparade kortet, så att raden står färdig nästa gång.
      if (r !== "fel") sparaInfo(Object.fromEntries(Object.values(r.produkter).map((p) => [p.slug, { n: p.namn, b: p.bild, p: p.pris }])));
    });
    return () => {
      lever = false;
    };
    // `nyckel` står för listans innehåll; `lista` byter identitet vid varje sparning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktiv, nyckel, sparaInfo]);

  // Ett svar som täcker hela listan gäller. Annars: gick hämtningen inte,
  // visas det sparade kortet som det är; pågår den, väntar raderna.
  const svar = senaste && tacker(senaste.svar, lista) ? senaste.svar : hamtat.fel ? "fel" : (senaste?.svar ?? null);
  return favoritrader(lista, info, svar);
}

function Lager({ p }: { p: FavoritProdukt }) {
  if (!p.iLager) return <span className="fav-lager" data-lager="slut">Slutsåld just nu</span>;
  if (p.faKvar) return <span className="fav-lager" data-lager="fa">Endast {p.faKvar} kvar</span>;
  return <span className="fav-lager" data-lager="i">I lager</span>;
}

function Rad({ r, vidLank, vidKop, taBort }: { r: Favoritrad; vidLank?: () => void; vidKop: (p: FavoritProdukt) => void; taBort: (r: Favoritrad) => void }) {
  const { busy } = useCart();
  const p = r.produkt;
  // Varken butiken eller det sparade kortet har ett namn än: raden väntar med streck i stället för text.
  const tom = r.lage === "laddar" && r.gissat;
  const gor = p ? handling(p) : null;
  return (
    <li className="fav-rad" data-lage={r.lage} aria-busy={r.lage === "laddar" || undefined}>
      <a className="fav-bild" href={r.sokvag} onClick={vidLank} tabIndex={-1} aria-hidden="true">
        {/* Kortets bild står kvar tills butikens bild har laddats, så att rutan aldrig blir tom (RadBild). */}
        <RadBild src={r.bild} alt="" klass="fav-bild-img" kant={84} />
      </a>
      <div className="fav-text">
        {tom ? (
          <span className="fav-streck" aria-hidden="true" />
        ) : (
          <a className="fav-namn" href={r.sokvag} onClick={vidLank}>
            {r.namn}
          </a>
        )}
        {r.lage === "borta" ? (
          <span className="fav-lager" data-lager="borta">Finns inte längre i sortimentet</span>
        ) : tom ? (
          <span className="fav-streck fav-streck-kort" aria-hidden="true" />
        ) : (
          <>
            {r.pris ? (
              <span className="fav-prisrad">
                <span className="fav-pris">{r.pris}</span>
                {p?.tidigare ? <TidigarePris kort belopp={p.tidigare} className="fav-tidigare" /> : null}
              </span>
            ) : null}
            {p ? <Lager p={p} /> : null}
          </>
        )}
      </div>
      <button type="button" className="fav-bort" onClick={() => taBort(r)} aria-label={`Ta bort ${r.namn} ur favoriter`} title="Ta bort ur favoriter">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <div className="fav-atg">
        {gor === "kop" && p ? (
          <button type="button" className="fav-kop" onClick={() => vidKop(p)} disabled={busy}>
            Lägg i varukorgen
          </button>
        ) : gor === "valj" ? (
          <a className="fav-kop" href={r.sokvag} onClick={vidLank}>
            Välj alternativ
          </a>
        ) : gor === "bevaka" ? (
          <a className="fav-kop fav-kop-tyst" href={r.sokvag} onClick={vidLank}>
            Bevaka varan
          </a>
        ) : r.lage === "okand" ? (
          <a className="fav-kop fav-kop-tyst" href={r.sokvag} onClick={vidLank}>
            Visa varan
          </a>
        ) : r.lage === "laddar" ? (
          <span className="fav-kop fav-kop-vantar" aria-hidden="true" />
        ) : null}
      </div>
    </li>
  );
}

/**
 * Listan med rader. `vidLank` körs när kunden går till en vara (lådan stänger
 * sig), och `foreKop` innan en vara läggs i varukorgen (lådan stänger sig, så
 * att varukorgens låda inte öppnas ovanpå den).
 */
export function Favoritrader({ rader, vidLank, foreKop }: { rader: Favoritrad[]; vidLank?: () => void; foreKop?: () => void }) {
  const { toggle } = useWishlist();
  const { add } = useCart();
  const [angra, setAngra] = useState<{ slug: string; namn: string } | null>(null);
  const klocka = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(klocka.current), []);

  const taBort = (r: Favoritrad) => {
    toggle(r.slug);
    setAngra({ slug: r.slug, namn: r.namn });
    clearTimeout(klocka.current);
    klocka.current = setTimeout(() => setAngra(null), ANGRA_MS);
  };
  const angraNu = () => {
    if (!angra) return;
    clearTimeout(klocka.current);
    // Kortet finns kvar i minnet: varan står tillbaka med namn och bild direkt.
    toggle(angra.slug);
    setAngra(null);
  };
  const vidKop = (p: FavoritProdukt) => {
    foreKop?.();
    // Mätningen efter ritningen, som på produktsidan.
    requestAnimationFrame(() => setTimeout(() => trackAddToCart({ id: p.id, name: p.namn, priceNum: p.prisNum }), 0));
    void add(p.id, undefined, 1, { namn: p.namn, bild: p.bild || undefined, prisNum: p.prisNum || undefined });
  };

  return (
    <>
      <ul className="fav-lista">
        {rader.map((r) => (
          <Rad key={r.slug} r={r} vidLank={vidLank} vidKop={vidKop} taBort={taBort} />
        ))}
      </ul>
      <div className="fav-angra" role="status" data-synlig={angra ? "" : undefined}>
        {angra ? (
          <>
            <span className="fav-angra-text">Borttagen ur favoriter</span>
            <button type="button" className="fav-angra-knapp" onClick={angraNu}>
              Ångra
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}
