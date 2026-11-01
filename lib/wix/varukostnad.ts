// Varukostnaden (`revenueDetails.cost`) på Wix-varianterna, skriven ur mappningens
// `landedCostSek` (punkt 5b, Leonards ja 2026-10-27 till de sex väntande punkterna).
//
// BAKGRUNDEN (lib/wix/produkt-kostnad.ts, FLAGGADE lärdom 220 och 233). En
// variantsInfo-skrivning ersatte varianten och nollade kostnaden när den lästes
// utan MERCHANT_DATA, så 2 633 publicerade produkter saknar kostnaden helt och 331 har
// den på några varianter (mätt 2026-10-24). Det driver bara Wix egen vinst- och
// marginalrapport: husets lönsamhetsöversikt läser mappningens `landedCostSek`.
// Skrivarna är lagade (punkt 5a). Det här är den andra halvan: fyll i det som saknas.
//
// VÄRDET är mappningens `landedCostSek.toFixed(2)`, samma tal importen skriver vid
// skapandet (`costAmount: price.costSek.toFixed(2)`, lib/import/pipeline.ts).
//
// ☠️ BARA AOSOM. Aosom-raderna räknas om var sjätte timme och står kvar i fas med
// leverantörens pris. AliExpress-radernas `landedCostSek` är importtidens tal och
// fryser (CLAUDE.md, *AE-radernas kostnad FRYSER vid importen*): barstolarna
// `a260b888` står på 48,98 USD i mappningen mot 80,07 hos AliExpress idag, så ett
// skrivet tal hade gett Wix en för bra vinstsiffra. Leverantören väljs positivt
// (`isAosomMapping`), aldrig som "allt utom AliExpress".
//
// ☠️ EN BEFINTLIG KOSTNAD SKRIVS ALDRIG ÖVER. Planen tar bara varianter som saknar
// kostnad i Wix. En kostnad som redan står där är ett beslut någon eller något tagit,
// och synken rättar inte den: den här modulen fyller luckor och är ingen
// prisreparation. Skrivningen läser produkten färskt och räknar om vad som saknas,
// så en kostnad som skrivits mellan planen och skrivningen ger `redan_klar`.
//
// ☠️ PRISET OCH ALLT ANNAT RÖRS INTE. Skrivningen är en variantsInfo-PATCH som skickar
// varianterna ordagrant ur produktens egen GET, bara med kostnaden ifylld på de
// varianter som saknar den, och `visible` (produktens, och varje variants egen) och
// `options` med (annars 428 på en flervariantsprodukt, och en variantsInfo-PATCH
// kan publicera ett utkast). Priset hämtas därför aldrig ur planen: ett pris som
// skrevs av prissynken mellan planen och skrivningen hade skrivits över med det
// gamla. Efter skrivningen läses produkten och lagret om och jämförs med läget
// före (`jamforForeEfter`): namn, adress, synlighet, val, variant-id, SKU, pris,
// jämförpris, synlighet, kostnad på varje variant som inte skrevs, och lagret.
// Minsta avvikelse stoppar körningen.
//
// ☠️ EN SKRIVNING MED VAL-ID NOLLSTÄLLER VARIANTENS BILD på en flervariantsprodukt
// (CLAUDE.md, lärdom 204 och 234). `refreshVariantMedia` följer därför efter på varje
// produkt med två eller fler varianter, och en avvikelse därifrån stoppar också.
//
// ☠️ MERCHANT_DATA nekad (403) skriver ingenting. Hela poängen är kostnaden: en
// skrivning som inte kan läsa den hade ersatt varianterna utan den, och det är felet
// som ska bort.
//
// ☠️ SVARET BÄR BARA WIX-ID OCH RÄKNARE. Det hamnar i en publik Actions-logg.

import type { WixAnrop } from "../polish/skrivplan";
import type { ProductMappingRecord } from "../store";
import { isAosomMapping } from "../store/supplier";
import { kostnadAv, likaKostnad, variantsInfoMedKostnad } from "./produkt-kostnad";
import { redigeraFeltext, svepaVarianter } from "./variant-svep";
import {
  VARIANTBILD_FALT,
  jamforForeEfter,
  lasLager,
  lasProdukt,
  lasProduktTillRevision,
  optionerAv,
  refreshVariantMedia,
  varianterAv,
  type VariantbildStatus,
} from "./variant-media";

