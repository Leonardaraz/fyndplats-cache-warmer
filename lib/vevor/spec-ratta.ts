// VEVOR-utkast som importerades utan specifikation får sin specifikationsflik
// i efterhand (Leonard 2026-10-30: "Ja väldigt noggrant").
//
// Läsaren kände bara VEVOR:s gamla sidmall fram till 2026-10-30, och en av fem
// avläsningar saknade därför specifikationen (CLAUDE.md, "VEVOR visar två
// sidmallar"). De utkast som importerades ur en sådan avläsning har ingen flik
// "Tekniska specifikationer". När läsaren läst sidan igen bär avläsningen
// specifikationen (`specKalla` satt), och den här modulen lägger till fliken
// som importen hade lagt den.
//
// Fliken byggs med importens egna funktioner, så att raderna blir desamma som
// för en artikel som importeras i dag:
//
//   en artikel   `specifikation(a)`: tabellen och variantens egna värden
//   en familj    `familjensSpec`: alla artiklars tabeller utan axlarnas rader,
//                en rad som skiljer med varje varians värde, och en axel med
//                samma värde för alla som en rad (constant-axes.ts)
//
// Skrivningen rör bara `plainDescription` (fältmask). Saknas fliken läggs den
// sist med `appendTabSections`, som importen, och den gamla texten står kvar.
//
// En familj vars flik visar fel (ankarets värde på en rad som skiljer mellan
// varianterna, så som importen byggde fliken fram till 2026-10-30) får fliken
// utbytt (`byt`): allt från rubriken till nästa rubrik ersätts, och texten
// före och efter står kvar.
//
// Sju egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara opolerade, dolda VEVOR-utkast. En polerad eller publicerad sida
//    rörs aldrig: där har en människa skrivit texten.
// 2. ☠️ En enskild artikel som redan har fliken rörs inte. Saknar den någon rad
//    räknas den och lämnas (`flik_utan_rader`). Bara en familj får fliken
//    utbytt, och bara när sidan har exakt en sådan flik.
// 3. ☠️ Avläsningen ska vara gjord med den nya läsaren (`specKalla` satt), för
//    en familj på varje artikel. Annars kan en tom specifikation betyda att
//    läsaren inte såg den.
// 4. ☠️ Varje artikels avläsning måste finnas för en familj, så att varje
//    varians värde och en axel med samma värde för alla räknas på alla.
// 5. ☠️ Sidan läses färskt före skrivningen och planeras om. Har texten eller
//    synligheten ändrats sedan planen skrivs ingenting på den.
// 6. ☠️ Återläsning efter skrivningen, tills revisionen gått fram: sidan är
//    fortfarande dold, fliken finns och varje rad finns. En tillagd flik:
//    den gamla texten står kvar. En utbytt flik: hela texten är planens.
//    Första avvikelse stoppar körningen.
// 7. ☠️ Svaret bär bara Wix-id och antal, aldrig artikelnummer eller text:
//    loggen är publik.

import type { ProductMappingRecord } from "@/lib/store";
import { mappingSupplier, vevorSkuOf } from "@/lib/store/supplier";
import { appendTabSections, buildTabSections, descriptionHasSection } from "@/lib/import/tabs";
import { mergeConstantAxisSpecs, splitConstantAxes } from "@/lib/import/constant-axes";
import { felText, type WixAnrop } from "@/lib/polish/skrivplan";
import { egenskaperFor, familjensSpec } from "./familj";
import type { Avlasning } from "./lager";
import { specifikation } from "./to-product";

type Obj = Record<string, unknown>;

export const SPEC_FLIK = "Tekniska specifikationer";

export type SpecHinder =
  | "publicerad"
  | "polerad"
  | "avlasning_saknas"
  | "ej_omlast"
  | "flik_utan_rader"
  | "las_fel";

export const SPEC_HINDER: readonly SpecHinder[] = [
  "publicerad",
  "polerad",
  "avlasning_saknas",
  "ej_omlast",
  "flik_utan_rader",
  "las_fel",
];

export interface SpecRad {
  label: string;
  value: string;
}

