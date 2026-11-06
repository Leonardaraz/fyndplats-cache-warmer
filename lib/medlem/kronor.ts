// lib/medlem/kronor.ts
//
// Ett medlemspris som kunden läser det. Specen (avrundning): styckpriset efter
// rabatt avrundas till hela ören, och samma pris skickas till Wix. Rutan på
// produktsidan visar därför örena när de finns, annars hade den sagt 1 832 kr
// och kassan 1 831,62 kr.
//
// Ren modul utan imports.

/** "1 869 kr" för hela kronor, annars "1 831,62 kr". */
export function kronorText(ore: number): string {
  if (!Number.isSafeInteger(ore) || ore < 0) throw new Error(`ogiltigt belopp: ${ore}`);
  const kr = String(Math.floor(ore / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const rest = ore % 100;
  return rest === 0 ? `${kr} kr` : `${kr},${String(rest).padStart(2, "0")} kr`;
}
