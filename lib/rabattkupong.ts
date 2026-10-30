// lib/rabattkupong.ts
// Kroppen till Wix Create Coupon (POST /stores/v2/coupons) för mejl 3 om
// övergiven varukorg: 5 % på en varukorg över 200 kr, en användning, ett dygn.
// Beroendefri, så node:test kan importera den.
//
// ☠️ UPPMÄTT MOT WIX 2026-10-29. Den första versionen (2026-05-30) skapade
// aldrig en enda kupong: Wix svarade 400 "Not a numeric value", och mejl 3
// gick ut utan kod varje gång. Tre fel, provade med inaktiva testkuponger som
// togs bort direkt:
//
//   - startTime och expirationTime är millisekunder som TEXT ("1793289938682").
//     Ett ISO-datum ger "Not a numeric value".
//   - scope och minimumSubtotal utesluter varandra (ONE-OF i schemat). En
//     kupong med bara minimumSubtotal gäller hela varukorgen, och den
//     lästes tillbaka utan scope.
//   - Gränsen per kund heter limitPerCustomer och tar ett heltal.
//     limitedToOnePerCustomer finns inte i schemat.

/** Rabatten i procent. */
export const RABATT_PROCENT = 5;
/** Lägsta delsumma i hela kronor. Samma gräns som mejlets spärr (MIN_SUBTOTAL_FOR_CODE_MINOR). */
export const MINSTA_DELSUMMA_SEK = 200;
/** Koden gäller ett dygn. */
export const GILTIG_MS = 24 * 60 * 60 * 1000;

export interface KupongSpecifikation {
  name: string;
  code: string;
  /** Millisekunder som text, aldrig ett ISO-datum. */
  startTime: string;
  /** Millisekunder som text, aldrig ett ISO-datum. */
  expirationTime: string;
  active: boolean;
  percentOffRate: number;
  minimumSubtotal: number;
  usageLimit: number;
  limitPerCustomer: number;
}

/** Kupongen för en varukorg, och när den slutar gälla (ISO, för mejlet). */
export function rabattkupong(
  cartId: string,
  code: string,
  nuMs: number,
): { specification: KupongSpecifikation; expiresAt: string } {
  const slutMs = nuMs + GILTIG_MS;
  return {
    specification: {
      name: `Abandoned cart 5% – ${cartId.slice(0, 8)}`,
      code,
      startTime: String(nuMs),
      expirationTime: String(slutMs),
      active: true,
      percentOffRate: RABATT_PROCENT,
      minimumSubtotal: MINSTA_DELSUMMA_SEK,
      usageLimit: 1,
      limitPerCustomer: 1,
    },
    expiresAt: new Date(slutMs).toISOString(),
  };
}
