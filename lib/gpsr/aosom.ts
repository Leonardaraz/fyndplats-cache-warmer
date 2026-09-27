// lib/gpsr/aosom.ts
//
// Produktsäkerhetsuppgifterna (GPSR) för Aosom-produkterna. Ren modul: ingen
// IO, så vitest kör den direkt.
//
// VARFÖR DEN FINNS (Leonard 2026-09-27). EU:s produktsäkerhetsförordning
// (EU) 2023/988, artikel 19, kräver att varje produktsida i distansförsäljning
// visar
//   a) tillverkarens namn eller varumärke, postadress och elektronisk adress,
//   b) den ansvariga ekonomiska aktören i EU när tillverkaren finns utanför,
//   c) uppgifter som identifierar produkten, bland annat en bild,
//   d) varningar och säkerhetsinformation på ett språk konsumenten förstår —
//      i Sverige svenska (Konsumentverket).
// Sajten visade inget av det. Den svenska kompletteringslagen föreslår
// sanktionsavgift för brott mot just artikel 19: lägst 10 000 kr, högst 10 %
// av årsomsättningen (Fi 2024:F, november 2025).
//
// VEM SOM ÄR TILLVERKARE. HOMCOM, Outsunny, PawHut och de andra är Aosoms
// EGNA varumärken, inte egna bolag. Tillverkare i förordningens mening är den
// som låter tillverka en vara och saluför den under sitt varumärke — alltså
// varumärkesägaren, inte fabriken. Aosoms bruksanvisningar anger själva
// "Importeur/Hersteller/REP: MH Handel GmbH, Wendenstraße 309, D-20537
// Hamburg" (läst ur manualen IN221200216V02 2026-09-27), och samma bolag,
// adress och e-post står i aosom.de:s impressum (HRB 141235 Hamburg).
//
// "VI ÄR LEVERANTÖREN FÖR KUNDEN" gäller fortfarande överallt utom här.
// Lagen kräver att tillverkaren syns, och samma uppgift står redan på
// kartongen och i manualen kunden får hem. Butiken skriver "Tillverkare och
// ansvarig i EU", aldrig "leverantör". Beslutat av Leonard 2026-09-27.
//
// MÄRKET står inte i feeden som fält — beskrivningarna bär platshållaren
// "[BRAND NAME]", eftersom Aosom säljer varorna omärkta till återförsäljare.
// Det står däremot först i adressen till Aosoms egen produktsida
// (aosom.de/item/homcom-…). Uppmätt 2026-09-27 på 6 234 rader: alla utom ett
// tiotal har ett av märkena nedan där. "homcomr" är samma märke med ®.

import { createHash } from "node:crypto";

/** Tillverkare och ansvarig i EU för alla Aosom-märken. */
export const AOSOM_ANSVARIG = {
  namn: "MH Handel GmbH",
  gata: "Wendenstraße 309",
  postnummer: "20537",
  ort: "Hamburg",
  land: "Tyskland",
  epost: "kontakt@aosom.de",
} as const;

export type Ansvarig = { -readonly [K in keyof typeof AOSOM_ANSVARIG]: string };

/** Slug-token i Aosoms produktadress → märket som det skrivs på varan. */
const MARKEN: Record<string, string> = {
  homcom: "HOMCOM",
  outsunny: "Outsunny",
  pawhut: "PawHut",
  aiyaplay: "AIYAPLAY",
  sportnow: "SPORTNOW",
  vinsetto: "Vinsetto",
  kleankin: "kleankin",
  durhand: "DURHAND",
  zonekiz: "ZONEKIZ",
  aosom: "Aosom",
};

/**
 * Märket ur adressen till Aosoms produktsida, eller null när adressen inte
 * börjar med ett känt märke. Null är ett ärligt svar — butiken visar då bara
 * tillverkaren, som ändå är densamma för alla Aosoms märken.
 */
