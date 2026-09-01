// lib/delivery-status.ts
//
// Vilka spårningsstatus som får bli ett kundmejl — EN definition för båda
// källorna:
//   - 17TRACK-push        (app/api/track17-webhook)  status-enum från 17TRACK
//   - AliExpress-pollen   (app/api/cron/ae-delivery-poll)  härledd ur AE:s texter
//
// Statusorden råkar vara desamma ("Delivered", "OutForDelivery") i 17TRACK:s
// enum och i lib/ae-track:s härledning, så samma tabell duger åt båda. Att
// hålla den på ETT ställe är poängen: hade pollen fått en egen kopia hade de
// två kanalerna förr eller senare mejlat på olika status.
//
// Ansvarsfördelning push/poll vs SMS (oförändrad):
//   - PUSH/POLL → Delivered + OutForDelivery (milstolpar UTAN hämtkod).
//   - SMS       → AvailableForPickup MED hämtkod (koden finns bara i carrier-
//                 SMS:et, aldrig i 17TRACK eller hos AliExpress) → SMS äger
//                 upphämtning, de andra rör den inte.
// Därför kan kanalerna aldrig kollidera på samma (number, status)-nyckel i
// lib/delivery-dedup.
//
// Beroendefri (bara typer) — node:s test-runner med strip-types kräver annars
// explicita .ts-ändelser, vilket bryter repo-konventionen.

/** Delmängden av DeliveryStatus (emails/delivery-notification) som push och
 *  poll får skicka. Speglad här i stället för importerad så modulen förblir
 *  beroendefri; ett test låser att värdena finns i mallens union. */
export type NotisStatus = "delivered" | "out_for_delivery";

/**
 * Status → kundmejl, eller null när statusen inte ska ge någon push-notis.
 * InTransit, PickedUp, InfoReceived, AvailableForPickup, Exception, Expired,
 * NotFound … → null.
 */
export function notisStatusFör(raw: string | undefined | null): NotisStatus | null {
  switch (raw) {
    case "Delivered":
      return "delivered";
    case "OutForDelivery":
      return "out_for_delivery";
    default:
      return null;
  }
}

/**
 * Terminala 17TRACK-status: paketet rör sig inte längre (avvikelse, retur,
 * utgången, ej hittad). Inget mejl, MEN mappningen måste lämna 'in_transit' —
 * annars ligger döda paket kvar och förorenar SMS-FIFO-poolen
 * (findFifoCandidate plockar äldsta in_transit → ett dött paket gissas först
 * → fel kund får notis).
 */
export function ärTerminalStatus(raw: string | undefined | null): boolean {
  switch (raw) {
    case "Exception":
    case "DeliveryFailure":
    case "Returning":
    case "Returned":
    case "Expired":
    case "NotFound":
    case "Undelivered":
      return true;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// AliExpress-pollens urval. Konstanterna bor här (beroendefritt) så de går
// att testa, och så cron-rutten inte bär egna tal.
// ---------------------------------------------------------------------------

/**
 * Mappningsstatus som pollen tittar på. 'out_for_delivery' är MED med flit:
 * efter "ute för leverans"-mejlet ska samma paket fortfarande pollas tills det
 * är levererat — annars hade det första mejlet gjort det andra omöjligt.
 */
export const POLL_STATUSAR = ["in_transit", "out_for_delivery"] as const;

/** Äldre mappningar pollas inte. Ett paket som inte levererats på sex veckor
 *  är en avvikelse, inte en leverans som väntar — och varje rad kostar ett
 *  AliExpress-anrop per körning. */
export const POLL_MAX_ÅLDER_DAGAR = 45;

/** Tak per körning. ~10 paket i luften är normalläget; taket finns för att en
 *  Black Friday-vecka inte ska bränna spårnings-API:t i en enda körning. */
export const POLL_MAX_PER_KÖRNING = 60;

/** Paus mellan AliExpress-anrop. Cache-warmern cachar 5 min per nummer, så
 *  pausen skyddar DS-API:t, inte cache-warmern. */
export const POLL_PAUS_MS = 250;

/**
 * Ska mappningens status skrivas efter en poll-runda?
 *
 * ☠️ Bara när mejlet är SKICKAT eller redan skickat av en annan kanal. I
 * 17TRACK-webhooken skrivs statusen FÖRE mejlet, och det är rätt där: 17TRACK
 * pushar om, så ett misslyckat mejl får en ny chans. Pollen är sin egen
 * återförsökare — lämnas raden på 'in_transit' vid Resend-fel prövas den igen
 * nästa körning. Skrevs statusen ändå hade ett enda Resend-hicka gjort paketet
 * osynligt för pollen för alltid, och kunden hade aldrig fått mejlet.
 */
export function skaSkrivaStatus(utfall: { sent: boolean; reason?: string }): boolean {
  return utfall.sent || utfall.reason === "duplicate_suppressed";
}
