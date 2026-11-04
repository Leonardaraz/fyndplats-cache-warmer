"use client";
// Företagskontot på Mina sidor (E3): ansökan, ansökans läge och valet
// "Du handlar som" privat eller som företaget.
//
// Organisationsnumret prövas medan kunden skriver, med samma kod som servern
// (lib/medlem/orgnr.ts och foretag.ts), så att ett skrivfel syns direkt
// (E3-1). Servern prövar allt igen; formuläret är bara en hjälp.
//
// ☠️ Komponenten får aldrig hela numret för en enskild firma: servern skickar
// bara det maskerade (`orgnrVisas`).

import { useState, type FormEvent } from "react";
import { orgnrFeltext, provaOrgnr } from "@/lib/medlem/orgnr";
import { VILLKOR_FORETAG_VERSION, postnrText, provaForetagsansokan, type Faltfel } from "@/lib/medlem/foretag";
import s from "./konto.module.css";

/** En offert på Mina sidor: aldrig priser, bara läget och länken. */
export interface OffertPaMinaSidor {
  id: string;
  datum: string;
  status: string;
  /** Länken visas när offerten är prissatt, öppnad eller betald. */
  visa: boolean;
}

export interface ForetagVy {
  status: "granskas" | "aktiv" | "nekad";
  namn: string;
  orgnrVisas: string;
  form: "juridisk" | "enskild";
  faktura: { gata: string; postnr: string; ort: string };
  leverans?: { gata: string; postnr: string; ort: string };
  /** Den gällande versionen av villkoren är godkänd (E3-12). */
  villkorAktuellt: boolean;
  statustext: string;
}

const ORG = { prova: provaOrgnr, feltext: orgnrFeltext };

const SKAL: Record<string, string> = {
  utloggad: "Du har loggats ut. Logga in igen och försök på nytt.",
  sparrad: "Kontot är spärrat. Mejla info@fyndplats.com.",
  stangt: "Företagskontot är inte öppnat än.",
  finns: "Företaget är redan registrerat på kontot.",
  "inte-godkant": "Företaget är inte godkänt än.",
  tillfalligt: "Det gick inte just nu. Försök igen om en stund.",
};

async function skicka(url: string, kropp: unknown): Promise<{ ok: boolean; fel?: Faltfel; skal?: string }> {
  try {
    const r = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(kropp),
    });
    return (await r.json().catch(() => ({ ok: false, skal: "tillfalligt" }))) as { ok: boolean; fel?: Faltfel; skal?: string };
  } catch {
    return { ok: false, skal: "tillfalligt" };
  }
}

/** Vad numret är medan kunden skriver: tomt, ett fel, eller vilken sorts nummer. */
function numretNu(text: string): { ton: "ok" | "fel" | "tyst"; text: string } {
  const siffror = text.replace(/\D/g, "");
  if (siffror.length < 10) return { ton: "tyst", text: "Tio siffror, till exempel 556012-5790." };
  const p = provaOrgnr(text);
  if (!p.ok) return { ton: "fel", text: orgnrFeltext(p.fel) };
  return p.form === "enskild"
    ? { ton: "ok", text: `Enskild firma (${p.visas}). Numret visas bara maskerat.` }
    : { ton: "ok", text: `Organisationsnumret ${p.nummer} stämmer.` };
}

