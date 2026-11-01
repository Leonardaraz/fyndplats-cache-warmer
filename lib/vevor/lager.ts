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

import { allaRader, fraga, hamta, rakna, sparaManga } from "@/lib/db/wix-data-klient";
import { slappLasIKollektion, tagLasIKollektion, uppdateraRadIKollektion } from "@/lib/db/kontrollrader";
import { VEVOR_KOL } from "@/lib/db/wix-kollektioner";
import type { Robotsregel } from "./robots";
import type { Sidinnehall, Tolkningsfel, VevorBetyg, VevorRecension } from "./sida";

/** Hur ofta en sida läses. `katalog` = aldrig läst, står först i kön. */
export type Sidklass = "katalog" | "utkast" | "publicerad" | "het";

export type Utfallskod =
  | "ok"
  | "saknas"
  | "flyttad"
  | "tillfalligt"
  | "skrivfel"
  /** Inte hämtad: robots.txt eller husets regler spärrar sökvägen. */
  | "sparrad"
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

export interface Avlasning extends Omit<Sidinnehall, "egenskaper" | "betyg" | "recensioner" | "specKalla"> {
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
  /**
   * När ett senare försök att läsa sidan misslyckades: tidsgräns, tolkningsfel,
   * fel språk eller valuta, en första 404, en spärr i robots.txt. Är den senare
   * än `lastAt` är artikeln okänd (lib/vevor/rad.ts). En giltig läsning nollar den.
   */
  misslyckadAt: string | null;
  /**
   * Priset i SEK vid artikelns FÖREGÅENDE giltiga avläsning, eller null när det
   * inte finns någon (den första avläsningen, eller äldre rader). Läsaren
   * sätter det när den skriver en ny avläsning (`medForraPris` i
   * lib/vevor/lasare.ts). Synken skriver ett nytt pris först när de två
   * avläsningarna ger samma regelpris (steg 5, lib/vevor/synk.ts).
   */
  forraPrisSek?: number | null;
  /**
   * VEVOR:s betyg (steg 8). Saknas fältet lästes sidan före steg 8, och då är
   * betyget okänt: importen väntar på nästa läsning (lib/vevor/to-product.ts).
   * Null betyder att sidan inte har något betyg.
   */
  betyg?: VevorBetyg | null;
  /** Recensionerna sidan visade, högst tio. Saknas på avläsningar före steg 8. */
  recensioner?: VevorRecension[];
  /**
   * Var specifikationen lästes (lib/vevor/sida.ts, `specOchPunkter`). Saknas
   * fältet lästes sidan före 2026-10-30, när läsaren bara kände den gamla
   * sidmallen: en tom specifikation är då okänd, inte tom (`spec_okant`).
   */
  specKalla?: "tabell" | "data" | null;
}

/**
 * Fälten synken läser ur en avläsning. Bara de hämtas (`avlasningarForSynk`):
 * en hel avläsning bär texten, specifikationen och galleriet, och synken läser
 * alla avläsningar i varje körning.
 */
export const SYNKFALT = [
  "sku",
  "status",
  "saldo",
  "prisSek",
  "forraPrisSek",
  "lastAt",
  "misslyckadAt",
  "borta",
  "levererasTillSe",
  "flode",
] as const satisfies readonly (keyof Avlasning)[];

export type SynkAvlasning = Pick<Avlasning, (typeof SYNKFALT)[number]>;

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
  /**
   * Giltiga sidor vars artikel var i lager vid förra avläsningen, och hur många
   * av dem som nu var slutsålda. Spärren mot slutsålda räknar bara de här: en
   * sida som aldrig lästs, eller som redan var slut, säger ingenting om att
   * VEVOR plötsligt visar allt som slutsålt.
   */
  forutILager: number;
  slutForutILager: number;
  ejLevererbara: number;
  saknade: number;
  flyttade: number;
  tillfalliga: number;
  tolkningsfel: Partial<Record<Tolkningsfel, number>>;
  /** Sidor som inte hämtades för att robots.txt eller husets regler spärrar dem. */
  sparrade: number;
  blockerad: string | null;
  /**
   * Kontrollsidorna: lästa, giltiga, otolkbara (stoppar körningen), saknade i
   * den här körningen (tre stoppar den), slutsålda (tre stoppar den) och
   * utbytta av alla skäl.
   */
  kontroller: { lasta: number; ok: number; fel: number; saknade: number; slut: number; ersatta: number };
  /** robots.txt: hämtad i den här körningen eller läst ur förra dygnets, och antal regler som gäller oss. */
  robots: { hamtad: boolean; regler: number; crawlDelaySek: number | null } | null;
  karta: { lasta: number; nya: number; borta: number; tillbaka: number; kvar: number } | null;
  prioritet: { het: number; publicerad: number; andrade: number } | null;
  /** Sidor ur kön som lades tillbaka, utspridda, när en spärr stoppade körningen. */
  aterlagda: number;
  skrivna: { avlasningar: number; sidor: number; borta: number; misslyckade: number; fel: number };
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
  /** robots.txt:s regler för oss, och när filen lästes. Läses om efter ett dygn. */
  robots: { at: string; regler: Robotsregel[]; crawlDelaySek: number | null } | null;
  /** Körningar i följd som stoppats utan att skriva (spärr, kontrollsida, robots.txt). Larmet går först vid tre. */
  stoppIFoljd: number;
  /**
   * Kontrollsidor som föll, och när. Väljs inte igen på en vecka. En lista och
   * inte ett objekt med webb-id som nycklar: Wix fältnamn tål inte allt.
   */
  uteslutnaKontroller: { id: string; at: string }[];
}

