// Sammanslagning: en Aosom-artikel blir en VARIANT — en färg, en storlek eller
// båda — på en publicerad sida.
//
// VARFÖR DEN FINNS (Leonards frågor 2026-09-27)
//
// Dubblettskärmen och syskonsvepet (familjer.ts) hittar sidor och utkast som är
// samma vara i en annan färg eller en annan storlek. Att publicera varje sådan
// som en egen sida ger flera URL:er för samma produkt; att pensionera dem
// slänger varor vi kan sälja. Svaret är att lägga artikeln som en variant på en
// sida: optionerna "Färg" och "Storlek", en variant per artikel, och en färg
// som byter huvudbild.
//
// Efter sammanslagningen bär sidan en Aosom-artikel PER VARIANT. Resten av
// koden läser det via lib/aosom/artiklar.ts: synken speglar varje variants
// saldo och pris för sig, beställningsfilen beställer den variant kunden valde,
// och importens dubblettspärr ser alla artiklarna.
//
// FÄRG OCH STORLEK PÅ SAMMA SIDA
//
// En sida har en axel eller båda. Givaren anger sitt värde på varje axel sidan
// har, och på den axel den lägger till; sidan anger sitt värde bara på en axel
// den får för första gången. Varje variant är en artikel, så alla kombinationer
// behöver inte finnas: Wix tillåter färre varianter än kombinationer, och
// butikens väljare (headless-site, lib/variant-multi.ts) dämpar en kombination
// som saknas och byter till en som finns. En kombination Aosom inte säljer ska
// inte heller finnas på sidan.
//
// FYRA LÄGEN, ETT PER KÖRNING
//
//   ny       sidan har inga optioner än: optionerna skapas, med två varianter.
//   utoka    sidan har redan optioner (en tidigare sammanslagning): en variant
//            till, och vid behov ett nytt val på en axel eller en ny axel. Så
//            blir en familj med sju färger en sida — ett utkast per körning.
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
// har Wix en variant som mappningen inte känner till. Synken NOLLAR då dess
// lager och räknar den i `okandaVarianter` (jobbet blir rött), och
// beställningsfilen HÅLLER en order på den — ingen kund kan få fel vara. En
// omkörning ser hur långt det kom och gör bara det som återstår.
//
// ☠️ PRISET RÖRS INTE. Den nya varianten får givarens pris som det står i
// butiken, de gamla behåller sina. Leonards regel: poleringen rör aldrig ett pris.
//
// ☠️ SVARET BÄR ALDRIG ETT ARTIKELNUMMER ELLER EN KOSTNAD. Det går till en
// PUBLIK Actions-logg. Planen säger kundpriser, saldon, val, bildantal och
// adresser — det som redan står på sidan.

import type { ProductMappingRecord } from "../store";
import type { StoredReview } from "../store/reviews";
import { validateRedirect, type RedirectRow } from "../wix/redirects";
import { redigera, felText, type WixAnrop } from "../polish/skrivplan";
import { SKU_MAX } from "../import/sku";
import { harVerkligSeFrakt, type AosomRow } from "./feed";
import { synligtSaldo } from "./sync";
import { aosomArtikelbild, aosomArtiklarPaRaden, radensArtikel } from "./artiklar";
import { pensioneraDubblett } from "./remap";
import { WIX_BILDTAK, altFor, givarensBilder, harSvenskAlt, olankadeAgare, type TabellRad } from "./fargbilder";
import type { FargbildLager } from "../store/fargbilder";

type Obj = Record<string, unknown>;
type MappningsVariant = ProductMappingRecord["variants"][number];

/**
 * Axlarna en variant kan skilja sig på, i den ordning en ny sida får dem. Samma
 * ord som AE-sidornas optioner, och samma som butikens väljare letar efter.
 */