function Ansokan({ efter }: { efter: () => void }) {
  const [orgnr, setOrgnr] = useState("");
  const [annan, setAnnan] = useState(false);
  const [fel, setFel] = useState<Faltfel>({});
  const [skal, setSkal] = useState<string | null>(null);
  const [upptagen, setUpptagen] = useState(false);
  const nu = numretNu(orgnr);

  async function sand(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const falt = Object.fromEntries(new FormData(e.currentTarget).entries());
    const prov = provaForetagsansokan(falt, ORG);
    if (!prov.ok) {
      setFel(prov.fel);
      return;
    }
    setUpptagen(true);
    setSkal(null);
    const svar = await skicka("/api/konto/foretag", { ...falt, steg: "ansok" });
    setUpptagen(false);
    if (svar.ok) return efter();
    setFel(svar.fel ?? {});
    setSkal(svar.skal ? (SKAL[svar.skal] ?? SKAL.tillfalligt) : null);
  }

  const faltfel = (f: keyof Faltfel) =>
    fel[f] ? (
      <span className={s.faltFel} id={`fel-${f}`}>
        {fel[f]}
      </span>
    ) : null;

  return (
    <form className={s.foretagForm} onSubmit={sand} noValidate>
      <label className={s.etikett} htmlFor="ft-namn">
        Företagets namn
      </label>
      <input id="ft-namn" name="namn" className={s.falt} autoComplete="organization" maxLength={100} aria-describedby={fel.namn ? "fel-namn" : undefined} />
      {faltfel("namn")}

      <label className={s.etikett} htmlFor="ft-orgnr">
        Organisationsnummer
      </label>
      <input
        id="ft-orgnr"
        name="orgnr"
        className={s.falt}
        inputMode="numeric"
        autoComplete="off"
        maxLength={13}
        value={orgnr}
        onChange={(e) => {
          setOrgnr(e.target.value);
          if (fel.orgnr) setFel({ ...fel, orgnr: undefined });
        }}
        aria-describedby="ft-orgnr-nu"
      />
      <span id="ft-orgnr-nu" className={fel.orgnr ? s.faltFel : nu.ton === "ok" ? s.faltOk : nu.ton === "fel" ? s.faltFel : s.faltHjalp} aria-live="polite">
        {fel.orgnr ?? nu.text}
      </span>

      <fieldset className={s.adress}>
        <legend className={s.etikett}>Fakturaadress</legend>
        <input name="gata" className={s.falt} placeholder="Gatuadress" autoComplete="street-address" maxLength={100} aria-label="Gatuadress" />
        {faltfel("gata")}
        <div className={s.postrad}>
          <input name="postnr" className={s.falt} placeholder="Postnummer" inputMode="numeric" autoComplete="postal-code" maxLength={6} aria-label="Postnummer" />
          <input name="ort" className={s.falt} placeholder="Ort" autoComplete="address-level2" maxLength={60} aria-label="Ort" />
        </div>
        {faltfel("postnr")}
        {faltfel("ort")}
      </fieldset>

      <label className={s.kryss}>
        <input type="checkbox" name="annanLeverans" value="1" checked={annan} onChange={(e) => setAnnan(e.target.checked)} />
        <span>Varorna ska levereras till en annan adress</span>
      </label>
      {annan && (
        <fieldset className={s.adress}>
          <legend className={s.etikett}>Leveransadress</legend>
          <input name="lgata" className={s.falt} placeholder="Gatuadress" maxLength={100} aria-label="Leveransadressens gata" />
          {faltfel("lgata")}
          <div className={s.postrad}>
            <input name="lpostnr" className={s.falt} placeholder="Postnummer" inputMode="numeric" maxLength={6} aria-label="Leveransadressens postnummer" />
            <input name="lort" className={s.falt} placeholder="Ort" maxLength={60} aria-label="Leveransadressens ort" />
          </div>
          {faltfel("lpostnr")}
          {faltfel("lort")}
        </fieldset>
      )}

      <label className={s.kryss}>
        <input type="checkbox" name="naring" value="1" />
        <span>Köpen görs i företagets näringsverksamhet, och jag får företräda företaget.</span>
      </label>
      {faltfel("naring")}
      <label className={s.kryss}>
        <input type="checkbox" name="villkor" value={VILLKOR_FORETAG_VERSION} />
        <span>
          Jag godkänner{" "}
          <a href="/villkor/foretag" target="_blank" rel="noopener">
            villkoren för företagskonto
          </a>{" "}
          (version {VILLKOR_FORETAG_VERSION}).
        </span>
      </label>
      {faltfel("villkor")}

      <button type="submit" className={`btn btn-primary ${s.knapp}`} disabled={upptagen}>
        {upptagen ? "Skickar …" : "Skicka ansökan"}
      </button>
      {skal && (
        <p className={s.fel} role="alert">
          {skal}
        </p>
      )}
      <p className={s.liten}>
        Vi kontrollerar uppgifterna mot Bolagsverket innan företagspriserna gäller. För en enskild firma är
        organisationsnumret ditt personnummer; vi visar det bara maskerat. Läs mer i vår{" "}
        <a href="/sekretesspolicy">sekretesspolicy</a>.
      </p>
    </form>
  );
}

function Villkor({ efter }: { efter: () => void }) {
  const [skal, setSkal] = useState<string | null>(null);
  const [upptagen, setUpptagen] = useState(false);
  async function sand(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const villkor = new FormData(e.currentTarget).get("villkor");
    if (villkor !== VILLKOR_FORETAG_VERSION) return setSkal("Godkänn villkoren för att fortsätta.");
    setUpptagen(true);
    const svar = await skicka("/api/konto/foretag", { steg: "villkor", villkor });
    setUpptagen(false);
    if (svar.ok) return efter();
    setSkal(SKAL[svar.skal ?? ""] ?? SKAL.tillfalligt);
  }
  return (
    <form className={s.foretagForm} onSubmit={sand}>
      <label className={s.kryss}>
        <input type="checkbox" name="villkor" value={VILLKOR_FORETAG_VERSION} />
        <span>
          Jag godkänner{" "}
          <a href="/villkor/foretag" target="_blank" rel="noopener">
            villkoren för företagskonto
          </a>{" "}
          (version {VILLKOR_FORETAG_VERSION}).
        </span>
      </label>
      <button type="submit" className={`btn btn-primary ${s.knapp}`} disabled={upptagen}>
        Godkänn
      </button>
      {skal && (
        <p className={s.fel} role="alert">
          {skal}
        </p>
      )}
    </form>
  );
}