type Obj = Record<string, unknown>;

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const paus = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// `redigeraFeltext` bor i variant-svep.ts (svepet behöver den), och exporteras här
// som förut: rutten och testerna läser den härifrån.
export { redigeraFeltext };

// ── Katalogens kostnadsläge ──────────────────────────────────────────────

export interface KatalogVariant {
  /** Wix-variantens id. */
  id: string;
  sku: string;
  productId: string;
  /** Produktens synlighet (en dold produkt är ett utkast). */
  synlig: boolean;
  /** Kostnaden som text ("1099.4"), eller null när varianten saknar kostnad. */
  kostnad: string | null;
}

/**
 * Golv: färre varianter än så är en halvläst katalog, inte en liten. Planen läser kostnaden ur den,
 * och en variant som saknas i svepet ser ut som "ingen kostnad" eller "inte i Wix" åt fel håll.
 */
export const MIN_KATALOGVARIANTER = 4000;

/**
 * Varje variant i butiken med sin kostnad, ur Read-Only Variants API (`query-variants`, `MERCHANT_DATA`).
 * Uppmätt 2026-10-24 och 2026-10-28: 1 000 per sida, nio sidor på ungefär femton sekunder, en variant
 * utan kostnad saknar `revenueDetails` helt, och en med den bär `{ cost: { amount }, profit, profitMargin }`.
 * Svepet, taket och omförsöken är `svepaVarianter` (variant-svep.ts). Kastar hellre än returnerar en
 * halv katalog.
 */
export async function lasKatalogVarianter(
  wix: WixAnrop,
  vanta: (ms: number) => Promise<void> = paus,
): Promise<KatalogVariant[]> {
  const rader = await svepaVarianter(wix, { falt: ["MERCHANT_DATA"], golv: MIN_KATALOGVARIANTER, vanta });
  return rader.map((v) => {
    const produkt = obj(v.productData);
    return {
      id: str(v.id),
      sku: str(v.sku),
      productId: str(produkt.productId),
      synlig: produkt.visible !== false,
      kostnad: kostnadAv(v),
    };
  });
}

// ── Planen ──────────────────────────────────────────────────────────────

export interface Raknare {
  /** Alla mappningsrader. */
  mappningar: number;
  /** Aosom-rader utom de pensionerade. */
  aosomMappningar: number;
  /** Pensionerade Aosom-rader (`rejected` eller raderade): hoppas över, deras sida raderas. */
  pensionerade: number;
  /** Mappningsvarianter på de Aosom-raderna. */
  mappningsvarianter: number;
  /** Mappningsvarianten finns inte i Wix (eller sitter på en annan produkt). */
  utanKatalogvariant: number;
  /** Mappningens `landedCostSek` saknas eller är inte ett positivt tal. */
  utanMappningskostnad: number;
  /** Wix har redan en kostnad: rörs aldrig. */
  redanKostnad: number;
  /** Varianter som skulle få en kostnad. */
  attSkriva: number;
  /** Produkter med minst en variant att skriva. */
  produkter: number;
  /** Av dem: dolda utkast. */
  utkast: number;
  /** Av dem: produkter med två eller fler varianter i Wix (variantbilden följs upp). */
  flervariant: number;
}

export interface PlaneradProdukt {
  productId: string;
  synlig: boolean;
  skriv: { variantId: string; kostnad: string }[];
}

export interface Plan {
  produkter: PlaneradProdukt[];
  raknare: Raknare;
}

export interface PlanOpts {
  /** `false` hoppar dolda utkast. Default: de tas med. */
  utkast?: boolean;
  /** Bara de här produkterna (provet). */
  ids?: string[];
}

/** Kostnaden som text, som importen skriver den, eller null när mappningen inte har ett positivt tal. */
export function kostnadsText(landedCostSek: unknown): string | null {
  return typeof landedCostSek === "number" && Number.isFinite(landedCostSek) && landedCostSek > 0
    ? landedCostSek.toFixed(2)
    : null;
}

