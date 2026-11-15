"use client";
// "Du handlar som …" överst på Mina sidor (E3). Raden följer tecknet
// `fp_medlem_inne` och händelsen `fp-konto-andrat`, precis som remsan överst
// (components/profil-remsa.tsx), så att profilbytet syns direkt utan att sidan
// hämtas om (app/konto/foretag.tsx, Profilval). Servern skickar företagets namn
// bara när kontot får handla som företaget (godkänt och gällande villkor);
// utan namn visas ingenting, vad tecknet än säger.

import { useSyncExternalStore } from "react";
import { foretagstecken } from "@/components/medlemspris";
import s from "./konto.module.css";

const prenumerera = (andrat: () => void) => {
  window.addEventListener("fp-konto-andrat", andrat);
  return () => window.removeEventListener("fp-konto-andrat", andrat);
};

/** `foretagNu`: serverns besked när sidan ritades, så att första ritningen är densamma på servern och i webbläsaren. */
export function HandlarSom({ namn, foretagNu }: { namn: string | null; foretagNu: boolean }) {
  const foretag = useSyncExternalStore(prenumerera, foretagstecken, () => foretagNu);
  if (!namn || !foretag) return null;
  return (
    <p className={s.handlarSom}>
      Du handlar som <a href="#foretag">{namn}</a>
    </p>
  );
}
