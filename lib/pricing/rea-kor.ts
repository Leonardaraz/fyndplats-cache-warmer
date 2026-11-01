// Rea-jobbet: läser varje variants pris i butiken varje timme, för
// prisförloppet (rea-lager.ts), och ger en variant ett jämförpris i Wix när
// priset verkligen har sänkts (rea.ts). Butiken visar då "Rea" med det
// överstrukna priset, och Google-flödet `sale_price`. Leonard 2026-11-01:
// "Fixa".
//
// JOBBET ÄGER JÄMFÖRPRISET utanför fyndauktionen. Ett jämförpris som inte
// följer av historiken tas bort: det påstår en sänkning vi inte kan belägga.
// Auktionen sätter och tar bort sitt eget under en auktionsdag, och en produkt i
// en levande auktion (`live`, också en som ska starta i morgon) rörs inte alls.
//
// TRE SPÄRRAR innan ett jämförpris skrivs:
//   1. `seedKlar`: historiken är fylld bakåt ur butikens dagliga avläsning.
//   2. `skriv`: strömbrytaren är på (workflowen, lägena `pa` och `av`).
//   3. Historiken för den här körningen sparades. Annars rör den inga priser.
//
// ☠️ MASSPÄRREN. Vill en körning ge fler än `MAX_NYA` varianter ett nytt
// jämförpris skrivs inga nya den körningen, bara borttagningar. En trasig
// historik (eller ett fel i regeln) hade annars satt "Rea" på halva katalogen.
// Ett handanrop kan höja taket efter en torrkörning (`maxNya`).
//
// ☠️ SVARET BÄR BARA WIX-ID OCH RÄKNARE, aldrig priser. Det skrivs ut i en
// publik Actions-logg.

import type { AuctionDoc } from "../auction/engine";
import type { WixAnrop } from "../polish/skrivplan";
import {
  skrivJamforpriser,
  type JamforStatus,
  type OnskatJamforpris,
  type VariantPris,
} from "../wix/jamforpris";
import type { VariantbildStatus } from "../wix/variant-media";
import {
  DAG_MS,
  MAX_GLAPP_MS,
  auktionIFonstret,
  fullstandigaDagar,
  laggTill,
  luckaIFonstret,
  reaFor,
  seedPunkter,
  slaIhopMedSeed,
  trimma,
  trimmaLuckor,
  type Auktionsperiod,
  type Dagsrad,
  type Lucka,
  type Prispunkt,
  type ReaSkal,
} from "./rea";
import type { Prisforlopp, ReaLager, ReaTillstand, Variantforlopp } from "./rea-lager";

const paus = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Fler nya reaskyltar än så i en körning skrivs inte (masspärren). */
export const MAX_NYA = 200;
/** Så många fel i följd stoppar körningen (ett 403 på MERCHANT_DATA fäller varje produkt). */
export const MAX_FEL_I_FOLJD = 5;
/** Låset gäller så länge. En körning tar högst några minuter. */
export const LAS_TTL_MS = 10 * 60 * 1000;
const PAUS_MELLAN_PRODUKTER_MS = 100;
const MAX_UTSKRIVNA = 100;

export interface ReaDeps {
  lager: ReaLager;
  wix: WixAnrop;
  lasVariantpriser: () => Promise<VariantPris[]>;
  /** Auktionerna med status `live`, `sold` och `expired`. */
  lasAuktioner: () => Promise<AuctionDoc[]>;
  skriv?: typeof skrivJamforpriser;
  nu?: () => number;
  vanta?: (ms: number) => Promise<void>;
}

// ── Auktionerna ──────────────────────────────────────────────────────────

export interface Auktionslage {
  /** En levande auktion (startad eller schemalagd): jobbet rör inte produkten. */
  levande: boolean;
  perioder: Auktionsperiod[];
}