/**
 * Vad som ska skrivas. Ren funktion: mappningarna och katalogen in, en plan ut.
 *
 * En mappningsvariant matchas på Wix-variantens id, annars på SKU, och bara om varianten sitter på
 * mappningens egen produkt (en SKU som råkar finnas på en annan produkt skriver aldrig hit).
 */
export function planeraVarukostnad(
  mappningar: readonly ProductMappingRecord[],
  katalog: readonly KatalogVariant[],
  opts: PlanOpts = {},
): Plan {
  const medUtkast = opts.utkast !== false;
  const urval = opts.ids?.length ? new Set(opts.ids) : null;
  const perId = new Map<string, KatalogVariant>();
  const perSku = new Map<string, KatalogVariant>();
  const perProdukt = new Map<string, number>();
  for (const k of katalog) {
    perId.set(k.id, k);
    if (k.sku) perSku.set(k.sku, k);
    perProdukt.set(k.productId, (perProdukt.get(k.productId) ?? 0) + 1);
  }

  const r: Raknare = {
    mappningar: mappningar.length,
    aosomMappningar: 0,
    pensionerade: 0,
    mappningsvarianter: 0,
    utanKatalogvariant: 0,
    utanMappningskostnad: 0,
    redanKostnad: 0,
    attSkriva: 0,
    produkter: 0,
    utkast: 0,
    flervariant: 0,
  };
  const grupper = new Map<string, PlaneradProdukt>();
  const sedda = new Set<string>();

  for (const m of mappningar) {
    if (!isAosomMapping(m)) continue;
    if (m.draftStatus === "rejected" || m.wixRaderad) {
      r.pensionerade++;
      continue;
    }
    if (urval && !urval.has(m.wixProductId)) continue;
    r.aosomMappningar++;
    for (const v of m.variants ?? []) {
      r.mappningsvarianter++;
      const k = (v.wixVariantId ? perId.get(v.wixVariantId) : undefined) ?? (v.sku ? perSku.get(v.sku) : undefined);
      if (!k || k.productId !== m.wixProductId) {
        r.utanKatalogvariant++;
        continue;
      }
      const kostnad = kostnadsText(v.landedCostSek);
      if (kostnad === null) {
        r.utanMappningskostnad++;
        continue;
      }
      if (k.kostnad !== null) {
        r.redanKostnad++;
        continue;
      }
      if (!medUtkast && !k.synlig) continue;
      if (sedda.has(k.id)) continue;
      sedda.add(k.id);
      let g = grupper.get(k.productId);
      if (!g) {
        g = { productId: k.productId, synlig: k.synlig, skriv: [] };
        grupper.set(k.productId, g);
      }
      g.skriv.push({ variantId: k.id, kostnad });
      r.attSkriva++;
    }
  }

  const produkter = [...grupper.values()].sort((a, b) => a.productId.localeCompare(b.productId));
  r.produkter = produkter.length;
  for (const p of produkter) {
    if (!p.synlig) r.utkast++;
    if ((perProdukt.get(p.productId) ?? 0) >= 2) r.flervariant++;
  }
  return { produkter, raknare: r };
}

// ── Skrivningen på en produkt ────────────────────────────────────────────

export type KostnadStatus =
  | "skriven" // skriven, läst om, allt utom kostnaden på de skrivna varianterna oförändrat
  | "redan_klar" // inget att skriva: varje variant hade redan en kostnad
  | "torr" // inget skrevs
  | "avvikelse" // skrivningen ändrade något annat, eller kostnaden syns inte efteråt — STOPP
  | "fel"; // läsningen eller skrivningen föll, ingenting ändrat

export interface KostnadUtfall {
  productId: string;
  status: KostnadStatus;
  /** Varianter som fick (eller torrt: skulle få) en kostnad. */
  skrivna: number;
  /** Önskade varianter som redan hade en kostnad och inte rördes. */
  redanKostnad: number;
  /** Önskade varianter som inte finns på produkten. */
  saknas: number;
  /** Bara på en produkt med två eller fler varianter: vad uppföljningen av variantbilden blev. */
  variantbild?: VariantbildStatus;
  avvikelser?: string[];
  fel?: string;
  visible?: boolean;
}

