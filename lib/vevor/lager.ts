// Läsarens lagring i Wix CMS: sidorna, avläsningarna och läsarens tillstånd.
//
// TRE KOLLEKTIONER, alla med behörigheten ADMIN (lib/db/wix-kollektioner.ts):
//
//   FyndplatsVevorSidor        en rad per produktadress, nyckel webb-id:t.
//                              Var sidan står i kön, hur förra läsningen gick,
//                              och signalerna för "borta".
//   FyndplatsVevorAvlasningar  en rad per artikel, nyckel VEVOR:s artikelnummer.
//                              Senaste GILTIGA avläsningen. Upsert per artikel,
//                              så en omkörning skriver samma rad igen.
//   FyndplatsVevorLasare       två rader: läsarens tillstånd ("tillstand") och
//                              låset ("las").
//
// ☠️ RADERNA BÄR ARTIKELNUMMER, ADRESSER OCH PRISER. De bor bara här, och
// kollektionerna går bara att läsa med motorns nyckel. Inget av det skrivs ut i
// en loggrad, ett svar eller ett mejl.
//
// Varför två tabeller och inte en: vilka sidor som finns vet vi från kartan
// innan vi vet artikelnumret, och en artikel ska bara ha EN avläsning även om
// VEVOR skulle visa den under två adresser.

import {
  allaRader,
  fraga,
  hamta,
  infoga,
  patcha,
  rakna,
  satt,
  spara,
  sparaManga,
  taBort,
} from "@/lib/db/wix-data-klient";
import { VEVOR_KOL } from "@/lib/db/wix-kollektioner";
import type { Sidinnehall, Tolkningsfel } from "./sida";

/** Hur ofta en sida läses. `katalog` = aldrig läst, står först i kön. */
export type Sidklass = "katalog" | "utkast" | "publicerad" | "het";

export type Utfallskod =
  | "ok"
  | "saknas"
  | "flyttad"
  | "tillfalligt"
  | "skrivfel"
  | `tolkningsfel:${Tolkningsfel}`;

export interface Sidrad {
  webbId: string;
  sokvag: string;
  klass: Sidklass;
  /** När sidan ska läsas nästa gång, ISO. Kön sorteras på den. */
  nastaLasning: string;
  /** Artikelnumret senast sidan gick att läsa, eller null. */
  sku: string | null;
  senastForsokAt: string | null;
  senastUtfall: Utfallskod | null;
  senastOkAt: string | null;
  /** Står sidan i VEVOR:s produktkarta? */
  iKartan: boolean;
  /** När sidan först saknades i kartan, eller null. */
  saknadIKartanSedan: string | null;
  /** Första "saknas"-signalen i den nuvarande sviten (404, flytt bort), eller null. */
  saknasForstaAt: string | null;
  /** Bekräftat borta: två signaler med minst ett dygn emellan. */
  borta: boolean;
}

/** Artikelns status som den lästes. Okänt finns inte här: en okänd läsning sparas aldrig. */
export type Avlasningsstatus = "i_lager" | "slut" | "ej_levererbar" | "borta";

export interface Avlasning extends Omit<Sidinnehall, "egenskaper"> {
  webbId: string;
  sokvag: string;
  /** När sidan lästes, ISO. Adaptern räknar åldern på den (lib/vevor/rad.ts). */
  lastAt: string;
  status: Avlasningsstatus;
  /** Variantens egna värden som par. Wix fältnamn tål inte allt som står i nycklarna. */
  egenskaper: [string, string][];
  toppkategoriId: string | null;
  toppkategori: string | null;
  borta: boolean;
  bortaAt: string | null;
}

export interface Korningssummering {
  start: string;
  slutAt: string;
  utfall: "klar" | "avstangd" | "fryst" | "upptagen" | "stoppad";
  /** Varför körningen stoppade eller inte skrev, när den gjorde det. */
  skal: string | null;
  lasta: number;
  giltiga: number;
  iLager: number;
  slutsalda: number;
  ejLevererbara: number;
  saknade: number;
  flyttade: number;
  tillfalliga: number;
  tolkningsfel: Partial<Record<Tolkningsfel, number>>;
  blockerad: string | null;
  kontroller: { lasta: number; ok: number; fel: number; ersatta: number };
  karta: { lasta: number; nya: number; borta: number; tillbaka: number; kvar: number } | null;
  prioritet: { het: number; publicerad: number; andrade: number } | null;
  skrivna: { avlasningar: number; sidor: number; borta: number; fel: number };
}

