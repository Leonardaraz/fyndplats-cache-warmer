"use client";

// components/heylink-klick.tsx
//
// Fångar Heylinks klick-id (?hltid=…) när någon landar från GoWish
// (Leonard 2026-11-25). Vad Heylinks skript gör, och varför det inte används,
// står i lib/heylink.ts.
//
// - Id:t läses EN gång, när sidan laddas: det är bara landningen som bär det.
// - Utan samtycke till alla cookies sparas ingenting. Id:t finns då bara i
//   modulens minne, så länge fliken lever, och sparas om besökaren samtycker
//   senare under besöket.
// - Med samtycke sparas id:t i localStorage (HEYLINK_NYCKEL) med tiden, och
//   gäller i HEYLINK_DAGAR. Ett nytt klick skriver över det gamla.
// - Har besökaren INTE samtyckt tas ett sparat klick bort, och ordernumret som
//   tacksidans skript kom ihåg till 2026-11-26: de får inte ligga kvar efter
//   att någon bytt till "bara nödvändiga".
//
// Inget hämtas från Heylink här, och inget skickas dit. Kassan lägger klicket
// på betalningen, och servern lämnar köpet (lib/heylink-s2s.ts).
import { useEffect } from "react";
import { hasMarketingConsent } from "../lib/consent";
import { useMarketingConsent } from "../lib/use-marketing-consent";
import { HEYLINK_NYCKEL, HEYLINK_SKICKAD, klickIdUrSokdel, nyttMarke } from "../lib/heylink";

/** Klick-id:t från landningen. Lever med fliken och lämnar aldrig webbläsaren härifrån. */
let klick: string | null = null;

export function HeylinkKlick() {
  const samtycke = useMarketingConsent();

  useEffect(() => {
    klick = klickIdUrSokdel(window.location.search) ?? klick;
    if (hasMarketingConsent()) return;
    try {
      window.localStorage.removeItem(HEYLINK_NYCKEL);
      window.localStorage.removeItem(HEYLINK_SKICKAD);
    } catch {
      // lagringen är avstängd: då finns inget att ta bort
    }
  }, []);

  useEffect(() => {
    if (!samtycke || !klick) return;
    try {
      window.localStorage.setItem(HEYLINK_NYCKEL, nyttMarke(klick, Date.now()));
    } catch {
      // utan lagring finns klicket kvar i minnet under besöket
    }
  }, [samtycke]);

  return null;
}
