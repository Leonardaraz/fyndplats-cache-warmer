// lib/medlem/kontolank.ts
//
// Menylänken "Mitt konto" (medlemskapet, läget `pa`). Kontot är öppet för
// alla först i läget `pa` (Leonards "Vi kör", 1.3, med start tidigast
// 12/11). Innan dess når bara testarna /konto, med adressen. Utan hemligheten
// är inloggningen stängd, och då ska ingen länk peka dit.
//
// Ren modul utan importer: node --test laddar den direkt.

export type Medlemslage = "av" | "tyst" | "pa";

export function visaKontolank(lage: Medlemslage, harHemlighet: boolean): boolean {
  return harHemlighet && lage === "pa";
}

/** Svaret från /api/konto/lage cachas så länge i Vercels kant. Växeln läses om en gång i minuten per instans. */
export const KONTOLANK_CACHE_S = 300;

/**
 * Länkens text i sidhuvudet, menyn och sidfoten: "Bli medlem" för den som inte
 * är inloggad, "Mitt konto" för den som är det. Inloggningen syns i tecknet
 * `fp_medlem_inne` ("1" privat, "f" företag; lib/medlem/session.ts), som inte
 * ger någon behörighet: /konto läser alltid sessionen.
 */
export function kontolankText(tecken: string | null | undefined): "Bli medlem" | "Mitt konto" {
  return tecken === "1" || tecken === "f" ? "Mitt konto" : "Bli medlem";
}
