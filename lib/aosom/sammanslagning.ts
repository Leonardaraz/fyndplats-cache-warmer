// Sammanslagning: en Aosom-artikel blir ett VAL — en färg eller en storlek — på
// en publicerad sida.
//
// VARFÖR DEN FINNS (Leonards frågor 2026-09-27)
//
// Dubblettskärmen och syskonsvepet (familjer.ts) hittar sidor och utkast som är
// samma vara i en annan färg eller en annan storlek. Att publicera varje sådan
// som en egen sida ger flera URL:er för samma produkt; att pensionera dem
// slänger varor vi kan sälja. Svaret är att lägga artikeln som ett val på en
// sida: en option ("Färg" eller "Storlek"), en variant per val, och ett val som
// byter huvudbild.
//
// Efter sammanslagningen bär sidan en Aosom-artikel PER VARIANT. Resten av
// koden läser det via lib/aosom/artiklar.ts: synken speglar varje vals saldo
// och pris för sig, beställningsfilen beställer det val kunden gjorde, och
// importens dubblettspärr ser alla artiklarna.
//
// FYRA LÄGEN, ETT PER KÖRNING
//
//   ny       sidan har inga optioner än: optionen skapas med två val.
//   utoka    sidan har redan optionen (en tidigare sammanslagning): ett val
//            till läggs på. Så blir en familj med sju färger en sida — ett
//            utkast per körning.
//   wix_klar en tidigare körning föll efter Wix-skrivningen: bara resten görs.
//   klar     artikeln sitter redan på sidan: bara efterarbetet görs.
//
// GIVAREN KAN VARA EN PUBLICERAD SIDA — med `omdirigera`
//
// Två publicerade sidor för samma vara är den dubblett Google straffar. När
// givaren ligger ute görs fyra saker till, i den här ordningen:
//
//   1. Recensionerna KOPIERAS till sidan vi behåller (givarens rader rörs inte).
//   2. En 301 skrivs från givarens adress till sidan (FyndplatsRedirects, som
//      butiken läser på 404-vägen) — FÖRE avpubliceringen, så adressen aldrig
//      hinner svara 404.
//   3. Givaren avpubliceras och läses tillbaka.
//   4. Givaren pensioneras, som ett utkast.
//
// ☠️ HALVGJORT ÄR SÄKERT, OCH DET ÄR MED FLIT. Faller något efter Wix-skrivningen
// har Wix ett val som mappningen inte känner till. Synken NOLLAR då det valets
// lager och räknar det i `okandaVarianter` (jobbet blir rött), och
// beställningsfilen HÅLLER en order på det — ingen kund kan få fel vara. En
// omkörning ser hur långt det kom och gör bara det som återstår.
//
// ☠️ PRISET RÖRS INTE. Det nya valet får givarens pris som det står i butiken,
// de gamla behåller sina. Leonards regel: poleringen rör aldrig ett pris.
//
// ☠️ SVARET BÄR ALDRIG ETT ARTIKELNUMMER ELLER EN KOSTNAD. Det går till en
// PUBLIK Actions-logg. Planen säger kundpriser, saldon, val, bildantal och
// adresser — det som redan står på sidan.

import type { ProductMappingRecord } from "../store";
import type { StoredReview } from "../store/reviews";
import { validateRedirect, type RedirectRow } from "../wix/redirects";
import { redigera, felText, type WixAnrop } from "../polish/skrivplan";
import { harVerkligSeFrakt, type AosomRow } from "./feed";
import { synligtSaldo } from "./sync";
import { aosomArtikelbild, aosomArtiklarPaRaden, radensArtikel } from "./artiklar";
import { pensioneraDubblett } from "./remap";

type Obj = Record<string, unknown>;

/** Axlarna ett val kan ligga på. Samma ord som AE-sidornas optioner. */
export const AXLAR = ["Färg", "Storlek"] as const;
export type Axel = (typeof AXLAR)[number];

/** Optionens namn för färg — den axel sammanslagningen hade först. */
export const OPTION_NAMN: Axel = "Färg";
const RENDER = "TEXT_CHOICES";

/** Hur länge återläsningen väntar på att valens bilder kopplats (ms per försök). */
const KOPPLING_PAUS_MS = 2500;
const KOPPLING_FORSOK = 8;

/**
 * Så många omdirigeringar läses. `listRedirects` sidar inte, så en lista som
 * når taket kan vara avkortad — och då kan en kedja till givarens adress gömma
 * sig i det olästa. Nås taket vägrar sammanslagningen hellre än gissar.
 */
export const MAX_OMDIRIGERINGAR = 1000;

export interface SammanslagningInput {
  /** Den PUBLICERADE sidan som behålls. */
  behall: string;
  /** Givaren: ett utkast, eller (med `omdirigera`) en publicerad sida. */
  utkast: string;
  /**
   * Värdet sidan redan har, t.ex. "Vit". Krävs bara första gången, när sidan
   * saknar optioner — efter det står sidans val i Wix och i mappningen.
   */
  fargBehall: string;
  /** Givarens värde, t.ex. "Grå" eller "90 × 70 cm". */
  fargUtkast: string;
  /** "Färg" (default) eller "Storlek". */
  axel?: Axel;
  /** Den nya variantens SKU. Utelämnad = sidans SKU + värdet. */
  sku?: string;
  /**
   * Vilka av givarens bilder som följer med, 1-baserat i givarens ordning.
   * Default [1]: huvudbilden, som i mätningen 2026-08-27 var ren på 30 av 30.
   *
   * ☠️ BARA GRANSKADE BILDER. 46 % av feedens bilder bär tysk text inbränd, och
   * en del bär husmärkets logotyp. Ett utkast är opolerat — ingen har tittat på
   * dess bilder. Lägg bara till en bild du SETT.
   */
  bilder?: number[];
  /**
   * Krävs när givaren är PUBLICERAD: dess adress omdirigeras till sidan, dess
   * recensioner kopieras dit, och den avpubliceras. Utan flaggan vägras en
   * publicerad givare — en adress som försvinner är ett beslut, inte en bieffekt.
   */
  omdirigera?: boolean;
}

/** Det recensionslager sammanslagningen behöver. `getReviewStore()` uppfyller det. */
export interface RecensionsLager {
  listByProduct(productId: string, limit?: number): Promise<StoredReview[]>;
  upsert(review: StoredReview): Promise<void>;
}