export interface SkrivOpts {
  torr?: boolean;
  vanta?: (ms: number) => Promise<void>;
  /** Omläsningar medan Wix läsning släpar efter skrivningen. */
  omlasningar?: number;
  /** Byts bara i tester. Default: `refreshVariantMedia`. */
  foljUpVariantbild?: (productId: string, minRevision: number) => Promise<{ status: VariantbildStatus; avvikelser?: string[] }>;
}

const OMLASNING_PAUS_MS = 1500;

/** Kostnaden som ett tal i varje variant, så att "1099.40" och "1099.4" är samma sak i jämförelsen före och efter. */
function medTalKostnad(p: Obj): Obj {
  const ut = structuredClone(p) as Obj;
  for (const v of varianterAv(ut)) {
    const k = obj(obj(v.revenueDetails).cost);
    if (typeof k.amount === "string" || typeof k.amount === "number") {
      const n = Number(k.amount);
      if (Number.isFinite(n)) k.amount = String(n);
    }
  }
  return ut;
}

/**
 * Skriver kostnaden på de varianter som saknar den, på en produkt, och läser tillbaka.
 *
 * `onskad` är variant-id → kostnad som text. Kastar aldrig: ett fel blir `fel` (ingenting ändrat) eller,
 * efter en skrivning, `avvikelse` (vi vet inte vad Wix har), så att en anropare som skriver många
 * produkter stannar.
 */
