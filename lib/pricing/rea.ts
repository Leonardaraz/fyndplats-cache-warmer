// lib/pricing/rea.ts
//
// AUTOMATISK REA: när ett pris verkligen har sänkts får varianten ett jämförpris
// i Wix, och butiken visar "Rea" med det överstrukna priset. Leonards beslut
// 2026-11-01 ("Fixa"), efter att 49 av 50 reaskyltar utanför auktionen visade
// ett överstruket pris vi inte tagit de senaste 30 dagarna.
//
// LAGEN. 7 a § prisinformationslagen (2004:347), ordagrant:
//
//   "Om en produkt tillhandahålls med angivande av att priset har sänkts ska
//    även det tidigare priset anges. Det tidigare pris som ska anges ska vara
//    det lägsta pris som näringsidkaren har tillämpat för produkten under de
//    senaste 30 dagarna före prissänkningen. Om priset under denna tid har
//    sänkts gradvis, ska i stället det pris som gällde före den första
//    prissänkningen anges."
//
// HUR REGELN LÄSES HÄR. Varje beslut är åt det försiktiga hållet: ett för lågt
// jämförpris visar en mindre rabatt än vi har rätt till, ett för högt är det
// lagen förbjuder.
//
//   - Sänkningen är tidpunkten då priset gick ned till dagens pris. Gick det
//     ned i flera steg inom 30 dagar före den sänkningen är det en gradvis
//     sänkning, och den första sänkningen i följden räknas.
//   - Jämförpriset är det LÄGSTA pris vi tagit de 30 dagarna (och ett dygn
//     till, `MARGINAL_MS`) före den första sänkningen. Vid en gradvis sänkning
//     säger lagen "det pris som gällde före den första prissänkningen"; det
//     lägsta priset i fönstret är aldrig högre än det, och det är också
//     EU-direktivets lägsta krav (art. 6a.5).
//   - Historiken måste täcka hela fönstret. Vet vi inte vad priset var 30 dagar
//     före sänkningen får ingen sänkning påstås: en ny produkt har ingen rea.
//     En tid då ingen körning läste priserna (en lucka) täcker ingenting.
//   - En tid då varianten inte gick att köpa (dold produkt eller variant) är
//     inget pris vi tillämpat, och räknas inte. En slutsåld variant som visas
//     med sitt pris räknas: att ta med ett pris kan bara sänka det lägsta.
//
// VAD HISTORIKEN INTE SER. Priset läses varje timme (rea-kor.ts). Det som
// fylls bakåt ur butikens dagliga avläsning (02:30 UTC) ser bara ett pris om
// dagen: en sänkning som kom och gick mellan två avläsningar syns inte där.
// Det gäller bara de första 30 dagarna efter starten, och bara produkter med en
// variant (`seedPunkter`).
//
// HUSETS REGLER (Leonard 2026-11-01):
//   - Bara en sänkning på minst 10 % ger rea. Synkens små justeringar på 10–20
//     kr ska inte bli en reaskylt.
//   - Skylten visas högst 30 dagar från den första sänkningen, sedan försvinner
//     den av sig själv. Annars hade en följd små sänkningar kunnat hålla en
//     rabatt uppe för alltid.
//   - En produkt som varit med i fyndauktionen under fönstret får ingen
//     automatisk rea: auktionens lägsta pris är ett pris vi tillämpat, och det
//     står inte i en historik som byggts av dagliga avläsningar.
//
// ÖREN, INTE KRONOR. Alla belopp är heltal i öre, som i butikens prishistorik
// (headless-site lib/price-history.ts).

export const DAG_MS = 86_400_000;
/** Lagens fönster före sänkningen. */
export const FONSTER_MS = 30 * DAG_MS;
/** Husets regel: skylten visas högst så länge från den första sänkningen. */
export const REA_LANGD_MS = 30 * DAG_MS;
/** Husets regel: minsta sänkning som ger rea, i procent av jämförpriset. */
export const MIN_SANKNING_PROCENT = 10;
/**
 * Fönstret räknas ett dygn längre bakåt än lagen kräver. Historiken ser en
 * prisändring först när den läses (varje timme, och en gång per dygn i det som
 * fyllts bakåt ur butikens avläsning), så en tidpunkt i historiken kan ligga
 * upp till ett dygn efter den verkliga. Ett längre fönster kan bara sänka det
 * lägsta priset: det är åt det försiktiga hållet.
 */
export const MARGINAL_MS = DAG_MS;
/**
 * Så länge historiken sparas. Den första sänkningen kan ligga 30 dagar bak, och
 * fönstret före den 31 dagar till: 61 dagar och en marginal.
 */
export const SPAR_MS = 65 * DAG_MS;

/** Var fönstret börjar för en första sänkning vid `tForsta` (ms). */
export function fonsterStartFor(tForsta: number): number {
  return tForsta - FONSTER_MS - MARGINAL_MS;
}

