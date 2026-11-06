// lib/fran-fyndauktionen.ts
//
// Kom besökaren till produktsidan från /fyndauktion, på samma webbplats?
// Ren funktion, så att node --test kan pröva den (lib/analytics.ts drar in
// @vercel/analytics och ./meta). Används av trackAuktionVarukorg.
export function franFyndauktionen(referrer: string, origin: string): boolean {
  try {
    const u = new URL(referrer);
    return u.origin === origin && u.pathname === "/fyndauktion";
  } catch {
    return false;
  }
}
