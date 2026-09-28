// Radering av pensionerade Aosom-utkast ur Wix (Leonards beslut 2026-09-28).
//
// VARFÖR DEN FINNS
//
// Ett utkast pensioneras när det blir en färg på en publicerad sida
// (sammanslagningen), när det är en dubblett av en sida vi redan säljer
// (ommappningen, poleringens stämpel) eller när någon avvisar det i
// /admin/queue. Wix-produkten ligger sedan kvar, dold, med bilder som tar
// plats: 2026-09-28 bar 327 publicerade sidor 524 sammanslagna färger, och
// varje givare har kvar sina fem bilder. Så länge produkten finns räknar
// bildstädningen bilderna som använda.
//
// Husets regel var "pensionera, radera aldrig" — med skälet att en felaktig
// matchning ska gå att backa. Verktyget håller det skälet i stället för att
// överge det: en produkt raderas tidigast MIN_ALDER_DAGAR efter
// pensioneringen, och då har felet haft två veckor på sig att synas.
//
// ☠️ RADEN BEHÅLLS OCH MÄRKS. Mappningsraden är historiken, och på en rad som
// pensionerats med artikelnumret kvar är det raden som hindrar nattens import
// från att skapa samma utkast igen. Märkningen tömmer `supplierProductId`
// (som pensioneringen av en givare redan gör) och flyttar värdet till
// `importSparr`, som bara Aosom-importens dubblettspärr läser. Då hoppar
// synken, bildfixen, prisjämförelsen och konkurrentpriset över raden av sig
// själva, utan att någon av dem behöver känna till raderingen.
//
// ☠️ BILDFILERNA RADERAS INTE HÄR. Det gör bildstädningen (läget
// `bildstadning`), som räknar varje fil som någon produkt, kategori eller
// recension använder som använd. En färg som slagits ihop delar fil med
// givaren — samma fil-id i båda gallerierna (uppmätt 2026-09-28) — och den
// filen ligger kvar så länge den publicerade sidan använder den.
//
// ☠️ ATT EN PRODUKTRADERING LÄMNAR FILERNA ÄR ANTAGET, OCH DÄRFÖR MÄTS DET.
// Wix dokumentation säger ingenting om saken. Före varje radering läses
// tillståndet på alla produktens filer, och efteråt en gång till. Ligger en
// fil som var OK före inte kvar efteråt stoppas körningen — även när ingen
// annan använder filen, för då gäller inte det antagande verktyget vilar på.
//
// Produkter som inte delar någon fil raderas FÖRST. Tar Wix filerna med sig
// syns det då på en produkt vars filer ingen annan saknar, och körningen
// stannar innan en färg på en publicerad sida hunnit tappa sin bild.

import type { ProductMappingRecord } from "../store";
import { isAosomMapping, mappingSupplier } from "../store/supplier";
import { mediaNyckel } from "../wix/produkt-media";
import type { KatalogProdukt } from "../wix/media-audit";
import type { ProduktForRadering } from "../wix/v3-products";
import { MAX_OMDIRIGERINGAR } from "./sammanslagning";

/** Så länge ligger en pensionerad produkt kvar innan den får raderas. */
export const MIN_ALDER_DAGAR = 14;
const DAG_MS = 86_400_000;

/** Produkter per körning om inget annat anges, och taket. */
export const STANDARD_LIMIT = 25;
export const MAX_LIMIT = 50;

/**
 * Färre produkter än så i katalogsvepet är ett LÄSFEL, inte en liten katalog.
 * Samma tal och samma skäl som `MIN_WIX_PRODUKTER` i Aosom-synken.
 */
export const MIN_KATALOG = 500;

/**
 * Svepet får se högst så här många färre produkter än katalogens räknare. En
 * import kan skapa en produkt medan svepet pågår; fler saknade än så betyder
 * att svepet tappat sidor.
 */
export const KATALOG_TOLERANS = 5;

/** Så många raderingar i följd som inte går att bekräfta stoppar körningen. */
export const MAX_OBEKRAFTADE_I_FOLJD = 3;

/** Paus mellan två raderingar — billigare än ett återförsök. */
export const PAUS_MELLAN_MS = 400;

/** Hur länge en radering får ta att synas i en läsning. */
const BEKRAFTA_VANTAN_MS = [500, 1_000, 2_000, 4_000];

