// Låser sidans skroll medan en meny, en låda eller ett fönster är öppet
// (mobilmenyn, filtren, kategorivalet, bildvisaren och recensionernas foton).
//
// VARFÖR PÅ html OCH INTE PÅ body. html har overflow-x:clip (app/globals.css),
// och då förs body:s overflow aldrig vidare till fönstret. Ett lås på body
// låste därför ingenting. Med mobilmenyn öppen gick sidan bakom att svepa och
// skrolla: mätt i Chromium på www och på förhandsbygget 2026-11-15, scrollY
// 0 → 787 efter ett svep och 1 387 efter mushjulet. Låset gjorde dessutom body
// till en egen skrollbehållare, och då hämtade Chrome sidans lata bilder: tio
// bilder och 336 kB på startsidan varje gång menyn öppnades. Med låset på html
// står sidan still (0 / 0) och inga bilder hämtas.
//
// Flera lås samtidigt räknas: sidan släpps först när det sista låset släpps.
// Att släppa samma lås två gånger gör ingenting.
//
// Rullningslisten: på en dator med fast rullningslist försvinner den när sidan
// låses, och sidan blir bredare och hoppar. scrollbar-gutter:stable håller
// platsen. Den sätts bara när det finns en rullningslist, annars skulle sidan
// hoppa åt andra hållet.

/** Det som låset rör: html-elementets stil och bredd. */
export type Rot = {
  style: { overflow: string; scrollbarGutter: string };
  clientWidth: number;
};

let antal = 0;
let forra: { overflow: string; scrollbarGutter: string } | null = null;

/** Antalet lås som inte har släppts (för proven). */
export function oppnaLas(): number {
  return antal;
}

/**
 * Låser sidan och ger en funktion som släpper låset. Anropas i en effekt, och
 * funktionen ges tillbaka som effektens städning.
 */
export function lasSidan(
  rot: Rot = document.documentElement,
  fonsterBredd: number = window.innerWidth,
): () => void {
  if (antal === 0) {
    forra = { overflow: rot.style.overflow, scrollbarGutter: rot.style.scrollbarGutter };
    if (fonsterBredd > rot.clientWidth) rot.style.scrollbarGutter = "stable";
    rot.style.overflow = "hidden";
  }
  antal++;
  let slappt = false;
  return () => {
    if (slappt) return;
    slappt = true;
    antal--;
    if (antal === 0 && forra) {
      rot.style.overflow = forra.overflow;
      rot.style.scrollbarGutter = forra.scrollbarGutter;
      forra = null;
    }
  };
}
