// Produktsäkerheten (GPSR) för en VEVOR-artikel: vem som är tillverkare, vem
// som är ansvarig i EU, och om varan får publiceras. Ren modul.
//
// VARFÖR (Leonard 2026-10-28, steg 7). EU:s produktsäkerhetsförordning
// (EU) 2023/988, artikel 19, kräver att en produktsida i distansförsäljning
// visar tillverkarens namn, postadress och elektroniska adress, och när
// tillverkaren finns utanför EU samma tre uppgifter för den ansvariga i EU
// (hela texten står i lib/gpsr/aosom.ts). VEVOR:s tillverkare finns i Kina, så
// båda parterna behövs. En VEVOR-vara publiceras inte förrän båda är
// kompletta (lib/publicering.ts).
//
// VAR UPPGIFTERNA KOMMER IFRÅN. VEVOR:s produktsidor har dem inte, och VEVOR
// har inte svarat på frågan (ärendet stängdes 2026-10-28 utan svar). I 58
// slumpvalda manualer (2026-10-29) stod tillverkaren i 11 och ett EU-ombud i
// 13, och inget av ombuden hade e-post. Uppgifterna förs därför in per artikel,
// med källan, via /api/admin/vevor-gpsr: ur manualen, ur VEVOR:s svar eller ur
// ett beslut av Leonard. Ingenting här gissar en uppgift.
//
// ☠️ INGET ARTIKELNUMMER OCH INGEN ADRESS TILL VEVOR:S SIDOR. Parterna är bolag
// med post- och e-postadress, och de står på den publika produktsidan. En
// webbadress eller något som ser ut som ett artikelnummer vägras
// (`tvattaPart`), eftersom rutten svarar till en publik Actions-logg.

import type { ProductMappingRecord } from "@/lib/store";

/** Märket på VEVOR-varorna, som det står på varan och i flödena (Leonard 2026-10-28). */
export const VEVOR_MARKE = "VEVOR";

/** GPSR-statusen bor på mappningsraden, så att lagret inte behöver importera VEVOR-koden. */
export type GpsrStatus = NonNullable<ProductMappingRecord["vevorGranskning"]>["gpsr"];

/** Alla statusar, i ordningen de räknas upp i svar och loggrader. */
export const GPSR_STATUSAR = [
  "komplett",
  "bara_tillverkare",
  "saknas",
  "manual_ej_last",
  "ingen_manual",
] as const satisfies readonly GpsrStatus[];

/** En part: ett bolag med postadress och e-post. */
export interface GpsrPart {
  namn: string;
  /** Postadressen på en rad, med land, som källan anger den. */
  adress: string;
  epost: string;
}

/** Uppgifterna för en artikel. En part som saknas är null. */
export interface VevorGpsr {
  tillverkare: GpsrPart | null;
  euAnsvarig: GpsrPart | null;
  /** Varifrån uppgifterna kommer, med egna ord: "manualen", "VEVOR:s svar 2026-11-02". */
  kalla: string;
}

const MAX_NAMN = 120;
const MAX_ADRESS = 300;
const MAX_EPOST = 120;
const MAX_KALLA = 160;

const EPOST = /^[^\s@<>()"',;]+@[^\s@<>()"',;]+\.[a-z]{2,}$/i;
const WEBBADRESS = /https?:|www\.|\.(pdf|html?)\b/i;
/** VEVOR:s artikelnummer: versaler och siffror, minst tolv tecken i ett ord, med både bokstav och siffra. */
const ARTIKELNUMMER = /\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{12,}\b/;

function text(v: unknown): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
}

/** Fel i en fritext som går till produktsidan, eller null. */
function friTextFel(falt: string, v: string, min: number, max: number): string | null {
  if (v.length < min) return `${falt} saknas eller är för kort`;
  if (v.length > max) return `${falt} är längre än ${max} tecken`;
  if (/[<>]/.test(v)) return `${falt} innehåller < eller >`;
  if (WEBBADRESS.test(v)) return `${falt} innehåller en webbadress`;
  if (ARTIKELNUMMER.test(v)) return `${falt} innehåller något som ser ut som ett artikelnummer`;
  return null;
}

/**
 * En part tvättad och prövad, eller felet. Alla tre fälten krävs: lagen kräver
 * namn, postadress och elektronisk adress, och en part utan någon av dem är
 * ingen part.
 */