/**
 * Auktionernas läge per produkt. En avslutad auktion utan slut räknas som en dag
 * lång (auktionsdagen är tolv timmar); en utan start räknas som att den aldrig
 * slutar, så att produkten inte får någon automatisk rea alls.
 */
export function auktionslagen(auktioner: readonly AuctionDoc[]): Map<string, Auktionslage> {
  const ut = new Map<string, Auktionslage>();
  for (const a of auktioner) {
    if (!a?.productId) continue;
    const lage = ut.get(a.productId) ?? { levande: false, perioder: [] };
    const start = a.startAt ? Date.parse(a.startAt) : NaN;
    if (a.status === "live") {
      lage.levande = true;
      lage.perioder.push({ start: Number.isFinite(start) ? start : 0, slut: null });
    } else if (a.status === "sold" || a.status === "expired") {
      const slut = a.endedAt ? Date.parse(a.endedAt) : NaN;
      if (!Number.isFinite(start)) lage.perioder.push({ start: 0, slut: null });
      else lage.perioder.push({ start, slut: Number.isFinite(slut) ? slut : start + DAG_MS });
    } else {
      continue;
    }
    ut.set(a.productId, lage);
  }
  return ut;
}

// ── Beslutet per variant ─────────────────────────────────────────────────

export type Beslut =
  | { rorInte: true }
  | { rorInte: false; jamforOre: number | null; skal: ReaSkal | "rea"; sankningar?: number };

/** Vad variantens jämförpris ska vara, givet historiken (rea.ts) och auktionerna. */
export function beslutaVariant(
  v: VariantPris,
  punkter: readonly Prispunkt[],
  auktion: Auktionslage | undefined,
  luckor: readonly Lucka[],
  nuMs: number,
): Beslut {
  if (auktion?.levande) return { rorInte: true };
  if (!v.erbjuden || v.prisOre === null) return { rorInte: false, jamforOre: null, skal: "inte_utbjuden" };
  const r = reaFor(punkter, v.prisOre, nuMs);
  if (!r.rea) return { rorInte: false, jamforOre: null, skal: r.skal };
  if (auktion && auktionIFonstret(auktion.perioder, r.fonsterFran, nuMs)) {
    return { rorInte: false, jamforOre: null, skal: "auktion" };
  }
  if (luckaIFonstret(luckor, r.fonsterFran, nuMs)) return { rorInte: false, jamforOre: null, skal: "lucka" };
  return { rorInte: false, jamforOre: r.tidigareOre, skal: "rea", sankningar: r.sankningar };
}

// ── Historiken ───────────────────────────────────────────────────────────

const sortera = (p: readonly Prispunkt[]): Prispunkt[] => [...p].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));

/** En variant vars enda punkt är "gick inte att köpa" sedan längre än historiken sparas: den kan glömmas. */
function glomd(punkter: readonly Prispunkt[], nuMs: number, sparMs: number): boolean {
  return punkter.length === 1 && punkter[0].p === null && Date.parse(punkter[0].t) <= nuMs - sparMs;
}

export interface Historikutfall {
  /** Förloppen efter den här avläsningen, per produkt och variant. */
  forlopp: Map<string, Map<string, Prispunkt[]>>;
  /** Produkter vars rad ska sparas. */
  attSpara: Prisforlopp[];
  /** Produkter vars rad ska tas bort (inget kvar att minnas). */
  attTaBort: string[];
  /** Nya punkter i historiken (prisändringar och varianter som slutat eller börjat gå att köpa). */
  nyaPunkter: number;
}

/**
 * Lägger den här körningens avläsning till förloppen. En produkt som aldrig gått
 * att köpa får ingen rad; en variant som inte längre finns får punkten "gick
 * inte att köpa".
 */
