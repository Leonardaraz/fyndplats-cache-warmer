// lib/wix-order-id.ts
//
// Ett ordernummer är INTE ett order-id, och Wix accepterar bara det senare.
//
// `GET /ecom/v1/orders/{id}` slår upp på orderns interna GUID. Det läsbara
// numret ("10019") — det kunden ser i mejlet och vi råkar spara i
// `tracking_mapping.order_id` — ger 404. Skillnaden kostade hela
// omdömesflödet: leveransmejlets länk pekade på ett nummer, sidan slog upp
// det som ett id, fick null och svarade 404 för kunden (2026-08-22).
//
// Modulen är avsiktligt utan sido-import och utan nätverk: sökningen skickas
// in. Det gör den testbar utan Wix-nycklar, och den kan användas från både
// webhookens väg och sidorna.

/** Wix interna order-id. Gemener i praktiken, men vi läser båda skiftlägena. */
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Sant för Wix interna order-id (GUID), falskt för läsbara ordernummer. */
export function isWixOrderGuid(varde: string): boolean {
  return GUID_RE.test(varde.trim());
}

/**
 * Ger ett användbart order-id ur det vi råkar ha.
 *
 * Är värdet redan ett GUID lämnas det orört — inget extra anrop, så
 * webhook-vägen (som alltid bär riktiga id:n) blir inte långsammare.
 * Annars behandlas det som ett läsbart nummer och slås upp via `sokNummer`.
 *
 * Fail-open: en sökning som kastar eller inte hittar ger null, och anroparen
 * beter sig som förut. Vi gissar aldrig fram ett id.
 */
export async function resolveWixOrderId(
  raa: string | null | undefined,
  sokNummer: (nummer: string) => Promise<string | null>,
): Promise<string | null> {
  const varde = String(raa ?? "").trim();
  if (!varde) return null;
  if (isWixOrderGuid(varde)) return varde;
  try {
    const funnet = (await sokNummer(varde))?.trim();
    return funnet ? funnet : null;
  } catch {
    return null;
  }
}
