// Importens tillstånd, lås och kandidater i Wix (lib/vevor/import.ts).
//
// Tillståndet och låset är två rader i läsarens kollektion
// (`FyndplatsVevorLasare`, raderna "import" och "importlas"), skrivna fält för
// fält som läsarens (lib/vevor/lager.ts). Kandidaterna är läsarens avläsningar i
// lager, i artikelnummerordning.
//
// ☠️ MARKÖREN ÄR ETT ARTIKELNUMMER, och de föräldralösa raderna bär
// artikelnummer. Båda bor bara här, i en kollektion som bara motorns nyckel kan
// läsa. Rutterna svarar med antal och Wix-id, aldrig med dem.

import { fraga, hamta, rakna } from "@/lib/db/wix-data-klient";
import { VEVOR_KOL } from "@/lib/db/wix-kollektioner";
import { WixVevorLager, slappLasRad, tagLasRad, uppdateraRad, type Avlasning, type Lasartillstand, type Sidrad } from "./lager";
import type { Bildmonster } from "./bilder";
import type { Hinder } from "./to-product";
import type { FamiljSkal } from "./familj";

export interface Importsummering {
  start: string;
  slutAt: string;
  utfall: "klar" | "avstangd" | "vilar" | "fryst" | "upptagen" | "stoppad";
  /** Varför körningen stoppade, när den gjorde det. Bär aldrig ett artikelnummer eller en nivå. */
  skal: string | null;
  dryRun: boolean;
  /** Avläsningar i lager som körningen gick igenom. */
  granskade: number;
  /** Importerade utkast (i torrläge: de som hade importerats). */
  importerade: number;
  /** Fanns redan i katalogen, eller spärrades av en tidigare import. */
  redanImporterade: number;
  hinder: Record<Hinder, number>;
  fel: number;
  /** Wix-id för produkter som skapades men inte fick någon mappningsrad. */
  foraldralosa: string[];
  bilder: Record<Bildmonster, number> & { utanEgna: number };
  medicinteknik: number;
  gpsr: { manualEjLast: number; ingenManual: number };
  /**
   * Syskon som blev en produkt (steg 8): produkter, deras varianter, och
   * familjer som inte gick att slå ihop och därför blev egna produkter.
   * Saknas i körningar från före steg 8.
   */
  familjer?: {
    sammanslagna: number;
    varianter: number;
    /** Foton som flera artiklar i en familj har, uppladdade en gång och okopplade. Saknas före 2026-10-30. */
    gemensammaBilder?: number;
    ejSammanslagna: Record<FamiljSkal, number>;
  };
  /** VEVOR:s recensioner på de importerade produkterna, som dolda rader. Saknas före steg 8. */
  recensioner?: { lasta: number; sparade: number; produkter: number; fel: number };
  produkterIWix: number | null;
  /** Gick körningen till slutet av avläsningarna? Då börjar nästa varv från början. */
  varvKlart: boolean;
  stoppadAv: "klart" | "limit" | "tidsbudget" | "tak" | "fel_i_foljd" | null;
}

export interface Foraldralos {
  sku: string;
  wixProductId: string;
  at: string;
}

export interface Importtillstand {
  /** Schemat importerar bara när importen är påslagen. Default av. */
  aktiv: boolean;
  /** Artikelnumret varvet fortsätter efter. Null = från början. */
  markor: string | null;
  /** Utkast importerade i det pågående varvet. */
  varvImporterade: number;
  /** Avläsningar i lager som det pågående varvet gått igenom. */
  varvGranskade: number;
  /** Ett varv utan något att importera: nästa börjar först efter den här tiden. */
  vilaTill: string | null;
  /**
   * Produkter som skapades i Wix men inte fick någon mappningsrad. Spärrar
   * artikeln för nästa varv, annars hade samma vara skapats igen.
   */
  foraldralosa: Foraldralos[];
  /** Körningar i följd som stoppats av fel. Larmet går vid tre. */
  stoppIFoljd: number;
  larmAt: string | null;
  senasteKorning: Importsummering | null;
}

export const TOMT_IMPORTTILLSTAND: Importtillstand = {
  aktiv: false,
  markor: null,
  varvImporterade: 0,
  varvGranskade: 0,
  vilaTill: null,
  foraldralosa: [],
  stoppIFoljd: 0,
  larmAt: null,
  senasteKorning: null,
};

