// Standardraden: GPSR-uppgifter som gäller alla VEVOR-varor (Leonard 2026-10-29).
//
// VEVOR har inte svarat på vem som är tillverkare och EU-ansvarig per vara.
// Leonard valde att visa samma uppgifter för hela sortimentet tills de gör det:
// EU-ansvarig är INDEPSALE TECHNOLOGY LIMITED i Dublin, som säljer till oss och
// står i VEVOR:s villkor, och tillverkaren är bolaget som manualerna anger.
//
// Raden ligger i samma kollektion som artiklarnas rader, med nyckeln
// `standard`. En egen rad för en artikel går alltid före. Svarar VEVOR något
// annat skrivs standardraden om, och då ändras alla varor på en gång.
//
// Ren modul: lagret skickas in.

import type { GpsrLager, VevorGpsrRad } from "./gpsr-lager";

/** Nyckeln för standardraden. VEVOR:s artikelnummer är versaler och siffror, så den krockar aldrig. */
export const STANDARD_RAD = "standard";

/**
 * Raden som gäller för varje artikel: artikelns egen, annars standardraden.
 * En artikel utan någon av dem saknas i svaret.
 */
export async function lasEffektiva(
  lager: Pick<GpsrLager, "las">,
  skus: readonly string[],
): Promise<Map<string, VevorGpsrRad>> {
  const unika = [...new Set(skus)];
  const rader = await lager.las([...unika, STANDARD_RAD]);
  const standard = rader.get(STANDARD_RAD) ?? null;
  const ut = new Map<string, VevorGpsrRad>();
  for (const sku of unika) {
    const rad = rader.get(sku) ?? standard;
    if (rad) ut.set(sku, rad);
  }
  return ut;
}
