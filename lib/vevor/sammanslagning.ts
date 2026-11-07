// VEVOR-sammanslagning: en VEVOR-artikel blir en VARIANT — en färg, ett mönster,
// en storlek, en längd eller en förpackningsstorlek — på en annan VEVOR-sida.
//
// VARFÖR DEN FINNS (Leonard 2026-11-07: "Ja gör det")
//
// Importen slår ihop syskon som VEVOR länkar till varandra, eller som delar SPU
// (lib/vevor/familj.ts). Många syskon är varken länkade eller i samma SPU, och
// blev egna utkast: samma vara i en annan storlek, färg eller förpackning. Att
// publicera var och en ger flera adresser för samma produkt; att låta dem ligga
// slänger varor vi kan sälja. Det här verktyget gör ett sådant utkast till en
// variant på en annan VEVOR-sida, med samma skrivordning som Aosoms verktyg
// (lib/aosom/sammanslagning.ts) och den metod som kördes för hand på
// bordsdukarna 2026-11-02 (docs/polish/vevor.md).
//
// ☠️ FAMILJEREGELN STYR (Leonard 2026-10-30, lib/vevor/axelklass.ts). Bara färg,
// mönster, storlek, längd och förpackning får dela en sida. En axel vars värden
// skiljer sig på en funktionsenhet (W, V, Ah, liter …), eller som inte går att
// avgöra, stoppar (`familjeregeln_*`). Och en rad i specifikationen som visar att
// varorna fungerar olika — en effekt, en kapacitet, en last som skiljer — stoppar
// också (`funktion_skiljer`), vad axeln än heter. En recension av 1 800 W-sågen
// hör inte hemma på 850 W-sågens sida.
//
// SKILLNADERNA MOT AOSOMS VERKTYG
//
//   - Sidan vi behåller får vara ett OPOLERAT UTKAST: två syskonutkast slås ihop
//     till ett, och poleringen skriver sedan sidan som en sammanslagen sida
//     (`sammanslagna.tsv`). En publicerad sida går också.
//   - Axlarna heter Färg, Mönster, Storlek, Längd eller Förpackning när de är nya. En
//     familj som importen byggde behåller sina egna axelnamn ("Kvantitet").
//   - Bilderna känns igen på sitt INNEHÅLL (Wix `hash`): VEVOR lägger samma foto
//     under olika adresser för varje artikel (lib/vevor/bildinnehall.ts). Ett
//     foto som sidan redan har läggs inte till igen och kopplas inte till något
//     val. Givarens egna foton kopplas till givarens värde.
//   - Recensionerna KOPIERAS alltid, också från ett utkast, med `kopt` satt till
//     givarens värde ("Köpt: …" i butiken). Givarens egna rader rörs inte.
//   - Mappningen bär `vevorArtiklar` med givarens artikel, så importens
//     dubblettspärr ser den, och den skrivs direkt efter Wix — aldrig runt minut
//     50, när VEVOR-synken går, och aldrig i Aosoms synkfönster.
//
// ☠️ HALVGJORT ÄR SÄKERT, OCH DET ÄR MED FLIT. Faller något efter Wix-skrivningen
// har Wix en variant som mappningen inte känner till. Synken nollar då dess
// lager. En omkörning ser hur långt det kom och gör bara det som återstår.
//
// ☠️ PRISET RÖRS INTE. Den nya varianten får givarens pris som det står i
// butiken, de gamla behåller sina.
//
// ☠️ SVARET BÄR ALDRIG ETT ARTIKELNUMMER ELLER EN KOSTNAD. Det går till en publik
// Actions-logg. Planen säger kundpriser, saldon, val, bildantal och adresser.

import type { ProductMappingRecord } from "../store";
import type { StoredReview } from "../store/reviews";
import { VEVOR_ID_PREFIX } from "../store/leverantorsprefix";
import { validateRedirect, type RedirectRow } from "../wix/redirects";
import { redigera, felText, type WixAnrop } from "../polish/skrivplan";
import { KOSTNAD_EJ_LASBAR, lasMedKostnad, variantsInfoMedKostnad } from "../wix/produkt-kostnad";
import { refreshVariantMedia, variantbildSteg } from "../wix/variant-media";
import { iSynkfonster } from "../wix/synkfonster";
import { SKU_MAX } from "../import/sku";
import { artikelUtanPrefix, artikelbild, artiklarPaRaden } from "../aosom/artiklar";
import { pensioneraDubblett } from "../aosom/remap";
import { WIX_BILDTAK } from "../aosom/fargbilder";
import {
  MAX_OMDIRIGERINGAR,
  fargSlug,
  malUtanFraga,
  type Omdirigeringar,
  type RecensionsLager,
} from "../aosom/sammanslagning";
import { TILLATNA, arFunktionsrad, axelklass, type Axelklass } from "./axelklass";
import type { Avlasning } from "./lager";

type Obj = Record<string, unknown>;
type MappningsVariant = ProductMappingRecord["variants"][number];

/** Axlarna en sida kan FÅ här, i den ordning en ny sida får dem. */
export const NYA_AXLAR = ["Färg", "Mönster", "Storlek", "Längd", "Förpackning"] as const;

/** Ett värde per axel: en variants plats bland valen. */
export type Koordinat = Record<string, string>;

const RENDER = "TEXT_CHOICES";

/** Hur länge återläsningen väntar på att valens bilder kopplats (ms per försök). */
const KOPPLING_PAUS_MS = 2500;
const KOPPLING_FORSOK = 8;

/** Wix tak för ett valnamn (`WIX_MAX_VALNAMN` i lib/vevor/familj.ts). */
const MAX_VARDE = 50;

/**
 * VEVOR-synken går minut 50 varje timme (`vevor-synk.yml`). En variant som Wix
 * har men mappningen inte känner till får sitt lager nollat, så skrivningen
 * vägras från minut 45 till och med minut 57.
 */
export const VEVOR_SYNK_FRAN_MIN = 45;
export const VEVOR_SYNK_TILL_MIN = 57;

export function iVevorSynkfonster(nu: Date): boolean {
  const m = nu.getUTCMinutes();
  return m >= VEVOR_SYNK_FRAN_MIN && m <= VEVOR_SYNK_TILL_MIN;
}

export interface VevorSammanslagningInput {
  /** Sidan som behålls: ett VEVOR-utkast eller en publicerad VEVOR-sida. */
  behall: string;
  /** Givaren: ett VEVOR-utkast med en artikel, eller (med `omdirigera`) en publicerad sida. */
  utkast: string;
  /** Givarens värde på varje axel sidan har eller får, t.ex. { Storlek: "120 cm" }. */
  varden: Koordinat;
  /** Sidans värde på en axel den FÅR i den här körningen. Efter det står valen i Wix och mappningen. */
  vardenBehall?: Koordinat;
  /** Den nya variantens SKU. Utelämnad = sidans SKU + givarens nya värden. */
  sku?: string;
  /**
   * Givarens bilder som följer med, 1-baserat i givarens ordning. Utelämnad =
   * alla givarens foton som sidan inte redan har (jämförda på innehållet).
   */
  bilder?: number[];
  /**
   * Krävs när givaren är PUBLICERAD: dess adress omdirigeras hit och den
   * avpubliceras. Utan flaggan vägras en publicerad givare.
   */
  omdirigera?: boolean;
}

/** Det ur VEVOR-avläsningen sammanslagningen läser. */
export type VevorAvlasning = Pick<Avlasning, "sku" | "status" | "saldo" | "borta" | "levererasTillSe" | "spec">;

export interface VevorSammanslagningDeps {
  wix: WixAnrop;
  getMapping: (wixProductId: string) => Promise<ProductMappingRecord | null>;
  listMappings: () => Promise<ProductMappingRecord[]>;
  saveMapping: (m: ProductMappingRecord) => Promise<void>;
  /** Avläsningarna för artiklarna (utan prefix), nyckel = artikeln. */
  avlasningar: (artiklar: string[]) => Promise<Map<string, VevorAvlasning>>;
  /** Galleribildernas innehåll: fil-id → Wix `hash` (lib/wix/media.ts, getMediaHashes). */
  hashar: (filIdn: string[]) => Promise<Map<string, string>>;
  recensioner: RecensionsLager;
  /** Behövs bara när givaren är en publicerad sida. */
  omdirigeringar?: Omdirigeringar;
  oppnaOrdrar?: (wixProductId: string) => Promise<number>;
  now?: () => number;
  vanta?: (ms: number) => Promise<void>;
}

export type Tillstand = "ny" | "utoka" | "wix_klar" | "klar";

