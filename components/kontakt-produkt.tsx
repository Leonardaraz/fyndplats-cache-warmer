"use client";
// Kontaktformulärets produktväljare (Leonard 2026-11-07: "att man kan söka upp
// en produkt på kontaktformuläret och välja den så vi vet exakt vilken dom
// pratar om").
//
// Valfri. Kunden söker på produktens namn i samma index som sidhuvudets
// sökruta (lib/sok-index.ts, rankaForslag) och väljer en träff. Har produkten
// flera val (färg, storlek …) kan kunden peka ut vilket. Kommer kunden från
// produktsidans flik "Kontakta oss" är produkten redan vald (?produkt= och
// ?variant= i adressen, useValdProdukt nedan). Formuläret
// (components/contactform.tsx) skickar bara slugen och valets id.

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { KORTASTE_SOKNING, laddaSokIndex, rankaForslag, sokIndexHamtat, type SokTraff } from "../lib/sok-index";
import { lasKontaktParams, medValt, produktUrl, type KontaktProdukt } from "../lib/kontakt/kontakt";

/** Så många träffar visas. Färre än sidhuvudets sju: formuläret står ofta långt ner på skärmen. */
const ANTAL_TRAFFAR = 6;

/** Produkten för formuläret, ur /api/kontakt/produkt. Null när den inte finns eller inte svarar. */
async function hamtaValdProdukt(slug: string): Promise<KontaktProdukt | null> {
  try {
    const r = await fetch(`/api/kontakt/produkt?p=${encodeURIComponent(slug)}`, { signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return null;
    const d = (await r.json()) as { ok?: boolean; produkt?: KontaktProdukt };
    return d.ok && d.produkt ? d.produkt : null;
  } catch {
    return null;
  }
}

/** Det formuläret kan visa direkt för en sökträff, medan valen hämtas. */
function produktUrTraff(h: SokTraff): KontaktProdukt {
  return { slug: h.s, namn: h.n, bild: h.i, pris: h.p, url: produktUrl({ slug: h.s }), iLager: !h.o, val: [] };
}

// Adressens sökdel läses utan effekt: tom på servern och vid hydreringen,
// sedan webbläsarens (useSyncExternalStore sköter bytet).
const ingenPrenumeration = () => () => {};
const lasSokdel = () => window.location.search;
const ingenSokdel = () => "";

/**
 * Den valda produkten och valet: förvalet ur adressen (produktsidans flik
 * "Kontakta oss"), en sökträff eller ingen alls.
 */
export function useValdProdukt() {
  const [produkt, setProdukt] = useState<KontaktProdukt | null>(null);
  const [valtId, setValtId] = useState<string | undefined>(undefined);
  const sokdel = useSyncExternalStore(ingenPrenumeration, lasSokdel, ingenSokdel);
  const forval = useMemo(() => lasKontaktParams(sokdel), [sokdel]);
  // Sant när förvalet är hämtat, eller när kunden själv valt eller tagit bort en
  // produkt. Medan förvalet hämtas visar väljaren ett skelett utan knappar, så
  // kunden kan inte välja något annat under tiden.
  const [forvalKlart, setForvalKlart] = useState(false);

  useEffect(() => {
    if (!forval) return;
    let aktuell = true;
    void hamtaValdProdukt(forval.slug).then((p) => {
      if (!aktuell) return;
      setForvalKlart(true);
      if (!p) return;
      setProdukt(p);
      const { valt } = medValt(p, forval.variantId);
      if (valt) setValtId(valt.id);
    });
    return () => {
      aktuell = false;
    };
  }, [forval]);

  function valj(h: SokTraff) {
    setForvalKlart(true);
    setProdukt(produktUrTraff(h));
    setValtId(undefined);
    // Valen (färg, storlek …) kommer ur katalogen; kortet visas direkt ur
    // sökträffen. Ett sent svar för en produkt som kunden redan bytt bort eller
    // tagit bort kastas.
    void hamtaValdProdukt(h.s).then((p) => {
      if (p) setProdukt((nu) => (nu?.slug === h.s ? p : nu));
    });
  }

  function rensa() {
    setForvalKlart(true);
    setProdukt(null);
    setValtId(undefined);
  }

  return { produkt, valtId, laddar: !!forval && !forvalKlart && !produkt, valj, setValtId, rensa };
}

export type ValdProdukt = ReturnType<typeof useValdProdukt>;

function Forstoringsglas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ProduktValjare({ vald }: { vald: ValdProdukt }) {
  const { produkt, valtId, laddar, valj: valjProdukt, setValtId, rensa } = vald;
  const id = useId();
  const sokId = `${id}-sok`;
  const listId = `${id}-lista`;
  const [q, setQ] = useState("");
  const [traffar, setTraffar] = useState<SokTraff[]>([]);
  const [oppen, setOppen] = useState(false);
  const [aktiv, setAktiv] = useState(-1);
  const [indexLaddar, setIndexLaddar] = useState(false);
  const [indexFel, setIndexFel] = useState(false);
  const senaste = useRef("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const sokRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const utanfor = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOppen(false);
    };
    document.addEventListener("mousedown", utanfor);
    return () => document.removeEventListener("mousedown", utanfor);
  }, []);

  // Bara den senaste tangenten rankas: tangenter som trycks medan indexet
  // hämtas väntar på samma löfte (samma regel som components/searchbox.tsx).
  async function sok(varde: string) {
    senaste.current = varde;
    setQ(varde);
    setAktiv(-1);
    const term = varde.trim();
    if (term.length < KORTASTE_SOKNING) {
      setTraffar([]);
      setOppen(false);
      return;
    }
    setOppen(true);
    if (!sokIndexHamtat()) setIndexLaddar(true);
    const idx = await laddaSokIndex();
    if (senaste.current !== varde) return;
    setIndexLaddar(false);
    setIndexFel(!idx);
    setTraffar(idx ? rankaForslag(idx, term, ANTAL_TRAFFAR) : []);
  }

  function valj(h: SokTraff) {
    valjProdukt(h);
    senaste.current = "";
    setQ("");
    setTraffar([]);
    setOppen(false);
    setAktiv(-1);
  }

  function tangent(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (traffar.length) {
        setOppen(true);
        setAktiv((a) => Math.min(a + 1, traffar.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAktiv((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      // Enter i sökrutan skickar aldrig hela formuläret.
      e.preventDefault();
      if (oppen && aktiv >= 0 && traffar[aktiv]) valj(traffar[aktiv]);
    } else if (e.key === "Escape") {
      setOppen(false);
    }
  }

  if (produkt) {
    const { valt, bild, pris, iLager, sokvag } = medValt(produkt, valtId);
    return (
      <div className="kprod">
        <span className="kprod-etikett">Frågan gäller</span>
        <div className="kprod-kort">
          <span className="sugg-img kprod-bild">
            {bild && <Image src={bild} alt="" fill sizes="64px" style={{ objectFit: "cover" }} />}
          </span>
          <span className="kprod-info">
            <a className="kprod-namn" href={sokvag} target="_blank" rel="noopener">
              {produkt.namn}
            </a>
            <span className="kprod-pris">
              {pris}
              {!iLager && <span className="sugg-oos">Slutsåld</span>}
            </span>
          </span>
        </div>
        {produkt.val.length > 1 && (
          <label className="kprod-val">
            Vilken variant?
            <select value={valt?.id ?? ""} onChange={(e) => setValtId(e.target.value || undefined)}>
              <option value="">Vet inte, eller spelar ingen roll</option>
              {produkt.val.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.namn}
                  {v.iLager ? "" : " (slutsåld)"}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="kprod-knappar">
          <button
            type="button"
            onClick={() => {
              // Kortet försvinner och sökrutan ritas i samma tryck, så att
              // markören kan ställas i den direkt.
              flushSync(rensa);
              sokRef.current?.focus();
            }}
          >
            Byt produkt
          </button>
          <button type="button" onClick={rensa}>
            Ta bort
          </button>
        </span>
      </div>
    );
  }

  if (laddar) {
    return (
      <div className="kprod" aria-busy="true">
        <span className="kprod-etikett">Frågan gäller</span>
        <div className="kprod-kort kprod-laddar">
          <span className="sugg-img kprod-bild" />
          <span className="kprod-info">Hämtar produkten…</span>
        </div>
      </div>
    );
  }

  const visaLista = oppen && q.trim().length >= KORTASTE_SOKNING;
  return (
    <div className="kprod" ref={wrapRef}>
      <label htmlFor={sokId}>
        Gäller det en produkt? <span className="kprod-valfritt">Valfritt</span>
      </label>
      <div className="kprod-sok">
        <Forstoringsglas />
        <input
          ref={sokRef}
          id={sokId}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visaLista}
          aria-controls={listId}
          aria-activedescendant={visaLista && aktiv >= 0 ? `${listId}-${aktiv}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Sök på produktens namn"
          value={q}
          onChange={(e) => void sok(e.target.value)}
          onFocus={() => {
            void laddaSokIndex();
            if (q.trim().length >= KORTASTE_SOKNING) setOppen(true);
          }}
          onKeyDown={tangent}
        />
        {visaLista && (
          <ul className="sugg kprod-lista" id={listId} role="listbox" aria-label="Produkter">
            {indexLaddar ? (
              <li className="sugg-empty" role="presentation">Söker…</li>
            ) : indexFel ? (
              <li className="sugg-empty" role="presentation">
                Sökningen fungerar inte just nu. Skriv produktens namn i meddelandet i stället.
              </li>
            ) : traffar.length === 0 ? (
              <li className="sugg-empty" role="presentation">Inga produkter matchade “{q.trim()}”.</li>
            ) : (
              traffar.map((h, i) => (
                <li
                  key={h.s}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === aktiv}
                  className={`sugg-item${i === aktiv ? " active" : ""}`}
                  // Fokus stannar i sökrutan medan träffen väljs (klicket).
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => valj(h)}
                  onMouseEnter={() => setAktiv(i)}
                >
                  <span className="sugg-img">
                    {h.i && <Image src={h.i} alt="" fill sizes="46px" style={{ objectFit: "cover" }} />}
                  </span>
                  <span className="sugg-name">
                    {h.n}
                    {h.o ? <span className="sugg-oos">Slutsåld</span> : null}
                  </span>
                  <span className="sugg-price">{h.p}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <p className="kprod-tips">Välj produkten så ser vi direkt vilken du menar.</p>
    </div>
  );
}
