// Färgsammanslagning: ett Aosom-utkast blir en FÄRG på en publicerad sida.
//
// VARFÖR DEN FINNS (Leonards fråga 2026-09-27)
//
// Dubblettskärmen hittar utkast som är samma vara som en publicerad sida, bara
// i en annan färg. Att publicera utkastet som en egen sida ger två URL:er för
// samma produkt; att pensionera det slänger en färg vi kan sälja. Det tredje
// svaret är att lägga utkastets artikel som ett färgval på den publicerade
// sidan: en option "Färg" med två val, en variant per färg, och ett val som
// byter huvudbild.
//
// Efter sammanslagningen bär sidan en Aosom-artikel PER VARIANT. Resten av
// koden läser det via lib/aosom/artiklar.ts: synken speglar varje färgs saldo
// och pris för sig, beställningsfilen beställer den färg kunden valde, och
// importens dubblettspärr ser båda artiklarna.
//
// ORDNINGEN
//
//   1. Bilder     utkastets valda bilder läggs till sidans lista, VID SITT ID
//                 (ingen omimport — se CLAUDE.md om wixstatic-adresser).
//   2. Varianter  EN skrivning: optionen, båda varianterna OCH båda lagersaldona
//                 (`products-with-inventory`). Den nya färgen finns alltså
//                 aldrig ett ögonblick med ett lager vi inte satt.
//   3. Återläsning i en separat läsning — varianter, val, kopplade bilder,
//                 synlighet och lager. Stämmer den inte skrivs INGEN mappning.
//   4. Mappningen på sidan vi behåller: en variant per färg, var och en med
//                 sin egen artikel och sitt eget saldo.
//   5. Utkastet pensioneras (`pensioneraDubblett`) — raderas aldrig.
//
// ☠️ HALVGJORT ÄR SÄKERT, OCH DET ÄR MED FLIT. Faller något efter steg 2 har
// Wix en färg som mappningen inte känner till. Synken NOLLAR då den färgens
// lager och räknar den i `okandaVarianter` (jobbet blir rött), och
// beställningsfilen HÅLLER en order på den — ingen kund kan få fel färg. En
// omkörning ser att Wix redan är klart (`wix_klar`) och gör bara det som återstår.
//
// ☠️ PRISET RÖRS INTE. Den nya färgen får utkastets pris som det står i butiken,
// den gamla behåller sitt. Leonards regel: poleringen rör aldrig ett pris.
//
// ☠️ SVARET BÄR ALDRIG ETT ARTIKELNUMMER ELLER EN KOSTNAD. Det går till en
// PUBLIK Actions-logg. Planen säger kundpriser, saldon, färger och bildantal —
// det som redan står på sidan.

import type { ProductMappingRecord } from "../store";
import { redigera, felText, type WixAnrop } from "../polish/skrivplan";
import { harVerkligSeFrakt, type AosomRow } from "./feed";
import { synligtSaldo } from "./sync";
import { aosomArtikelbild, aosomArtiklarPaRaden, radensArtikel } from "./artiklar";
import { pensioneraDubblett } from "./remap";

type Obj = Record<string, unknown>;

/** Optionens namn. Samma ord som AE-sidornas färgval. */
export const OPTION_NAMN = "Färg";
const RENDER = "TEXT_CHOICES";

/** Hur länge återläsningen väntar på att valens bilder kopplats (ms per försök). */
const KOPPLING_PAUS_MS = 2500;
const KOPPLING_FORSOK = 8;

export interface SammanslagningInput {
  /** Den PUBLICERADE sidan som behålls. */
  behall: string;
  /** Utkastet vars artikel blir den nya färgen. */
  utkast: string;
  /** Färgen sidan redan har, t.ex. "Vit". */
  fargBehall: string;
  /** Utkastets färg, t.ex. "Grå". */
  fargUtkast: string;
  /** Den nya variantens SKU. Utelämnad = sidans SKU + färgen. */
  sku?: string;
  /**
   * Vilka av utkastets bilder som följer med, 1-baserat i utkastets ordning.
   * Default [1]: huvudbilden, som i mätningen 2026-08-27 var ren på 30 av 30.
   *
   * ☠️ BARA GRANSKADE BILDER. 46 % av feedens bilder bär tysk text inbränd, och
   * en del bär husmärkets logotyp. Utkastet är opolerat — ingen har tittat på
   * dess bilder. Lägg bara till en bild du SETT.
   */
  bilder?: number[];
}

