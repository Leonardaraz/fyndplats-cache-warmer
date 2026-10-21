// Fler bilder till en färg på en sammanslagen Aosom-sida (2026-10-21).
//
// VARFÖR DEN FINNS
//
// Leonard 2026-10-21, med en skärmbild av strandparasollen där färgen Grön visade
// två bilder: "kan du hämta bilderna till de varianter som har 4 eller mindre och
// koppla rätt och kolla att rätt bild syns i live sidan". Mätningen samma dag
// (tools/polish-gates/katalogkontroll-farg-bilder.js, butikens ägarregler): 539 av
// 951 publicerade sidor med färgval har minst ett färgval som visar fyra bilder
// eller färre, och 442 av dem är Aosom-sidor med en artikel per färg (240 med två
// färger, 128 med tre, 57 med fyra, 17 med fem eller fler).
//
// Importen tar feedens position 1, 2, 3, 8 och 9, och poleringen stryker det som
// bär text eller märke. En färg som kom in genom en sammanslagning fick dessutom
// bara en del av givarens bilder. Feedens övriga positioner (3, 8, 9 och 10 är de
// som oftast är rena: 77, 80, 93 och 53 procent, CLAUDE.md) finns kvar hos
// leverantören, men inget verktyg kunde hämta dem per färg:
// `aosom-bildkandidater` vägrar en sammanslagen sida (`flera_artiklar`), och
// `aosom-livsbild` tar bara position 2.
//
// TRE LÄGEN, SAMMA FORM SOM MILJÖBILDSVERKTYGET (./livsbild.ts)
//
//   kandidater  Laddar upp feedens begärda positioner för varje färgs artikel till
//               Media Manager, utan att röra produkten. Positioner som redan syns
//               i färgens vy hoppas över. Torrkörning som standard.
//   plan        Räknar fram vad en skrivning gör för de godkända filerna: lägger
//               dem efter färgens sista bild i galleriet och länkar dem till
//               färgen. Ger planens sha.
//   skriv       Skriver planen, steg för steg som färgbilderna (galleriet ensamt,
//               länkarna med options + variantsInfo ordagrant, återläsning,
//               variantbilden), och sparar kopplingen fil → källa i mappningen.
//
// En människa tittar på varje kandidat före `plan`: 46 procent av feedens bilder
// bär tysk text inbränd, och en logotyp eller ett märke syns inte i någon
// grind. Verktyget väljer aldrig bilder.
//
// FEM SAKER SOM INTE SKA TAS BORT
//
// 1. ☠️ SVARET ÄR PUBLIKT (Actions-loggen). Det bär bara Wix produkt-id, val-id,
//    färgnamn, Wix egna fil-id och wixstatic-adresser, räknare och hinderkoder:
//    aldrig artikelnummer, feedens adresser eller Aosoms produktadress. Ett
//    media-fel följer inte med, för det bär källadressen.
// 2. ☠️ EN BILD TILLHÖR EN FÄRG. Filerna länkas till färgen de hämtades för, och
//    en fil vars källa inte är en position hos färgens egen artikel blir
//    `annan_kalla`. Ett par som klistrats fel ska inte bli en bild på fel färg
//    (runbooken: lägg aldrig en annan färgs bild på ett val).
// 3. ☠️ INGEN BILD FALLER UR GALLERIET OCH INGEN LÄNK TAPPAS. Huvudbilden och
//    varje färgs första bild rörs inte, alla nya bilder läggs EFTER färgens sista
//    bild, och `kontrolleraLivsplan` fäller en plan som bryter något av det.
// 4. ☠️ GALLERIET SKRIVS VID ID, ALDRIG VID ADRESS. En wixstatic-adress får Wix
//    att importera om bilden till en NY fil (CLAUDE.md, bildimporten).
// 5. ☠️ SKRIVNINGEN KRÄVER PLANENS SHA. Planen räknas om ur färska läsningar i
//    samma anrop; har sidan ändrats sedan en människa läste planen skrivs
//    ingenting. Sha:n täcker filerna och deras alt-texter.
//
// ⚠️ Kandidaterna som ingen godkänner tas av bildstädningen efter tre dygns
// karens (lib/store/bildstadning-karens.ts). En godkänd kandidat måste alltså
// skrivas inom karenstiden, annars laddas den upp igen.

