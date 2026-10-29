// VEVOR-synken (steg 5): lager och pris på VEVOR-raderna i butiken.
//
// SAMMA MOTOR SOM AOSOM. Synken är `korSynk` i lib/aosom/sync.ts, med läsarens
// avläsningar som källa (`vevorKalla`) och VEVOR:s profil
// (lib/sync/leverantorsrad.ts). Allt efter källan är Aosoms, oförändrat:
// avdraget för sålda enheter, rättelsen mot butikens saldo, prislåset,
// auktionslåset, taket på 40 %, att Wix skrivs före mappningen, stämpeln på den
// färska raden och restock-mejlen.
//
// DET SOM SKILJER står i profilen och i källan:
//
//   - ☠️ OKÄNT RÖR ALDRIG LAGRET. En avläsning som saknas, är äldre än tolv
//     timmar eller vars senaste försök misslyckades är okänd
//     (lib/vevor/rad.ts), och en fryst läsare gör varje avläsning okänd.
//     Motorn räknar dem i `okantBesked` och rör ingenting.
//   - Ingen buffert: VEVOR:s saldo rakt av (Leonard 2026-10-28).
//   - Ingen konkurrentregel (Leonard 2026-10-21).
//   - Ett nytt pris skrivs först när två avläsningar i rad ger samma
//     regelpris. Läsaren sparar föregående avläsnings pris (`forraPrisSek`).
//   - Priset räknas med importens regel (lib/vevor/pris.ts) och rabatten i
//     konfigurationen. Saknas rabatten skrivs inga priser, och skälet går ut i
//     `prislistaFel`. Lagret synkas ändå.
//
// SCHEMAT kör bara när synken är påslagen (`aktiv`, workflowen "VEVOR —
// synken"), och fortsätter där förra schemalagda körningen slutade (markören
// "vevor" i lib/aosom/sync-markor.ts). En körning för hand går hela vägen med
// markören i svaret och flyttar inte den sparade.
//
// ☠️ ARTIKELNUMREN SKRIVS ALDRIG UT. Motorns fel och varningar bär `sku`, och
// rutten tar bort det innan svaret lämnar den. Loggen, svaret och tillståndet
// bär antal och Wix-id.

import {
  gemensammaSynkDeps,
  korSynk,
  type AosomSyncOptions,
  type AosomSyncSummary,
  type SynkDeps,
  type Synkkalla,
} from "@/lib/aosom/sync";
import { randomUUID } from "node:crypto";
import { nastaMarkor, type SyncMarkorLager } from "@/lib/aosom/sync-markor";
import { hamta } from "@/lib/db/wix-data-klient";
import { VEVOR_KOL } from "@/lib/db/wix-kollektioner";
import { VEVOR_PROFIL, type Leverantorsrad } from "@/lib/sync/leverantorsrad";
import { slappLasRad, tagLasRad, uppdateraRad, WixVevorLager, type Lasartillstand, type SynkAvlasning } from "./lager";
import { RabattFel, tolkaRabatt } from "./pris";
import { vevorRad } from "./rad";

export interface VevorKallDeps {
  /** Alla avläsningar, med synkens fält (`SYNKFALT`). */
  lasAvlasningar(): Promise<SynkAvlasning[]>;
  /** Läsarens frysning. En fryst läsare gör varje avläsning okänd. */
  lasarensFrysning(): Promise<Lasartillstand["fryst"]>;
  /** PRO-rabatten som andel. Kastar när den saknas eller inte går att läsa. */
  lasRabatt(): Promise<number>;
  now?: () => number;
}

/**
 * VEVOR:s avläsningar som källa till motorn.
 *
 * ☠️ RABATTEN FÄLLER INTE LAGRET. Går den inte att läsa bär raderna ingen
 * kostnad, så inget pris skrivs, och skälet går ut i `prislistaFel`. Samma
 * hållning som när butikens prislista inte går att läsa: att sälja något vi
 * inte har är ett kundfel, ett orättat pris på ett osynligt utkast är det inte.
 * Ett annat fel än en saknad rabatt skrivs inte ut: konfigurationsraden bär
 * också Aosoms hemliga flödesadress.
 */