/** Sidans läge i Wix. */
export interface SpecProdukt {
  id: string;
  revision: string;
  synlig: boolean;
  beskrivning: string;
}

export type SpecPlan =
  | { typ: "hinder"; hinder: SpecHinder }
  /** Avläsningen har ingen specifikation: det finns inget att lägga till. */
  | { typ: "tom" }
  | { typ: "redan_ratt" }
  /** Fliken saknas och läggs sist. */
  | { typ: "ratta"; rader: SpecRad[]; html: string }
  /** En familjs flik visar fel och byts ut. */
  | { typ: "byt"; rader: SpecRad[]; html: string };

/** Är raden ett VEVOR-utkast som kan rättas? Polerad och publicerad räknas som hinder, inte här. */
export function arVevorRad(rad: ProductMappingRecord): boolean {
  return mappingSupplier(rad) === "vevor" && !rad.wixRaderad && !!rad.wixProductId;
}

/**
 * Raderna i fliken, som importen bygger dem, eller hindret. En artikel: tabellen
 * och variantens egna värden. En familj: ankarets tabell utan axlarna, och en
 * axel med samma värde för alla som en rad.
 */
export function specRader(
  rad: ProductMappingRecord,
  avlasningar: ReadonlyMap<string, Avlasning>,
): SpecRad[] | "avlasning_saknas" | "ej_omlast" {
  const ankarSku = vevorSkuOf(rad);
  const ankare = ankarSku ? avlasningar.get(ankarSku) : undefined;
  if (!ankare) return "avlasning_saknas";
  if (ankare.specKalla === undefined) return "ej_omlast";
  const tillRader = (r: Record<string, string>) => Object.entries(r).map(([label, value]) => ({ label, value }));
  if (rad.variants.length <= 1) return tillRader(specifikation(ankare));

  const medlemmar = rad.variants.map((v) => avlasningar.get(v.supplierVariantId));
  if (medlemmar.some((m) => !m)) return "avlasning_saknas";
  // ☠️ Varje artikel ska vara läst med den nya läsaren: en tom tabell på en
  // gammal avläsning hade annars sett ut som att raden saknas för den varianten.
  if ((medlemmar as Avlasning[]).some((m) => m.specKalla === undefined)) return "ej_omlast";
  const axlar = Object.keys(egenskaperFor(ankare));
  const varianter = (medlemmar as Avlasning[]).map((m) => {
    const v = egenskaperFor(m);
    return { options: Object.fromEntries(axlar.map((k) => [k, v[k]])) as Record<string, string> };
  });
  return mergeConstantAxisSpecs(tillRader(familjensSpec(medlemmar as Avlasning[], axlar)), splitConstantAxes(varianter).specs);
}

/** Text utan taggar och entiteter, med mellanslagen rensade. Wix skriver om markupen när den sparas. */
export function normText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Raderna som inte står i texten. */
export function saknadeRader(beskrivning: string, rader: readonly SpecRad[]): SpecRad[] {
  const text = normText(beskrivning);
  return rader.filter((r) => !text.includes(`${normText(r.label)}: ${normText(r.value)}`));
}

/** Specifikationsflikens rubrik, med eller utan attribut. */
const SPEC_RUBRIK = /<h2[^>]*>\s*Tekniska\s+specifikationer\s*<\/h2>/gi;

/**
 * Beskrivningen med specifikationsfliken utbytt: allt från rubriken till nästa
 * `<h2` (eller slutet) ersätts. null när sidan inte har exakt en sådan flik.
 */
export function bytSpecFlik(beskrivning: string, flikHtml: string): string | null {
  const traffar = [...beskrivning.matchAll(SPEC_RUBRIK)];
  if (traffar.length !== 1) return null;
  const start = traffar[0].index!;
  const efterRubrik = start + traffar[0][0].length;
  const nasta = beskrivning.slice(efterRubrik).search(/<h2[\s>]/i);
  const slut = nasta < 0 ? beskrivning.length : efterRubrik + nasta;
  return `${beskrivning.slice(0, start)}<h2>${SPEC_FLIK}</h2>${flikHtml}${beskrivning.slice(slut)}`;
}