export interface Lasartillstand {
  /** Läsaren kör på schemat bara när den är påslagen. Default av. */
  aktiv: boolean;
  /** Fryst efter en spärr: ingenting läses eller skrivs förrän en människa tinar. */
  fryst: { at: string; skal: string } | null;
  /** Kontrollsidornas webb-id. Läses i varje körning. */
  kontroller: string[];
  /** När kartan senast lästes klart. */
  kartaAt: string | null;
  /** När prioriteringen senast gjordes. */
  prioriteradAt: string | null;
  /** Senaste larm per skäl, så att samma larm inte går varje körning. */
  larmAt: Record<string, string>;
  senasteKorning: Korningssummering | null;
}

export const TOMT_TILLSTAND: Lasartillstand = {
  aktiv: false,
  fryst: null,
  kontroller: [],
  kartaAt: null,
  prioriteradAt: null,
  larmAt: {},
  senasteKorning: null,
};

export interface Raknare {
  sidor: number;
  forfallna: number;
  borta: number;
  avlasningar: number;
  perStatus: Record<Avlasningsstatus, number>;
}

export interface VevorLager {
  lasTillstand(): Promise<Lasartillstand>;
  sparaTillstand(t: Lasartillstand): Promise<void>;
  /** Låset. Sant om vi fick det: ingen annan körning håller ett som inte gått ut. */
  tagLas(agare: string, nu: number, ttlMs: number): Promise<boolean>;
  slappLas(agare: string): Promise<void>;
  /** Sidor vars `nastaLasning` passerat, äldst först. */
  forfallna(nuIso: string, max: number): Promise<Sidrad[]>;
  sidor(webbIds: string[]): Promise<Map<string, Sidrad>>;
  allaSidor(): Promise<Sidrad[]>;
  sidorMedKlass(klasser: Sidklass[]): Promise<Sidrad[]>;
  sidorForSkus(skus: string[]): Promise<Sidrad[]>;
  /** Sparar sidorna. Svarar med webb-id för dem Wix inte bekräftade. */
  sparaSidor(rader: Sidrad[]): Promise<string[]>;
  avlasningar(skus: string[]): Promise<Map<string, Avlasning>>;
  /** Sparar avläsningarna. Svarar med artikelnumren Wix inte bekräftade. */
  sparaAvlasningar(rader: Avlasning[]): Promise<string[]>;
  /** Webb-id för upp till `max` artiklar i lager: kandidater till kontrollsidor. */
  kontrollkandidater(max: number): Promise<string[]>;
  rakna(nuIso: string): Promise<Raknare>;
}

const TILLSTAND = "tillstand";
const LAS = "las";

function iOmgangarOm<T>(lista: T[], n: number): T[][] {
  const ut: T[][] = [];
  for (let i = 0; i < lista.length; i += n) ut.push(lista.slice(i, i + n));
  return ut;
}

export class WixVevorLager implements VevorLager {
  async lasTillstand(): Promise<Lasartillstand> {
    const rad = await hamta<Partial<Lasartillstand>>(VEVOR_KOL.lasare, TILLSTAND);
    return { ...TOMT_TILLSTAND, ...(rad ?? {}) };
  }

  async sparaTillstand(t: Lasartillstand): Promise<void> {
    await spara(VEVOR_KOL.lasare, TILLSTAND, { ...t } as unknown as Record<string, unknown>);
  }

  async tagLas(agare: string, nu: number, ttlMs: number): Promise<boolean> {
    const utgar = new Date(nu + ttlMs).toISOString();
    if ((await infoga(VEVOR_KOL.lasare, LAS, { agare, utgar })) === "skapad") return true;
    const rad = await hamta<{ agare?: string; utgar?: string }>(VEVOR_KOL.lasare, LAS);
    if (!rad) return (await infoga(VEVOR_KOL.lasare, LAS, { agare, utgar })) === "skapad";
    if (rad.utgar && Date.parse(rad.utgar) > nu) return false;
    // Låset har gått ut: ta över det, men bara om ingen annan hann före.
    const villkor = rad.agare ? { agare: rad.agare } : { agare: { $exists: false } };
    return (await patcha(VEVOR_KOL.lasare, LAS, [satt("agare", agare), satt("utgar", utgar)], villkor)) === "applied";
  }