export function vevorKalla(deps: VevorKallDeps): Synkkalla {
  return {
    leverantor: "vevor",
    namn: "VEVOR-avläsningarna",
    async las() {
      const nu = (deps.now ?? Date.now)();
      const [avlasningar, fryst] = await Promise.all([deps.lasAvlasningar(), deps.lasarensFrysning()]);
      let rabatt: number | null = null;
      let prisFel: string | null = null;
      try {
        rabatt = await deps.lasRabatt();
      } catch (err) {
        prisFel = err instanceof RabattFel
          ? `inga VEVOR-priser skrevs: ${err.message}`
          : "inga VEVOR-priser skrevs: konfigurationen gick inte att läsa";
      }
      const rader = new Map<string, Leverantorsrad>();
      for (const a of avlasningar) {
        const r = vevorRad(a, nu, fryst !== null, rabatt);
        if (r) rader.set(a.sku, r);
      }
      return { antal: avlasningar.length, rader, prisFel };
    },
  };
}

/** En körning av VEVOR-synken. Torr som default, som Aosom-synken. */
export async function runVevorSync(
  deps: SynkDeps,
  kalla: VevorKallDeps,
  opts: AosomSyncOptions = {},
): Promise<AosomSyncSummary> {
  return korSynk(deps, vevorKalla(kalla), opts);
}

// ── Tillståndet: strömbrytaren och senaste körningen ──────────────────────────

/** Senaste körningen, bara antal. Inga artikelnummer, inga priser. */
export interface Synkkorning {
  start: string;
  slutAt: string;
  manuell: boolean;
  dryRun: boolean;
  /** Avläsningar källan gav, alla med VEVOR:s artikelnummer. */
  avlasningar: number;
  granskade: number;
  lagerUppdaterade: number;
  prisUppdaterade: number;
  prisVantar: number;
  okantBesked: number;
  leverantorOense: number;
  utanWixPris: number;
  utanLagerrader: number;
  lagerDrift: number;
  saldaAvdragna: number;
  okandaVarianter: number;
  tvetydiga: number;
  misslyckade: number;
  varningar: number;
  prislistaFel: string | null;
  stoppedBy: AosomSyncSummary["stoppedBy"];
  kvar: number;
}

export interface Synktillstand {
  /** Schemat synkar bara när synken är påslagen. Default av. */
  aktiv: boolean;
  senasteKorning: Synkkorning | null;
}

export const TOMT_SYNKTILLSTAND: Synktillstand = { aktiv: false, senasteKorning: null };

export function synkkorning(s: AosomSyncSummary, start: string, slutAt: string, manuell: boolean): Synkkorning {
  return {
    start,
    slutAt,
    manuell,
    dryRun: s.dryRun,
    avlasningar: s.feedRader,
    granskade: s.granskade,
    lagerUppdaterade: s.lagerUppdaterade,
    prisUppdaterade: s.prisUppdaterade,
    prisVantar: s.prisVantar,
    okantBesked: s.okantBesked,
    leverantorOense: s.leverantorOense,
    utanWixPris: s.utanWixPris,
    utanLagerrader: s.utanLagerrader,
    lagerDrift: s.lagerDrift,
    saldaAvdragna: s.saldaAvdragna,
    okandaVarianter: s.okandaVarianter,
    tvetydiga: s.tvetydiga,
    misslyckade: s.misslyckade,
    varningar: s.varningar.length,
    prislistaFel: s.prislistaFel,
    stoppedBy: s.stoppedBy,
    kvar: s.kvar,
  };
}

export interface VevorSynkLager {
  lasTillstand(): Promise<Synktillstand>;
  /** Bara de angivna fälten, aldrig hela raden (lib/vevor/lager.ts, uppdateraRad). */
  uppdateraTillstand(andring: Partial<Synktillstand>): Promise<void>;
  tagLas(agare: string, nu: number, ttlMs: number): Promise<boolean>;
  slappLas(agare: string): Promise<void>;
}

const SYNK = "synk";
const SYNKLAS = "synklas";

/** Två rader i läsarens kollektion, som läsarens och importens tillstånd. */
export class WixVevorSynkLager implements VevorSynkLager {
  async lasTillstand(): Promise<Synktillstand> {
    const rad = await hamta<Partial<Synktillstand>>(VEVOR_KOL.lasare, SYNK);
    return { ...TOMT_SYNKTILLSTAND, ...(rad ?? {}) };
  }
  async uppdateraTillstand(andring: Partial<Synktillstand>): Promise<void> {
    await uppdateraRad(SYNK, TOMT_SYNKTILLSTAND, andring);
  }
  async tagLas(agare: string, nu: number, ttlMs: number): Promise<boolean> {
    return tagLasRad(SYNKLAS, agare, nu, ttlMs);
  }
  async slappLas(agare: string): Promise<void> {
    await slappLasRad(SYNKLAS, agare);
  }
}