import { createHash } from "node:crypto";
import type { ProductMappingRecord } from "../store";
import type { AosomRow } from "./feed";
import { aosomArtikelbild } from "./artiklar";
import {
  MAX_BILDER,
  andrar,
  aosomRadFor,
  fargOption,
  fargPaVarianten,
  fargVy,
  feedIndex,
  kallorIKlump,
  kandaKallor,
  kontrolleraLivsplan,
  normKalla,
  publikPlan,
  skrivSida,
  tolkaFilId,
  type AtgardPlan,
  type LivsbildDeps,
  type PlanSvar,
  type ProduktPlan,
  type SkrivHinder,
} from "./livsbild";
import { altFor, arTyska, type Bild, type SidOption } from "./fargbilder";
import { lasProdukt } from "./fargbilder-kor";

// ── konstanter ──────────────────────────────────────────────────────────────

/** Positionerna som oftast är rena (3 mått, 8 och 9 detaljer, 10 miljö). */
export const STANDARD_POSITIONER: readonly number[] = [3, 8, 9, 10];
/** Feeden har högst tio bilder per artikel (uppmätt 2026-09-30). Femton är en marginal. */
export const MAX_POSITION = 15;
/** Ett val som visar så här många bilder eller färre är en kandidat. */
export const STANDARD_HOGST_BILDER = 4;
/** Mål (sida eller färg) per kandidatkörning. */
export const MAX_MAL = 50;
/** Sidor per plan och skrivning. */
export const MAX_SIDOR = 25;
/** Filer per färg i en åtgärd. */
export const MAX_FILER_PER_FARG = 12;
export const KANDIDAT_TIDSBUDGET_MS = 150_000;
export const SKRIV_TIDSBUDGET_MS = 200_000;
/** Samma paus som importen håller mellan uppladdningar. */
const PAUS_MS = 150;
const WIXSTATIC = "https://static.wixstatic.com/";

const WIX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VAL_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Husmärken, leverantörer och adresser får aldrig stå i en alt-text. */
const ALT_FORBJUDET =
  /https?:|www\.|\.(?:com|se|de)\b|homcom|outsunny|pawhut|aiyaplay|vinsetto|kleankin|zonekiz|sportnow|durhand|aosom|aliexpress|vevor|succebuy|giantex|costway/i;

const lika = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// ── färgens artiklar ────────────────────────────────────────────────────────

export interface FargArtiklar {
  valId: string;
  /** Valets plats i färgaxeln, 0-baserad. Filnamnet bär den, aldrig namnet. */
  valIndex: number;
  namn: string;
  /** Färgens artiklar i feeden, radens artikel först. */
  rader: AosomRow[];
  hinder?: SkrivHinder;
}

/**
 * Färgens artiklar ur mappningen och feeden, med samma knytning som
 * miljöbildsverktyget (`malForSida`): mappningens `choices.Färg` mot valets namn
 * i Wix. Ett val utan artikel är ett hinder för det valet, inte en gissning.
 * Bara en sammanslagen sida går att läsa här; en enkel sida hämtas med
 * `aosom-bildkandidater`.
 */
export function fargArtiklar(
  rader: readonly ProductMappingRecord[] | undefined,
  optioner: readonly SidOption[],
  feed: ReadonlyMap<string, AosomRow>,
): { hinder: SkrivHinder } | { farg: SidOption; val: FargArtiklar[] } {
  const r = aosomRadFor(rader);
  if ("hinder" in r) return r;
  const bild = aosomArtikelbild(r.rad);
  if (bild.typ === "tvetydig") return { hinder: "tvetydig" };
  if (!bild.artikel) return { hinder: "utan_artikel" };
  const farg = fargOption(optioner);
  if (!farg) return { hinder: "saknar_fargaxel" };
  if (bild.typ === "en") return { hinder: "inte_sammanslagen" };
  const val = farg.val.map((c, valIndex): FargArtiklar => {
    const egna = bild.varianter.filter((v) => lika(fargPaVarianten(v), c.namn)).map((v) => v.artikel);
    // Radens artikel först när den hör till valet.
    const artiklar = [...new Set(egna.includes(bild.artikel) ? [bild.artikel, ...egna] : egna)];
    const bas = { valId: c.id, valIndex, namn: c.namn };
    if (artiklar.length === 0) return { ...bas, rader: [], hinder: "val_utan_artikel" };
    const feedRader = artiklar.map((a) => feed.get(a)).filter((x): x is AosomRow => !!x);
    if (feedRader.length === 0) return { ...bas, rader: [], hinder: "saknas_i_feeden" };
    return { ...bas, rader: feedRader };
  });
  return { farg, val };
}

