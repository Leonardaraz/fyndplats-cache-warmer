// Postnummer dit Aosoms varor inte kan levereras (Leonard 2026-10-26).
//
// Listan står här exakt som Leonard skrev den. Den används på tre ställen:
//
//   1. Kassan: Wix anropar /api/wix-validering/v1/get-violations, och ett
//      spärrat postnummer med en Aosom-vara i kundvagnen stoppar köpet.
//   2. Ordern: kommer en sådan order ändå in larmas Leonard direkt
//      (/api/wix-order).
//   3. Beställningen: bulkordern till Aosom hoppar över ordern
//      (lib/aosom/bulk-order.ts), så den aldrig skickas till Aosom.
//
// Bara Aosom. AliExpress- och VEVOR-varor levereras dit som förut.

/** Spärrade postnummer som intervall, båda ändarna inräknade. */
export const AOSOM_SPARRADE_POSTNUMMER: ReadonlyArray<readonly [number, number]> = [
  [10005, 10005],
  [13025, 13025],
  [13033, 13034],
  [13036, 13036],
  [13038, 13039],
  [13042, 13043],
  [13055, 13056],
  [37022, 37022],
  [43080, 43099],
  [45204, 45205],
  [47112, 47115],
  [47500, 47599],
  [62000, 62999],
  [74296, 74297],
  [76017, 76019],
  [91803, 91803],
];

/**
 * Postnumret som fem siffror, eller null. Tar bort mellanslag och ett
 * landsprefix ("SE-621 52", "S-62152"). Allt som inte blir exakt fem siffror är
 * inget svenskt postnummer och spärras aldrig.
 */
export function normaliseraPostnummer(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const utanPrefix = raw.trim().replace(/^(SE|S)\s*-?\s*/i, "");
  const siffror = utanPrefix.replace(/[\s-]/g, "");
  return /^\d{5}$/.test(siffror) ? siffror : null;
}

/** "62152" → "621 52", så som postnummer skrivs i Sverige. */
export function formateraPostnummer(postnummer: string): string {
  return `${postnummer.slice(0, 3)} ${postnummer.slice(3)}`;
}

/**
 * Sant när adressen kan vara svensk. Ett saknat land räknas som svenskt:
 * butiken säljer bara till Sverige, och en spärr som släpper igenom en adress
 * utan land är en spärr med ett hål.
 */
export function arSvenskAdress(land: string | null | undefined): boolean {
  if (!land || !land.trim()) return true;
  return ["se", "swe", "sverige", "sweden"].includes(land.trim().toLowerCase());
}

/** Sant för ett svenskt postnummer som står i listan. */
export function arAosomSparratPostnummer(raw: string | null | undefined): boolean {
  const pn = normaliseraPostnummer(raw);
  if (!pn) return false;
  const tal = Number(pn);
  return AOSOM_SPARRADE_POSTNUMMER.some(([fran, till]) => tal >= fran && tal <= till);
}

/**
 * Det spärrade postnumret för en adress, formaterat ("621 52"), eller null när
 * Aosom levererar dit.
 */
export function aosomSparrForAdress(
  adress: { country?: string | null; postalCode?: string | null } | null | undefined,
): string | null {
  if (!adress || !arSvenskAdress(adress.country)) return null;
  const pn = normaliseraPostnummer(adress.postalCode);
  return pn && arAosomSparratPostnummer(pn) ? formateraPostnummer(pn) : null;
}