/** Lagret i minnet, för tester. */
export class MinnesVevorSynkLager implements VevorSynkLager {
  tillstand: Synktillstand = structuredClone(TOMT_SYNKTILLSTAND);
  las: { agare: string; utgar: number } | null = null;

  async lasTillstand() {
    return structuredClone(this.tillstand);
  }
  async uppdateraTillstand(andring: Partial<Synktillstand>) {
    const falt = Object.fromEntries(Object.entries(andring).filter(([, v]) => v !== undefined));
    this.tillstand = structuredClone({ ...this.tillstand, ...falt });
  }
  async tagLas(agare: string, nu: number, ttlMs: number) {
    if (this.las && this.las.utgar > nu) return false;
    this.las = { agare, utgar: nu + ttlMs };
    return true;
  }
  async slappLas(agare: string) {
    if (this.las?.agare === agare) this.las = null;
  }
}

// ── En körning: strömbrytaren, låset och markören ────────────────────────────

/** Låsets livstid. Rutten har 300 sekunder, och efter dem finns körningen inte. */
export const SYNKLAS_TTL_MS = 300_000;

export interface SynkKorDeps {
  lager: VevorSynkLager;
  markorer: SyncMarkorLager;
  /** Motorn och källan. Hämtas först när körningen ska köra: en avstängd körning läser ingenting. */
  motor: () => Promise<{ synk: SynkDeps; kalla: VevorKallDeps }>;
  nu?: () => number;
}

export interface Synkval {
  /** För hand: går även när synken är avstängd, och rör inte schemats markör. */
  manuell: boolean;
  dryRun: boolean;
  /** Tak på antal produkter som skrivs (motorns `limit`). */
  limit: number;
  budgetMs: number;
  /** För hand: fortsätt efter den här markören (ur förra svaret). */
  after?: string;
}

export interface Synkutfall {
  utfall: "klar" | "avstangd" | "upptagen";
  summary: AosomSyncSummary | null;
  /** Schemat: fortsatte körningen där förra slutade? Null för hand. */
  markor: "fortsatte" | "borjade" | null;
  /** Varför markören inte gick att läsa eller spara, eller null. Stoppar inte synken. */
  markorFel: string | null;
}

/**
 * En körning av VEVOR-synken, med strömbrytaren, låset och schemats markör.
 *
 * ☠️ SCHEMAT GÖR INGENTING FÖRRÄN SYNKEN SLAGITS PÅ, och det läser då inte ens
 * källan. ☠️ BARA SKARPA SCHEMALAGDA KÖRNINGAR FLYTTAR MARKÖREN, samma regel
 * som Aosom-synkens rotationer (lib/aosom/sync-markor.ts): en torrkörning eller
 * en körning för hand får inte få nästa schemalagda körning att hoppa över
 * något. En markör som inte går att läsa stoppar inte synken: körningen börjar
 * från början, och utfallet säger det.
 */
export async function korVevorSynk(deps: SynkKorDeps, val: Synkval): Promise<Synkutfall> {
  const nu = deps.nu ?? Date.now;
  if (!val.manuell && !(await deps.lager.lasTillstand()).aktiv) {
    return { utfall: "avstangd", summary: null, markor: null, markorFel: null };
  }
  const agare = randomUUID();
  if (!(await deps.lager.tagLas(agare, nu(), SYNKLAS_TTL_MS))) {
    return { utfall: "upptagen", summary: null, markor: null, markorFel: null };
  }
  try {
    let sparad: string | null = null;
    let markorFel: string | null = null;
    if (!val.manuell) {
      try {
        sparad = await deps.markorer.las("vevor");
      } catch (err) {
        markorFel = `markören gick inte att läsa: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`;
      }
    }
    const start = new Date(nu()).toISOString();
    const { synk, kalla } = await deps.motor();
    const s = await runVevorSync(synk, kalla, {
      dryRun: val.dryRun,
      limit: val.limit,
      timeBudgetMs: val.budgetMs,
      after: val.manuell ? val.after : (sparad ?? undefined),
    });
    if (!val.manuell && !val.dryRun) {
      try {
        await deps.markorer.spara("vevor", nastaMarkor(s, sparad));
      } catch (err) {
        const fel = `markören gick inte att spara: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`;
        markorFel = markorFel ? `${markorFel}; ${fel}` : fel;
      }
    }
    await deps.lager.uppdateraTillstand({ senasteKorning: synkkorning(s, start, new Date(nu()).toISOString(), val.manuell) });
    return { utfall: "klar", summary: s, markor: val.manuell ? null : sparad ? "fortsatte" : "borjade", markorFel };
  } finally {
    await deps.lager.slappLas(agare).catch(() => {});
  }
}

