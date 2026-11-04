"use client";
// Medlemspriset i webbläsaren (medlemskapet E2).
//
// Produktsidan och varukorgen är desamma för alla besökare och cachas. Priset
// för en inloggad medlem hämtas därför här, efter laddningen, från
// /api/medlem/priser (privat, ingen cache). Utan inloggning görs inget anrop:
// tecknet `fp_medlem_inne` säger att det finns en session att fråga om.
//
// [P8] Listpriset stryks inte över. Rutan säger "Ditt medlemspris" med nivå
// och procent (E2-3), eller att varan inte omfattas (E2-4).

import { useEffect, useState } from "react";
import { formatPrice } from "../lib/price-range";

type Variant = {
  variantId: string;
  aOre: number;
  pOre: number;
  procent: number;
  begransning: "ingen" | "golv" | "ej-berattigad" | "fri-frakt" | "ingen-rabatt";
  hogstaProcent?: number;
};
type Svar = { medlemspris: true; niva: string; procent: number; varianter: Variant[] } | { medlemspris: false };

/** Finns en inloggning att fråga om? Sessionen själv är httpOnly. */
export function harMedlemstecken(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim() === "fp_medlem_inne=1");
}

const kronor = (ore: number) => formatPrice(ore / 100);

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

  if (v.begransning === "ej-berattigad" || (v.begransning === "golv" && v.pOre >= v.aOre)) {
    return (
      <p className="medlemspris medlemspris-utan" role="status">
        Den här varan omfattas inte av medlemspriset.
      </p>
    );
  }
  if (v.pOre >= v.aOre) return null;

  return (
    <div className="medlemspris" role="status">
      <span className="medlemspris-etikett">Ditt medlemspris</span>
      <span className="medlemspris-belopp">{kronor(v.pOre)}</span>
      <span className="medlemspris-niva">
        {svar.niva} · {v.begransning === "golv" && v.hogstaProcent !== undefined ? `högst ${v.hogstaProcent} %` : `${v.procent} %`}
      </span>
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