export async function skrivVarukostnad(
  wix: WixAnrop,
  productId: string,
  onskad: ReadonlyMap<string, string>,
  opts: SkrivOpts = {},
): Promise<KostnadUtfall> {
  const vanta = opts.vanta ?? paus;
  const utfall = (status: KostnadStatus, rest: Partial<KostnadUtfall> = {}): KostnadUtfall => ({
    productId,
    status,
    skrivna: 0,
    redanKostnad: 0,
    saknas: 0,
    ...rest,
  });
  let skrivet = false;
  try {
    let fore: Obj | null;
    try {
      fore = await lasProdukt(wix, productId, VARIANTBILD_FALT);
    } catch (e) {
      const t = String((e as Error)?.message ?? e);
      if (/Wix 403|NO_PERMISSION_TO_READ_MERCHANT_DATA/i.test(t)) {
        return utfall("fel", { fel: "nyckeln får inte läsa varukostnaden (MERCHANT_DATA, 403) — ingenting skrevs" });
      }
      throw e;
    }
    if (!fore) return utfall("fel", { fel: "produkten gick inte att läsa" });
    const visible = fore.visible !== false;
    const varianter = varianterAv(fore);

    const att = new Map<string, string>();
    let redan = 0;
    let saknas = 0;
    for (const [id, kostnad] of onskad) {
      const v = varianter.find((x) => str(x.id) === id);
      if (!v) saknas++;
      else if (kostnadAv(v) !== null) redan++;
      else att.set(id, kostnad);
    }
    const bas = { skrivna: att.size, redanKostnad: redan, saknas, visible };
    if (att.size === 0) return utfall("redan_klar", bas);
    if (opts.torr) return utfall("torr", bas);

    // Det som ska stå efter skrivningen: läget före med kostnaden ifylld.
    const ny = structuredClone(fore) as Obj;
    for (const v of varianterAv(ny)) {
      const kostnad = att.get(str(v.id));
      if (kostnad !== undefined) v.revenueDetails = { cost: { amount: kostnad } };
    }
    const forvantad = ny;
    // `profit` och `profitMargin` räknas av Wix och är skrivskyddade: bara kostnaden går tillbaka.
    const variants = (variantsInfoMedKostnad(obj(ny.variantsInfo)).variants ?? []) as unknown[];
    const harOptions = optionerAv(ny).length > 0;
    const bevaraSynlighet = typeof fore.visible === "boolean";
    const body = {
      product: {
        revision: fore.revision,
        variantsInfo: { variants },
        ...(bevaraSynlighet ? { visible: fore.visible } : {}),
        ...(harOptions ? { options: ny.options } : {}),
      },
      fieldMask: {
        paths: ["variantsInfo", ...(bevaraSynlighet ? ["visible"] : []), ...(harOptions ? ["options"] : [])],
      },
    };

    const lagerFore = await lasLager(wix, productId);
    const svar = obj(await wix("PATCH", `/stores/v3/products/${encodeURIComponent(productId)}`, body));
    skrivet = true;

    // ☠️ Läsningen släpar efter skrivningen: läs om tills revisionen gått fram.
    const patchRev = Number(obj(svar.product).revision);
    const minRevision = Number.isFinite(patchRev) ? patchRev : Number(fore.revision) + 1;
    const efter = await lasProduktTillRevision(
      wix,
      productId,
      VARIANTBILD_FALT,
      minRevision,
      vanta,
      Math.max(1, opts.omlasningar ?? 5),
    );
    if (!efter) return utfall("avvikelse", { ...bas, avvikelser: ["produkten gick inte att läsa efter skrivningen"] });
    const lagerEfter = await lasLager(wix, productId);

    const avvikelser = jamforForeEfter(
      { produkt: medTalKostnad(forvantad), lager: lagerFore },
      { produkt: medTalKostnad(efter), lager: lagerEfter },
    );
    for (const [id, kostnad] of att) {
      const v = varianterAv(efter).find((x) => str(x.id) === id);
      if (!v) avvikelser.push(`variant ${id.slice(0, 8)}: finns inte efter skrivningen`);
      else if (!likaKostnad(kostnadAv(v), kostnad)) avvikelser.push(`variant ${id.slice(0, 8)}: kostnaden syns inte efter skrivningen`);
    }
    if (Number(efter.revision) <= Number(fore.revision)) avvikelser.push("revisionen gick inte fram, skrivningen syns inte");
    if (avvikelser.length > 0) {
      console.error(`[varukostnad] ${productId}: AVVIKELSE efter skrivningen — ${avvikelser.join("; ")}`);
      return utfall("avvikelse", { ...bas, avvikelser });
    }

    // ☠️ En skrivning med val-id nollställer variantens bild: rätta den, och stanna om rättningen avviker.
    let variantbild: VariantbildStatus | undefined;
    if (varianterAv(efter).length >= 2) {
      const foljUp = opts.foljUpVariantbild
        ?? (async (id: string, rev: number) => {
          const u = await refreshVariantMedia(wix, id, { minRevision: rev, vanta });
          return { status: u.status, avvikelser: u.avvikelser };
        });
      const u = await foljUp(productId, Number(efter.revision));
      variantbild = u.status;
      if (u.status === "avvikelse") {
        console.error(`[varukostnad] ${productId}: variantbilden avvek efter kostnaden — ${(u.avvikelser ?? []).join("; ")}`);
        return utfall("avvikelse", { ...bas, variantbild, avvikelser: u.avvikelser ?? ["variantbilden avvek"] });
      }
      if (u.status === "fel" || u.status === "ej_rattad") {
        console.warn(`[varukostnad] ${productId}: variantbild ${u.status} efter kostnaden`);
      }
    }
    return utfall("skriven", { ...bas, ...(variantbild ? { variantbild } : {}) });
  } catch (e) {
    const fel = redigeraFeltext(String((e as Error)?.message ?? e)).slice(0, 300);
    // Föll kontrollen EFTER en skrivning vet vi inte vad Wix har: en avvikelse, så att körningen stannar.
    if (skrivet) {
      console.error(`[varukostnad] ${productId}: kontrollen efter skrivningen föll — ${fel}`);
      return utfall("avvikelse", { avvikelser: [`kontrollen efter skrivningen föll: ${fel}`], fel });
    }
    console.warn(`[varukostnad] ${productId}: ${fel}`);
    return utfall("fel", { fel });
  }
}

// ── Svepet ───────────────────────────────────────────────────────────────

export class BekraftaFel extends Error {}

