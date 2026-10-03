// Kategorinamn inne i en mening eller rubrik skrivs med liten bokstav: "Om
// julgranar", "Vanliga frågor om tvättkorgar" (språkgranskningen 2026-10-03).
// Förkortningar behåller sina versaler: ett ord med minst två stora bokstäver
// ("TV-bänkar", "LED-belysning") lämnas orört.
export function kategoriIMening(namn: string): string {
  return namn
    .split(/(\s+)/)
    .map((ord) => ((ord.match(/[A-ZÅÄÖÉ]/g)?.length ?? 0) >= 2 ? ord : ord.toLowerCase()))
    .join("");
}