/** Planen — det som går till svaret, alltså till en publik logg. */
export interface VevorSammanslagningPlan {
  tillstand: Tillstand | null;
  hinder: string[];
  varningar: string[];
  behall: string;
  utkast: string;
  /** Sidans axlar efter sammanslagningen, i den ordning butiken visar dem. */
  axlar: string[];
  nyaAxlar: string[];
  /** Axlar där givaren för in ett värde sidan inte har. */
  nyaVarden: string[];
  nyttVal: Koordinat;
  sidansVal: Koordinat;
  varden: Record<string, string[]>;
  /** Familjeregelns klass per axel efter sammanslagningen. */
  familjeregel: Record<string, Axelklass>;
  /** Axeln vars val bär bilder. */
  bildaxel: string | null;
  varianter: number;
  saknadeKombinationer: number;
  skuBehall: string | null;
  skuUtkast: string;
  prisBehall: number | null;
  prisUtkast: number | null;
  saldoBehall: number | null;
  saldoUtkast: number | null;
  behallPublicerad: boolean;
  bilderBehall: number;
  /** Givarens foton som läggs till i galleriet. */
  bilderUtkast: number;
  /** Givarens foton som sidan redan har (samma innehåll): de läggs inte till. */
  bilderGemensamma: number;
  /** Givarens foton som inte ryms under Wix tak. */
  bilderUtanfor: number;
  givarenPublicerad: boolean;
  /** Givarens recensioner som kopieras till sidan (utan dem som redan finns där). */
  recensionerAttKopiera: number;
  /** Sidans egna recensioner som får `kopt` (bara när sidan får sin första axel). */
  recensionerAttMarka: number;
  omdirigering: string | null;
  omdirigeringarAttPekaOm: number;
}

export interface VevorSammanslagningSvar {
  ok: boolean;
  torrkorning: boolean;
  plan: VevorSammanslagningPlan;
  steg: string[];
  fel?: string;
}

// ── läsning ─────────────────────────────────────────────────────────────────

export interface VevorSammanslagningLast {
  pm: ProductMappingRecord | null;
  dm: ProductMappingRecord | null;
  alla: ProductMappingRecord[];
  wp: Obj | null;
  wd: Obj | null;
  lager: { id: string; variantId?: string; quantity?: number }[];
  lagerUtkast: { id: string; variantId?: string; quantity?: number }[];
  /** Avläsningarna för sidans artiklar och givarens, nyckel = artikeln. */
  avlasningar: Map<string, VevorAvlasning>;
  /** Fil-id → Wix `hash` för sidans och givarens bilder. */
  hashar: Map<string, string>;
  recensionerUtkast: StoredReview[];
  recensionerBehall: StoredReview[];
  /** Bara när givaren ligger ute (och verktygen finns). */
  omdirigeringar: RedirectRow[] | null;
  oppnaOrdrar: number | null;
}

// ☠️ INTE `MERCHANT_DATA` i planens läsning: den kräver en behörighet som kan
// saknas, och då hade redan planen fallit. Varukostnaden tas ur mappningen.
const FALT = "fields=VARIANT_OPTION_CHOICE_NAMES&fields=MEDIA_ITEMS_INFO&fields=PLAIN_DESCRIPTION";

function produktAv(svar: unknown): Obj | null {
  const p = ((svar ?? {}) as Obj).product;
  return p && typeof p === "object" ? (p as Obj) : null;
}

async function lasProdukt(wix: WixAnrop, id: string): Promise<Obj | null> {
  try {
    return produktAv(await wix("GET", `/stores/v3/products/${encodeURIComponent(id)}?${FALT}`));
  } catch (e) {
    if (/Wix 404/.test(String((e as Error)?.message ?? e))) return null;
    throw e;
  }
}

async function lasLager(wix: WixAnrop, id: string): Promise<VevorSammanslagningLast["lager"]> {
  const svar = (await wix("POST", "/stores/v3/inventory-items/query", {
    query: { filter: { productId: id } },
  })) as { inventoryItems?: { id: string; variantId?: string; quantity?: number }[] };
  return (svar.inventoryItems ?? []).map((x) => ({ id: x.id, variantId: x.variantId, quantity: x.quantity }));
}

/** Radens artikel, eller (efter pensioneringen) den enda variantens. */
function utkastetsArtikel(dm: ProductMappingRecord): string {
  return artikelUtanPrefix(dm, VEVOR_ID_PREFIX) || (dm.variants?.[0]?.supplierVariantId ?? "").trim();
}

/** Artiklarna på sidan: radens egen och varianternas. */
function sidansArtiklar(pm: ProductMappingRecord): string[] {
  return artiklarPaRaden(pm, VEVOR_ID_PREFIX);
}

async function lasAllt(input: VevorSammanslagningInput, deps: VevorSammanslagningDeps): Promise<VevorSammanslagningLast> {
  const [pm, dm, alla, wp, wd, lager, lagerUtkast, recensionerUtkast, recensionerBehall] = await Promise.all([
    deps.getMapping(input.behall),
    deps.getMapping(input.utkast),
    deps.listMappings(),
    lasProdukt(deps.wix, input.behall),
    lasProdukt(deps.wix, input.utkast),
    lasLager(deps.wix, input.behall),
    lasLager(deps.wix, input.utkast),
    deps.recensioner.listByProduct(input.utkast, 1000),
    deps.recensioner.listByProduct(input.behall, 1000),
  ]);
  const artiklar = [...new Set([...(pm ? sidansArtiklar(pm) : []), ...(dm ? [utkastetsArtikel(dm)] : [])].filter(Boolean))];
  const filIdn = [...bilderAv(wp), ...bilderAv(wd)].map((b) => b.id);
  const [avlasningar, hashar] = await Promise.all([
    artiklar.length ? deps.avlasningar(artiklar) : Promise.resolve(new Map<string, VevorAvlasning>()),
    filIdn.length ? deps.hashar(filIdn) : Promise.resolve(new Map<string, string>()),
  ]);
  let omdirigeringar: RedirectRow[] | null = null;
  let oppnaOrdrar: number | null = null;
  if (wd?.visible === true && deps.omdirigeringar && deps.oppnaOrdrar) {
    [omdirigeringar, oppnaOrdrar] = await Promise.all([deps.omdirigeringar.lista(), deps.oppnaOrdrar(input.utkast)]);
  }
  return {
    pm, dm, alla, wp, wd, lager, lagerUtkast, avlasningar, hashar,
    recensionerUtkast, recensionerBehall, omdirigeringar, oppnaOrdrar,
  };
}

// ── hjälpare ────────────────────────────────────────────────────────────────

const varianterAv = (p: Obj | null): Obj[] =>
  ((((p?.variantsInfo as Obj | undefined)?.variants) ?? []) as Obj[]);

const optionerAv = (p: Obj | null): Obj[] => ((p?.options ?? []) as Obj[]);

const valAv = (o: Obj): Obj[] => ((((o.choicesSettings as Obj | undefined)?.choices) ?? []) as Obj[]);

function bilderAv(p: Obj | null): { id: string; altText: string }[] {
  const items = ((((p?.media as Obj | undefined)?.itemsInfo as Obj | undefined)?.items) ?? []) as Obj[];
  return items
    .map((m) => ({ id: typeof m.id === "string" ? m.id : "", altText: typeof m.altText === "string" ? m.altText : "" }))
    .filter((m) => m.id);
}

function prisAv(v: Obj | undefined): number | null {
  const n = Number((((v?.price as Obj | undefined)?.actualPrice as Obj | undefined)?.amount));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Variantens val på axeln, ur GET:ens `optionChoiceNames`. */
function vardeAv(v: Obj, axel: string): string | null {
  for (const c of ((v.choices ?? []) as Obj[])) {
    const n = c.optionChoiceNames as Obj | undefined;
    if (n && n.optionName === axel && typeof n.choiceName === "string") return n.choiceName;
  }
  return null;
}

/** Mappningsvariantens val på axeln, eller "". */
function valFor(v: MappningsVariant | undefined, axel: string): string {
  return String((v?.choices ?? {})[axel] ?? "").trim();
}

function lankadeBilder(c: Obj): string[] {
  return ((c.linkedMedia ?? []) as Obj[]).map((m) => (typeof m.id === "string" ? m.id : "")).filter(Boolean);
}

const lika = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function sammaMangd(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x) => b.some((y) => lika(x, y)));
}

/** Listan utan tomma och utan dubbletter (skiftlägesokänsligt), i ordning. */
function unika(lista: string[]): string[] {
  const ut: string[] = [];
  for (const x of lista) if (x && !ut.some((y) => lika(x, y))) ut.push(x);
  return ut;
}

const arFargaxel = (axel: string, varden: string[]) => axelklass(axel, varden) === "farg";

function innehallerOrdet(text: string, ord: string): boolean {
  const t = ` ${text.toLowerCase().replace(/[^a-zåäöé0-9]+/g, " ")} `;
  const o = ord.toLowerCase().replace(/[^a-zåäöé0-9]+/g, " ").trim();
  return !!o && t.includes(` ${o} `);
}

/** Givna värden utan tomma, med axelns namn rensat. */
function rensa(k: Koordinat | undefined): Koordinat {
  const ut: Koordinat = {};
  for (const [a, v] of Object.entries(k ?? {})) {
    const axel = String(a ?? "").trim();
    const varde = String(v ?? "").trim();
    if (axel && varde) ut[axel] = varde;
  }
  return ut;
}

/**
 * Ett giltigt val. En färg är ord; de andra axlarna får bära siffror, mått-
 * tecken och decimalkomma ("120 × 60 cm", "6-pack", "Ø 60 cm"), men inte ha
 * formen av ett artikelnummer.
 */
function giltigtVarde(axel: string, v: string, farg: boolean): boolean {
  if (v.length < 1 || v.length > MAX_VARDE) return false;
  if (farg) return v.length >= 2 && /^[A-Za-zÅÄÖåäöÉé][A-Za-zÅÄÖåäöÉé /-]*$/.test(v) && redigera(v) === v;
  return /^[0-9A-Za-zÅÄÖåäöÉéØø][0-9A-Za-zÅÄÖåäöÉéØø ×x,./–-]*$/.test(v) && redigera(v) === v && !!axel;
}