export interface SammanslagningDeps {
  wix: WixAnrop;
  getMapping: (wixProductId: string) => Promise<ProductMappingRecord | null>;
  listMappings: () => Promise<ProductMappingRecord[]>;
  saveMapping: (m: ProductMappingRecord) => Promise<void>;
  fetchFeed: () => Promise<AosomRow[]>;
  now?: () => number;
  vanta?: (ms: number) => Promise<void>;
}

export type Tillstand = "ny" | "wix_klar" | "klar";

/** Planen — det som går till svaret, alltså till en publik logg. */
export interface SammanslagningPlan {
  tillstand: Tillstand | null;
  hinder: string[];
  varningar: string[];
  behall: string;
  utkast: string;
  fargBehall: string;
  fargUtkast: string;
  skuBehall: string | null;
  skuUtkast: string;
  /** Kundpriserna i butiken — redan publika. Rörs inte av sammanslagningen. */
  prisBehall: number | null;
  prisUtkast: number | null;
  /** Saldot sidan har i dag, och det synliga saldot den nya färgen får. */
  saldoBehall: number | null;
  saldoUtkast: number | null;
  bilderBehall: number;
  bilderUtkast: number;
}

export interface SammanslagningSvar {
  ok: boolean;
  torrkorning: boolean;
  plan: SammanslagningPlan;
  steg: string[];
  fel?: string;
}

// ── läsning ─────────────────────────────────────────────────────────────────

/** Allt som läses före planen. Exporterad för testerna. */
export interface SammanslagningLast {
  pm: ProductMappingRecord | null;
  dm: ProductMappingRecord | null;
  alla: ProductMappingRecord[];
  rad: AosomRow | undefined;
  wp: Obj | null;
  wd: Obj | null;
  lager: { id: string; variantId?: string; quantity?: number }[];
}

const FALT = "fields=VARIANT_OPTION_CHOICE_NAMES&fields=MEDIA_ITEMS_INFO&fields=MERCHANT_DATA&fields=PLAIN_DESCRIPTION";

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
  return { pm, dm, alla, rad: artikel ? feed.find((r) => r.sku === artikel) : undefined, wp, wd, lager };
}

// ── hjälpare ────────────────────────────────────────────────────────────────