function Profilval({ namn, aktiv }: { namn: string; aktiv: "privat" | "foretag" }) {
  const [upptagen, setUpptagen] = useState(false);
  const [skal, setSkal] = useState<string | null>(null);
  async function byt(till: "privat" | "foretag") {
    if (till === aktiv || upptagen) return;
    setUpptagen(true);
    const svar = await skicka("/api/konto/profil", { profil: till });
    if (svar.ok) {
      window.location.reload();
      return;
    }
    setUpptagen(false);
    setSkal(SKAL[svar.skal ?? ""] ?? SKAL.tillfalligt);
  }
  return (
    <div>
      <p className={s.etikett} id="du-handlar-som">
        Du handlar som
      </p>
      <div className={s.profilval} role="radiogroup" aria-labelledby="du-handlar-som">
        <button type="button" role="radio" aria-checked={aktiv === "privat"} className={s.profilknapp} disabled={upptagen} onClick={() => byt("privat")}>
          Privatperson
          <small>Priser inkl. moms</small>
        </button>
        <button type="button" role="radio" aria-checked={aktiv === "foretag"} className={s.profilknapp} disabled={upptagen} onClick={() => byt("foretag")}>
          {namn}
          <small>Priser exkl. moms och ordertrappan</small>
        </button>
      </div>
      {skal && (
        <p className={s.fel} role="alert">
          {skal}
        </p>
      )}
    </div>
  );
}

function Offerter({ offerter }: { offerter: OffertPaMinaSidor[] }) {
  if (offerter.length === 0) {
    return <p className={s.liten}>Offert begär du i varukorgen när den har minst 6 exemplar av samma vara eller 20 000 kr exkl. moms.</p>;
  }
  return (
    <>
      <p className={s.etikett} style={{ marginTop: 18 }}>
        Offerter
      </p>
      <ul className={s.offertLista}>
        {offerter.map((o) => (
          <li key={o.id}>
            <span>
              {o.datum} · {o.status}
            </span>
            {o.visa ? <a href={`/offert/${o.id}`}>Se offerten</a> : null}
          </li>
        ))}
      </ul>
    </>
  );
}

export function Foretagskonto({
  foretag,
  aktivProfil,
  offerter = [],
}: {
  foretag: ForetagVy | null;
  aktivProfil: "privat" | "foretag";
  offerter?: OffertPaMinaSidor[];
}) {
  const [oppen, setOppen] = useState(false);
  const [skickad, setSkickad] = useState(false);
  const ladda = () => window.location.reload();

  return (
    <section className={`${s.kort} ${s.foretag}`} id="foretag" aria-labelledby="foretag-rubrik">
      <h2 className={s.underrubrik} id="foretag-rubrik">
        Företagskonto
      </h2>
      {skickad ? (
        <p className={s.info} role="status">
          Tack! Vi kontrollerar uppgifterna och mejlar dig när företaget är godkänt, oftast inom en arbetsdag.
        </p>
      ) : !foretag || (foretag.status === "nekad" && oppen) ? (
        <>
          {foretag?.status === "nekad" && <p className={s.info}>{foretag.statustext}</p>}
          <p className={s.info}>
            Handlar du i ett företag? Lägg till företaget på ditt konto. Då ser du priserna exklusive moms och får den högsta
            av din medlemsnivå och ordertrappan, från 1{"\u00a0"}% vid 5{"\u00a0"}000{"\u00a0"}kr till 5{"\u00a0"}% vid 50{"\u00a0"}000{"\u00a0"}kr
            exklusive moms.
          </p>
          {oppen ? (
            <Ansokan efter={() => setSkickad(true)} />
          ) : (
            <button type="button" className={s.utknapp} onClick={() => setOppen(true)}>
              Lägg till ett företag
            </button>
          )}
        </>
      ) : (
        <>
          <dl className={s.foretagFakta}>
            <div>
              <dt>Företag</dt>
              <dd>{foretag.namn}</dd>
            </div>
            <div>
              <dt>Organisationsnummer</dt>
              <dd>{foretag.orgnrVisas}</dd>
            </div>
            <div>
              <dt>Fakturaadress</dt>
              <dd>
                {foretag.faktura.gata}, {postnrText(foretag.faktura.postnr)} {foretag.faktura.ort}
              </dd>
            </div>
            {foretag.leverans && (
              <div>
                <dt>Leveransadress</dt>
                <dd>
                  {foretag.leverans.gata}, {postnrText(foretag.leverans.postnr)} {foretag.leverans.ort}
                </dd>
              </div>
            )}
          </dl>
          <p className={s.info} role="status">
            {foretag.statustext}
          </p>
          {foretag.status === "aktiv" && !foretag.villkorAktuellt && <Villkor efter={ladda} />}
          {foretag.status === "aktiv" && foretag.villkorAktuellt && <Profilval namn={foretag.namn} aktiv={aktivProfil} />}
          {foretag.status === "aktiv" && foretag.villkorAktuellt && <Offerter offerter={offerter} />}
          {foretag.status === "nekad" && (
            <button type="button" className={s.utknapp} onClick={() => setOppen(true)}>
              Skicka en ny ansökan
            </button>
          )}
        </>
      )}
    </section>
  );
}
