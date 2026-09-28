// Kollapsar en flervariantssida till EN variant inför ommappningen till Aosom.
//
// VARFÖR MODULEN FINNS. Ommappningen vägrar sidor med flera varianter
// (`flera_varianter` i remap.ts), eftersom en Aosom-rad är EN artikel. En äldre
// AliExpress-sida buntar ofta färger, och ibland finns bara en av dem som
// Aosom-utkast. Reservtaket fc5e7fde (2026-09-28) sålde orange, ljusgrått och
// grönt, och bara det gröna fanns som utkast. Leonards beslut samma dag:
// "radera aliexpress varianter som inte finns och behåll den som finns hos
// aosom". Det är samma regel som docs/polish/varianter.md redan har för
// AliExpress-sidor: en variant leverantören inte har tas bort, och blir bara
// en kvar kollapsas optionen till en produkt utan val.
//
// Modulen gör bara kollapsen, i Wix och på mappningsraden. Själva ommappningen
// görs av remap.ts, oförändrad, på den kollapsade raden.
//
// ☠️ VARIANTEN TAS UR PRODUKTENS EGEN GET, DEN BYGGS INTE FÖR HAND. Den behållna
// varianten skickas tillbaka med samma `id` och tomma `choices`. Då behåller den
// sitt variant-id och sin lagerpost (uppmätt 2026-08-23 på kabelskalaren
// 4f38a11c, varianter.md). Ett handbyggt objekt tappar tyst varje fält man inte
// tänkt på, och `visible` är det dyraste (31 oköpbara sidor 2026-09-06).
//
// ☠️ BILDERNA RÖRS INTE. Galleriet kan fortfarande visa de borttagna färgerna,
// men vilka foton som ska bort avgörs av vad de visar, och det är en människas
// bedömning. Planen listar bilderna som var kopplade till ett borttaget val.
// Efter kollapsen har sidan en variant, så skrivworkflowen klarar den, eller
// så slås den ihop med en Aosom-sida och avpubliceras.

import type { ProductMappingRecord } from "../store";
import type { WixAnrop } from "../polish/skrivplan";

type Obj = Record<string, unknown>;

/** Projektionen som bär valens namn på varianterna. */
export const KOLLAPS_FALT = "fields=VARIANT_OPTION_CHOICE_NAMES";

export type KollapsHinder =
  | "produkten_saknas"
  | "varianten_saknas_i_wix"
  | "oppna_ordrar";

export interface KollapsBorttagen {
  wixVariantId: string;
  /** Valens namn, t.ex. ["Orange"]. De står redan på sidan. */
  val: string[];
}

/** Planen — det som går till svaret, alltså till en publik logg. */
export interface KollapsPlan {
  behallVariant: string;
  /** Den behållna variantens val, t.ex. ["Grön"]. Tomt när Wix redan är kollapsad. */
  behallVal: string[];
  /** Wix-varianterna som försvinner. */
  borttagna: KollapsBorttagen[];
  /** Hur många av mappningsradens varianter som försvinner. */
  mappningsvarianterBort: number;
  /** Galleribilder (Wix-media-id) som var kopplade till ett borttaget val och inget behållet. */
  bilderMedBorttagnaVal: string[];
  /** Wix är redan kollapsad till varianten, alltså en omkörning efter ett fel. */
  wixKlar: boolean;
  /** Obehandlade ordrar på sidan. */
  oppnaOrdrar: number;
  hinder: KollapsHinder[];
}

export function produktAv(svar: unknown): Obj | null {
  const p = ((svar ?? {}) as Obj).product;
  return p && typeof p === "object" ? (p as Obj) : null;
}

function varianterAv(p: Obj): Obj[] {
  const v = ((p.variantsInfo as Obj | undefined)?.variants ?? []) as unknown;
  return Array.isArray(v) ? (v as Obj[]) : [];
}

function optionerAv(p: Obj): Obj[] {
  return Array.isArray(p.options) ? (p.options as Obj[]) : [];
}

/** Variantens val som "Option|Val", t.ex. "Färg|Grön". */
function valnycklar(v: Obj): string[] {
  const val = Array.isArray(v.choices) ? (v.choices as Obj[]) : [];
  return val
    .map((c) => (c.optionChoiceNames ?? {}) as Obj)
    .filter((n) => typeof n.choiceName === "string")
    .map((n) => `${String(n.optionName ?? "")}|${String(n.choiceName)}`);
}

