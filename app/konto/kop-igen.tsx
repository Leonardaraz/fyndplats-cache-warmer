"use client";
// "Köp igen" på en order på Mina sidor (medlemskapet E3). Servern säger vilka
// av orderns varor som går att köpa nu (/api/konto/kop-igen); de läggs i
// varukorgen i ett anrop, och lådan öppnas med dem. Det som är slut eller
// inte längre säljs står under knappen (lib/medlem/kop-igen.ts).

import { useState } from "react";
import { useCart } from "@/components/cart";
import { kopIgenBesked, type KopIgenRad } from "@/lib/medlem/kop-igen";
import s from "./konto.module.css";

type Svar = ({ ok: true; rader: KopIgenRad[]; slut: number; borta: number }) | { ok: false; skal?: string };

const INTE_NU = "Det gick inte just nu. Försök igen om en stund.";

export function KopIgen({ ordernummer }: { ordernummer: string }) {
  const { addMany, busy } = useCart();
  const [hamtar, setHamtar] = useState(false);
  const [besked, setBesked] = useState<string | null>(null);

  async function kop() {
    setHamtar(true);
    setBesked(null);
    try {
      const r = await fetch("/api/konto/kop-igen", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ordernummer }),
        signal: AbortSignal.timeout(20_000),
      });
      const svar = (await r.json().catch(() => null)) as Svar | null;
      if (!svar?.ok) {
        setBesked(svar && !svar.ok && svar.skal === "utloggad" ? "Du har loggats ut. Logga in igen." : INTE_NU);
        return;
      }
      if (svar.rader.length > 0) {
        const ok = await addMany(svar.rader.map((x) => ({ id: x.produktId, variantId: x.variantId, antal: x.antal })));
        // Ett fel i varukorgen står i lådan, som när en vara läggs i från produktsidan.
        if (!ok) return;
      }
      setBesked(kopIgenBesked(svar.rader.length, svar.slut, svar.borta));
    } catch {
      setBesked(INTE_NU);
    } finally {
      setHamtar(false);
    }
  }

  return (
    <>
      <button type="button" className={s.kopIgen} onClick={kop} disabled={hamtar || busy} aria-busy={hamtar}>
        {hamtar ? "Lägger i varukorgen …" : "Köp igen"}
      </button>
      {besked ? (
        <p className={s.kopIgenBesked} role="status">
          {besked}
        </p>
      ) : null}
    </>
  );
}