export interface KorOpts {
  /** Default: torrt. */
  torr?: boolean;
  /** `false` hoppar dolda utkast. Default: de tas med. */
  utkast?: boolean;
  /** Bara de här produkterna (provet). Godkännandet `bekrafta` gäller då antalet av dem. */
  ids?: string[];
  /** Fortsätt efter den här produkten (`nasta` ur förra körningen). Sorterat på id. */
  efter?: string;
  /** Högst så många produkter skrivs den här körningen. */
  limit?: number;
  /** Tidpunkt (ms) då inga nya produkter påbörjas. */
  deadline: number;
  /**
   * Första varvet: planens exakta antal produkter. Det är kvitteringen på att en människa läst planen
   * (en id-lista på tusen rader vore teater). Räknas på hela planen, före `efter` och `limit`.
   */
  bekrafta?: string;
  /**
   * Följande varv: ett tak. Planen får vara lika stor eller MINDRE (en produkt som blivit klar syns inte
   * längre) men aldrig större. Godkänns mot det som återstod efter förra varvet.
   */
  hogst?: number;
  vanta?: (ms: number) => Promise<void>;
  skriv?: typeof skrivVarukostnad;
}

export interface KorProdukt {
  id: string;
  status: KostnadStatus;
  skrivna: number;
  redanKostnad?: number;
  saknas?: number;
  variantbild?: VariantbildStatus;
  avvikelser?: string[];
  felText?: string;
}

export interface KorRapport {
  torr: boolean;
  utkast: boolean;
  plan: Raknare;
  /** Produkter i hela planen, före `efter` och `limit`. */
  totalt: number;
  /** Produkter som behandlades (skrevs eller kontrollerades) den här körningen. */
  behandlade: number;
  skrivna: number;
  /** Varianter som fick en kostnad. */
  varianterSkrivna: number;
  redanKlara: number;
  fel: number;
  avvikelser: number;
  /** `efter` för nästa körning: den sista produkten som behandlades, annars samma som den här körningen fick. */
  nasta: string;
  /** Produkter i planen som den här körningen inte hann till (efter `nasta`). */
  ejNadda: number;
  /**
   * Produkter som fortfarande saknar kostnad efter körningen: planens antal minus de som blev skrivna
   * eller redan var klara. Är det följande varvets `hogst`. Produkter som föll (`fel`) ingår: de saknar
   * fortfarande kostnaden.
   */
  aterstod: number;
  /** Planen är genomgången utan stopp (en produkt som föll räknas som genomgången: se `fel` och `aterstod`). */
  fullstandig: boolean;
  stoppad: boolean;
  stoppadAv?: "avvikelse" | "fel_i_foljd" | "tidsbudget";
  /** Skrivna och bara problemen skrivs ut: en lyckad skrivning är en rad per produkt i en publik logg. */
  produkter: KorProdukt[];
  /** Torrt: de första produkterna som skulle skrivas, bara id. */
  forsta?: string[];
}

/** Så många fel i följd stoppar svepet: ett 403 på MERCHANT_DATA eller en fallen Wix-läsning fäller varje produkt. */
export const MAX_FEL_I_FOLJD = 5;
const MAX_UTSKRIVNA = 200;
const PAUS_MELLAN_PRODUKTER_MS = 100;