export function lasIn(
  befintliga: readonly Prisforlopp[],
  katalog: readonly VariantPris[],
  nuMs: number,
  sparMs: number,
): Historikutfall {
  const nuIso = new Date(nuMs).toISOString();
  const perProdukt = new Map<string, VariantPris[]>();
  for (const v of katalog) {
    const l = perProdukt.get(v.productId) ?? [];
    l.push(v);
    perProdukt.set(v.productId, l);
  }
  const hist = new Map<string, Map<string, Prispunkt[]>>();
  for (const f of befintliga) {
    const m = new Map<string, Prispunkt[]>();
    for (const v of f.varianter) m.set(v.id, sortera(v.punkter));
    hist.set(f.productId, m);
  }

  const ut: Historikutfall = { forlopp: new Map(), attSpara: [], attTaBort: [], nyaPunkter: 0 };
  const produkter = new Set<string>([...perProdukt.keys(), ...hist.keys()]);
  for (const pid of [...produkter].sort()) {
    const katalogens = perProdukt.get(pid) ?? [];
    const gamla = hist.get(pid);
    if (!gamla && !katalogens.some((v) => v.erbjuden && v.prisOre !== null)) continue;
    const nya = new Map<string, Prispunkt[]>();
    let andrad = !gamla;
    const sedda = new Set<string>();
    const lagg = (id: string, p: number | null) => {
      sedda.add(id);
      const fore = gamla?.get(id) ?? [];
      if (fore.length === 0 && p === null) return; // en variant som aldrig gått att köpa
      const efter = laggTill(fore, nuIso, p);
      if (efter.andrad) {
        andrad = true;
        ut.nyaPunkter++;
      }
      const trimmad = trimma(efter.punkter, nuMs);
      if (trimmad.andrad) andrad = true;
      if (glomd(trimmad.punkter, nuMs, sparMs)) {
        if (fore.length > 0) andrad = true;
        return;
      }
      nya.set(id, trimmad.punkter);
    };
    for (const v of katalogens) lagg(v.variantId, v.erbjuden ? v.prisOre : null);
    if (gamla) for (const id of gamla.keys()) if (!sedda.has(id)) lagg(id, null);
    if (nya.size === 0) {
      if (gamla) ut.attTaBort.push(pid);
      continue;
    }
    ut.forlopp.set(pid, nya);
    if (andrad) {
      const varianter: Variantforlopp[] = [...nya.entries()].map(([id, punkter]) => ({ id, punkter }));
      ut.attSpara.push({ productId: pid, varianter });
    }
  }
  return ut;
}

// ── Körningen ────────────────────────────────────────────────────────────

export interface ReaKorOpts {
  /** Default: torrt. Torrt läser och räknar, men sparar och skriver ingenting. */
  torr?: boolean;
  /** Tidpunkt (ms) då inga nya produkter påbörjas. */
  deadline: number;
  /** Högst så många produkter skrivs den här körningen. */
  limit?: number;
  /** Masspärren: högst så många nya reaskyltar den här körningen. Default `MAX_NYA`. */
  maxNya?: number;
  /** Bara de här produkterna får jämförpriset skrivet (provet). Historiken förs för alla. */
  ids?: string[];
  sparMs?: number;
}

export interface ReaProdukt {
  id: string;
  status: JamforStatus;
  satta: number;
  borttagna: number;
  prisAndrat?: number;
  variantbild?: VariantbildStatus;
  avvikelser?: string[];
  felText?: string;
}

