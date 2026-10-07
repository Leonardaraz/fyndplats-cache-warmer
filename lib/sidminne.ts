// Var kunden står på sidan: produktsidan öppnas vid bilderna, och bakåt
// till en listsida landar vid kortet man tryckte på (Leonard 2026-10-07).
//
// Uppmätt i produktion samma dag, mobil 390 × 844:
//
// - Ett tryck på ett kort öppnade produktsidan överst. Bilderna började
//   435 px ner, under brödsmulorna och föregående/nästa-raden, och
//   kunden fick själv dra upp dem.
// - Bakåt från en produkt, efter två "Visa fler", gav 24 kort i stället
//   för 72 och y = 16 443 px, alltså en plats ingen hade varit på.
//   Produktsidan och listan är samma dokument (mjuk navigering), så
//   ShopBrowser monteras om från början och glömmer sina kort. Webbläsaren
//   återställer sedan sitt gamla y på en sida som är mycket kortare.
//
// Två signaler sätts av skriptet i sidhuvudet (SIDBYTE_SKRIPT i
// app/layout.tsx), som lyssnar innan React gör det:
//
//   window.__fpKlick = { p, t }  en länk i butiken trycktes, mot sökvägen p
//   window.__fpTrav  = t         bakåt eller framåt i historiken
//
// Bara ett tryck flyttar produktsidan. Bakåt, framåt, en omladdning och en
// landning från Google lämnar webbläsarens egen plats orörd.

export type Fonster = {
  __fpKlick?: { p: string; t: number };
  __fpTrav?: number;
};

/** Hur gammal en signal får vara. En mjuk navigering hämtar sidan först,
 *  och på en långsam mobil kan det ta några sekunder. */
export const SIGNAL_MS = 10_000;

/** Kom kunden hit med ett tryck på en länk till just den här sökvägen? */
export function klickadeHit(w: Fonster, sokvag: string, nu: number): boolean {
  const k = w.__fpKlick;
  return !!k && k.p === sokvag && nu - k.t >= 0 && nu - k.t < SIGNAL_MS
    && !(w.__fpTrav && w.__fpTrav > k.t);
}

/** Kom kunden hit med bakåt eller framåt? Mjukt: popstate nyss, och inget
 *  tryck efter det. Hårt: dokumentet laddades som back_forward och ingen
 *  länk har tryckts i det än (efter ett tryck är sidan en egen navigering). */
export function komMedHistoriken(w: Fonster, nu: number, navigeringstyp: string | undefined): boolean {
  const trav = w.__fpTrav;
  if (trav && nu - trav >= 0 && nu - trav < SIGNAL_MS && !(w.__fpKlick && w.__fpKlick.t > trav)) return true;
  return !w.__fpKlick && !trav && navigeringstyp === "back_forward";
}

// ── Listsidan ────────────────────────────────────────────────────────────────

export type Listlage = {
  /** Hur många kort som visades ("Visa fler" × 24 + 24). */
  shown: number;
  /** Kortets länk, den som trycktes. */
  href: string;
  /** Kortets överkant i fönstret när det trycktes. */
  top: number;
  t: number;
};

type Lagring = Pick<Storage, "getItem" | "setItem">;

const NYCKEL = "fp-listlage:";
/** Ett läge äldre än så återställs inte. */
export const LISTLAGE_MAX_MS = 30 * 60_000;

export function sparaListlage(s: Lagring, adress: string, l: Listlage): void {
  try {
    s.setItem(NYCKEL + adress, JSON.stringify(l));
  } catch {
    /* privat läge eller full lagring: bakåt beter sig då som förut */
  }
}

export function lasListlage(s: Lagring, adress: string, nu: number): Listlage | null {
  try {
    const r = s.getItem(NYCKEL + adress);
    if (!r) return null;
    const l = JSON.parse(r) as Partial<Listlage>;
    if (typeof l.shown !== "number" || !(l.shown > 0) || typeof l.href !== "string"
      || typeof l.top !== "number" || typeof l.t !== "number") return null;
    if (nu - l.t > LISTLAGE_MAX_MS || nu < l.t) return null;
    return l as Listlage;
  } catch {
    return null;
  }
}