/** Positionerna ur feeden för färgens första artikel: normerad adress → [position, feedens egen sträng]. */
export function positionerFor(rad: AosomRow): Map<string, { pos: number; url: string }> {
  const ut = new Map<string, { pos: number; url: string }>();
  rad.imageUrls.forEach((url, i) => {
    if (!url) return;
    const k = normKalla(url);
    if (!ut.has(k)) ut.set(k, { pos: i + 1, url });
  });
  return ut;
}

/** Heltal 1–15, sorterade och utan dubbletter. Tomt eller ogiltigt ger standard. */
export function tolkaPositioner(varden: readonly unknown[] | undefined): number[] {
  const ut = new Set<number>();
  for (const v of varden ?? []) {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_POSITION) ut.add(n);
  }
  return ut.size === 0 ? [...STANDARD_POSITIONER] : [...ut].sort((a, b) => a - b);
}

/** Filnamnet i Media Manager. Byggs av wix-id, färgens plats och position — aldrig av källadressen eller namnet. */
export function tillaggFilnamn(wixProductId: string, valNr: number, pos: number): string {
  return `kandidat-${wixProductId.slice(0, 8)}-v${valNr}-${pos}.jpg`;
}

// ── kandidater ──────────────────────────────────────────────────────────────

export interface TillaggMal {
  id: string;
  val?: string;
}

const nyckelAv = (m: TillaggMal) => (m.val ? `${m.id}:${m.val}` : m.id);

/** `wix-id` eller `wix-id:val-id`, kommaseparerade. */
export function tolkaMal(varden: readonly unknown[]): { mal: TillaggMal[] } | { fel: string } {
  const ut = new Map<string, TillaggMal>();
  let felaktiga = 0;
  for (const v of varden) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    const [wix, val, ...rest] = s.split(":").map((x) => x.trim());
    if (!WIX_ID.test(wix ?? "") || rest.length > 0 || (val !== undefined && !VAL_ID.test(val))) {
      felaktiga++;
      continue;
    }
    const m: TillaggMal = { id: wix.toLowerCase(), ...(val ? { val } : {}) };
    ut.set(nyckelAv(m), m);
  }
  // Värdet skrivs aldrig tillbaka: det kan vara ett artikelnummer i fel fält.
  if (felaktiga > 0) return { fel: `${felaktiga} värden är inte wix-id eller wix-id:val-id` };
  if (ut.size === 0) return { fel: "inga mål" };
  if (ut.size > MAX_MAL) return { fel: `högst ${MAX_MAL} mål per körning` };
  return { mal: [...ut.values()].sort((a, b) => nyckelAv(a).localeCompare(nyckelAv(b))) };
}

export interface TillaggKandidat {
  pos: number;
  /** Wix egen fil. */
  fileId: string;
  url: string;
}

export interface TillaggRad {
  id: string;
  val?: string;
  /** Valets plats i färgaxeln (1-baserad), som filnamnet bär. */
  valNr?: number;
  /** Färgens namn i Wix (en etikett som "Grön", aldrig ett artikelnummer). */
  namn?: string;
  /** Antal bilder färgens vy visar i butiken före körningen. */
  nuvarande?: number;
  /** Positioner som redan syns i färgens vy (spårade till källan). */
  finns?: number[];
  /** Bilder i vyn vars källa inte gick att läsa. En kandidat kan då vara en dubblett. */
  okandaKallor?: number;
  /** Positioner som skulle laddas upp (torrkörning) eller laddades upp. */
  attHamta?: number[];
  kandidater: TillaggKandidat[];
  /** Positioner som inte gick att ladda upp. Felet följer inte med. */
  missar: number[];
  hinder?: SkrivHinder;
}

export interface TillaggKandidatSvar {
  lage: "kandidater";
  dryRun: boolean;
  positioner: number[];
  hogstBilder: number;
  rader: TillaggRad[];
  uppladdade: number;
  missar: number;
  /** Mål som tidsbudgeten inte räckte till (nycklar). Skicka dem i nästa körning. */
  kvar: string[];
}

