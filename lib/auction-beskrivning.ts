// lib/auction-beskrivning.ts
//
// Fyndauktionens beskrivning: texten i <meta name="description">, som Google
// visar under länken till /fyndauktion.
//
// ☠️ ANTALET RÄKNAS UR DE FYND SIDAN VISAR, DET SKRIVS ALDRIG IN (Leonard
// 2026-11-21). Texten sa "Fem fynd varje dag" långt efter att motorn gått över
// till tio om dagen (2026-11-04), och Black Week har 50 om dagen och 100 på
// fredagen (motorns lib/auction/antal.ts). Motorns 30-dagarsspärr kan dessutom
// ge färre än dagens tal, och under dagen säljs fynd bort. Ett fast tal i
// texten är därför fel de flesta dagar. Talet kommer i stället ur `fyndlage`
// (lib/auction-day.ts), som räknar samma rader som korten ritas av med samma
// fasmaskin, så att texten och sidan aldrig säger olika saker.
//
// Tre lägen:
//
//   pågår  — minst ett fynd går att köpa till auktionspris just nu:
//            "10 fynd just nu – nya varje dag kl 07–19. …"
//   före   — inget har startat, men nästa omgång ligger ute med nedräkning:
//            "50 fynd startar kl 07 – …"
//   tomt   — inga fynd visas, eller dagen är slut (≥ 19) och korten säger
//            "Stängt": texten nämner inget antal alls.
//
// ☠️ TALET STÅR ALDRIG IHOP MED "VARJE DAG", OCH TEXTEN SÄGER ALDRIG "I MORGON".
// Google sparar sin egen kopia och byter den först vid nästa besök, så texten
// läses ofta ett dygn eller mer efter att den skrevs. "Just nu" och "startar
// kl 07" tål det. "50 fynd varje dag" hade blivit ett löfte, och "i morgon"
// hade pekat på fel dag redan nästa förmiddag.
//
// LÖVMODUL: inga sido-importer (typen nedan försvinner vid körning), så
// `node --test` kan ladda den.

import type { Fyndlage } from "./auction-day";

const UPPMANING = "Vänta för ett bättre pris, eller köp innan någon hinner före.";

/** Texten utan antal. Sann varje dag, oavsett hur många fynd dagen har. */
export const BESKRIVNING_UTAN_ANTAL =
  "Nya fynd varje dag kl 07–19. Priset sjunker varje timme tills någon slår till – "
  + "vänta för ett bättre pris, eller köp innan någon hinner före.";

/** Beskrivningen för /fyndauktion i ett givet läge (se `fyndlage`). */
export function auktionsbeskrivning(l: Fyndlage): string {
  if (l.lage === "pagar") {
    return `${l.antal} fynd just nu – nya varje dag kl 07–19. Priset sjunker varje timme tills någon slår till. ${UPPMANING}`;
  }
  if (l.lage === "fore") {
    return `${l.antal} fynd startar kl 07 – priset sjunker varje timme till kl 19. ${UPPMANING}`;
  }
  return BESKRIVNING_UTAN_ANTAL;
}
