// lib/forsta-rorelse.ts
//
// HAR BESÖKAREN RÖRT SIDAN? En flagga för hela sidan, som slår om vid första
// musrörelsen, tryckningen, tangenten eller hjulet, och sedan står kvar.
//
// VARFÖR (Leonards skärmbild 2026-11-14). Google Bilder visade massagestolens
// foto under en ANNAN produkts adress: gamingstolens sida har "Liknande
// produkter" med massagestolens kort, och kortets andra bild (hover-bilden,
// .pimg-alt) låg i sidans HTML. Google tillskrev bilden den sidan. Kortens
// andra bild läggs därför in först när en människa rört sidan
// (components/kort-andra-bild.tsx). Googles läsare rör aldrig något: den
// renderar sidan i ett högt fönster och läser det som står där.
//
// ☠️ INTE "scroll". Sidan kan rulla utan att någon rört den (ankarlänkar,
// återställd rullning, en sida som själv anropar scrollTo), och då hade
// bilderna kommit med i det Google läser. Den som rullar med fingret ger
// touchstart, och den som rullar med musen ger wheel eller pointermove.

const HANDELSER = ["pointermove", "pointerdown", "touchstart", "keydown", "wheel"] as const;

let rord = false;
let lyssnar = false;
const lyssnare = new Set<() => void>();

function narRord() {
  if (rord) return;
  rord = true;
  for (const h of HANDELSER) window.removeEventListener(h, narRord, true);
  for (const f of [...lyssnare]) f();
}

/** Har besökaren rört sidan (mus, tryck, tangent eller hjul)? Alltid nej på servern. */
export function harRortSidan(): boolean {
  return rord;
}

/** Nej på servern och under hydreringen: kortens andra bild står aldrig i HTML:en. */
export function harRortSidanServer(): boolean {
  return false;
}

/**
 * Prenumeration för useSyncExternalStore: `f` anropas en gång, när besökaren
 * först rör sidan. Lyssnarna läggs på fönstret i fångstfasen, passiva, och
 * tas bort direkt efteråt.
 */
export function prenumereraPaRorelse(f: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (!lyssnar && !rord) {
    lyssnar = true;
    for (const h of HANDELSER) window.addEventListener(h, narRord, { capture: true, passive: true });
  }
  lyssnare.add(f);
  return () => {
    lyssnare.delete(f);
  };
}

/** Bara för proven: tillbaka till en orörd sida. */
export function nollstallRorelseForProv(): void {
  rord = false;
  lyssnar = false;
  lyssnare.clear();
}

export const RORELSE_HANDELSER = HANDELSER;