export interface TillaggKandidatOpts {
  positioner?: readonly number[];
  /** Färger som visar högst så här många bilder tas med när målet är en hel sida. */
  hogstBilder?: number;
  dryRun?: boolean;
  tidsbudgetMs?: number;
}

/**
 * Laddar upp feedens begärda positioner för färgens första artikel till Media
 * Manager, utan att röra produkten. Ett mål utan val tar de färger som visar
 * `hogstBilder` bilder eller färre; ett mål med val tar just den färgen.
 * Torrkörning som standard.
 */
export async function hamtaTillaggskandidater(
  mal: readonly TillaggMal[],
  opts: TillaggKandidatOpts,
  deps: LivsbildDeps,
): Promise<TillaggKandidatSvar> {
  const dryRun = opts.dryRun !== false;
  const positioner = tolkaPositioner(opts.positioner);
  const hogst = Number.isInteger(opts.hogstBilder) && (opts.hogstBilder as number) >= 0
    ? (opts.hogstBilder as number)
    : STANDARD_HOGST_BILDER;
  const nu = deps.nu ?? (() => Date.now());
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const budget = opts.tidsbudgetMs ?? KANDIDAT_TIDSBUDGET_MS;
  const start = nu();
  const svar: TillaggKandidatSvar = {
    lage: "kandidater", dryRun, positioner, hogstBilder: hogst, rader: [], uppladdade: 0, missar: 0, kvar: [],
  };
  let feed: Map<string, AosomRow> | null = null;
  let forsta = true;

  for (const [i, m] of mal.entries()) {
    if (i > 0 && nu() - start > budget) {
      svar.kvar = mal.slice(i).map(nyckelAv);
      break;
    }
    const hinderRad = (h: SkrivHinder): void => {
      svar.rader.push({ id: m.id, ...(m.val ? { val: m.val } : {}), kandidater: [], missar: [], hinder: h });
    };
    const sida = await lasProdukt(deps.wix, m.id);
    if (!sida) { hinderRad("saknas_i_wix"); continue; }
    if (!sida.synlig) { hinderRad("inte_publicerad"); continue; }
    const mappning = await deps.hamtaMappning(m.id);
    feed ??= feedIndex(await deps.hamtaFeed());
    const fa = fargArtiklar(mappning ? [mappning] : [], sida.optioner, feed);
    if ("hinder" in fa) { hinderRad(fa.hinder); continue; }

    // Vilka färger?
    let valda = fa.val;
    if (m.val) {
      valda = fa.val.filter((v) => v.valId === m.val);
      if (valda.length === 0) { hinderRad("val_finns_inte"); continue; }
    } else {
      valda = fa.val.filter((v) => fargVy(sida, v.valId).length <= hogst);
    }
    if (valda.length === 0) continue;

    // Källorna för hela galleriet, ur mappningen först och sedan Wix.
    const kalla = kandaKallor(mappning);
    const okanda = sida.bilder.map((b) => b.id).filter((id) => !kalla.has(id));
    for (const [k, v] of await kallorIKlump(deps.hamtaKallor, okanda)) kalla.set(k, v);

    for (const v of valda) {
      const bas: TillaggRad = {
        id: m.id, val: v.valId, valNr: v.valIndex + 1, namn: v.namn, kandidater: [], missar: [],
      };
      svar.rader.push(bas);
      if (v.hinder || v.rader.length === 0) { bas.hinder = v.hinder ?? "val_utan_artikel"; continue; }
      const vy = fargVy(sida, v.valId);
      bas.nuvarande = vy.length;
      const syns = new Set<string>();
      let okandaIVyn = 0;
      for (const id of vy) {
        const k = kalla.get(id);
        if (k) syns.add(normKalla(k));
        else okandaIVyn++;
      }
      if (okandaIVyn > 0) bas.okandaKallor = okandaIVyn;
      const pos = positionerFor(v.rader[0]);
      const finns: number[] = [];
      const att: { pos: number; url: string }[] = [];
      for (const p of positioner) {
        const url = v.rader[0].imageUrls[p - 1];
        if (!url) continue;
        if (syns.has(normKalla(url))) finns.push(p);
        else att.push({ pos: p, url: pos.get(normKalla(url))?.url ?? url });
      }
      bas.finns = finns;
      bas.attHamta = att.map((a) => a.pos);
      if (dryRun) continue;
      for (const a of att) {
        if (!forsta) await vanta(PAUS_MS);
        forsta = false;
        try {
          const fil = await deps.laddaUpp(a.url, tillaggFilnamn(m.id, v.valIndex + 1, a.pos));
          // ☠️ Bara Wix egen adress får stå i svaret. En torrkörd uppladdning
          // (DRY_RUN i miljön) svarar med källadressen — den räknas som en miss.
          if (!fil.id || !fil.url?.startsWith(WIXSTATIC)) throw new Error("inte en Wix-fil");
          bas.kandidater.push({ pos: a.pos, fileId: fil.id, url: fil.url });
          svar.uppladdade++;
        } catch {
          // Felmeddelandet bär källadressen och följer därför inte med.
          bas.missar.push(a.pos);
          svar.missar++;
        }
      }
    }
  }
  return svar;
}

