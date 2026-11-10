"use client";
// Den direkta vägen till ett företagskonto, /konto/foretag (Leonard 2026-11-10).
//
// Tre steg på en sida:
//   1. E-post: organisationsnumret (prövat direkt, utan anrop) och e-posten,
//      sedan koden från mejlet. Samma inloggning som /konto (KontoInloggning).
//   2. Företaget: samma ansökan som på Mina sidor (Ansokan), med numret från
//      steg 1 ifyllt och namnet hämtat från Bolagsverket.
//   3. Klart: ett godkänt företag växlar profilen direkt, så att priserna visas
//      exklusive moms utan ett besök på Mina sidor.
//
// Stegen byts på sidan, utan omladdning: numret från steg 1 lever bara i
// komponentens minne och sparas aldrig i webbläsaren (för en enskild firma är
// det ett personnummer). Den som loggar in med länken i mejlet landar på samma
// adress, redan inloggad, och börjar då på steg 2.
//
// Vad som går att pröva utan webbläsare bor i lib/medlem/foretagsstart.ts.

import { useEffect, useRef, useState } from "react";
import { orgnrFeltext, provaOrgnr } from "@/lib/medlem/orgnr";
import { FORETAGSVAG, STEG, efterInloggning, klartext, stegLage, utvag, type Utfall } from "@/lib/medlem/foretagsstart";
import { KontoInloggning } from "./konto-inloggning";
import { Ansokan, numretNu } from "./foretag";
import s from "./konto.module.css";

type Steg = "start" | "uppgifter" | "klart";
const NUMMER: Record<Steg, number> = { start: 0, uppgifter: 1, klart: 2 };

async function fraga(url: string, kropp: unknown): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(kropp),
    });
    return (await r.json().catch(() => null)) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