export type Hinder =
  | "forUng"
  | "utanTidsstampel"
  | "synlig"
  | "harOrdrar"
  | "iAuktion"
  | "omdirigeringsmal";

export interface PlanRad {
  wixProductId: string;
  pensioneradAt: string;
  /** Filer på produkten. */
  bilder: number;
  /** Varav filer som en annan produkt eller en kategori också använder. De ligger kvar. */
  delade: number;
}

export interface Underlag {
  mappningar: ProductMappingRecord[];
  katalog: KatalogProdukt[];
  kategoribilder: string[];
  /** Produkt-id och SKU:er ur alla orderrader, oavsett status. */
  ordrar: { wixCatalogItemId?: string; sku?: string }[];
  /** Köade och pågående auktioner. */
  auktioner: { productId: string }[];
  omdirigeringar: { toPath: string }[];
  /** False när listan nådde sitt tak — då kan en omdirigering saknas. */
  omdirigeringarFullstandiga: boolean;
  nu: Date;
}

export interface Plan {
  /** Aosom-rader med `draftStatus: rejected` som inte redan är märkta. */
  pensionerade: number;
  /** Produkter utan delade filer först, sedan äldst pensionering. */
  raderbara: PlanRad[];
  /** Raden pekar på en produkt som inte fanns i svepet. Bekräftas med en läsning innan raden märks. */
  saknasIWix: string[];
  /** Pensionerade utan tidsstämpel — läget `stampla` startar deras klocka. */
  utanTidsstampel: string[];
  hinder: Record<Hinder, number>;
  /** När nästa för unga produkt blir raderbar (ISO), eller null. */
  nastaRaderbar: string | null;
  bilder: { totalt: number; delade: number };
  omdirigeringarFullstandiga: boolean;
}

// ---------------------------------------------------------------------------
// Underlaget
// ---------------------------------------------------------------------------

export interface UnderlagIo {
  listMappings: () => Promise<ProductMappingRecord[]>;
  /** Hela katalogen. `complete: false` = svepet stannade. */
  lasKatalog: () => Promise<{ produkter: KatalogProdukt[]; complete: boolean }>;
  /** Katalogens egen räknare, att jämföra svepet mot. */
  raknaProdukter: () => Promise<number>;
  listaKategoribilder: () => Promise<string[]>;
  listTasks: () => Promise<{ wixCatalogItemId?: string; sku?: string }[]>;
  listAktivaAuktioner: () => Promise<{ productId: string }[]>;
  listOmdirigeringar: (max: number) => Promise<{ toPath: string }[]>;
  now?: () => number;
}

/** Underlaget går inte att lita på. Ingenting planeras, ingenting skrivs. */
export class UnderlagFel extends Error {}

/**
 * Läser allt planen behöver, och VÄGRAR ett underlag som kan ha tappat något.
 *
 * ☠️ ETT OFULLSTÄNDIGT SVEP ÄR FARLIGT ÅT BÅDA HÅLL. En produkt som saknas i
 * svepet ser ut att redan vara raderad, och en fil vars andra användare
 * saknas ser ut att bara tillhöra den produkt som ska bort. Därför fäller
 * svepet på tre sätt: det stannade, det är för litet för att vara butiken,
 * eller det ser färre produkter än butikens egen räknare.
 */
export async function lasUnderlag(io: UnderlagIo): Promise<Underlag> {
  const now = io.now ?? Date.now;
  const mappningar = await io.listMappings();
  const { produkter, complete } = await io.lasKatalog();
  if (!complete) {
    throw new UnderlagFel("katalogsvepet blev inte klart — ingenting planeras på en halv katalog");
  }
  if (produkter.length < MIN_KATALOG) {
    throw new UnderlagFel(`katalogsvepet såg bara ${produkter.length} produkter — ett läsfel, inte butiken`);
  }
  const antal = await io.raknaProdukter();
  if (produkter.length < antal - KATALOG_TOLERANS) {
    throw new UnderlagFel(`katalogsvepet såg ${produkter.length} av ${antal} produkter — det har tappat sidor`);
  }
  const kategoribilder = await io.listaKategoribilder();
  const ordrar = await io.listTasks();
  const auktioner = await io.listAktivaAuktioner();
  const omdirigeringar = await io.listOmdirigeringar(MAX_OMDIRIGERINGAR);
  return {
    mappningar,
    katalog: produkter,
    kategoribilder,
    ordrar,
    auktioner,
    omdirigeringar,
    omdirigeringarFullstandiga: omdirigeringar.length < MAX_OMDIRIGERINGAR,
    nu: new Date(now()),
  };
}