export const AXLAR = ["Färg", "Storlek"] as const;
export type Axel = (typeof AXLAR)[number];
/** Ett värde per axel: en variants plats bland valen. */
export type Koordinat = Partial<Record<Axel, string>>;

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
  /** Givarens färg, t.ex. "Grå". Krävs när sidan har eller får färgval. */
  fargUtkast?: string;
  /** Givarens storlek, t.ex. "110 × 85 cm". Krävs när sidan har eller får storleksval. */
  storlekUtkast?: string;
  /**
   * Sidans färg, t.ex. "Vit". Bara när sidan FÅR färgvalet i den här
   * körningen — efter det står sidans färger i Wix och i mappningen.
   */
  fargBehall?: string;
  /** Sidans storlek. Bara när sidan får storleksvalet i den här körningen. */
  storlekBehall?: string;
  /** Den nya variantens SKU. Utelämnad = sidans SKU + givarens nya värden. */
  sku?: string;
  /**
   * Vilka av givarens bilder som följer med, 1-baserat i givarens ordning.
   * Anges de följer exakt de med, och inga fler.
   *
   * Default (sedan 2026-09-30): ALLA givarens bilder när givaren för in en ny
   * färg (eller en ny storlek på en sida utan färgval), med färgbildsverktygets
   * regler (lib/aosom/fargbilder.ts): givarens egna kort följer inte med, och
   * en OPOLERAD givares bilder från position 3 skrivs inte utan sparas som
   * `granskas` i färgbildstabellen — 46 % av feedens bilder bär tysk text
   * inbränd. Det som inte ryms under Wix tak på 15 bilder sparas i tabellen
   * (`overflow`), och butiken visar det därifrån. En ny storlek i en färg sidan
   * redan har tar inga bilder, för den visar samma vara.
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
  /**
   * Färgbildstabellen. Obligatorisk: den nya färgens bilder utöver Wix 15 bor
   * bara där, och en valfri dep glöms av nästa anropare (media-cleanup.ts).
   */
  fargbilder: FargbildLager;
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
  /** Sidans axlar efter sammanslagningen, i den ordning butiken visar dem. */
  axlar: Axel[];
  /** Axlar sidan får i den här körningen. */
  nyaAxlar: Axel[];
  /** Axlar där givaren för in ett värde sidan inte har. */
  nyaVarden: Axel[];
  /** Den nya variantens plats: givarens värde på varje axel. */
  nyttVal: Koordinat;
  /** Sidans värde på de nya axlarna — varje befintlig variant får det. */
  sidansVal: Koordinat;
  /** Valen per axel efter sammanslagningen. */
  varden: Partial<Record<Axel, string[]>>;
  /** Varianter efter sammanslagningen. */
  varianter: number;
  /** Kombinationer av valen utan variant. Butiken visar dem som ej valbara. */
  saknadeKombinationer: number;
  skuBehall: string | null;
  skuUtkast: string;
  /** Kundpriserna i butiken — redan publika. Rörs inte av sammanslagningen. */
  prisBehall: number | null;
  prisUtkast: number | null;
  /** Saldot sidan har i dag (alla varianter), och det synliga saldot den nya varianten får. */
  saldoBehall: number | null;
  saldoUtkast: number | null;
  bilderBehall: number;
  /** Givarens bilder som hamnar i sidans galleri. */
  bilderUtkast: number;
  /** Givarens bilder som inte ryms under Wix 15 — de sparas i färgbildstabellen. */
  bilderOverflow: number;
  /** Opolerade givarbilder från position 3: sparas som `granskas`, skrivs inte. */
  bilderGranskas: number;
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

/** Mappningsvariantens val på axeln, eller "". */
function valFor(v: MappningsVariant | undefined, axel: Axel): string {
  return String((v?.choices ?? {})[axel] ?? "").trim();
}

/** Valets kopplade bilder, i Wix ordning. */
function lankadeBilder(c: Obj): string[] {
  return ((c.linkedMedia ?? []) as Obj[]).map((m) => (typeof m.id === "string" ? m.id : "")).filter(Boolean);
}

const arAxel = (s: string): s is Axel => (AXLAR as readonly string[]).includes(s);

/** Axelns kortform i hindrens namn: `farg_lika`, `saknar_storlek_behall`. */
const kodFor = (axel: Axel) => (axel === "Färg" ? "farg" : "storlek");

/**
 * Axeln som bär variantbilden. Butiken tar kombinationens bild från FÄRGEN när
 * sidan har en (headless-site, lib/variant-price.ts — Leonards regel
 * 2026-08-08), annars från storleken.
 */
export function bildAxel(axlar: readonly Axel[]): Axel {
  return axlar.includes("Färg") ? "Färg" : "Storlek";
}

/** Givarens (eller sidans) värden, utan de tomma. */
function givnaVarden(farg: string | undefined, storlek: string | undefined): Koordinat {
  const ut: Koordinat = {};
  const f = (farg ?? "").trim();
  const s = (storlek ?? "").trim();
  if (f) ut.Färg = f;
  if (s) ut.Storlek = s;
  return ut;
}