// ── åtgärderna ──────────────────────────────────────────────────────────────

export interface TillaggBild {
  /** Den granskade och godkända filen (Wix fil-id). */
  fil: string;
  /** Svensk alt-text. Utan den byggs "<sidans namn> i färgen <färg>, bild N". */
  alt?: string;
}

export interface TillaggAtgard {
  id: string;
  /** Färgvalets id. */
  val: string;
  bilder: TillaggBild[];
}

const altOk = (a: string) => a.length >= 5 && a.length <= 200 && !arTyska(a) && !ALT_FORBJUDET.test(a);

/**
 * Åtgärderna för `plan` och `skriv`:
 *
 *   [{ "id": "<wix-id>", "val": "<val-id>", "bilder": [{ "fil": "<fil-id>", "alt": "…" }, …] }, …]
 *
 * `bilder` får också vara en lista fil-id som strängar. Ett värde som inte är
 * ett wix-id, val-id eller fil-id vägrar hela listan, och värdet skrivs aldrig
 * tillbaka i felet (det kan vara ett artikelnummer i fel fält).
 */
export function tolkaTillagg(varden: unknown): { atgarder: TillaggAtgard[] } | { fel: string } {
  if (!Array.isArray(varden)) return { fel: "sidor ska vara en lista" };
  const ut = new Map<string, TillaggAtgard>();
  let felaktiga = 0;
  for (const v of varden) {
    const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
    const id = String(o.id ?? "").trim().toLowerCase();
    const val = String(o.val ?? "").trim();
    const lista = Array.isArray(o.bilder) ? o.bilder : null;
    if (!WIX_ID.test(id) || !VAL_ID.test(val) || !lista || lista.length === 0 || lista.length > MAX_FILER_PER_FARG) {
      felaktiga++;
      continue;
    }
    const bilder: TillaggBild[] = [];
    let ok = true;
    for (const b of lista) {
      const fil = tolkaFilId(typeof b === "string" ? b : String((b as Record<string, unknown>)?.fil ?? ""));
      const alt = typeof b === "object" && b !== null && typeof (b as Record<string, unknown>).alt === "string"
        ? String((b as Record<string, unknown>).alt).trim()
        : "";
      if (!fil) { ok = false; break; }
      bilder.push({ fil, ...(alt ? { alt } : {}) });
    }
    if (!ok || new Set(bilder.map((b) => b.fil)).size !== bilder.length) {
      felaktiga++;
      continue;
    }
    const nyckel = `${id}:${val}`;
    if (ut.has(nyckel)) return { fel: "samma färg står två gånger" };
    ut.set(nyckel, { id, val, bilder });
  }
  if (felaktiga > 0) return { fel: `${felaktiga} åtgärder har ogiltigt wix-id, val-id eller fil-id, eller är tomma` };
  if (ut.size === 0) return { fel: "inga åtgärder" };
  if (ut.size > MAX_SIDOR * 8) return { fel: "för många åtgärder" };
  const antalSidor = new Set([...ut.values()].map((a) => a.id)).size;
  if (antalSidor > MAX_SIDOR) return { fel: `högst ${MAX_SIDOR} sidor per körning` };
  return { atgarder: [...ut.values()].sort((a, b) => `${a.id}:${a.val}`.localeCompare(`${b.id}:${b.val}`)) };
}

// ── planen ──────────────────────────────────────────────────────────────────

interface Lage {
  bilder: Bild[];
  optioner: SidOption[];
}