/** Planen för en sida. Ren: läsningarna görs av anroparen. */
export function planeraSpec(
  rad: ProductMappingRecord,
  produkt: SpecProdukt,
  avlasningar: ReadonlyMap<string, Avlasning>,
): SpecPlan {
  if (produkt.synlig) return { typ: "hinder", hinder: "publicerad" };
  if (rad.needsAiPolish !== true || rad.draftStatus === "published") return { typ: "hinder", hinder: "polerad" };
  const rader = specRader(rad, avlasningar);
  if (typeof rader === "string") return { typ: "hinder", hinder: rader };
  if (rader.length === 0) return { typ: "tom" };
  const sektioner = buildTabSections({ specs: rader, packageContents: [], faq: [], careHtml: null });
  if (descriptionHasSection(produkt.beskrivning, SPEC_FLIK)) {
    if (saknadeRader(produkt.beskrivning, rader).length === 0) return { typ: "redan_ratt" };
    if (rad.variants.length <= 1) return { typ: "hinder", hinder: "flik_utan_rader" };
    const html = bytSpecFlik(produkt.beskrivning, sektioner[0].html);
    return html === null ? { typ: "hinder", hinder: "flik_utan_rader" } : { typ: "byt", rader, html };
  }
  const { html } = appendTabSections(produkt.beskrivning, sektioner);
  return { typ: "ratta", rader, html };
}

/** Avvikelserna efter skrivningen. Tom lista = sidan är som planen. */
export function kontrolleraSpec(
  fore: SpecProdukt,
  efter: SpecProdukt,
  plan: Extract<SpecPlan, { typ: "ratta" | "byt" }>,
): string[] {
  const fel: string[] = [];
  if (efter.synlig !== fore.synlig) fel.push("synligheten ändrades");
  if (!descriptionHasSection(efter.beskrivning, SPEC_FLIK)) fel.push("fliken saknas");
  const saknas = saknadeRader(efter.beskrivning, plan.rader).length;
  if (saknas > 0) fel.push(`${saknas} rader saknas`);
  if (plan.typ === "ratta") {
    if (!normText(efter.beskrivning).startsWith(normText(fore.beskrivning))) fel.push("den gamla texten ändrades");
  } else if (normText(efter.beskrivning) !== normText(plan.html)) {
    // ☠️ En utbytt flik: hela texten ska vara planens, så att varken texten
    // runt fliken eller en gammal rad står kvar eller försvinner.
    fel.push("texten är inte planens");
  }
  return fel;
}

// ── Wix ─────────────────────────────────────────────────────────────────────

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});

function tolka(p: Obj): SpecProdukt | null {
  if (typeof p.id !== "string" || p.revision === undefined || p.revision === null) return null;
  // ☠️ `plainDescription` finns bara i projektionen när den begärs. Saknas
  // fältet gick det inte att läsa, och då är sidan oläst, inte tom.
  if (typeof p.plainDescription !== "string") return null;
  return { id: p.id, revision: String(p.revision), synlig: p.visible === true, beskrivning: p.plainDescription };
}

/** Sidorna i Wix, hundra per anrop. En sida som saknas i svaret saknas i kartan. */
export async function lasSidor(wix: WixAnrop, idn: readonly string[]): Promise<Map<string, SpecProdukt>> {
  const ut = new Map<string, SpecProdukt>();
  const unika = [...new Set(idn)];
  for (let i = 0; i < unika.length; i += 100) {
    const del = unika.slice(i, i + 100);
    const svar = obj(
      await wix("POST", "/stores/v3/products/search", {
        search: { filter: { id: { $in: del } }, cursorPaging: { limit: 100 } },
        fields: ["PLAIN_DESCRIPTION"],
      }),
    );
    const produkter = Array.isArray(svar.products) ? (svar.products as unknown[]) : null;
    if (!produkter) throw new Error("produktsökningen svarade utan products");
    for (const p of produkter) {
      const t = tolka(obj(p));
      // ☠️ Bara sidor vi frågade efter: en träff utanför betyder att filtret inte bet.
      if (t && del.includes(t.id)) ut.set(t.id, t);
      else if (t) throw new Error("produktsökningen svarade med en sida utanför frågan");
    }
  }
  return ut;
}

