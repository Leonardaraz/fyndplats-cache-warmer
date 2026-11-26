"use client";

// components/heylink-glom.tsx
//
// Tacksidan glömmer klicket från GoWish när köpet är gjort (Leonard 2026-11-26).
//
// Köpet lämnas till Heylink från servern (lib/heylink-s2s.ts), med klick-id:t
// som kassan lade på betalningen. Heylinks skript hämtas inte: GoWish skrev
// 2026-11-26 "If you have the server-to-server implementation active, the
// script isn't necessary at all", och att skriptet som reserv bara fungerar om
// det ligger på alla sidor. Tacksidans skript (2026-11-25 till 2026-11-26) är
// därför borttaget.
//
// Ett klick ger ett köp, som förut: när servern gav en order (bara med samtycke
// i kakan och bara i produktion, app/tack/page.tsx) tas det sparade klicket
// bort, så att nästa köp utan ett nytt klick från GoWish inte bär klick-id:t.
// Inget hämtas och inget skickas härifrån.
import { useEffect } from "react";
import { HEYLINK_NYCKEL } from "../lib/heylink";

export function HeylinkGlomKlick({ glom }: { glom: boolean }) {
  useEffect(() => {
    if (!glom) return;
    try {
      window.localStorage.removeItem(HEYLINK_NYCKEL);
    } catch {
      // lagringen är avstängd: då finns inget att glömma
    }
  }, [glom]);

  return null;
}