/** "färg Grå, storlek 110 cm" — för steg, audit och loggrader. */
export function beskrivVal(val: Koordinat): string {
  return AXLAR.filter((a) => val[a]).map((a) => `${a.toLowerCase()} ${val[a]}`).join(", ");
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

/** Tar givaren med bilder alls? Bara när den för in ett nytt värde på bildaxeln. */
function givarenGerBilder(input: SammanslagningInput, plan: SammanslagningPlan): boolean {
  return !!input.bilder?.length || plan.nyaVarden.includes(bildAxel(plan.axlar));
}

/** Givarens bilder fördelade: vad som går till galleriet, tabellen och granskningen. */
export interface GivarFordelning {
  /** Valets bilder i galleriet, i ordning — huvudbilden först. Blir valets `linkedMedia`. */
  lista: string[];
  /** Bilder som läggs till i galleriet, med alt-text. */
  nya: { id: string; altText: string }[];
  /** Utöver Wix 15: bara i färgbildstabellen. */
  overflow: string[];
  /** Opolerad givare, position 3 och senare: sparas men skrivs inte. */
  granskas: string[];
  /** 1-baserade positioner som inte finns (bara med `bilder`). */
  ogiltiga: boolean;
}

/**
 * Fördelar givarens bilder under Wix tak. Ren. Med `bilder` följer exakt de
 * med; annars alla enligt färgbildsverktygets regler (se `bilder` i input).
 * Bilder som redan ligger på sidan (en omkörning efter `wix_klar`) räknas som
 * tillagda och tar ingen ny plats.
 */
export function fordelaGivarensBilder(
  bilderP: readonly { id: string; altText: string }[],
  bilderD: readonly { id: string; altText: string }[],
  givarNamn: string,
  sidNamn: string,
  nyttVal: Koordinat,
  valda?: number[],
): GivarFordelning {
  const pa = new Set(bilderP.map((b) => b.id));
  let rum = WIX_BILDTAK - bilderP.length;
  const kandidater: { id: string; alt: string; granskas: boolean }[] = [];
  let ogiltiga = false;
  if (valda?.length) {
    ogiltiga = valda.some((n) => !Number.isInteger(n) || n < 1 || n > bilderD.length) || new Set(valda).size !== valda.length;
    if (!ogiltiga) for (const n of valda) kandidater.push({ id: bilderD[n - 1].id, alt: bilderD[n - 1].altText, granskas: false });
  } else {
    const gb = givarensBilder({ id: "", namn: givarNamn, bilder: bilderD.map((b) => ({ id: b.id, alt: b.altText })) });
    for (const b of gb.bilder) kandidater.push({ id: b.id, alt: b.alt, granskas: b.granskas });
  }
  const ut: GivarFordelning = { lista: [], nya: [], overflow: [], granskas: [], ogiltiga };
  for (const b of kandidater) {
    if (b.granskas) {
      ut.granskas.push(b.id);
      continue;
    }
    if (pa.has(b.id)) {
      ut.lista.push(b.id);
      continue;
    }
    if (rum > 0) {
      rum--;
      ut.lista.push(b.id);
      const n = ut.lista.length;
      ut.nya.push({ id: b.id, altText: harSvenskAlt(b.alt) ? b.alt : altFor(sidNamn, nyttVal, n) });
      continue;
    }
    ut.overflow.push(b.id);
  }
  return ut;
}

/** Tabellraderna för den nya färgen: galleriet, overflow och det som granskas. */
export function givarRader(
  wixProductId: string,
  choiceId: string,
  choiceName: string,
  givareId: string,
  f: GivarFordelning,
): TabellRad[] {
  const rad = (filId: string, ordning: number, plats: TabellRad["plats"]): TabellRad =>
    ({ wixProductId, choiceId, choiceName, ordning, filId, plats, givareId });
  return [
    ...f.lista.map((id, i) => rad(id, i, "galleri")),
    ...f.overflow.map((id, i) => rad(id, f.lista.length + i, "overflow")),
    ...f.granskas.map((id, i) => rad(id, f.lista.length + f.overflow.length + i, "granskas")),
  ];
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
  const hindra = (h: string) => {
    if (!hinder.includes(h)) hinder.push(h);
  };
  const varningar: string[] = [];
  const givetUtkast = givnaVarden(input.fargUtkast, input.storlekUtkast);
  const givetBehall = givnaVarden(input.fargBehall, input.storlekBehall);

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
  const bild = l.pm ? aosomArtikelbild(l.pm) : null;
  const sammanslagen = bild?.typ === "flera";

  // ── Axlarna ────────────────────────────────────────────────────────────
  // En sammanslagen sida bär sina val i mappningen. Ordningen tas ur Wix, som
  // är den ordning butiken visar axlarna i; nya axlar läggs sist.
  const nycklar = new Set<string>();
  if (sammanslagen) {
    for (const v of pmV) for (const [k, x] of Object.entries(v.choices ?? {})) if (String(x ?? "").trim()) nycklar.add(k);
  }
  const okandaNycklar = [...nycklar].filter((k) => !arAxel(k));
  const wixOrdning = optionerAv(l.wp).map((o) => String(o.name ?? ""));
  const plats = (a: Axel) => {
    const i = wixOrdning.indexOf(a);
    return i < 0 ? 100 + AXLAR.indexOf(a) : i;
  };
  const fore: Axel[] = AXLAR.filter((a) => nycklar.has(a)).sort((a, b) => plats(a) - plats(b));
  const nyaAxlar: Axel[] = AXLAR.filter((a) => !!givetUtkast[a] && !fore.includes(a));
  const axlar: Axel[] = [...fore, ...nyaAxlar];

  const sidansVal: Koordinat = {};
  for (const a of nyaAxlar) if (givetBehall[a]) sidansVal[a] = givetBehall[a];

  // Varje befintlig variants plats efter sammanslagningen: dess val på sidans
  // axlar, och sidans värde på de nya.
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

  // Givarens värde, stavat som sidan redan stavar det: "grå" på en sida med
  // "Grå" är samma val. Annars skapar Wix ett andra val med samma namn.
  const nyttVal: Koordinat = {};
  const varden: Partial<Record<Axel, string[]>> = {};
  const nyaVarden: Axel[] = [];
  for (const a of axlar) {
    const fanns = unika(koordinaterFore.map((k) => k[a] ?? ""));
    const givet = givetUtkast[a] ?? "";
    const stavat = fanns.find((x) => lika(x, givet)) ?? givet;
    if (stavat) nyttVal[a] = stavat;
    if (stavat && !fanns.some((x) => lika(x, stavat))) nyaVarden.push(a);
    varden[a] = unika([...fanns, stavat]);
  }
  const varianter = koordinaterFore.length + 1;
  const kombinationer = axlar.length ? axlar.reduce((n, a) => n * (varden[a]?.length ?? 0), 1) : 0;

  // SKU:n får givarens värden där den skiljer sig från sidans huvudvariant —
  // storleken FÖRE färgen. Artikelnummerspärren (skrivplan.ts, FORM) fäller
  // tre tecken + bindestreck + tre till med en siffra: färgen före ett
  // tresiffrigt mått fälls, måttet före färgen går igenom. Fälls SKU:n ändå
  // blir det hindret `sku_ogiltig`, och den anges för hand.
  // ☠️ Wix tar högst SKU_MAX (40) tecken — sidans SKU plus givarens värden
  // spränger det lätt. Då blir det `sku_for_lang` i PLANEN; annars hade först
  // `byt` fallit, på en 400 från Wix.
  const delar = (["Storlek", "Färg"] as const)
    .filter((a) => axlar.includes(a) && nyttVal[a] && !lika(nyttVal[a]!, huvudKoordinat[a] ?? ""))
    .map((a) => fargSlug(nyttVal[a]!));
  const skuUtkast = (input.sku ?? "").trim() || (skuBehall && delar.length ? `${skuBehall}-${delar.join("-")}` : "");

  const plan: SammanslagningPlan = {
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
    varianter,
    saknadeKombinationer: Math.max(0, kombinationer - varianter),
    skuBehall,
    skuUtkast,
    prisBehall: prisAv(v1),
    prisUtkast: prisAv(varianterAv(l.wd)[0]),
    saldoBehall: null,
    saldoUtkast: l.rad && harVerkligSeFrakt(l.rad) ? synligtSaldo(l.rad.qty) : null,
    bilderBehall: bilderAv(l.wp).length,
    bilderUtkast: 0,
    bilderOverflow: 0,
    bilderGranskas: 0,
    givarenPublicerad: false,
    recensionerAttKopiera: null,
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

  if (pm.supplier !== "aosom" || !a1) hindra("behall_ej_aosom");
  if (dm.supplier !== "aosom") hindra("utkast_ej_aosom");
  const a2 = utkastetsArtikel(dm);
  if (!a2) hindra("utkast_saknar_artikel");
  if (a1 && a2 && a1 === a2) hindra("samma_artikel");

  // ── Redan klart? Då återstår bara efterarbetet ──────────────────────────
  if (a2 && aosomArtiklarPaRaden(pm).includes(a2) && a1 !== a2) {
    plan.tillstand = "klar";
    if (wd.visible === true) planeraGivaren(input, l, plan, wp, wd);
    return plan;
  }
  if (bild?.typ === "tvetydig") {
    hindra("behall_tvetydig");
    return plan;
  }
  if (aosomArtikelbild(dm).typ !== "en") hindra("givaren_redan_sammanslagen");
  if ((dm.variants ?? []).length !== 1) hindra("utkast_flera_varianter");

  // ── Axlarna och värdena ──────────────────────────────────────────────────
  if (okandaNycklar.length) hindra("annan_axel");
  if (sammanslagen && (fore.length === 0 || pmV.some((v) => fore.some((a) => !valFor(v, a))))) {
    hindra("behall_mappning_saknar_val");
  }
  // Varje axel sidan har måste givaren ha ett värde på — en variant bär ett val
  // per axel, och att gissa givarens hade kunnat sälja fel storlek.
  for (const a of fore) if (!givetUtkast[a]) hindra(`saknar_${kodFor(a)}_utkast`);
  for (const a of AXLAR) {
    const u = givetUtkast[a];
    if (u && !giltigtVarde(a, u)) hindra(`${kodFor(a)}_ogiltig`);
    // Sidans värde på en axel givaren inte anger: en axel som skulle läggas
    // till men där givarens värde glömdes bort.
    if (givetBehall[a] && !u && !fore.includes(a)) hindra(`saknar_${kodFor(a)}_utkast`);
  }
  for (const a of nyaAxlar) {
    const b = givetBehall[a];
    if (!b) hindra(`saknar_${kodFor(a)}_behall`);
    else if (!giltigtVarde(a, b)) hindra(`${kodFor(a)}_ogiltig`);
    // En ny axel där sidan och givaren har samma värde skiljer ingenting åt.
    else if (lika(b, givetUtkast[a]!)) hindra(`${kodFor(a)}_lika`);
  }
  for (const a of fore) {
    if (givetBehall[a]) varningar.push(`sidans ${a.toLowerCase()} står redan i Wix — ${kodFor(a)}_behall används inte`);
  }
  if (nyaAxlar.length === 0 && koordinaterFore.some((k) => axlar.every((a) => lika(k[a] ?? "", nyttVal[a] ?? "")))) {
    hindra("kombinationen_finns");
  }
  if (!/^FP-[a-z0-9-]{3,90}$/.test(skuUtkast) || redigera(skuUtkast) !== skuUtkast) hindra("sku_ogiltig");
  if (skuUtkast.length > SKU_MAX) hindra("sku_for_lang");
  const sidansSkuer = new Set([...pmV.map((v) => v.sku), ...wpVar.map((v) => String(v.sku ?? ""))]);
  const skuPaSidan = sidansSkuer.has(skuUtkast);
  const skuUpptagen = l.alla.some(
    (m) => m.wixProductId !== pm.wixProductId && (m.variants ?? []).some((v) => v.sku === skuUtkast),
  );
  if (skuUpptagen) hindra("sku_upptagen");

  // ── Artikeln får inte redan sitta på en annan sida ───────────────────────
  if (a2) {
    const upptagen = l.alla.some(
      (m) => m.wixProductId !== pm.wixProductId && m.wixProductId !== dm.wixProductId
        && aosomArtiklarPaRaden(m).includes(a2),
    );
    if (upptagen) hindra("artikeln_upptagen");
  }

  // ── Wix: sidan, givaren och deras läge ───────────────────────────────────
  if (wp.visible !== true) hindra("behall_ej_publicerad");
  if (wd.visible === true) planeraGivaren(input, l, plan, wp, wd);
  const namn = typeof wp.name === "string" ? wp.name : "";
  const text = typeof wp.plainDescription === "string" ? wp.plainDescription : "";
  for (const a of axlar) {
    const sidans = unika(koordinaterFore.map((k) => k[a] ?? ""));
    if (sidans.some((g) => innehallerOrdet(namn, g))) hindra(`namnet_bar_${kodFor(a)}`);
    if (sidans.some((g) => innehallerOrdet(text, g))) {
      varningar.push(`beskrivningen nämner sidans ${a.toLowerCase()} — läs om texten efter sammanslagningen`);
    }
  }
  if (nyaVarden.includes("Storlek")) {
    varningar.push("beskrivningens mått gäller bara en av storlekarna — skriv om spec-fliken efter sammanslagningen");
  }
  if (axlar.length > 1 && kombinationer > varianter) {
    varningar.push(
      `${kombinationer - varianter} av ${kombinationer} kombinationer finns inte som vara — butiken visar dem som ej valbara`,
    );
  }
  // ☠️ PRISET RÖRS INTE AV SAMMANSLAGNINGEN — MEN SYNKEN TAR ÖVER DET. Den nya
  // varianten följer husets regel från nästa körning (konkurrentpriset gäller
  // bara radens EGEN artikel, och prislåset sitter på raden). För ett utkast är
  // det exakt vad det hade; för en givare med konkurrentpris eller lås är det inte.
  if (dm.prisLast) varningar.push("givarens pris är låst — låset följer inte med, synken räknar om den nya variantens pris");
  if (dm.prisgrupp || dm.konkurrent) {
    varningar.push("givarens pris styrs av konkurrentregeln — efter sammanslagningen följer den nya varianten husets regel");
  }
  if (plan.prisUtkast === null) hindra("utkast_saknar_pris");
  if (varianterAv(wd).length !== 1) hindra("utkast_flera_varianter_i_wix");

  const bilderUtkast = bilderAv(wd);
  if (givarenGerBilder(input, plan)) {
    const f = fordelaGivarensBilder(bilderAv(wp), bilderUtkast, String(wd.name ?? ""), namn, plan.nyttVal, input.bilder);
    if (f.ogiltiga) hindra("bilder_ogiltiga");
    plan.bilderUtkast = f.lista.length;
    plan.bilderOverflow = f.overflow.length;
    plan.bilderGranskas = f.granskas.length;
    // Huvudbilden måste rymmas i galleriet — den blir valets bild.
    const huvud = input.bilder?.length ? bilderUtkast[(input.bilder[0] ?? 0) - 1]?.id : bilderUtkast[0]?.id;
    if (!f.ogiltiga && huvud && !f.lista.includes(huvud)) hindra("galleriet_fullt");
    if (f.overflow.length > 0) {
      varningar.push(`${f.overflow.length} av givarens bilder ryms inte under Wix 15 — de sparas i färgbildstabellen`);
    }
  }
  if (bilderAv(wp).length === 0) hindra("behall_saknar_bilder");
  if (nyaVarden.includes(bildAxel(axlar)) && bilderUtkast.length === 0) hindra("utkast_saknar_bilder");

  // ── Feedraden för den nya varianten ──────────────────────────────────────
  if (!l.rad) hindra("utkast_saknas_i_feeden");
  else if (!harVerkligSeFrakt(l.rad)) hindra("utkast_skickas_inte_till_sverige");
  else if (plan.saldoUtkast === 0) varningar.push("den nya varianten är slutsåld hos Aosom just nu — den syns som slut tills synken ser lager");

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
    // Wix har optioner som mappningen inte känner till — de är inte våra.
    hindra("behall_har_redan_optioner");
    return plan;
  }
  if (optioner.length > AXLAR.length) {
    hindra("flera_optioner_stods_inte");
    return plan;
  }
  if (optioner.some((o) => !arAxel(String(o.name ?? "")))) {
    hindra("annan_axel");
    return plan;
  }

  // ── Utöka: en variant till på en sida som redan är sammanslagen ──────────
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
 * Wix-skrivningen): exakt de planerade axlarna med exakt de planerade valen,
 * rätt antal varianter, varje variant mappningen känner till kvar, och en ny
 * variant med den planerade SKU:n på givarens plats.
 */
function arRedanSkrivenIWix(
  wp: Obj,
  plan: SammanslagningPlan,
  pmV: ProductMappingRecord["variants"],
): boolean {
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

function nyOption(axel: Axel, varden: string[]): Obj {
  return { name: axel, optionRenderType: RENDER, choicesSettings: { choices: varden.map(valBody) } };
}

/** Variantens val, ett per axel, i den form V3 tar emot. */
function valReferenser(axlar: Axel[], val: Koordinat): Obj[] {
  return axlar.map((a) => ({ optionChoiceNames: { optionName: a, choiceName: val[a] ?? "", renderType: RENDER } }));
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

/**
 * Bilderna varje val ska bära: axel → valets namn → Wix-mediernas id, huvud-
 * bilden först.
 *
 * ☠️ HELA LISTAN, INTE FÖRSTA BILDEN (2026-09-30). Kartan bar tidigare bara
 * valets första bild, och återkopplingen skrev `linkedMedia: [första]` på
 * varje val i kartan. En sida vars färger fått alla sina bilder
 * (lib/aosom/fargbilder.ts) hade alltså tappat dem vid nästa sammanslagning.
 */
type BildKarta = Record<string, Record<string, string[]>>;

// ☠️ Kartan slås upp skiftlägesokänsligt, som allt annat i sammanslagningen
// (`lika`). Wix sparar ett nytt val med den delade listans stavning: "Svart och
// röd" blir "Svart och Röd" när butiken redan har det valet. Ett exakt uppslag
// hittade aldrig valet, och körningen föll på "1 val saknar kopplad bild" även
// vid omkörning (B69, B87).
const nyckelFor = (m: Record<string, unknown>, namn: string) =>
  Object.keys(m).find((k) => lika(k, namn));

function bildFor(karta: BildKarta, axel: string, varde: string): string[] | undefined {
  const a = nyckelFor(karta, axel);
  const v = a === undefined ? undefined : nyckelFor(karta[a], varde);
  return a === undefined || v === undefined ? undefined : karta[a][v];
}

/** Sätter ett vals bild. Finns valet redan under en annan stavning skrivs den posten. */
function satt(karta: BildKarta, axel: string, varde: string, idn: string[]): void {
  const m = (karta[nyckelFor(karta, axel) ?? axel] ??= {});
  m[nyckelFor(m, varde) ?? varde] = [...idn];
}

const antalIBildkarta = (karta: BildKarta) =>
  Object.values(karta).reduce((n, m) => n + Object.keys(m).length, 0);

/** Varianten före skrivningen, som återläsningen jämför mot. */
interface Fore {
  id: string;
  sku: string;
  pris: number | null;
  synlig: boolean;
  /** Variantens plats efter skrivningen. */
  val: Koordinat;
}

interface Kontroll {
  ok: boolean;
  skal: string[];
  /** Gamla variant-id → det id varianten har efter skrivningen. */
  idFor: Record<string, string>;
  nyId?: string;
  /** Hur många av valen som ska ha bilder som faktiskt har exakt dem. */
  lankade: number;
}

/** Stämmer Wix med det sammanslagningen skulle skriva? Läser inget själv. */
function kontrollera(
  p: Obj | null,
  plan: SammanslagningPlan,
  fore: Fore[],
  forvantadeBilder: string[],
  bildPerVal: BildKarta,
): Kontroll {
  const skal: string[] = [];
  if (!p) return { ok: false, skal: ["produkten gick inte att läsa"], idFor: {}, lankade: 0 };
  if (p.visible !== true) skal.push("sidan är inte längre publicerad");
  const optioner = optionerAv(p);
  if (!sammaMangd(optioner.map((o) => String(o.name ?? "")), plan.axlar)) skal.push("sidan har inte exakt de väntade axlarna");
  let lankade = 0;
  for (const a of plan.axlar) {
    const val = valAv(optioner.find((o) => o.name === a) ?? {});
    if (!sammaMangd(val.map((c) => String(c.name ?? "")), plan.varden[a] ?? [])) {
      skal.push(`optionen ${a} har inte exakt de väntade valen`);
    }
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
  return {
    ok: skal.length === 0,
    skal,
    idFor,
    nyId: typeof ny?.id === "string" ? ny.id : undefined,
    lankade,
  };
}

/**
 * Kopplar valens bilder på en produkt som redan har optionerna. Samma metod
 * som `linkChoiceMedia`: options med `linkedMedia` + variantsInfo ordagrant,
 * och `visible` med — en variantsInfo-PATCH publicerar annars ett utkast. Val
 * som inte står i kartan lämnas som de är, och ett val i kartan får HELA sin
 * lista (se BildKarta).
 */
async function kopplaValbilder(
  wix: WixAnrop,
  id: string,
  bildPerVal: BildKarta,
): Promise<void> {
  const p = await lasProdukt(wix, id);
  if (!p) throw new Error("produkten gick inte att läsa inför bildkopplingen");
  const optioner = optionerAv(p).map((o) => ({
    ...o,
    choicesSettings: {
      ...((o.choicesSettings as Obj | undefined) ?? {}),
      choices: valAv(o).map((c) => {
        const idn = bildFor(bildPerVal, String(o.name ?? ""), String(c.name ?? ""));
        return idn?.length ? { ...c, linkedMedia: idn.map((id) => ({ id })) } : c;
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
  const pNamn = String(wp.name ?? "");
  const bilderP = bilderAv(wp);
  const bilderD = bilderAv(wd);
  const fordelning = givarenGerBilder(input, plan)
    ? fordelaGivarensBilder(bilderP, bilderD, String(wd.name ?? ""), pNamn, plan.nyttVal, input.bilder)
    : { lista: [], nya: [], overflow: [], granskas: [], ogiltiga: false };
  const valda = fordelning.nya;
  const forvantadeBilder = [...bilderP.map((b) => b.id), ...valda.map((b) => b.id)];

  // Bilderna valen ska bära efteråt. Ett val som redan har kopplade bilder
  // behåller HELA listan — och står med i kartan, så en skrivning som tappat
  // dem kopplas om i återläsningen i stället för att tyst lämnas bildlös.
  const bildPerVal: BildKarta = {};
  for (const o of optionerAv(wp)) {
    for (const c of valAv(o)) {
      const b = lankadeBilder(c);
      if (b.length) satt(bildPerVal, String(o.name ?? ""), String(c.name ?? ""), b);
    }
  }
  const bAx = bildAxel(plan.axlar);
  // Sidans eget värde får sidans huvudbild när bildaxeln är ny på sidan — utom
  // när en annan axel redan bär bilder. En storlekssida som får färg behåller
  // då storlekarnas bilder i butiken (färgen utan bild faller tillbaka på dem).
  const annanAxelHarBilder = Object.entries(bildPerVal).some(([a, m]) => !lika(a, bAx) && Object.keys(m).length > 0);
  const sidansBildval = plan.sidansVal[bAx];
  if (plan.nyaAxlar.includes(bAx) && sidansBildval && !annanAxelHarBilder && !bildFor(bildPerVal, bAx, sidansBildval) && bilderP[0]) {
    // Sidans färg får sina egna foton, inte bara huvudbilden, med butikens
    // ägarregler (lib/aosom/fargbilder.ts): kort och bilder som nämner båda
    // färgerna är gemensamma. Annars hade butiken visat sidans foton också
    // för givarens färg, när den har fler än en bild.
    const egna = bAx === "Färg" && plan.nyttVal[bAx]
      ? [...olankadeAgare(
        bilderP.slice(1).map((b) => ({ id: b.id, alt: b.altText })),
        new Set(),
        [sidansBildval, plan.nyttVal[bAx]!],
        sidansBildval,
      )].filter(([, agare]) => agare === sidansBildval).map(([id]) => id)
      : [];
    satt(bildPerVal, bAx, sidansBildval, [bilderP[0].id, ...egna]);
  }
  const givarensBildval = plan.nyttVal[bAx];
  if (givarensBildval && fordelning.lista.length && !bildFor(bildPerVal, bAx, givarensBildval)) {
    satt(bildPerVal, bAx, givarensBildval, fordelning.lista);
  }

  // Varianterna före skrivningen — återläsningen jämför mot dem. Varje variant
  // behåller sina val på sidans axlar och får sidans värde på de nya.
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
  const fore: Fore[] = (plan.tillstand === "wix_klar"
    ? variantFore.filter((v) => v.sku !== plan.skuUtkast)
    : variantFore
  ).map((v) => ({
    id: String(v.id ?? ""),
    sku: String(v.sku ?? ""),
    pris: prisAv(v),
    synlig: v.visible === true || plan.tillstand === "ny",
    val: koordinatFor(v),
  }));

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
      steg.push(`bilder: ${bilderP.length} → ${nyLista.length}`);
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
      const v1 = variantFore[0];
      const post = l.lager.find((x) => x.variantId === v1.id)!;
      // Utan `linkedMedia` här, med flit: bilden tas emot asynkront och en
      // koppling i samma skrivning kan falla på 404 PRODUCT_MEDIA_NOT_EXIST
      // (uppmätt vid import 2026-06-01). Då hade hela sammanslagningen fallit
      // för en bildfråga. Kopplingen görs i återläsningen, med försök.
      options = plan.axlar.map((a) => nyOption(a, [plan.sidansVal[a]!, plan.nyttVal[a]!]));
      variants = [
        {
          ...utanLasfalt(v1),
          visible: true,
          choices: valReferenser(plan.axlar, fore[0].val),
          physicalProperties: (v1.physicalProperties as Obj | undefined) ?? {},
          ...kostnad(pm.variants?.[0]),
          // Lagret följer VARIANTEN (standardplatsen), inte ett id: schemat för
          // products-with-inventory har bara `quantity` ELLER `inStock` här.
          inventoryItem: { quantity: post.quantity },
        },
        nyVariant,
      ];
    } else {
      // ☠️ OPTIONERNA OCH VARIANTERNA TAS UR GET:EN, INTE BYGGDA FRÅN GRUNDEN.
      // Samma regel som `visible` och `options` i prissynken: ett handbyggt
      // objekt tappar tyst varje fält man inte tänkte på — här valens kopplade
      // bilder och varianternas id. Bara det nya läggs till: ett val på en axel
      // där givaren för in ett nytt värde, och en option för en ny axel.
      options = [
        ...optionerAv(wp).map((o) => {
          const a = String(o.name ?? "") as Axel;
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

    const kropp = {
      product: {
        id: input.behall,
        revision,
        visible: wp.visible,
        options,
        variantsInfo: { variants },
      },
    };
    try {
      await deps.wix("PATCH", `/stores/v3/products-with-inventory/${encodeURIComponent(input.behall)}`, kropp);
      steg.push(`varianter: ${beskrivVal(plan.nyttVal)} tillagd med saldo ${saldoUtkast} (${plan.varianter} varianter)`);
    } catch (e) {
      if (!bytBilder) return svar(false, `variantskrivningen föll: ${felText(e)} — ingenting skrevs`);
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
  const krav = antalIBildkarta(bildPerVal);
  let k = kontrollera(await lasProdukt(deps.wix, input.behall), plan, fore, forvantadeBilder, bildPerVal);
  for (let forsok = 0; k.ok && k.lankade < krav && forsok < KOPPLING_FORSOK; forsok++) {
    try {
      await kopplaValbilder(deps.wix, input.behall, bildPerVal);
    } catch {
      // Ett 404/409 medan bilden fortfarande tas emot — försök igen.
    }
    await vanta(KOPPLING_PAUS_MS);
    k = kontrollera(await lasProdukt(deps.wix, input.behall), plan, fore, forvantadeBilder, bildPerVal);
  }
  if (!k.ok || !k.nyId) {
    return svar(
      false,
      `Wix stämmer inte efter skrivningen (${k.skal.join("; ")}) — mappningen skrevs INTE. `
        + "Synken nollar den nya variantens lager tills den är mappad. Kör om.",
    );
  }
  // ☠️ En färg utan kopplad bild visar sidans huvudbild, alltså fel färg, i
  // butiken och i Google-flödet. Den stoppar därför mappningen, precis som en
  // återläsning som inte stämmer: omkörningen ser `wix_klar` och kopplar igen.
  // En varning som lät körningen gå vidare skrev mappningen och pensionerade
  // givaren, och då hamnade omkörningen i `klar`, som inte kopplar något.
  // Rådet "kör om" gjorde alltså ingenting.
  if (k.lankade < krav) {
    return svar(
      false,
      `${krav - k.lankade} val saknar kopplad bild efter ${KOPPLING_FORSOK} försök — mappningen skrevs INTE. `
        + "Synken nollar den nya variantens lager tills den är mappad. Kör om, så kopplas bilderna igen.",
    );
  }
  // ── 3b: den nya färgens hela bildlista i färgbildstabellen ─────────────
  // Före mappningen, med flit: faller tabellen hamnar omkörningen i
  // `wix_klar` och skriver den igen. Efter mappningen och pensioneringen
  // hade ingen omkörning sett att bilderna utöver Wix 15 aldrig sparades.
  const nyttBildval = plan.nyttVal[bAx];
  if (nyttBildval && fordelning.lista.length > 0) {
    const efterP = await lasProdukt(deps.wix, input.behall);
    const option = optionerAv(efterP).find((o) => lika(String(o.name ?? ""), bAx));
    const val = option ? valAv(option).find((c) => lika(String(c.name ?? ""), nyttBildval)) : undefined;
    const choiceId = typeof val?.choiceId === "string" ? val.choiceId : "";
    if (!choiceId) {
      return svar(false, "den nya färgens val-id gick inte att läsa — färgbildstabellen skrevs INTE, mappningen skrevs INTE. Kör om.");
    }
    const rader = givarRader(input.behall, choiceId, String(val!.name ?? nyttBildval), input.utkast, fordelning);
    try {
      await deps.fargbilder.ersattForVal(input.behall, choiceId, rader);
      const tillbaka = (await deps.fargbilder.lasForProdukt(input.behall)).filter((r) => r.choiceId === choiceId);
      const nyckel = (r: TabellRad) => `${r.ordning}|${r.filId}|${r.plats}`;
      if (tillbaka.map(nyckel).sort().join(",") !== rader.map(nyckel).sort().join(",")) {
        return svar(false, "färgbildstabellen läste inte tillbaka — mappningen skrevs INTE. Kör om.");
      }
    } catch (e) {
      return svar(false, `färgbildstabellen föll: ${felText(e)} — mappningen skrevs INTE. Kör om.`);
    }
    steg.push(
      `färgbilder: ${fordelning.lista.length} i galleriet, ${fordelning.overflow.length} utöver Wix 15, `
        + `${fordelning.granskas.length} att granska (i tabellen)`,
    );
  }

  const lager = await lasLager(deps.wix, input.behall);
  const antal = (id: string | undefined) => lager.find((x) => x.variantId === id)?.quantity;
  const qNy = antal(k.nyId);
  steg.push(`återläst: ${plan.varianter} varianter, ${k.lankade} av ${krav} val med bild, nytt saldo ${qNy ?? "?"}`);

  // ── 4: mappningen på sidan vi behåller ─────────────────────────────────
  const bild = aosomArtikelbild(pm);
  const nuId = (v: MappningsVariant) => {
    const f = fore.find((x) => (!!v.wixVariantId && x.id === v.wixVariantId) || x.sku === v.sku);
    return f ? k.idFor[f.id] : undefined;
  };
  // De befintliga varianterna får sidans värde på de nya axlarna.
  const nyaAxlarsVal: Record<string, string> = {};
  for (const a of plan.nyaAxlar) nyaAxlarsVal[a] = plan.sidansVal[a]!;
  const befintliga = bild.typ === "en"
    ? [{
      ...pm.variants[0],
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
  const nyMappning = {
    supplierVariantId: utkastetsArtikel(dm),
    sku: plan.skuUtkast,
    wixVariantId: k.nyId,
    choices: nyttValSomRad,
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
    !bildEfter || bildEfter.typ !== "flera" || bildEfter.varianter.length !== plan.varianter
    || !bildEfter.varianter.some((v) => v.artikel === utkastetsArtikel(dm))
    || (efter?.variants ?? []).some((v) => plan.axlar.some((a) => !valFor(v, a)))
  ) {
    return svar(false, "mappningen läste inte tillbaka som en sida med en artikel per variant — ingenting är verifierat, kör om");
  }
  steg.push(`mappning: ${plan.varianter} varianter, en artikel per variant (återläst)`);

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
 * Steg 6. Artikeln släpps från givarens rad — den sitter nu som en variant på
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