/** En sida, färskt. null vid 404. */
export async function lasSida(wix: WixAnrop, id: string): Promise<SpecProdukt | null> {
  try {
    const svar = obj(await wix("GET", `/stores/v3/products/${encodeURIComponent(id)}?fields=PLAIN_DESCRIPTION`));
    return tolka(obj(svar.product));
  } catch (e) {
    if (/Wix 404/.test(felText(e))) return null;
    throw e;
  }
}

// ── Körningen ───────────────────────────────────────────────────────────────

export interface SpecDeps {
  wix: WixAnrop;
  /** VEVOR-raderna (Store.listMappingsMedPrefix). */
  mappningar(): Promise<ProductMappingRecord[]>;
  avlasningar(skus: string[]): Promise<Map<string, Avlasning>>;
  vanta?: (ms: number) => Promise<void>;
  klocka?: () => number;
}

export interface SpecVal {
  dryRun: boolean;
  /** Planens antal sidor att rätta. Krävs för en skarp körning; fler än så skrivs inte. */
  bekrafta: number | null;
  /** Bara de här sidorna (Wix-id), när det finns några. */
  idn?: string[];
  budgetMs: number;
}

export interface SpecSvar {
  dryRun: boolean;
  utkast: number;
  /** Sidor att skriva: fliken saknas eller (en familj) visar fel. */
  attRatta: number;
  /** Av dem: familjer vars flik byts ut. */
  attByta: number;
  redanRatt: number;
  /** Avläsningen saknar specifikation också med den nya läsaren. */
  tomma: number;
  hinder: Record<SpecHinder, number>;
  skrivna: number;
  kvar: number;
  stoppadAv: "klart" | "tidsbudget" | "fel" | null;
  /** Sidan som stoppade körningen och avvikelsen, som korta koder. */
  fel: { id: string; avvikelser: string[] } | null;
  /** Upp till 50 Wix-id för sidor att rätta (torrt) eller rättade (skarpt). */
  idn: string[];
}

export class SpecFel extends Error {}

const MARGINAL_MS = 30_000;
const OMLASNINGAR = 6;
const OMLASNING_PAUS_MS = 1_500;
const SKRIV_FORSOK = 3;

/** Skriver fliken på en sida och läser tillbaka. Tom lista = rätt. */
async function skrivSida(deps: SpecDeps, rad: ProductMappingRecord, avlasningar: ReadonlyMap<string, Avlasning>): Promise<string[]> {
  const vanta = deps.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  // En annan skrivning på sidan (synkens lager och pris) ger 409. Då läses sidan
  // om och planeras på nytt, högst tre gånger.
  let fore: SpecProdukt | null = null;
  let plan: Extract<SpecPlan, { typ: "ratta" | "byt" }> | null = null;
  let skriven = Number.NaN;
  for (let forsok = 1; ; forsok++) {
    fore = await lasSida(deps.wix, rad.wixProductId);
    if (!fore) return ["sidan gick inte att läsa"];
    const ny = planeraSpec(rad, fore, avlasningar);
    if (ny.typ === "redan_ratt") return [];
    if (ny.typ !== "ratta" && ny.typ !== "byt") {
      return [`planen ändrades: ${ny.typ === "hinder" ? ny.hinder : ny.typ}`];
    }
    plan = ny;
    try {
      const svar = obj(
        await deps.wix("PATCH", `/stores/v3/products/${encodeURIComponent(rad.wixProductId)}`, {
          product: { revision: fore.revision, plainDescription: plan.html },
          fieldMask: { paths: ["plainDescription"] },
        }),
      );
      skriven = Number(obj(svar.product).revision);
      break;
    } catch (e) {
      if (forsok >= SKRIV_FORSOK || !/Wix 409|INVALID_REVISION/.test(felText(e))) throw e;
      await vanta(OMLASNING_PAUS_MS);
    }
  }
  // Wix läsning släpar efter skrivningen: läs om tills revisionen gått fram.
  let efter: SpecProdukt | null = null;
  for (let i = 0; i < OMLASNINGAR; i++) {
    efter = await lasSida(deps.wix, rad.wixProductId);
    if (efter && Number.isFinite(skriven) && Number(efter.revision) >= skriven) break;
    await vanta(OMLASNING_PAUS_MS);
  }
  if (!efter) return ["sidan gick inte att läsa efter skrivningen"];
  if (Number.isFinite(skriven) && Number(efter.revision) < skriven) return ["revisionen gick inte fram"];
  return kontrolleraSpec(fore, efter, plan);
}

