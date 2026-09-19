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

import zlib from "node:zlib";

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
  /** Hur många frilaggande trettonsiffringar texten innehöll. */
  kandidater: number;
  /** Hur många av dem som klarar GS1:s kontrollsiffra. */
  giltiga: string[];
  /** Av de giltiga: de med tyskt GS1-prefix. Det är de som betyder något. */
  tyska: string[];
}

/**
 * Löpande räkning, så en stor text aldrig behöver ligga kvar i minnet.
 *
 * ☠️ FORMEN ÄR VALD AV EN KRASCH (2026-09-15). Första versionen samlade ALLA
 * texter ur en PDF i en array och sökte i dem efteråt. Lambdan dog:
 * `instance was killed because it ran out of available memory`, och det gick
 * INTE via mitt try/catch — ett try/catch skyddar mot fel som kastas, inte mot
 * en process som tar slut. Exakt samma familj som den obegränsade fan-outen i
 * `runDailySync`, som låg nere i 57 timmar.
 */
export interface EanRakning {
  kandidater: number;
  koder: Set<string>;
}

export function nyRakning(): EanRakning {
  return { kandidater: 0, koder: new Set() };
}

export function raknaText(text: string, ut: EanRakning): void {
  for (const k of trettonsiffringar(text)) {
    ut.kandidater++;
    if (arGiltigGtin13(k)) ut.koder.add(k);
  }
}

export function summera(r: EanRakning): EanFynd {
  const giltiga = [...r.koder];
  return { kandidater: r.kandidater, giltiga, tyska: giltiga.filter(harTysktPrefix) };
}

export function sokEan(texter: readonly string[]): EanFynd {
  const r = nyRakning();
  for (const t of texter) raknaText(t, r);
  return summera(r);
}

/**
 * Komprimerad ström vi ens försöker packa upp.
 *
 * ☠️ TAKET ÄR DET SOM SKILJER TEXT FRÅN BILD. En manual är mest foton, och en
 * Flate-packad bild expanderar tiotals gånger — det var de strömmarna som tog
 * minnet. En textström i en PDF är några kilobyte; två megabyte är gott om
 * marginal och utesluter varje bild värd namnet.
 */
const MAX_STROM_BYTE = 2_000_000;

/** Tak på det UPPACKADE — `inflateSync` kastar i stället för att svälla. */
const MAX_UPPACKAT_BYTE = 8_000_000;

export interface PdfResultat extends EanFynd {
  strommar: number;
  upppackade: number;
  /** Strömmar vi medvetet hoppade över — nästan alltid bilder. */
  forStora: number;
}

/**
 * Söker EAN i en PDF utan att hålla dess text i minnet.
 *
 * ⚠️ RÅTEXTEN LÄSES OCKSÅ. Många PDF:er bär okomprimerad metadata och XMP, och
 * en streckkod står ofta i filens egen produktinformation.
 */
export function sokEanIPdf(buf: Buffer): PdfResultat {
  const rå = buf.toString("latin1");
  const r = nyRakning();
  raknaText(rå, r);

  let strommar = 0;
  let upppackade = 0;
  let forStora = 0;

  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rå)) !== null) {
    const start = m.index + m[0].length;
    const slut = rå.indexOf("endstream", start);
    if (slut < 0) continue;
    strommar++;
    if (slut - start > MAX_STROM_BYTE) {
      forStora++;
      continue;
    }
    try {
      const ut = zlib.inflateSync(Buffer.from(rå.slice(start, slut), "latin1"), {
        maxOutputLength: MAX_UPPACKAT_BYTE,
      });
      raknaText(ut.toString("latin1"), r);
      upppackade++;
    } catch {
      // Inte Flate, trasig, eller större än taket. Råtexten täcker den ändå.
    }
  }
  return { ...summera(r), strommar, upppackade, forStora };
}

/**
 * Plockar ut pdf-länkarna ur feedens rader.
 *
 * ⚠️ GÅR INTE VIA `parseAosomFeed`. Den plockar bara kolumner den känner vid
 * namn, och `AosomRow` har inget pdf-fält — precis samma blinda fläck som
 * gjorde att ingen någonsin sett EAN-kolumnen. Den här funktionen läser
 * rubrikraden och letar upp kolumnen där, så den kan inte missa av samma skäl.
 *
 * ☠️ DELAR `delaRad` MED feed-info. En egen CSV-tolk hade varit en tvilling,
 * och en tvilling glider isär — husets vanligaste bugg.
 */
export function pdfLankar(csv: string, antal: number): string[] {
  const rader = csv.split(/\r?\n/).filter((r) => r.trim().length > 0);
  if (rader.length === 0) return [];
  const rubriker = delaRad(rader[0]).map((h) => h.trim().toLowerCase());
  const idx = rubriker.indexOf("pdf");
  if (idx < 0) return [];

  // ☠️ SPRIDS OVER HELA FEEDEN, inte de forsta N raderna.
  //
  // Feeden ar sorterad, sa de forsta raderna ar en produktfamilj — och husets
  // egen bildmatning (2026-08-27) visade just att man maste ta "tio ur vardera
  // tredjedel" for att veta nagot om sortimentet. Ett stickprov fran toppen
  // mater den familjen, inte Aosom.
  const ut: string[] = [];
  const steg = Math.max(1, Math.floor((rader.length - 1) / antal));
  for (let i = 1; i < rader.length && ut.length < antal; i += steg) {
    const v = (delaRad(rader[i])[idx] ?? "").trim();
    if (v.startsWith("http")) ut.push(v);
  }
  return ut;
}