export interface VevorImportLager {
  lasImport(): Promise<Importtillstand>;
  /** Bara de angivna fälten, aldrig hela raden (lib/vevor/lager.ts, uppdateraRad). */
  uppdateraImport(andring: Partial<Importtillstand>): Promise<void>;
  tagLas(agare: string, nu: number, ttlMs: number): Promise<boolean>;
  slappLas(agare: string): Promise<void>;
  /** Upp till `max` avläsningar i lager med artikelnummer efter `efter`, i artikelnummerordning. */
  kandidater(efter: string | null, max: number): Promise<Avlasning[]>;
  /** Läsarens frysning. Står läsaren still efter en spärr gör importen det också. */
  lasarensFrysning(): Promise<Lasartillstand["fryst"]>;
  /** Avläsningar i lager, för statusen. */
  raknaILager(): Promise<number>;
  /** Avläsningarna för artikelnumren, oavsett status. För syskonen (lib/vevor/familj.ts). */
  lasAvlasningar(skus: string[]): Promise<Map<string, Avlasning>>;
  /** Läsarens köer för sidorna, nycklade på webb-id. För syskon som inte lästs än. */
  lasSidor(webbIds: string[]): Promise<Map<string, Sidrad>>;
}

const IMPORT = "import";
const IMPORTLAS = "importlas";
const TILLSTAND = "tillstand";

export class WixVevorImportLager implements VevorImportLager {
  async lasImport(): Promise<Importtillstand> {
    const rad = await hamta<Partial<Importtillstand>>(VEVOR_KOL.lasare, IMPORT);
    return { ...TOMT_IMPORTTILLSTAND, ...(rad ?? {}) };
  }

  async uppdateraImport(andring: Partial<Importtillstand>): Promise<void> {
    await uppdateraRad(IMPORT, TOMT_IMPORTTILLSTAND, andring);
  }

  async tagLas(agare: string, nu: number, ttlMs: number): Promise<boolean> {
    return tagLasRad(IMPORTLAS, agare, nu, ttlMs);
  }

  async slappLas(agare: string): Promise<void> {
    await slappLasRad(IMPORTLAS, agare);
  }

  async kandidater(efter: string | null, max: number): Promise<Avlasning[]> {
    return fraga<Avlasning>(VEVOR_KOL.avlasningar, {
      filter: efter ? { status: "i_lager", _id: { $gt: efter } } : { status: "i_lager" },
      sort: [{ fieldName: "_id", order: "ASC" }],
      limit: Math.min(Math.max(1, max), 1000),
    });
  }

  async lasarensFrysning(): Promise<Lasartillstand["fryst"]> {
    const rad = await hamta<Partial<Lasartillstand>>(VEVOR_KOL.lasare, TILLSTAND);
    return rad?.fryst ?? null;
  }

  async raknaILager(): Promise<number> {
    return rakna(VEVOR_KOL.avlasningar, { status: "i_lager" });
  }

  async lasAvlasningar(skus: string[]): Promise<Map<string, Avlasning>> {
    return new WixVevorLager().avlasningar(skus);
  }

  async lasSidor(webbIds: string[]): Promise<Map<string, Sidrad>> {
    return new WixVevorLager().sidor(webbIds);
  }
}

/** Lagret i minnet, för tester. Samma regler som Wix där reglerna spelar roll. */
export class MinnesVevorImportLager implements VevorImportLager {
  tillstand: Importtillstand = structuredClone(TOMT_IMPORTTILLSTAND);
  avlasningar = new Map<string, Avlasning>();
  sidor = new Map<string, Sidrad>();
  fryst: Lasartillstand["fryst"] = null;
  las: { agare: string; utgar: number } | null = null;

  async lasImport() {
    return structuredClone(this.tillstand);
  }
  async uppdateraImport(andring: Partial<Importtillstand>) {
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
  async kandidater(efter: string | null, max: number) {
    return [...this.avlasningar.values()]
      .filter((a) => a.status === "i_lager" && (efter === null || a.sku > efter))
      .sort((a, b) => (a.sku < b.sku ? -1 : a.sku > b.sku ? 1 : 0))
      .slice(0, max)
      .map((a) => structuredClone(a));
  }
  async lasarensFrysning() {
    return this.fryst;
  }
  async raknaILager() {
    return [...this.avlasningar.values()].filter((a) => a.status === "i_lager").length;
  }
  async lasAvlasningar(skus: string[]) {
    const ut = new Map<string, Avlasning>();
    for (const s of skus) {
      const a = this.avlasningar.get(s);
      if (a) ut.set(s, structuredClone(a));
    }
    return ut;
  }
  async lasSidor(webbIds: string[]) {
    const ut = new Map<string, Sidrad>();
    for (const id of webbIds) {
      const r = this.sidor.get(id);
      if (r) ut.set(id, structuredClone(r));
    }
    return ut;
  }
}