export interface Omdirigeringar {
  lista(): Promise<RedirectRow[]>;
  skriv(rad: RedirectRow): Promise<void>;
}

export interface SammanslagningDeps {
  wix: WixAnrop;
  getMapping: (wixProductId: string) => Promise<ProductMappingRecord | null>;
  listMappings: () => Promise<ProductMappingRecord[]>;
  saveMapping: (m: ProductMappingRecord) => Promise<void>;
  fetchFeed: () => Promise<AosomRow[]>;
  /** Behövs bara när givaren är en publicerad sida. */
  recensioner?: RecensionsLager;
  omdirigeringar?: Omdirigeringar;
  /** Givarens obehandlade ordrar (väntar på att läggas hos Aosom). */
  oppnaOrdrar?: (wixProductId: string) => Promise<number>;
  now?: () => number;
  vanta?: (ms: number) => Promise<void>;
}

export type Tillstand = "ny" | "utoka" | "wix_klar" | "klar";

/** Planen — det som går till svaret, alltså till en publik logg. */
export interface SammanslagningPlan {
  tillstand: Tillstand | null;
  hinder: string[];
  varningar: string[];
  behall: string;
  utkast: string;
  axel: Axel;
  fargBehall: string;
  fargUtkast: string;
  /** Sidans val efter sammanslagningen, i den ordning de visas. */
  varden: string[];
  skuBehall: string | null;
  skuUtkast: string;
  /** Kundpriserna i butiken — redan publika. Rörs inte av sammanslagningen. */
  prisBehall: number | null;
  prisUtkast: number | null;
  /** Saldot sidan har i dag (alla varianter), och det synliga saldot det nya valet får. */
  saldoBehall: number | null;
  saldoUtkast: number | null;
  bilderBehall: number;
  bilderUtkast: number;
  /** Ligger givaren ute? Då krävs `omdirigera`. */
  givarenPublicerad: boolean;
  /** Givarens recensioner som kopieras till sidan (utan dem som redan finns där). */
  recensionerAttKopiera: number | null;
  /** 301:an som skrivs, som adresser — de står redan på sajten. */
  omdirigering: string | null;
  /** Befintliga omdirigeringar TILL givaren som pekas om, så ingen kedja uppstår. */
  omdirigeringarAttPekaOm: number;
}

export interface SammanslagningSvar {
  ok: boolean;
  torrkorning: boolean;
  plan: SammanslagningPlan;
  steg: string[];
  fel?: string;
}

// ── läsning ─────────────────────────────────────────────────────────────────

/** Det som bara läses när givaren ligger ute. */
export interface GivarLast {
  recensioner: StoredReview[];
  sidansRecensioner: StoredReview[];
  omdirigeringar: RedirectRow[];
  oppnaOrdrar: number;
}

/** Allt som läses före planen. Exporterad för testerna. */
export interface SammanslagningLast {
  pm: ProductMappingRecord | null;
  dm: ProductMappingRecord | null;
  alla: ProductMappingRecord[];
  rad: AosomRow | undefined;
  wp: Obj | null;
  wd: Obj | null;
  lager: { id: string; variantId?: string; quantity?: number }[];
  /** null när givaren inte ligger ute, eller när verktygen för det saknas. */
  givare: GivarLast | null;
}

// ☠️ INTE `MERCHANT_DATA`. Den kräver behörigheten SCOPE.STORES.PRODUCT_READ_ADMIN,
// och saknas den svarar Wix 403 NO_PERMISSION_TO_READ_MERCHANT_DATA — då hade
// redan PLANEN fallit, för läsningen är det första verktyget gör. Varukostnaden
// tas i stället ur mappningen, se `kostnad` nedan.
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

async function lasLager(wix: WixAnrop, id: string): Promise<SammanslagningLast["lager"]> {
  const svar = (await wix("POST", "/stores/v3/inventory-items/query", {
    query: { filter: { productId: id } },
  })) as { inventoryItems?: { id: string; variantId?: string; quantity?: number }[] };
  return (svar.inventoryItems ?? []).map((x) => ({ id: x.id, variantId: x.variantId, quantity: x.quantity }));
}

async function lasGivare(input: SammanslagningInput, deps: SammanslagningDeps): Promise<GivarLast | null> {
  if (!deps.recensioner || !deps.omdirigeringar || !deps.oppnaOrdrar) return null;
  const [recensioner, sidansRecensioner, omdirigeringar, oppnaOrdrar] = await Promise.all([
    deps.recensioner.listByProduct(input.utkast, 1000),
    deps.recensioner.listByProduct(input.behall, 1000),
    deps.omdirigeringar.lista(),
    deps.oppnaOrdrar(input.utkast),
  ]);
  return { recensioner, sidansRecensioner, omdirigeringar, oppnaOrdrar };
}

async function lasAllt(input: SammanslagningInput, deps: SammanslagningDeps): Promise<SammanslagningLast> {
  const [pm, dm, alla, feed, wp, wd, lager] = await Promise.all([
    deps.getMapping(input.behall),
    deps.getMapping(input.utkast),
    deps.listMappings(),
    deps.fetchFeed(),
    lasProdukt(deps.wix, input.behall),
    lasProdukt(deps.wix, input.utkast),
    lasLager(deps.wix, input.behall),
  ]);
  const artikel = dm ? utkastetsArtikel(dm) : "";
  const givare = wd?.visible === true ? await lasGivare(input, deps) : null;
  return { pm, dm, alla, rad: artikel ? feed.find((r) => r.sku === artikel) : undefined, wp, wd, lager, givare };
}

// ── hjälpare ────────────────────────────────────────────────────────────────

/**
 * Givarens artikel. Efter pensioneringen är radens `supplierProductId` tömt
 * (`pensioneraDubblett`), men varianten bär artikeln kvar — så en omkörning
 * efter en lyckad sammanslagning hittar den fortfarande.
 */
function utkastetsArtikel(dm: ProductMappingRecord): string {
  return radensArtikel(dm) || (dm.variants?.[0]?.supplierVariantId ?? "").trim();
}

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

/** Valets kopplade bild, om det har en. */
function lankadBild(c: Obj): string | null {
  const m = ((c.linkedMedia ?? []) as Obj[])[0];
  return m && typeof m.id === "string" ? m.id : null;
}

