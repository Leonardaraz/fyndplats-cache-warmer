// VEVOR-läsaren: en körning läser de produktsidor som står på tur.
//
// VAD EN KÖRNING GÖR, i ordning:
//   1. Avstängd, fryst eller upptagen: gör ingenting.
//   2. robots.txt, en gång per dygn (lib/vevor/robots.ts). Går den inte att
//      läsa läses ingenting den körningen.
//   3. Kartan, en gång per dygn: nya produktadresser blir rader i kön.
//   4. Prioriteringen, en gång i timmen (lib/vevor/prioritet.ts).
//   5. Kontrollsidorna: tio kända produkter läses först.
//   6. Kön: sidor vars tid passerat, en i taget, högst en per sekund. En sida
//      som robots.txt spärrar hämtas inte.
//   7. Spärrarna, och sedan skrivningen.
//
// ☠️ VID 403, 429, CAPTCHA ELLER TOM SIDA FRYSER LÄSAREN. Ingenting från
// körningen skrivs, ett larm går, och läsaren står still tills en människa
// tinar den (workflowen "VEVOR — läsaren"). Inget nytt försök av sig själv:
// en spärr är VEVOR:s svar, och det är Leonards sak att tolka det.
//
// ☠️ SPÄRRARNA SKRIVER INGEN AVLÄSNING FRÅN KÖRNINGEN, inte bara den misstänkta:
//   - en kontrollsida saknar pris, lager eller artikelnummer
//   - mer än 10 % av sidorna gick inte att tolka
//   - mer än 40 % av de giltiga sidorna är slutsålda (normalt ~23 %)
//   - mer än 20 % av sidorna saknas (normalt ~6 % av kartans adresser)
// De tre första är Leonards (2026-10-28), den fjärde skyddar samma sak: en
// layoutändring eller en spärr som svarar 404 ser ut som tusen borttagna
// varor. Ingen skada är skedd: avläsningarna åldras, och efter tolv timmar är
// artikeln okänd (lib/vevor/rad.ts).
//
// ☠️ EN SPÄRR FÅR INTE LÅSA KÖN. Sidorna som lästes läggs tillbaka i kön,
// utspridda över två timmar, så att samma sidor inte läses ihop igen. Annars
// hade en klunga riktigt slutsålda varor fällt varje körning för alltid. En
// kontrollsida som faller byts ut och väljs inte igen på en vecka: en enda
// udda produkt hade annars stoppat läsaren för gott. Larmet går först när tre
// körningar i följd stoppats. Ett verkligt fel stoppar varje körning, en
// slumpvis klunga gör det inte.
//
// ☠️ BORTA KRÄVER TVÅ SIGNALER MED MINST ETT DYGN EMELLAN. En signal är en
// 404, en flytt bort från produktsidan, eller en sida utan produktdata när
// adressen saknats i kartan i ett dygn. En sida som läses som en giltig
// produkt är aldrig borta, vad kartan än säger: den går att beställa.
//
// ☠️ LOGGEN, SVARET OCH LARMET BÄR BARA ANTAL. Inga artikelnummer, adresser
// eller priser: repot och dess Actions-loggar är publika.

import { randomUUID } from "node:crypto";
import {
  hamta,
  hamtaFil,
  harSparrmarkor,
  Takt,
  tillatenSokvag,
  type Blockering,
  type Hamtare,
  type Svar,
} from "./hamtning";
import { MAX_ROBOTS_BYTE, ROBOTS_SOKVAG, reglerFor, tillatenAvRobots, tolkaRobots, type Robotsregler } from "./robots";
import { SIDFRAGA, tolkaProduktsida, webbIdUr, type Sidinnehall, type Tolkning, type Tolkningsfel } from "./sida";
import { lasKartan, type Kartrad } from "./sitemap";
import { INTERVALL_MS, klassbyten, onskadeKlasser, type Prioritetsunderlag } from "./prioritet";
import { VART_FLODE } from "./rad";
import type {
  Avlasning,
  Avlasningsstatus,
  Korningssummering,
  Lasartillstand,
  Sidrad,
  VevorLager,
} from "./lager";

const MINUT = 60_000;
const TIMME = 60 * MINUT;
const DYGN = 24 * TIMME;

/** Antal kontrollsidor. Leonard 2026-10-28. */
export const KONTROLLER = 10;
/** Fler otolkbara än så: skriv ingenting. Leonard 2026-10-28. */
export const MAX_OTOLKBARA = 0.1;
/** Fler slutsålda än så: skriv ingenting. Normalt ~23 % (prompten; 6 av 34 uppmätta). */
export const MAX_SLUTSALDA = 0.4;
/** Fler saknade än så: skriv ingenting. Normalt ~6 % av kartans adresser (2 av 36 uppmätta). */
export const MAX_SAKNADE = 0.2;
/** Under så här många sidor säger en andel ingenting. */
export const MIN_FOR_OTOLKBARA = 10;
export const MIN_FOR_SLUTSALDA = 50;
export const MIN_FOR_SAKNADE = 30;
/** Så många kontrollsidor som saknas i en och samma körning är ingen tillfällighet. */
export const MAX_SAKNADE_KONTROLLER = 3;
/** Så många tillfälliga fel i följd: sluta läsa för den här körningen. */
const MAX_TILLFALLIGA_I_FOLJD = 5;