function medLankar(lage: Lage, valId: string, lankade: string[]): SidOption[] {
  return lage.optioner.map((o) =>
    lika(o.namn, "Färg") ? { ...o, val: o.val.map((v) => (v.id === valId ? { ...v, lankade } : v)) } : o,
  );
}

/**
 * Lägger `nya` efter färgens sista bild i galleriet och sist i valets
 * `linkedMedia`. Galleriets första bild och valets första länkade bild rörs
 * inte, och ingen bild tas bort.
 */
export function laggTillIVal(lage: Lage, valId: string, nya: readonly Bild[]): { hinder: SkrivHinder } | Lage {
  const c = fargOption(lage.optioner)?.val.find((v) => v.id === valId);
  if (!c || c.lankade.length === 0) return { hinder: "val_utan_bild" };
  const platser = c.lankade.map((l) => lage.bilder.findIndex((b) => b.id === l)).filter((i) => i >= 0);
  if (platser.length === 0) return { hinder: "plan_ogiltig" };
  const efter = Math.max(...platser);
  const bilder = [...lage.bilder.slice(0, efter + 1), ...nya.map((b) => ({ ...b })), ...lage.bilder.slice(efter + 1)];
  const optioner = medLankar(lage, valId, [...c.lankade, ...nya.map((b) => b.id)]);
  // Varje ny bild ska synas i det butiken visar för färgen.
  const vy = fargVy({ bilder, optioner }, valId);
  if (nya.some((b) => !vy.includes(b.id))) return { hinder: "plan_ogiltig" };
  return { bilder, optioner };
}

/** Alt-texten är unik på sidan: en träff på en annan bild får ", bild N" efter sig. */
function unikAlt(alt: string, redan: Set<string>): string {
  let a = alt;
  for (let n = 2; redan.has(a.toLowerCase()) && n < 200; n++) a = `${alt}, bild ${n}`.slice(0, 200);
  return a;
}

type SidaIn = NonNullable<Awaited<ReturnType<typeof lasProdukt>>>;

/**
 * Planen för en sida: färgernas åtgärder i tur och ordning på ett arbetsläge.
 *
 * @param fa     Färgens artiklar ur mappningen och feeden, eller hindret.
 * @param kalla  Fil-id → källa för galleriets bilder och de nya filerna.
 */