/**
 * Svaret utan artikelnummer. Motorns fel och varningar bär `sku`, alltså
 * VEVOR:s artikelnummer, och svaret skrivs ut i en publik Actions-logg.
 * Markören tas också bort: rutten förseglar den (lib/aosom/markor.ts).
 */
export function utanArtikelnummer(s: AosomSyncSummary): Omit<AosomSyncSummary, "errors" | "varningar" | "cursor"> & {
  errors: { wixProductId?: string; error: string }[];
  varningar: { wixProductId?: string; fran: number; till: number; andringPct: number }[];
} {
  const { errors, varningar, cursor: _cursor, ...resten } = s;
  return {
    ...resten,
    errors: errors.map(({ sku: _sku, ...e }) => e),
    varningar: varningar.map(({ sku: _sku, ...v }) => v),
  };
}

/** Loggraden. Bara antal, aldrig ett artikelnummer eller ett pris. */
export function synkloggrad(u: Synkutfall): string {
  const s = u.summary;
  if (!s) return `[vevor-synk] ${u.utfall}`;
  return (
    `[vevor-synk] ${s.feedRader} avläsningar, ${s.granskade} granskade, ${s.lagerUppdaterade} lager, `
    + `${s.prisUppdaterade} priser, ${s.prisVantar} priser väntar på en andra avläsning, `
    + `${s.okantBesked} med okänt besked (rördes inte), ${s.leverantorOense} med oense leverantör, `
    + `${s.utanWixPris} utan butikspris, ${s.utanLagerrader} utan lagerrader, ${s.lagerDrift} lagerdrift, `
    + `${s.saldaAvdragna} sålda avdragna, ${s.okandaVarianter} okända varianter, ${s.tvetydiga} tvetydiga, `
    + `${s.varningar.length} varningar, ${s.misslyckade} misslyckade, `
    + `stoppade på ${s.stoppedBy}, ${s.kvar} kvar${s.dryRun ? " (TORRKÖRNING — inget skrevs)" : ""}`
    + (u.markor ? `, ${u.markor === "fortsatte" ? "fortsatte från sparad markör" : "började från början"}` : "")
    + (u.markorFel ? ` (${u.markorFel})` : "")
    + (s.prislistaFel ? ` — PRISDELEN FÖLL: ${s.prislistaFel}` : "")
  );
}

// ── I drift ───────────────────────────────────────────────────────────────────

/** Körningens beroenden i drift: tillståndet och markören i Wix, motorn när den behövs. */
export async function liveSynkKorDeps(): Promise<SynkKorDeps> {
  const { getSyncMarkorLager } = await import("@/lib/aosom/sync-markor");
  return { lager: new WixVevorSynkLager(), markorer: getSyncMarkorLager(), motor: liveVevorSynkDeps };
}

/**
 * Motorns och källans beroenden mot skarpa systemet. Mappningarna läses med
 * VEVOR:s prefix, inte hela katalogen.
 */
export async function liveVevorSynkDeps(): Promise<{ synk: SynkDeps; kalla: VevorKallDeps }> {
  const [gemensamma, { getStore }, { getAppConfig }] = await Promise.all([
    gemensammaSynkDeps(),
    import("@/lib/store/factory"),
    import("@/lib/store/app-config"),
  ]);
  const store = getStore();
  const lager = new WixVevorLager();
  return {
    synk: { ...gemensamma, listMappningar: () => store.listMappingsMedPrefix(VEVOR_PROFIL.prefix) },
    kalla: {
      lasAvlasningar: () => lager.avlasningarForSynk(),
      lasarensFrysning: async () => (await lager.lasTillstand()).fryst,
      lasRabatt: async () => tolkaRabatt((await getAppConfig()).vevorProRabatt),
    },
  };
}