/** Nya rader ur kartan per körning. Wix skrivkvot delas med hela sajten. */
export const NYA_KARTRADER_PER_KORNING = 500;
/** Mindre karta än så jämfört med det vi redan känner: trasig, rör ingenting. */
const MIN_KARTANDEL = 0.8;

const OM_TILLFALLIGT = 30 * MINUT;
/** Efter första saknas-signalen: nästa läsning efter mer än ett dygn. */
const OM_SAKNAS = 25 * TIMME;
const OM_BORTA = 7 * DYGN;
/** En sida robots.txt spärrar prövas igen när filen lästs om. */
const OM_SPARRAD = DYGN;
const LARMPAUS = 6 * TIMME;
/** Så många körningar i följd ska en spärr ha stoppat innan larmet går. */
export const SPARRAR_FOR_LARM = 3;
/** En stoppad körnings sidor läggs tillbaka utspridda över det här spannet. */
export const ATERLAGG_MIN = 5 * MINUT;
export const ATERLAGG_MAX = 2 * TIMME;
/** En kontrollsida som fallit väljs inte igen på så här länge. */
const UTESLUTEN = 7 * DYGN;
const MAX_UTESLUTNA = 200;
const LAS_TTL = 290_000;
/** Tid som sparas till skrivningen i slutet. */
const SKRIVMARGINAL = 30_000;

export interface LasarDeps {
  lager: VevorLager;
  hamtare?: Hamtare;
  klocka?: () => number;
  vanta?: (ms: number) => Promise<void>;
  /** Ett tal mellan 0 och 1. Sprider återlagda sidor och väljer kontrollsidor. */
  slump?: () => number;
  prioritetsunderlag: () => Promise<Prioritetsunderlag>;
  larma: (amne: string, text: string) => Promise<void>;
}

export interface Korval {
  /** Körd för hand: går även när läsaren är avstängd, men aldrig när den är fryst. */
  manuell: boolean;
  /** Högst så många sidor ur kön, utöver kontrollsidorna. */
  maxSidor: number;
  budgetMs: number;
}

/** En sidas utfall i körningen. */
export interface Behandlad {
  rad: Sidrad;
  avlasning?: Avlasning;
  /** Artikeln som just bekräftats borta, och sidan den lästes från. */
  borta?: { sku: string; webbId: string };
  /** Artikeln vars sida inte gick att läsa: den blir okänd tills nästa giltiga läsning. */
  misslyckad?: { sku: string; webbId: string };
  /** En ny sida att lägga i kön (en flytt till en annan adress). */
  ny?: Sidrad;
  typ: "giltig" | "saknas" | "flyttad" | "tolkningsfel" | "tillfalligt" | "sparrad";
  fel?: Tolkningsfel;
}

const iso = (ms: number) => new Date(ms).toISOString();

function tomSummering(start: number): Korningssummering {
  return {
    start: iso(start),
    slutAt: iso(start),
    utfall: "klar",
    skal: null,
    lasta: 0,
    giltiga: 0,
    iLager: 0,
    slutsalda: 0,
    ejLevererbara: 0,
    saknade: 0,
    flyttade: 0,
    tillfalliga: 0,
    tolkningsfel: {},
    sparrade: 0,
    blockerad: null,
    kontroller: { lasta: 0, ok: 0, fel: 0, saknade: 0, ersatta: 0 },
    robots: null,
    karta: null,
    prioritet: null,
    aterlagda: 0,
    skrivna: { avlasningar: 0, sidor: 0, borta: 0, misslyckade: 0, fel: 0 },
  };
}

function avsluta(
  s: Korningssummering,
  klocka: () => number,
  utfall: Korningssummering["utfall"],
  skal: string | null,
): Korningssummering {
  return { ...s, utfall, skal, slutAt: iso(klocka()) };
}

export function nySidrad(k: Kartrad, nuIso: string): Sidrad {
  return {
    webbId: k.webbId,
    sokvag: k.sokvag,
    klass: "katalog",
    nastaLasning: nuIso,
    sku: null,
    senastForsokAt: null,
    senastUtfall: null,
    senastOkAt: null,
    iKartan: true,
    saknadIKartanSedan: null,
    saknasForstaAt: null,
    borta: false,
  };
}

export function statusFor(s: Sidinnehall): Exclude<Avlasningsstatus, "borta"> {
  if (!s.levererasTillSe || s.flode !== VART_FLODE) return "ej_levererbar";
  return s.saldo > 0 ? "i_lager" : "slut";
}

export function avlasningAv(s: Sidinnehall, r: Sidrad, nuIso: string): Avlasning {
  return {
    ...s,
    egenskaper: Object.entries(s.egenskaper),
    webbId: r.webbId,
    sokvag: r.sokvag,
    lastAt: nuIso,
    status: statusFor(s),
    toppkategoriId: s.kategorier[0]?.id ?? null,
    toppkategori: s.kategorier[0]?.namn ?? null,
    borta: false,
    bortaAt: null,
    misslyckadAt: null,
  };
}

