"use client";
// Medlemspriset i webbläsaren (medlemskapet E2).
//
// Produktsidan och varukorgen är desamma för alla besökare och cachas. Priset
// för en inloggad medlem hämtas därför här, efter laddningen, från
// /api/medlem/priser (privat, ingen cache). Utan inloggning görs inget anrop:
// tecknet `fp_medlem_inne` säger att det finns en session att fråga om.
//
// Rutan säger "Ditt medlemspris" med nivå (E2-3), eller att varan inte
// omfattas (E2-4). Rutan har nivåns färg, samma metall som medlemskortet:
// guld för guld, silver för silver (Leonard 2026-11-04).
//
// [P8] Som de stora kedjorna (Leonard 2026-11-05: "härma"): när det tidigare
// priset går att belägga står det under medlemspriset, överstruket och med
// Konsumentverkets uttryck framför, samma komponent som rean. Procenten står
// bara när det tidigare priset är listpriset (lib/medlem/jamforelse.ts). En
// reavara får inget medlemspris ovanpå (2.1), och rutan säger varför.

import { useEffect, useState } from "react";
import { TidigarePris } from "./tidigare-pris";
import { kronorText } from "../lib/medlem/kronor";
import { nivaNyckel } from "../lib/medlem/niva-nyckel";

type Begransning = "ingen" | "golv" | "ej-berattigad" | "fri-frakt" | "ingen-rabatt";
type Variant = {
  variantId: string;
  aOre: number;
  pOre: number;
  procent: number;
  begransning: Begransning;
  hogstaProcent?: number;
  /** Varför varianten inte får medlemspris, när kunden ska få veta det. */
  orsak?: "rea";
  /** Det belagda tidigare priset i öre (lägsta de senaste 30 dagarna). */
  tidigareOre?: number;
  /** Får nivåns procent stå? Bara när det tidigare priset är listpriset. */
  visaProcent?: boolean;
  /** E3: företagets belopp exkl. moms. */
  aOreExMoms?: number;
  pOreExMoms?: number;
};
type Trappsteg = { franOreExMoms: number; procent: number };
type Svar =
  | {
      medlemspris: true;
      niva: string;
      procent: number;
      profil?: "privat" | "foretag";
      foretag?: string;
      trappa?: Trappsteg[];
      varianter: Variant[];
    }
  | { medlemspris: false };

/** Tecknets värde: "1" privat, "f" företag (lib/medlem/session.ts). */
function tecken(): string | null {
  if (typeof document === "undefined") return null;
  for (const c of document.cookie.split(";")) {
    const [k, v] = c.trim().split("=");
    if (k === "fp_medlem_inne") return v ?? "";
  }
  return null;
}

/** Finns en inloggning att fråga om? Sessionen själv är httpOnly. */
export function harMedlemstecken(): boolean {
  const t = tecken();
  return t === "1" || t === "f";
}

/** Handlar kontot som sitt företag (E3)? Bara en ledtråd till sidan; priset kommer från servern. */
export function foretagstecken(): boolean {
  return tecken() === "f";
}