export async function korSpec(deps: SpecDeps, val: SpecVal): Promise<SpecSvar> {
  const klocka = deps.klocka ?? Date.now;
  const start = klocka();
  if (!val.dryRun && (val.bekrafta === null || !Number.isInteger(val.bekrafta) || val.bekrafta < 0)) {
    throw new SpecFel("en skarp körning kräver bekrafta = planens antal sidor att rätta");
  }
  const urval = new Set(val.idn ?? []);
  const rader = (await deps.mappningar()).filter(
    (r) => arVevorRad(r) && r.needsAiPolish === true && (urval.size === 0 || urval.has(r.wixProductId)),
  );
  const svar: SpecSvar = {
    dryRun: val.dryRun,
    utkast: rader.length,
    attRatta: 0,
    attByta: 0,
    redanRatt: 0,
    tomma: 0,
    hinder: Object.fromEntries(SPEC_HINDER.map((h) => [h, 0])) as Record<SpecHinder, number>,
    skrivna: 0,
    kvar: 0,
    stoppadAv: null,
    fel: null,
    idn: [],
  };
  const avlasningar = await deps.avlasningar([...new Set(rader.flatMap((r) => r.variants.map((v) => v.supplierVariantId)))]);
  // ☠️ En sida vi inte fick läsa är ett hinder, inte en tom sida.
  let sidor: Map<string, SpecProdukt>;
  try {
    sidor = await lasSidor(deps.wix, rader.map((r) => r.wixProductId));
  } catch (e) {
    console.warn("[vevor-spec] läsningen av sidorna föll:", felText(e).slice(0, 200));
    throw new SpecFel("sidorna gick inte att läsa, se Vercels logg");
  }

  const att: ProductMappingRecord[] = [];
  for (const r of rader) {
    const p = sidor.get(r.wixProductId);
    if (!p) {
      svar.hinder.las_fel++;
      continue;
    }
    const plan = planeraSpec(r, p, avlasningar);
    if (plan.typ === "hinder") svar.hinder[plan.hinder]++;
    else if (plan.typ === "tom") svar.tomma++;
    else if (plan.typ === "redan_ratt") svar.redanRatt++;
    else {
      svar.attRatta++;
      if (plan.typ === "byt") svar.attByta++;
      att.push(r);
    }
  }

  if (val.dryRun) {
    svar.kvar = att.length;
    svar.stoppadAv = "klart";
    svar.idn = att.slice(0, 50).map((r) => r.wixProductId);
    return svar;
  }
  if (att.length > (val.bekrafta ?? 0)) {
    throw new SpecFel(`planen har ${att.length} sidor att rätta, fler än bekrafta (${val.bekrafta}) — kör planen igen`);
  }

  for (const [i, r] of att.entries()) {
    if (klocka() - start > val.budgetMs - MARGINAL_MS) {
      svar.stoppadAv = "tidsbudget";
      svar.kvar = att.length - i;
      return svar;
    }
    let avvikelser: string[];
    try {
      avvikelser = await skrivSida(deps, r, avlasningar);
    } catch (e) {
      console.warn("[vevor-spec] skrivningen föll:", r.wixProductId, felText(e).slice(0, 200));
      avvikelser = ["skrivningen föll"];
    }
    if (avvikelser.length > 0) {
      console.warn(`[vevor-spec] ${r.wixProductId} stoppade körningen: ${avvikelser.join(", ")}`);
      svar.fel = { id: r.wixProductId, avvikelser };
      svar.stoppadAv = "fel";
      svar.kvar = att.length - i;
      return svar;
    }
    svar.skrivna++;
    if (svar.idn.length < 50) svar.idn.push(r.wixProductId);
  }
  svar.stoppadAv = "klart";
  return svar;
}
