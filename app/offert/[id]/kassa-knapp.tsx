"use client";
// "Till kassan" för en offert: servern bygger den låsta korgen med offertens
// priser (/api/medlem/offert/kassa) och svarar med Wix-kassans adress.

import { useState } from "react";

const SKAL: Record<string, string> = {
  "inte-giltig": "Offerten gäller inte längre. Begär en ny från varukorgen.",
  "inte-foretag": "Välj att handla som företaget på Mina sidor och försök igen.",
  utloggad: "Du har loggats ut. Logga in igen.",
};

export function OffertKassaKnapp({ id, klass }: { id: string; klass: string }) {
  const [upptagen, setUpptagen] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  async function tillKassan() {
    setUpptagen(true);
    setFel(null);
    try {
      const r = await fetch("/api/medlem/offert/kassa", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(20_000),
      });
      const s = (await r.json().catch(() => null)) as { ok?: boolean; adress?: string; skal?: string } | null;
      if (s?.ok && typeof s.adress === "string") {
        window.location.href = s.adress;
        return;
      }
      setFel(SKAL[s?.skal ?? ""] ?? "Kassan gick inte att öppna just nu. Försök igen om en stund.");
    } catch {
      setFel("Kassan gick inte att öppna just nu. Försök igen om en stund.");
    }
    setUpptagen(false);
  }
  return (
    <>
      <button type="button" className={klass} onClick={tillKassan} disabled={upptagen} aria-busy={upptagen}>
        {upptagen ? "Öppnar kassan …" : "Till kassan →"}
      </button>
      {fel && (
        <p role="alert" style={{ color: "#8a1c10", marginTop: 10 }}>
          {fel}
        </p>
      )}
    </>
  );
}
