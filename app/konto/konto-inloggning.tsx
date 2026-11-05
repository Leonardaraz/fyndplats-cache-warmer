"use client";

// Inloggningen på /konto: e-post → kod. Länken i mejlet fungerar också, på
// den enhet där mejlet öppnas (via /api/konto/lank).

import { useEffect, useRef, useState } from "react";
import { feltext } from "./fel";
import { mejltjanst } from "@/lib/medlem/mejltjanst";
import s from "./konto.module.css";

type Steg = "epost" | "kod";

export function KontoInloggning({ order, mal, fel }: { order?: string; mal?: string; fel?: string | null }) {
  const [steg, setSteg] = useState<Steg>("epost");
  const [epost, setEpost] = useState("");
  const [kod, setKod] = useState("");
  const [meddelande, setMeddelande] = useState<string | null>(feltext(fel));
  const [upptagen, setUpptagen] = useState(false);
  const [vantaTill, setVantaTill] = useState(0);
  const [nu, setNu] = useState(() => Date.now());
  const kodFalt = useRef<HTMLInputElement>(null);
  // Den kod som senast skickades av sig själv: samma sex siffror skickas inte två gånger.
  const autoSkickad = useRef("");

  useEffect(() => {
    if (vantaTill <= Date.now()) return;
    const t = setInterval(() => setNu(Date.now()), 1000);
    return () => clearInterval(t);
  }, [vantaTill]);

  useEffect(() => {
    if (steg === "kod") kodFalt.current?.focus();
  }, [steg]);

  async function begarKod(e?: React.FormEvent) {
    e?.preventDefault();
    setUpptagen(true);
    setMeddelande(null);
    try {
      const r = await fetch("/api/konto/kod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epost, order, mal }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; fel?: string };
      if (j.ok) {
        setSteg("kod");
        setKod("");
        autoSkickad.current = "";
        setVantaTill(Date.now() + 30_000);
        setNu(Date.now());
      } else setMeddelande(feltext(j.fel ?? "tillfalligt"));
    } catch {
      setMeddelande(feltext("tillfalligt"));
    } finally {
      setUpptagen(false);
    }
  }

  async function loggaIn(e?: React.FormEvent, kodNu?: string) {
    e?.preventDefault();
    setUpptagen(true);
    setMeddelande(null);
    try {
      const r = await fetch("/api/konto/in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epost, kod: kodNu ?? kod }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; fel?: string; mal?: string };
      if (j.ok) {
        window.location.assign(j.mal || "/konto");
        return;
      }
      setMeddelande(feltext(j.fel ?? "tillfalligt"));
    } catch {
      setMeddelande(feltext("tillfalligt"));
    }
    setUpptagen(false);
  }

  const kvar = Math.max(0, Math.ceil((vantaTill - nu) / 1000));
  const tjanst = mejltjanst(epost);

  /** Sex siffror är en hel kod: logga in direkt, utan att kunden trycker. */
  function nyKod(v: string) {
    setKod(v);
    const siffror = v.replace(/\D/g, "");
    if (siffror.length === 6 && !upptagen && autoSkickad.current !== siffror) {
      autoSkickad.current = siffror;
      void loggaIn(undefined, siffror);
    }
  }

  return (
    <div className={s.inloggning}>
      {steg === "epost" ? (
        <form onSubmit={begarKod} className={s.formular}>
          <label htmlFor="konto-epost" className={s.etikett}>
            E-post
          </label>
          <input
            id="konto-epost"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={epost}
            onChange={(e) => setEpost(e.target.value)}
            className={s.falt}
            placeholder="namn@exempel.se"
          />
          <button type="submit" className={`btn btn-primary ${s.knapp}`} disabled={upptagen}>
            {upptagen ? "Skickar…" : "Skicka kod"}
          </button>
        </form>
      ) : (
        <form onSubmit={loggaIn} className={s.formular}>
          <p className={s.info}>
            Vi har mejlat en kod till <strong>{epost}</strong>. Skriv in den här, eller tryck på länken i mejlet. Koden
            gäller i 15 minuter. Hittar du inte mejlet, titta i skräpposten.
          </p>
          {tjanst ? (
            <a className={s.mejltjanst} href={tjanst.url} target="_blank" rel="noopener noreferrer">
              Öppna {tjanst.namn}
            </a>
          ) : null}
          <label htmlFor="konto-kod" className={s.etikett}>
            Kod
          </label>
          <input
            id="konto-kod"
            ref={kodFalt}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 \-]*"
            maxLength={7}
            required
            value={kod}
            onChange={(e) => nyKod(e.target.value)}
            className={`${s.falt} ${s.kodfalt}`}
            placeholder="123456"
          />
          <button type="submit" className={`btn btn-primary ${s.knapp}`} disabled={upptagen}>
            {upptagen ? "Loggar in…" : "Logga in"}
          </button>
          <div className={s.alternativ}>
            <button type="button" className={s.textknapp} onClick={() => begarKod()} disabled={upptagen || kvar > 0}>
              {kvar > 0 ? `Skicka ny kod (${kvar} s)` : "Skicka ny kod"}
            </button>
            <button
              type="button"
              className={s.textknapp}
              onClick={() => {
                setSteg("epost");
                setMeddelande(null);
              }}
            >
              Byt e-post
            </button>
          </div>
        </form>
      )}
      {meddelande ? (
        <p className={s.fel} role="alert">
          {meddelande}
        </p>
      ) : null}
    </div>
  );
}