export interface ReaRapport {
  torr: boolean;
  /** Strömbrytaren. */
  skriv: boolean;
  seedKlar: boolean;
  varianter: number;
  erbjudna: number;
  historik: {
    produkter: number;
    nyaPunkter: number;
    sparade: number;
    borttagna: number;
    fel: number;
    /** En ny lucka: körningen innan låg för länge sedan. */
    nyLucka?: Lucka;
    luckor: number;
  };
  beslut: {
    /** Varianter som har (eller ska få) rea efter den här körningen. */
    rea: number;
    /** Varianter i en levande auktion: rörs inte. */
    auktionLevande: number;
    perSkal: Record<string, number>;
  };
  plan: {
    /** Varianter som ska få ett jämförpris där det saknas. */
    nya: number;
    /** Varianter vars jämförpris ska bytas. */
    byten: number;
    /** Varianter vars jämförpris ska tas bort. */
    borttagningar: number;
    produkter: number;
    /** Masspärren slog till: inga nya den här körningen, bara borttagningar. */
    nyaSparrade: boolean;
  };
  skrivet: {
    produkter: number;
    satta: number;
    borttagna: number;
    redan: number;
    prisAndrat: number;
    fel: number;
    avvikelser: number;
  };
  /** Varför inga jämförpriser skrevs, när inga skrevs fast planen ville. */
  skrevInte?: "torr" | "seed_saknas" | "strombrytaren_av" | "historiken_sparades_inte";
  stoppad: boolean;
  stoppadAv?: "las" | "avvikelse" | "fel_i_foljd" | "tidsbudget";
  ejNadda: number;
  /** Produkter som får rea efter körningen (Wix-id, högst 100). */
  medRea: string[];
  /** Bara det som inte gick rent. */
  produkter: ReaProdukt[];
}

function tomRapport(torr: boolean): ReaRapport {
  return {
    torr,
    skriv: false,
    seedKlar: false,
    varianter: 0,
    erbjudna: 0,
    historik: { produkter: 0, nyaPunkter: 0, sparade: 0, borttagna: 0, fel: 0, luckor: 0 },
    beslut: { rea: 0, auktionLevande: 0, perSkal: {} },
    plan: { nya: 0, byten: 0, borttagningar: 0, produkter: 0, nyaSparrade: false },
    skrivet: { produkter: 0, satta: 0, borttagna: 0, redan: 0, prisAndrat: 0, fel: 0, avvikelser: 0 },
    stoppad: false,
    ejNadda: 0,
    medRea: [],
    produkter: [],
  };
}

const agareId = () => `rea-${Math.random().toString(36).slice(2, 10)}`;