function Bock({ storlek = 14 }: { storlek?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={storlek} height={storlek} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function Stegrad({ aktivt }: { aktivt: number }) {
  return (
    <ol className={s.stegrad} aria-label="Stegen till ett företagskonto">
      {STEG.map((namn, i) => {
        const lage = stegLage(i, aktivt);
        return (
          <li key={namn} className={s.stegpunkt} data-lage={lage} aria-current={lage === "nu" ? "step" : undefined}>
            <span className={s.stegnr} aria-hidden="true">
              {lage === "klar" ? <Bock /> : i + 1}
            </span>
            <span className={s.stegnamn}>
              {namn}
              {lage === "klar" ? <span className="sr-only"> (klart)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ForetagStart({ inloggad, fel }: { inloggad: boolean; fel?: string | null }) {
  const [steg, setSteg] = useState<Steg>(inloggad ? "uppgifter" : "start");
  const [orgnr, setOrgnr] = useState("");
  const [orgFel, setOrgFel] = useState<string | null>(null);
  const [lamnar, setLamnar] = useState(false);
  const [utfall, setUtfall] = useState<Utfall | null>(null);
  const orgFalt = useRef<HTMLInputElement>(null);
  const rubrik = useRef<HTMLHeadingElement>(null);
  // Steget byttes på sidan: flytta fokus till stegets rubrik, så att
  // tangentbordet och skärmläsaren följer med. Inte vid första ritningen.
  const forstaRitning = useRef(true);
  useEffect(() => {
    if (forstaRitning.current) {
      forstaRitning.current = false;
      return;
    }
    rubrik.current?.focus();
  }, [steg]);

  const nu = numretNu(orgnr);

  /** Före koden: numret ska vara ett riktigt organisationsnummer. */
  function numretStammer(): boolean {
    const p = provaOrgnr(orgnr);
    if (p.ok) return true;
    setOrgFel(orgnr.trim() === "" ? "Skriv företagets organisationsnummer." : orgnrFeltext(p.fel));
    orgFalt.current?.focus();
    return false;
  }

  /** Koden stämde: fråga servern om kontot redan har ett företag. */
  async function inloggadNu() {
    // Sidhuvudets knapp läser tecknet om: "Bli medlem" blir "Mitt konto".
    window.dispatchEvent(new Event("fp-konto-andrat"));
    const nasta = efterInloggning(await fraga("/api/konto/foretag", { steg: "lage" }));
    if (nasta === "uppgifter") return setSteg("uppgifter");
    setLamnar(true);
    window.location.assign(utvag(nasta));
  }

  /** Ansökan är sparad. Ett godkänt företag börjar handla som företaget direkt. */
  async function ansokt(status: string, namn?: string) {
    const godkant = status === "aktiv";
    const bytt = godkant ? (await fraga("/api/konto/profil", { profil: "foretag" }))?.ok === true : false;
    if (bytt) window.dispatchEvent(new Event("fp-konto-andrat"));
    setUtfall({ status: godkant ? "aktiv" : "granskas", ...(namn ? { namn } : {}), somForetag: bytt });
    setSteg("klart");
  }

  const slut = utfall ? klartext(utfall) : null;

  return (
    <div className={s.foretagsstart}>
      <Stegrad aktivt={NUMMER[steg]} />

      {steg === "start" ? (
        lamnar ? (
          <div className={s.inloggning} role="status">
            <p className={s.info}>Du är inloggad. Ett ögonblick …</p>
          </div>
        ) : (
          <KontoInloggning
            mal={FORETAGSVAG}
            fel={fel}
            knapptext="Fortsätt"
            kodknapp="Fortsätt"
            platshallare="namn@foretaget.se"
            kontroll={numretStammer}
            efter={inloggadNu}
            fore={
              <>
                <label htmlFor="fs-orgnr" className={s.etikett}>
                  Organisationsnummer
                </label>
                <input
                  id="fs-orgnr"
                  ref={orgFalt}
                  className={s.falt}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={13}
                  value={orgnr}
                  onChange={(e) => {
                    setOrgnr(e.target.value);
                    if (orgFel) setOrgFel(null);
                  }}
                  aria-invalid={orgFel ? true : undefined}
                  aria-describedby="fs-orgnr-nu"
                />
                <span
                  id="fs-orgnr-nu"
                  className={`${orgFel || nu.ton === "fel" ? s.faltFel : nu.ton === "ok" ? s.faltOk : s.faltHjalp} ${s.orgRad}`}
                  aria-live="polite"
                >
                  {!orgFel && nu.ton === "ok" ? <Bock storlek={13} /> : null}
                  {orgFel ?? nu.text}
                </span>
              </>
            }
          />
        )
      ) : null}
      {steg === "start" ? (
        <p className={s.liten}>
          Kontot skapas på din e-postadress, och du loggar in med en kod som vi mejlar, utan lösenord. En enskild firma går vi
          igenom för hand, oftast inom en arbetsdag. Läs mer i <a href="/villkor/foretag">villkoren för företagskonto</a> och i
          vår <a href="/sekretesspolicy">sekretesspolicy</a>.
        </p>
      ) : null}

      {steg === "uppgifter" ? (
        <div className={`${s.inloggning} ${s.foretagssteg}`}>
          <h2 className={s.stegrubrik} ref={rubrik} tabIndex={-1}>
            Företagets uppgifter
          </h2>
          <p className={s.info}>
            {provaOrgnr(orgnr).ok
              ? "Kontrollera företagets namn och fyll i fakturaadressen. Den står på kvitton och fakturor."
              : "Skriv organisationsnumret, så hämtar vi namnet från Bolagsverket. Fakturaadressen står på kvitton och fakturor."}
          </p>
          <Ansokan startOrgnr={orgnr} knapptext="Skapa företagskonto" efter={ansokt} />
        </div>
      ) : null}

      {steg === "klart" && slut && utfall ? (
        <div className={`${s.inloggning} ${s.klart}`} data-utfall={utfall.status}>
          <span className={s.klartIkon} aria-hidden="true">
            {utfall.status === "aktiv" ? (
              <Bock storlek={28} />
            ) : (
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            )}
          </span>
          <h2 className={`${s.stegrubrik} ${s.klartRubrik}`} ref={rubrik} tabIndex={-1}>
            {slut.rubrik}
          </h2>
          <p className={s.info} role="status">
            {slut.text}
          </p>
          <div className={s.klartKnappar}>
            {slut.knappar.map((k, i) => (
              <a key={k.href + k.text} href={k.href} className={i === 0 ? `btn btn-primary ${s.knapp}` : s.utknapp}>
                {k.text}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