/**
 * Utkastets artikel. Efter pensioneringen är radens `supplierProductId` tömt
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

/** ASCII-slug för en SKU: å/ä → a, ö → o, allt annat bindestreck. */
export function fargSlug(farg: string): string {
  return farg
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function innehallerOrdet(text: string, ord: string): boolean {
  const t = ` ${text.toLowerCase().replace(/[^a-zåäöé0-9]+/g, " ")} `;
  const o = ord.toLowerCase().replace(/[^a-zåäöé0-9]+/g, " ").trim();
  return !!o && t.includes(` ${o} `);
}

function giltigFarg(f: string): boolean {
  return f.length >= 2 && f.length <= 30 && /^[A-Za-zÅÄÖåäöÉé][A-Za-zÅÄÖåäöÉé /-]*$/.test(f);
}

function altFor(namn: string, farg: string, n: number): string {
  const bas = `${namn} i färgen ${farg.toLowerCase()}`;
  return n === 1 ? bas : `${bas}, bild ${n}`;
}

// ── planen ──────────────────────────────────────────────────────────────────

/**
 * Räknar fram planen ur det som lästs. Ren — inga anrop.
 *
 * Hindren ska stoppa varje läge där sammanslagningen kunde ge fel artikel,
 * fel pris, fel bild eller en halv sida. Varningarna stoppar ingenting men ska
 * läsas.
 */
export function planeraSammanslagning(input: SammanslagningInput, l: SammanslagningLast): SammanslagningPlan {
  const hinder: string[] = [];
  const varningar: string[] = [];
  const fargBehall = input.fargBehall.trim();
  const fargUtkast = input.fargUtkast.trim();

  // Sidans egen variant: på mappningens id, annars på mappningens SKU, annars
  // den enda. Efter en halv körning har Wix två varianter, och ordningen
  // mellan dem är inget att lita på.
  const pmV = (l.pm?.variants ?? [])[0];
  const wpVar = varianterAv(l.wp);
  const v1 = wpVar.find((v) => !!pmV?.wixVariantId && v.id === pmV.wixVariantId)
    ?? wpVar.find((v) => !!pmV?.sku && v.sku === pmV.sku)
    ?? (wpVar.length === 1 ? wpVar[0] : undefined);
  const skuBehall = typeof v1?.sku === "string" ? v1.sku : (pmV?.sku ?? null);
  const skuUtkast = (input.sku ?? "").trim() || (skuBehall ? `${skuBehall}-${fargSlug(fargUtkast)}` : "");

  const plan: SammanslagningPlan = {
    tillstand: null,
    hinder,
    varningar,
    behall: input.behall,
    utkast: input.utkast,
    fargBehall,
    fargUtkast,
    skuBehall,
    skuUtkast,
    prisBehall: prisAv(v1),
    prisUtkast: prisAv(varianterAv(l.wd)[0]),
    saldoBehall: null,
    saldoUtkast: l.rad && harVerkligSeFrakt(l.rad) ? synligtSaldo(l.rad.qty) : null,
    bilderBehall: bilderAv(l.wp).length,
    bilderUtkast: 0,
  };

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

  if (pm.supplier !== "aosom" || !radensArtikel(pm)) hinder.push("behall_ej_aosom");
  if (dm.supplier !== "aosom") hinder.push("utkast_ej_aosom");
  const a1 = radensArtikel(pm);
  const a2 = utkastetsArtikel(dm);
  if (!a2) hinder.push("utkast_saknar_artikel");
  if (a1 && a2 && a1 === a2) hinder.push("samma_artikel");

  // ── Redan klart? ─────────────────────────────────────────────────────────
  const bild = aosomArtikelbild(pm);
  if (bild.typ === "flera") {
    const artiklar = new Set(bild.varianter.map((v) => v.artikel));
    if (artiklar.size === 2 && artiklar.has(a1) && artiklar.has(a2)) {
      plan.tillstand = "klar";
      return plan;
    }
    hinder.push("behall_redan_sammanslagen_med_annan");
    return plan;
  }
  if (bild.typ === "tvetydig") {
    hinder.push("behall_tvetydig");
    return plan;
  }
  if ((pm.variants ?? []).length !== 1) hinder.push("behall_flera_varianter");
  if ((dm.variants ?? []).length !== 1) hinder.push("utkast_flera_varianter");

  // ── Färgerna och SKU:n ───────────────────────────────────────────────────
  if (!giltigFarg(fargBehall) || !giltigFarg(fargUtkast)) hinder.push("farg_ogiltig");
  if (fargBehall.toLowerCase() === fargUtkast.toLowerCase()) hinder.push("farg_lika");
  if (!/^FP-[a-z0-9-]{3,90}$/.test(skuUtkast) || redigera(skuUtkast) !== skuUtkast) hinder.push("sku_ogiltig");
  if (skuUtkast && skuUtkast === skuBehall) hinder.push("sku_lika");
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

  // ── Wix: sidan, utkastet och deras läge ──────────────────────────────────
  if (wp.visible !== true) hinder.push("behall_ej_publicerad");
  if (wd.visible === true) hinder.push("utkast_publicerat");
  if (typeof wp.name === "string" && innehallerOrdet(wp.name, fargBehall)) hinder.push("namnet_bar_farg");
  if (typeof wp.plainDescription === "string" && innehallerOrdet(wp.plainDescription, fargBehall)) {
    varningar.push("beskrivningen nämner sidans färg — läs om texten efter sammanslagningen");
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

  // ── Feedraden för den nya färgen ─────────────────────────────────────────
  if (!l.rad) hinder.push("utkast_saknas_i_feeden");
  else if (!harVerkligSeFrakt(l.rad)) hinder.push("utkast_skickas_inte_till_sverige");
  else if (plan.saldoUtkast === 0) varningar.push("den nya färgen är slutsåld hos Aosom just nu — den syns som slut tills synken ser lager");

  // ── Tillståndet i Wix ────────────────────────────────────────────────────
  const optioner = optionerAv(wp);
  const varianter = varianterAv(wp);
  const pmVariant = (pm.variants ?? [])[0];
  if (optioner.length === 0 && varianter.length === 1) {
    if (pmVariant?.wixVariantId && varianter[0].id !== pmVariant.wixVariantId) hinder.push("behall_variant_matchar_inte");
    plan.tillstand = "ny";
    const post = l.lager.find((x) => x.variantId === varianter[0].id);
    if (!post || typeof post.quantity !== "number") hinder.push("behall_saknar_lagerrad");
    else plan.saldoBehall = post.quantity;
  } else if (arRedanSkrivenIWix(wp, fargBehall, fargUtkast, skuBehall, skuUtkast, pmVariant?.wixVariantId)) {
    plan.tillstand = "wix_klar";
  } else {
    hinder.push("behall_har_redan_optioner");
  }
  return plan;
}

/**
 * Wix bär redan sammanslagningen (en tidigare körning föll efter steg 2): en
 * option med exakt de två färgerna, och två varianter — sidans egen, med
 * oförändrad SKU, och den nya med den planerade SKU:n.
 */
function arRedanSkrivenIWix(
  wp: Obj,
  fargBehall: string,
  fargUtkast: string,
  skuBehall: string | null,
  skuUtkast: string,
  v1Id: string | undefined,
): boolean {
  const optioner = optionerAv(wp);
  const varianter = varianterAv(wp);
  if (optioner.length !== 1 || optioner[0].name !== OPTION_NAMN || varianter.length !== 2) return false;
  const namn = valAv(optioner[0]).map((c) => String(c.name ?? ""));
  if (namn.length !== 2 || !namn.includes(fargBehall) || !namn.includes(fargUtkast)) return false;
  const skus = varianter.map((v) => String(v.sku ?? ""));
  const harEgen = varianter.some((v) => v.id === v1Id) || (!!skuBehall && skus.includes(skuBehall));
  return harEgen && skus.includes(skuUtkast);
}

// ── skrivningen ─────────────────────────────────────────────────────────────

function valBody(farg: string): Obj {
  return { choiceType: "CHOICE_TEXT", name: farg };
}

function valReferens(farg: string): Obj[] {
  return [{ optionChoiceNames: { optionName: OPTION_NAMN, choiceName: farg, renderType: RENDER } }];
}

/** Variantobjektet ur GET:en, med bara det ändrat vi menar. Aldrig byggt från grunden. */
function utanLasfalt(v: Obj): Obj {
  const ut: Obj = { ...v };
  delete ut.inventoryStatus;
  delete ut.media;
  return ut;
}

interface Kontroll {
  ok: boolean;
  skal: string[];
  v1Id?: string;
  v2Id?: string;
  lankade: number;
}

/** Stämmer Wix med det sammanslagningen skulle skriva? Läser inget själv. */
function kontrollera(p: Obj | null, plan: SammanslagningPlan, forvantadeBilder: string[]): Kontroll {
  const skal: string[] = [];
  if (!p) return { ok: false, skal: ["produkten gick inte att läsa"], lankade: 0 };
  if (p.visible !== true) skal.push("sidan är inte längre publicerad");
  const optioner = optionerAv(p);
  const val = optioner.length === 1 && optioner[0].name === OPTION_NAMN ? valAv(optioner[0]) : [];
  if (val.length !== 2) skal.push("optionen Färg har inte exakt två val");
  const lankade = val.filter((c) => ((c.linkedMedia ?? []) as unknown[]).length > 0).length;
  const varianter = varianterAv(p);
  const v1 = varianter.find((v) => v.sku === plan.skuBehall);
  const v2 = varianter.find((v) => v.sku === plan.skuUtkast);
  if (varianter.length !== 2 || !v1 || !v2) skal.push("varianterna stämmer inte (antal eller SKU)");
  if (v1 && v1.visible !== true) skal.push("sidans variant är inte synlig");
  if (v2 && v2.visible !== true) skal.push("den nya färgen är inte synlig");
  if (v1 && plan.prisBehall !== null && prisAv(v1) !== plan.prisBehall) skal.push("sidans pris har ändrats");
  if (v2 && plan.prisUtkast !== null && prisAv(v2) !== plan.prisUtkast) skal.push("den nya färgens pris stämmer inte");
  const idn = new Set(bilderAv(p).map((b) => b.id));
  if (forvantadeBilder.some((id) => !idn.has(id))) skal.push("bildlistan saknar bilder");
  return {
    ok: skal.length === 0,
    skal,
    v1Id: typeof v1?.id === "string" ? v1.id : undefined,
    v2Id: typeof v2?.id === "string" ? v2.id : undefined,
    lankade,
  };
}

/**
 * Kopplar valens bilder på en produkt som redan har optionen. Samma metod som
 * `linkChoiceMedia`: options med `linkedMedia` + variantsInfo ordagrant, och
 * `visible` med — en variantsInfo-PATCH publicerar annars ett utkast.
 */
async function kopplaValbilder(
  wix: WixAnrop,
  id: string,
  bildPerFarg: Record<string, string>,
): Promise<void> {
  const p = await lasProdukt(wix, id);
  if (!p) throw new Error("produkten gick inte att läsa inför bildkopplingen");
  const optioner = optionerAv(p).map((o) => ({
    ...o,
    choicesSettings: {
      ...((o.choicesSettings as Obj | undefined) ?? {}),
      choices: valAv(o).map((c) => {
        const bildId = bildPerFarg[String(c.name ?? "")];
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
    // Sidan är klar — men en körning som föll mellan steg 4 och 5 har lämnat
    // utkastet opensionerat. Det tas om här, annars står det kvar i kön.
    const dm = l.dm!;
    if (dm.draftStatus === "rejected" && !radensArtikel(dm)) {
      steg.push("redan sammanslagen — ingenting att göra");
      return svar(true);
    }
    if (!apply) {
      steg.push("sidan är sammanslagen, men utkastet är inte pensionerat — kör `byt`");
      return svar(true);
    }
    return pensionera(dm, input, deps, steg, svar);
  }
  if (!apply) return svar(true);

  const pm = l.pm!;
  const dm = l.dm!;
  const wp = l.wp!;
  const wd = l.wd!;
  const pNamn = String(wp.name ?? "");
  const bilderP = bilderAv(wp);
  const bilderD = bilderAv(wd);
  const valda = (input.bilder?.length ? input.bilder : [1]).map((n, i) => ({
    id: bilderD[n - 1].id,
    altText: altFor(pNamn, plan.fargUtkast, i + 1),
  }));
  const bildPerFarg: Record<string, string> = {
    [plan.fargBehall]: bilderP[0].id,
    [plan.fargUtkast]: valda[0].id,
  };
  const forvantadeBilder = [...bilderP.map((b) => b.id), ...valda.map((b) => b.id)];

  // ── 1 + 2: Wix, bara från tillståndet "ny" ─────────────────────────────
  if (plan.tillstand === "ny") {
    const v1 = varianterAv(wp)[0];
    const post = l.lager.find((x) => x.variantId === v1.id)!;
    const saldoUtkast = plan.saldoUtkast ?? 0;

    const nyLista = [...bilderP, ...valda.filter((b) => !bilderP.some((x) => x.id === b.id))];
    const efterBilder = produktAv(await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(input.behall)}`, {
      product: { revision: wp.revision, media: { itemsInfo: { items: nyLista } } },
      fieldMask: { paths: ["media"] },
    }));
    steg.push(`bilder: ${bilderP.length} → ${nyLista.length}`);

    const v2Kalla = varianterAv(wd)[0] ?? {};
    const kropp = {
      product: {
        id: input.behall,
        revision: efterBilder?.revision ?? wp.revision,
        visible: wp.visible,
        options: [{
          name: OPTION_NAMN,
          optionRenderType: RENDER,
          // Utan `linkedMedia` här, med flit: bilden tas emot asynkront och en
          // koppling i samma skrivning kan falla på 404 PRODUCT_MEDIA_NOT_EXIST
          // (uppmätt vid import 2026-06-01). Då hade hela sammanslagningen
          // fallit för en bildfråga. Kopplingen görs i återläsningen, med försök.
          choicesSettings: { choices: [valBody(plan.fargBehall), valBody(plan.fargUtkast)] },
        }],
        variantsInfo: {
          variants: [
            {
              ...utanLasfalt(v1),
              visible: true,
              choices: valReferens(plan.fargBehall),
              physicalProperties: (v1.physicalProperties as Obj | undefined) ?? {},
              inventoryItem: { id: post.id, quantity: post.quantity },
            },
            {
              visible: true,
              sku: plan.skuUtkast,
              price: { actualPrice: { amount: String(plan.prisUtkast) } },
              ...(v2Kalla.revenueDetails ? { revenueDetails: v2Kalla.revenueDetails } : {}),
              choices: valReferens(plan.fargUtkast),
              physicalProperties: {},
              inventoryItem: { quantity: saldoUtkast },
            },
          ],
        },
      },
    };
    try {
      await deps.wix("PATCH", `/stores/v3/products-with-inventory/${encodeURIComponent(input.behall)}`, kropp);
      steg.push(`varianter: färgen ${plan.fargUtkast} tillagd med saldo ${saldoUtkast}`);
    } catch (e) {
      // ☠️ BILDERNA RULLAS TILLBAKA. Utan varianterna visar sidan den andra
      // färgens bilder på en produkt som bara säljs i den ena.
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
  let k = kontrollera(await lasProdukt(deps.wix, input.behall), plan, forvantadeBilder);
  for (let forsok = 0; k.ok && k.lankade < 2 && forsok < KOPPLING_FORSOK; forsok++) {
    try {
      await kopplaValbilder(deps.wix, input.behall, bildPerFarg);
    } catch {
      // Ett 404/409 medan bilden fortfarande tas emot — försök igen.
    }
    await vanta(KOPPLING_PAUS_MS);
    k = kontrollera(await lasProdukt(deps.wix, input.behall), plan, forvantadeBilder);
  }
  if (!k.ok) {
    return svar(
      false,
      `Wix stämmer inte efter skrivningen (${k.skal.join("; ")}) — mappningen skrevs INTE. `
        + "Synken nollar den nya färgens lager tills den är mappad. Kör om.",
    );
  }
  if (k.lankade < 2) steg.push(`⚠️ ${2 - k.lankade} färgval saknar kopplad bild — kör om för att koppla`);
  const lager = await lasLager(deps.wix, input.behall);
  const q1 = lager.find((x) => x.variantId === k.v1Id)?.quantity;
  const q2 = lager.find((x) => x.variantId === k.v2Id)?.quantity;
  steg.push(`återläst: två varianter, ${k.lankade} kopplade bilder, saldo ${q1 ?? "?"} / ${q2 ?? "?"}`);

  // ── 4: mappningen på sidan vi behåller ─────────────────────────────────
  const pv = pm.variants[0];
  const dv = dm.variants[0];
  const ny: ProductMappingRecord = {
    ...pm,
    ...(typeof q1 === "number" && typeof q2 === "number"
      ? { aosomSyncedQty: q1 + q2, aosomSyncedAt: new Date(now()).toISOString() }
      : {}),
    variants: [
      {
        ...pv,
        wixVariantId: k.v1Id,
        choices: { [OPTION_NAMN]: plan.fargBehall },
        aosomSyncedQty: q1,
      },
      {
        supplierVariantId: utkastetsArtikel(dm),
        sku: plan.skuUtkast,
        wixVariantId: k.v2Id,
        choices: { [OPTION_NAMN]: plan.fargUtkast },
        costUsd: dv.costUsd,
        landedCostSek: dv.landedCostSek,
        grossSek: plan.prisUtkast ?? dv.grossSek,
        ...(dv.shipFrom ? { shipFrom: dv.shipFrom } : {}),
        aosomSyncedQty: q2,
      },
    ],
  };
  await deps.saveMapping(ny);
  const efter = await deps.getMapping(input.behall);
  const bildEfter = efter ? aosomArtikelbild(efter) : null;
  if (!bildEfter || bildEfter.typ !== "flera" || bildEfter.varianter.length !== 2) {
    return svar(false, "mappningen läste inte tillbaka som en sida med två färger — ingenting är verifierat, kör om");
  }
  steg.push("mappning: två färger, en artikel per färg (återläst)");

  // ── 5: utkastet pensioneras ───────────────────────────────────────────
  return pensionera(dm, input, deps, steg, svar);
}

/**
 * Steg 5. Artikeln släpps från utkastets rad — den sitter nu som färg på sidan
 * vi behåller, och importens dubblettspärr ser den där (lib/aosom/artiklar.ts).
 * Utkastet RADERAS inte: ett osynligt utkast kostar ingenting, och en radering
 * går inte att ångra.
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
    return svar(false, "sidan är sammanslagen men utkastet läste inte tillbaka som pensionerat — kör om");
  }
  steg.push("utkast: pensionerat (rejected), inte raderat");
  return svar(true);
}