export function planeraSidaTillagg(
  sida: SidaIn | null,
  id: string,
  atgarder: readonly TillaggAtgard[],
  fa: { hinder: SkrivHinder } | { farg: SidOption; val: FargArtiklar[] },
  kalla: ReadonlyMap<string, string>,
): ProduktPlan {
  const plan: ProduktPlan = {
    id,
    galleriFore: sida?.bilder.map((b) => ({ ...b })) ?? [],
    galleriEfter: sida?.bilder.map((b) => ({ ...b })) ?? [],
    val: [],
    atgarder: [],
  };
  if (!sida) {
    plan.hinder = "saknas_i_wix";
    return plan;
  }
  if (!sida.synlig) {
    plan.hinder = "inte_publicerad";
    return plan;
  }
  const farg = fargOption(sida.optioner);
  if (farg) {
    plan.val = farg.val.map((v) => ({ valId: v.id, namn: v.namn, lankadeFore: [...v.lankade], lankadeEfter: [...v.lankade] }));
  }
  let lage: Lage = {
    bilder: plan.galleriEfter,
    optioner: sida.optioner.map((o) => ({ ...o, val: o.val.map((v) => ({ ...v, lankade: [...v.lankade] })) })),
  };
  const redanAlt = new Set(plan.galleriEfter.map((b) => b.alt.trim().toLowerCase()).filter(Boolean));

  for (const a of atgarder) {
    // En AtgardPlan per fil, så att svaret visar hindret på rätt fil.
    const poster: AtgardPlan[] = a.bilder.map((b) => ({ val: a.val, typ: "infoga" as const, kalla: "okand" as const, fil: b.fil }));
    plan.atgarder.push(...poster);
    const hindraAlla = (h: SkrivHinder) => { for (const p of poster) p.hinder = p.hinder ?? h; };

    if ("hinder" in fa) { hindraAlla(fa.hinder); continue; }
    const v = fa.val.find((x) => x.valId === a.val);
    if (!v) { hindraAlla("val_finns_inte"); continue; }
    if (v.hinder || v.rader.length === 0) { hindraAlla(v.hinder ?? "val_utan_artikel"); continue; }
    const c = fargOption(lage.optioner)?.val.find((x) => x.id === a.val);
    if (!c) { hindraAlla("val_finns_inte"); continue; }
    if (c.lankade.length === 0) { hindraAlla("val_utan_bild"); continue; }

    // Färgens källor: första artikelns positioner, och övriga artiklars om färgen har fler.
    const positioner = new Map<string, string>();
    for (const rad of v.rader) for (const [k, p] of positionerFor(rad)) if (!positioner.has(k)) positioner.set(k, p.url);

    const nya: Bild[] = [];
    const sparaKalla = new Map<string, string>();
    for (const [i, b] of a.bilder.entries()) {
      const p = poster[i];
      if (lage.bilder.some((x) => x.id === b.fil) || nya.some((x) => x.id === b.fil)) { p.hinder = "finns_redan"; continue; }
      if (lage.bilder.length + nya.length >= MAX_BILDER) { p.hinder = "fullt"; continue; }
      const k = kalla.get(b.fil);
      if (k) {
        // Filen kom någon annanstans ifrån: en annan färgs artikel eller en annan
        // produkt. Ett par som klistrats fel ska inte bli en bild på fel färg.
        const feedUrl = positioner.get(normKalla(k));
        if (!feedUrl) { p.hinder = "annan_kalla"; continue; }
        p.kalla = "matchar";
        sparaKalla.set(b.fil, feedUrl);
      }
      if (b.alt !== undefined && !altOk(b.alt)) { p.hinder = "ogiltig_alt"; continue; }
      const nr = c.lankade.length + nya.length + 1;
      const alt = unikAlt(b.alt ?? altFor(sida.namn, { Färg: c.namn }, nr), redanAlt);
      redanAlt.add(alt.toLowerCase());
      nya.push({ id: b.fil, alt });
      if (sparaKalla.has(b.fil)) p.sparaKalla = sparaKalla.get(b.fil);
    }
    // En fil med hinder tas inte med. De övriga i åtgärden skrivs ändå.
    const attLagga = nya.filter((n) => poster.some((p) => p.fil === n.id && !p.hinder));
    if (attLagga.length === 0) continue;
    const placerad = laggTillIVal(lage, a.val, attLagga);
    if ("hinder" in placerad) {
      for (const n of attLagga) {
        const p = poster.find((x) => x.fil === n.id);
        if (p) p.hinder = placerad.hinder;
      }
      continue;
    }
    lage = placerad;
  }

  plan.galleriEfter = lage.bilder;
  const fargEfter = fargOption(lage.optioner);
  for (const v of plan.val) v.lankadeEfter = [...(fargEfter?.val.find((x) => x.id === v.valId)?.lankade ?? v.lankadeFore)];
  if (kontrolleraLivsplan(plan).length > 0) {
    plan.hinder = "plan_ogiltig";
    plan.galleriEfter = plan.galleriFore.map((b) => ({ ...b }));
    for (const v of plan.val) v.lankadeEfter = [...v.lankadeFore];
  }
  return plan;
}

/**
 * sha256 av åtgärderna och det som skrivs, i kanonisk form. Samma åtgärder mot
 * samma sidor ger samma sha; en ändrad lista, en ändrad alt-text ELLER en sida
 * som ändrats sedan planen ger en annan, och då skrivs ingenting.
 */
export function planShaTillagg(atgarder: readonly TillaggAtgard[], planer: readonly ProduktPlan[]): string {
  const kanon = {
    v: "aosom-fargtillagg:v1",
    par: atgarder.map((a) => `${a.id}:${a.val}:${a.bilder.map((b) => `${b.fil}=${b.alt ?? ""}`).join(",")}`).sort(),
    sidor: [...planer]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((p) => ({
        id: p.id,
        hinder: p.hinder ?? "",
        fore: p.galleriFore.map((b) => b.id),
        galleri: p.galleriEfter.map((b) => [b.id, b.alt]),
        val: p.val.map((v) => [v.valId, v.lankadeEfter]),
        atgarder: p.atgarder.map((a) => [a.val ?? "", a.typ, a.fil ?? "", a.hinder ?? ""]),
      })),
  };
  return createHash("sha256").update(JSON.stringify(kanon)).digest("hex");
}