/** En avläsning: från tidpunkten `t` gällde priset `p` (öre). `null` = gick inte att köpa. */
export interface Prispunkt {
  t: string;
  p: number | null;
}

export type ReaSkal =
  | "inte_utbjuden" // varianten går inte att köpa nu
  | "ingen_sankning" // dagens pris kom inte genom en sänkning
  | "for_gammal" // den första sänkningen är mer än 30 dagar gammal
  | "ofullstandig" // historiken täcker inte fönstret före den första sänkningen
  | "ny" // varianten gick inte att köpa när fönstret började
  | "inget_pris_i_fonstret" // varianten gick inte att köpa någon gång i fönstret
  | "under_grans" // mindre än 10 %
  | "auktion" // en auktion i fönstret (avgörs av körningen)
  | "lucka"; // en tid utan avläsning i fönstret (avgörs av körningen)

export type ReaBeslut =
  | {
      rea: true;
      /** Jämförpriset i öre. */
      tidigareOre: number;
      /** När den första sänkningen i följden syntes (ISO). Skylten visas högst 30 dagar från den. */
      forstaSankning: string;
      /** Var fönstret för det lägsta priset börjar (ISO). Luckor och auktioner prövas från den. */
      fonsterFran: string;
      /** Sänkningar i följden: 1 är en sänkning, 2 eller fler en gradvis. */
      sankningar: number;
    }
  | { rea: false; skal: ReaSkal; forstaSankning?: string; fonsterFran?: string };

interface Segment {
  start: number;
  p: number | null;
}

function giltigtPris(p: unknown): p is number {
  return typeof p === "number" && Number.isInteger(p) && p > 0;
}

/** Punkterna som en trappa: en tidpunkt ett pris, och samma pris i följd ett segment. */
function trappa(punkter: readonly Prispunkt[], nuMs: number): Segment[] {
  const rader: Segment[] = [];
  for (const x of punkter) {
    const start = Date.parse(x.t);
    if (!Number.isFinite(start) || start > nuMs) continue;
    if (x.p !== null && !giltigtPris(x.p)) continue;
    rader.push({ start, p: x.p });
  }
  // Stabil sortering: på samma tidpunkt vinner den som stod sist.
  rader.sort((a, b) => a.start - b.start);
  const unika: Segment[] = [];
  for (const r of rader) {
    const sista = unika[unika.length - 1];
    if (sista && sista.start === r.start) unika[unika.length - 1] = r;
    else unika.push(r);
  }
  return slaIhop(unika);
}

/** Samma pris i följd är ett segment; det första behåller sin start. */
function slaIhop<T extends Segment>(s: T[]): T[] {
  const ut: T[] = [];
  for (const x of s) {
    if (ut.length > 0 && ut[ut.length - 1].p === x.p) continue;
    ut.push(x);
  }
  return ut;
}

/**
 * Avgör om varianten har rea just nu, och mot vilket jämförpris.
 *
 * @param punkter       variantens historik, i valfri ordning
 * @param aktuelltOre   priset i Wix nu (öre), `null` när varianten inte går att köpa
 * @param nuMs          nu
 */
