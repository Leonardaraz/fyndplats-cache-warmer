// Raderna som styr en körning i Wix CMS: låset och tillståndet.
//
// EN definition. VEVOR-läsaren, importen och synken (lib/vevor/lager.ts) och
// rea-jobbet (lib/pricing/rea-lager.ts) håller var sitt lås och var sitt
// tillstånd, med samma regler. Två kopior av låset hade glidit isär.

import { hamta, infoga, patcha, satt, taBort } from "./wix-data-klient";

/**
 * Ett lås: raden `id` i `kollektion`, med ägare och utgångstid. Sant om vi fick
 * det, alltså om ingen annan håller ett som inte gått ut.
 */
export async function tagLasIKollektion(
  kollektion: string,
  id: string,
  agare: string,
  nu: number,
  ttlMs: number,
): Promise<boolean> {
  const utgar = new Date(nu + ttlMs).toISOString();
  if ((await infoga(kollektion, id, { agare, utgar })) === "skapad") return true;
  const rad = await hamta<{ agare?: string; utgar?: string }>(kollektion, id);
  if (!rad) return (await infoga(kollektion, id, { agare, utgar })) === "skapad";
  if (rad.utgar && Date.parse(rad.utgar) > nu) return false;
  // Låset har gått ut: ta över det, men bara om ingen annan hann före.
  const villkor = rad.agare ? { agare: rad.agare } : { agare: { $exists: false } };
  return (await patcha(kollektion, id, [satt("agare", agare), satt("utgar", utgar)], villkor)) === "applied";
}

/** Släpper låset, bara om vi fortfarande äger det. */
export async function slappLasIKollektion(kollektion: string, id: string, agare: string): Promise<void> {
  await taBort(kollektion, id, { agare });
}

/**
 * Skriver bara de angivna fälten på raden `id`, och skapar den med `tom` som
 * grund om den saknas. ☠️ Aldrig hela raden: en strömbrytare som slås om medan
 * en körning läser hade annars ångrats tyst.
 */
export async function uppdateraRadIKollektion<T extends object>(
  kollektion: string,
  id: string,
  tom: T,
  andring: Partial<T>,
): Promise<void> {
  const falt = Object.entries(andring).filter(([, v]) => v !== undefined);
  if (falt.length === 0) return;
  const andringar = falt.map(([k, v]) => satt(k, v));
  if ((await patcha(kollektion, id, andringar)) === "applied") return;
  // Raden finns inte än: skapa den. Hann någon annan före, ändra deras.
  const ny = { ...tom, ...andring } as unknown as Record<string, unknown>;
  if ((await infoga(kollektion, id, ny)) === "skapad") return;
  if ((await patcha(kollektion, id, andringar)) !== "applied") {
    throw new Error(`raden ${id} i ${kollektion} gick inte att skriva`);
  }
}