export async function korRea(deps: ReaDeps, opts: ReaKorOpts): Promise<ReaRapport> {
  const torr = opts.torr !== false;
  const nu = deps.nu ?? Date.now;
  const vanta = deps.vanta ?? paus;
  const skriv = deps.skriv ?? skrivJamforpriser;
  const sparMs = opts.sparMs ?? 65 * DAG_MS;
  const rapport = tomRapport(torr);
  const nuMs = nu();
  const nuIso = new Date(nuMs).toISOString();
  const agare = agareId();

  if (!torr && !(await deps.lager.tagLas(agare, nuMs, LAS_TTL_MS))) {
    rapport.stoppad = true;
    rapport.stoppadAv = "las";
    return rapport;
  }
  try {
    const [tillstand, katalog, befintliga, auktioner] = await Promise.all([
      deps.lager.lasTillstand(),
      deps.lasVariantpriser(),
      deps.lager.allaForlopp(),
      deps.lasAuktioner(),
    ]);
    rapport.skriv = tillstand.skriv;
    rapport.seedKlar = tillstand.seedKlar;
    rapport.varianter = katalog.length;
    rapport.erbjudna = katalog.filter((v) => v.erbjuden).length;

    // 1. Avläsningen in i historiken.
    const h = lasIn(befintliga, katalog, nuMs, sparMs);
    rapport.historik.produkter = h.forlopp.size;
    rapport.historik.nyaPunkter = h.nyaPunkter;

    // 2. Luckan sedan förra körningen som sparade historiken.
    let luckor = trimmaLuckor(tillstand.luckor ?? [], nuMs);
    const senast = tillstand.senast ? Date.parse(tillstand.senast) : NaN;
    if (Number.isFinite(senast) && nuMs - senast > MAX_GLAPP_MS) {
      const nyLucka = { fran: tillstand.senast as string, till: nuIso };
      rapport.historik.nyLucka = nyLucka;
      luckor = [...luckor, nyLucka];
    }
    rapport.historik.luckor = luckor.length;

    // 3. Besluten.
    const auktion = auktionslagen(auktioner);
    const urval = opts.ids?.length ? new Set(opts.ids) : null;
    const andringar = new Map<string, Map<string, OnskatJamforpris>>();
    const medRea = new Set<string>();
    let nya = 0;
    for (const v of katalog) {
      const b = beslutaVariant(v, h.forlopp.get(v.productId)?.get(v.variantId) ?? [], auktion.get(v.productId), luckor, nuMs);
      if (b.rorInte) {
        rapport.beslut.auktionLevande++;
        continue;
      }
      rapport.beslut.perSkal[b.skal] = (rapport.beslut.perSkal[b.skal] ?? 0) + 1;
      if (b.jamforOre !== null) {
        rapport.beslut.rea++;
        medRea.add(v.productId);
      }
      if (b.jamforOre === v.jamforOre) continue;
      if (urval && !urval.has(v.productId)) continue;
      if (b.jamforOre === null) rapport.plan.borttagningar++;
      else if (v.jamforOre === null) {
        rapport.plan.nya++;
        nya++;
      } else rapport.plan.byten++;
      const m = andringar.get(v.productId) ?? new Map<string, OnskatJamforpris>();
      m.set(v.variantId, { jamforOre: b.jamforOre, prisOre: v.prisOre });
      andringar.set(v.productId, m);
    }
    rapport.medRea = [...medRea].sort().slice(0, MAX_UTSKRIVNA);

    // ☠️ Masspärren: för många nya på en gång skrivs inte, bara borttagningarna.
    const maxNya = opts.maxNya ?? MAX_NYA;
    if (nya > maxNya) {
      rapport.plan.nyaSparrade = true;
      for (const [pid, m] of andringar) {
        for (const [vid, o] of m) if (o.jamforOre !== null) m.delete(vid);
        if (m.size === 0) andringar.delete(pid);
      }
    }
    const plan = [...andringar.entries()].sort(([a], [b]) => a.localeCompare(b));
    rapport.plan.produkter = plan.length;

    if (torr) {
      rapport.skrevInte = "torr";
      rapport.ejNadda = plan.length;
      return rapport;
    }

    // 4. Historiken sparas. Föll den rörs inga priser den här körningen, och
    //    `senast` står kvar, så att nästa körning ser luckan.
    const felSpara = await deps.lager.sparaForlopp(h.attSpara);
    const felTaBort = await deps.lager.taBortForlopp(h.attTaBort);
    rapport.historik.sparade = h.attSpara.length - felSpara.length;
    rapport.historik.borttagna = h.attTaBort.length - felTaBort.length;
    rapport.historik.fel = felSpara.length + felTaBort.length;
    if (felSpara.length > 0) {
      rapport.skrevInte = "historiken_sparades_inte";
      rapport.ejNadda = plan.length;
      return rapport;
    }
    await deps.lager.uppdateraTillstand({ senast: nuIso, luckor });

    // 5. Jämförpriserna.
    if (!tillstand.seedKlar) rapport.skrevInte = "seed_saknas";
    else if (!tillstand.skriv) rapport.skrevInte = "strombrytaren_av";
    if (rapport.skrevInte) {
      rapport.ejNadda = plan.length;
      return rapport;
    }
    const grans = opts.limit && opts.limit > 0 ? opts.limit : Infinity;
    let felIFoljd = 0;
    let behandlade = 0;
    for (const [pid, onskat] of plan) {
      if (rapport.skrivet.produkter >= grans) break;
      if (nu() > opts.deadline) {
        rapport.stoppad = true;
        rapport.stoppadAv = "tidsbudget";
        break;
      }
      if (behandlade > 0) await vanta(PAUS_MELLAN_PRODUKTER_MS);
      behandlade++;
      const u = await skriv(deps.wix, pid, onskat, { vanta });
      rapport.skrivet.redan += u.redan;
      rapport.skrivet.prisAndrat += u.prisAndrat;
      if (u.status === "skriven") {
        rapport.skrivet.produkter++;
        rapport.skrivet.satta += u.satta;
        rapport.skrivet.borttagna += u.borttagna;
        felIFoljd = 0;
      } else if (u.status === "redan_klar") {
        felIFoljd = 0;
      } else if (u.status === "fel") {
        rapport.skrivet.fel++;
        felIFoljd++;
      } else if (u.status === "avvikelse") {
        rapport.skrivet.avvikelser++;
      }
      const problem = (u.status !== "skriven" && u.status !== "redan_klar") || u.variantbild === "fel" || u.variantbild === "ej_rattad";
      if (problem && rapport.produkter.length < MAX_UTSKRIVNA) {
        rapport.produkter.push({
          id: pid,
          status: u.status,
          satta: u.satta,
          borttagna: u.borttagna,
          ...(u.prisAndrat ? { prisAndrat: u.prisAndrat } : {}),
          ...(u.variantbild ? { variantbild: u.variantbild } : {}),
          ...(u.avvikelser ? { avvikelser: u.avvikelser } : {}),
          ...(u.fel ? { felText: u.fel } : {}),
        });
      }
      if (u.status === "avvikelse") {
        rapport.stoppad = true;
        rapport.stoppadAv = "avvikelse";
        break;
      }
      if (felIFoljd >= MAX_FEL_I_FOLJD) {
        rapport.stoppad = true;
        rapport.stoppadAv = "fel_i_foljd";
        break;
      }
    }
    rapport.ejNadda = plan.length - behandlade;
    return rapport;
  } finally {
    if (!torr) await deps.lager.slappLas(agare).catch(() => undefined);
  }
}

