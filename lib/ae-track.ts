// lib/ae-track.ts
//
// AliExpress-spårningskällans presentation: svensk översättning av deras
// händelsetexter + status-härledning ur händelserna. Bruten ur /api/track till
// ren modul (inga next-importer) → enhetstestbar, samma mönster som
// lib/track-i18n (17TRACK-flödets motsvarighet).
//
// Matchning: FÖRSTA träff vinner → specifika fraser före generiska.
//
// Beroendefri (inga relativa importer) — node:s test-runner med strip-types
// kräver annars explicita .ts-ändelser, vilket bryter repo-konventionen.

// Ursprungs-ord i fri text (event-beskrivning/plats) som röjer dropship-
// ursprunget. Delas av 17TRACK-flödet OCH AliExpress-källan i /api/track
// (paritet med Velo:s LEAKY_PATTERN) — EN definition så kanalerna aldrig
// divergerar i vad som skrubbas.
export const LEAKY_PATTERN =
  /\b(china|chinese|kina|hong\s?kong|cainiao|aliexpress|shenzhen|guangzhou|shanghai|beijing|shantou|shatian|yiwu|4px|yanwen)\b/i;

export const AE_PHRASE_SV: Array<[RegExp, string]> = [
  // — Lagerhantering hos avsändaren —
  // ☠️ MÅSTE ligga FÖRST. Alla fyra stegen sker innan transportören rör
  // paketet, och "picked and ready for packing" innehåller ordet "picked" —
  // hamnar regeln efter upphämtningsmönstren riskerar den att läsas som en
  // upphämtningsskanning, alltså ett SENARE skede än sanningen. Att kunden
  // tror att paketet är på väg medan det ligger kvar på lagret är värre än
  // engelska.
  //
  // Uppmätt på spårningsnummer 13289200665172 (2026-09-02): alla fyra kom
  // oöversatta ur /api/track och stod på engelska i kundens spårningshistorik.
  // Samma hål lagades i PHRASE_SV (17TRACK-flödet) 2026-08-31, men den här
  // kartan är EN EGEN och fick aldrig reglerna — AliExpress-källan var då
  // ännu inte kopplad till /sparning. Texterna nedan är ordagrant desamma som
  // i PHRASE_SV, så samma händelse aldrig får två olika lydelser beroende på
  // vilken källa som råkade svara.
  [/being packed|order is (being )?pack|packing (has )?start/i,
    "Din order packas."],
  [/picked and ready for pack|picked[^.]*for packing/i,
    "Varan är plockad och klar för packning."],
  [/ready to be shipped|ready for (dispatch|shipment|shipping)|prepared for (dispatch|shipment)/i,
    "Paketet är färdigpackat och väntar på transportören."],
  // Fångar även "left THE warehouse", som förut föll på regeln nedan och gav
  // "Säljaren har skickat ditt paket". Ordagrant är det lagret som lämnats,
  // inte säljaren som skickat — och 17TRACK-flödet säger redan så här.
  [/left (the )?warehouse|departed[^.]*warehouse|dispatched from[^.]*warehouse|shipped (out )?from[^.]*warehouse/i,
    "Paketet har lämnat avsändarens lager."],
  // — Förberedelse / avsändning —
  [/(order|package) information received|awaiting shipment/i, "Fraktsedel skapad – paketet förbereds"],
  [/order shipped|seller has shipped/i, "Säljaren har skickat ditt paket"],
  [/collected by carrier|picked up by (the )?carrier/i, "Paketet har hämtats upp av transportören"],
  [/handed over to|handover to (the )?carrier/i, "Paketet har lämnats över till transportören"],
  // — Terminal / sortering (specifika före generisk transit) —
  [/arrived at[^.]*(sorting|sort cent|facility|hub|terminal|depot)/i, "Paketet har anlänt till en sorteringsterminal"],
  [/(left|departed from)[^.]*(sorting|sort cent|facility|hub|terminal|depot)/i, "Paketet har lämnat sorteringsterminalen"],
  [/arrived (at|in) (the )?destination country|arrived in destination/i, "Paketet har anlänt till Sverige"],
  [/customs clearance (complete|finished)|released (from|by) customs|cleared customs/i, "Paketet har klarerats i tullen"],
  [/customs/i, "Paketet hanteras i tullen"],
  // — Sista milen (misslyckat försök FÖRE "ute för leverans"/"levererat") —
  [/delivery (attempt )?(failed|unsuccessful)|unable to deliver|no.?one (was )?(home|available)/i,
    "Leveransförsök misslyckades – ny leverans planeras"],
  [/available for pick ?up|ready for pick ?up|awaiting (your )?collection|at (the )?(pickup|service) point/i,
    "Paketet finns för upphämtning hos ditt ombud"],
  [/out for delivery|delivery in progress/i, "Paketet är ute för leverans"],
  [/delivered|delivery (completed|successful)/i, "Paketet är levererat"],
  [/returned to (seller|sender)|being returned/i, "Paketet returneras till avsändaren"],
  // — Generisk transit (sist så den inte slukar specifika fraser) —
  [/international transit/i, "Paketet är i internationell transit"],
  [/shipment on the way|is in transit|in transit/i, "Paketet är på väg"],
  [/shipping update|transport(ation)? update/i, "Transportuppdatering"],
  [/package is being prepared|being prepared/i, "Paketet förbereds"],
];

/** Översätter en AliExpress-händelsetext till svenska. Okänd text passerar
 *  LEAKY_PATTERN-skrubben och visas som den är (oftast vettig engelska). */
export function translateAeDescription(raw: string): string {
  for (const [re, sv] of AE_PHRASE_SV) if (re.test(raw)) return sv;
  return raw.replace(LEAKY_PATTERN, "").replace(/\s{2,}/g, " ").trim();
}

export type AeStatus = "Delivered" | "OutForDelivery" | "AvailableForPickup" | "InTransit";

/**
 * Härleder övergripande status ur AliExpress RÅA händelsetexter (nyast först).
 * Utan detta visade /sparning "På väg" även för levererade paket när
 * AliExpress var källan (17TRACK-flödet har en riktig status-enum, AliExpress
 * har bara texterna).
 *
 *   - "delivered" NÅGONSTANS → Delivered (terminal — senare "shipping update"-
 *     rader ska inte kunna nedgradera).
 *   - Annars styr NYASTE raden: ute för leverans / hos ombud.
 *   - Allt annat → InTransit.
 */
export function deriveAeStatus(rawDescriptionsNewestFirst: string[]): AeStatus {
  const DELIVERED = /\bdelivered\b|delivery (completed|successful)/i;
  const FAILED = /delivery (attempt )?(failed|unsuccessful)|unable to deliver/i;
  for (const d of rawDescriptionsNewestFirst) {
    if (DELIVERED.test(d) && !FAILED.test(d)) return "Delivered";
  }
  const newest = rawDescriptionsNewestFirst[0] ?? "";
  if (/out for delivery|delivery in progress/i.test(newest) && !FAILED.test(newest)) return "OutForDelivery";
  if (/available for pick ?up|ready for pick ?up|awaiting (your )?collection/i.test(newest)) return "AvailableForPickup";
  return "InTransit";
}
