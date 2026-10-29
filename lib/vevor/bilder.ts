// Vilka sex bilder en VEVOR-produkt får, och i vilken ordning (Leonards regel,
// kontrollerad på 50 slumpade produkter 2026-10-28). Ren modul.
//
// Bara bilder ur produktens EGEN mapp räknas: sidans galleri visar också andra
// produkters bilder, och tolkningen märker varje bild med `egen`
// (lib/vevor/sida.ts). Originalet (`original_img`, 1600 × 1600) importeras, i
// galleriets ordning. Bilderna redigeras aldrig, inte heller VEVOR:s märkning
// "AI Generated Character and Scene" på vissa miljöbilder.
//
// MÖNSTREN, efter filnamnens sista led:
//
//   ny      48 av 50. 12 bilder: m100-1.2, f1–f6, m100-1.12 (ibland m100-1.1)
//           och m100-9 till m100-12. Bild 2–7 är textbilder och en måttskiss på
//           engelska. Vi tar VEVOR:s 9, 8, 1, 10, 11 och 12: den renaste bilden,
//           miljöbilden, VEVOR:s första och de tre sista. Har galleriet 13
//           bilder i samma mönster räknas det från slutet: n−3, n−4, 1, n−2,
//           n−1, n. Det är samma regel; för 12 bilder ger den 9, 8, 1, 10, 11, 12.
//   gammal   2 av 50. m100-bilder utan f-bilder. Bild 8 är en måttskiss och
//           bild 9 kan vara tillbehör. Vi tar 1, 8, 9, 10, 11 och 12 och
//           flaggar produkten för bildgranskning vid poleringen.
//   okant   allt annat: de sex första egna bilderna, och bildgranskning.
//
// Uppmätt igen 2026-10-29 på 34 sparade sidor: alla 34 i det nya mönstret,
// med 12 egna bilder.
//
// ☠️ Mönstret "ny" kräver namnen, inte bara antalet. Positionerna är bara
// rätt när de fyra sista heter m100-9 till m100-12 och n−4 och den första är
// m100-1.x. Utan den kontrollen hade ett galleri i ett tredje mönster fått sina
// textbilder som huvudbild, utan att något flaggats.

import type { VevorBild } from "./sida";

export type Bildmonster = "ny" | "gammal" | "okant";

export interface Bildval {
  urls: string[];
  monster: Bildmonster;
  /** Ska poleringen titta på bilderna innan publicering? */
  granskas: boolean;
  /** Antal egna bilder på sidan. */
  egna: number;
}

export const BILDER_PER_PRODUKT = 6;

/** Filnamnets sista led: `m100-1.2`, `m100-9`, `f3`. Null när namnet inte följer VEVOR:s form. */
export function bildnamn(url: string): string | null {
  let adress = url;
  try {
    adress = decodeURIComponent(url);
  } catch {
    // Ett ensamt % i adressen: läs den som den står.
  }
  const fil = adress.replace(/[?#].*$/, "").split("/").pop() ?? "";
  const m = /-(m\d+-\d+(?:\.\d+)?|f\d+)\.(?:jpe?g|png|webp)$/i.exec(fil);
  return m ? m[1].toLowerCase() : null;
}

const M_ETT = /^m\d+-1\.\d+$/;
const F_BILD = /^f\d+$/;
const M_BILD = /^m\d+-/;

/** De fyra sista heter m…-9, m…-10, m…-11 och m…-12, i den ordningen. */
function slutarPaNioTillTolv(namn: (string | null)[]): boolean {
  if (namn.length < 4) return false;
  const sista = namn.slice(-4);
  return sista.every((n, i) => n !== null && new RegExp(`^m\\d+-${9 + i}$`).test(n));
}

/** Sex bilder i vår ordning, och om poleringen ska granska dem. */
export function valjVevorBilder(bilder: VevorBild[]): Bildval {
  const egna = bilder.filter((b) => b.egen).map((b) => b.url);
  const n = egna.length;
  const namn = egna.map(bildnamn);
  const harF = namn.some((x) => x !== null && F_BILD.test(x));

  // 1-indexerat, som Leonards regel.
  const ta = (positioner: number[]) => positioner.map((p) => egna[p - 1]);

  if (n >= 6 && harF && slutarPaNioTillTolv(namn) && M_ETT.test(namn[0] ?? "") && M_ETT.test(namn[n - 5] ?? "")) {
    return { urls: ta([n - 3, n - 4, 1, n - 2, n - 1, n]), monster: "ny", granskas: false, egna: n };
  }
  if (n >= 12 && !harF && namn.every((x) => x !== null && M_BILD.test(x))) {
    return { urls: ta([1, 8, 9, 10, 11, 12]), monster: "gammal", granskas: true, egna: n };
  }
  return { urls: egna.slice(0, BILDER_PER_PRODUKT), monster: "okant", granskas: true, egna: n };
}