export async function korVarukostnad(
  wix: WixAnrop,
  mappningar: readonly ProductMappingRecord[],
  katalog: readonly KatalogVariant[],
  opts: KorOpts,
): Promise<KorRapport> {
  const torr = opts.torr !== false;
  const utkast = opts.utkast !== false;
  const vanta = opts.vanta ?? paus;
  const skriv = opts.skriv ?? skrivVarukostnad;

  const plan = planeraVarukostnad(mappningar, katalog, { utkast, ids: opts.ids });
  const totalt = plan.produkter.length;

  if (!torr) {
    if (opts.hogst !== undefined) {
      if (opts.bekrafta !== undefined) throw new BekraftaFel("ange antingen bekrafta eller hogst, inte båda");
      if (!Number.isInteger(opts.hogst) || opts.hogst < 0) {
        throw new BekraftaFel(`hogst måste vara ett heltal, noll eller större — fick ${opts.hogst}`);
      }
      if (totalt > opts.hogst) {
        throw new BekraftaFel(
          `planen har ${totalt} produkter, fler än de ${opts.hogst} som återstod efter förra varvet — något har fått en lucka under körningen`,
        );
      }
    } else if ((opts.bekrafta ?? "").trim() !== String(totalt)) {
      throw new BekraftaFel(`bekrafta måste vara torrkörningens antal produkter (${totalt}), fick "${opts.bekrafta ?? ""}"`);
    }
  }

  const efter = opts.efter ?? "";
  const kvar = plan.produkter.filter((p) => p.productId > efter);
  const rapport: KorRapport = {
    torr,
    utkast,
    plan: plan.raknare,
    totalt,
    behandlade: 0,
    skrivna: 0,
    varianterSkrivna: 0,
    redanKlara: 0,
    fel: 0,
    avvikelser: 0,
    nasta: opts.efter ?? "",
    ejNadda: kvar.length,
    aterstod: totalt,
    fullstandig: false,
    stoppad: false,
    produkter: [],
  };

  if (torr) {
    rapport.forsta = kvar.slice(0, 50).map((p) => p.productId);
    rapport.fullstandig = true;
    rapport.ejNadda = 0;
    return rapport;
  }

  const gransSkrivna = opts.limit && opts.limit > 0 ? opts.limit : Infinity;
  let felIFoljd = 0;
  let sista: string | null = null;
  let tillfalle = 0;
  for (const p of kvar) {
    if (rapport.skrivna >= gransSkrivna) break;
    if (Date.now() > opts.deadline) {
      rapport.stoppad = true;
      rapport.stoppadAv = "tidsbudget";
      break;
    }
    if (tillfalle++ > 0) await vanta(PAUS_MELLAN_PRODUKTER_MS);
    const u = await skriv(wix, p.productId, new Map(p.skriv.map((s) => [s.variantId, s.kostnad])), { vanta });
    sista = p.productId;
    rapport.behandlade++;
    if (u.status === "skriven") {
      rapport.skrivna++;
      rapport.varianterSkrivna += u.skrivna;
      felIFoljd = 0;
    } else if (u.status === "redan_klar") {
      rapport.redanKlara++;
      felIFoljd = 0;
    } else if (u.status === "fel") {
      rapport.fel++;
      felIFoljd++;
    } else if (u.status === "avvikelse") {
      rapport.avvikelser++;
    }
    // Bara det som inte gick rent skrivs ut.
    if (u.status !== "skriven" && u.status !== "redan_klar" || u.variantbild === "fel" || u.variantbild === "ej_rattad") {
      if (rapport.produkter.length < MAX_UTSKRIVNA) {
        rapport.produkter.push({
          id: p.productId,
          status: u.status,
          skrivna: u.skrivna,
          ...(u.redanKostnad ? { redanKostnad: u.redanKostnad } : {}),
          ...(u.saknas ? { saknas: u.saknas } : {}),
          ...(u.variantbild ? { variantbild: u.variantbild } : {}),
          ...(u.avvikelser ? { avvikelser: u.avvikelser } : {}),
          ...(u.fel ? { felText: u.fel } : {}),
        });
      }
    }
    if (u.status === "avvikelse") {
      rapport.stoppad = true;
      rapport.stoppadAv = "avvikelse";
      break;
    }
    if (felIFoljd >= MAX_FEL_I_FOLJD) {
      rapport.stoppad = true;
      rapport.stoppadAv = "fel_i_foljd";
      break;
    }
  }

  // Nästa varv börjar efter den sista produkten som behandlades, så att en produkt som alltid faller
  // inte ligger först i varje skiva.
  if (sista !== null) rapport.nasta = sista;
  rapport.ejNadda = sista === null ? kvar.length : kvar.filter((p) => p.productId > (sista as string)).length;
  rapport.aterstod = totalt - rapport.skrivna - rapport.redanKlara;
  rapport.fullstandig = !rapport.stoppad && rapport.ejNadda === 0;
  return rapport;
}