/** Ordertrappan som en liten tabell (specen, "Företagsportal"). */
export function Ordertrappa({ trappa, hogsta }: { trappa: Trappsteg[]; hogsta?: number }) {
  return (
    <details className="foretagstrappa">
      <summary>Ordertrappan på hela ordern{hogsta !== undefined ? ` · högst ${hogsta} % på den här varan` : ""}</summary>
      <table>
        <tbody>
          {trappa.map((t) => (
            <tr key={t.procent}>
              <td>från {kronorText(t.franOreExMoms)} exkl. moms</td>
              <td>{t.procent} %</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Du får den högsta av din medlemsnivå och ordertrappan, aldrig båda. Kassan visar priserna inkl. moms.</p>
    </details>
  );
}

export function Medlemspris({ produktId, variantId }: { produktId: string; variantId?: string | null }) {
  const [svar, setSvar] = useState<Svar | null>(null);

  useEffect(() => {
    if (!produktId || !harMedlemstecken()) return;
    const avbryt = new AbortController();
    fetch(`/api/medlem/priser?p=${encodeURIComponent(produktId)}`, { credentials: "same-origin", signal: avbryt.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: Svar | null) => {
        if (s) setSvar(s);
      })
      .catch(() => {});
    return () => avbryt.abort();
  }, [produktId]);

  if (!svar || !svar.medlemspris) return null;
  const v =
    svar.varianter.find((x) => x.variantId === variantId) ?? (svar.varianter.length === 1 ? svar.varianter[0] : null);
  if (!v) return null;

  // 2.1: rean först, för både privatpersoner och företag.
  if (v.orsak === "rea") {
    return (
      <p className="medlemspris-utan" role="status">
        {svar.profil === "foretag"
          ? "Varan är redan på rea. Företagsrabatten läggs inte ovanpå reapriset."
          : "Varan är redan på rea. Medlemspriset läggs inte ovanpå reapriset."}
      </p>
    );
  }

  // E3: företaget ser priset exkl. moms, märkt vid priset (E3-4), och trappan.
  if (svar.profil === "foretag" && v.aOreExMoms !== undefined && v.pOreExMoms !== undefined) {
    const utan = v.begransning === "ej-berattigad" || (v.begransning === "golv" && v.pOre >= v.aOre);
    const rabatt = !utan && v.pOre < v.aOre;
    return (
      <div className="medlemspris-foretag">
        <div className="medlemspris" data-niva={nivaNyckel(svar.niva)} role="status">
          <span className="medlemspris-etikett">{rabatt ? "Ditt företagspris" : "Pris för företaget"}</span>
          <span className="medlemspris-belopp">
            {kronorText(rabatt ? v.pOreExMoms : v.aOreExMoms)} <small>exkl. moms</small>
          </span>
          <span className="medlemspris-niva">
            {rabatt ? `${svar.niva} · ${v.begransning === "golv" && v.hogstaProcent !== undefined ? `högst ${v.hogstaProcent}` : v.procent} %` : "Företag"}
          </span>
        </div>
        {utan ? (
          <p className="medlemspris-utan">Den här varan omfattas inte av företagsrabatterna.</p>
        ) : svar.trappa?.length ? (
          <Ordertrappa trappa={svar.trappa} hogsta={v.hogstaProcent} />
        ) : null}
        {svar.foretag ? <p className="medlemspris-som">Du handlar som {svar.foretag}.</p> : null}
      </div>
    );
  }

  if (v.begransning === "ej-berattigad" || (v.begransning === "golv" && v.pOre >= v.aOre)) {
    return (
      <p className="medlemspris-utan" role="status">
        Den här varan omfattas inte av medlemspriset.
      </p>
    );
  }
  if (v.pOre >= v.aOre) return null;

  return (
    <div className="medlemspris" data-niva={nivaNyckel(svar.niva)} role="status">
      <span className="medlemspris-etikett">Ditt medlemspris</span>
      {/* Med ören: samma tal som kassan (specen, avrundning). */}
      <span className="medlemspris-belopp">{kronorText(v.pOre)}</span>
      <span className="medlemspris-niva">
        {svar.niva}
        {v.visaProcent
          ? ` · ${v.begransning === "golv" && v.hogstaProcent !== undefined ? `högst ${v.hogstaProcent} %` : `${v.procent} %`}`
          : ""}
      </span>
      {v.tidigareOre !== undefined ? (
        <TidigarePris belopp={kronorText(v.tidigareOre)} className="medlemspris-tidigare" />
      ) : null}
    </div>
  );
}

type Kassasvar = { ok: true; adress: string } | { ok: false; skal?: string };

/**
 * Kassans adress för en medlem, eller null: då används den vanliga kassan.
 * Väntar högst 15 sekunder; ett köp får aldrig fastna här.
 */
export async function medlemskassa(cartId: string): Promise<string | null> {
  if (!cartId || !harMedlemstecken()) return null;
  try {
    const r = await fetch("/api/medlem/kassa", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cartId }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return null;
    const s = (await r.json()) as Kassasvar;
    return s.ok && typeof s.adress === "string" ? s.adress : null;
  } catch {
    return null;
  }
}

/** Varukorgens summor med medlemspris (/api/medlem/korg). */
export type Korgpris = {
  niva: string;
  procent: number;
  summaAOre: number;
  summaPOre: number;
  rabattOre: number;
  friFraktSkydd: boolean;
  /** E3: när kontot handlar som företaget. */
  foretag?: {
    namn: string;
    kalla: "niva" | "trappa" | "ingen";
    trappaProcent: number;
    basOreExMoms: number;
    summaPOreExMoms: number;
    nastaSteg: { procent: number; kvarOreExMoms: number; kvarOreInklMoms: number } | null;
    offert: boolean;
    rader: { id: string; pOre: number; pOreExMoms: number; procent: number; begransning: Begransning }[];
  };
};

/**
 * Medlemspriset för varukorgen, till lådans summor. `nyckel` beskriver raderna
 * och antalen: ändras den hämtas summorna igen, och ett svar för en äldre
 * nyckel visas aldrig. Utan inloggning, eller när lådan är stängd, görs inget
 * anrop och lådan visar listpriset som förut.
 */
export function useMedlemskorg(cartId: string, nyckel: string, aktiv: boolean): Korgpris | null {
  const [svar, setSvar] = useState<{ nyckel: string; pris: Korgpris } | null>(null);
  useEffect(() => {
    if (!aktiv || !cartId || !harMedlemstecken()) return;
    const avbryt = new AbortController();
    fetch(`/api/medlem/korg?c=${encodeURIComponent(cartId)}`, { credentials: "same-origin", signal: avbryt.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: ({ medlemspris: true } & Korgpris) | { medlemspris: false } | null) => {
        setSvar(s && s.medlemspris ? { nyckel, pris: s } : null);
      })
      .catch(() => {});
    return () => avbryt.abort();
  }, [cartId, nyckel, aktiv]);
  return aktiv && svar && svar.nyckel === nyckel ? svar.pris : null;
}
