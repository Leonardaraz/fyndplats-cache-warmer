"use client";
// "Bli medlem" / "Mitt konto" i sidhuvudet, överst i mobilmenyn och i
// sidfoten (lib/medlem/kontolank.ts).
//
// Syns först när /api/konto/lage säger att kontot är öppet för alla (läget
// `pa`). Frågan görs en gång per sidladdning och delas av sidhuvudet, menyn och
// sidfoten. Svarar den inte syns ingen länk: hellre ingen länk än en till en
// stängd dörr.
//
// Texten följer tecknet `fp_medlem_inne` (kontolankText): utan tecken "Bli
// medlem", med tecken "Mitt konto". Datorn visar ikonen och texten; mobilen
// visar ikonen i sidhuvudet (raden rymmer den ned till 320 px, se .hrow i
// app/globals.css) och texten överst i menyn.

import { useEffect, useState } from "react";
import { kontolankText } from "../lib/medlem/kontolank";

let fragan: Promise<boolean> | null = null;

function kontoOppet(): Promise<boolean> {
  fragan ??= fetch("/api/konto/lage")
    .then((r) => (r.ok ? r.json() : null))
    .then((s: { pa?: unknown } | null) => s?.pa === true)
    .catch(() => false);
  return fragan;
}

/** Tecknet `fp_medlem_inne`: "1" privat, "f" företag, annars ingen inloggning. */
function tecken(): string | null {
  if (typeof document === "undefined") return null;
  for (const c of document.cookie.split(";")) {
    const [k, v] = c.trim().split("=");
    if (k === "fp_medlem_inne") return v ?? "";
  }
  return null;
}

/** `synlig` är null tills /api/konto/lage svarat. */
export type Kontolank = { synlig: boolean | null; text: "Bli medlem" | "Mitt konto"; inne: boolean };

export function useKontolank(): Kontolank {
  const [l, setL] = useState<Kontolank>({ synlig: null, text: "Bli medlem", inne: false });
  useEffect(() => {
    let aktiv = true;
    kontoOppet().then((v) => {
      if (!aktiv) return;
      const text = kontolankText(tecken());
      setL({ synlig: v, text, inne: text === "Mitt konto" });
    });
    return () => {
      aktiv = false;
    };
  }, []);
  return l;
}

export function PersonIkon({ storlek = 20 }: { storlek?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={storlek} height={storlek} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/**
 * Sidhuvudet: en mörk knapp "Bli medlem", eller en ljus "Mitt konto" för den
 * inloggade. Platsen hålls från första ritningen, också på servern: medan
 * frågan pågår står knappen osynlig (data-vantar) och tar inga tryck. Förut
 * monterades den först när svaret kom, och i mobilen hoppade hjärtat 89 px åt
 * höger och kundvagnen 8 px (raden byter mellanrum med :has(.konto-btn)),
 * Lighthouse CLS 0,002 (2026-11-08). Bara ett nej tar bort den.
 */
export function KontoLank() {
  const { synlig, text, inne } = useKontolank();
  if (synlig === false) return null;
  const vantar = synlig === null;
  return (
    <a
      className="konto-btn"
      href="/konto"
      aria-label={text}
      title={vantar ? undefined : text}
      data-inne={inne ? "" : undefined}
      data-vantar={vantar ? "" : undefined}
      aria-hidden={vantar ? true : undefined}
      tabIndex={vantar ? -1 : undefined}
    >
      <PersonIkon />
      <span className="konto-btn-text">{text}</span>
    </a>
  );
}

/** Sidfoten, kolumnen Handla. */
export function KontoFotLank() {
  const { synlig, text } = useKontolank();
  if (!synlig) return null;
  return <a href="/konto">{text}</a>;
}
