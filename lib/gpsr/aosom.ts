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
// INGA MODELLANROP I DRIFT (Leonard 2026-09-27). Säkerhetstexten översätts en
// gång, utanför motorn, och checkas in i aosom-data.json. Motorn läser bara
// filen. Se scripts/gpsr-kandidater.ts för hur nya och ändrade produkter tas
// fram och scripts/gpsr-bygg.ts för hur översättningarna förs in.
//
// MÄRKET står inte i feeden som fält — beskrivningarna bär platshållaren
// "[BRAND NAME]", eftersom Aosom säljer varorna omärkta till återförsäljare.
// Det står däremot först i adressen till Aosoms egen produktsida
// (aosom.de/item/homcom-…). Uppmätt 2026-09-27 på 6 234 rader: alla utom 25
// har ett av märkena nedan där. "homcomr" är samma märke med ®.

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

/**
 * Meningar i den tyska texten som KAN vara säkerhetsinformation. Det är vad
 * som översätts — resten av texten är säljtext och mått.
 *
 * Mönstret är brett med flit: det ska hellre ta med en säljmening för mycket
 * (översättningen sållar bort den) än tappa en varning. Uppmätt 2026-09-27:
 * 9 475 meningar på 4 223 produkter, 633 000 tecken. Ett bredare mönster
 * (kg, Kinder, Montage) gav 55 000 meningar av nästan bara brus.
 */
const KANDIDAT_RE = /(warn|achtung|vorsicht|gefahr|nicht geeignet|ungeeignet|aufsicht|beaufsichtig|verschluck|erstick|kleinteil|kipp|verankern|wandbefestigung|an der wand (zu )?befestig|wandhalterung|nur für den (innen|außen|haus|privat)|nur im innen|nur für (innen|außen)|nicht für den (gewerb|kommerz|außen|innen)|en ?71|en ?1176|en ?957|en ?12520|ce[- ]?(zert|kennz|konform|gepr)|tüv|gs[- ]?(zeich|gepr)|stromschlag|brandgefahr|feuergefahr|verbrennung|unbeaufsichtigt|ab \d+ jahren|ab \d+ monaten|im alter (von|ab|zwischen)|altersempfehlung|empfohlenes alter|jahre alt|belastbar|max(\.|imale)? ?(belast|trag|gewicht|nutzer|benutzer|last)|tragfähig|tragkraft|nutzergewicht|benutzergewicht|körpergröße (bis|von))/i;

function meningar(html: string): string[] {
  const text = html
    .replace(/<br\s*\/?>|<\/(p|li|div|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\[BRAND NAME\]\s*/gi, "")
    .replace(/[ \t]+/g, " ");
  return text
    .split(/\n+|(?<=[.!?])\s+(?=[A-ZÄÖÜ✔•])/)
    .map((s) => s.replace(/^[✔•\-\s]+/, "").trim())
    .filter((s) => s.length > 3);
}

/** Kandidatmeningarna för en produkt, punktlistan först, utan dubbletter. */
export function kandidatMeningar(beskrivningHtml: string, punkterHtml: string): string[] {
  const alla = [...meningar(punkterHtml), ...meningar(beskrivningHtml)];
  return [...new Set(alla.filter((s) => KANDIDAT_RE.test(s)))];
}

/**
 * Fingeravtryck för kandidatmeningarna. Skiljer det sig från det sparade har
 * Aosom skrivit om säkerhetstexten, och produkten ska översättas igen.
 */
export function kandidatHash(k: readonly string[]): string {
  return createHash("sha256").update(k.join("\n")).digest("hex").slice(0, 16);
}

/** En post i aosom-data.json, nycklad på Aosoms artikelnummer. */
export interface GpsrDataPost {
  /** Märket, eller null. */
  m: string | null;
  /** Säkerhetsinformation på svenska. */
  s: string[];
  /** kandidatHash för den tyska texten översättningen gjordes från. */
  h: string;
}

export interface GpsrDataFil {
  version: 1;
  /** ISO-datum för senaste bygget. */
  genererad: string;
  poster: Record<string, GpsrDataPost>;
}

/** Det publika svaret — exakt det butiken visar, inget mer. */
export interface GpsrPublik {
  marke: string | null;
  ansvarig: Ansvarig;
  sakerhet: string[];
}

export function tillPublik(p: Pick<GpsrDataPost, "m" | "s">): GpsrPublik {
  return { marke: p.m, ansvarig: { ...AOSOM_ANSVARIG }, sakerhet: [...p.s] };
}

const MAX_RADER = 12;
const MAX_RAD = 280;

/**
 * Tvättar en översättning innan den förs in. Raderna går rakt ut på en publik
 * sida, så allt som inte är en kort mening faller bort: tomma rader,
 * dubbletter, överlånga rader, och rader som nämner leverantören eller
 * platshållaren.
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

/** Talen i en text, normaliserade: "1,5" och "1.5" blir "1.5", tusental utan mellanrum. */
function tal(text: string): string[] {
  return (text.replace(/(\d)[\s .](?=\d{3}\b)/g, "$1").match(/\d+(?:[.,]\d+)?/g) ?? [])
    .map((t) => t.replace(",", "."));
}

/**
 * Talen i en svensk rad som INTE finns i den tyska källan. En översättning
 * får aldrig hitta på en siffra — en maxbelastning eller åldersgräns som inte
 * står på varan är en felaktig säkerhetsuppgift.
 */
export function paHittadeTal(sv: string, tyska: readonly string[]): string[] {
  const text = tyska.join(" ");
  // Även varje heltal för sig: "EN71-1.2.3" är tre delnummer, inte decimaltalet
  // 1.2, och den svenska raden skriver dem "EN 71-1, -2, -3".
  const kalla = new Set([...tal(text), ...(text.match(/\d+/g) ?? [])]);
  return tal(sv).filter((t) => !kalla.has(t));
}
