"use client";
// "Mitt konto" i sidhuvudet och i mobilmenyn (lib/medlem/kontolank.ts).
//
// Syns först när /api/konto/lage säger att kontot är öppet för alla (läget
// `pa`). Frågan görs en gång per sidladdning och delas av sidhuvudet och
// menyn. Svarar den inte syns ingen länk: hellre ingen länk än en till en
// stängd dörr.
//
// På mobilen ligger länken i menyn, inte i sidhuvudet: raden rymmer loggan,
// hjärtat, kundvagnen och menyknappen ned till 339 px, och en ikon till hade
// skjutit menyknappen utanför skärmen (se .hrow i app/globals.css).

import { useEffect, useState } from "react";

let fragan: Promise<boolean> | null = null;

function kontoOppet(): Promise<boolean> {
  fragan ??= fetch("/api/konto/lage")
    .then((r) => (r.ok ? r.json() : null))
    .then((s: { pa?: unknown } | null) => s?.pa === true)
    .catch(() => false);
  return fragan;
}

export function useKontolank(): boolean {
  const [synlig, setSynlig] = useState(false);
  useEffect(() => {
    let aktiv = true;
    kontoOppet().then((v) => {
      if (aktiv) setSynlig(v);
    });
    return () => {
      aktiv = false;
    };
  }, []);
  return synlig;
}

export function KontoLank() {
  const synlig = useKontolank();
  if (!synlig) return null;
  return (
    <a className="konto-btn" href="/konto" aria-label="Mitt konto" title="Mitt konto">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </a>
  );
}