/** "Storlek 120 cm, Färg Grå" — för steg, audit och loggrader. */
export function beskrivVal(val: Koordinat, axlar?: string[]): string {
  const ordning = axlar ?? Object.keys(val);
  return ordning.filter((a) => val[a]).map((a) => `${a} ${val[a]}`).join(", ");
}

/** Varianten som den står i butiken: "Svart / 120 cm" (samma form som importens `kopt`). */
export function etikett(val: Koordinat, axlar: string[]): string {
  return axlar.map((a) => val[a]).filter(Boolean).join(" / ");
}

const normText = (s: string | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Givarens recensioner som ska kopieras: inte de avvisade (en avvisning är ett
 * beslut), och inte de som redan finns på sidan — samma id eller samma text.
 * VEVOR visar en familjs recensioner på varje artikel i familjen, så samma text
 * ligger ofta på båda syskonen (lib/vevor/recensionsartikel.ts).
 */
export function recensionerAttKopiera(givarens: StoredReview[], sidans: StoredReview[]): StoredReview[] {
  const idn = new Set(sidans.map((r) => r.reviewIdAE));
  const texter = new Set(sidans.map((r) => normText(r.textSwedish || r.textOriginal)).filter(Boolean));
  const sedda = new Set<string>();
  return givarens.filter((r) => {
    const t = normText(r.textSwedish || r.textOriginal);
    if (r.status === "rejected" || idn.has(r.reviewIdAE) || (t && texter.has(t)) || (t && sedda.has(t))) return false;
    if (t) sedda.add(t);
    return true;
  });
}

/** Sidans egna recensioner som får `kopt` när sidan får sin första axel. */
function recensionerAttMarka(sidans: StoredReview[]): StoredReview[] {
  return sidans.filter((r) => r.status !== "rejected" && !String(r.kopt ?? "").trim());
}

/** Den normaliserade etiketten på en specifikationsrad. */
const specNyckel = (s: string) => s.toLowerCase().replace(/[^a-zåäöé0-9]+/g, " ").trim();

/**
 * Specifikationens rader som visar att varorna fungerar olika: samma etikett,
 * olika värden, och en effekt, kapacitet, last eller funktionsenhet som skiljer
 * (`arFunktionsrad`). Etiketten går till en publik logg; den visas bara när den
 * är ett vanligt ord utan artikelnummerform.
 */
export function funktionSomSkiljer(a: [string, string][] | undefined, b: [string, string][] | undefined): string[] {
  const ut: string[] = [];
  const bk = new Map((b ?? []).map(([k, v]) => [specNyckel(k), v] as const));
  for (const [k, v] of a ?? []) {
    const andra = bk.get(specNyckel(k));
    if (andra === undefined || normText(andra) === normText(v)) continue;
    if (!arFunktionsrad(k, [v, andra])) continue;
    const visad = k.trim();
    ut.push(visad.length <= 40 && redigera(visad) === visad && !/\d{3,}/.test(visad) ? visad : "rad");
  }
  return unika(ut);
}

/** Givarens foton fördelade mot sidans, jämförda på innehållet. Ren. */
export interface BildFordelning {
  /** Givarens foton som läggs till i galleriet, i ordning, med alt-text. */
  nya: { id: string; altText: string }[];
  /** Givarens foton med samma innehåll som ett av sidans. */
  gemensamma: string[];
  /** Sidans foton med samma innehåll som ett av givarens. */
  sidansGemensamma: string[];
  /** Givarens foton som inte ryms under Wix tak. */
  utanfor: string[];
  ogiltiga: boolean;
}

export function fordelaBilder(
  bilderP: readonly { id: string; altText: string }[],
  bilderD: readonly { id: string; altText: string }[],
  hashar: ReadonlyMap<string, string>,
  sidNamn: string,
  varde: string,
  valda?: number[],
): BildFordelning {
  const ut: BildFordelning = { nya: [], gemensamma: [], sidansGemensamma: [], utanfor: [], ogiltiga: false };
  let kandidater = [...bilderD];
  if (valda?.length) {
    ut.ogiltiga = valda.some((n) => !Number.isInteger(n) || n < 1 || n > bilderD.length) || new Set(valda).size !== valda.length;
    if (ut.ogiltiga) return ut;
    kandidater = valda.map((n) => bilderD[n - 1]);
  }
  const paSidan = new Set(bilderP.map((b) => b.id));
  const sidansHashar = new Map<string, string[]>();
  for (const b of bilderP) {
    const h = hashar.get(b.id);
    if (h) sidansHashar.set(h, [...(sidansHashar.get(h) ?? []), b.id]);
  }
  const seddaHashar = new Set<string>();
  let rum = WIX_BILDTAK - bilderP.length;
  for (const b of kandidater) {
    const h = hashar.get(b.id);
    if (paSidan.has(b.id)) {
      // En omkörning efter `wix_klar`: bilden ligger redan i galleriet som givarens.
      ut.nya.push({ id: b.id, altText: b.altText });
      if (h) seddaHashar.add(h);
      continue;
    }
    if (h && sidansHashar.has(h)) {
      ut.gemensamma.push(b.id);
      for (const id of sidansHashar.get(h) ?? []) if (!ut.sidansGemensamma.includes(id)) ut.sidansGemensamma.push(id);
      continue;
    }
    if (h && seddaHashar.has(h)) continue;
    if (h) seddaHashar.add(h);
    if (rum <= 0) {
      ut.utanfor.push(b.id);
      continue;
    }
    rum--;
    const n = ut.nya.length + 1;
    const alt = `${sidNamn} – ${varde}${n > 1 ? `, bild ${n}` : ""}`;
    ut.nya.push({ id: b.id, altText: redigera(alt) === alt ? alt : `${varde}${n > 1 ? `, bild ${n}` : ""}` });
  }
  return ut;
}

/** Målet för 301:an från givarens adress, med givarens variant när den finns. */
function omdirigeringsrad(wp: Obj, wd: Obj, variantId?: string | null): RedirectRow {
  const sida = `/produkt/${String(wp.slug ?? "").trim()}`;
  return {
    fromSlug: String(wd.slug ?? "").trim(),
    toPath: variantId ? `${sida}?variant=${encodeURIComponent(variantId)}` : sida,
    reason: "Sammanslagen: sidan är nu ett val på en annan sida",
  };
}

// ── planen ──────────────────────────────────────────────────────────────────

function planeraGivaren(
  input: VevorSammanslagningInput,
  l: VevorSammanslagningLast,
  plan: VevorSammanslagningPlan,
  wp: Obj,
  wd: Obj,
): void {
  plan.givarenPublicerad = true;
  if (input.omdirigera !== true) {
    plan.hinder.push("utkast_publicerat");
    return;
  }
  if (l.omdirigeringar === null || l.oppnaOrdrar === null) {
    plan.hinder.push("givare_publicerad_saknar_verktyg");
    return;
  }
  if (l.oppnaOrdrar > 0) plan.hinder.push("givaren_har_oppna_ordrar");
  if (l.omdirigeringar.length >= MAX_OMDIRIGERINGAR) plan.hinder.push("omdirigeringar_for_manga");
  if (wp.visible !== true) plan.hinder.push("behall_ej_publicerad_givaren_publicerad");
  const rad = omdirigeringsrad(wp, wd);
  if (!rad.fromSlug || !wp.slug || validateRedirect(rad)) plan.hinder.push("omdirigering_ogiltig");
  const finns = l.omdirigeringar.find((r) => r.fromSlug === rad.fromSlug);
  if (finns && malUtanFraga(finns.toPath) !== rad.toPath) plan.hinder.push("omdirigering_krockar");
  plan.omdirigering = `/produkt/${rad.fromSlug} → ${rad.toPath}`;
  plan.omdirigeringarAttPekaOm = l.omdirigeringar
    .filter((r) => malUtanFraga(r.toPath) === `/produkt/${rad.fromSlug}` && r.fromSlug !== rad.fromSlug).length;
  plan.varningar.push(
    "givaren ligger ute: dess adress omdirigeras hit och sidan avpubliceras — "
      + "kontrollera att sidan vi behåller ligger i givarens kategorier",
  );
}

/**
 * Axeln vars val bär bilder: den som redan bär kopplade bilder på sidan, annars
 * en färgaxel, annars den första.
 */
function valjBildaxel(axlar: string[], wp: Obj, varden: Record<string, string[]>): string | null {
  for (const o of optionerAv(wp)) {
    const namn = String(o.name ?? "");
    if (axlar.includes(namn) && valAv(o).some((c) => lankadeBilder(c).length > 0)) return namn;
  }
  return axlar.find((a) => arFargaxel(a, varden[a] ?? [])) ?? axlar[0] ?? null;
}

/**
 * Räknar fram planen ur det som lästs. Ren — inga anrop.
 *
 * Hindren ska stoppa varje läge där sammanslagningen kunde ge fel artikel, fel
 * pris, fel bild, en halv sida, en sida som bryter familjeregeln eller en adress
 * som försvinner utan att någon bett om det.
 */
export function planeraVevorSammanslagning(
  input: VevorSammanslagningInput,
  l: VevorSammanslagningLast,
): VevorSammanslagningPlan {
  const hinder: string[] = [];
  const hindra = (h: string) => {
    if (!hinder.includes(h)) hinder.push(h);
  };
  const varningar: string[] = [];
  const givetUtkast = rensa(input.varden);
  const givetBehall = rensa(input.vardenBehall);

  const pmV = l.pm?.variants ?? [];
  const a1 = l.pm ? artikelUtanPrefix(l.pm, VEVOR_ID_PREFIX) : "";
  const huvud = pmV.find((v) => (v.supplierVariantId ?? "").trim() === a1) ?? pmV[0];
  const wpVar = varianterAv(l.wp);
  const v1 = wpVar.find((v) => !!huvud?.wixVariantId && v.id === huvud.wixVariantId)
    ?? wpVar.find((v) => !!huvud?.sku && v.sku === huvud.sku)
    ?? (wpVar.length === 1 ? wpVar[0] : undefined);
  const skuBehall = typeof v1?.sku === "string" ? v1.sku : (huvud?.sku ?? null);
  const bild = l.pm ? artikelbild(l.pm, VEVOR_ID_PREFIX) : null;
  const sammanslagen = bild?.typ === "flera";

  // ── Axlarna ────────────────────────────────────────────────────────────
  // En sammanslagen sida (eller en familj från importen) bär sina val i
  // mappningen. Ordningen tas ur Wix; nya axlar läggs sist.
  const nycklar: string[] = [];
  if (sammanslagen) {
    for (const v of pmV) for (const [k, x] of Object.entries(v.choices ?? {})) if (String(x ?? "").trim() && !nycklar.includes(k)) nycklar.push(k);
  }
  const wixOrdning = optionerAv(l.wp).map((o) => String(o.name ?? ""));
  const plats = (a: string) => {
    const i = wixOrdning.indexOf(a);
    return i < 0 ? 100 + nycklar.indexOf(a) : i;
  };
  const fore = [...nycklar].sort((a, b) => plats(a) - plats(b));
  const nyaAxlar = Object.keys(givetUtkast).filter((a) => !fore.some((f) => f === a));
  const axlar = [...fore, ...nyaAxlar];

  const sidansVal: Koordinat = {};
  for (const a of nyaAxlar) if (givetBehall[a]) sidansVal[a] = givetBehall[a];

  const koordinaterFore: Koordinat[] = sammanslagen
    ? pmV.map((v) => {
      const k: Koordinat = { ...sidansVal };
      for (const a of fore) {
        const x = valFor(v, a);
        if (x) k[a] = x;
      }
      return k;
    })
    : [{ ...sidansVal }];
  const huvudKoordinat = sammanslagen ? (koordinaterFore[Math.max(0, pmV.indexOf(huvud!))] ?? {}) : { ...sidansVal };

  const nyttVal: Koordinat = {};
  const varden: Record<string, string[]> = {};
  const nyaVarden: string[] = [];
  for (const a of axlar) {
    const fanns = unika(koordinaterFore.map((k) => k[a] ?? ""));
    const givet = givetUtkast[a] ?? "";
    const stavat = fanns.find((x) => lika(x, givet)) ?? givet;
    if (stavat) nyttVal[a] = stavat;
    if (stavat && !fanns.some((x) => lika(x, stavat))) nyaVarden.push(a);
    varden[a] = unika([...fanns, stavat]);
  }
  const familjeregel: Record<string, Axelklass> = {};
  for (const a of axlar) familjeregel[a] = axelklass(a, varden[a] ?? []);
  const varianter = koordinaterFore.length + 1;
  const kombinationer = axlar.length ? axlar.reduce((n, a) => n * (varden[a]?.length ?? 0), 1) : 0;

  // SKU:n får givarens värden där den skiljer sig från sidans huvudvariant —
  // måtten FÖRE färgen, som Aosoms verktyg (artikelnummerspärren fäller färg
  // före ett tresiffrigt mått).
  const delar = [...axlar]
    .sort((a, b) => Number(arFargaxel(a, varden[a] ?? [])) - Number(arFargaxel(b, varden[b] ?? [])))
    .filter((a) => nyttVal[a] && !lika(nyttVal[a], huvudKoordinat[a] ?? ""))
    .map((a) => fargSlug(nyttVal[a]));
  const skuUtkast = (input.sku ?? "").trim() || (skuBehall && delar.length ? `${skuBehall}-${delar.join("-")}` : "");

  const saldoD = l.lagerUtkast.reduce((s, x) => s + (typeof x.quantity === "number" ? x.quantity : 0), 0);
  const plan: VevorSammanslagningPlan = {
    tillstand: null,
    hinder,
    varningar,
    behall: input.behall,
    utkast: input.utkast,
    axlar,
    nyaAxlar,
    nyaVarden,
    nyttVal,
    sidansVal,
    varden,
    familjeregel,
    bildaxel: null,
    varianter,
    saknadeKombinationer: Math.max(0, kombinationer - varianter),
    skuBehall,
    skuUtkast,
    prisBehall: prisAv(v1),
    prisUtkast: prisAv(varianterAv(l.wd)[0]),
    saldoBehall: null,
    saldoUtkast: l.lagerUtkast.length ? saldoD : null,
    behallPublicerad: l.wp?.visible === true,
    bilderBehall: bilderAv(l.wp).length,
    bilderUtkast: 0,
    bilderGemensamma: 0,
    bilderUtanfor: 0,
    givarenPublicerad: false,
    recensionerAttKopiera: 0,
    recensionerAttMarka: 0,
    omdirigering: null,
    omdirigeringarAttPekaOm: 0,
  };

  if (Object.keys(givetUtkast).length === 0) hindra("inget_val");
  if (input.behall === input.utkast) hindra("samma_produkt");
  if (!l.pm) hindra("behall_saknar_mappning");
  if (!l.dm) hindra("utkast_saknar_mappning");
  if (!l.wp) hindra("behall_saknas_i_wix");
  if (!l.wd) hindra("utkast_saknas_i_wix");
  if (hinder.length) return plan;
  const pm = l.pm!;
  const dm = l.dm!;
  const wp = l.wp!;
  const wd = l.wd!;

  if (pm.supplier !== "vevor" || !a1) hindra("behall_ej_vevor");
  if (dm.supplier !== "vevor") hindra("utkast_ej_vevor");
  const a2 = utkastetsArtikel(dm);
  if (!a2) hindra("utkast_saknar_artikel");
  if (a1 && a2 && a1 === a2) hindra("samma_artikel");
  plan.recensionerAttKopiera = recensionerAttKopiera(l.recensionerUtkast, l.recensionerBehall).length;

  // ── Redan klart? Då återstår bara efterarbetet ──────────────────────────
  if (a2 && sidansArtiklar(pm).includes(a2) && a1 !== a2) {
    plan.tillstand = "klar";
    if (wd.visible === true) planeraGivaren(input, l, plan, wp, wd);
    return plan;
  }
  if (bild?.typ === "tvetydig") {
    hindra("behall_tvetydig");
    return plan;
  }
  if (artikelbild(dm, VEVOR_ID_PREFIX).typ !== "en" || (dm.vevorArtiklar ?? []).length > 1) hindra("givaren_redan_sammanslagen");
  if ((dm.variants ?? []).length !== 1) hindra("utkast_flera_varianter");

  // ── Axlarna, värdena och familjeregeln ─────────────────────────────────
  for (const a of nyaAxlar) {
    if (!(NYA_AXLAR as readonly string[]).includes(a)) hindra(`axel_ogiltig:${a}`);
  }
  if (sammanslagen && (fore.length === 0 || pmV.some((v) => fore.some((a) => !valFor(v, a))))) {
    hindra("behall_mappning_saknar_val");
  }
  for (const a of fore) if (!givetUtkast[a]) hindra(`saknar_varde_utkast:${a}`);
  for (const a of Object.keys(givetBehall)) {
    if (!givetUtkast[a] && !fore.includes(a)) hindra(`saknar_varde_utkast:${a}`);
  }
  for (const a of axlar) {
    const u = givetUtkast[a];
    const farg = arFargaxel(a, varden[a] ?? []);
    if (u && !giltigtVarde(a, u, farg)) hindra(`varde_ogiltigt:${a}`);
  }
  for (const a of nyaAxlar) {
    const b = givetBehall[a];
    const farg = arFargaxel(a, varden[a] ?? []);
    if (!b) hindra(`saknar_varde_behall:${a}`);
    else if (!giltigtVarde(a, b, farg)) hindra(`varde_ogiltigt:${a}`);
    else if (lika(b, givetUtkast[a] ?? "")) hindra(`varde_lika:${a}`);
  }
  for (const a of fore) {
    if (givetBehall[a]) varningar.push(`sidans ${a.toLowerCase()} står redan i Wix — värdet för sidan används inte`);
  }
  for (const a of axlar) {
    const k = familjeregel[a];
    if (k === "funktion") hindra(`familjeregeln_funktion:${a}`);
    else if (!TILLATNA.has(k)) hindra(`familjeregeln_oklar:${a}`);
  }
  if (nyaAxlar.length === 0 && koordinaterFore.some((k) => axlar.every((a) => lika(k[a] ?? "", nyttVal[a] ?? "")))) {
    hindra("kombinationen_finns");
  }

  // ── Avläsningarna: givaren ska gå att sälja, och fungera som sidan ───────
  const avlD = a2 ? l.avlasningar.get(a2) : undefined;
  if (!avlD) hindra("utkast_saknar_avlasning");
  else {
    if (avlD.borta || avlD.status === "borta") hindra("utkast_borta_hos_vevor");
    else if (avlD.status === "ej_levererbar" || avlD.levererasTillSe === false) hindra("utkast_levereras_inte_till_sverige");
    else if (avlD.status === "slut") varningar.push("givaren är slutsåld hos VEVOR just nu — varianten syns som slut tills synken ser lager");
  }
  for (const a of sidansArtiklar(pm)) {
    const avlP = l.avlasningar.get(a);
    if (!avlP) {
      hindra("behall_saknar_avlasning");
      continue;
    }
    if (avlD) for (const rad of funktionSomSkiljer(avlP.spec, avlD.spec)) hindra(`funktion_skiljer:${rad}`);
  }

  // ── SKU ──────────────────────────────────────────────────────────────────
  if (!/^FP-[a-z0-9-]{3,90}$/.test(skuUtkast) || redigera(skuUtkast) !== skuUtkast) hindra("sku_ogiltig");
  if (skuUtkast.length > SKU_MAX) hindra("sku_for_lang");
  const sidansSkuer = new Set([...pmV.map((v) => v.sku), ...wpVar.map((v) => String(v.sku ?? ""))]);
  const skuPaSidan = sidansSkuer.has(skuUtkast);
  if (l.alla.some((m) => m.wixProductId !== pm.wixProductId && (m.variants ?? []).some((v) => v.sku === skuUtkast))) {
    hindra("sku_upptagen");
  }

  // ── Artikeln får inte redan sitta på en annan sida ───────────────────────
  if (a2) {
    const prefixad = `${VEVOR_ID_PREFIX}${a2}`;
    const upptagen = l.alla.some(
      (m) => m.wixProductId !== pm.wixProductId && m.wixProductId !== dm.wixProductId
        && (artiklarPaRaden(m, VEVOR_ID_PREFIX).includes(a2) || (m.vevorArtiklar ?? []).includes(prefixad)),
    );
    if (upptagen) hindra("artikeln_upptagen");
  }

  // ── Wix: sidan, givaren och deras läge ───────────────────────────────────
  if (wd.visible === true) planeraGivaren(input, l, plan, wp, wd);
  const namn = typeof wp.name === "string" ? wp.name : "";
  const text = typeof wp.plainDescription === "string" ? wp.plainDescription : "";
  for (const a of axlar) {
    const sidans = unika(koordinaterFore.map((k) => k[a] ?? ""));
    if (sidans.some((g) => innehallerOrdet(namn, g))) {
      // En publicerad sida bär sitt namn ut till kunden; ett utkast får nytt namn i poleringen.
      if (wp.visible === true) hindra(`namnet_bar_varde:${a}`);
      else varningar.push(`namnet nämner sidans ${a.toLowerCase()} — poleringen skriver ett namn för alla varianter`);
    }
    if (sidans.some((g) => innehallerOrdet(text, g))) {
      varningar.push(`beskrivningen nämner sidans ${a.toLowerCase()} — skriv om texten efter sammanslagningen`);
    }
  }
  if (axlar.length > 1 && kombinationer > varianter) {
    varningar.push(`${kombinationer - varianter} av ${kombinationer} kombinationer finns inte som vara — butiken visar dem som ej valbara`);
  }
  if (dm.prisLast) varningar.push("givarens pris är låst — låset följer inte med, synken räknar om den nya variantens pris");
  if (plan.prisUtkast === null) hindra("utkast_saknar_pris");
  if (varianterAv(wd).length !== 1) hindra("utkast_flera_varianter_i_wix");
  if (l.lagerUtkast.length === 0) hindra("utkast_saknar_lagerrad");

  // ── Bilderna, jämförda på innehållet ─────────────────────────────────────
  const bilderP = bilderAv(wp);
  const bilderD = bilderAv(wd);
  const bildaxel = valjBildaxel(axlar, wp, varden);
  plan.bildaxel = bildaxel;
  if (bilderP.length === 0) hindra("behall_saknar_bilder");
  if (bildaxel) {
    const f = fordelaBilder(bilderP, bilderD, l.hashar, namn, nyttVal[bildaxel] ?? "", input.bilder);
    if (f.ogiltiga) hindra("bilder_ogiltiga");
    plan.bilderUtkast = f.nya.length;
    plan.bilderGemensamma = f.gemensamma.length;
    plan.bilderUtanfor = f.utanfor.length;
    if (f.utanfor.length > 0) varningar.push(`${f.utanfor.length} av givarens foton ryms inte under Wix tak på ${WIX_BILDTAK}`);
    const farg = arFargaxel(bildaxel, varden[bildaxel] ?? []);
    // ☠️ En färg utan egen bild visar en annan färgs foto, i butiken och i
    // Google-flödet. En storlek eller förpackning får visa sidans foton.
    if (farg && nyaVarden.includes(bildaxel) && !f.ogiltiga && f.nya.length === 0) hindra("utkast_saknar_egna_bilder");
    if (farg && nyaAxlar.includes(bildaxel) && bilderP.every((b) => f.sidansGemensamma.includes(b.id))) {
      hindra("behall_saknar_egna_bilder");
    }
  }

  // ── Tillståndet i Wix ────────────────────────────────────────────────────
  const optioner = optionerAv(wp);
  const lagerFor = (id: unknown) => l.lager.find((x) => x.variantId === id);

  if (optioner.length === 0) {
    if (bild?.typ !== "en" || wpVar.length !== 1 || pmV.length !== 1) {
      hindra(pmV.length !== 1 ? "behall_flera_varianter" : "behall_mappning_matchar_inte_wix");
      return plan;
    }
    if (huvud?.wixVariantId && wpVar[0].id !== huvud.wixVariantId) hindra("behall_variant_matchar_inte");
    if (skuPaSidan) hindra("sku_lika");
    plan.tillstand = "ny";
    plan.recensionerAttMarka = recensionerAttMarka(l.recensionerBehall).length;
    const post = lagerFor(wpVar[0].id);
    if (!post || typeof post.quantity !== "number") hindra("behall_saknar_lagerrad");
    else plan.saldoBehall = post.quantity;
    return plan;
  }

  if (arRedanSkrivenIWix(wp, plan, pmV)) {
    plan.tillstand = "wix_klar";
    return plan;
  }
  if (skuPaSidan) hindra("sku_lika");
  if (bild?.typ === "en") {
    hindra("behall_har_redan_optioner");
    return plan;
  }
  const kanns = pmV.every((mv) => wpVar.some((v) => (!!mv.wixVariantId && v.id === mv.wixVariantId) || v.sku === mv.sku));
  const valStammer = fore.every((a) => {
    const o = optioner.find((x) => x.name === a);
    return !!o && sammaMangd(valAv(o).map((c) => String(c.name ?? "")), unika(pmV.map((v) => valFor(v, a))));
  });
  if (!sammaMangd(optioner.map((o) => String(o.name ?? "")), fore) || !valStammer || wpVar.length !== pmV.length || !kanns) {
    hindra("behall_mappning_matchar_inte_wix");
    return plan;
  }
  let summa = 0;
  for (const v of wpVar) {
    const post = lagerFor(v.id);
    if (!post || typeof post.quantity !== "number") {
      hindra("behall_saknar_lagerrad");
      return plan;
    }
    summa += post.quantity;
  }
  plan.saldoBehall = summa;
  plan.tillstand = "utoka";
  return plan;
}

/**
 * Wix bär redan sammanslagningen (en tidigare körning föll efter
 * Wix-skrivningen): exakt de planerade axlarna och valen, rätt antal varianter,
 * varje variant mappningen känner till kvar, och den nya på givarens plats.
 */
function arRedanSkrivenIWix(wp: Obj, plan: VevorSammanslagningPlan, pmV: ProductMappingRecord["variants"]): boolean {
  const optioner = optionerAv(wp);
  const varianter = varianterAv(wp);
  if (plan.axlar.length === 0 || !sammaMangd(optioner.map((o) => String(o.name ?? "")), plan.axlar)) return false;
  for (const a of plan.axlar) {
    const o = optioner.find((x) => x.name === a);
    if (!o || !sammaMangd(valAv(o).map((c) => String(c.name ?? "")), plan.varden[a] ?? [])) return false;
  }
  if (varianter.length !== plan.varianter) return false;
  const ny = varianter.find((v) => v.sku === plan.skuUtkast);
  if (!ny || !plan.axlar.every((a) => lika(vardeAv(ny, a) ?? "", plan.nyttVal[a] ?? ""))) return false;
  return pmV.every((mv) => varianter.some((v) => (!!mv.wixVariantId && v.id === mv.wixVariantId) || v.sku === mv.sku));
}

// ── skrivningen ─────────────────────────────────────────────────────────────

function valBody(varde: string): Obj {
  return { choiceType: "CHOICE_TEXT", name: varde };
}

function nyOption(axel: string, varden: string[]): Obj {
  return { name: axel, optionRenderType: RENDER, choicesSettings: { choices: varden.map(valBody) } };
}

function valReferenser(axlar: string[], val: Koordinat): Obj[] {
  return axlar.map((a) => ({ optionChoiceNames: { optionName: a, choiceName: val[a] ?? "", renderType: RENDER } }));
}

/** Variantobjektet ur GET:en, med bara det ändrat vi menar. Aldrig byggt från grunden. */
function utanLasfalt(v: Obj): Obj {
  const ut: Obj = { ...v };
  delete ut.inventoryStatus;
  delete ut.media;
  delete ut.revenueDetails;
  return ut;
}

/** Varukostnaden ur mappningen, som importen och synken skriver den. */
function kostnad(v: { landedCostSek?: number } | undefined): Obj {
  const k = v?.landedCostSek;
  return typeof k === "number" && Number.isFinite(k) && k > 0 ? { revenueDetails: { cost: { amount: k.toFixed(2) } } } : {};
}

/** Axel → val → bildernas id, huvudbilden först. Slås upp skiftlägesokänsligt. */
type BildKarta = Record<string, Record<string, string[]>>;

const nyckelFor = (m: Record<string, unknown>, namn: string) => Object.keys(m).find((k) => lika(k, namn));

function bildFor(karta: BildKarta, axel: string, varde: string): string[] | undefined {
  const a = nyckelFor(karta, axel);
  const v = a === undefined ? undefined : nyckelFor(karta[a], varde);
  return a === undefined || v === undefined ? undefined : karta[a][v];
}

function satt(karta: BildKarta, axel: string, varde: string, idn: string[]): void {
  const m = (karta[nyckelFor(karta, axel) ?? axel] ??= {});
  m[nyckelFor(m, varde) ?? varde] = [...idn];
}

const antalIBildkarta = (karta: BildKarta) => Object.values(karta).reduce((n, m) => n + Object.keys(m).length, 0);

interface Fore {
  id: string;
  sku: string;
  pris: number | null;
  synlig: boolean;
  val: Koordinat;
}

interface Kontroll {
  ok: boolean;
  skal: string[];
  idFor: Record<string, string>;
  nyId?: string;
  lankade: number;
}

/** Stämmer Wix med det sammanslagningen skulle skriva? Läser inget själv. */
function kontrollera(
  p: Obj | null,
  plan: VevorSammanslagningPlan,
  synligFore: boolean,
  fore: Fore[],
  forvantadeBilder: string[],
  bildPerVal: BildKarta,
): Kontroll {
  const skal: string[] = [];
  if (!p) return { ok: false, skal: ["produkten gick inte att läsa"], idFor: {}, lankade: 0 };
  if ((p.visible === true) !== synligFore) skal.push("sidans synlighet har ändrats");
  const optioner = optionerAv(p);
  if (!sammaMangd(optioner.map((o) => String(o.name ?? "")), plan.axlar)) skal.push("sidan har inte exakt de väntade axlarna");
  let lankade = 0;
  for (const a of plan.axlar) {
    const val = valAv(optioner.find((o) => o.name === a) ?? {});
    if (!sammaMangd(val.map((c) => String(c.name ?? "")), plan.varden[a] ?? [])) skal.push(`optionen ${a} har inte exakt de väntade valen`);
    lankade += val.filter((c) => {
      const onskat = bildFor(bildPerVal, a, String(c.name ?? ""));
      return !!onskat?.length && lankadeBilder(c).join("|") === onskat.join("|");
    }).length;
  }
  const varianter = varianterAv(p);
  if (varianter.length !== plan.varianter) skal.push("fel antal varianter");
  const idFor: Record<string, string> = {};
  for (const f of fore) {
    const v = varianter.find((x) => x.id === f.id) ?? varianter.find((x) => x.sku === f.sku);
    if (!v || typeof v.id !== "string") {
      skal.push("en befintlig variant saknas efter skrivningen");
      continue;
    }
    idFor[f.id] = v.id;
    if (f.pris !== null && prisAv(v) !== f.pris) skal.push("ett befintligt pris har ändrats");
    if (f.synlig && v.visible !== true) skal.push("en befintlig variant är inte längre synlig");
    if (plan.axlar.some((a) => !lika(vardeAv(v, a) ?? "", f.val[a] ?? ""))) skal.push("en befintlig variant bär fel val");
  }
  const ny = varianter.find((v) => v.sku === plan.skuUtkast);
  if (!ny) skal.push("den nya varianten saknas (SKU)");
  else {
    if (ny.visible !== true) skal.push("den nya varianten är inte synlig");
    if (plan.prisUtkast !== null && prisAv(ny) !== plan.prisUtkast) skal.push("den nya variantens pris stämmer inte");
    if (plan.axlar.some((a) => !lika(vardeAv(ny, a) ?? "", plan.nyttVal[a] ?? ""))) skal.push("den nya varianten bär fel val");
  }
  const idn = new Set(bilderAv(p).map((b) => b.id));
  if (forvantadeBilder.some((id) => !idn.has(id))) skal.push("bildlistan saknar bilder");
  return { ok: skal.length === 0, skal, idFor, nyId: typeof ny?.id === "string" ? ny.id : undefined, lankade };
}

/**
 * Kopplar valens bilder: options med `linkedMedia` + variantsInfo ordagrant, och
 * `visible` med — en variantsInfo-PATCH publicerar annars ett utkast. Läsningen
 * ber om varukostnaden, så att PATCH:en inte nollar den. Returnerar om
 * kostnaden gick att läsa.
 */
async function kopplaValbilder(wix: WixAnrop, id: string, bildPerVal: BildKarta): Promise<boolean> {
  const lasning = await lasMedKostnad(wix, `/stores/v3/products/${encodeURIComponent(id)}?${FALT}`);
  const p = produktAv(lasning.svar);
  if (!p) throw new Error("produkten gick inte att läsa inför bildkopplingen");
  const optioner = optionerAv(p).map((o) => ({
    ...o,
    choicesSettings: {
      ...((o.choicesSettings as Obj | undefined) ?? {}),
      choices: valAv(o).map((c) => {
        const idn = bildFor(bildPerVal, String(o.name ?? ""), String(c.name ?? ""));
        return idn?.length ? { ...c, linkedMedia: idn.map((x) => ({ id: x })) } : c;
      }),
    },
  }));
  await wix("PATCH", `/stores/v3/products/${encodeURIComponent(id)}`, {
    product: { revision: p.revision, visible: p.visible, options: optioner, variantsInfo: variantsInfoMedKostnad(p.variantsInfo) },
    fieldMask: { paths: ["options", "variantsInfo", "visible"] },
  });
  return lasning.kostnadLasbar;
}

/**
 * Kör sammanslagningen: läser, planerar och — bara med `apply`, utan hinder och
 * utanför synkfönstren — skriver. Torrkörning är default.
 */
export async function korVevorSammanslagning(
  input: VevorSammanslagningInput,
  deps: VevorSammanslagningDeps,
  opts: { apply?: boolean } = {},
): Promise<VevorSammanslagningSvar> {
  const apply = opts.apply === true;
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = deps.now ?? Date.now;
  const steg: string[] = [];

  const l = await lasAllt(input, deps);
  const plan = planeraVevorSammanslagning(input, l);
  const svar = (ok: boolean, fel?: string): VevorSammanslagningSvar => ({
    ok,
    torrkorning: !apply,
    plan,
    steg,
    ...(fel ? { fel } : {}),
  });

  if (plan.hinder.length > 0) return svar(false, `hinder: ${plan.hinder.join(", ")}`);
  if (apply) {
    const nu = new Date(now());
    if (iVevorSynkfonster(nu) || iSynkfonster(nu)) {
      return svar(false, "skrivningen vägras i ett synkfönster (VEVOR minut 45–57, Aosom :12–:29 var tredje timme) — ingenting skrevs, kör igen efteråt");
    }
  }
  if (plan.tillstand === "klar") {
    const kvar = aterstar(l);
    if (kvar.length === 0) {
      steg.push("redan sammanslagen — ingenting att göra");
      return svar(true);
    }
    if (!apply) {
      steg.push(`sidan är sammanslagen, men kvar är: ${kvar.join(", ")} — kör \`byt\``);
      return svar(true);
    }
    return efterarbete(l, plan, input, deps, steg, svar);
  }
  if (!apply) return svar(true);

  const pm = l.pm!;
  const dm = l.dm!;
  const wp = l.wp!;
  const wd = l.wd!;
  const pNamn = String(wp.name ?? "");
  const bilderP = bilderAv(wp);
  const bilderD = bilderAv(wd);
  const bAx = plan.bildaxel;
  const fordelning = bAx
    ? fordelaBilder(bilderP, bilderD, l.hashar, pNamn, plan.nyttVal[bAx] ?? "", input.bilder)
    : { nya: [], gemensamma: [], sidansGemensamma: [], utanfor: [], ogiltiga: false };
  const valda = fordelning.nya;
  const forvantadeBilder = [...bilderP.map((b) => b.id), ...valda.map((b) => b.id)];

  // Bilderna valen ska bära efteråt. Ett val som redan har kopplade bilder
  // behåller hela listan och står med i kartan, så en skrivning som tappat dem
  // kopplas om i återläsningen.
  const bildPerVal: BildKarta = {};
  for (const o of optionerAv(wp)) {
    for (const c of valAv(o)) {
      const b = lankadeBilder(c);
      if (b.length) satt(bildPerVal, String(o.name ?? ""), String(c.name ?? ""), b);
    }
  }
  if (bAx) {
    // Sidans eget värde på en NY bildaxel får sidans egna foton — de som
    // givaren inte också har. Har sidan bara gemensamma foton kopplas inget
    // (en storlek eller förpackning visar då samma foton för alla).
    //
    // ☠️ OCH INTE GIVARENS. I en omkörning (`wix_klar`) ligger givarens foton
    // redan i sidans galleri. Dog förra körningen innan valen fått sina bilder
    // hade sidans värde annars kopplats till givarens foton också.
    const sidansBildval = plan.sidansVal[bAx];
    const annanAxelHarBilder = Object.entries(bildPerVal).some(([a, m]) => !lika(a, bAx) && Object.keys(m).length > 0);
    if (plan.nyaAxlar.includes(bAx) && sidansBildval && !annanAxelHarBilder && !bildFor(bildPerVal, bAx, sidansBildval)) {
      const givarens = new Set(valda.map((b) => b.id));
      const egna = bilderP.map((b) => b.id).filter((id) => !fordelning.sidansGemensamma.includes(id) && !givarens.has(id));
      if (egna.length) satt(bildPerVal, bAx, sidansBildval, egna);
    }
    const givarensBildval = plan.nyttVal[bAx];
    if (givarensBildval && valda.length && !bildFor(bildPerVal, bAx, givarensBildval)) {
      satt(bildPerVal, bAx, givarensBildval, valda.map((b) => b.id));
    }
  }

  const variantFore = varianterAv(wp);
  const mappningFor = (v: Obj) =>
    (pm.variants ?? []).find((m) => (!!m.wixVariantId && m.wixVariantId === v.id) || m.sku === v.sku);
  const koordinatFor = (v: Obj): Koordinat => {
    const mv = mappningFor(v);
    const k: Koordinat = {};
    for (const a of plan.axlar) {
      const x = vardeAv(v, a) ?? (valFor(mv, a) || plan.sidansVal[a]);
      if (x) k[a] = x;
    }
    return k;
  };
  const fore: Fore[] = (plan.tillstand === "wix_klar" ? variantFore.filter((v) => v.sku !== plan.skuUtkast) : variantFore)
    .map((v) => ({
      id: String(v.id ?? ""),
      sku: String(v.sku ?? ""),
      pris: prisAv(v),
      synlig: v.visible === true || plan.tillstand === "ny",
      val: koordinatFor(v),
    }));
  const synligFore = wp.visible === true;

  // ── 1 + 2: Wix, bara från "ny" och "utoka" ─────────────────────────────
  if (plan.tillstand === "ny" || plan.tillstand === "utoka") {
    const saldoUtkast = plan.saldoUtkast ?? 0;
    const nyLista = [...bilderP, ...valda.filter((b) => !bilderP.some((x) => x.id === b.id))];
    const bytBilder = nyLista.length !== bilderP.length;
    let revision = wp.revision;
    if (bytBilder) {
      const efterBilder = produktAv(await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(input.behall)}`, {
        product: { revision: wp.revision, media: { itemsInfo: { items: nyLista } } },
        fieldMask: { paths: ["media"] },
      }));
      revision = efterBilder?.revision ?? revision;
      steg.push(`bilder: ${bilderP.length} → ${nyLista.length} (${fordelning.gemensamma.length} av givarens foton fanns redan)`);
    }

    const nyVariant: Obj = {
      visible: true,
      sku: plan.skuUtkast,
      price: { actualPrice: { amount: String(plan.prisUtkast) } },
      ...kostnad(dm.variants?.[0]),
      choices: valReferenser(plan.axlar, plan.nyttVal),
      physicalProperties: {},
      inventoryItem: { quantity: saldoUtkast },
    };

    let options: Obj[];
    let variants: Obj[];
    if (plan.tillstand === "ny") {
      const v = variantFore[0];
      const post = l.lager.find((x) => x.variantId === v.id)!;
      options = plan.axlar.map((a) => nyOption(a, [plan.sidansVal[a]!, plan.nyttVal[a]!]));
      variants = [
        {
          ...utanLasfalt(v),
          visible: true,
          choices: valReferenser(plan.axlar, fore[0].val),
          physicalProperties: (v.physicalProperties as Obj | undefined) ?? {},
          ...kostnad(pm.variants?.[0]),
          inventoryItem: { quantity: post.quantity },
        },
        nyVariant,
      ];
    } else {
      // ☠️ Optionerna och varianterna tas ur GET:en, inte byggda från grunden:
      // ett handbyggt objekt tappar valens kopplade bilder och varianternas id.
      options = [
        ...optionerAv(wp).map((o) => {
          const a = String(o.name ?? "");
          if (!plan.nyaVarden.includes(a) || plan.nyaAxlar.includes(a)) return o;
          return {
            ...o,
            choicesSettings: {
              ...((o.choicesSettings as Obj | undefined) ?? {}),
              choices: [...valAv(o), valBody(plan.nyttVal[a]!)],
            },
          };
        }),
        ...plan.nyaAxlar.map((a) => nyOption(a, [plan.sidansVal[a]!, plan.nyttVal[a]!])),
      ];
      variants = [
        ...variantFore.map((v, i) => {
          const post = l.lager.find((x) => x.variantId === v.id)!;
          return {
            ...utanLasfalt(v),
            choices: valReferenser(plan.axlar, fore[i].val),
            physicalProperties: (v.physicalProperties as Obj | undefined) ?? {},
            ...kostnad(mappningFor(v)),
            inventoryItem: { quantity: post.quantity },
          };
        }),
        nyVariant,
      ];
    }

    try {
      await deps.wix("PATCH", `/stores/v3/products-with-inventory/${encodeURIComponent(input.behall)}`, {
        product: { id: input.behall, revision, visible: wp.visible, options, variantsInfo: { variants } },
      });
      steg.push(`varianter: ${beskrivVal(plan.nyttVal, plan.axlar)} tillagd med saldo ${saldoUtkast} (${plan.varianter} varianter)`);
    } catch (e) {
      if (!bytBilder) return svar(false, `variantskrivningen föll: ${felText(e)} — ingenting skrevs`);
      // ☠️ Bilderna rullas tillbaka: utan varianten visar sidan givarens foton.
      let aterstallt = false;
      try {
        const nu = await lasProdukt(deps.wix, input.behall);
        await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(input.behall)}`, {
          product: { revision: nu?.revision, media: { itemsInfo: { items: bilderP } } },
          fieldMask: { paths: ["media"] },
        });
        aterstallt = true;
      } catch {
        aterstallt = false;
      }
      return svar(false, `variantskrivningen föll: ${felText(e)} — bildlistan ${aterstallt ? "återställd" : "KUNDE INTE återställas, kontrollera sidan"}`);
    }
  }

  // ── 3: återläsning, med väntan på de kopplade bilderna ─────────────────
  const krav = antalIBildkarta(bildPerVal);
  let k = kontrollera(await lasProdukt(deps.wix, input.behall), plan, synligFore, fore, forvantadeBilder, bildPerVal);
  for (let forsok = 0; k.ok && k.lankade < krav && forsok < KOPPLING_FORSOK; forsok++) {
    try {
      if (!(await kopplaValbilder(deps.wix, input.behall, bildPerVal)) && !steg.includes(KOSTNAD_EJ_LASBAR)) steg.push(KOSTNAD_EJ_LASBAR);
    } catch {
      // Ett 404/409 medan bilden fortfarande tas emot — försök igen.
    }
    await vanta(KOPPLING_PAUS_MS);
    k = kontrollera(await lasProdukt(deps.wix, input.behall), plan, synligFore, fore, forvantadeBilder, bildPerVal);
  }
  if (!k.ok || !k.nyId) {
    return svar(false, `Wix stämmer inte efter skrivningen (${k.skal.join("; ")}) — mappningen skrevs INTE. Synken nollar den nya variantens lager tills den är mappad. Kör om.`);
  }
  if (k.lankade < krav) {
    return svar(false, `${krav - k.lankade} val saknar kopplad bild efter ${KOPPLING_FORSOK} försök — mappningen skrevs INTE. Kör om, så kopplas bilderna igen.`);
  }
  // ── 3a: variantens bild (lib/wix/variant-media.ts) ─────────────────────
  const vb = variantbildSteg(await refreshVariantMedia(deps.wix, input.behall, { vanta }));
  steg.push(vb.rad);
  if (vb.stopp) return svar(false, `${vb.rad} — mappningen skrevs INTE. Kontrollera sidan innan du kör om.`);

  const lager = await lasLager(deps.wix, input.behall);
  const antal = (id: string | undefined) => lager.find((x) => x.variantId === id)?.quantity;
  const qNy = antal(k.nyId);
  steg.push(`återläst: ${plan.varianter} varianter, ${k.lankade} av ${krav} val med bild, nytt saldo ${qNy ?? "?"}`);

  // ── 4: mappningen på sidan vi behåller — direkt efter Wix ──────────────
  const a1 = artikelUtanPrefix(pm, VEVOR_ID_PREFIX);
  const a2 = utkastetsArtikel(dm);
  const bild = artikelbild(pm, VEVOR_ID_PREFIX);
  const nuId = (v: MappningsVariant) => {
    const f = fore.find((x) => (!!v.wixVariantId && x.id === v.wixVariantId) || x.sku === v.sku);
    return f ? k.idFor[f.id] : undefined;
  };
  const nyaAxlarsVal: Record<string, string> = {};
  for (const a of plan.nyaAxlar) nyaAxlarsVal[a] = plan.sidansVal[a]!;
  const befintliga: MappningsVariant[] = bild.typ === "en"
    ? [{
      ...pm.variants[0],
      // En rad med en artikel: varianten bär radens artikel, så att raden läses som "flera".
      supplierVariantId: a1,
      wixVariantId: nuId(pm.variants[0]) ?? pm.variants[0].wixVariantId,
      choices: { ...nyaAxlarsVal },
      aosomSyncedQty: antal(nuId(pm.variants[0])),
    }]
    : pm.variants.map((v) => {
      const id = nuId(v) ?? v.wixVariantId;
      return { ...v, wixVariantId: id, choices: { ...(v.choices ?? {}), ...nyaAxlarsVal }, aosomSyncedQty: antal(id) };
    });
  const dv = dm.variants[0];
  const nyttValSomRad: Record<string, string> = {};
  for (const a of plan.axlar) nyttValSomRad[a] = plan.nyttVal[a]!;
  const nyMappning: MappningsVariant = {
    supplierVariantId: a2,
    sku: plan.skuUtkast,
    wixVariantId: k.nyId,
    choices: nyttValSomRad,
    costUsd: dv.costUsd,
    landedCostSek: dv.landedCostSek,
    grossSek: plan.prisUtkast ?? dv.grossSek,
    aosomSyncedQty: qNy,
  };
  const saldon = [...befintliga.map((v) => v.aosomSyncedQty), qNy];
  const artiklar = [
    ...new Set([
      ...(pm.vevorArtiklar ?? []),
      pm.supplierProductId,
      ...befintliga.map((v) => `${VEVOR_ID_PREFIX}${String(v.supplierVariantId ?? "").trim()}`),
      `${VEVOR_ID_PREFIX}${a2}`,
    ].filter((a) => !!a && a !== VEVOR_ID_PREFIX)),
  ];
  const ny: ProductMappingRecord = {
    ...pm,
    ...(saldon.every((q) => typeof q === "number")
      ? { aosomSyncedQty: saldon.reduce((s: number, q) => s + (q as number), 0), aosomSyncedAt: new Date(now()).toISOString() }
      : {}),
    variants: [...befintliga, nyMappning],
    vevorArtiklar: artiklar,
  };
  await deps.saveMapping(ny);
  const efter = await deps.getMapping(input.behall);
  const bildEfter = efter ? artikelbild(efter, VEVOR_ID_PREFIX) : null;
  if (
    !bildEfter || bildEfter.typ !== "flera" || bildEfter.varianter.length !== plan.varianter
    || !bildEfter.varianter.some((v) => v.artikel === a2)
    || !(efter?.vevorArtiklar ?? []).includes(`${VEVOR_ID_PREFIX}${a2}`)
    || (efter?.variants ?? []).some((v) => plan.axlar.some((a) => !valFor(v, a)))
  ) {
    return svar(false, "mappningen läste inte tillbaka som en sida med en artikel per variant — ingenting är verifierat, kör om");
  }
  steg.push(`mappning: ${plan.varianter} varianter, en artikel per variant (återläst)`);

  return efterarbete(l, plan, input, deps, steg, svar);
}