/**
 * Ger varje ny avläsning priset vid artikelns FÖREGÅENDE avläsning
 * (`forraPrisSek`), ur raden som står i lagret innan den skrivs över.
 *
 * VARFÖR (steg 5, 2026-10-29). VEVOR räknar om sina priser från euro, och
 * synken skriver ett nytt pris först när två avläsningar i rad ger samma
 * regelpris (lib/vevor/synk.ts). Avläsningen är en rad per artikel som skrivs
 * över, så den föregående måste följa med här.
 *
 * Går de gamla raderna inte att läsa blir priset null för alla, och då väntar
 * ett nytt pris en avläsning till. Inget annat påverkas, och körningen stoppas
 * inte: priset är det minst brådskande en avläsning bär. Loggraden bär bara
 * antalet, aldrig felet, som kan citera frågan med artikelnumren.
 */
export async function medForraPris(
  lager: Pick<VevorLager, "avlasningar">,
  nya: Map<string, Avlasning>,
): Promise<void> {
  if (nya.size === 0) return;
  let fore = new Map<string, Avlasning>();
  try {
    fore = await lager.avlasningar([...nya.keys()]);
  } catch {
    console.warn(`[vevor-lasare] föregående priser gick inte att läsa för ${nya.size} avläsningar, priset väntar en avläsning till`);
  }
  for (const [sku, a] of nya) {
    const p = fore.get(sku)?.prisSek;
    a.forraPrisSek = typeof p === "number" && Number.isFinite(p) && p > 0 ? p : null;
  }
}

/** Artikeln vars sida inte gick att läsa, när sidan har en känd artikel. */
const misslyckadFor = (r: Sidrad) => (r.sku ? { sku: r.sku, webbId: r.webbId } : undefined);

/** En saknas-signal: den första i sviten, eller den som bekräftar borta. */
function saknasSignal(r: Sidrad, nu: number): Behandlad {
  const nuIso = iso(nu);
  const forsta = r.saknasForstaAt ? Date.parse(r.saknasForstaAt) : null;
  if (forsta !== null && nu - forsta >= DYGN) {
    return {
      typ: "saknas",
      rad: { ...r, borta: true, senastForsokAt: nuIso, senastUtfall: "saknas", nastaLasning: iso(nu + OM_BORTA) },
      borta: !r.borta && r.sku ? { sku: r.sku, webbId: r.webbId } : undefined,
    };
  }
  return {
    typ: "saknas",
    misslyckad: r.borta ? undefined : misslyckadFor(r),
    rad: {
      ...r,
      saknasForstaAt: r.saknasForstaAt ?? nuIso,
      senastForsokAt: nuIso,
      senastUtfall: "saknas",
      nastaLasning: iso(nu + OM_SAKNAS),
    },
  };
}

/** En sida som inte hämtades: robots.txt eller husets regler spärrar den. Prövas igen om ett dygn. */
export function sparrad(r: Sidrad, nu: number): Behandlad {
  return {
    typ: "sparrad",
    misslyckad: r.borta ? undefined : misslyckadFor(r),
    rad: { ...r, senastForsokAt: iso(nu), senastUtfall: "sparrad", nastaLasning: iso(nu + OM_SPARRAD) },
  };
}

/** Tolkningen, och ett undantag som ett tolkningsfel: en udda sida får inte fälla körningen. */
function tolka(html: string): Tolkning {
  try {
    return tolkaProduktsida(html);
  } catch {
    return { ok: false, fel: "undantag" };
  }
}

/** Vad ett svar betyder för sidan. Ren: ingen IO. */
export function behandla(r: Sidrad, svar: Exclude<Svar, { typ: "blockerad" }>, nu: number): Behandlad {
  const nuIso = iso(nu);
  switch (svar.typ) {
    case "sida": {
      const t = tolka(svar.html);
      if (t.ok) {
        const klass = r.klass === "katalog" ? "utkast" : r.klass;
        return {
          typ: "giltig",
          avlasning: avlasningAv(t.sida, r, nuIso),
          rad: {
            ...r,
            sku: t.sida.sku,
            klass,
            senastForsokAt: nuIso,
            senastUtfall: "ok",
            senastOkAt: nuIso,
            saknasForstaAt: null,
            borta: false,
            nastaLasning: iso(nu + INTERVALL_MS[klass]),
          },
        };
      }
      // En sida utan produktdata är en saknas-signal bara när adressen dessutom
      // saknats i kartan i ett dygn. Annars kan det vara en layoutändring, och
      // då ska ingenting bli borta.
      const ute = !r.iKartan && !!r.saknadIKartanSedan && nu - Date.parse(r.saknadIKartanSedan) >= DYGN;
      if (t.fel === "ej_produktsida" && ute) return saknasSignal(r, nu);
      // Läses om i sidans vanliga takt, inte oftare: en sida som aldrig går att
      // tolka ska inte ta större plats i körningarna än de andra, och väga
      // tyngre i spärren för otolkbara sidor.
      return {
        typ: "tolkningsfel",
        fel: t.fel,
        misslyckad: misslyckadFor(r),
        rad: { ...r, senastForsokAt: nuIso, senastUtfall: `tolkningsfel:${t.fel}`, nastaLasning: iso(nu + INTERVALL_MS[r.klass]) },
      };
    }
    case "saknas":
      return saknasSignal(r, nu);
    case "omdirigerad": {
      const till = svar.till;
      const nyttId = till ? webbIdUr(till) : null;
      if (!till || !nyttId) return saknasSignal(r, nu);
      if (nyttId === r.webbId) {
        // Samma produkt under en ny adress: den nya adressen läses i nästa körning.
        return {
          typ: "flyttad",
          rad: { ...r, sokvag: till, senastForsokAt: nuIso, senastUtfall: "flyttad", nastaLasning: nuIso },
        };
      }
      const ut = saknasSignal(r, nu);
      return { ...ut, typ: "flyttad", ny: { ...nySidrad({ webbId: nyttId, sokvag: till }, nuIso), iKartan: false } };
    }
    case "tillfalligt":
      return {
        typ: "tillfalligt",
        misslyckad: misslyckadFor(r),
        rad: { ...r, senastForsokAt: nuIso, senastUtfall: "tillfalligt", nastaLasning: iso(nu + OM_TILLFALLIGT) },
      };
  }
}