export function reaFor(punkter: readonly Prispunkt[], aktuelltOre: number | null, nuMs: number): ReaBeslut {
  if (!giltigtPris(aktuelltOre)) return { rea: false, skal: "inte_utbjuden" };
  const seg = trappa(punkter, nuMs);
  // Dagens pris gäller från nu om historiken inte redan säger det.
  if (seg.length === 0 || seg[seg.length - 1].p !== aktuelltOre) seg.push({ start: nuMs, p: aktuelltOre });

  // De tider varianten gick att köpa, med samma pris efter en paus som ett segment.
  const erbjudna = slaIhop(seg.filter((s): s is { start: number; p: number } => s.p !== null));
  const i = erbjudna.length - 1;
  if (i < 1 || erbjudna[i - 1].p <= erbjudna[i].p) return { rea: false, skal: "ingen_sankning" };

  // Sänkningen till dagens pris, och de sänkningar före den som ligger inom
  // 30 dagar: en obruten följd sänkningar är en gradvis sänkning. Tidpunkterna
  // kan ligga upp till ett dygn sent (`MARGINAL_MS`), och det ger två följder:
  //
  //   - `forsta`, följden vi ANVÄNDER (skylten räknas från den): bara
  //     sänkningar som säkert låg inom 30 dagar (29 dygn i historiken).
  //   - `tidigast`, följden lagen KAN räkna: alla sänkningar som kan ha legat
  //     inom 30 dagar (31 dygn i historiken).
  //
  // Det lägsta priset tas över de 30 dagarna (plus marginalen) före den
  // tidigaste möjliga sänkningen och fram till den första vi använder. Då är
  // jämförpriset aldrig högre än lagens, vilken av följderna lagen än räknar:
  // vid en gradvis sänkning läser den strängaste tolkningen det lägsta priset
  // de 30 dagarna före den FÖRSTA sänkningen i följden.
  const tSankning = erbjudna[i].start;
  let forsta = i;
  while (
    forsta - 2 >= 0 &&
    erbjudna[forsta - 2].p > erbjudna[forsta - 1].p &&
    erbjudna[forsta - 1].start >= tSankning - (FONSTER_MS - MARGINAL_MS)
  ) {
    forsta--;
  }
  let tidigast = forsta;
  while (
    tidigast - 2 >= 0 &&
    erbjudna[tidigast - 2].p > erbjudna[tidigast - 1].p &&
    erbjudna[tidigast - 1].start >= tSankning - (FONSTER_MS + MARGINAL_MS)
  ) {
    tidigast--;
  }
  const tForsta = erbjudna[forsta].start;
  const forstaSankning = new Date(tForsta).toISOString();
  if (nuMs >= tForsta + REA_LANGD_MS) return { rea: false, skal: "for_gammal", forstaSankning };

  const fonsterStart = fonsterStartFor(erbjudna[tidigast].start);
  const fonsterFran = new Date(fonsterStart).toISOString();
  if (seg[0].start > fonsterStart) return { rea: false, skal: "ofullstandig", forstaSankning, fonsterFran };
  // Gick varianten inte att köpa när fönstret börjar är den ny i butiken, och
  // en ny produkt har ingen rea förrän den kan beläggas (samma hållning som
  // butikens lib/price-history.ts: kravet gäller per produkt).
  let vidStart: number | null = null;
  for (const s of seg) if (s.start <= fonsterStart) vidStart = s.p;
  if (vidStart === null) return { rea: false, skal: "ny", forstaSankning, fonsterFran };

  let lagsta = Infinity;
  for (let j = 0; j < seg.length; j++) {
    const p = seg[j].p;
    if (p === null) continue;
    const slut = j + 1 < seg.length ? seg[j + 1].start : Infinity;
    if (slut > fonsterStart && seg[j].start < tForsta && p < lagsta) lagsta = p;
  }
  if (!Number.isFinite(lagsta)) return { rea: false, skal: "inget_pris_i_fonstret", forstaSankning, fonsterFran };
  if (100 * (lagsta - aktuelltOre) < MIN_SANKNING_PROCENT * lagsta) {
    return { rea: false, skal: "under_grans", forstaSankning, fonsterFran };
  }
  return { rea: true, tidigareOre: lagsta, forstaSankning, fonsterFran, sankningar: i - forsta + 1 };
}

/** En auktion: från start till slut (`slut` saknas medan den pågår). */
export interface Auktionsperiod {
  start: number;
  slut: number | null;
}

/** Låg en auktion i fönstret (från `fonsterFran`, ur `reaFor`) eller efter det? */
export function auktionIFonstret(perioder: readonly Auktionsperiod[], fonsterFran: string, nuMs: number): boolean {
  const fonsterStart = Date.parse(fonsterFran);
  if (!Number.isFinite(fonsterStart)) return true;
  return perioder.some((a) => a.start < nuMs && (a.slut === null || a.slut > fonsterStart));
}

/**
 * En tid då ingen körning läste priserna: mellan `fran` och `till` (ISO). En
 * sänkning som kom och gick under den syns inte i historiken, så ett fönster som
 * täcker en lucka bevisar ingenting.
 */
export interface Lucka {
  fran: string;
  till: string;
}

/** Längre än så mellan två körningar som sparade historiken är en lucka (jobbet går varje timme). */
export const MAX_GLAPP_MS = 3 * 60 * 60 * 1000;

/** Låg en lucka i fönstret (från `fonsterFran`, ur `reaFor`) eller efter det? */
export function luckaIFonstret(luckor: readonly Lucka[], fonsterFran: string, nuMs: number): boolean {
  const fonsterStart = Date.parse(fonsterFran);
  if (!Number.isFinite(fonsterStart)) return true;
  return luckor.some((l) => {
    const fran = Date.parse(l.fran);
    const till = Date.parse(l.till);
    if (!Number.isFinite(fran) || !Number.isFinite(till)) return true;
    return fran < nuMs && till > fonsterStart;
  });
}

/** Luckorna som fortfarande kan ligga i ett fönster. */
export function trimmaLuckor(luckor: readonly Lucka[], nuMs: number): Lucka[] {
  return luckor.filter((l) => !(Date.parse(l.till) <= nuMs - SPAR_MS));
}

/** Historiken med en ny avläsning. Samma pris som senast ändrar ingenting. */
export function laggTill(punkter: readonly Prispunkt[], t: string, p: number | null): { punkter: Prispunkt[]; andrad: boolean } {
  const sista = punkter[punkter.length - 1];
  if (sista && sista.p === p) return { punkter: [...punkter], andrad: false };
  return { punkter: [...punkter, { t, p }], andrad: true };
}

