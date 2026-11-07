// Var sidhuvudet hämtar menyn och REA-knappen ifrån. LÖVMODUL utan importer,
// prövad i lib/sidhuvud-val.test.ts. Kopplingen till katalogen och Wix ligger i
// lib/sidhuvud-data.ts.
//
// ☠️ SIDHUVUDET VÄNTADE IN HELA KATALOGEN. Menyn och REA-knappen byggs ur alla
// produkter, och en ny instans hämtar dem från Wix: 21–34 s. Varje sida som
// byggs vid besöket väntade därför så länge på en ny instans, också kassans
// sidor där menyn inte ens syns (Mina sidor 21,5 s, mätt 2026-11-06 23:30 UTC;
// cirka 690 sådana katalogladdningar på ett dygn, mätt 2026-11-07).
//
// Nu bygger en varm instans som förut ur katalogen den har. En kall instans
// läser den färdiga menyn, som /api/cron/meny bygger med samma kod var 15:e
// minut och sparar i Wix. Saknas den, är den för gammal eller svarar Wix inte
// i tid, bygger sidhuvudet ur katalogen som förut. Reserven är alltid den
// långsamma men säkra vägen, aldrig ett sidhuvud utan meny.

/** En huvudkategori med underkategorier, samma form som CategoryNode. */
export type MenyNod = {
  id: string;
  name: string;
  slug: string;
  count: number;
  subs: { id: string; name: string; slug: string; count: number }[];
};

export type Sidhuvudsdata<T> = { tree: T[]; hasSale: boolean };

/** Byts när radens form ändras, så att en äldre rad aldrig tolkas fel. */
export const MENY_VERSION = 1;
/** Äldre än så används inte. En cachad produktsida bär redan ett sidhuvud upp till sex timmar. */
export const MENY_MAX_ALDER_MS = 6 * 3_600_000;
/** Så länge får läsningen ta innan sidhuvudet bygger ur katalogen i stället. */
export const MENY_LAS_TIDSGRANS_MS = 2_500;
/** Färre huvudkategorier än så sparas aldrig: då är det katalogen som är trasig. */
export const MENY_MINST_GRUPPER = 3;
/** Wix tar högst 500 kB per rad. Menyn är några tiotals kB. */
export const MENY_MAX_BYTE = 400_000;

/** Radens id i FyndplatsButikInstallningar, en per miljö: en förhandsversion skriver aldrig produktionens meny. */
export function menyRadId(miljo: string | undefined): string {
  const m = miljo === "production" || miljo === "preview" ? miljo : "development";
  return `sidhuvud-meny-${m}`;
}

export type MenyKalla = "levande" | "sparad" | "reserv";

export type SidhuvudKallor<T> = {
  /** Har den här instansen redan hela katalogen i minnet? */
  laddad: () => boolean;
  /** Bygg ur katalogen: snabbt på en varm instans, 21–34 s på en kall. */
  levande: () => Promise<Sidhuvudsdata<T>>;
  /** Den färdiga menyn, eller null när den saknas eller inte duger. */
  sparad: () => Promise<Sidhuvudsdata<T> | null>;
  tidsgransMs?: number;
};

export async function valjSidhuvud<T>(k: SidhuvudKallor<T>): Promise<{ data: Sidhuvudsdata<T>; kalla: MenyKalla }> {
  if (k.laddad()) return { data: await k.levande(), kalla: "levande" };
  const sparad = await medTidsgrans(k.sparad(), k.tidsgransMs ?? MENY_LAS_TIDSGRANS_MS);
  if (sparad) return { data: sparad, kalla: "sparad" };
  return { data: await k.levande(), kalla: "reserv" };
}

/** Svaret, eller null om det inte kommit inom ms eller föll. Timern städas alltid. */
export function medTidsgrans<T>(lofte: Promise<T | null>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tid = new Promise<null>((r) => {
    timer = setTimeout(() => r(null), ms);
  });
  return Promise.race([lofte.catch(() => null), tid]).finally(() => clearTimeout(timer));
}

/** Något nedsatt som går att köpa? Annars leder REA-knappen till en tom lista. */
export function harRea(produkter: readonly { onSale?: boolean; inStock?: boolean }[]): boolean {
  return produkter.some((p) => Boolean(p.onSale && p.inStock));
}

const arText = (x: unknown): x is string => typeof x === "string" && x.length > 0;
const arAntal = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

type Lost = Record<string, unknown>;
const arPost = (x: unknown): x is Lost => typeof x === "object" && x !== null && !Array.isArray(x);
const arUnderkategori = (s: unknown) => arPost(s) && arText(s.id) && arText(s.name) && arText(s.slug) && arAntal(s.count);

/** Ett träd med minst en huvudkategori där varje nod har id, namn, adress, antal och underkategorier. */
export function arMenytrad(x: unknown): x is MenyNod[] {
  if (!Array.isArray(x) || x.length === 0) return false;
  return x.every(
    (m) =>
      arPost(m) && arText(m.id) && arText(m.name) && arText(m.slug) && arAntal(m.count) &&
      Array.isArray(m.subs) && m.subs.every(arUnderkategori),
  );
}

const byte = (text: string) => new TextEncoder().encode(text).length;

export type MenyRad = {
  v: number;
  skapad: string;
  hasSale: boolean;
  menyJson: string;
  grupper: number;
  underkategorier: number;
  byte: number;
};

export function radForMeny(data: Sidhuvudsdata<MenyNod>, nuMs: number): MenyRad {
  const menyJson = JSON.stringify(data.tree);
  return {
    v: MENY_VERSION,
    skapad: new Date(nuMs).toISOString(),
    hasSale: data.hasSale,
    menyJson,
    grupper: data.tree.length,
    underkategorier: data.tree.reduce((n, m) => n + m.subs.length, 0),
    byte: byte(menyJson),
  };
}

/** Varför menyn inte ska sparas, eller null när den duger. */
export function varforInteSpara(data: Sidhuvudsdata<MenyNod>, degraderad: boolean): string | null {
  if (degraderad) return "katalogen är degraderad (reservlista eller kapad hämtning)";
  if (!arMenytrad(data.tree)) return "trädet har fel form";
  if (data.tree.length < MENY_MINST_GRUPPER) return `bara ${data.tree.length} huvudkategorier`;
  const storlek = byte(JSON.stringify(data.tree));
  if (storlek > MENY_MAX_BYTE) return `menyn är för stor (${storlek} byte)`;
  return null;
}

/** Den sparade raden som meny, eller null när den saknas, har fel version, är för gammal eller har fel form. */
export function tolkaSparadMeny(rad: Lost | null | undefined, nuMs: number): Sidhuvudsdata<MenyNod> | null {
  if (!rad || rad.v !== MENY_VERSION) return null;
  if (typeof rad.hasSale !== "boolean" || typeof rad.menyJson !== "string" || typeof rad.skapad !== "string") return null;
  const skapad = Date.parse(rad.skapad);
  if (!Number.isFinite(skapad) || nuMs - skapad > MENY_MAX_ALDER_MS || skapad - nuMs > 5 * 60_000) return null;
  let tree: unknown;
  try {
    tree = JSON.parse(rad.menyJson);
  } catch {
    return null;
  }
  return arMenytrad(tree) ? { tree, hasSale: rad.hasSale } : null;
}
