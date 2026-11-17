// Pekarens läge i hjälten som ett tal, för varuväggens lutning
// (components/hero-lutning.tsx och "Studion" i app/startsida.css).

/** Läget `lage` inom sträckan som börjar i `start` och är `langd` lång: −1 i början, 0 i mitten, 1 i slutet. */
export function lutning(lage: number, start: number, langd: number): number {
  if (!(langd > 0) || !Number.isFinite(lage) || !Number.isFinite(start)) return 0;
  return Math.max(-1, Math.min(1, ((lage - start) / langd) * 2 - 1));
}