const valnamn = (v: Obj): string[] => valnycklar(v).map((k) => k.slice(k.indexOf("|") + 1));

function prisAv(v: Obj): number | null {
  const n = Number(((v.price as Obj | undefined)?.actualPrice as Obj | undefined)?.amount);
  return Number.isFinite(n) ? n : null;
}

/** Har produkten bara den behållna varianten och inga val? */
export function arKollapsad(p: Obj, behallVariant: string): boolean {
  const v = varianterAv(p);
  return optionerAv(p).length === 0 && v.length === 1 && v[0].id === behallVariant;
}

/** Planerar kollapsen utan att röra något. */
export function planeraKollaps(input: {
  produkt: Obj | null;
  mappning: Pick<ProductMappingRecord, "variants"> | null | undefined;
  behallVariant: string;
  oppnaOrdrar: number;
}): KollapsPlan {
  const { produkt, behallVariant } = input;
  const plan: KollapsPlan = {
    behallVariant,
    behallVal: [],
    borttagna: [],
    mappningsvarianterBort: (input.mappning?.variants ?? [])
      .filter((v) => v.wixVariantId !== behallVariant).length,
    bilderMedBorttagnaVal: [],
    wixKlar: false,
    oppnaOrdrar: input.oppnaOrdrar,
    hinder: [],
  };

  // ☠️ EN OBEHANDLAD ORDER PÅ EN BORTTAGEN FÄRG HADE BESTÄLLTS I FEL FÄRG.
  // Efter ommappningen läser beställningsfilen radens artikel, och raden har
  // bara den behållna artikeln kvar. En orange order hade alltså gått till
  // Aosom som grön. Samma spärr som sammanslagningens
  // `givaren_har_oppna_ordrar`, och den gäller även en omkörning.
  if (input.oppnaOrdrar > 0) plan.hinder.push("oppna_ordrar");

  if (!produkt) {
    plan.hinder.push("produkten_saknas");
    return plan;
  }

  plan.wixKlar = arKollapsad(produkt, behallVariant);
  const varianter = varianterAv(produkt);
  const kvar = varianter.find((v) => v.id === behallVariant);
  if (!kvar) {
    plan.hinder.push("varianten_saknas_i_wix");
    return plan;
  }
  plan.behallVal = valnamn(kvar);
  plan.borttagna = varianter
    .filter((v) => v !== kvar)
    .map((v) => ({ wixVariantId: String(v.id ?? ""), val: valnamn(v) }));

  const behallna = new Set(valnycklar(kvar));
  const borttagnaVal = new Set(
    varianter.filter((v) => v !== kvar).flatMap(valnycklar).filter((k) => !behallna.has(k)),
  );
  const bilder = new Set<string>();
  for (const o of optionerAv(produkt)) {
    const val = (((o.choicesSettings as Obj | undefined)?.choices ?? []) as Obj[]);
    for (const c of val) {
      if (!borttagnaVal.has(`${String(o.name ?? "")}|${String(c.name ?? "")}`)) continue;
      for (const m of (Array.isArray(c.linkedMedia) ? (c.linkedMedia as Obj[]) : [])) {
        if (typeof m.id === "string") bilder.add(m.id);
      }
    }
  }
  plan.bilderMedBorttagnaVal = [...bilder];
  return plan;
}

/**
 * Mappningsraden med bara den behållna varianten, utan val.
 *
 * ☠️ MATCHAR PÅ `wixVariantId`, ALDRIG PÅ POSITION ELLER `sku`. Två fält heter
 * `sku` och betyder olika saker, och positionen är ingen identitet
 * (varianter.md, följdsteg 2).
 */
export function kollapsaMappning(m: ProductMappingRecord, behallVariant: string): ProductMappingRecord {
  const kvar = (m.variants ?? []).filter((v) => v.wixVariantId === behallVariant);
  if (kvar.length !== 1) {
    throw new Error(`mappningsraden har ${kvar.length} varianter med det id:t, inte en`);
  }
  return { ...m, variants: [{ ...kvar[0], choices: {} }] };
}

export interface KollapsUtfall {
  ok: boolean;
  /** Vad återläsningen hittade som inte stämde. Tomt när `ok`. */
  skal: string[];
  steg: string[];
}

interface Fore {
  sku: unknown;
  pris: number | null;
  synlig: unknown;
  variantSynlig: unknown;
}

