"use client";
// "Betala mot förskottsfaktura" i varukorgen (medlemskapet E3, villkoren 5.1,
// Leonards svar 3.3). Visas bara när servern prissätter korgen som ett
// godkänt företag. Ett tryck visar villkoret först; servern läser korgen
// själv, skapar ordern obetald och tar bort varukorgen
// (/api/medlem/forskott). Kortet och Klarna i kassan finns alltid kvar.

import { useState } from "react";

const SKAL: Record<string, string> = {
  pagar: "Ordern är redan lagd. Fakturan kommer med e-post; hör av dig om den inte kommer.",
  upptaget: "Det går inte att lägga en förskottsorder just nu. Försök igen om en stund, eller betala med kort eller Klarna i kassan.",
  "inte-foretag": "Förskottsfaktura gäller när du handlar som ditt godkända företag. Välj det på Mina sidor.",
  "ej-forskott": "Ett presentkort eller en tjänst kan inte köpas mot förskottsfaktura. Ta bort det ur varukorgen, eller betala i kassan.",
  utloggad: "Du har loggats ut. Logga in igen.",
};
const ANNARS = "Ordern kunde inte läggas just nu. Försök igen, eller betala med kort eller Klarna i kassan.";

export type ForskottLagd = { nummer: string; totalOre: number };
type Svar = ({ ok: true } & ForskottLagd) | { ok: false; skal?: string };

/** `onLagd`: ordern finns och varukorgen är borttagen; lådan visar kvittensen. */
export function ForskottKnapp({ cartId, onLagd }: { cartId: string; onLagd: (lagd: ForskottLagd) => void }) {
  const [oppen, setOppen] = useState(false);
  const [upptagen, setUpptagen] = useState(false);
  const [fel, setFel] = useState<string | null>(null);

  async function laggOrder() {
    setUpptagen(true);
    setFel(null);
    try {
      const r = await fetch("/api/medlem/forskott", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cartId }),
        signal: AbortSignal.timeout(30_000),
      });
      const s = (await r.json().catch(() => null)) as Svar | null;
      if (s?.ok) {
        onLagd({ nummer: s.nummer, totalOre: s.totalOre });
      } else {
        setFel(SKAL[(s && !s.ok && s.skal) || ""] ?? ANNARS);
      }
    } catch {
      setFel(ANNARS);
    }
    setUpptagen(false);
  }

  if (!oppen) {
    return (
      <button type="button" className="drawer-offert-knapp" onClick={() => setOppen(true)}>
        Betala mot förskottsfaktura
      </button>
    );
  }
  return (
    <div className="drawer-offert">
      <p className="drawer-forskott-villkor">
        Vi lägger ordern med företagets priser och mejlar en förskottsfaktura. Den betalas inom 10 dagar, och vi skickar
        varorna när betalningen har kommit in. Villkoren står i <a href="/villkor/foretag">villkoren för företagskonto</a>.
      </p>
      <button type="button" className="drawer-offert-knapp" onClick={laggOrder} disabled={upptagen} aria-busy={upptagen}>
        {upptagen ? "Lägger ordern …" : "Lägg ordern mot förskottsfaktura"}
      </button>
      {!upptagen && (
        <button type="button" className="drawer-forskott-avbryt" onClick={() => setOppen(false)}>
          Avbryt
        </button>
      )}
      {fel && (
        <p className="drawer-offert-fel" role="alert">
          {fel}
        </p>
      )}
    </div>
  );
}