function raknaIn(s: Korningssummering, b: Behandlad): void {
  switch (b.typ) {
    case "giltig":
      s.giltiga++;
      if (b.avlasning?.status === "i_lager") s.iLager++;
      else if (b.avlasning?.status === "slut") s.slutsalda++;
      else s.ejLevererbara++;
      return;
    case "saknas":
      s.saknade++;
      return;
    case "flyttad":
      s.flyttade++;
      return;
    case "tillfalligt":
      s.tillfalliga++;
      return;
    case "tolkningsfel":
      if (b.fel) s.tolkningsfel[b.fel] = (s.tolkningsfel[b.fel] ?? 0) + 1;
      return;
    case "sparrad":
      s.sparrade++;
      return;
  }
}

export const antalTolkningsfel = (s: Pick<Korningssummering, "tolkningsfel">): number =>
  Object.values(s.tolkningsfel).reduce((a: number, b) => a + (b ?? 0), 0);

/** Vilken spärr som fäller körningen, eller null. Ren, för att kunna testas för sig. */
export function sparr(s: Korningssummering): string | null {
  const otolkbara = antalTolkningsfel(s);
  const forsok = s.giltiga + otolkbara;
  if (forsok >= MIN_FOR_OTOLKBARA && otolkbara / forsok > MAX_OTOLKBARA) {
    return `${otolkbara} av ${forsok} sidor gick inte att tolka`;
  }
  if (s.giltiga >= MIN_FOR_SLUTSALDA && s.slutsalda / s.giltiga > MAX_SLUTSALDA) {
    return `${s.slutsalda} av ${s.giltiga} giltiga sidor var slutsålda`;
  }
  const medSaknade = forsok + s.saknade;
  if (medSaknade >= MIN_FOR_SAKNADE && s.saknade / medSaknade > MAX_SAKNADE) {
    return `${s.saknade} av ${medSaknade} sidor saknades`;
  }
  return null;
}

/** Larmtexten. Bara antal och skäl, aldrig en adress eller ett artikelnummer. */
function larmtext(rubrik: string, s: Korningssummering, fryst: boolean): string {
  return [
    `${rubrik}.`,
    "",
    `Körningen ${s.start}: ${s.lasta} sidor lästa, ${s.giltiga} giltiga, ${s.slutsalda} slutsålda, ` +
      `${s.saknade} saknade, ${antalTolkningsfel(s)} otolkbara, ${s.tillfalliga} tillfälliga fel, ` +
      `${s.sparrade} spärrade av robots.txt.`,
    `Kontrollsidor: ${s.kontroller.ok} av ${s.kontroller.lasta} gick att läsa.`,
    "",
    fryst
      ? "Läsaren är FRYST. Ingenting från körningen skrevs, och den läser ingenting förrän den tinas: " +
        'workflowen "VEVOR — läsaren", läget tina.'
      : "Ingen avläsning från körningen skrevs. Sidorna ligger kvar i kön och läses om.",
  ].join("\n");
}

interface Kartutfall {
  blockerad?: Blockering;
  fel?: string;
  klar: boolean;
  summa: NonNullable<Korningssummering["karta"]>;
}

/** Läser kartan och lägger nya adresser i kön. `tillaten` är robots.txt:s regler. */
async function synkaKartan(
  lager: VevorLager,
  takt: Takt,
  hamtare: Hamtare | undefined,
  nu: number,
  tillaten: (sokvag: string) => boolean,
): Promise<Kartutfall> {
  const summa = { lasta: 0, nya: 0, borta: 0, tillbaka: 0, kvar: 0 };
  const k = await lasKartan({ takt, hamtare, tillaten });
  if (!k.ok) {
    if (k.svar?.typ === "blockerad") return { blockerad: k.svar.skal, klar: false, summa };
    return { fel: `kartan: ${k.skal}`, klar: false, summa };
  }
  summa.lasta = k.rader.length;
  const alla = await lager.allaSidor();
  const levande = alla.filter((r) => !r.borta).length;
  if (levande > 1_000 && k.rader.length < levande * MIN_KARTANDEL) {
    return { fel: `kartan har ${k.rader.length} adresser mot ${levande} kända`, klar: false, summa };
  }
  const nuIso = iso(nu);
  const kanda = new Map(alla.map((r) => [r.webbId, r]));
  const iKartan = new Map(k.rader.map((r) => [r.webbId, r]));
  const andrade: Sidrad[] = [];
  for (const r of alla) {
    const karta = iKartan.get(r.webbId);
    if (karta && (!r.iKartan || r.sokvag !== karta.sokvag)) {
      if (!r.iKartan) summa.tillbaka++;
      andrade.push({ ...r, iKartan: true, saknadIKartanSedan: null, sokvag: karta.sokvag });
    } else if (!karta && r.iKartan) {
      // Ute ur kartan: läs om sidan nu. Den räknas inte som borta för det.
      summa.borta++;
      andrade.push({ ...r, iKartan: false, saknadIKartanSedan: nuIso, nastaLasning: nuIso });
    }
  }
  const nya = k.rader.filter((r) => !kanda.has(r.webbId)).map((r) => nySidrad(r, nuIso));
  const nuNya = nya.slice(0, NYA_KARTRADER_PER_KORNING);
  const fel = new Set(await lager.sparaSidor([...andrade, ...nuNya]));
  summa.nya = nuNya.filter((n) => !fel.has(n.webbId)).length;
  summa.kvar = nya.length - summa.nya;
  return { klar: summa.kvar === 0 && fel.size === 0, summa };
}