/**
 * Historiken utan det som är äldre än `SPAR_MS`. Den sista punkten före gränsen
 * behålls: den säger vilket pris som gällde när det sparade fönstret börjar.
 */
export function trimma(punkter: readonly Prispunkt[], nuMs: number): { punkter: Prispunkt[]; andrad: boolean } {
  const grans = nuMs - SPAR_MS;
  const sorterade = [...punkter].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  let sistaFore = -1;
  for (let i = 0; i < sorterade.length; i++) if (Date.parse(sorterade[i].t) <= grans) sistaFore = i;
  if (sistaFore <= 0) return { punkter: sorterade, andrad: false };
  return { punkter: sorterade.slice(sistaFore), andrad: true };
}

/** Kronor (Wix belopp som text eller tal) till öre. `null` för allt som inte är ett pris. */
export function tillOre(belopp: unknown): number | null {
  if (belopp === null || belopp === undefined || belopp === "") return null;
  const n = Number(belopp);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

/** Öre till Wix belopp ("1599" eller "1599.5"). */
export function tillBelopp(ore: number): string {
  return String(Math.round(ore) / 100);
}

// ── Historik ur butikens dagliga avläsning ───────────────────────────────

/** En rad ur butikens prishistorik (headless-site, `FyndplatsPrishistorik`). */
export interface Dagsrad {
  /** "2026-10-31" */
  datum: string;
  prisOre: number;
}

/** Butikens avläsning går 02:30 UTC (headless-site vercel.json, `/api/cron/pris-snapshot`). */
export const AVLASNING_KLOCKAN = "T02:30:00.000Z";

/**
 * En dag räknas som fullständigt avläst när den har minst hälften så många rader
 * som den dag som har flest. En dag där avläsningen föll (få eller inga rader)
 * säger ingenting om de produkter som saknas, så den hoppas över.
 */
export function fullstandigaDagar(antalPerDag: ReadonlyMap<string, number>): Set<string> {
  let max = 0;
  for (const n of antalPerDag.values()) if (n > max) max = n;
  const ut = new Set<string>();
  for (const [dag, n] of antalPerDag) if (max > 0 && n * 2 >= max) ut.add(dag);
  return ut;
}

/**
 * Historiken för en produkt med EN variant, byggd ur butikens dagliga
 * avläsning. En fullständig dag utan rad för produkten betyder att den inte
 * gick att köpa den dagen (butiken avläser bara synliga produkter).
 *
 * ☠️ BARA FÖR EN PRODUKT MED EN VARIANT. Butiken sparar det lägsta priset bland
 * produktens varianter; för en produkt med flera är det inte någon enskild
 * variants pris.
 */
export function seedPunkter(rader: readonly Dagsrad[], fullstandiga: ReadonlySet<string>): Prispunkt[] {
  const perDag = new Map<string, number>();
  for (const r of rader) if (/^\d{4}-\d{2}-\d{2}$/.test(r.datum) && giltigtPris(r.prisOre)) perDag.set(r.datum, r.prisOre);
  const dagar = [...new Set([...fullstandiga, ...perDag.keys()])].sort();
  const ut: Prispunkt[] = [];
  for (const dag of dagar) {
    const p = perDag.get(dag);
    if (p === undefined && !fullstandiga.has(dag)) continue;
    const punkt = { t: `${dag}${AVLASNING_KLOCKAN}`, p: p ?? null };
    if (ut.length > 0 && ut[ut.length - 1].p === punkt.p) continue;
    ut.push(punkt);
  }
  // En historik som börjar med "gick inte att köpa" behåller den punkten: den
  // säger att produkten inte fanns i butiken innan dess.
  return ut;
}

/**
 * Slår ihop en historik ur butikens avläsning med den som redan finns: bara de
 * punkter som ligger före den befintliga historikens första punkt läggs till.
 */
export function slaIhopMedSeed(befintliga: readonly Prispunkt[], seed: readonly Prispunkt[]): { punkter: Prispunkt[]; tillagda: number } {
  const sorterade = [...befintliga].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  if (sorterade.length === 0) return { punkter: [...seed], tillagda: seed.length };
  const forsta = Date.parse(sorterade[0].t);
  const fore = seed.filter((p) => Date.parse(p.t) < forsta);
  if (fore.length === 0) return { punkter: sorterade, tillagda: 0 };
  const ihop: Prispunkt[] = [];
  for (const p of [...fore, ...sorterade]) {
    if (ihop.length > 0 && ihop[ihop.length - 1].p === p.p) continue;
    ihop.push(p);
  }
  return { punkter: ihop, tillagda: fore.length };
}