  async slappLas(agare: string): Promise<void> {
    await taBort(VEVOR_KOL.lasare, LAS, { agare });
  }

  async forfallna(nuIso: string, max: number): Promise<Sidrad[]> {
    return fraga<Sidrad>(VEVOR_KOL.sidor, {
      filter: { nastaLasning: { $lte: nuIso } },
      sort: [{ fieldName: "nastaLasning", order: "ASC" }],
      limit: Math.min(Math.max(1, max), 1000),
    });
  }

  async sidor(webbIds: string[]): Promise<Map<string, Sidrad>> {
    const ut = new Map<string, Sidrad>();
    for (const del of iOmgangarOm([...new Set(webbIds)], 100)) {
      const rader = await fraga<Sidrad>(VEVOR_KOL.sidor, { filter: { _id: { $in: del } }, limit: 1000 });
      for (const r of rader) if (del.includes(r.webbId)) ut.set(r.webbId, r);
    }
    return ut;
  }

  async allaSidor(): Promise<Sidrad[]> {
    return allaRader<Sidrad>(VEVOR_KOL.sidor, { sidstorlek: 1000 });
  }

  async sidorMedKlass(klasser: Sidklass[]): Promise<Sidrad[]> {
    return allaRader<Sidrad>(VEVOR_KOL.sidor, { filter: { klass: { $in: klasser } }, sidstorlek: 1000 });
  }

  async sidorForSkus(skus: string[]): Promise<Sidrad[]> {
    const ut: Sidrad[] = [];
    for (const del of iOmgangarOm([...new Set(skus)], 100)) {
      ut.push(...(await fraga<Sidrad>(VEVOR_KOL.sidor, { filter: { sku: { $in: del } }, limit: 1000 })));
    }
    return ut;
  }

  async sparaSidor(rader: Sidrad[]): Promise<string[]> {
    if (rader.length === 0) return [];
    const u = await sparaManga(
      VEVOR_KOL.sidor,
      rader.map((r) => ({ id: r.webbId, data: { ...r } as unknown as Record<string, unknown> })),
    );
    return u.fel.map((f) => f.id);
  }

  async avlasningar(skus: string[]): Promise<Map<string, Avlasning>> {
    const ut = new Map<string, Avlasning>();
    for (const del of iOmgangarOm([...new Set(skus)], 100)) {
      const rader = await fraga<Avlasning>(VEVOR_KOL.avlasningar, { filter: { _id: { $in: del } }, limit: 1000 });
      for (const r of rader) if (del.includes(r.sku)) ut.set(r.sku, r);
    }
    return ut;
  }

  async sparaAvlasningar(rader: Avlasning[]): Promise<string[]> {
    if (rader.length === 0) return [];
    const u = await sparaManga(
      VEVOR_KOL.avlasningar,
      rader.map((r) => ({ id: r.sku, data: { ...r } as unknown as Record<string, unknown> })),
    );
    return u.fel.map((f) => f.id);
  }

  async kontrollkandidater(max: number): Promise<string[]> {
    const rader = await fraga<Avlasning>(VEVOR_KOL.avlasningar, {
      filter: { status: "i_lager" },
      sort: [{ fieldName: "_id", order: "ASC" }],
      limit: Math.min(Math.max(1, max), 1000),
    });
    return rader.map((r) => r.webbId).filter(Boolean);
  }

  async rakna(nuIso: string): Promise<Raknare> {
    const [sidor, forfallna, borta, avlasningar, iLager, slut, ejLev, avBorta] = await Promise.all([
      rakna(VEVOR_KOL.sidor),
      rakna(VEVOR_KOL.sidor, { nastaLasning: { $lte: nuIso } }),
      rakna(VEVOR_KOL.sidor, { borta: true }),
      rakna(VEVOR_KOL.avlasningar),
      rakna(VEVOR_KOL.avlasningar, { status: "i_lager" }),
      rakna(VEVOR_KOL.avlasningar, { status: "slut" }),
      rakna(VEVOR_KOL.avlasningar, { status: "ej_levererbar" }),
      rakna(VEVOR_KOL.avlasningar, { status: "borta" }),
    ]);
    return {
      sidor,
      forfallna,
      borta,
      avlasningar,
      perStatus: { i_lager: iLager, slut, ej_levererbar: ejLev, borta: avBorta },
    };
  }
}