export function markeUrAosomUrl(url: string | null | undefined): string | null {
  const m = /\/item\/([a-z0-9]+)-/i.exec(url ?? "");
  if (!m) return null;
  const token = m[1].toLowerCase();
  if (MARKEN[token]) return MARKEN[token];
  // "homcomr" = "HOMCOM®" i slugen. Bara för kända märken — ett okänt ord som
  // råkar sluta på r ska inte bli ett märke.
  if (token.endsWith("r") && MARKEN[token.slice(0, -1)]) return MARKEN[token.slice(0, -1)];
  return null;
}

/** Den tyska källtexten ur en feed-rad, som ren text. */
export interface Kalla {
  namn: string;
  beskrivningHtml: string;
  punkterHtml: string;
  kategori: string;
}

const MAX_KALLA = 6000;

function tillText(html: string): string {
  return html
    .replace(/<br\s*\/?>|<\/(p|li|div|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\[BRAND NAME\]\s*/gi, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

/**
 * Texten som skickas till utvinningen. Märket är redan bortskalat ur
 * beskrivningen hos Aosom; platshållaren tas bort så att den inte hamnar i
 * den svenska texten.
 */
export function kallText(k: Kalla): string {
  const delar = [
    `Produkt: ${tillText(k.namn)}`,
    k.kategori ? `Kategori: ${tillText(k.kategori)}` : "",
    tillText(k.punkterHtml),
    tillText(k.beskrivningHtml),
  ].filter(Boolean);
  return delar.join("\n").slice(0, MAX_KALLA);
}

/**
 * Fingeravtryck för källtexten. Samma avtryck = samma säkerhetstext, och då
 * behövs ingen ny utvinning. Versionen bumpas när prompten ändras, så att
 * allt görs om med den nya.
 */
export const UTVINNING_VERSION = "1";

export function kallHash(text: string): string {
  return createHash("sha256").update(`${UTVINNING_VERSION}\n${text}`).digest("hex").slice(0, 32);
}

/** En sparad post, en per Wix-produkt. */
export interface GpsrPost {
  wixProductId: string;
  /** Aosoms artikelnummer. Internt — lämnar aldrig motorn. */
  sku: string;
  marke: string | null;
  /** Säkerhetsuppgifter på svenska, i den ordning de står i källan. */
  sakerhet: string[];
  kallHash: string;
  /** ISO-tid för senaste utvinning. */
  at: string;
}

/** Det publika svaret — exakt det butiken visar, inget mer. */
export interface GpsrPublik {
  marke: string | null;
  ansvarig: Ansvarig;
  sakerhet: string[];
}

export function tillPublik(p: Pick<GpsrPost, "marke" | "sakerhet">): GpsrPublik {
  return { marke: p.marke, ansvarig: { ...AOSOM_ANSVARIG }, sakerhet: [...p.sakerhet] };
}

const MAX_RADER = 12;
const MAX_RAD = 280;

/**
 * Tvättar modellens svar innan det sparas. Svaret går rakt ut på en publik
 * sida, så allt som inte är en kort svensk mening faller bort: tomma rader,
 * dubbletter, överlånga rader, och rader som nämner leverantören eller
 * platshållaren (då har modellen läst in något den inte skulle).
 */
export function tvattaSakerhet(rader: unknown): string[] {
  if (!Array.isArray(rader)) return [];
  const sett = new Set<string>();
  const ut: string[] = [];
  for (const r of rader) {
    if (typeof r !== "string") continue;
    const s = r.replace(/\s+/g, " ").trim();
    if (s.length < 4 || s.length > MAX_RAD) continue;
    if (/aosom|mh\s*handel|\[brand|brand name/i.test(s)) continue;
    const nyckel = s.toLowerCase();
    if (sett.has(nyckel)) continue;
    sett.add(nyckel);
    ut.push(s);
    if (ut.length >= MAX_RADER) break;
  }
  return ut;
}