// ── Historiken fylls bakåt ur butikens dagliga avläsning ─────────────────

export interface SeedOpts {
  /** Default: torrt. */
  torr?: boolean;
  /** Fyll bakåt även om det redan är gjort (efter en ändring i regeln). */
  igen?: boolean;
}

export interface SeedRapport {
  torr: boolean;
  redanGjord: boolean;
  stoppadAv?: "las";
  butiksrader: number;
  dagar: number;
  fullstandigaDagar: number;
  /** Luckor mellan två fullständiga dagar (en avläsning som föll). */
  luckor: number;
  produkterIButikensHistorik: number;
  /** Produkter med en variant i katalogen: de enda som fylls bakåt. */
  envariant: number;
  /** Produkter med flera varianter: deras historik börjar vid första körningen. */
  flervariantHoppade: number;
  /** Produkter vars förlopp fick punkter bakåt. */
  seedade: number;
  punkter: number;
  sparadeFel: number;
}

/**
 * Fyller förloppen bakåt ur butikens dagliga avläsning (headless-site
 * lib/price-snapshot.ts, `FyndplatsPrishistorik`), en gång.
 *
 * ☠️ BARA PRODUKTER MED EN VARIANT. Butiken sparar det lägsta priset bland
 * produktens varianter. För en produkt med flera är det ingen enskild variants
 * pris, och när en billigare färg slogs ihop med sidan hade den nya färgens
 * historik visat en "sänkning" som aldrig hänt.
 *
 * Bara punkter FÖRE förloppets första punkt läggs till (`slaIhopMedSeed`), så
 * att timavläsningen som redan gjorts aldrig skrivs över.
 */