type Robotsutfall =
  | { ok: true; regler: Robotsregler; hamtad: boolean }
  | { ok: false; blockerad?: Blockering; skal: string };

/**
 * robots.txt, högst ett dygn gammal (RFC 9309, avsnitt 2.4). En fil som inte
 * går att läsa betyder att ingenting är tillåtet (avsnitt 2.3.1.4).
 */
async function lasRobots(t: Lasartillstand, takt: Takt, hamtare: Hamtare | undefined, nu: number): Promise<Robotsutfall> {
  const sparad = t.robots;
  if (sparad && nu - Date.parse(sparad.at) < DYGN) {
    return { ok: true, regler: { regler: sparad.regler, crawlDelaySek: sparad.crawlDelaySek }, hamtad: false };
  }
  const svar = await hamtaFil(ROBOTS_SOKVAG, { takt, hamtare });
  switch (svar.typ) {
    case "fil": {
      const text = Buffer.from(svar.data.subarray(0, MAX_ROBOTS_BYTE)).toString("utf8");
      // En HTML-sida där robots.txt skulle stå är en spärrsida eller ett fel, aldrig regler.
      if (/<html/i.test(text)) {
        return harSparrmarkor(text)
          ? { ok: false, blockerad: "captcha", skal: "robots.txt: spärrsida" }
          : { ok: false, skal: "robots.txt var en HTML-sida" };
      }
      return { ok: true, regler: reglerFor(tolkaRobots(text)), hamtad: true };
    }
    case "saknas":
      // Ingen robots.txt: allt är tillåtet. Husets egna regler gäller ändå.
      return { ok: true, regler: { regler: [], crawlDelaySek: null }, hamtad: true };
    case "blockerad":
      return { ok: false, blockerad: svar.skal, skal: `robots.txt: ${svar.skal}` };
    case "omdirigerad":
      return { ok: false, skal: "robots.txt flyttades" };
    case "tillfalligt":
      return { ok: false, skal: "robots.txt gick inte att läsa" };
  }
}

/** Uteslutna kontrollsidor utan dem som legat längre än en vecka, högst de 200 senaste. */
function rensaUteslutna(u: Lasartillstand["uteslutnaKontroller"], nu: number): Map<string, string> {
  const kvar = (Array.isArray(u) ? u : [])
    .filter((x) => x && typeof x.id === "string" && nu - Date.parse(x.at) < UTESLUTEN)
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, MAX_UTESLUTNA);
  return new Map(kvar.map((x) => [x.id, x.at]));
}

/** Är avläsningens senaste försök ett misslyckande? */
export function misslyckadSenast(a: Pick<Avlasning, "misslyckadAt" | "lastAt">): boolean {
  return !!a.misslyckadAt && Date.parse(a.misslyckadAt) >= Date.parse(a.lastAt);
}

/**
 * En körning. Ett enskilt sidfel fäller den inte. Ett fel mot Wix (kön,
 * skrivningen) kastar, och då har ingenting mer skrivits.
 */