/** Slugen en omdirigering pekar på, eller null om den inte pekar på en produkt. */
export function malSlug(toPath: string): string | null {
  const t = (toPath ?? "").trim();
  if (!t.startsWith("/produkt/")) return null;
  const slug = t.slice("/produkt/".length).split(/[?#]/)[0].replace(/\/+$/, "").toLowerCase();
  return slug || null;
}

/** Pensioneringens tid, eller null när den saknas eller inte går att läsa. */
export function pensioneradTid(m: Pick<ProductMappingRecord, "reviewedAt">): number | null {
  if (!m.reviewedAt) return null;
  const t = Date.parse(m.reviewedAt);
  return Number.isFinite(t) ? t : null;
}

/** Är raden en pensionerad Aosom-rad vars produkt inte redan är raderad? */
export function arPensionerad(m: ProductMappingRecord): boolean {
  return isAosomMapping(m) && m.draftStatus === "rejected" && !m.wixRaderad;
}

/**
 * Raden som den ska se ut när produkten är raderad och raderingen bekräftad.
 *
 * ☠️ `supplier` FRYSES innan artikeln töms, som i pensioneringen av en givare:
 * `mappingSupplier` faller annars tillbaka på prefixet i `supplierProductId`,
 * och en tom rad utan fältet hade klassats som AliExpress.
 */
export function markeradRad(m: ProductMappingRecord, nu: Date, slug?: string): ProductMappingRecord {
  const artikel = (m.supplierProductId ?? "").trim();
  return {
    ...m,
    supplier: mappingSupplier(m),
    supplierProductId: "",
    ...(artikel ? { importSparr: artikel } : {}),
    needsAiPolish: false,
    wixRaderad: { at: nu.toISOString(), ...(slug ? { slug } : {}) },
  };
}

function tomtHinder(): Record<Hinder, number> {
  return { forUng: 0, utanTidsstampel: 0, synlig: 0, harOrdrar: 0, iAuktion: 0, omdirigeringsmal: 0 };
}

/** Vilka produkter använder varje fil — för att se vad en produkt delar. */
function anvandarePerFil(katalog: readonly KatalogProdukt[]): Map<string, Set<string>> {
  const ut = new Map<string, Set<string>>();
  for (const p of katalog) {
    for (const k of p.nycklar) {
      const s = ut.get(k) ?? new Set<string>();
      s.add(p.id);
      ut.set(k, s);
    }
  }
  return ut;
}

/** Filer produkten delar med en annan produkt eller en kategori. */
export function deladeFiler(
  id: string,
  nycklar: readonly string[],
  anvandare: ReadonlyMap<string, ReadonlySet<string>>,
  kategori: ReadonlySet<string>,
): string[] {
  return nycklar.filter((k) => {
    if (kategori.has(k)) return true;
    for (const annan of anvandare.get(k) ?? []) if (annan !== id) return true;
    return false;
  });
}

export function planera(u: Underlag): Plan {
  const perProdukt = new Map(u.katalog.map((p) => [p.id, p]));
  const anvandare = anvandarePerFil(u.katalog);
  const kategori = new Set(u.kategoribilder.map(mediaNyckel));
  const ordrar = new Set(u.ordrar.map((t) => t.wixCatalogItemId ?? "").filter(Boolean));
  const auktion = new Set(u.auktioner.map((a) => a.productId));
  const mal = new Set(u.omdirigeringar.map((r) => malSlug(r.toPath)).filter((s): s is string => Boolean(s)));
  const grans = u.nu.getTime() - MIN_ALDER_DAGAR * DAG_MS;

  const plan: Plan = {
    pensionerade: 0,
    raderbara: [],
    saknasIWix: [],
    utanTidsstampel: [],
    hinder: tomtHinder(),
    nastaRaderbar: null,
    bilder: { totalt: 0, delade: 0 },
    omdirigeringarFullstandiga: u.omdirigeringarFullstandiga,
  };
  let nasta: number | null = null;

  for (const m of u.mappningar) {
    if (!arPensionerad(m)) continue;
    plan.pensionerade++;
    const id = m.wixProductId;

    const t = pensioneradTid(m);
    if (t === null) {
      plan.hinder.utanTidsstampel++;
      plan.utanTidsstampel.push(id);
      continue;
    }
    if (t > grans) {
      plan.hinder.forUng++;
      const blir = t + MIN_ALDER_DAGAR * DAG_MS;
      if (nasta === null || blir < nasta) nasta = blir;
      continue;
    }

    const p = perProdukt.get(id);
    if (!p) {
      plan.saknasIWix.push(id);
      continue;
    }
    // ☠️ `rejected` BETYDER INTE DOLD. Statusen speglar vad som hände i kön,
    // och flera publicerade sidor bär den (review-queue, 2026-08-18). Bara
    // Wix egen synlighet avgör.
    if (p.visible) {
      plan.hinder.synlig++;
      continue;
    }
    if (ordrar.has(id)) {
      plan.hinder.harOrdrar++;
      continue;
    }
    if (auktion.has(id)) {
      plan.hinder.iAuktion++;
      continue;
    }
    // En omdirigering som pekar HIT hade blivit en 301 till en 404.
    if (p.slug && mal.has(p.slug.toLowerCase())) {
      plan.hinder.omdirigeringsmal++;
      continue;
    }

    const delade = deladeFiler(id, p.nycklar, anvandare, kategori).length;
    plan.raderbara.push({
      wixProductId: id,
      pensioneradAt: new Date(t).toISOString(),
      bilder: p.nycklar.length,
      delade,
    });
    plan.bilder.totalt += p.nycklar.length;
    plan.bilder.delade += delade;
  }

  // Produkter utan delade filer först: de är mätningen av att en radering
  // lämnar filerna, och den ska vara gjord innan en delad fil står på spel.
  const delarFiler = (r: PlanRad) => (r.delade > 0 ? 1 : 0);
  plan.raderbara.sort((a, b) =>
    delarFiler(a) - delarFiler(b)
      || a.pensioneradAt.localeCompare(b.pensioneradAt)
      || a.wixProductId.localeCompare(b.wixProductId),
  );
  plan.nastaRaderbar = nasta === null ? null : new Date(nasta).toISOString();
  return plan;
}

// ---------------------------------------------------------------------------
// Skarpa körningar
// ---------------------------------------------------------------------------

export interface KorDeps {
  getMapping: (wixProductId: string) => Promise<ProductMappingRecord | null>;
  saveMapping: (m: ProductMappingRecord) => Promise<void>;
  lasProdukt: (wixProductId: string) => Promise<ProduktForRadering | null>;
  raderaProdukt: (wixProductId: string) => Promise<"raderad" | "fanns_inte">;
  /** true/false = svar, null = läsfel. */
  produktFinns: (wixProductId: string) => Promise<boolean | null>;
  /**
   * Fil-nyckel → tillstånd. Kastar vid läsfel. En nyckel som inte är ett
   * fil-id utelämnas tyst ur svaret — uppmätt 2026-09-28: ett anrop med ett
   * riktigt och ett påhittat id svarade 200 med bara det riktiga, `state: OK`.
   */
  filstatus: (nycklar: string[]) => Promise<Map<string, string>>;
  paus: (ms: number) => Promise<void>;
  now?: () => number;
}

export class BekraftaFel extends Error {}

export interface StamplaSvar {
  stamplade: number;
  hoppade: number;
  skrivfel: number;
}

/**
 * Startar klockan på pensionerade rader utan tidsstämpel.
 *
 * Rader som pensionerats via poleringens stämpel före 2026-09-28 fick ingen
 * `reviewedAt`, och utan den vet ingen hur gammal pensioneringen är. Klockan
 * sätts därför till NU — tidigast möjliga radering blir MIN_ALDER_DAGAR
 * härifrån, aldrig tidigare än den verkliga pensioneringen hade gett.
 */
export async function stampla(
  deps: KorDeps,
  plan: Plan,
  opts: { bekrafta: string },
): Promise<StamplaSvar> {
  if (opts.bekrafta.trim() !== String(plan.utanTidsstampel.length)) {
    throw new BekraftaFel(
      `bekrafta måste vara torrkörningens antal utan tidsstämpel (${plan.utanTidsstampel.length}), fick "${opts.bekrafta}"`,
    );
  }
  const nu = new Date((deps.now ?? Date.now)());
  const svar: StamplaSvar = { stamplade: 0, hoppade: 0, skrivfel: 0 };
  for (const id of plan.utanTidsstampel) {
    const m = await deps.getMapping(id);
    if (!m || !arPensionerad(m) || m.reviewedAt) {
      svar.hoppade++;
      continue;
    }
    const iso = nu.toISOString();
    await deps.saveMapping({ ...m, reviewedAt: iso });
    const efter = await deps.getMapping(id);
    if (efter?.reviewedAt === iso) svar.stamplade++;
    else svar.skrivfel++;
  }
  return svar;
}

export type Stopp =
  | "klart"
  | "limit"
  | "tidsbudget"
  | "obekraftade"
  | "filkontroll"
  | "raderingsfel"
  | "markeringsfel"
  | "ovantat_fel";

/**
 * Rader att bara bokföra (produkten saknades redan) per körning. De kostar två
 * läsningar och en skrivning styck; taket håller dem från att äta budgeten om
 * svepet någon gång skulle ha tappat mycket.
 */
export const MAX_SAKNADE_PER_KORNING = 100;

export interface RaderaSvar {
  raderade: string[];
  /** Produkten fanns inte (404) — raden märktes utan radering. */
  markeradeUtanRadering: string[];
  /** Raderingen gick igenom men produkten syntes fortfarande. Raden är INTE märkt. */
  obekraftade: string[];
  /** Produkten är raderad men raden läste inte tillbaka märkt. Nästa körning märker den. */
  markeringsfel: string[];
  /** Något ändrades mellan planen och raderingen; produkten rördes inte. */
  hoppadeVidKontroll: Record<string, number>;
  stoppadAv: Stopp;
  /** Skäl när körningen stoppades av ett fel. Bara räknare och kodord, aldrig namn. */
  fel: string | null;
}

async function bekraftaBorta(deps: KorDeps, id: string): Promise<boolean> {
  for (const ms of BEKRAFTA_VANTAN_MS) {
    await deps.paus(ms);
    if ((await deps.produktFinns(id)) === false) return true;
  }
  return false;
}

/** true = raden läste tillbaka märkt. Kastar om skrivningen eller läsningen kastar. */
async function markera(deps: KorDeps, m: ProductMappingRecord, nu: Date, slug?: string): Promise<boolean> {
  const ny = markeradRad(m, nu, slug);
  await deps.saveMapping(ny);
  const efter = await deps.getMapping(m.wixProductId);
  return Boolean(
    efter
      && efter.wixRaderad?.at === ny.wixRaderad?.at
      && !efter.supplierProductId
      && (ny.importSparr === undefined || efter.importSparr === ny.importSparr),
  );
}

function felText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Raderar de raderbara produkterna i planens ordning: de utan delade filer
 * först, sedan äldst pensionering.
 *
 * GODKÄNNANDET är ett av två, aldrig båda:
 *  - `bekrafta` — torrkörningens antal raderbara, exakt. Första varvet.
 *  - `hogst` — ett tak. Workflowens följande varv skickar det som återstod
 *    efter förra varvet. Planen får KRYMPA mellan varven (en produkt som
 *    blivit synlig, en radering som syntes först i nästa svep), men aldrig
 *    växa förbi det en människa godkände.
 *
 * Varje produkt kontrolleras på nytt precis före raderingen — raden ska
 * fortfarande vara pensionerad och gammal nog, produkten fortfarande dold, och
 * ingen order får ha köpt den (nu även på SKU, som planen inte ser). Sedan:
 * läs filernas tillstånd, radera, bekräfta med en läsning, läs filerna igen,
 * märk raden och läs tillbaka den.
 */
export async function radera(
  deps: KorDeps,
  u: Underlag,
  plan: Plan,
  opts: { bekrafta?: string; hogst?: number; limit?: number; timeBudgetMs?: number },
): Promise<RaderaSvar> {
  const antal = plan.raderbara.length;
  if (opts.hogst !== undefined) {
    if (opts.bekrafta !== undefined) {
      throw new BekraftaFel("ange antingen bekrafta eller hogst, inte båda");
    }
    if (!Number.isInteger(opts.hogst) || opts.hogst < 0) {
      throw new BekraftaFel(`hogst måste vara ett heltal, noll eller större — fick ${opts.hogst}`);
    }
    if (antal > opts.hogst) {
      throw new BekraftaFel(
        `planen har ${antal} raderbara, fler än de ${opts.hogst} som återstod efter förra varvet — något har blivit raderbart under körningen`,
      );
    }
  } else if ((opts.bekrafta ?? "").trim() !== String(antal)) {
    throw new BekraftaFel(
      `bekrafta måste vara torrkörningens antal raderbara (${antal}), fick "${opts.bekrafta ?? ""}"`,
    );
  }
  if (!plan.omdirigeringarFullstandiga) {
    throw new BekraftaFel(
      "omdirigeringslistan nådde sitt tak — en omdirigering till en produkt kan saknas, och då vägras raderingen",
    );
  }

  const now = deps.now ?? Date.now;
  const start = now();
  const budget = opts.timeBudgetMs ?? 200_000;
  const limit = Math.min(Math.max(1, Math.floor(opts.limit ?? STANDARD_LIMIT)), MAX_LIMIT);
  const grans = () => now() - MIN_ALDER_DAGAR * DAG_MS;
  const anvandare = anvandarePerFil(u.katalog);
  const kategori = new Set(u.kategoribilder.map(mediaNyckel));
  const orderSkus = new Set(u.ordrar.map((t) => (t.sku ?? "").trim()).filter(Boolean));

  const svar: RaderaSvar = {
    raderade: [],
    markeradeUtanRadering: [],
    obekraftade: [],
    markeringsfel: [],
    hoppadeVidKontroll: {},
    stoppadAv: "klart",
    fel: null,
  };
  const hoppa = (skal: string) => {
    svar.hoppadeVidKontroll[skal] = (svar.hoppadeVidKontroll[skal] ?? 0) + 1;
  };
  let obekraftadeIFoljd = 0;

  // Produkter som redan saknas: bara bokföring, efter en läsning som säger 404.
  try {
    for (const id of plan.saknasIWix.slice(0, MAX_SAKNADE_PER_KORNING)) {
      if (now() - start >= budget) {
        svar.stoppadAv = "tidsbudget";
        return svar;
      }
      const m = await deps.getMapping(id);
      if (!m || !arPensionerad(m)) {
        hoppa("raden_andrad");
        continue;
      }
      const p = await deps.lasProdukt(id);
      if (!p) {
        hoppa("lasfel");
        continue;
      }
      if (p.finns) {
        hoppa("finns_i_wix");
        continue;
      }
      if (await markera(deps, m, new Date(now()))) svar.markeradeUtanRadering.push(id);
      else svar.markeringsfel.push(id);
    }
  } catch (err) {
    console.error(`[pensionerade] bokföring av saknade: ${felText(err)}`);
    svar.stoppadAv = "ovantat_fel";
    svar.fel = "ett oväntat fel vid bokföringen av redan saknade produkter — ingen produkt raderades";
    return svar;
  }

  for (const rad of plan.raderbara) {
    if (svar.raderade.length >= limit) {
      svar.stoppadAv = "limit";
      break;
    }
    if (now() - start >= budget) {
      svar.stoppadAv = "tidsbudget";
      break;
    }
    const id = rad.wixProductId;

    // ── Kontrollerna före raderingen. Ett undantag här stoppar körningen:
    // ingenting är raderat för den här produkten, och att fortsätta blint
    // efter ett oväntat fel är fel riktning att fela åt.
    let m: ProductMappingRecord | null;
    let p: ProduktForRadering | null;
    try {
      m = await deps.getMapping(id);
      const t = m ? pensioneradTid(m) : null;
      if (!m || !arPensionerad(m) || t === null || t > grans()) {
        hoppa("raden_andrad");
        continue;
      }
      p = await deps.lasProdukt(id);
    } catch (err) {
      console.error(`[pensionerade] kontroll ${id}: ${felText(err)}`);
      svar.stoppadAv = "ovantat_fel";
      svar.fel = `kontrollen före raderingen av ${id} kastade — ingenting raderades för den`;
      break;
    }
    if (!p) {
      hoppa("lasfel");
      continue;
    }
    if (!p.finns) {
      try {
        if (await markera(deps, m, new Date(now()))) svar.markeradeUtanRadering.push(id);
        else svar.markeringsfel.push(id);
      } catch (err) {
        console.error(`[pensionerade] märkning ${id}: ${felText(err)}`);
        svar.stoppadAv = "markeringsfel";
        svar.fel = `raden för ${id} gick inte att skriva`;
        break;
      }
      continue;
    }
    if (p.visible) {
      hoppa("synlig");
      continue;
    }
    if (p.skus.some((sku) => orderSkus.has(sku))) {
      hoppa("har_ordrar");
      continue;
    }

    // ☠️ FILERNAS TILLSTÅND FÖRE RADERINGEN. Bara en fil som ligger kvar med
    // OK nu kan försvinna PÅ GRUND AV raderingen — en fil som redan var borta
    // hade annars stoppat körningen för en skada som inte är dess. Filerna
    // läses ur den FÄRSKA produkten, deras andra användare ur svepet.
    let kontroll: string[];
    try {
      const fore = p.nycklar.length > 0 ? await deps.filstatus(p.nycklar) : new Map<string, string>();
      kontroll = p.nycklar.filter((k) => fore.get(k) === "OK");
    } catch (err) {
      console.error(`[pensionerade] filstatus före ${id}: ${felText(err)}`);
      hoppa("lasfel_filer");
      continue;
    }
    // Har produkten filer men ingen av dem går att läsa går raderingen inte
    // att kontrollera. Då rörs den inte.
    if (p.nycklar.length > 0 && kontroll.length === 0) {
      hoppa("filer_okanda");
      continue;
    }
    const delade = new Set(deladeFiler(id, kontroll, anvandare, kategori));

    try {
      await deps.raderaProdukt(id);
    } catch (err) {
      console.error(`[pensionerade] radering ${id}: ${felText(err)}`);
      svar.stoppadAv = "raderingsfel";
      svar.fel = `Wix raderade inte ${id}`;
      break;
    }

    if (!(await bekraftaBorta(deps, id))) {
      svar.obekraftade.push(id);
      obekraftadeIFoljd++;
      if (obekraftadeIFoljd >= MAX_OBEKRAFTADE_I_FOLJD) {
        svar.stoppadAv = "obekraftade";
        svar.fel = `${obekraftadeIFoljd} raderingar i följd syntes inte i en läsning`;
        break;
      }
      continue;
    }
    obekraftadeIFoljd = 0;
    svar.raderade.push(id);

    // ☠️ KANARIEFÅGELN. Varje fil som var OK före raderingen ska vara det
    // efteråt. Gör den inte det tog Wix filer med sig, och då stannar allt —
    // raden märks (produkten ÄR borta) men ingen fler produkt rörs.
    let forsvunna: string[] = [];
    let filfel = false;
    if (kontroll.length > 0) {
      try {
        const efter = await deps.filstatus(kontroll);
        forsvunna = kontroll.filter((k) => efter.get(k) !== "OK");
      } catch (err) {
        console.error(`[pensionerade] filstatus efter ${id}: ${felText(err)}`);
        filfel = true;
      }
    }

    let markerad = false;
    try {
      markerad = await markera(deps, m, new Date(now()), p.slug);
    } catch (err) {
      console.error(`[pensionerade] märkning ${id}: ${felText(err)}`);
      svar.markeringsfel.push(id);
      svar.stoppadAv = "markeringsfel";
      svar.fel = `${id} är raderad men raden gick inte att skriva — nästa körning märker den`;
      break;
    }
    if (!markerad) svar.markeringsfel.push(id);

    if (filfel || forsvunna.length > 0) {
      svar.stoppadAv = "filkontroll";
      const deladeBorta = forsvunna.filter((k) => delade.has(k)).length;
      svar.fel = filfel
        ? `filerna gick inte att läsa efter raderingen av ${id} — körningen stoppad innan fler produkter rörs`
        : `${forsvunna.length} av ${kontroll.length} filer låg inte kvar efter raderingen av ${id}, `
          + `varav ${deladeBorta} delade — körningen stoppad`;
      break;
    }

    await deps.paus(PAUS_MELLAN_MS);
  }

  return svar;
}