/**
 * Planerna ur färska läsningar. Samma väg i `plan` och `skriv`, så att samma
 * åtgärder mot oförändrade sidor ger samma sha.
 */
export async function planeraTillagg(atgarder: readonly TillaggAtgard[], deps: LivsbildDeps): Promise<ProduktPlan[]> {
  const perSida = new Map<string, TillaggAtgard[]>();
  for (const a of atgarder) perSida.set(a.id, [...(perSida.get(a.id) ?? []), a]);
  // Färgerna i en fast ordning: planen och sha:n ska inte bero på listans ordning.
  for (const lista of perSida.values()) lista.sort((x, y) => x.val.localeCompare(y.val));
  let feed: Map<string, AosomRow> | null = null;
  const las: {
    id: string;
    sida: SidaIn | null;
    rad: ProductMappingRecord | null;
    fa: { hinder: SkrivHinder } | { farg: SidOption; val: FargArtiklar[] };
  }[] = [];
  for (const id of [...perSida.keys()].sort()) {
    const sida = await lasProdukt(deps.wix, id);
    const rad = await deps.hamtaMappning(id);
    feed ??= feedIndex(await deps.hamtaFeed());
    las.push({ id, sida, rad, fa: fargArtiklar(rad ? [rad] : [], sida?.optioner ?? [], feed) });
  }
  // Källorna för alla gallerier och alla nya filer, i ett svep.
  // ☠️ Ett anrop som FALLER är inte "okänd källa": då hade spärren mot fel källa
  // (`annan_kalla`) släppt igenom allt. Det kastar med fast text.
  const kalla = new Map<string, string>();
  for (const l of las) for (const [k, v] of kandaKallor(l.rad)) kalla.set(k, v);
  const okanda = [
    ...las.flatMap((l) => l.sida?.bilder.map((b) => b.id) ?? []),
    ...atgarder.flatMap((a) => a.bilder.map((b) => b.fil)),
  ].filter((id) => !kalla.has(id));
  for (const [k, v] of await kallorIKlump(deps.hamtaKallor, okanda)) kalla.set(k, v);

  return las.map((l) => planeraSidaTillagg(l.sida, l.id, perSida.get(l.id)!, l.fa, kalla));
}

/**
 * `plan` och `skriv`. I `skriv` räknas planen om ur färska läsningar och
 * jämförs med `bekrafta`; skiljer de sig skrivs ingenting (`stoppadAv: "sha"`).
 * Skrivningen är livsbildsverktygets `skrivSida`: galleriet ensamt, länkarna med
 * options + variantsInfo ordagrant och `visible`, återläsning, variantbild och
 * sist kopplingen fil → källa i mappningen.
 */
export async function planeraOchSkrivTillagg(
  atgarder: readonly TillaggAtgard[],
  opts: { skriv: boolean; bekrafta?: string; tidsbudgetMs?: number },
  deps: LivsbildDeps,
): Promise<PlanSvar> {
  const nu = deps.nu ?? (() => Date.now());
  const budget = opts.tidsbudgetMs ?? SKRIV_TIDSBUDGET_MS;
  const start = nu();
  const planer = await planeraTillagg(atgarder, deps);
  const svar: PlanSvar = {
    lage: opts.skriv ? "skriv" : "plan",
    sha: planShaTillagg(atgarder, planer),
    produkter: planer.map(publikPlan),
    skrivbara: planer.filter(andrar).length,
    utfall: [] as ParUtfallLista,
    skrivna: 0,
    stoppadAv: "klart",
    kvar: [],
  };
  if (!opts.skriv) return svar;
  if (opts.bekrafta !== svar.sha) {
    svar.stoppadAv = "sha";
    return svar;
  }
  const attSkriva = planer.filter(andrar);
  for (const [i, p] of attSkriva.entries()) {
    if (i > 0 && nu() - start > budget) {
      svar.stoppadAv = "tidsbudget";
      svar.kvar = attSkriva.slice(i).map((x) => x.id);
      break;
    }
    const u = await skrivSida(p, deps);
    svar.utfall.push(u);
    if (!u.ok) {
      svar.stoppadAv = "avvikelse";
      break;
    }
    svar.skrivna++;
  }
  return svar;
}

type ParUtfallLista = PlanSvar["utfall"];