/** Lagret i minnet, för tester. Samma regler som Wix där reglerna spelar roll. */
export class MinnesVevorLager implements VevorLager {
  tillstand: Lasartillstand = { ...TOMT_TILLSTAND };
  sidrader = new Map<string, Sidrad>();
  avlasningsrader = new Map<string, Avlasning>();
  las: { agare: string; utgar: number } | null = null;
  /** Sätts av tester som vill se ett sparfel. */
  sparfelSidor = new Set<string>();
  sparfelAvlasningar = new Set<string>();

  async lasTillstand() {
    return structuredClone(this.tillstand);
  }
  async sparaTillstand(t: Lasartillstand) {
    this.tillstand = structuredClone(t);
  }
  async tagLas(agare: string, nu: number, ttlMs: number) {
    if (this.las && this.las.utgar > nu) return false;
    this.las = { agare, utgar: nu + ttlMs };
    return true;
  }
  async slappLas(agare: string) {
    if (this.las?.agare === agare) this.las = null;
  }
  async forfallna(nuIso: string, max: number) {
    return [...this.sidrader.values()]
      .filter((r) => r.nastaLasning <= nuIso)
      .sort((a, b) => (a.nastaLasning < b.nastaLasning ? -1 : a.nastaLasning > b.nastaLasning ? 1 : 0))
      .slice(0, max)
      .map((r) => structuredClone(r));
  }
  async sidor(webbIds: string[]) {
    const ut = new Map<string, Sidrad>();
    for (const id of webbIds) {
      const r = this.sidrader.get(id);
      if (r) ut.set(id, structuredClone(r));
    }
    return ut;
  }
  async allaSidor() {
    return [...this.sidrader.values()].map((r) => structuredClone(r));
  }
  async sidorMedKlass(klasser: Sidklass[]) {
    return [...this.sidrader.values()].filter((r) => klasser.includes(r.klass)).map((r) => structuredClone(r));
  }
  async sidorForSkus(skus: string[]) {
    const s = new Set(skus);
    return [...this.sidrader.values()].filter((r) => r.sku && s.has(r.sku)).map((r) => structuredClone(r));
  }
  async sparaSidor(rader: Sidrad[]) {
    const fel: string[] = [];
    for (const r of rader) {
      if (this.sparfelSidor.has(r.webbId)) fel.push(r.webbId);
      else this.sidrader.set(r.webbId, structuredClone(r));
    }
    return fel;
  }
  async avlasningar(skus: string[]) {
    const ut = new Map<string, Avlasning>();
    for (const s of skus) {
      const r = this.avlasningsrader.get(s);
      if (r) ut.set(s, structuredClone(r));
    }
    return ut;
  }
  async sparaAvlasningar(rader: Avlasning[]) {
    const fel: string[] = [];
    for (const r of rader) {
      if (this.sparfelAvlasningar.has(r.sku)) fel.push(r.sku);
      else this.avlasningsrader.set(r.sku, structuredClone(r));
    }
    return fel;
  }
  async kontrollkandidater(max: number) {
    return [...this.avlasningsrader.values()]
      .filter((r) => r.status === "i_lager")
      .sort((a, b) => (a.sku < b.sku ? -1 : 1))
      .slice(0, max)
      .map((r) => r.webbId);
  }
  async rakna(nuIso: string) {
    const sidor = [...this.sidrader.values()];
    const avl = [...this.avlasningsrader.values()];
    const per = (s: Avlasningsstatus) => avl.filter((a) => a.status === s).length;
    return {
      sidor: sidor.length,
      forfallna: sidor.filter((r) => r.nastaLasning <= nuIso).length,
      borta: sidor.filter((r) => r.borta).length,
      avlasningar: avl.length,
      perStatus: { i_lager: per("i_lager"), slut: per("slut"), ej_levererbar: per("ej_levererbar"), borta: per("borta") },
    };
  }
}
