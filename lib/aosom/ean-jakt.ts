// Finns EAN-koden i Aosoms PRODUKTMANUAL? — rena funktioner, ingen IO.
//
// BAKGRUNDEN (2026-09-15). Leonard fragade om EAN-kolumnen verkligen ar tom
// och om koden gar att fa pa nagot annat satt. Kolumnen ar mätt tom — 0 av
// 6 095, och den ligger som kolumn TVA, sa den gar inte att missa. Men samma
// matning visade en kolumn ingen nagonsin last: `pdf`, ifylld pa 5 917 rader.
// Det ar produktmanualen, och en manual trycker nastan alltid streckkoden.
//
// ☠️ EN SLUMPMASSIG TRETTONSIFFRING KLARAR KONTROLLSIFFRAN I ETT FALL AV TIO.
// En PDF ar full av tal — matt, artikelnummer, datum, koordinater. Darfor
// racker det INTE att rakna traffar: en grind som inte kan skilja signal fran
// brus ar samma klass som SKU-kollen som itererade en tom lista. Tre spärrar,
// och den tredje ar den som avgor:
//
//   1. Talet far inte sitta i en LANGRE siffersekvens (annars klipper man ut
//      tretton siffror ur ett trettiosiffrigt id och kallar det en traff).
//   2. RAtalet rapporteras bredvid: passerar ~10 % av kandidaterna ar det brus,
//      passerar 100 % av tva ar det nagot annat.
//   3. GS1-LANDSPREFIXET. Aosom ar en tysk leverantor och dealproffsens koder
//      for samma artiklar ligger pa 425x (mätt 2026-09-14, 186 av 187). Ett
//      tal som bade klarar kontrollsiffran OCH borjar pa 400-440 ar inte brus.

import { delaRad } from "./feed-info";

/** GS1:s kontrollsiffra, vaxlande vikt 1/3 fran hoger. */
export function arGiltigGtin13(s: string): boolean {
  if (!/^\d{13}$/.test(s)) return false;
  let summa = 0;
  for (let i = 0; i < 12; i++) {
    summa += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (summa % 10)) % 10 === Number(s[12]);
}

/**
 * Tysk GS1-prefix (400-440).
 *
 * Inte ett bevis i sig — men ett tal som klarar bada testerna ar inte ett
 * matt eller ett datum som rakat se ut som en streckkod.
 */
export function harTysktPrefix(s: string): boolean {
  const p = Number(s.slice(0, 3));
  return p >= 400 && p <= 440;
}

/** Alla frilaggande trettonsiffringar i en text. */
export function trettonsiffringar(text: string): string[] {
  return text.match(/(?<!\d)\d{13}(?!\d)/g) ?? [];
}

export interface EanFynd {
  /** Hur manga frilaggande trettonsiffringar texten innehall. */
  kandidater: number;
  /** Hur manga av dem som klarar GS1:s kontrollsiffra. */
  giltiga: string[];
  /** Av de giltiga: de med tyskt GS1-prefix. Det ar de som betyder nagot. */
  tyska: string[];
}

export function sokEan(texter: readonly string[]): EanFynd {
  const alla = new Set<string>();
  let kandidater = 0;
  for (const t of texter) {
    for (const k of trettonsiffringar(t)) {
      kandidater++;
      alla.add(k);
    }
  }
  const giltiga = [...alla].filter(arGiltigGtin13);
  return { kandidater, giltiga, tyska: giltiga.filter(harTysktPrefix) };
}

/**
 * Plockar ut pdf-lankarna ur feedens rader.
 *
 * ⚠️ GAR INTE VIA `parseAosomFeed`. Den plockar bara kolumner den kanner vid
 * namn, och `AosomRow` har inget pdf-falt — precis samma blinda flack som
 * gjorde att ingen nagonsin sett EAN-kolumnen. Den har funktionen laser
 * rubrikraden och letar upp kolumnen dar, sa den kan inte missa av samma skal.
 *
 * ☠️ DELAR `delaRad` MED feed-info. En egen CSV-tolk hade varit en tvilling,
 * och en tvilling glider isar — husets vanligaste bugg.
 */
export function pdfLankar(csv: string, antal: number): string[] {
  const rader = csv.split(/\r?\n/).filter((r) => r.trim().length > 0);
  if (rader.length === 0) return [];
  const rubriker = delaRad(rader[0]).map((h) => h.trim().toLowerCase());
  const idx = rubriker.indexOf("pdf");
  if (idx < 0) return [];

  const ut: string[] = [];
  for (let i = 1; i < rader.length && ut.length < antal; i++) {
    const v = (delaRad(rader[i])[idx] ?? "").trim();
    if (v.startsWith("http")) ut.push(v);
  }
  return ut;
}

/**
 * Plockar ut läsbar text ur en PDF.
 *
 * En PDF lagrar sin text i `stream`-block som oftast är FlateDecode-packade.
 * Vi packar upp det som går och lämnar resten — en manual som inte går att
 * läsa ska rapporteras som OLÄSLIG, inte som "inga fynd". Skillnaden mellan
 * "hittade ingen kod" och "kunde inte titta" är hela skillnaden mellan en
 * grind och en vana, och huset har redan betalat för att lära sig det
 * (SKU-kollen som itererade en tom lista).
 *
 * ⚠️ RÅTEXTEN LÄSES OCKSÅ. Många PDF:er bär okomprimerad metadata och XMP,
 * och en streckkod står ofta i filens egen produktinformation.
 */
export function pdfTexter(buf: Buffer): { texter: string[]; strommar: number; upppackade: number } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const zlib = require("node:zlib") as typeof import("node:zlib");
  const rå = buf.toString("latin1");
  const texter: string[] = [rå];
  let strommar = 0;
  let upppackade = 0;

  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rå)) !== null) {
    const start = m.index + m[0].length;
    const slut = rå.indexOf("endstream", start);
    if (slut < 0) continue;
    strommar++;
    try {
      const ut = zlib.inflateSync(Buffer.from(rå.slice(start, slut), "latin1"));
      texter.push(ut.toString("latin1"));
      upppackade++;
    } catch {
      // Inte packad med Flate, eller trasig. Råtexten täcker den ändå.
    }
  }
  return { texter, strommar, upppackade };
}