function kontrollera(p: Obj | null, behallVariant: string, fore: Fore): string[] {
  if (!p) return ["produkten gick inte att läsa"];
  const skal: string[] = [];
  if (optionerAv(p).length > 0) skal.push("valen finns kvar");
  const varianter = varianterAv(p);
  if (varianter.length !== 1) skal.push(`produkten har ${varianter.length} varianter, inte en`);
  const v = varianter.find((x) => x.id === behallVariant);
  if (!v) return [...skal, "den behållna varianten saknas"];
  if (valnycklar(v).length > 0) skal.push("varianten bär fortfarande ett val");
  if (v.sku !== fore.sku) skal.push("variantens SKU har ändrats");
  if (fore.pris !== null && prisAv(v) !== fore.pris) skal.push("variantens pris har ändrats");
  if (typeof fore.synlig === "boolean" && p.visible !== fore.synlig) skal.push("produktens synlighet har ändrats");
  if (v.visible !== fore.variantSynlig) skal.push("variantens synlighet har ändrats");
  return skal;
}

/**
 * Kollapsar Wix-produkten till den behållna varianten och läser tillbaka.
 *
 * Mappningen skrivs INTE här. Anroparen skriver den först när `ok` är sant,
 * och en omkörning ser att Wix redan är klar (`arKollapsad`) och gör bara
 * mappningen.
 */
export async function kollapsaWix(
  wix: WixAnrop,
  productId: string,
  behallVariant: string,
  opts: { kostnadSek?: number; vanta?: (ms: number) => Promise<void>; forsok?: number } = {},
): Promise<KollapsUtfall> {
  const vanta = opts.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const vag = `/stores/v3/products/${encodeURIComponent(productId)}`;
  const las = async () => produktAv(await wix("GET", `${vag}?${KOLLAPS_FALT}`));

  const p = await las();
  if (!p) return { ok: false, skal: ["produkten gick inte att läsa"], steg: [] };
  if (arKollapsad(p, behallVariant)) return { ok: true, skal: [], steg: ["wix redan kollapsad"] };
  const kvar = varianterAv(p).find((v) => v.id === behallVariant);
  if (!kvar) return { ok: false, skal: ["den behållna varianten saknas i Wix"], steg: [] };

  const fore: Fore = { sku: kvar.sku, pris: prisAv(kvar), synlig: p.visible, variantSynlig: kvar.visible };
  const variant: Obj = { ...kvar, choices: [] };
  // Varukostnaden ur ommappningen: samma tal som mappningen får. En
  // variantsInfo-PATCH ersätter varianten, och ett utelämnat fält kan nollas.
  if (typeof opts.kostnadSek === "number" && Number.isFinite(opts.kostnadSek) && opts.kostnadSek > 0) {
    variant.revenueDetails = { cost: { amount: opts.kostnadSek.toFixed(2) } };
  }
  // ☠️ `visible` SKICKAS TILLBAKA OFÖRÄNDRAD. En variantsInfo-PATCH publicerar
  // annars ett utkast, och kollapsen flippar `visible` till true
  // (varianter.md). Saknas fältet utelämnas det hellre än gissas.
  const bevaraSynlighet = typeof p.visible === "boolean";
  await wix("PATCH", vag, {
    product: {
      revision: p.revision,
      ...(bevaraSynlighet ? { visible: p.visible } : {}),
      options: [],
      variantsInfo: { variants: [variant] },
    },
    fieldMask: { paths: ["options", "variantsInfo", ...(bevaraSynlighet ? ["visible"] : [])] },
  });

  // ☠️ LÄS TILLBAKA, OCH VÄNTA UT SLÄPET. En läsning direkt efter en PATCH kan
  // visa produkten som den var före (CLAUDE.md, "PRODUKTläsningen släpar").
  // Ett falskt nej här är ofarligt, för mappningen skrivs bara vid ja, och en
  // omkörning ser att Wix är klar.
  const forsok = Math.max(1, opts.forsok ?? 4);
  let skal: string[] = [];
  for (let i = 0; i < forsok; i++) {
    if (i > 0) await vanta(1500);
    skal = kontrollera(await las(), behallVariant, fore);
    if (skal.length === 0) return { ok: true, skal: [], steg: ["wix kollapsad"] };
  }
  return { ok: false, skal, steg: ["wix patchad"] };
}