/** ASCII-slug för en SKU: å/ä → a, ö → o, allt annat bindestreck. */
export function fargSlug(farg: string): string {
  return farg
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function innehallerOrdet(text: string, ord: string): boolean {
  const t = ` ${text.toLowerCase().replace(/[^a-zåäöé0-9]+/g, " ")} `;
  const o = ord.toLowerCase().replace(/[^a-zåäöé0-9]+/g, " ").trim();
  return !!o && t.includes(` ${o} `);
}

/**
 * Ett giltigt val. En färg är ord; en storlek får också bära siffror, mått-
 * tecken och decimalkomma ("90 × 70 cm", "2-sits", "Ø 60 cm").
 */
function giltigtVarde(axel: Axel, v: string): boolean {
  if (v.length < 1 || v.length > 30) return false;
  if (axel === "Färg") return v.length >= 2 && /^[A-Za-zÅÄÖåäöÉé][A-Za-zÅÄÖåäöÉé /-]*$/.test(v);
  return /^[0-9A-Za-zÅÄÖåäöÉéØø][0-9A-Za-zÅÄÖåäöÉéØø ×x,./–-]*$/.test(v) && redigera(v) === v;
}

function altFor(namn: string, axel: Axel, varde: string, n: number): string {
  const bas = axel === "Färg" ? `${namn} i färgen ${varde.toLowerCase()}` : `${namn} i storleken ${varde}`;
  return n === 1 ? bas : `${bas}, bild ${n}`;
}

const lika = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function sammaMangd(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x) => b.some((y) => lika(x, y)));
}

/** Axelns kortform i hindrens namn: `farg_lika`, `storlek_lika`. */
const kodFor = (axel: Axel) => (axel === "Färg" ? "farg" : "storlek");