export const TOMT_TILLSTAND: Lasartillstand = {
  aktiv: false,
  fryst: null,
  kontroller: [],
  kartaAt: null,
  prioriteradAt: null,
  larmAt: {},
  senasteKorning: null,
  robots: null,
  stoppIFoljd: 0,
  uteslutnaKontroller: [],
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
  /**
   * Skriver bara de angivna fälten. ☠️ Aldrig hela raden: körningen och
   * strömbrytaren (`aktiv`, `fryst`) skriver var sina fält, och en körning som
   * skrev tillbaka hela raden hade ångrat ett "av" som kom medan den läste.
   */
  uppdateraTillstand(andring: Partial<Lasartillstand>): Promise<void>;
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
  /** Alla avläsningar, med bara synkens fält (`SYNKFALT`). */
  avlasningarForSynk(): Promise<SynkAvlasning[]>;
  /** Sparar avläsningarna. Svarar med artikelnumren Wix inte bekräftade. */
  sparaAvlasningar(rader: Avlasning[]): Promise<string[]>;
  /**
   * Upp till `max` avläsningar i lager: kandidater till kontrollsidor.
   * `slump` (0–1) väljer var i listan urvalet börjar, så att samma kandidater
   * inte kommer tillbaka varje gång.
   */
  kontrollkandidater(max: number, slump: number): Promise<Avlasning[]>;
  rakna(nuIso: string): Promise<Raknare>;
}

const TILLSTAND = "tillstand";
const LAS = "las";

/**
 * Ett lås i läsarens kollektion: raden `id` med ägare och utgångstid. Sant om vi
 * fick det, alltså om ingen annan håller ett som inte gått ut. Läsaren och
 * importen har var sitt (lib/vevor/import-lager.ts). Reglerna bor i
 * lib/db/kontrollrader.ts, som rea-jobbet också läser.
 */
export async function tagLasRad(id: string, agare: string, nu: number, ttlMs: number): Promise<boolean> {
  return tagLasIKollektion(VEVOR_KOL.lasare, id, agare, nu, ttlMs);
}

export async function slappLasRad(id: string, agare: string): Promise<void> {
  await slappLasIKollektion(VEVOR_KOL.lasare, id, agare);
}

/**
 * Skriver bara de angivna fälten på raden `id`, och skapar den med `tom` som
 * grund om den saknas. Läsarens och importens tillstånd skrivs så: aldrig hela
 * raden, så att en strömbrytare som slås om medan en körning läser inte ångras.
 */
export async function uppdateraRad<T extends object>(id: string, tom: T, andring: Partial<T>): Promise<void> {
  await uppdateraRadIKollektion(VEVOR_KOL.lasare, id, tom, andring);
}

/** Var ett urval om `limit` börjar bland `antal` rader, för `slump` mellan 0 och 1. */
export function startpunkt(antal: number, limit: number, slump: number): number {
  const s = Number.isFinite(slump) ? Math.min(Math.max(slump, 0), 0.999_999) : 0;
  return Math.floor(s * Math.max(0, antal - limit));
}

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

  async uppdateraTillstand(andring: Partial<Lasartillstand>): Promise<void> {
    await uppdateraRad(TILLSTAND, TOMT_TILLSTAND, andring);
  }

  async tagLas(agare: string, nu: number, ttlMs: number): Promise<boolean> {
    return tagLasRad(LAS, agare, nu, ttlMs);
  }

  async slappLas(agare: string): Promise<void> {
    await slappLasRad(LAS, agare);
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

  async avlasningarForSynk(): Promise<SynkAvlasning[]> {
    return allaRader<SynkAvlasning>(VEVOR_KOL.avlasningar, { falt: SYNKFALT, sidstorlek: 1000 });
  }

  async kontrollkandidater(max: number, slump: number): Promise<Avlasning[]> {
    const limit = Math.min(Math.max(1, max), 1000);
    const antal = await rakna(VEVOR_KOL.avlasningar, { status: "i_lager" });
    return fraga<Avlasning>(VEVOR_KOL.avlasningar, {
      filter: { status: "i_lager" },
      sort: [{ fieldName: "_id", order: "ASC" }],
      limit,
      offset: startpunkt(antal, limit, slump),
    });
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
  async uppdateraTillstand(andring: Partial<Lasartillstand>) {
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
  async avlasningarForSynk() {
    return [...this.avlasningsrader.values()].map(
      (r) => Object.fromEntries(SYNKFALT.map((f) => [f, structuredClone(r[f])])) as SynkAvlasning,
    );
  }
  async kontrollkandidater(max: number, slump: number) {
    const alla = [...this.avlasningsrader.values()]
      .filter((r) => r.status === "i_lager")
      .sort((a, b) => (a.sku < b.sku ? -1 : 1));
    const fran = startpunkt(alla.length, max, slump);
    return alla.slice(fran, fran + max).map((r) => structuredClone(r));
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
