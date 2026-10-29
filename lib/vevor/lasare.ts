// VEVOR-läsaren: en körning läser de produktsidor som står på tur.
//
// VAD EN KÖRNING GÖR, i ordning:
//   1. Avstängd, fryst eller upptagen: gör ingenting.
//   2. Kartan, en gång per dygn: nya produktadresser blir rader i kön.
//   3. Prioriteringen, en gång i timmen (lib/vevor/prioritet.ts).
//   4. Kontrollsidorna: tio kända produkter läses först.
//   5. Kön: sidor vars tid passerat, en i taget, högst en per sekund.
//   6. Spärrarna, och sedan skrivningen.
//
// ☠️ VID 403, 429, CAPTCHA ELLER TOM SIDA FRYSER LÄSAREN. Ingenting från
// körningen skrivs, ett larm går, och läsaren står still tills en människa
// tinar den (workflowen "VEVOR — läsaren"). Inget nytt försök av sig själv:
// en spärr är VEVOR:s svar, och det är Leonards sak att tolka det.
//
// ☠️ SPÄRRARNA SKRIVER INGENTING FRÅN KÖRNINGEN, inte bara det misstänkta:
//   - en kontrollsida saknar pris, lager eller artikelnummer
//   - mer än 10 % av sidorna gick inte att tolka
//   - mer än 40 % av de giltiga sidorna är slutsålda (normalt ~23 %)
//   - mer än 20 % av sidorna saknas (normalt ~6 % av kartans adresser)
// De tre första är Leonards (2026-10-28), den fjärde skyddar samma sak: en
// layoutändring eller en spärr som svarar 404 ser ut som tusen borttagna
// varor. Skrivs de inte, läses samma sidor om nästa körning, och ingen skada
// är skedd.
//
// ☠️ BORTA KRÄVER TVÅ SIGNALER MED MINST ETT DYGN EMELLAN. En signal är en
// 404, en flytt bort från produktsidan, eller en sida utan produktdata när
// adressen saknats i kartan i ett dygn. En sida som läses som en giltig
// produkt är aldrig borta, vad kartan än säger: den går att beställa.
//
// ☠️ LOGGEN, SVARET OCH LARMET BÄR BARA ANTAL. Inga artikelnummer, adresser
// eller priser: repot och dess Actions-loggar är publika.

import { randomUUID } from "node:crypto";
import { hamta, Takt, type Blockering, type Hamtare, type Svar } from "./hamtning";
import { SIDFRAGA, tolkaProduktsida, webbIdUr, type Sidinnehall, type Tolkningsfel } from "./sida";
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
const OM_TOLKNINGSFEL = 6 * TIMME;
/** Efter första saknas-signalen: nästa läsning efter mer än ett dygn. */
const OM_SAKNAS = 25 * TIMME;
const OM_BORTA = 7 * DYGN;
const LARMPAUS = 6 * TIMME;
const LAS_TTL = 290_000;
/** Tid som sparas till skrivningen i slutet. */
const SKRIVMARGINAL = 30_000;

export interface LasarDeps {
  lager: VevorLager;
  hamtare?: Hamtare;
  klocka?: () => number;
  vanta?: (ms: number) => Promise<void>;
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
  /** En ny sida att lägga i kön (en flytt till en annan adress). */
  ny?: Sidrad;
  typ: "giltig" | "saknas" | "flyttad" | "tolkningsfel" | "tillfalligt";
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
    blockerad: null,
    kontroller: { lasta: 0, ok: 0, fel: 0, ersatta: 0 },
    karta: null,
    prioritet: null,
    skrivna: { avlasningar: 0, sidor: 0, borta: 0, fel: 0 },
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
  };
}

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
    rad: {
      ...r,
      saknasForstaAt: r.saknasForstaAt ?? nuIso,
      senastForsokAt: nuIso,
      senastUtfall: "saknas",
      nastaLasning: iso(nu + OM_SAKNAS),
    },
  };
}