/** Det som återstår efter att sidan är klar, i läsbar form. */
function aterstar(l: VevorSammanslagningLast): string[] {
  const kvar: string[] = [];
  if (recensionerAttKopiera(l.recensionerUtkast, l.recensionerBehall).length > 0) kvar.push("givarens recensioner");
  if (l.wd?.visible === true) kvar.push("omdirigering och avpublicering av givaren");
  const dm = l.dm;
  if (dm && (dm.draftStatus !== "rejected" || artikelUtanPrefix(dm, VEVOR_ID_PREFIX))) kvar.push("pensionering av givaren");
  return kvar;
}

/**
 * Steg 5 och 6. Givarens recensioner kopieras till sidan med `kopt`, och — när
 * sidan just fick sin första axel — sidans egna rader får sin variant. En
 * publicerad givare får sin adress omdirigerad och sin sida avpublicerad, i den
 * ordningen. Sist pensioneras givaren.
 *
 * ☠️ GIVARENS RECENSIONSRADER RÖRS INTE. De kopieras; originalen ligger kvar på
 * givaren, där ingen ser dem.
 */
async function efterarbete(
  l: VevorSammanslagningLast,
  plan: VevorSammanslagningPlan,
  input: VevorSammanslagningInput,
  deps: VevorSammanslagningDeps,
  steg: string[],
  svar: (ok: boolean, fel?: string) => VevorSammanslagningSvar,
): Promise<VevorSammanslagningSvar> {
  const dm = l.dm!;

  // 5a. Recensionerna. Givarens värde läses ur mappningen, som just verifierats
  // (eller, i `klar`, redan bär det).
  const pmNu = await deps.getMapping(input.behall);
  const a2 = utkastetsArtikel(dm);
  const axlar = plan.axlar.length ? plan.axlar : Object.keys(pmNu?.variants?.[0]?.choices ?? {});
  const givarensVariant = (pmNu?.variants ?? []).find((v) => (v.supplierVariantId ?? "").trim() === a2);
  const givarensEtikett = givarensVariant ? etikett(givarensVariant.choices ?? {}, axlar) : etikett(plan.nyttVal, plan.axlar);
  const sidansNu = await deps.recensioner.listByProduct(input.behall, 1000);
  const kopior = recensionerAttKopiera(l.recensionerUtkast, sidansNu);
  for (const r of kopior) await deps.recensioner.upsert({ ...r, productId: input.behall, ...(givarensEtikett ? { kopt: givarensEtikett } : {}) });
  let markta = 0;
  if (plan.tillstand === "ny") {
    const sidansEtikett = etikett(plan.sidansVal, plan.axlar);
    if (sidansEtikett) {
      for (const r of recensionerAttMarka(sidansNu)) {
        await deps.recensioner.upsert({ ...r, kopt: sidansEtikett });
        markta++;
      }
    }
  }
  const paSidan = new Set((await deps.recensioner.listByProduct(input.behall, 1000)).map((r) => r.reviewIdAE));
  const saknas = kopior.filter((r) => !paSidan.has(r.reviewIdAE)).length;
  if (saknas > 0) return svar(false, `${saknas} recensioner läste inte tillbaka på sidan — givaren pensionerades inte, kör om`);
  steg.push(`recensioner: ${kopior.length} kopierade till sidan${markta ? `, ${markta} av sidans egna fick sin variant` : ""}`);

  if (l.wd?.visible === true) {
    const wp = l.wp!;
    const wd = l.wd;
    const lista = l.omdirigeringar ?? [];
    // 5b. Omdirigeringen till givarens variant, och de som pekade på givaren pekas om.
    const sidan = await lasProdukt(deps.wix, input.behall);
    const variant = varianterAv(sidan).find((v) => v.sku === plan.skuUtkast)
      ?? varianterAv(sidan).find((v) => v.id === givarensVariant?.wixVariantId);
    const rad = omdirigeringsrad(wp, wd, typeof variant?.id === "string" ? variant.id : null);
    await deps.omdirigeringar!.skriv(rad);
    const kedjor = lista.filter((r) => malUtanFraga(r.toPath) === `/produkt/${rad.fromSlug}` && r.fromSlug !== rad.fromSlug);
    for (const r of kedjor) await deps.omdirigeringar!.skriv({ ...r, toPath: rad.toPath });
    const efterLista = await deps.omdirigeringar!.lista();
    const skriven = efterLista.find((r) => r.fromSlug === rad.fromSlug);
    if (!skriven || skriven.toPath !== rad.toPath) return svar(false, "omdirigeringen läste inte tillbaka — givaren ligger kvar ute, kör om");
    steg.push(`omdirigering: /produkt/${rad.fromSlug} → ${rad.toPath}${kedjor.length ? ` (${kedjor.length} äldre pekade om)` : ""}`);

    // 5c. Givaren avpubliceras och läses tillbaka.
    const nu = await lasProdukt(deps.wix, input.utkast);
    await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(input.utkast)}`, {
      product: { revision: nu?.revision, visible: false },
      fieldMask: { paths: ["visible"] },
    });
    const efter = await lasProdukt(deps.wix, input.utkast);
    if (efter?.visible !== false) return svar(false, "givaren läste inte tillbaka som avpublicerad — kör om");
    steg.push("givaren: avpublicerad, adressen omdirigeras till sidan");
  }

  // 6. Pensioneringen. Givaren raderas inte: en osynlig sida kostar ingenting,
  // och en radering går inte att ångra. `vevorArtiklar` står kvar på raden.
  if (dm.draftStatus === "rejected" && !artikelUtanPrefix(dm, VEVOR_ID_PREFIX)) {
    steg.push("givaren: redan pensionerad");
    return svar(true);
  }
  await deps.saveMapping(pensioneraDubblett(dm));
  const dEfter = await deps.getMapping(input.utkast);
  if (dEfter?.draftStatus !== "rejected" || artikelUtanPrefix(dEfter, VEVOR_ID_PREFIX)) {
    return svar(false, "sidan är sammanslagen men givaren läste inte tillbaka som pensionerad — kör om");
  }
  steg.push("givaren: pensionerad (rejected), inte raderad");
  return svar(true);
}
