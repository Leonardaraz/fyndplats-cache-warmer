// lib/sista-led.ts
//
// Vem som delar ut paketet i Sverige när transportören lämnar över det, och var
// kunden följer den sista biten. /api/track bygger uppgiften och
// components/tracking.tsx visar den som en ruta ovanför spårningshistoriken.
// Ren modul utan importer, så att node --test kan ladda den (samma skäl som
// lib/gls-track.ts).
//
// Audit 2026-10-15, alla 54 GLS- och DPD-paket till och med order 10093:
//   • GLS: alla åtta lämnades till DSV (tidigare DB Schenker) i Malmö. DSV har
//     ett eget sändnings-id. Deras spårning visar ombudets adress och
//     öppettider, eller att leveransdagen ska bokas. Kunden får sms:et från DSV,
//     med DSV:s nummer, och vår sida nämnde inte numret.
//   • DPD: PostNord delar ut i Sverige, med samma nummer (Leonard).
//
// DSV:s spårning visar mottagarens postnummer och ort för den som har numret,
// precis som transportörernas egna sidor gör med sina nummer. Vår sida skickar
// fortfarande aldrig postnumret till webbläsaren.

export type SistaLedNamn = "DSV" | "PostNord";

export interface SistaLedInfo {
  namn: SistaLedNamn;
  /** Namnet som fortfarande står hos GLS och kan stå i äldre avier. */
  tidigare?: string;
  /** Partnerns eget nummer. PostNord har samma nummer som vi och inget eget. */
  nummer?: string;
  /** Partnerns spårning för paketet. */
  lank?: string;
  /** Hur paketet lämnas, när spårningen visar det. */
  satt?: "ombud" | "bokad";
}

/**
 * DSV:s spårning. dbschenker.com skickar dit sedan DSV köpte DB Schenker, och
 * med sändnings-id:t visar den paketet (prövat 2026-10-15 i en webbläsare: ett
 * ombudspaket och ett paket med bokad leverans).
 */
export const DSV_SPARNING = "https://www.dsv.com/mydsv/tracking-public/?refNumber=";

/** PostNords spårning, samma adress som /api/track:s reservlänkar. */
export const POSTNORD_SPARNING = "https://www.postnord.se/vara-verktyg/spara-brev-paket-och-pall?shipmentId=";

export function dsvLed(nummer?: string, satt?: "ombud" | "bokad"): SistaLedInfo {
  return {
    namn: "DSV",
    tidigare: "DB Schenker",
    ...(nummer ? { nummer, lank: DSV_SPARNING + encodeURIComponent(nummer) } : {}),
    ...(satt ? { satt } : {}),
  };
}

export function postnordLed(sparningsnummer: string): SistaLedInfo {
  const tn = sparningsnummer.trim().toUpperCase();
  return { namn: "PostNord", lank: POSTNORD_SPARNING + encodeURIComponent(tn) };
}

/** Partneruppgiften för ett sista led som 17TRACK eller numret avgjort. */
export function sistaLedInfoFor(sistaLed: string | undefined, sparningsnummer: string): SistaLedInfo | undefined {
  return sistaLed === "PostNord" ? postnordLed(sparningsnummer) : undefined;
}

export interface SistaLedRuta {
  rubrik: string;
  /** Partnern, för raden med deras nummer. */
  namn: SistaLedNamn;
  text: string;
  /** Partnerns eget nummer, som rutan visar för sig. */
  nummer?: string;
  knapp?: { text: string; href: string };
}

/**
 * Statusar där paketet inte är på väg fram som planerat: på väg tillbaka,
 * ett leveransförsök som misslyckades, ett fel. Rutan lovar då ingenting och
 * pekar bara på partnerns spårning.
 */
const AVVIKELSE = new Set(["Returning", "DeliveryFailure", "Undelivered", "Exception", "Expired"]);

/**
 * Rutans innehåll. `transportor` är den som har paketet först ("GLS", "DPD"),
 * `status` samma status som spårningen i övrigt.
 *
 * Texten lovar bara det spårningen visar just nu: bokningen står först när
 * den syns och bara tills paketet körs ut, ombudet först när ombudet syns, och
 * ingenting av det när paketet är på väg tillbaka eller inte kunde lämnas.
 * Innan något syns säger rutan att DSV hör av sig, vilket gäller i båda fallen.
 */
export function sistaLedRuta(
  info: SistaLedInfo,
  opts: { transportor: string; status?: string; levererad?: boolean },
): SistaLedRuta {
  const avvikelse = !opts.levererad && AVVIKELSE.has(opts.status ?? "");
  const ruta = (text: string, knapptext: string): SistaLedRuta => ({
    rubrik: "Leverans i Sverige",
    namn: info.namn,
    text,
    ...(info.nummer ? { nummer: info.nummer } : {}),
    ...(info.lank ? { knapp: { text: knapptext, href: info.lank } } : {}),
  });

  if (info.namn === "PostNord") {
    const samma = "Spårningsnumret är detsamma hos PostNord";
    if (opts.levererad) return ruta(`PostNord delade ut paketet i Sverige. ${samma}.`, "Visa paketet hos PostNord");
    if (avvikelse) {
      return ruta(`PostNord delar ut paketet i Sverige. ${samma}, och där ser du vad som händer med paketet nu.`, "Följ paketet hos PostNord");
    }
    return ruta(`${opts.transportor} lämnar över paketet till PostNord, som delar ut det i Sverige. ${samma}.`, "Följ paketet hos PostNord");
  }

  const namn = info.tidigare ? `${info.namn} (tidigare ${info.tidigare})` : info.namn;
  const folj = `Följ paketet hos ${info.namn}`;
  if (opts.levererad) return ruta(`${namn} delade ut paketet i Sverige.`, `Visa paketet hos ${info.namn}`);
  if (avvikelse) return ruta(`${namn} delar ut paketet i Sverige. Hos ${info.namn} ser du vad som händer med paketet nu.`, folj);
  if (info.satt === "ombud") {
    const text = opts.status === "AvailableForPickup"
      ? `Paketet finns hos ett ${info.namn}-ombud. Invänta avin från ${info.namn} innan du hämtar det. Hos ${info.namn} ser du ombudets adress och öppettider.`
      : `${namn} lämnar paketet hos ett ombud nära dig. Du får en avi från ${info.namn} när du kan hämta det. Hos ${info.namn} ser du ombudets adress och öppettider.`;
    return ruta(text, `Se ombudet hos ${info.namn}`);
  }
  // Ute för leverans: bokningen är gjord, eller så går paketet till ett ombud
  // som inte syns i historiken än. Samma ord som raden i GLS-historiken.
  if (opts.status === "OutForDelivery") return ruta(`${namn} delar ut paketet i Sverige, och det kommer fram i dag.`, folj);
  if (info.satt === "bokad") {
    return ruta(`${opts.transportor} har lämnat över paketet till ${namn}, som delar ut det i Sverige. ${info.namn} kontaktar dig via sms, e-post eller telefon för att boka leveransdag.`, folj);
  }
  return ruta(`${opts.transportor} lämnar över paketet till ${namn}, som delar ut det i Sverige. ${info.namn} hör av sig när det är dags att ta emot eller hämta paketet.`, folj);
}