export async function korVevorLasare(deps: LasarDeps, val: Korval): Promise<Korningssummering> {
  const klocka = deps.klocka ?? Date.now;
  const slump = deps.slump ?? Math.random;
  const start = klocka();
  const nuIso = iso(start);
  const s = tomSummering(start);
  const lager = deps.lager;
  const tillstand: Lasartillstand = await lager.lasTillstand();

  if (tillstand.fryst) {
    return avsluta(s, klocka, "fryst", `fryst sedan ${tillstand.fryst.at} (${tillstand.fryst.skal})`);
  }
  if (!val.manuell && !tillstand.aktiv) return avsluta(s, klocka, "avstangd", null);

  const agare = randomUUID();
  if (!(await lager.tagLas(agare, start, LAS_TTL))) return avsluta(s, klocka, "upptagen", null);
  try {
    const takt = new Takt(klocka, deps.vanta);
    const kvarTid = () => val.budgetMs - (klocka() - start);

    // Det körningen själv ändrar i tillståndet. Det skrivs fält för fält
    // (`uppdateraTillstand`), så att ett "av" eller "tina" som kom medan
    // körningen läste står kvar.
    const andring: Partial<Lasartillstand> = {};
    let larmAt = { ...tillstand.larmAt };
    let kartaKlar = false;
    let prioriterad = false;
    /** Kontrollsidorna som behålls, eller null om körningen aldrig prövade dem. */
    let kontrollista: string[] | null = null;
    const uteslutna = rensaUteslutna(tillstand.uteslutnaKontroller, start);
    const resultat = new Map<string, Behandlad>();
    /** Sidor ur kön som hämtades, som de såg ut före. Läggs tillbaka om körningen stoppas. */
    const lastaUrKon: Sidrad[] = [];

    const larma = async (skal: string, rubrik: string, fryst = false) => {
      const senast = larmAt[skal];
      if (!fryst && senast && start - Date.parse(senast) < LARMPAUS) return;
      larmAt = { ...larmAt, [skal]: nuIso };
      andring.larmAt = larmAt;
      try {
        await deps.larma(rubrik, larmtext(rubrik, s, fryst));
      } catch (e) {
        console.error("[vevor-lasare] larmet gick inte iväg:", e instanceof Error ? e.message : String(e));
      }
    };

    const avslutaMed = async (utfall: Korningssummering["utfall"], skal: string | null): Promise<Korningssummering> => {
      if (kartaKlar) andring.kartaAt = nuIso;
      if (prioriterad) andring.prioriteradAt = nuIso;
      const senaste = avsluta(s, klocka, utfall, skal);
      await lager.uppdateraTillstand({ ...andring, senasteKorning: senaste });
      return senaste;
    };

    /** Fryser: inget från körningen skrivs, och läsaren står still tills den tinas. */
    const frys = async (skal: Blockering): Promise<Korningssummering> => {
      s.blockerad = skal;
      // Frysningen sparas FÖRE larmet: ett larm som faller får inte lämna läsaren ofryst.
      await lager.uppdateraTillstand({ fryst: { at: nuIso, skal } });
      await larma("blockerad", `VEVOR-läsaren är fryst: spärr från VEVOR (${skal})`, true);
      const senaste = avsluta(s, klocka, "stoppad", `spärr från VEVOR: ${skal}`);
      await lager.uppdateraTillstand({ larmAt, senasteKorning: senaste });
      return senaste;
    };

    /** Kontrollsidorna som behålls, påfyllda med kända produkter i lager som inte fallit nyss. */
    const fyllKontroller = async () => {
      if (kontrollista === null) return;
      const lista = [...kontrollista];
      if (lista.length < KONTROLLER) {
        try {
          for (const a of await lager.kontrollkandidater(KONTROLLER * 3, slump())) {
            if (lista.length >= KONTROLLER) break;
            const id = a.webbId;
            const iDag = resultat.get(id);
            if (!id || lista.includes(id) || uteslutna.has(id) || misslyckadSenast(a)) continue;
            if (iDag && (iDag.typ !== "giltig" || iDag.avlasning?.status !== "i_lager")) continue;
            lista.push(id);
          }
        } catch (e) {
          console.error("[vevor-lasare] kontrollsidorna gick inte att fylla på:", e instanceof Error ? e.message : String(e));
        }
      }
      andring.kontroller = lista;
      andring.uteslutnaKontroller = [...uteslutna]
        .map(([id, at]) => ({ id, at }))
        .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
        .slice(0, MAX_UTESLUTNA);
    };

    /**
     * En spärr stoppade körningen. Ingen avläsning skrivs. Sidorna ur kön läggs
     * tillbaka utspridda, så att samma sidor inte läses ihop igen, och de som
     * robots.txt spärrade får sin nya tid. Larmet går vid tredje stoppet i följd.
     */
    const stoppa = async (stopp: string, larmSkal: string): Promise<Korningssummering> => {
      const tillbaka = lastaUrKon.map((r) => ({
        ...r,
        nastaLasning: iso(start + ATERLAGG_MIN + Math.min(Math.max(slump(), 0), 1) * (ATERLAGG_MAX - ATERLAGG_MIN)),
      }));
      const sparradeRader = [...resultat.values()].filter((b) => b.typ === "sparrad").map((b) => b.rad);
      const fel = new Set(await lager.sparaSidor([...tillbaka, ...sparradeRader]));
      s.aterlagda = tillbaka.filter((r) => !fel.has(r.webbId)).length;
      const iFoljd = (tillstand.stoppIFoljd ?? 0) + 1;
      andring.stoppIFoljd = iFoljd;
      if (iFoljd >= SPARRAR_FOR_LARM) {
        await larma(larmSkal, `VEVOR-läsaren har inte skrivit någon avläsning i ${iFoljd} körningar i följd: ${stopp}`);
      }
      await fyllKontroller();
      return avslutaMed("stoppad", stopp);
    };

    const ta = (b: Behandlad) => {
      resultat.set(b.rad.webbId, b);
      raknaIn(s, b);
    };

    // ── 2. robots.txt, en gång per dygn ──
    const robots = await lasRobots(tillstand, takt, deps.hamtare, start);
    if (!robots.ok) {
      if (robots.blockerad) return await frys(robots.blockerad);
      return await stoppa(robots.skal, "robots");
    }
    if (robots.hamtad) andring.robots = { at: nuIso, ...robots.regler };
    s.robots = { hamtad: robots.hamtad, regler: robots.regler.regler.length, crawlDelaySek: robots.regler.crawlDelaySek };
    if (robots.regler.crawlDelaySek !== null) takt.satt(robots.regler.crawlDelaySek * 1000);
    /** Får sökvägen hämtas? Husets regler och robots.txt. */
    const far = (sokvag: string, fraga = "") => tillatenSokvag(sokvag) && tillatenAvRobots(robots.regler, sokvag + fraga);

    // ── 3. Kartan, en gång per dygn (och tills alla adresser ligger i kön) ──
    if (!tillstand.kartaAt || start - Date.parse(tillstand.kartaAt) >= DYGN) {
      const k = await synkaKartan(lager, takt, deps.hamtare, start, (v) => far(v));
      if (k.blockerad) return await frys(k.blockerad);
      s.karta = k.summa;
      kartaKlar = k.klar;
      if (k.fel) await larma("karta", `VEVOR-läsaren: ${k.fel}`);
    }

    // ── 4. Prioriteringen, en gång i timmen ──
    if (!tillstand.prioriteradAt || start - Date.parse(tillstand.prioriteradAt) >= TIMME) {
      try {
        const u = await deps.prioritetsunderlag();
        const publicerade = u.produkter.filter((p) => p.publicerad).map((p) => p.sku);
        const saldon = publicerade.length > 0 ? await lager.avlasningar(publicerade) : new Map<string, Avlasning>();
        const onskad = onskadeKlasser(u, (sku) => saldon.get(sku)?.saldo ?? null);
        const nuvarande = await lager.sidorMedKlass(["het", "publicerad"]);
        const forOnskade = onskad.size > 0 ? await lager.sidorForSkus([...onskad.keys()]) : [];
        const byten = klassbyten(onskad, forOnskade, nuvarande, start);
        const fel = await lager.sparaSidor(byten);
        const klasser = [...onskad.values()];
        s.prioritet = {
          het: klasser.filter((k) => k === "het").length,
          publicerad: klasser.filter((k) => k === "publicerad").length,
          andrade: byten.length - fel.length,
        };
        prioriterad = true;
      } catch (e) {
        // Prioriteringen avgör takten, inte vad som är sant. Att den föll får
        // inte stoppa läsningen; nästa körning försöker igen.
        console.error("[vevor-lasare] prioriteringen föll:", e instanceof Error ? e.message : String(e));
      }
    }

    // ── 5. Kontrollsidorna ──
    const behallna: string[] = [];
    const kontrollrader = tillstand.kontroller.length > 0 ? await lager.sidor(tillstand.kontroller) : new Map<string, Sidrad>();
    for (const id of tillstand.kontroller) {
      const r = kontrollrader.get(id);
      if (!r || r.borta || !far(r.sokvag, SIDFRAGA)) {
        // Borta sedan tidigare körningar, eller spärrad: byts ut, stoppar inget.
        s.kontroller.ersatta++;
        continue;
      }
      const svar = await hamta(r.sokvag, { takt, hamtare: deps.hamtare, fraga: SIDFRAGA });
      s.lasta++;
      s.kontroller.lasta++;
      if (svar.typ === "blockerad") return await frys(svar.skal);
      const b = behandla(r, svar, start);
      ta(b);
      if (b.typ === "giltig") {
        s.kontroller.ok++;
        // En kontrollsida ska vara i lager, så att en som plötsligt säger slut
        // syns. En som sålt slut byts ut, men kan väljas igen.
        if (b.avlasning?.status === "i_lager") behallna.push(id);
        else s.kontroller.ersatta++;
      } else if (b.typ === "saknas" || b.typ === "flyttad") {
        s.kontroller.saknade++;
        s.kontroller.ersatta++;
      } else if (b.typ === "tolkningsfel") {
        // Stoppar körningen, och sidan väljs inte igen på en vecka: en enda
        // udda produkt får inte stoppa varje körning.
        s.kontroller.fel++;
        s.kontroller.ersatta++;
        uteslutna.set(id, nuIso);
      } else {
        // Ett tillfälligt fel säger ingenting om sidan. Den byts ut, men stoppar inget.
        s.kontroller.ersatta++;
      }
    }
    kontrollista = behallna;
    let stopp: string | null = null;
    if (s.kontroller.fel > 0) {
      stopp = `${s.kontroller.fel} av ${s.kontroller.lasta} kontrollsidor saknade pris, lager eller artikelnummer`;
    } else if (s.kontroller.saknade >= MAX_SAKNADE_KONTROLLER) {
      stopp = `${s.kontroller.saknade} kontrollsidor saknades`;
    }
    if (stopp) return await stoppa(stopp, "kontroll");

    // ── 6. Kön ──
    const ko = await lager.forfallna(nuIso, val.maxSidor + KONTROLLER);
    let tillfalligaIFoljd = 0;
    let lastaIKon = 0;
    for (const r of ko) {
      if (lastaIKon >= val.maxSidor || kvarTid() < SKRIVMARGINAL) break;
      if (resultat.has(r.webbId)) continue;
      if (!far(r.sokvag, SIDFRAGA)) {
        // Hämtas inte: robots.txt eller husets regler spärrar sökvägen.
        ta(sparrad(r, start));
        continue;
      }
      const svar = await hamta(r.sokvag, { takt, hamtare: deps.hamtare, fraga: SIDFRAGA });
      s.lasta++;
      lastaIKon++;
      if (svar.typ === "blockerad") return await frys(svar.skal);
      lastaUrKon.push(r);
      const b = behandla(r, svar, start);
      ta(b);
      tillfalligaIFoljd = b.typ === "tillfalligt" ? tillfalligaIFoljd + 1 : 0;
      if (tillfalligaIFoljd >= MAX_TILLFALLIGA_I_FOLJD) {
        // Fem fel i följd är ett nät- eller serverproblem. Det som lästs skrivs.
        console.warn("[vevor-lasare] fem tillfälliga fel i följd, slutar läsa för den här körningen");
        break;
      }
    }
    if (s.sparrade >= 10) await larma("robots", `VEVOR-läsaren: robots.txt spärrar ${s.sparrade} sidor i kön`);
    stopp = sparr(s);
    if (stopp) return await stoppa(stopp, "sparr");

    // ── 7. Skrivningen: avläsningarna först, sidorna sist ──
    const avlasningar = new Map<string, Avlasning>();
    for (const b of resultat.values()) if (b.avlasning) avlasningar.set(b.avlasning.sku, b.avlasning);
    await medForraPris(lager, avlasningar);
    const felAvl = new Set(await lager.sparaAvlasningar([...avlasningar.values()]));

    // Borta och misslyckade märks bara på en avläsning som kom från just den sidan.
    const bortaPar = [...resultat.values()].flatMap((b) => (b.borta ? [b.borta] : []));
    const missPar = [...resultat.values()].flatMap((b) => (b.misslyckad ? [b.misslyckad] : []));
    const felMark = new Set<string>();
    let markeradeBorta = 0;
    let markeradeMiss = 0;
    if (bortaPar.length + missPar.length > 0) {
      const befintliga = await lager.avlasningar([...bortaPar, ...missPar].map((p) => p.sku));
      const bortaMark: Avlasning[] = [];
      const missMark: Avlasning[] = [];
      for (const p of bortaPar) {
        const a = befintliga.get(p.sku);
        if (a && a.webbId === p.webbId && !a.borta) bortaMark.push({ ...a, borta: true, bortaAt: nuIso, status: "borta" });
      }
      for (const p of missPar) {
        const a = befintliga.get(p.sku);
        if (!a || a.webbId !== p.webbId || a.borta || misslyckadSenast(a) || bortaMark.some((m) => m.sku === p.sku)) continue;
        missMark.push({ ...a, misslyckadAt: nuIso });
      }
      for (const sku of await lager.sparaAvlasningar([...bortaMark, ...missMark])) felMark.add(sku);
      markeradeBorta = bortaMark.filter((a) => !felMark.has(a.sku)).length;
      markeradeMiss = missMark.filter((a) => !felMark.has(a.sku)).length;
    }

    const sidrader: Sidrad[] = [];
    for (const b of resultat.values()) {
      let rad = b.rad;
      const skrevsInte =
        (b.avlasning && felAvl.has(b.avlasning.sku)) ||
        (b.borta && felMark.has(b.borta.sku)) ||
        (b.misslyckad && felMark.has(b.misslyckad.sku));
      if (skrevsInte) {
        // Avläsningen sitter inte i Wix: läs om snart, och låt inte sidan se klar ut.
        rad = { ...rad, borta: b.borta ? false : rad.borta, senastUtfall: "skrivfel", nastaLasning: iso(start + OM_TILLFALLIGT) };
      }
      sidrader.push(rad);
      if (b.ny && !resultat.has(b.ny.webbId)) sidrader.push(b.ny);
    }
    const felSidor = await lager.sparaSidor(sidrader);
    s.skrivna = {
      avlasningar: avlasningar.size - felAvl.size,
      sidor: sidrader.length - felSidor.length,
      borta: markeradeBorta,
      misslyckade: markeradeMiss,
      fel: felAvl.size + felMark.size + felSidor.length,
    };

    andring.stoppIFoljd = 0;
    await fyllKontroller();
    return await avslutaMed("klar", null);
  } finally {
    await lager.slappLas(agare).catch(() => undefined);
  }
}

/** Loggraden. Bara antal. */
export function loggrad(s: Korningssummering): string {
  const t = antalTolkningsfel(s);
  const karta = s.karta ? ` Kartan: ${s.karta.lasta} adresser, ${s.karta.nya} nya, ${s.karta.kvar} kvar att lägga in.` : "";
  return (
    `[vevor-lasare] ${s.utfall}${s.skal ? ` (${s.skal})` : ""}: ${s.lasta} sidor lästa, ${s.giltiga} giltiga ` +
    `(${s.iLager} i lager, ${s.slutsalda} slutsålda, ${s.ejLevererbara} ej levererbara), ${s.saknade} saknade, ` +
    `${t} otolkbara, ${s.tillfalliga} tillfälliga fel, ${s.sparrade} spärrade av robots.txt. ` +
    `Kontroller ${s.kontroller.ok}/${s.kontroller.lasta}. ` +
    `Skrivet: ${s.skrivna.avlasningar} avläsningar, ${s.skrivna.sidor} sidor, ${s.skrivna.borta} borta, ` +
    `${s.skrivna.misslyckade} okända, ${s.skrivna.fel} fel.` +
    (s.aterlagda ? ` ${s.aterlagda} sidor tillbaka i kön.` : "") +
    karta
  );
}