const normText = (s: string | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Givarens recensioner som ska kopieras: inte de dolda (en dold recension är
 * ett beslut), och inte de som redan finns på sidan — samma AE-id, eller samma
 * text. Aosom visar ibland samma recension på syskonartiklar (uppmätt i omgång
 * 3), så text-kollen är inte teoretisk.
 */
export function recensionerAttKopiera(g: GivarLast): StoredReview[] {
  const idn = new Set(g.sidansRecensioner.map((r) => r.reviewIdAE));
  const texter = new Set(
    g.sidansRecensioner.map((r) => normText(r.textSwedish || r.textOriginal)).filter(Boolean),
  );
  return g.recensioner.filter((r) =>
    r.status !== "rejected"
    && !idn.has(r.reviewIdAE)
    && !texter.has(normText(r.textSwedish || r.textOriginal)));
}

function omdirigeringsrad(wp: Obj, wd: Obj): RedirectRow {
  return {
    fromSlug: String(wd.slug ?? "").trim(),
    toPath: `/produkt/${String(wp.slug ?? "").trim()}`,
    reason: "Sammanslagen: sidan är nu ett val på en annan sida",
  };
}

// ── planen ──────────────────────────────────────────────────────────────────

/**
 * Hindren och planeringen för en publicerad givare. Delas av den vanliga vägen
 * och av `klar`, där en körning som föll mitt i efterarbetet ska göra klart.
 */
function planeraGivaren(
  input: SammanslagningInput,
  l: SammanslagningLast,
  plan: SammanslagningPlan,
  wp: Obj,
  wd: Obj,
): void {
  plan.givarenPublicerad = true;
  if (input.omdirigera !== true) {
    plan.hinder.push("utkast_publicerat");
    return;
  }
  if (!l.givare) {
    plan.hinder.push("givare_publicerad_saknar_verktyg");
    return;
  }
  const g = l.givare;
  if (g.oppnaOrdrar > 0) plan.hinder.push("givaren_har_oppna_ordrar");
  if (g.omdirigeringar.length >= MAX_OMDIRIGERINGAR) plan.hinder.push("omdirigeringar_for_manga");
  const rad = omdirigeringsrad(wp, wd);
  if (!rad.fromSlug || !wp.slug || validateRedirect(rad)) plan.hinder.push("omdirigering_ogiltig");
  const finns = g.omdirigeringar.find((r) => r.fromSlug === rad.fromSlug);
  if (finns && finns.toPath !== rad.toPath) plan.hinder.push("omdirigering_krockar");
  plan.omdirigering = `/produkt/${rad.fromSlug} → ${rad.toPath}`;
  plan.omdirigeringarAttPekaOm = g.omdirigeringar
    .filter((r) => r.toPath === `/produkt/${rad.fromSlug}` && r.fromSlug !== rad.fromSlug).length;
  plan.recensionerAttKopiera = recensionerAttKopiera(g).length;
  plan.varningar.push(
    "givaren ligger ute: dess adress omdirigeras hit och sidan avpubliceras — "
      + "kontrollera att sidan vi behåller ligger i givarens kategorier",
  );
}

/**
 * Räknar fram planen ur det som lästs. Ren — inga anrop.
 *
 * Hindren ska stoppa varje läge där sammanslagningen kunde ge fel artikel,
 * fel pris, fel bild, en halv sida eller en adress som försvinner utan att
 * någon bett om det. Varningarna stoppar ingenting men ska läsas.
 */
export function planeraSammanslagning(input: SammanslagningInput, l: SammanslagningLast): SammanslagningPlan {
  const hinder: string[] = [];
  const varningar: string[] = [];
  const axel: Axel = input.axel ?? OPTION_NAMN;
  const kod = kodFor(axel);
  const fargBehall = (input.fargBehall ?? "").trim();
  const fargUtkast = (input.fargUtkast ?? "").trim();

  // Sidans huvudvariant: den som bär radens egen artikel. Efter en halv körning
  // har Wix flera varianter, och ordningen mellan dem är inget att lita på.
  const pmV = l.pm?.variants ?? [];
  const a1 = l.pm ? radensArtikel(l.pm) : "";
  const huvud = pmV.find((v) => (v.supplierVariantId ?? "").trim() === a1) ?? pmV[0];
  const wpVar = varianterAv(l.wp);
  const v1 = wpVar.find((v) => !!huvud?.wixVariantId && v.id === huvud.wixVariantId)
    ?? wpVar.find((v) => !!huvud?.sku && v.sku === huvud.sku)
    ?? (wpVar.length === 1 ? wpVar[0] : undefined);
  const skuBehall = typeof v1?.sku === "string" ? v1.sku : (huvud?.sku ?? null);
  const skuUtkast = (input.sku ?? "").trim() || (skuBehall ? `${skuBehall}-${fargSlug(fargUtkast)}` : "");

  const bild = l.pm ? aosomArtikelbild(l.pm) : null;
  // Sidans val i dag: ur mappningen när sidan redan är sammanslagen, annars det
  // värde anroparen säger att sidan har.
  const grund = bild?.typ === "flera"
    ? pmV.map((v) => String((v.choices ?? {})[axel] ?? "").trim())
    : [fargBehall];

  const plan: SammanslagningPlan = {
    tillstand: null,
    hinder,
    varningar,
    behall: input.behall,
    utkast: input.utkast,
    axel,
    fargBehall,
    fargUtkast,
    varden: [...grund, fargUtkast],
    skuBehall,
    skuUtkast,
    prisBehall: prisAv(v1),
    prisUtkast: prisAv(varianterAv(l.wd)[0]),
    saldoBehall: null,
    saldoUtkast: l.rad && harVerkligSeFrakt(l.rad) ? synligtSaldo(l.rad.qty) : null,
    bilderBehall: bilderAv(l.wp).length,
    bilderUtkast: 0,
    givarenPublicerad: false,
    recensionerAttKopiera: null,
    omdirigering: null,
    omdirigeringarAttPekaOm: 0,
  };

  if (!(AXLAR as readonly string[]).includes(axel)) hinder.push("axel_ogiltig");
  if (input.behall === input.utkast) hinder.push("samma_produkt");
  if (!l.pm) hinder.push("behall_saknar_mappning");
  if (!l.dm) hinder.push("utkast_saknar_mappning");
  if (!l.wp) hinder.push("behall_saknas_i_wix");
  if (!l.wd) hinder.push("utkast_saknas_i_wix");
  if (hinder.length) return plan;
  const pm = l.pm!;
  const dm = l.dm!;
  const wp = l.wp!;
  const wd = l.wd!;

  if (pm.supplier !== "aosom" || !a1) hinder.push("behall_ej_aosom");
  if (dm.supplier !== "aosom") hinder.push("utkast_ej_aosom");
  const a2 = utkastetsArtikel(dm);
  if (!a2) hinder.push("utkast_saknar_artikel");
  if (a1 && a2 && a1 === a2) hinder.push("samma_artikel");

  // ── Redan klart? Då återstår bara efterarbetet ──────────────────────────
  if (a2 && aosomArtiklarPaRaden(pm).includes(a2) && a1 !== a2) {
    plan.tillstand = "klar";
    if (wd.visible === true) planeraGivaren(input, l, plan, wp, wd);
    return plan;
  }
  if (bild?.typ === "tvetydig") {
    hinder.push("behall_tvetydig");
    return plan;
  }
  if (aosomArtikelbild(dm).typ !== "en") hinder.push("givaren_redan_sammanslagen");
  if ((dm.variants ?? []).length !== 1) hinder.push("utkast_flera_varianter");

  // ── Värdena och SKU:n ────────────────────────────────────────────────────
  if (bild?.typ === "en" && !giltigtVarde(axel, fargBehall)) hinder.push(`${kod}_ogiltig`);
  if (!giltigtVarde(axel, fargUtkast)) hinder.push(`${kod}_ogiltig`);
  if (bild?.typ === "flera" && grund.some((g) => !g)) hinder.push("behall_mappning_saknar_val");
  if (grund.some((g) => g && lika(g, fargUtkast))) hinder.push(`${kod}_lika`);
  if (!/^FP-[a-z0-9-]{3,90}$/.test(skuUtkast) || redigera(skuUtkast) !== skuUtkast) hinder.push("sku_ogiltig");
  const sidansSkuer = new Set([...pmV.map((v) => v.sku), ...wpVar.map((v) => String(v.sku ?? ""))]);
  const skuPaSidan = sidansSkuer.has(skuUtkast);
  const skuUpptagen = l.alla.some(
    (m) => m.wixProductId !== pm.wixProductId && (m.variants ?? []).some((v) => v.sku === skuUtkast),
  );
  if (skuUpptagen) hinder.push("sku_upptagen");

  // ── Artikeln får inte redan sitta på en annan sida ───────────────────────
  if (a2) {
    const upptagen = l.alla.some(
      (m) => m.wixProductId !== pm.wixProductId && m.wixProductId !== dm.wixProductId
        && aosomArtiklarPaRaden(m).includes(a2),
    );
    if (upptagen) hinder.push("artikeln_upptagen");
  }

  // ── Wix: sidan, givaren och deras läge ───────────────────────────────────
  if (wp.visible !== true) hinder.push("behall_ej_publicerad");
  if (wd.visible === true) planeraGivaren(input, l, plan, wp, wd);
  const namn = typeof wp.name === "string" ? wp.name : "";
  if (grund.some((g) => g && innehallerOrdet(namn, g))) hinder.push(`namnet_bar_${kod}`);
  const text = typeof wp.plainDescription === "string" ? wp.plainDescription : "";
  if (grund.some((g) => g && innehallerOrdet(text, g))) {
    varningar.push(`beskrivningen nämner sidans ${axel === "Färg" ? "färg" : "storlek"} — läs om texten efter sammanslagningen`);
  }
  if (axel === "Storlek") {
    varningar.push("beskrivningens mått gäller bara en av storlekarna — skriv om spec-fliken efter sammanslagningen");
  }
  // ☠️ PRISET RÖRS INTE AV SAMMANSLAGNINGEN — MEN SYNKEN TAR ÖVER DET. Det nya
  // valet följer husets regel från nästa körning (konkurrentpriset gäller bara
  // radens EGEN artikel, och prislåset sitter på raden). För ett utkast är det
  // exakt vad det hade; för en givare med konkurrentpris eller lås är det inte.
  if (dm.prisLast) varningar.push("givarens pris är låst — låset följer inte med, synken räknar om det nya valets pris");
  if (dm.prisgrupp || dm.konkurrent) {
    varningar.push("givarens pris styrs av konkurrentregeln — efter sammanslagningen följer det nya valet husets regel");
  }
  if (plan.prisUtkast === null) hinder.push("utkast_saknar_pris");
  if (varianterAv(wd).length !== 1) hinder.push("utkast_flera_varianter_i_wix");

  const bilderUtkast = bilderAv(wd);
  const valda = input.bilder?.length ? input.bilder : [1];
  if (valda.some((n) => !Number.isInteger(n) || n < 1 || n > bilderUtkast.length) || new Set(valda).size !== valda.length) {
    hinder.push("bilder_ogiltiga");
  }
  plan.bilderUtkast = valda.length;
  if (bilderAv(wp).length === 0) hinder.push("behall_saknar_bilder");
  if (bilderUtkast.length === 0) hinder.push("utkast_saknar_bilder");

  // ── Feedraden för det nya valet ──────────────────────────────────────────
  if (!l.rad) hinder.push("utkast_saknas_i_feeden");
  else if (!harVerkligSeFrakt(l.rad)) hinder.push("utkast_skickas_inte_till_sverige");
  else if (plan.saldoUtkast === 0) varningar.push("det nya valet är slutsålt hos Aosom just nu — det syns som slut tills synken ser lager");

  // ── Tillståndet i Wix ────────────────────────────────────────────────────
  const optioner = optionerAv(wp);
  const lagerFor = (id: unknown) => l.lager.find((x) => x.variantId === id);

  if (optioner.length === 0) {
    if (bild?.typ !== "en" || wpVar.length !== 1 || pmV.length !== 1) {
      hinder.push(pmV.length !== 1 ? "behall_flera_varianter" : "behall_mappning_matchar_inte_wix");
      return plan;
    }
    if (huvud?.wixVariantId && wpVar[0].id !== huvud.wixVariantId) hinder.push("behall_variant_matchar_inte");
    if (skuPaSidan) hinder.push("sku_lika");
    plan.tillstand = "ny";
    const post = lagerFor(wpVar[0].id);
    if (!post || typeof post.quantity !== "number") hinder.push("behall_saknar_lagerrad");
    else plan.saldoBehall = post.quantity;
    return plan;
  }

  if (arRedanSkrivenIWix(wp, axel, plan.varden, skuUtkast, fargUtkast, pmV)) {
    plan.tillstand = "wix_klar";
    return plan;
  }
  if (skuPaSidan) hinder.push("sku_lika");
  if (bild?.typ === "en") {
    // Wix har optioner som mappningen inte känner till — de är inte våra.
    hinder.push("behall_har_redan_optioner");
    return plan;
  }
  if (optioner.length !== 1) {
    hinder.push("flera_optioner_stods_inte");
    return plan;
  }
  if (optioner[0].name !== axel) {
    hinder.push("annan_axel");
    return plan;
  }

  // ── Utöka: ett val till på en sida som redan är sammanslagen ────────────
  const valNamn = valAv(optioner[0]).map((c) => String(c.name ?? ""));
  const kanns = pmV.every((mv) => wpVar.some((v) => (!!mv.wixVariantId && v.id === mv.wixVariantId) || v.sku === mv.sku));
  if (!sammaMangd(valNamn, grund) || wpVar.length !== grund.length || !kanns) {
    hinder.push("behall_mappning_matchar_inte_wix");
    return plan;
  }
  let summa = 0;
  for (const v of wpVar) {
    const post = lagerFor(v.id);
    if (!post || typeof post.quantity !== "number") {
      hinder.push("behall_saknar_lagerrad");
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
 * Wix-skrivningen): en option på axeln med exakt de förväntade valen, en
 * variant per val, varje variant mappningen känner till kvar, och en ny
 * variant med den planerade SKU:n på det nya valet.
 */
function arRedanSkrivenIWix(
  wp: Obj,
  axel: Axel,
  forvantade: string[],
  skuUtkast: string,
  fargUtkast: string,
  pmV: ProductMappingRecord["variants"],
): boolean {
  const optioner = optionerAv(wp);
  const varianter = varianterAv(wp);
  if (optioner.length !== 1 || optioner[0].name !== axel || varianter.length !== forvantade.length) return false;
  const namn = valAv(optioner[0]).map((c) => String(c.name ?? ""));
  if (!sammaMangd(namn, forvantade)) return false;
  const ny = varianter.find((v) => v.sku === skuUtkast);
  if (!ny || !lika(vardeAv(ny, axel) ?? "", fargUtkast)) return false;
  return pmV.every((mv) => varianter.some((v) => (!!mv.wixVariantId && v.id === mv.wixVariantId) || v.sku === mv.sku));
}

// ── skrivningen ─────────────────────────────────────────────────────────────

function valBody(varde: string): Obj {
  return { choiceType: "CHOICE_TEXT", name: varde };
}

function valReferens(axel: Axel, varde: string): Obj[] {
  return [{ optionChoiceNames: { optionName: axel, choiceName: varde, renderType: RENDER } }];
}

/** Variantobjektet ur GET:en, med bara det ändrat vi menar. Aldrig byggt från grunden. */
function utanLasfalt(v: Obj): Obj {
  const ut: Obj = { ...v };
  delete ut.inventoryStatus;
  delete ut.media;
  // `profit` och `profitMargin` är räknade av Wix och skrivskyddade; kostnaden
  // sätts ur mappningen (`kostnad`), så hela fältet tas bort här.
  delete ut.revenueDetails;
  return ut;
}

/**
 * Varukostnaden i Wix, ur MAPPNINGEN: samma tal som importen skriver
 * (`costAmount = landedCostSek`, lib/import/pipeline.ts) och som synken håller
 * i fas. Den skickas alltid när den är känd — en variantsInfo-PATCH ersätter
 * varianten, och ett utelämnat fält kan nollas på samma sätt som `visible`.
 */
function kostnad(v: { landedCostSek?: number } | undefined): Obj {
  const k = v?.landedCostSek;
  return typeof k === "number" && Number.isFinite(k) && k > 0
    ? { revenueDetails: { cost: { amount: k.toFixed(2) } } }
    : {};
}

/** Varianten före skrivningen, som återläsningen jämför mot. */
interface Fore {
  id: string;
  sku: string;
  pris: number | null;
  synlig: boolean;
}

interface Kontroll {
  ok: boolean;
  skal: string[];
  /** Gamla variant-id → det id varianten har efter skrivningen. */
  idFor: Record<string, string>;
  nyId?: string;
  /** Hur många av valen som ska ha en bild som faktiskt har en. */
  lankade: number;
}

/** Stämmer Wix med det sammanslagningen skulle skriva? Läser inget själv. */
function kontrollera(
  p: Obj | null,
  plan: SammanslagningPlan,
  fore: Fore[],
  forvantadeBilder: string[],
  bildPerVarde: Record<string, string>,
): Kontroll {
  const skal: string[] = [];
  if (!p) return { ok: false, skal: ["produkten gick inte att läsa"], idFor: {}, lankade: 0 };
  if (p.visible !== true) skal.push("sidan är inte längre publicerad");
  const optioner = optionerAv(p);
  const val = optioner.length === 1 && optioner[0].name === plan.axel ? valAv(optioner[0]) : [];
  if (!sammaMangd(val.map((c) => String(c.name ?? "")), plan.varden)) {
    skal.push(`optionen ${plan.axel} har inte exakt de väntade valen`);
  }
  const lankade = val.filter((c) => bildPerVarde[String(c.name ?? "")] && lankadBild(c)).length;
  const varianter = varianterAv(p);
  if (varianter.length !== plan.varden.length) skal.push("fel antal varianter");
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
  }
  const ny = varianter.find((v) => v.sku === plan.skuUtkast);
  if (!ny) skal.push("den nya varianten saknas (SKU)");
  else {
    if (ny.visible !== true) skal.push("det nya valet är inte synligt");
    if (plan.prisUtkast !== null && prisAv(ny) !== plan.prisUtkast) skal.push("det nya valets pris stämmer inte");
    if (!lika(vardeAv(ny, plan.axel) ?? "", plan.fargUtkast)) skal.push("den nya varianten bär fel val");
  }
  const idn = new Set(bilderAv(p).map((b) => b.id));
  if (forvantadeBilder.some((id) => !idn.has(id))) skal.push("bildlistan saknar bilder");
  return {
    ok: skal.length === 0,
    skal,
    idFor,
    nyId: typeof ny?.id === "string" ? ny.id : undefined,
    lankade,
  };
}

/**
 * Kopplar valens bilder på en produkt som redan har optionen. Samma metod som
 * `linkChoiceMedia`: options med `linkedMedia` + variantsInfo ordagrant, och
 * `visible` med — en variantsInfo-PATCH publicerar annars ett utkast. Val som
 * inte står i kartan lämnas som de är.
 */
async function kopplaValbilder(
  wix: WixAnrop,
  id: string,
  bildPerVarde: Record<string, string>,
): Promise<void> {
  const p = await lasProdukt(wix, id);
  if (!p) throw new Error("produkten gick inte att läsa inför bildkopplingen");
  const optioner = optionerAv(p).map((o) => ({
    ...o,
    choicesSettings: {
      ...((o.choicesSettings as Obj | undefined) ?? {}),
      choices: valAv(o).map((c) => {
        const bildId = bildPerVarde[String(c.name ?? "")];
        return bildId ? { ...c, linkedMedia: [{ id: bildId }] } : c;
      }),
    },
  }));
  await wix("PATCH", `/stores/v3/products/${encodeURIComponent(id)}`, {
    product: { revision: p.revision, visible: p.visible, options: optioner, variantsInfo: p.variantsInfo },
    fieldMask: { paths: ["options", "variantsInfo", "visible"] },
  });
}

/**
 * Kör sammanslagningen: läser, planerar och — bara med `apply` och utan hinder
 * — skriver. Torrkörning är default.
 */
export async function korSammanslagning(
  input: SammanslagningInput,
  deps: SammanslagningDeps,
  opts: { apply?: boolean } = {},
): Promise<SammanslagningSvar> {
  const apply = opts.apply === true;
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = deps.now ?? Date.now;
  const steg: string[] = [];

  const l = await lasAllt(input, deps);
  const plan = planeraSammanslagning(input, l);
  const svar = (ok: boolean, fel?: string): SammanslagningSvar => ({
    ok,
    torrkorning: !apply,
    plan,
    steg,
    ...(fel ? { fel } : {}),
  });

  if (plan.hinder.length > 0) return svar(false, `hinder: ${plan.hinder.join(", ")}`);
  if (plan.tillstand === "klar") {
    // Sidan är klar — men en körning som föll i efterarbetet har lämnat givaren
    // ute eller opensionerad. Det tas om här, annars står den kvar.
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
  const axel = plan.axel;
  const pNamn = String(wp.name ?? "");
  const bilderP = bilderAv(wp);
  const bilderD = bilderAv(wd);
  const valda = (input.bilder?.length ? input.bilder : [1]).map((n, i) => ({
    id: bilderD[n - 1].id,
    altText: altFor(pNamn, axel, plan.fargUtkast, i + 1),
  }));
  const forvantadeBilder = [...bilderP.map((b) => b.id), ...valda.map((b) => b.id)];

  // Bilderna valen ska bära efteråt. Ett val som redan har en kopplad bild
  // behåller den — och står med i kartan, så en skrivning som tappat den
  // kopplas om i återläsningen i stället för att tyst lämnas bildlös.
  const optionFore = optionerAv(wp)[0];
  const bildPerVarde: Record<string, string> = {};
  if (optionFore) {
    for (const c of valAv(optionFore)) {
      const b = lankadBild(c);
      if (b) bildPerVarde[String(c.name ?? "")] = b;
    }
  }
  // Första sammanslagningen (eller en omkörning av den): sidans eget val får
  // sidans huvudbild, om det inte redan har en.
  if (aosomArtikelbild(pm).typ === "en" && !bildPerVarde[plan.fargBehall]) {
    bildPerVarde[plan.fargBehall] = bilderP[0].id;
  }
  if (!bildPerVarde[plan.fargUtkast]) bildPerVarde[plan.fargUtkast] = valda[0].id;

  // Varianterna före skrivningen — återläsningen jämför mot dem.
  const variantFore = varianterAv(wp);
  const fore: Fore[] = (plan.tillstand === "wix_klar"
    ? variantFore.filter((v) => v.sku !== plan.skuUtkast)
    : variantFore
  ).map((v) => ({
    id: String(v.id ?? ""),
    sku: String(v.sku ?? ""),
    pris: prisAv(v),
    synlig: v.visible === true || plan.tillstand === "ny",
  }));

  // ── 1 + 2: Wix, bara från "ny" och "utoka" ─────────────────────────────
  if (plan.tillstand === "ny" || plan.tillstand === "utoka") {
    const saldoUtkast = plan.saldoUtkast ?? 0;
    const nyLista = [...bilderP, ...valda.filter((b) => !bilderP.some((x) => x.id === b.id))];
    const efterBilder = produktAv(await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(input.behall)}`, {
      product: { revision: wp.revision, media: { itemsInfo: { items: nyLista } } },
      fieldMask: { paths: ["media"] },
    }));
    steg.push(`bilder: ${bilderP.length} → ${nyLista.length}`);

    const nyVariant: Obj = {
      visible: true,
      sku: plan.skuUtkast,
      price: { actualPrice: { amount: String(plan.prisUtkast) } },
      ...kostnad(dm.variants?.[0]),
      choices: valReferens(axel, plan.fargUtkast),
      physicalProperties: {},
      inventoryItem: { quantity: saldoUtkast },
    };

    let options: Obj[];
    let variants: Obj[];
    if (plan.tillstand === "ny") {
      const v1 = variantFore[0];
      const post = l.lager.find((x) => x.variantId === v1.id)!;
      // Utan `linkedMedia` här, med flit: bilden tas emot asynkront och en
      // koppling i samma skrivning kan falla på 404 PRODUCT_MEDIA_NOT_EXIST
      // (uppmätt vid import 2026-06-01). Då hade hela sammanslagningen fallit
      // för en bildfråga. Kopplingen görs i återläsningen, med försök.
      options = [{
        name: axel,
        optionRenderType: RENDER,
        choicesSettings: { choices: [valBody(plan.fargBehall), valBody(plan.fargUtkast)] },
      }];
      variants = [
        {
          ...utanLasfalt(v1),
          visible: true,
          choices: valReferens(axel, plan.fargBehall),
          physicalProperties: (v1.physicalProperties as Obj | undefined) ?? {},
          ...kostnad(pm.variants?.[0]),
          // Lagret följer VARIANTEN (standardplatsen), inte ett id: schemat för
          // products-with-inventory har bara `quantity` ELLER `inStock` här.
          inventoryItem: { quantity: post.quantity },
        },
        nyVariant,
      ];
    } else {
      // ☠️ OPTIONEN OCH VARIANTERNA TAS UR GET:EN, INTE BYGGDA FRÅN GRUNDEN.
      // Samma regel som `visible` och `options` i prissynken: ett handbyggt
      // objekt tappar tyst varje fält man inte tänkte på — här valens kopplade
      // bilder och varianternas id. Bara det nya valet läggs till.
      options = [{
        ...optionFore,
        choicesSettings: {
          ...((optionFore.choicesSettings as Obj | undefined) ?? {}),
          choices: [...valAv(optionFore), valBody(plan.fargUtkast)],
        },
      }];
      variants = [
        ...variantFore.map((v) => {
          const mv = (pm.variants ?? []).find((m) => (!!m.wixVariantId && m.wixVariantId === v.id) || m.sku === v.sku);
          const post = l.lager.find((x) => x.variantId === v.id)!;
          return {
            ...utanLasfalt(v),
            choices: valReferens(axel, vardeAv(v, axel) ?? String((mv?.choices ?? {})[axel] ?? "")),
            physicalProperties: (v.physicalProperties as Obj | undefined) ?? {},
            ...kostnad(mv),
            inventoryItem: { quantity: post.quantity },
          };
        }),
        nyVariant,
      ];
    }

    const kropp = {
      product: {
        id: input.behall,
        revision: efterBilder?.revision ?? wp.revision,
        visible: wp.visible,
        options,
        variantsInfo: { variants },
      },
    };
    try {
      await deps.wix("PATCH", `/stores/v3/products-with-inventory/${encodeURIComponent(input.behall)}`, kropp);
      steg.push(`varianter: ${axel.toLowerCase()} ${plan.fargUtkast} tillagd med saldo ${saldoUtkast} (${plan.varden.length} val)`);
    } catch (e) {
      // ☠️ BILDERNA RULLAS TILLBAKA. Utan varianten visar sidan det nya valets
      // bilder på en produkt som inte säljs i det.
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
      return svar(
        false,
        `variantskrivningen föll: ${felText(e)} — bildlistan ${aterstallt ? "återställd" : "KUNDE INTE återställas, kontrollera sidan"}`,
      );
    }
  }

  // ── 3: återläsning, med väntan på de kopplade bilderna ─────────────────
  const krav = Object.keys(bildPerVarde).length;
  let k = kontrollera(await lasProdukt(deps.wix, input.behall), plan, fore, forvantadeBilder, bildPerVarde);
  for (let forsok = 0; k.ok && k.lankade < krav && forsok < KOPPLING_FORSOK; forsok++) {
    try {
      await kopplaValbilder(deps.wix, input.behall, bildPerVarde);
    } catch {
      // Ett 404/409 medan bilden fortfarande tas emot — försök igen.
    }
    await vanta(KOPPLING_PAUS_MS);
    k = kontrollera(await lasProdukt(deps.wix, input.behall), plan, fore, forvantadeBilder, bildPerVarde);
  }
  if (!k.ok || !k.nyId) {
    return svar(
      false,
      `Wix stämmer inte efter skrivningen (${k.skal.join("; ")}) — mappningen skrevs INTE. `
        + "Synken nollar det nya valets lager tills det är mappat. Kör om.",
    );
  }
  if (k.lankade < krav) steg.push(`⚠️ ${krav - k.lankade} val saknar kopplad bild — kör om för att koppla`);
  const lager = await lasLager(deps.wix, input.behall);
  const antal = (id: string | undefined) => lager.find((x) => x.variantId === id)?.quantity;
  const qNy = antal(k.nyId);
  steg.push(`återläst: ${plan.varden.length} varianter, ${k.lankade} av ${krav} val med bild, nytt saldo ${qNy ?? "?"}`);

  // ── 4: mappningen på sidan vi behåller ─────────────────────────────────
  const bild = aosomArtikelbild(pm);
  const nuId = (v: ProductMappingRecord["variants"][number]) => {
    const f = fore.find((x) => (!!v.wixVariantId && x.id === v.wixVariantId) || x.sku === v.sku);
    return f ? k.idFor[f.id] : undefined;
  };
  const befintliga = bild.typ === "en"
    ? [{
      ...pm.variants[0],
      wixVariantId: nuId(pm.variants[0]) ?? pm.variants[0].wixVariantId,
      choices: { [axel]: plan.fargBehall },
      aosomSyncedQty: antal(nuId(pm.variants[0])),
    }]
    : pm.variants.map((v) => {
      const id = nuId(v) ?? v.wixVariantId;
      return { ...v, wixVariantId: id, aosomSyncedQty: antal(id) };
    });
  const dv = dm.variants[0];
  const nyMappning = {
    supplierVariantId: utkastetsArtikel(dm),
    sku: plan.skuUtkast,
    wixVariantId: k.nyId,
    choices: { [axel]: plan.fargUtkast },
    costUsd: dv.costUsd,
    landedCostSek: dv.landedCostSek,
    grossSek: plan.prisUtkast ?? dv.grossSek,
    ...(dv.shipFrom ? { shipFrom: dv.shipFrom } : {}),
    aosomSyncedQty: qNy,
  };
  const saldon = [...befintliga.map((v) => v.aosomSyncedQty), qNy];
  const ny: ProductMappingRecord = {
    ...pm,
    ...(saldon.every((q) => typeof q === "number")
      ? { aosomSyncedQty: saldon.reduce((s, q) => s + (q as number), 0), aosomSyncedAt: new Date(now()).toISOString() }
      : {}),
    variants: [...befintliga, nyMappning],
  };
  await deps.saveMapping(ny);
  const efter = await deps.getMapping(input.behall);
  const bildEfter = efter ? aosomArtikelbild(efter) : null;
  if (
    !bildEfter || bildEfter.typ !== "flera" || bildEfter.varianter.length !== plan.varden.length
    || !bildEfter.varianter.some((v) => v.artikel === utkastetsArtikel(dm))
  ) {
    return svar(false, "mappningen läste inte tillbaka som en sida med ett val per artikel — ingenting är verifierat, kör om");
  }
  steg.push(`mappning: ${plan.varden.length} val, en artikel per val (återläst)`);

  // ── 5 + 6: givarens efterarbete och pensionering ───────────────────────
  return efterarbete(l, plan, input, deps, steg, svar);
}

/** Det som återstår efter att sidan är klar, i läsbar form. */
function aterstar(l: SammanslagningLast): string[] {
  const kvar: string[] = [];
  if (l.wd?.visible === true) kvar.push("givarens recensioner, omdirigering och avpublicering");
  const dm = l.dm;
  if (dm && (dm.draftStatus !== "rejected" || radensArtikel(dm))) kvar.push("pensionering av givaren");
  return kvar;
}

/**
 * Steg 5 och 6. En publicerad givare får sina recensioner kopierade, sin
 * adress omdirigerad och sin sida avpublicerad — i den ordningen, så adressen
 * aldrig hinner svara 404 och inget omdöme hinner försvinna. Sedan pensioneras
 * givaren, publicerad eller inte.
 *
 * ☠️ GIVARENS RECENSIONSRADER RÖRS INTE. De kopieras; originalen ligger kvar
 * på den avpublicerade sidan, där ingen ser dem. Då går sammanslagningen att
 * backa utan att något omdöme gått förlorat.
 */
async function efterarbete(
  l: SammanslagningLast,
  plan: SammanslagningPlan,
  input: SammanslagningInput,
  deps: SammanslagningDeps,
  steg: string[],
  svar: (ok: boolean, fel?: string) => SammanslagningSvar,
): Promise<SammanslagningSvar> {
  const dm = l.dm!;
  if (l.wd?.visible === true) {
    const g = l.givare!;
    const wp = l.wp!;
    const wd = l.wd;

    // 5a. Recensionerna.
    const kopior = recensionerAttKopiera(g);
    for (const r of kopior) await deps.recensioner!.upsert({ ...r, productId: input.behall });
    const paSidan = new Set((await deps.recensioner!.listByProduct(input.behall, 1000)).map((r) => r.reviewIdAE));
    const saknas = kopior.filter((r) => !paSidan.has(r.reviewIdAE)).length;
    if (saknas > 0) return svar(false, `${saknas} recensioner läste inte tillbaka på sidan — givaren ligger kvar ute, kör om`);
    steg.push(`recensioner: ${kopior.length} kopierade till sidan (${g.recensioner.length - kopior.length} fanns redan eller var dolda)`);

    // 5b. Omdirigeringen, och de som pekade på givaren pekas om.
    const rad = omdirigeringsrad(wp, wd);
    await deps.omdirigeringar!.skriv(rad);
    const kedjor = g.omdirigeringar.filter((r) => r.toPath === `/produkt/${rad.fromSlug}` && r.fromSlug !== rad.fromSlug);
    for (const r of kedjor) await deps.omdirigeringar!.skriv({ ...r, toPath: rad.toPath });
    const lista = await deps.omdirigeringar!.lista();
    const skriven = lista.find((r) => r.fromSlug === rad.fromSlug);
    if (!skriven || skriven.toPath !== rad.toPath) {
      return svar(false, "omdirigeringen läste inte tillbaka — givaren ligger kvar ute, kör om");
    }
    steg.push(`omdirigering: ${plan.omdirigering}${kedjor.length ? ` (${kedjor.length} äldre pekade om)` : ""}`);

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
  if (dm.draftStatus === "rejected" && !radensArtikel(dm)) {
    steg.push("givaren: redan pensionerad");
    return svar(true);
  }
  return pensionera(dm, input, deps, steg, svar);
}

/**
 * Steg 6. Artikeln släpps från givarens rad — den sitter nu som ett val på
 * sidan vi behåller, och importens dubblettspärr ser den där
 * (lib/aosom/artiklar.ts). Givaren RADERAS inte: en osynlig sida kostar
 * ingenting, och en radering går inte att ångra.
 */
async function pensionera(
  dm: ProductMappingRecord,
  input: SammanslagningInput,
  deps: SammanslagningDeps,
  steg: string[],
  svar: (ok: boolean, fel?: string) => SammanslagningSvar,
): Promise<SammanslagningSvar> {
  await deps.saveMapping(pensioneraDubblett(dm));
  const dEfter = await deps.getMapping(input.utkast);
  if (dEfter?.draftStatus !== "rejected" || radensArtikel(dEfter)) {
    return svar(false, "sidan är sammanslagen men givaren läste inte tillbaka som pensionerad — kör om");
  }
  steg.push("givaren: pensionerad (rejected), inte raderad");
  return svar(true);
}