export function tvattaPart(ra: unknown, roll: string): { ok: true; part: GpsrPart } | { ok: false; fel: string } {
  if (!ra || typeof ra !== "object" || Array.isArray(ra)) return { ok: false, fel: `${roll}: måste vara ett objekt` };
  const o = ra as Record<string, unknown>;
  const part = { namn: text(o.namn), adress: text(o.adress), epost: text(o.epost) };
  const fel =
    friTextFel(`${roll}.namn`, part.namn, 2, MAX_NAMN)
    ?? friTextFel(`${roll}.adress`, part.adress, 8, MAX_ADRESS)
    ?? (part.epost.length > MAX_EPOST || !EPOST.test(part.epost) ? `${roll}.epost är ingen e-postadress` : null);
  return fel ? { ok: false, fel } : { ok: true, part };
}

/**
 * Uppgifterna för en artikel, tvättade, eller felen. En part får vara null
 * (manualen nämnde bara tillverkaren), men inte båda, och källan krävs.
 */
export function tvattaGpsr(ra: unknown): { ok: true; gpsr: VevorGpsr } | { ok: false; fel: string[] } {
  if (!ra || typeof ra !== "object" || Array.isArray(ra)) return { ok: false, fel: ["uppgifterna måste vara ett objekt"] };
  const o = ra as Record<string, unknown>;
  const fel: string[] = [];
  const part = (v: unknown, roll: string): GpsrPart | null => {
    if (v === null || v === undefined) return null;
    const t = tvattaPart(v, roll);
    if (!t.ok) {
      fel.push(t.fel);
      return null;
    }
    return t.part;
  };
  const tillverkare = part(o.tillverkare, "tillverkare");
  const euAnsvarig = part(o.euAnsvarig, "euAnsvarig");
  if (o.tillverkare == null && o.euAnsvarig == null) fel.push("minst en part krävs");
  const kalla = text(o.kalla);
  const kallaFel = friTextFel("kalla", kalla, 3, MAX_KALLA);
  if (kallaFel) fel.push(kallaFel);
  return fel.length ? { ok: false, fel } : { ok: true, gpsr: { tillverkare, euAnsvarig, kalla } };
}

/** Är parten komplett? Prövas igen vid läsning: en rad kan ha ändrats för hand i Wix CMS. */
function komplett(p: GpsrPart | null): p is GpsrPart {
  return p !== null && tvattaPart(p, "part").ok;
}

/**
 * Artikelns status.
 *
 * Utan rad gäller importens status: `ingen_manual` när produktsidan inte länkar
 * någon manual, annars `manual_ej_last`. Med en rad avgör parterna: båda
 * kompletta ger `komplett`, bara tillverkaren `bara_tillverkare`, och allt
 * annat `saknas` (en EU-ansvarig utan tillverkare räcker inte heller).
 */
export function gpsrStatus(rad: VevorGpsr | null, importensStatus: GpsrStatus | undefined): GpsrStatus {
  if (!rad) return importensStatus === "ingen_manual" ? "ingen_manual" : "manual_ej_last";
  if (komplett(rad.tillverkare) && komplett(rad.euAnsvarig)) return "komplett";
  if (komplett(rad.tillverkare)) return "bara_tillverkare";
  return "saknas";
}

/** Det publika svaret för /api/gpsr: exakt det produktsidans flik visar. */
export interface VevorGpsrPublik {
  marke: string;
  tillverkare: GpsrPart;
  euAnsvarig: GpsrPart;
  sakerhet: string[];
}

/**
 * Svaret till butiken, eller null när uppgifterna inte är kompletta. En flik
 * med halva uppgifterna visas aldrig: butiken visar då ingen flik, och varan
 * är ändå inte publicerad.
 *
 * Säkerhetsinformationen skriver poleringen i beskrivningen
 * (<h2>Produktsäkerhet</h2>), ur manualens svenska del. Butiken tar den därifrån.
 */
export function publikGpsr(rad: VevorGpsr | null): VevorGpsrPublik | null {
  if (!rad || !komplett(rad.tillverkare) || !komplett(rad.euAnsvarig)) return null;
  return {
    marke: VEVOR_MARKE,
    tillverkare: { ...rad.tillverkare },
    euAnsvarig: { ...rad.euAnsvarig },
    sakerhet: [],
  };
}

/** Statusen i klartext, för svar och mejl. */
export function gpsrStatusText(s: GpsrStatus): string {
  switch (s) {
    case "komplett":
      return "komplett";
    case "bara_tillverkare":
      return "bara tillverkaren";
    case "saknas":
      return "uppgifterna saknas";
    case "manual_ej_last":
      return "manualen inte läst";
    case "ingen_manual":
      return "ingen manual";
  }
}