export async function seedaHistorik(deps: ReaDeps, opts: SeedOpts = {}): Promise<SeedRapport> {
  const torr = opts.torr !== false;
  const nu = deps.nu ?? Date.now;
  const nuMs = nu();
  const agare = agareId();
  const rapport: SeedRapport = {
    torr,
    redanGjord: false,
    butiksrader: 0,
    dagar: 0,
    fullstandigaDagar: 0,
    luckor: 0,
    produkterIButikensHistorik: 0,
    envariant: 0,
    flervariantHoppade: 0,
    seedade: 0,
    punkter: 0,
    sparadeFel: 0,
  };
  if (!torr && !(await deps.lager.tagLas(agare, nuMs, LAS_TTL_MS))) {
    rapport.stoppadAv = "las";
    return rapport;
  }
  try {
    const tillstand: ReaTillstand = await deps.lager.lasTillstand();
    if (tillstand.seedKlar && !opts.igen) {
      rapport.redanGjord = true;
      return rapport;
    }
    const [rader, katalog, befintliga] = await Promise.all([
      deps.lager.butikensHistorik(),
      deps.lasVariantpriser(),
      deps.lager.allaForlopp(),
    ]);
    rapport.butiksrader = rader.length;

    const antalPerDag = new Map<string, number>();
    const perProdukt = new Map<string, Dagsrad[]>();
    for (const r of rader) {
      antalPerDag.set(r.datum, (antalPerDag.get(r.datum) ?? 0) + 1);
      const l = perProdukt.get(r.productId) ?? [];
      l.push({ datum: r.datum, prisOre: r.prisOre });
      perProdukt.set(r.productId, l);
    }
    const fullstandiga = fullstandigaDagar(antalPerDag);
    rapport.dagar = antalPerDag.size;
    rapport.fullstandigaDagar = fullstandiga.size;
    rapport.produkterIButikensHistorik = perProdukt.size;

    // En avläsning som föll är en lucka: ett dygn utan pris däremellan.
    const dagar = [...fullstandiga].sort();
    const nyaLuckor: Lucka[] = [];
    for (let i = 1; i < dagar.length; i++) {
      const fran = Date.parse(`${dagar[i - 1]}T02:30:00.000Z`);
      const till = Date.parse(`${dagar[i]}T02:30:00.000Z`);
      if (till - fran > DAG_MS + MAX_GLAPP_MS) {
        nyaLuckor.push({ fran: new Date(fran).toISOString(), till: new Date(till).toISOString() });
      }
    }
    rapport.luckor = nyaLuckor.length;

    const varianterPerProdukt = new Map<string, string[]>();
    for (const v of katalog) {
      const l = varianterPerProdukt.get(v.productId) ?? [];
      l.push(v.variantId);
      varianterPerProdukt.set(v.productId, l);
    }
    const befintligaPer = new Map(befintliga.map((f) => [f.productId, f]));

    const attSpara: Prisforlopp[] = [];
    for (const [pid, dagsrader] of perProdukt) {
      const varianter = varianterPerProdukt.get(pid) ?? [];
      if (varianter.length !== 1) {
        if (varianter.length > 1) rapport.flervariantHoppade++;
        continue;
      }
      rapport.envariant++;
      const vid = varianter[0];
      const seed = seedPunkter(dagsrader, fullstandiga);
      if (seed.length === 0) continue;
      const fore = befintligaPer.get(pid);
      const gamla = fore?.varianter.find((v) => v.id === vid)?.punkter ?? [];
      const ihop = slaIhopMedSeed(gamla, seed);
      if (ihop.tillagda === 0) continue;
      const trimmad = trimma(ihop.punkter, nuMs).punkter;
      rapport.seedade++;
      rapport.punkter += ihop.tillagda;
      const ovriga = (fore?.varianter ?? []).filter((v) => v.id !== vid);
      attSpara.push({ productId: pid, varianter: [...ovriga, { id: vid, punkter: trimmad }] });
    }

    if (torr) return rapport;
    const fel = await deps.lager.sparaForlopp(attSpara);
    rapport.sparadeFel = fel.length;
    if (fel.length > 0) return rapport;
    await deps.lager.uppdateraTillstand({
      seedKlar: true,
      seedAt: new Date(nuMs).toISOString(),
      luckor: trimmaLuckor([...(tillstand.luckor ?? []), ...nyaLuckor], nuMs),
    });
    return rapport;
  } finally {
    if (!torr) await deps.lager.slappLas(agare).catch(() => undefined);
  }
}
