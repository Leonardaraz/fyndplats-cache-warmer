"use client";
// "Begär offert" i varukorgen (E3-9, F7). Visas bara när servern säger att
// korgen når gränsen för ett godkänt företag (`foretag.offert` i
// förhandsvisningen). Servern läser korgen själv; här skickas bara korgens id
// och ett valfritt meddelande.

import { useState } from "react";

const SKAL: Record<string, string> = {
  "for-manga": "Du har redan tre förfrågningar som väntar på svar. Vi hör av oss.",
  "under-gransen": "Offert gäller från 6 exemplar av samma vara eller 20 000 kr exkl. moms.",
  "inte-foretag": "Välj att handla som företaget på Mina sidor.",
  utloggad: "Du har loggats ut. Logga in igen.",
};

export function OffertForfragan({ cartId }: { cartId: string }) {
  const [oppen, setOppen] = useState(false);
  const [text, setText] = useState("");
  const [upptagen, setUpptagen] = useState(false);
  const [klar, setKlar] = useState(false);
  const [fel, setFel] = useState<string | null>(null);

  async function skicka() {
    setUpptagen(true);
    setFel(null);
    try {
      const r = await fetch("/api/medlem/offert", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cartId, meddelande: text }),
        signal: AbortSignal.timeout(20_000),
      });
      const s = (await r.json().catch(() => null)) as { ok?: boolean; skal?: string } | null;
      if (s?.ok) setKlar(true);
      else setFel(SKAL[s?.skal ?? ""] ?? "Förfrågan gick inte iväg just nu. Försök igen om en stund.");
    } catch {
      setFel("Förfrågan gick inte iväg just nu. Försök igen om en stund.");
    }
    setUpptagen(false);
  }

  if (klar) {
    return (
      <p className="drawer-offert-klar" role="status">
        Tack! Vi svarar inom en arbetsdag. Offerten finns sedan på <a href="/konto#foretag">Mina sidor</a>.
      </p>
    );
  }
  if (!oppen) {
    return (
      <button type="button" className="drawer-offert-knapp" onClick={() => setOppen(true)}>
        Begär offert på korgen
      </button>
    );
  }
  return (
    <div className="drawer-offert">
      <label htmlFor="offert-meddelande">Meddelande till oss (valfritt)</label>
      <textarea
        id="offert-meddelande"
        rows={3}
        maxLength={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Till exempel leveransönskemål eller fler varor du vill ha med"
      />
      <button type="button" className="drawer-offert-knapp" onClick={skicka} disabled={upptagen} aria-busy={upptagen}>
        {upptagen ? "Skickar …" : "Skicka förfrågan"}
      </button>
      {fel && (
        <p className="drawer-offert-fel" role="alert">
          {fel}
        </p>
      )}
    </div>
  );
}