/** Vad ett svar betyder för sidan. Ren: ingen IO. */
export function behandla(r: Sidrad, svar: Exclude<Svar, { typ: "blockerad" }>, nu: number): Behandlad {
  const nuIso = iso(nu);
  switch (svar.typ) {
    case "sida": {
      const t = tolkaProduktsida(svar.html);
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
      return {
        typ: "tolkningsfel",
        fel: t.fel,
        rad: { ...r, senastForsokAt: nuIso, senastUtfall: `tolkningsfel:${t.fel}`, nastaLasning: iso(nu + OM_TOLKNINGSFEL) },
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
      `${s.saknade} saknade, ${antalTolkningsfel(s)} otolkbara, ${s.tillfalliga} tillfälliga fel.`,
    `Kontrollsidor: ${s.kontroller.ok} av ${s.kontroller.lasta} gick att läsa.`,
    "",
    fryst
      ? "Läsaren är FRYST. Ingenting från körningen skrevs, och den läser ingenting förrän den tinas: " +
        'workflowen "VEVOR — läsaren", läget tina.'
      : "Ingenting från körningen skrevs. Sidorna läses om i nästa körning.",
  ].join("\n");
}

interface Kartutfall {
  blockerad?: Blockering;
  fel?: string;
  klar: boolean;
  summa: NonNullable<Korningssummering["karta"]>;
}

/** Läser kartan och lägger nya adresser i kön. */
async function synkaKartan(lager: VevorLager, takt: Takt, hamtare: Hamtare | undefined, nu: number): Promise<Kartutfall> {
  const summa = { lasta: 0, nya: 0, borta: 0, tillbaka: 0, kvar: 0 };
  const k = await lasKartan({ takt, hamtare });
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

/**
 * En körning. Ett enskilt sidfel fäller den inte. Ett fel mot Wix (kön,
 * skrivningen) kastar, och då har ingenting mer skrivits.
 */
export async function korVevorLasare(deps: LasarDeps, val: Korval): Promise<Korningssummering> {
  const klocka = deps.klocka ?? Date.now;
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

    const larma = async (skal: string, rubrik: string, fryst = false) => {
      const senast = tillstand.larmAt[skal];
      if (!fryst && senast && start - Date.parse(senast) < LARMPAUS) return;
      tillstand.larmAt = { ...tillstand.larmAt, [skal]: nuIso };
      try {
        await deps.larma(rubrik, larmtext(rubrik, s, fryst));
      } catch (e) {
        console.error("[vevor-lasare] larmet gick inte iväg:", e instanceof Error ? e.message : String(e));
      }
    };

    /** Fryser: inget från körningen skrivs, och läsaren står still tills den tinas. */
    const frys = async (skal: Blockering): Promise<Korningssummering> => {
      s.blockerad = skal;
      tillstand.fryst = { at: nuIso, skal };
      // Frysningen sparas FÖRE larmet: ett larm som faller får inte lämna läsaren ofryst.
      await lager.sparaTillstand(tillstand);
      await larma("blockerad", `VEVOR-läsaren är fryst: spärr från VEVOR (${skal})`, true);
      tillstand.senasteKorning = avsluta(s, klocka, "stoppad", `spärr från VEVOR: ${skal}`);
      await lager.sparaTillstand(tillstand);
      return tillstand.senasteKorning;
    };

    // ── 2. Kartan, en gång per dygn (och tills alla adresser ligger i kön) ──
    let kartaKlar = false;
    if (!tillstand.kartaAt || start - Date.parse(tillstand.kartaAt) >= DYGN) {
      const k = await synkaKartan(lager, takt, deps.hamtare, start);
      if (k.blockerad) return await frys(k.blockerad);
      s.karta = k.summa;
      kartaKlar = k.klar;
      if (k.fel) await larma("karta", `VEVOR-läsaren: ${k.fel}`);
    }

    // ── 3. Prioriteringen, en gång i timmen ──
    let prioriterad = false;
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

    const resultat = new Map<string, Behandlad>();
    const ta = (b: Behandlad) => {
      resultat.set(b.rad.webbId, b);
      raknaIn(s, b);
    };

    // ── 4. Kontrollsidorna ──
    const kontrollrader = tillstand.kontroller.length > 0 ? await lager.sidor(tillstand.kontroller) : new Map<string, Sidrad>();
    const kvarKontroller: string[] = [];
    for (const id of tillstand.kontroller) {
      const r = kontrollrader.get(id);
      if (!r || r.borta) {
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
        kvarKontroller.push(id);
      } else if (b.typ === "saknas" || b.typ === "flyttad") {
        s.kontroller.ersatta++;
      } else {
        s.kontroller.fel++;
        kvarKontroller.push(id);
      }
    }
    let stopp: string | null = null;
    if (s.kontroller.fel > 0) {
      stopp = `${s.kontroller.fel} av ${s.kontroller.lasta} kontrollsidor saknade pris, lager eller artikelnummer`;
    } else if (s.kontroller.lasta > 0 && s.kontroller.ersatta >= MAX_SAKNADE_KONTROLLER) {
      stopp = `${s.kontroller.ersatta} kontrollsidor saknades`;
    }

    // ── 5. Kön ──
    if (!stopp) {
      const ko = await lager.forfallna(nuIso, val.maxSidor + KONTROLLER);
      let tillfalligaIFoljd = 0;
      let lastaIKon = 0;
      for (const r of ko) {
        if (lastaIKon >= val.maxSidor || kvarTid() < SKRIVMARGINAL) break;
        if (resultat.has(r.webbId)) continue;
        const svar = await hamta(r.sokvag, { takt, hamtare: deps.hamtare, fraga: SIDFRAGA });
        s.lasta++;
        lastaIKon++;
        if (svar.typ === "blockerad") return await frys(svar.skal);
        const b = behandla(r, svar, start);
        ta(b);
        tillfalligaIFoljd = b.typ === "tillfalligt" ? tillfalligaIFoljd + 1 : 0;
        if (tillfalligaIFoljd >= MAX_TILLFALLIGA_I_FOLJD) {
          // Fem fel i följd är ett nät- eller serverproblem. Det som lästs skrivs.
          console.warn("[vevor-lasare] fem tillfälliga fel i följd, slutar läsa för den här körningen");
          break;
        }
      }
      stopp = sparr(s);
    }

    if (stopp) {
      await larma(stopp.includes("kontrollsidor") ? "kontroll" : "sparr", `VEVOR-läsaren skrev ingenting: ${stopp}`);
      if (kartaKlar) tillstand.kartaAt = nuIso;
      if (prioriterad) tillstand.prioriteradAt = nuIso;
      tillstand.senasteKorning = avsluta(s, klocka, "stoppad", stopp);
      await lager.sparaTillstand(tillstand);
      return tillstand.senasteKorning;
    }

    // ── 6. Skrivningen: avläsningarna först, sidorna sist ──
    const avlasningar = new Map<string, Avlasning>();
    for (const b of resultat.values()) if (b.avlasning) avlasningar.set(b.avlasning.sku, b.avlasning);
    const felAvl = new Set(await lager.sparaAvlasningar([...avlasningar.values()]));

    const bortaPar = [...resultat.values()].flatMap((b) => (b.borta ? [b.borta] : []));
    const felBorta = new Set<string>();
    let markerade = 0;
    if (bortaPar.length > 0) {
      const befintliga = await lager.avlasningar(bortaPar.map((p) => p.sku));
      const markera: Avlasning[] = [];
      for (const p of bortaPar) {
        const a = befintliga.get(p.sku);
        // Bara när artikelns senaste avläsning kom från just den här sidan.
        if (a && a.webbId === p.webbId && !a.borta) markera.push({ ...a, borta: true, bortaAt: nuIso, status: "borta" });
      }
      for (const sku of await lager.sparaAvlasningar(markera)) felBorta.add(sku);
      markerade = markera.length - felBorta.size;
    }

    const sidrader: Sidrad[] = [];
    for (const b of resultat.values()) {
      let rad = b.rad;
      const skrevsInte = (b.avlasning && felAvl.has(b.avlasning.sku)) || (b.borta && felBorta.has(b.borta.sku));
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
      borta: markerade,
      fel: felAvl.size + felBorta.size + felSidor.length,
    };

    // Kontrollsidorna fylls på med kända produkter i lager.
    if (kvarKontroller.length < KONTROLLER) {
      try {
        for (const id of await lager.kontrollkandidater(KONTROLLER * 3)) {
          if (kvarKontroller.length >= KONTROLLER) break;
          if (!kvarKontroller.includes(id)) kvarKontroller.push(id);
        }
      } catch (e) {
        console.error("[vevor-lasare] kontrollsidorna gick inte att fylla på:", e instanceof Error ? e.message : String(e));
      }
    }
    tillstand.kontroller = kvarKontroller;
    if (kartaKlar) tillstand.kartaAt = nuIso;
    if (prioriterad) tillstand.prioriteradAt = nuIso;
    tillstand.senasteKorning = avsluta(s, klocka, "klar", null);
    await lager.sparaTillstand(tillstand);
    return tillstand.senasteKorning;
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
    `${t} otolkbara, ${s.tillfalliga} tillfälliga fel. Kontroller ${s.kontroller.ok}/${s.kontroller.lasta}. ` +
    `Skrivet: ${s.skrivna.avlasningar} avläsningar, ${s.skrivna.sidor} sidor, ${s.skrivna.borta} borta, ${s.skrivna.fel} fel.` +
    karta
  );
}
